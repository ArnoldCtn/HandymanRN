# handymen/serializers.py
import json
import base64
from rest_framework import serializers
from django.utils import timezone
from datetime import timedelta
from .models import Handyman
from services.models import Service
from locations.models import Location
from services.serializers import ServiceSerializer
from django.core.files.base import ContentFile


class Base64ImageField(serializers.ImageField):
    """Custom field to handle base64 image uploads"""
    
    def to_internal_value(self, data):
        print(f'[HandymanBase64ImageField] Received data type: {type(data)}')
        print(f'[HandymanBase64ImageField] Data preview: {str(data)[:100]}...')
        
        # Handle base64 string
        if isinstance(data, str) and data.startswith('data:image/'):
            print('[HandymanBase64ImageField] Processing base64 image...')
            try:
                # Extract the base64 data
                format, imgstr = data.split(';base64,') 
                ext = format.split('/')[-1]
                
                print(f'[HandymanBase64ImageField] Image format: {format}, extension: {ext}')
                
                # Decode base64
                img_data = base64.b64decode(imgstr)
                print(f'[HandymanBase64ImageField] Decoded {len(img_data)} bytes')
                
                # Create a ContentFile from base64
                filename = f'handyman_{timezone.now().strftime("%Y%m%d_%H%M%S")}.{ext}'
                image_file = ContentFile(img_data, name=filename)
                
                print(f'[HandymanBase64ImageField] Created file: {filename}')
                return super().to_internal_value(image_file)
                
            except Exception as e:
                print(f'[HandymanBase64ImageField] Error processing base64: {e}')
                raise serializers.ValidationError(f'Invalid base64 image data: {e}')
        
        # Handle regular file upload
        return super().to_internal_value(data)


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
    thumbnail    = Base64ImageField(required=False, allow_null=True)

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
                  'is_online', 'last_seen', 'is_verified', 'is_available',
                  'average_rating', 'total_ratings']

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
    thumbnail = Base64ImageField(required=False, allow_null=True)
    availability = FlexibleJSONField(required=False)

    class Meta:
        model  = Handyman
        fields = ['username', 'email', 'phone', 'bio', 'availability',
                  'thumbnail', 'services', 'location', 'is_available', 'password']
        extra_kwargs = {
            'password':     {'write_only': True, 'required': False},
            'username':     {'required': False},
            'email':        {'required': False},
            'phone':        {'required': False},
            'bio':          {'required': False},
            'is_available': {'required': False},
        }

    def update(self, instance, validated_data):
        print(f'[HandymanUpdateSerializer] Updating handyman: {instance.username}')
        print(f'[HandymanUpdateSerializer] Validated data keys: {list(validated_data.keys())}')
        
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
                print(f'[HandymanUpdateSerializer] Set location: {loc}')
            except Location.DoesNotExist:
                print(f'[HandymanUpdateSerializer] Location not found: {location_value}')

        for attr, value in validated_data.items():
            print(f'[HandymanUpdateSerializer] Setting {attr}: {type(value)}')
            setattr(instance, attr, value)

        if password:
            print('[HandymanUpdateSerializer] Setting new password')
            instance.set_password(password)
        if services is not None:
            print(f'[HandymanUpdateSerializer] Setting {len(services)} services')
            instance.services.set(services)

        instance.save()
        print(f'[HandymanUpdateSerializer] Handyman saved successfully')
        return instance