# chats/serializers.py
from rest_framework import serializers
from .models import BookingMessage
from django.conf import settings

class BookingMessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    video_url = serializers.SerializerMethodField()
    audio_url = serializers.SerializerMethodField()

    class Meta:
        model = BookingMessage
        fields = ['id', 'booking', 'sender_user', 'sender_handyman', 
                  'sender_username', 'message', 'image', 'image_url', 
                  'video', 'video_url', 'audio', 'audio_url', 'duration', 
                  'is_read', 'created_at']
        read_only_fields = ['sender_user', 'sender_handyman', 'is_read']

    def get_sender_username(self, obj):
        if obj.sender_user:
            return obj.sender_user.username
        elif obj.sender_handyman:
            return obj.sender_handyman.username
        return "Unknown"

    def get_image_url(self, obj):
        if obj.image:
            image_url = obj.image.url
            # If it's already an absolute URL, return as is
            if image_url.startswith('http'):
                return image_url
            
            # If it's a relative path, build the absolute URL
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(image_url)
            return f"{settings.MEDIA_URL.rstrip('/')}{image_url}"
        return None

    def get_video_url(self, obj):
        if obj.video:
            video_url = obj.video.url
            # If it's already an absolute URL, return as is
            if video_url.startswith('http'):
                return video_url
            
            # If it's a relative path, build the absolute URL
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(video_url)
            return f"{settings.MEDIA_URL.rstrip('/')}{video_url}"
        return None

    def get_audio_url(self, obj):
        if obj.audio:
            audio_url = obj.audio.url
            # If it's already an absolute URL, return as is
            if audio_url.startswith('http'):
                return audio_url
            
            # If it's a relative path, build the absolute URL
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(audio_url)
            return f"{settings.MEDIA_URL.rstrip('/')}{audio_url}"
        return None
