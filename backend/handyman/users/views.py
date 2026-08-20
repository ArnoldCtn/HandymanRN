from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.authentication import BaseAuthentication

from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_exempt
from axes.handlers.proxy import AxesProxyHandler
from axes.models import AccessAttempt
from django.conf import settings

from .models import PasswordResetOTP
from .serializers import UserSerializer, SignUpSerializer, UserUpdateSerializer
from handymen.models import Handyman
import threading
import logging

logger = logging.getLogger(__name__)

from datetime import timedelta


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
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        try:
            request.user.mark_online()
            return Response({'status': 'online'})
        except Exception as e:
            logger.error(f"MarkOnlineView error: {str(e)}")
            return Response({'detail': 'Failed to update online status'}, status=500)


class MarkOfflineView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [JWTAuthentication]

    def post(self, request):
        try:
            request.user.mark_offline()
            return Response({'status': 'offline'})
        except Exception as e:
            logger.error(f"MarkOfflineView error: {str(e)}")
            return Response({'detail': 'Failed to update offline status'}, status=500)

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


def _check_rate_limit(email, ip_address=None):
    """
    Multi-tier rate limiting for OTP requests.
    Returns (allowed: bool, error_message: str | None).
    """
    now = timezone.now()

    # 1) Resend cooldown — max 1 request per 60s per email
    if PasswordResetOTP.objects.filter(
        email=email, created_at__gte=now - timedelta(seconds=60)
    ).exists():
        return False, 'Please wait a minute before requesting a new code.'

    # 2) Hourly limit — max 5 per email per hour
    hourly_count = PasswordResetOTP.objects.filter(
        email=email, created_at__gte=now - timedelta(hours=1)
    ).count()
    if hourly_count >= 5:
        return False, 'Too many requests. Please try again in 1 hour.'

    # 3) Daily limit — max 10 per email per 24h
    daily_count = PasswordResetOTP.objects.filter(
        email=email, created_at__gte=now - timedelta(hours=24)
    ).count()
    if daily_count >= 10:
        return False, 'Too many requests today. Please try again tomorrow.'

    # 4) IP limit — max 5 per IP per hour
    if ip_address:
        ip_count = PasswordResetOTP.objects.filter(
            ip_address=ip_address, created_at__gte=now - timedelta(hours=1)
        ).count()
        if ip_count >= 5:
            return False, 'Too many requests from your network. Please try again later.'

    return True, None


def _invalidate_user_sessions(user):
    """Blacklist all outstanding refresh tokens for a user after password reset."""
    try:
        from rest_framework_simplejwt.token_blacklist.models import OutstandingToken, BlacklistedToken
        if isinstance(user, Handyman):
            return  # Handyman tokens aren't tracked in OutstandingToken
        tokens = OutstandingToken.objects.filter(user=user)
        for token in tokens:
            BlacklistedToken.objects.get_or_create(token=token)
    except Exception as e:
        logger.warning(f"Failed to blacklist tokens for {user}: {e}")


def _find_user_by_email(email):
    """Look up a User or Handyman by email. Returns (user, user_type) or (None, None)."""
    user = User.objects.filter(email__iexact=email).first()
    if user:
        return user, 'user'
    handyman = Handyman.objects.filter(email__iexact=email).first()
    if handyman:
        return handyman, 'handyman'
    return None, None


def _send_password_changed_email(email):
    """Send notification that password was changed (background thread)."""
    try:
        print(f"[EMAIL] Queuing password-changed notification to {email}...")
        thread = threading.Thread(
            target=send_mail,
            args=(
                'Your password was changed',
                'Your password has been successfully changed. '
                'If you did not request this change, please contact support immediately.',
                settings.DEFAULT_FROM_EMAIL,
                [email],
            ),
            kwargs={
                'fail_silently': True,
                'html_message': """
                    <div style="font-family: Arial, sans-serif; text-align: center;">
                        <h2 style="color: #6366F1;">Password Changed</h2>
                        <p>Your password has been successfully changed.</p>
                        <p style="color: #9ca3af;">If you did not request this change, please contact support immediately.</p>
                    </div>
                """
            },
            daemon=True
        )
        thread.start()
        print(f"[EMAIL] Password-changed email queued (background thread)")
    except Exception as e:
        print(f"[EMAIL] FAILED to queue password-changed email to {email}: {e}")
        logger.warning(f"Failed to queue password changed email to {email}: {e}")


GENERIC_SUCCESS_MSG = 'If that email is registered, you will receive an OTP.'
GENERIC_OTP_ERROR = 'Invalid or expired OTP. Please request a new one.'


class PasswordResetRequestView(APIView):
    """Request an OTP for password reset. Always returns the same response
    regardless of whether the email exists — prevents user enumeration."""

    permission_classes = [AllowAny]

    def post(self, request):
        print(f"[PASSWORD-RESET] Request received. Data: {request.data}")
        email = request.data.get('email')
        if not email:
            return Response({'detail': GENERIC_SUCCESS_MSG}, status=200)

        email = email.strip().lower()

        # Check rate limit
        ip_address = _get_client_ip(request)
        can_request, error_msg = _check_rate_limit(email, ip_address)
        if not can_request:
            return Response({'detail': error_msg}, status=429)

        # Check if user exists (user or handyman)
        user, user_type = _find_user_by_email(email)

        if user:
            print(f"[PASSWORD-RESET] User found: {email} (type: {user_type})")
            user_agent = _get_user_agent(request)

            otp = PasswordResetOTP.objects.create(
                email=email,
                user_type=user_type,
                ip_address=ip_address,
                user_agent=user_agent
            )

            # Try to send email (background thread — non-blocking)
            try:
                print(f"[EMAIL] Queuing OTP to {email} via Brevo...")
                print(f"[EMAIL] Backend: {settings.EMAIL_BACKEND}")
                print(f"[EMAIL] From: {settings.DEFAULT_FROM_EMAIL}")
                otp_code = otp.otp_code
                thread = threading.Thread(
                    target=send_mail,
                    args=(
                        'Password Reset OTP',
                        f'Your OTP code is {otp_code}. It expires in 5 minutes.',
                        settings.DEFAULT_FROM_EMAIL,
                        [email],
                    ),
                    kwargs={
                        'fail_silently': True,
                        'html_message': f"""
                            <div style="font-family: Arial, sans-serif; text-align: center;">
                                <h2 style="color: #6366F1;">Password Reset</h2>
                                <p>Your OTP code is:</p>
                                <h1 style="color: #6366F1; font-size: 32px;">{otp_code}</h1>
                                <p>It expires in 5 minutes.</p>
                            </div>
                        """
                    },
                    daemon=True
                )
                thread.start()
                print(f"[EMAIL] OTP email queued (background thread)")
            except Exception as e:
                print(f"[EMAIL] FAILED to queue OTP to {email}: {e}")
                logger.warning(f"Email sending failed for {email}: {e}")
        else:
            print(f"[PASSWORD-RESET] No user found for email: {email}")

        # Always return the same response — never reveal whether email exists
        return Response({'detail': GENERIC_SUCCESS_MSG}, status=200)


class PasswordResetVerifyView(APIView):
    """Verify that an OTP is valid without using it.
    Accepts: {email, otp_code}
    Returns 200 if valid, 400 if not."""

    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('otp_code')

        if not email or not code:
            return Response({'detail': GENERIC_OTP_ERROR}, status=400)

        email = email.strip().lower()

        otp = PasswordResetOTP.objects.filter(
            email=email,
            otp_code=code,
            is_used=False
        ).order_by('-created_at').first()

        if not otp or otp.is_expired() or otp.is_locked():
            return Response({'detail': GENERIC_OTP_ERROR}, status=400)

        return Response({'detail': 'OTP verified successfully'}, status=200)


class PasswordResetVerifyAndConfirmView(APIView):
    """Verify OTP and reset password in a single atomic step.
    Accepts: {email, otp_code, password}
    This replaces the separate verify and confirm endpoints to avoid
    the race condition where verify marks OTP as used before confirm
    can find it."""

    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        code = request.data.get('otp_code')
        password = request.data.get('password')

        if not email or not code or not password:
            return Response({'detail': GENERIC_OTP_ERROR}, status=400)

        email = email.strip().lower()

        # Find the most recent valid OTP
        otp = PasswordResetOTP.objects.filter(
            email=email,
            otp_code=code,
            is_used=False
        ).order_by('-created_at').first()

        # Validate OTP — all failures return the same generic error
        if not otp or otp.is_expired() or otp.is_locked():
            return Response({'detail': GENERIC_OTP_ERROR}, status=400)

        # Increment attempt counter
        otp.increment_attempts()

        # Check if locked after increment
        if otp.is_locked():
            return Response({'detail': GENERIC_OTP_ERROR}, status=400)

        # Validate password strength
        user_obj, _ = _find_user_by_email(email)
        if not user_obj:
            return Response({'detail': GENERIC_OTP_ERROR}, status=400)

        try:
            validate_password(password, user=user_obj)
        except ValidationError as e:
            # Return password-specific errors (not OTP-related)
            return Response(
                {'detail': 'Password does not meet requirements.', 'errors': e.messages},
                status=400
            )

        # Set new password
        user_obj.set_password(password)
        user_obj.save()

        # Mark OTP as used
        otp.mark_as_used()

        # Invalidate all existing sessions for this user
        _invalidate_user_sessions(user_obj)

        # Send notification email
        _send_password_changed_email(email)

        return Response({'detail': 'Password updated successfully'}, status=200)
