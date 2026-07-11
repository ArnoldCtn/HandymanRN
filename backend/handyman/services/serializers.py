from rest_framework import serializers
from .models import Service, Category

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id','service','name','description','price','created_at']
        read_only_fields = ['id','created_at']

class ServiceSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = ['id','name','description','image','created_at']
        read_only_fields = ['id','created_at']

    
    def get_image(self,obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
