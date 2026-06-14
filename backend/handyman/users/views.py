from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.authentication import BaseAuthentication

from django.contrib.auth import authenticate, get_user_model
from .serializers import UserSerializer, SignUpSerializer, UserUpdateSerializer
from axes.handlers.proxy import AxesProxyHandler
from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from .models import PasswordResetOTP
from handymen.models import Handyman


from datetime import timedelta
from django.utils import timezone
from axes.models import AccessAttempt


FAILURE_LIMIT = 5
COOLOFF_HOURS = 1
User = get_user_model()


class NoAuthentication(BaseAuthentication):
    def authenticate(self, request):
        return None  # always anonymous — let permissions decide


def _lockout_info(username: str) -> tuple[int, bool, int]:
    """Return (failures, is_locked, minutes_remaining) for *username*."""
    attempt = (
        AccessAttempt.objects
        .filter(username=username)
        .order_by("-attempt_time")
        .first()
    )
    if not attempt:
        return 0, False, 0

    failures = attempt.failures_since_start
    locked = failures >= FAILURE_LIMIT
    mins = 0
    if locked:
        unlock_at = attempt.attempt_time + timedelta(hours=COOLOFF_HOURS)
        mins = max(1, int((unlock_at - timezone.now()).total_seconds() / 60))
    return failures, locked, mins


def get_auth_for_user(user, request=None):
    tokens = RefreshToken.for_user(user)
    tokens['user_type'] = 'client'
    return {
        # ✅ Pass request into context so thumbnail URL is absolute
        'user': UserSerializer(user, context={'request': request}).data,
        'tokens': {
            'access': str(tokens.access_token),
            'refresh': str(tokens),
        }
    }


# users/views.py

class SignInView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [NoAuthentication]   # public endpoint

    def post(self, request):
        username_or_email = request.data.get('username', '').strip().lower()
        password = request.data.get('password', '')

        if not username_or_email or not password:
            return Response(
                {'detail': 'Username/Email and password are required.'},
                status=400
            )

        # Resolve username from email if necessary
        username = username_or_email
        if '@' in username_or_email:
            try:
                user = User.objects.get(email=username_or_email)
                username = user.username
            except User.DoesNotExist:
                # User not found by email, authenticate will fail later
                pass

        # ── Check lockout BEFORE attempting auth ─────────
        is_locked = AxesProxyHandler.is_locked(
            request,
            credentials={'username': username}
        )
        if is_locked:
            try:
                attempt = (AccessAttempt.objects
                           .filter(username=username)
                           .order_by('-attempt_time')
                           .first())
                cooloff = settings.AXES_COOLOFF_TIME
                unlock_at = attempt.attempt_time + cooloff
                remaining = unlock_at - timezone.now()
                mins = max(int(remaining.total_seconds() / 60), 1)
                msg = f'Account locked. Try again in {mins} minute(s).'
            except Exception:
                msg = 'Account locked. Too many failed attempts.'
            return Response({'detail': msg}, status=429)

        # ── Try to authenticate ──────────────────────────
        user = authenticate(
            request=request, username=username, password=password)

        if not user:
            # ── Read failure count AFTER authenticate()
            try:
                attempt = (AccessAttempt.objects
                           .filter(username=username)
                           .order_by('-attempt_time')
                           .first())
                failures = attempt.failures_since_start if attempt else 1
                limit = settings.AXES_FAILURE_LIMIT
                remaining = max(limit - failures, 0)

                if remaining == 0:
                    msg = 'Account locked. Too many failed attempts.'
                    return Response({'detail': msg}, status=429)
                else:
                    msg = f'Invalid credentials. {remaining} attempt(s) remaining.'
            except Exception:
                msg = 'Invalid username or password.'

            return Response({'detail': msg}, status=401)

        # ── Success ──────────────────────────────────────
        user.mark_online()
        return Response(get_auth_for_user(user, request), status=200)


class SignUpView(APIView):
    permission_classes = [AllowAny]
    # ✅ Required for image upload
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    # authentication_classes = [NoAuthentication]
    # print(f"post start")

    def post(self, request):
        print(f"post start")

        new_user = SignUpSerializer(data=request.data)
        new_user.is_valid(raise_exception=True)
        user = new_user.save()
        print(f"post initialized")

        # ✅ Pass request
        user_data = get_auth_for_user(user, request)
        return Response(user_data)


class UserUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def patch(self, request):
        serializer = UserUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user, context={'request': request}).data)


class MarkOnlineView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.mark_online()
        return Response({'status': 'online'})


class MarkOfflineView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.mark_offline()
        return Response({'status': 'offline'})

class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email: return Response({'detail': 'Email required'}, status=400)
        
        email = email.strip().lower()
        print(f"[DEBUG] PasswordReset for email: '{email}'")

        # Check users
        user_matches = User.objects.filter(email__iexact=email)
        # Check handymen
        handyman_matches = Handyman.objects.filter(email__iexact=email)

        print(f"[DEBUG] Found {user_matches.count()} users matching email.")
        print(f"[DEBUG] Found {handyman_matches.count()} handymen matching email.")
        
        if user_matches.exists():
            print(f"[DEBUG] Email '{email}' found in Users.")
        elif handyman_matches.exists():
            print(f"[DEBUG] Email '{email}' found in Handymen.")
        else:
            print(f"[DEBUG] Email '{email}' NOT found in DB.")
            return Response({'detail': 'This email does not exist.'}, status=404)
        
        # Determine which one exists to create the OTP for
        target_email = email 
        
        otp = PasswordResetOTP.objects.create(email=target_email)
        
        send_mail(
            'Password Reset OTP',
            f'Your OTP code is {otp.otp_code}. It expires in 5 minutes.',
            settings.DEFAULT_FROM_EMAIL,
            [target_email],
            fail_silently=False,
            html_message=f"""
                <div style="font-family: Arial, sans-serif; text-align: center;">
                    <h2 style="color: #6366F1;">Password Reset</h2>
                    <p>Your OTP code is:</p>
                    <h1 style="color: #6366F1; font-size: 32px;">{otp.otp_code}</h1>
                    <p>It expires in 5 minutes.</p>
                </div>
            """
        )
        return Response({'detail': 'OTP sent'})

class PasswordResetVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('otp_code')
        otp = PasswordResetOTP.objects.filter(email=email, otp_code=code).last()
        
        if not otp or otp.is_expired():
            return Response({'detail': 'Invalid or expired OTP'}, status=400)
        return Response({'detail': 'Verified'})

class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('otp_code')
        password = request.data.get('password')
        
        otp = PasswordResetOTP.objects.filter(email=email, otp_code=code).last()
        if not otp or otp.is_expired():
            return Response({'detail': 'Invalid or expired OTP'}, status=400)
            
        user = User.objects.filter(email=email).first()
        if user:
            user.set_password(password)
            user.save()
        else:
            handyman = Handyman.objects.filter(email=email).first()
            if handyman:
                handyman.set_password(password)
                handyman.save()
            else:
                return Response({'detail': 'User not found'}, status=404)
        
        otp.delete()
        return Response({'detail': 'Password updated'})
