# handyman/asgi.py
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'handyman.settings')

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter

from chats.routing import websocket_urlpatterns
from chats.middleware import JWTQueryParamAuthMiddleware

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JWTQueryParamAuthMiddleware(
        URLRouter(websocket_urlpatterns)
    ),
})