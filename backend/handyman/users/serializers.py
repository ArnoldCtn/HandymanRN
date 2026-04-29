from rest_framework import serializers
from .models import User
from django.utils import timezone
from datetime import timedelta

class SignUpSerializer(serializers.ModelSerializer):
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
    

    def get_last_seen(self,obj):
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
    class Meta:
        model = User
        fields = ['username', 'email', 'thumbnail', 'password']
        extra_kwargs = {
            'password':  {'write_only': True, 'required': False},
            'thumbnail': {'required': False},
            'username':  {'required': False},
            'email':     {'required': False},
        }

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance

