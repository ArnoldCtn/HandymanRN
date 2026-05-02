# chats/routing.py
from django.urls import re_path
from .consumers import BookingChatConsumer

websocket_urlpatterns = [
    re_path(r'ws/chat/booking/(?P<booking_id>\d+)/$', BookingChatConsumer.as_asgi()),
]