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
from django.core.mail import send_mail, get_connection
from django.core.mail.backends.console import EmailBackend as ConsoleEmailBackend
from django.utils import timezone
from .models import PasswordResetOTP
from handymen.models import Handyman
import logging

logger = logging.getLogger(__name__)


from datetime import timedelta
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_exempt
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
        # Check if user exists and is active first
        try:
            user = User.objects.get(username=username)
            if not user.is_active:
                return Response(
                    {'detail': 'You cannot login anymore. Please contact the administrator.'},
                    status=403
                )
        except User.DoesNotExist:
            # User doesn't exist, will be handled by authenticate()
            pass

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

def _get_client_ip(request):
    """Extract client IP address from request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def _get_user_agent(request):
    """Extract user agent from request."""
    return request.META.get('HTTP_USER_AGENT', '')[:500]  # Limit length


def _check_rate_limit(email):
    """
    Check if rate limit exceeded for OTP requests.
    Max 3 OTPs per hour per email.
    """
    one_hour_ago = timezone.now() - timedelta(hours=1)
    recent_otps = PasswordResetOTP.objects.filter(
        email=email,
        created_at__gte=one_hour_ago
    )
    
    if recent_otps.count() >= 3:
        return False, 'Too many OTP requests. Please try again in 1 hour.'
    return True, None


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email: 
            return Response({'detail': 'Email required'}, status=400)
        
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
            user_type = 'user'
        elif handyman_matches.exists():
            print(f"[DEBUG] Email '{email}' found in Handymen.")
            user_type = 'handyman'
        else:
            print(f"[DEBUG] Email '{email}' NOT found in DB.")
            return Response({'detail': 'This email does not exist.'}, status=404)
        
        # Check rate limit
        can_request, error_msg = _check_rate_limit(email)
        if not can_request:
            return Response({'detail': error_msg}, status=429)
        
        # Get request metadata
        ip_address = _get_client_ip(request)
        user_agent = _get_user_agent(request)
        
        # Create OTP with tracking data
        otp = PasswordResetOTP.objects.create(
            email=email,
            user_type=user_type,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        print(f"[DEBUG] OTP created: {otp.otp_code} for {email} from {ip_address}")
        
        # Try to send email, fall back to console logging if SMTP fails
        email_sent = False
        try:
            send_mail(
                'Password Reset OTP',
                f'Your OTP code is {otp.otp_code}. It expires in 5 minutes.',
                settings.DEFAULT_FROM_EMAIL,
                [email],
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
            email_sent = True
            print(f"[DEBUG] Email sent successfully to {email}")
        except Exception as e:
            # SMTP failed (e.g. DNS resolution error on mobile hotspot)
            # Fall back to console logging so development doesn't break
            print(f"[DEBUG] Email sending failed (SMTP): {e}")
            print(f"[DEBUG] FALLBACK: OTP for {email} is: {otp.otp_code}")
            print(f"[DEBUG] FALLBACK: OTP expires in 5 minutes")
            logger.warning(f"Email sending failed for {email}: {e}. OTP {otp.otp_code} logged to console.")
            email_sent = False
        
        return Response({
            'detail': 'OTP sent successfully' if email_sent else 'OTP generated (email unavailable - check server console)',
            'otp_code': otp.otp_code if not email_sent else None
        })

class PasswordResetVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('otp_code')
        
        if not email or not code:
            return Response({'detail': 'Email and OTP code are required'}, status=400)
        
        # Get the most recent valid OTP for this email
        otp = PasswordResetOTP.objects.filter(
            email=email, 
            otp_code=code,
            is_used=False
        ).order_by('-created_at').first()
        
        # Validate OTP
        if not otp:
            return Response({'detail': 'Invalid or expired OTP'}, status=400)
        
        if otp.is_expired():
            return Response({'detail': 'OTP has expired. Please request a new one.'}, status=400)
        
        if otp.is_locked():
            return Response({
                'detail': 'OTP locked due to too many failed attempts. Please request a new one.'
            }, status=400)
        
        # Increment attempt counter
        otp.increment_attempts()
        
        # Check if locked after increment
        if otp.is_locked():
            return Response({
                'detail': 'Too many failed attempts. OTP locked. Please request a new one.'
            }, status=400)
        
        # Success - mark as verified
        otp.mark_as_used()
        
        print(f"[DEBUG] OTP verified successfully for {email} from {otp.ip_address}")
        
        return Response({'detail': 'OTP verified successfully'})

class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('otp_code')
        password = request.data.get('password')
        
        if not email or not code or not password:
            return Response({'detail': 'Email, OTP code, and password are required'}, status=400)
        
        # Get the most recent valid OTP
        otp = PasswordResetOTP.objects.filter(
            email=email, 
            otp_code=code,
            is_used=False
        ).order_by('-created_at').first()
        
        # Validate OTP
        if not otp:
            return Response({'detail': 'Invalid or expired OTP'}, status=400)
        
        if otp.is_expired():
            return Response({'detail': 'OTP has expired. Please request a new one.'}, status=400)
        
        if otp.is_locked():
            return Response({
                'detail': 'OTP locked due to too many failed attempts. Please request a new one.'
            }, status=400)
        
        # Find and update the user
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
        
        # Mark OTP as used and record verification time
        otp.mark_as_used()
        
        print(f"[DEBUG] Password reset completed for {email} (user_type: {otp.user_type})")
        
        return Response({'detail': 'Password updated successfully'})
