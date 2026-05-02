import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from handymen.models import Handyman

User = get_user_model()


class JWTQueryParamAuthMiddleware(BaseMiddleware):
    """Authenticate WebSocket connections via JWT token in query string."""

    async def __call__(self, scope, receive, send):
        query_string = scope.get('query_string', b'').decode()
        token = None

        # Parse token from query string
        for param in query_string.split('&'):
            if param.startswith('token='):
                token = param.split('=', 1)[1]
                break

        if token:
            user = await self.get_user_from_token(token)
            if user:
                scope['user'] = user
            else:
                scope['user'] = AnonymousUser()
        else:
            scope['user'] = AnonymousUser()

        return await super().__call__(scope, receive, send)

    @database_sync_to_async
    def get_user_from_token(self, token):
        try:
            decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user_id = decoded.get('user_id')
            if not user_id:
                return None

            # Try User first
            try:
                return User.objects.get(pk=user_id)
            except User.DoesNotExist:
                pass

            # Try Handyman
            try:
                return Handyman.objects.get(pk=user_id)
            except Handyman.DoesNotExist:
                pass

        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
        except Exception:
            return None

        return None


class AnonymousUser:
    """Minimal anonymous user for scope."""
    is_authenticated = False
    id = None
    username = ''
