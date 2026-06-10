from rest_framework import serializers
from .models import Favorite
from handymen.serializers import HandymanSerializer

class FavoriteSerializer(serializers.ModelSerializer):
    handyman = HandymanSerializer(read_only=True)
    class Meta:
        model = Favorite
        fields = ('id', 'user', 'handyman', 'created_at')
        read_only_fields = ('user', 'created_at')
