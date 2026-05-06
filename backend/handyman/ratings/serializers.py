# ratings/serializers.py
from rest_framework import serializers
from .models import Rating
from handymen.serializers import HandymanSerializer


class RatingSerializer(serializers.ModelSerializer):
    handyman_info = serializers.SerializerMethodField()
    user_info = serializers.SerializerMethodField()

    class Meta:
        model = Rating
        fields = ['id', 'handyman', 'handyman_info', 'user', 'user_info', 'rating', 'review', 'created_at', 'updated_at']
        read_only_fields = ['user', 'created_at', 'updated_at']
    
    def get_handyman_info(self, obj):
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
            'thumbnail': obj.handyman.thumbnail.url if obj.handyman.thumbnail else None,
        }

    def get_user_info(self, obj):
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
            'thumbnail': thumb,
        }

    
    def validate_rating(self, value):
        if value < 1 or value > 10:
            raise serializers.ValidationError("Rating must be between 1 and 10")
        return value


class RatingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rating
        fields = ['handyman', 'rating', 'review']
    
    def validate_rating(self, value):
        if value < 1 or value > 10:
            raise serializers.ValidationError("Rating must be between 1 and 10")
        return value
    
    def create(self, validated_data):
        user = self.context['request'].user
        handyman = validated_data['handyman']
        
        print(f"[RATING] Creating rating: user={user.username}, handyman={handyman.username}, rating={validated_data['rating']}")
        
        # Check if user already rated this handyman
        try:
            existing_rating = Rating.objects.get(user=user, handyman=handyman)
            print(f"[RATING] Updating existing rating: id={existing_rating.id}")
            existing_rating.rating = validated_data['rating']
            existing_rating.review = validated_data.get('review', '')
            existing_rating.save()
            return existing_rating
        except Rating.DoesNotExist:
            print(f"[RATING] Creating new rating")
            return Rating.objects.create(user=user, **validated_data)


class HandymanRatingSummarySerializer(serializers.ModelSerializer):
    average_rating = serializers.DecimalField(max_digits=3, decimal_places=2, read_only=True)
    total_ratings = serializers.IntegerField(read_only=True)
    ratings_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Rating
        fields = ['average_rating', 'total_ratings', 'ratings_count']
    
    def get_ratings_count(self, obj):
        return Rating.objects.filter(handyman=obj).count()
