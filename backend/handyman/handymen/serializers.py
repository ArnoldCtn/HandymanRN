# handymen/serializers.py
import json
from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from .models import Handyman
from services.models import Service
from locations.models import Location
from services.serializers import ServiceSerializer


class FlexibleJSONField(serializers.JSONField):
    """Accepts both a JSON string (from FormData) and a dict (from JSON body)."""
    def to_internal_value(self, data):
        if isinstance(data, str):
            try:
                data = json.loads(data)
            except (json.JSONDecodeError, ValueError):
                raise serializers.ValidationError(
                    f'Must be valid JSON. Received: {repr(data)[:100]}'
                )
        return super().to_internal_value(data)


class HandymanSignUpSerializer(serializers.ModelSerializer):
    services     = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(), many=True, required=True
    )
    location     = serializers.PrimaryKeyRelatedField(
        queryset=Location.objects.all(), required=True
    )
    availability = FlexibleJSONField(required=False)

    class Meta:
        model  = Handyman
        fields = ['username', 'email', 'password', 'phone',
                  'bio', 'availability', 'thumbnail', 'services', 'location']
        extra_kwargs = {
            'password':  {'write_only': True},
            'thumbnail': {'required': False},
            'phone':     {'required': False},
            'bio':       {'required': False},
        }

    def create(self, validated_data):
        services     = validated_data.pop('services', [])
        thumbnail    = validated_data.pop('thumbnail', None)
        location     = validated_data.pop('location', None)
        availability = validated_data.pop('availability', {})

        handyman = Handyman.objects.create_user(
            username     = validated_data['username'].lower(),
            email        = validated_data['email'].lower(),
            password     = validated_data['password'],
            phone        = validated_data.get('phone'),
            bio          = validated_data.get('bio'),
            availability = availability,
            location     = location,
        )
        if thumbnail:
            handyman.thumbnail = thumbnail
        if services:
            handyman.services.set(services)
        handyman.save()
        return handyman


class HandymanSerializer(serializers.ModelSerializer):
    thumbnail = serializers.SerializerMethodField()
    last_seen = serializers.SerializerMethodField()
    services  = ServiceSerializer(many=True, read_only=True)
    location  = serializers.StringRelatedField()
    # location = serializers.SerializerMethodField()

    class Meta:
        model  = Handyman
        fields = ['id', 'username', 'email', 'phone', 'bio',
                  'thumbnail', 'availability', 'services', 'location',
                  'is_online', 'last_seen', 'is_verified', 'is_available']

    def get_thumbnail(self, obj):
        if obj.thumbnail:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.thumbnail.url)
            return obj.thumbnail.url
        return None
    

    # def get_location(self, obj):
    #     if obj.location:
    #         return {
    #             'id': obj.location.id,
    #             'name': str(obj.location)
    #         }
    #     return None

    def get_last_seen(self, obj):
        if not obj.last_seen: return None
        delta = timezone.now() - obj.last_seen
        if delta   < timedelta(minutes=1):  return 'Just now'
        elif delta < timedelta(hours=1):    return f'{int(delta.total_seconds()/60)}m ago'
        elif delta < timedelta(days=1):     return f'{int(delta.total_seconds()/3600)}h ago'
        elif delta.days < 7:               return f'{delta.days}d ago'
        return obj.last_seen.strftime('%b %d, %Y')


class HandymanUpdateSerializer(serializers.ModelSerializer):
    services     = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(), many=True, required=False
    )
    # location     = serializers.PrimaryKeyRelatedField(
    #     queryset=Location.objects.all(), required=False, allow_null=True
    # )
    location = serializers.CharField(required=False, allow_null=True, allow_blank=True)


    # ✅ FlexibleJSONField handles string→dict conversion
    # ✅ NO to_internal_value override — that caused double-parsing conflicts
    availability = FlexibleJSONField(required=False)

    class Meta:
        model  = Handyman
        fields = ['username', 'email', 'phone', 'bio', 'availability',
                  'thumbnail', 'services', 'location', 'is_available', 'password']
        extra_kwargs = {
            'password':     {'write_only': True, 'required': False},
            'thumbnail':    {'required': False},
            'username':     {'required': False},
            'email':        {'required': False},
            'phone':        {'required': False},
            'bio':          {'required': False},
            'is_available': {'required': False},
        }

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        services = validated_data.pop('services', None)
        location_value = validated_data.pop('location', None)

        # Handle location flexibly (ID or name)
        if location_value:
            try:
                # Try as ID first
                if str(location_value).isdigit():
                    loc = Location.objects.get(id=int(location_value))
                else:
                    # Try as name (case insensitive)
                    loc = Location.objects.get(location__iexact=str(location_value))
                instance.location = loc
            except Location.DoesNotExist:
                # If not found, keep current location or ignore
                pass

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)
        if services is not None:
            instance.services.set(services)

        instance.save()
        return instance