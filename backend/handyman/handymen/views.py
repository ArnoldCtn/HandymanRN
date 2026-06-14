# handymen/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.authentication import BaseAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError

from django.conf import settings
from django.utils import timezone
from axes.handlers.proxy import AxesProxyHandler
from axes.models import AccessAttempt

from .models import Handyman, JobPicture
from .serializers import (HandymanSerializer, HandymanSignUpSerializer,
                          HandymanUpdateSerializer, HandymanIdVerificationSerializer,
                          JobPictureSerializer, JobPictureUploadSerializer)

from services.serializers import ServiceSerializer
from services.models import Service


# ── Custom JWT auth — looks up Handyman, not users.User ──
class HandymanJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        print(f"🔍 DEBUG: HandymanJWTAuthentication.get_user called")
        try:
            user_id = validated_token['user_id']
            print(f"🔍 DEBUG: Looking for handyman with ID: {user_id}")
            handyman = Handyman.objects.get(pk=user_id)
            print(f"✅ DEBUG: Found handyman: {handyman}")
            return handyman
        except Handyman.DoesNotExist:
            print(f"❌ DEBUG: Handyman not found with ID: {user_id}")
            from rest_framework_simplejwt.exceptions import AuthenticationFailed
            raise AuthenticationFailed('Handyman not found')
        except KeyError as e:
            print(f"❌ DEBUG: Token missing key: {e}")
            from rest_framework_simplejwt.exceptions import AuthenticationFailed
            raise AuthenticationFailed(f'Token missing required key: {e}')


# ── No-op authentication — used on public endpoints ──────
# Prevents the global JWTAuthentication from trying to look up
# users.User when a handyman token is present in the request.
class NoAuthentication(BaseAuthentication):
    def authenticate(self, request):
        return None  # always anonymous — let permissions decide


def get_tokens_for_handyman(handyman, request=None):
    tokens = RefreshToken.for_user(handyman)
    tokens['user_id'] = str(handyman.pk)
    tokens['user_type'] = 'handyman'
    return {
        'handyman': HandymanSerializer(handyman, context={'request': request}).data,
        'tokens': {
            'access':  str(tokens.access_token),
            'refresh': str(tokens),
        }
    }


class HandymanTokenRefreshView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [NoAuthentication]   # ← skip global JWT

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'detail': 'Refresh token required.'}, status=400)
        try:
            token = RefreshToken(refresh_token)
            user_id = token['user_id']
            handyman = Handyman.objects.get(pk=user_id)

            if not handyman.is_active:
                return Response({'detail': 'Account deactivated.'}, status=401)

            data = {'access': str(token.access_token)}

            jwt_settings = getattr(settings, 'SIMPLE_JWT', {})
            if jwt_settings.get('ROTATE_REFRESH_TOKENS', False):
                token.set_jti()
                token.set_exp()
                data['refresh'] = str(token)

            return Response(data)

        except Handyman.DoesNotExist:
            return Response({'detail': 'Handyman not found.'}, status=401)
        except TokenError as e:
            return Response({'detail': str(e)}, status=401)


class HandymanSignInView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [NoAuthentication]   # ← skip global JWT

    def post(self, request):
        username_or_email = request.data.get('username', '').strip().lower()
        password = request.data.get('password', '')

        # ── Debug: log what we received ─────────────────
        print(f'[HandymanSignIn] Attempting login for username/email: "{username_or_email}"')

        if not username_or_email or not password:
            print('[HandymanSignIn] Missing username/email or password')
            return Response(
                {'detail': 'Username/Email and password required.'},
                status=400
            )

        # Resolve username from email if necessary
        username = username_or_email
        if '@' in username_or_email:
            try:
                handyman = Handyman.objects.get(email=username_or_email)
                username = handyman.username
            except Handyman.DoesNotExist:
                # Handyman not found by email, will fail later
                pass

        # ── Lockout check ────────────────────────────────
        is_locked = AxesProxyHandler.is_locked(
            request, credentials={'username': username}
        )
        if is_locked:
            try:
                attempt = AccessAttempt.objects.filter(
                    username=username).order_by('-attempt_time').first()
                cooloff = settings.AXES_COOLOFF_TIME
                unlock_at = attempt.attempt_time + cooloff
                mins = max(
                    int((unlock_at - timezone.now()).total_seconds() / 60), 1)
                msg = f'Account locked. Try again in {mins} minute(s).'
            except Exception:
                msg = 'Account locked. Too many failed attempts.'
            print(f'[HandymanSignIn] Account locked: {username}')
            return Response({'detail': msg}, status=429)

        # ── Look up handyman ─────────────────────────────
        try:
            handyman = Handyman.objects.get(username=username)
            print(
                f'[HandymanSignIn] Found handyman: id={handyman.pk}, active={handyman.is_active}')
        except Handyman.DoesNotExist:
            print(
                f'[HandymanSignIn] No handyman found with username: "{username}"')
            return Response({'detail': 'Invalid username/email or password.'}, status=401)

        # ── Check password ───────────────────────────────
        if not handyman.check_password(password):
            print(f'[HandymanSignIn] Wrong password for: "{username}"')
            try:
                attempt = AccessAttempt.objects.filter(
                    username=username).order_by('-attempt_time').first()
                failures = attempt.failures_since_start if attempt else 1
                remaining = max(settings.AXES_FAILURE_LIMIT - failures, 0)
                msg = (f'Invalid credentials. {remaining} attempt(s) remaining.'
                       if remaining > 0 else 'Account locked.')
            except Exception:
                msg = 'Invalid username/email or password.'

            from django.contrib.auth.signals import user_login_failed
            user_login_failed.send(
                sender=Handyman,
                credentials={'username': username},
                request=request
            )
            return Response({'detail': msg}, status=401)

        # ── Check active ─────────────────────────────────
        if not handyman.is_active:
            print(f'[HandymanSignIn] Account deactivated: "{username}"')
            return Response({'detail': 'Account deactivated.'}, status=403)

        # ── Success ──────────────────────────────────────
        print(f'[HandymanSignIn] Login successful for: "{username}"')
        handyman.mark_online()
        return Response(get_tokens_for_handyman(handyman, request), status=200)


class HandymanSignUpView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [NoAuthentication]   # ← skip global JWT
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        print(f'[HandymanSignUp] Data keys: {list(request.data.keys())}')
        print(f'[HandymanSignUp] Files: {list(request.FILES.keys())}')
        s = HandymanSignUpSerializer(data=request.data)
        if not s.is_valid():
            print(f'[HandymanSignUp] Validation errors: {s.errors}')
            return Response(s.errors, status=400)
        handyman = s.save()
        print(f'[HandymanSignUp] Created handyman: {handyman.username}')
        return Response(get_tokens_for_handyman(handyman, request), status=201)


class HandymanIdVerificationView(APIView):
    """
    Post-login ID verification for authenticated handymen.
    POST JSON: id_full_name, birth_date, gender,
    id_card_front + id_card_back as data:image/...;base64,... strings.
    """
    permission_classes = [IsAuthenticated]
    authentication_classes = [HandymanJWTAuthentication]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def post(self, request):
        from django.core.files.base import ContentFile
        from .id_verification import verify_id_card, decode_base64_image

        handyman = request.user

        if handyman.is_verified:
            return Response({
                'verified': True,
                'message': 'Your account is already verified.',
                'handyman': HandymanSerializer(handyman, context={'request': request}).data,
            }, status=200)

        # Prefer JSON + base64 (mobile); fall back to multipart uploads
        if request.FILES.get('id_card_front') or request.FILES.get('id_card'):
            id_full_name = (
                request.data.get('id_full_name')
                or request.data.get('legal_name') or ''
            ).strip()
            birth_date = request.data.get('birth_date') or handyman.birth_date
            gender = (request.data.get('gender') or handyman.gender or 'male').strip().lower()
            front = request.FILES.get('id_card_front') or request.FILES.get('id_card')
            back = request.FILES.get('id_card_back')
            if not id_full_name or not birth_date or not front or not back:
                return Response(
                    {'detail': 'id_full_name, birth_date, id_card_front, id_card_back required.',
                     'verified': False},
                    status=400,
                )
            front_mime = front.content_type or 'image/jpeg'
            back_mime = back.content_type or 'image/jpeg'
            front_bytes = front.read()
            back_bytes = back.read()
        else:
            s = HandymanIdVerificationSerializer(data=request.data)
            if not s.is_valid():
                print(f'[HandymanIdVerify] Validation errors: {s.errors}')
                return Response({**s.errors, 'verified': False}, status=400)
            data = s.validated_data
            id_full_name = data['id_full_name'].strip()
            birth_date = data.get('birth_date') or handyman.birth_date
            gender = (data.get('gender') or handyman.gender or 'male').strip().lower()
            if not birth_date:
                return Response(
                    {'detail': 'Birth date is required on your profile (YYYY-MM-DD).',
                     'verified': False},
                    status=400,
                )
            try:
                front_bytes, front_mime = decode_base64_image(data['id_card_front'])
                back_bytes, back_mime = decode_base64_image(data['id_card_back'])
            except ValueError as e:
                return Response({'detail': str(e), 'verified': False}, status=400)
            print(
                f'[HandymanIdVerify] JSON upload from {handyman.username}: '
                f'front={len(front_bytes)}B, back={len(back_bytes)}B'
            )

        try:
            result = verify_id_card(
                form_name=id_full_name,
                form_birth_date=birth_date,
                form_gender=gender,
                front_bytes=front_bytes,
                front_mime=front_mime,
                back_bytes=back_bytes,
                back_mime=back_mime,
                exclude_handyman_id=handyman.pk,
            )
        except ValueError as e:
            handyman.id_verification_status = 'failed'
            handyman.save(update_fields=['id_verification_status'])
            return Response({'detail': str(e), 'verified': False}, status=400)
        except Exception as e:
            print(f'[HandymanIdVerify] Error: {e}')
            import traceback
            traceback.print_exc()
            return Response(
                {'detail': 'ID verification failed. Please try again.', 'verified': False},
                status=500,
            )

        handyman.legal_name = result['legal_name']
        handyman.id_number = result['id_number']
        handyman.birth_date = result['birth_date']
        handyman.gender = result['gender']
        handyman.id_verification_status = 'verified'
        handyman.id_verified_at = timezone.now()
        handyman.is_verified = True

        handyman.id_card_image.save(
            f'{handyman.username}_front.jpg',
            ContentFile(front_bytes),
            save=False,
        )
        handyman.id_card_back_image.save(
            f'{handyman.username}_back.jpg',
            ContentFile(back_bytes),
            save=False,
        )
        handyman.save()

        return Response({
            'verified': True,
            'message': 'ID verification successful. Your account is now verified.',
            'legal_name': result['legal_name'],
            'birth_date': result['birth_date'].isoformat(),
            'gender': result['gender'],
            'age': result['age'],
            'handyman': HandymanSerializer(handyman, context={'request': request}).data,
        }, status=200)


class HandymanUpdateView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [HandymanJWTAuthentication]
    parser_classes = [MultiPartParser, FormParser,
                      JSONParser]  # ← Added JSONParser

    def get(self, request):
        serializer = HandymanSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        print(
            f'[HandymanUpdate] User: {request.user}, Data keys: {list(request.data.keys())}')
        s = HandymanUpdateSerializer(
            request.user, data=request.data,
            partial=True, context={'request': request}
        )
        if not s.is_valid():
            print(f'[HandymanUpdate] Validation errors: {s.errors}')
            return Response(s.errors, status=400)
        handyman = s.save()
        return Response(HandymanSerializer(handyman, context={'request': request}).data)


class HandymanMarkOnlineView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [HandymanJWTAuthentication]

    def post(self, request):
        request.user.mark_online()
        return Response({'status': 'online'})


class HandymanMarkOfflineView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [HandymanJWTAuthentication]

    def post(self, request):
        request.user.mark_offline()
        return Response({'status': 'offline'})


class HandymanAvailableServicesView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [NoAuthentication]   # ← KEY FIX — skip global JWT

    def get(self, request):
        from services.models import Service
        from services.serializers import ServiceSerializer
        services = Service.objects.all().order_by('name')
        print(f'[HandymenServices] Returning {services.count()} services')
        return Response(
            ServiceSerializer(services, many=True, context={
                              'request': request}).data
        )


class HandymanAvailableLocationsView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [NoAuthentication]   # ← KEY FIX — skip global JWT

    def get(self, request):
        from locations.models import Location
        from rest_framework import serializers as drf_serializers

        class LocationSerializer(drf_serializers.ModelSerializer):
            class Meta:
                model = Location
                fields = ['id', 'location', 'region']

        locations = Location.objects.all().order_by('location')
        print(f'[HandymenLocations] Returning {locations.count()} locations')
        return Response(LocationSerializer(locations, many=True).data)


class HandymanListByServiceView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [NoAuthentication]   # public endpoint

    def get(self, request, service_id):
        if not service_id:
            return Response({"detail": "Service ID is required"}, status=400)

        # Efficient query: filter handymen who offer this service
        handymen = Handyman.objects.filter(
            services=service_id,
            is_active=True,
            is_verified=True,
        ).select_related('location').prefetch_related('services')

        print(
            f"[HandymenByService] Service {service_id} → {handymen.count()} handymen found")

        serializer = HandymanSerializer(
            handymen,
            many=True,
            context={'request': request}
        )
        return Response(serializer.data, status=200)
    
class HandymanListView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [NoAuthentication]   # public endpoint

    def get(self, request):
        min_rating = request.query_params.get('min_rating')
        username = request.query_params.get('username')
        
        # Efficient query: filter handymen who offer this service
        handymen = Handyman.objects.filter(
            is_active=True,
            is_verified=True,
        ).select_related('location').prefetch_related('services')

        if min_rating:
            try:
                handymen = handymen.filter(average_rating__gte=float(min_rating))
            except ValueError:
                pass
        
        if username:
            handymen = handymen.filter(username__icontains=username)

        serializer = HandymanSerializer(
            handymen,
            many=True,
            context={'request': request}
        )
        return Response(serializer.data, status=200)


class HandymanDetailView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = [NoAuthentication]   # ← THIS IS THE KEY FIX

    def get_object(self, pk):
        try:
            return Handyman.objects.select_related('location').prefetch_related('services').get(pk=pk)
        except Handyman.DoesNotExist:
            return None

    def get(self, request, pk):
        handyman = self.get_object(pk)
        if not handyman:
            return Response({"detail": "Handyman not found"}, status=404)

        serializer = HandymanSerializer(handyman, context={'request': request})
        return Response(serializer.data)

class JobPictureUploadView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [HandymanJWTAuthentication]
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def post(self, request):
        s = JobPictureUploadSerializer(data=request.data, context={'request': request})
        if s.is_valid():
            pic = s.save()
            return Response(JobPictureSerializer(pic, context={'request': request}).data, status=201)
        return Response(s.errors, status=400)

class JobPictureDeleteView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [HandymanJWTAuthentication]

    def delete(self, request, pk):
        try:
            pic = JobPicture.objects.get(pk=pk, handyman=request.user)
            pic.delete()
            return Response(status=204)
        except JobPicture.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)
