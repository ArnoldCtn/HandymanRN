# chats/routing.py
from django.urls import re_path
from .consumers import BookingChatConsumer, SupportChatConsumer

websocket_urlpatterns = [
    re_path(r'ws/chat/booking/(?P<booking_id>\d+)/$', BookingChatConsumer.as_asgi()),
    re_path(r'ws/support/(?P<room_name>[^/]+)/$', SupportChatConsumer.as_asgi()),
    re_path(r'ws/support/$', SupportChatConsumer.as_asgi()),
]