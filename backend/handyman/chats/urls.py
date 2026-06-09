# chats/urls.py
from django.urls import path
from .views import (
    BookingMessageListView, MarkMessagesReadView, MyChatsListView,
    SupportChatHistoryView, GetOrCreateSupportConversationView
)

urlpatterns = [
    path('booking/<int:booking_id>/messages/', BookingMessageListView.as_view(), name='booking-messages'),
    path('booking/<int:booking_id>/mark-read/', MarkMessagesReadView.as_view(), name='mark-read'),
    path('my-chats/', MyChatsListView.as_view(), name='my-chats'),
    path('support/history/<int:conversation_id>/', SupportChatHistoryView.as_view(), name='support-history'),
    path('support/init/', GetOrCreateSupportConversationView.as_view(), name='support-init'),
]