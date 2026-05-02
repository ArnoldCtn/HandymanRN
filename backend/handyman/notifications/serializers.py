# notifications/serializers.py
from rest_framework import serializers
from .models import Notification


class BookingMiniSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=False)
    status = serializers.CharField(required=False)


class NotificationSerializer(serializers.ModelSerializer):
    booking = BookingMiniSerializer(read_only=True, allow_null=True)
    
    class Meta:
        model = Notification
        fields = ['id', 'title', 'body', 'notification_type', 'booking', 
                  'is_read', 'created_at']
        read_only_fields = ['title', 'body', 'notification_type', 'booking']