# chats/serializers.py
from rest_framework import serializers
from .models import BookingMessage


class BookingMessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.SerializerMethodField()

    class Meta:
        model = BookingMessage
        fields = ['id', 'booking', 'sender_user', 'sender_handyman', 
                  'sender_username', 'message', 'is_read', 'created_at']
        read_only_fields = ['sender_user', 'sender_handyman', 'is_read']

    def get_sender_username(self, obj):
        if obj.sender_user:
            return obj.sender_user.username
        elif obj.sender_handyman:
            return obj.sender_handyman.username
        return "Unknown"