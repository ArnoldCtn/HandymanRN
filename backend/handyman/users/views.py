from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny,IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.authentication import BaseAuthentication

from django.contrib.auth import authenticate
from .serializers import UserSerializer, SignUpSerializer,UserUpdateSerializer
from axes.handlers.proxy import AxesProxyHandler
from django.conf import settings


from datetime import timedelta
from django.utils import timezone
from axes.models import AccessAttempt


FAILURE_LIMIT = 5
COOLOFF_HOURS = 1

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
        username = request.data.get('username', '').strip().lower()
        password = request.data.get('password', '')

        if not username or not password:
            return Response(
                {'detail': 'Username and password are required.'},
                status=400
            )

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
                cooloff    = settings.AXES_COOLOFF_TIME
                unlock_at  = attempt.attempt_time + cooloff
                remaining  = unlock_at - timezone.now()
                mins       = max(int(remaining.total_seconds() / 60), 1)
                msg = f'Account locked. Try again in {mins} minute(s).'
            except Exception:
                msg = 'Account locked. Too many failed attempts.'
            return Response({'detail': msg}, status=429)

        # ── Try to authenticate ──────────────────────────
        user = authenticate(request=request, username=username, password=password)

        if not user:
            # ── Read failure count AFTER authenticate()
            #    because Axes records the failure inside authenticate()
            try:
                attempt = (AccessAttempt.objects
                           .filter(username=username)
                           .order_by('-attempt_time')
                           .first())
                failures  = attempt.failures_since_start if attempt else 1
                limit     = settings.AXES_FAILURE_LIMIT
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
    parser_classes = [MultiPartParser, FormParser]  # ✅ Required for image upload

    def post(self, request):
        new_user = SignUpSerializer(data=request.data)
        new_user.is_valid(raise_exception=True)
        user = new_user.save()

        # ✅ Pass request
        user_data = get_auth_for_user(user, request)
        return Response(user_data)


class UserUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

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
    






    # def login_view(request):
    # form = LoginForm(request.POST or None)

    # if request.method == "POST":
    #     username = request.POST.get("username", "").strip()
    #     failures, locked, mins = _lockout_info(username)

    #     if locked:
    #         messages.error(
    #             request, f"🔒 Too many attempts. Try again in {mins} minute(s).")
    #         return render(request, "accounts/login.html", {"form": form})

    #     if form.is_valid():
    #         user = authenticate(
    #             request,
    #             username=form.cleaned_data["username"],
    #             password=form.cleaned_data["password"],
    #         )
    #         if user is not None:
    #             if user.profile.is_2fa_enabled:
    #                 request.session["pending_uid"] = user.pk
    #                 return redirect("accounts:verify_otp")
    #             login(request, user)
    #             return redirect("accounts:dashboard")
    #         else:
    #             failures, locked, mins = _lockout_info(
    #                 form.cleaned_data["username"])
    #             remaining = max(0, FAILURE_LIMIT - failures)
    #             if locked:
    #                 messages.error(
    #                     request, f"🔒 Account locked for {mins} minute(s).")
    #             else:
    #                 messages.error(
    #                     request, f"Wrong username or password. {remaining} attempt(s) left.")
    #     else:
    #         messages.error(request, "Please fill in both fields.")

    # return render(request, "accounts/login.html", {"form": form})

