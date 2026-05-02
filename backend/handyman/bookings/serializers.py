# bookings/serializers.py
from rest_framework import serializers
from .models import Booking
from services.serializers import ServiceSerializer
from handymen.serializers import HandymanSerializer  # if you have it


class BookingSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service.name', read_only=True)
    location_name = serializers.CharField(source='location.location', read_only=True, default=None)
    handyman = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            'id', 'user', 'handyman', 'service', 'service_name', 'location', 'location_name',
            'scheduled_date', 'job_description', 'total_amount',
            'status', 'completed_at', 'cancelled_at', 'cancellation_reason',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'status', 'completed_at', 'cancelled_at']

    def get_handyman(self, obj):
        request = self.context.get('request')
        thumb = None
        try:
            if obj.handyman.thumbnail:
                thumb = obj.handyman.thumbnail.url
                if request:
                    thumb = request.build_absolute_uri(thumb)
        except (UnicodeDecodeError, AttributeError, ValueError):
            # Handle corrupt image files
            thumb = None
        return {
            'id': obj.handyman.id,
            'username': obj.handyman.username,
            'phone': obj.handyman.phone or '',
            'thumbnail': thumb,
        }

    def get_user(self, obj):
        request = self.context.get('request')
        thumb = None
        try:
            if hasattr(obj.user, 'thumbnail') and obj.user.thumbnail:
                thumb = obj.user.thumbnail.url
                if request:
                    thumb = request.build_absolute_uri(thumb)
        except (UnicodeDecodeError, AttributeError, ValueError):
            # Handle corrupt image files
            thumb = None
        return {
            'id': obj.user.id,
            'username': obj.user.username,
            'phone': getattr(obj.user, 'phone', '') or '',
            'thumbnail': thumb,
        }

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class BookingCreateSerializer(serializers.ModelSerializer):
    """Used when user creates a new booking"""
    class Meta:
        model = Booking
        fields = ['handyman', 'service', 'location', 'scheduled_date',
                  'job_description', 'total_amount']