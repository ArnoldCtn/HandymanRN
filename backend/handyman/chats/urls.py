# chats/urls.py
from django.urls import path
from .views import BookingMessageListView, MyChatsListView

urlpatterns = [
    path('booking/<int:booking_id>/messages/', BookingMessageListView.as_view(), name='booking-messages'),
    path('my-chats/', MyChatsListView.as_view(), name='my-chats'),
]