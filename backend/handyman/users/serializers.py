from rest_framework import serializers
from .models import User
from django.utils import timezone
from datetime import timedelta
import base64
from django.core.files.base import ContentFile
import re


class Base64ImageField(serializers.ImageField):
    """Custom field to handle base64 image uploads"""

    def to_internal_value(self, data):
        print(f'[Base64ImageField] Received data type: {type(data)}')
        print(f'[Base64ImageField] Data preview: {str(data)[:100]}...')

        # Handle base64 string
        if isinstance(data, str) and data.startswith('data:image/'):
            print('[Base64ImageField] Processing base64 image...')
            try:
                # Extract the base64 data
                format, imgstr = data.split(';base64,')
                ext = format.split('/')[-1]

                print(
                    f'[Base64ImageField] Image format: {format}, extension: {ext}')

                # Decode base64
                img_data = base64.b64decode(imgstr)
                print(f'[Base64ImageField] Decoded {len(img_data)} bytes')

                # Create a ContentFile from base64
                filename = f'profile_{timezone.now().strftime("%Y%m%d_%H%M%S")}.{ext}'
                image_file = ContentFile(img_data, name=filename)

                print(f'[Base64ImageField] Created file: {filename}')
                return super().to_internal_value(image_file)

            except Exception as e:
                print(f'[Base64ImageField] Error processing base64: {e}')
                raise serializers.ValidationError(
                    f'Invalid base64 image data: {e}')

        # Handle regular file upload
        return super().to_internal_value(data)


class SignUpSerializer(serializers.ModelSerializer):
    thumbnail = Base64ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'password',
            'thumbnail',
            'user_type',
        ]

        extra_kwargs = {
            'password': {
                'write_only': True
            },
            'thumbnail': {'required': False},
            'user_type': {'required': False},
        }

    def create(self, validated_data):
        username = validated_data['username'].lower()
        email = validated_data['email'].lower()
        thumbnail = validated_data.pop('thumbnail', None)

        # create new user
        user = User.objects.create(
            username=username,
            email=email,
            thumbnail=thumbnail
        )
        password = validated_data['password']
        user.set_password(password)
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    thumbnail = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'thumbnail',
            'is_online', 'last_seen'
        ]

    def get_thumbnail(self, obj):
        if obj.thumbnail:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.thumbnail.url)
            return obj.thumbnail.url
        return None

    def get_last_seen(self, obj):
        if not obj.last_seen:
            return None
        now = timezone.now()
        delta = now - obj.last_seen

        if delta < timedelta(minutes=1):
            return 'Just Now'
        elif delta < timedelta(hours=1):
            m = int(delta.total_seconds()/60)
            return f'{m} minute{"s" if m > 1 else ""} ago'
        elif delta < timedelta(days=1):
            h = int(delta.total_seconds() / 3600)
            return f'{h} hour{"s" if h > 1 else ""} ago'
        elif delta < timedelta(days=7):
            d = delta.days
            return f'{d} day{"s" if d > 1 else ""} ago'
        else:
            return obj.last_seen.strftime('%b %d, %Y')


class UserUpdateSerializer(serializers.ModelSerializer):
    thumbnail = Base64ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'thumbnail', 'password']
        extra_kwargs = {
            'password':  {'write_only': True, 'required': False},
            'username':  {'required': False},
            'email':     {'required': False},
        }

    def update(self, instance, validated_data):
        print(f'[UserUpdateSerializer] Updating user: {instance.username}')
        print(
            f'[UserUpdateSerializer] Validated data keys: {list(validated_data.keys())}')

        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            print(f'[UserUpdateSerializer] Setting {attr}: {type(value)}')
            setattr(instance, attr, value)

        if password:
            print('[UserUpdateSerializer] Setting new password')
            instance.set_password(password)

        instance.save()
        print(f'[UserUpdateSerializer] User saved successfully')
        return instance
