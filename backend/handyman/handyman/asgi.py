# handyman/asgi.py
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'handyman.settings')

# Initialize Django ASGI application FIRST to set up the app registry
from django.core.asgi import get_asgi_application
django_asgi_app = get_asgi_application()

# Now import model-dependent modules safely
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from chats.routing import websocket_urlpatterns
from chats.middleware import JWTQueryParamAuthMiddleware

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        JWTQueryParamAuthMiddleware(
            URLRouter(websocket_urlpatterns)
        )
    ),
})
