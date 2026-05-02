"""Shared authentication utilities for both HTTP and WebSocket."""
import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.authentication import BaseAuthentication
from handymen.models import Handyman

User = get_user_model()


class DualJWTAuthentication(BaseAuthentication):
    """
    Authentication class that tries both User and Handyman JWT tokens.
    Decodes the token directly using PyJWT with Django's SECRET_KEY.
    """

    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header or not auth_header.startswith('Bearer '):
            return None

        token = auth_header.split(' ')[1]

        try:
            decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user_id = decoded.get('user_id')
            if not user_id:
                return None

            # Try User first
            try:
                user = User.objects.get(pk=user_id)
                return (user, None)
            except User.DoesNotExist:
                pass

            # Try Handyman
            try:
                handyman = Handyman.objects.get(pk=user_id)
                return (handyman, None)
            except Handyman.DoesNotExist:
                return None

        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
        except Exception:
            return None

    def authenticate_header(self, request):
        return 'Bearer'
