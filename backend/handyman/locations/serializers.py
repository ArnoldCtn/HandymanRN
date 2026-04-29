from rest_framework import serializers
from .models import Location

class LocationSerializer(serializers.ModelSerializer):

    class Meta:
        model = Location
        fields = ['id','location','region','handyman_per_location','created_at']
        read_only_fields = ['id','created_at']

    
    
