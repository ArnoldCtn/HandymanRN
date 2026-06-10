from rest_framework import viewsets, permissions, status, views
from rest_framework.response import Response
from .models import Favorite
from .serializers import FavoriteSerializer
from handymen.models import Handyman
from handymen.views import HandymanJWTAuthentication
from django.contrib.auth import get_user_model

User = get_user_model()

class FavoriteViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = FavoriteSerializer

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        handyman_id = request.data.get('handyman_id')
        if not handyman_id:
            return Response({'error': 'handyman_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            handyman = Handyman.objects.get(id=handyman_id)
        except Handyman.DoesNotExist:
            return Response({'error': 'Handyman not found'}, status=status.HTTP_404_NOT_FOUND)
            
        favorite, created = Favorite.objects.get_or_create(user=request.user, handyman=handyman)
        
        if created:
            return Response(FavoriteSerializer(favorite).data, status=status.HTTP_201_CREATED)
        return Response({'message': 'Already in favorites'}, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        handyman_id = kwargs.get('pk')
        Favorite.objects.filter(user=request.user, handyman_id=handyman_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class FavoritedByListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [HandymanJWTAuthentication]

    def get(self, request):
        # A handyman wants to see which users favorited them
        if not hasattr(request.user, 'is_verified'): 
             return Response({'error': 'Only handymen can access this'}, status=status.HTTP_403_FORBIDDEN)
        
        favorites = Favorite.objects.filter(handyman=request.user).select_related('user')
        
        data = []
        for fav in favorites:
            user = fav.user
            data.append({
                'user': user.username,
                'thumbnail': request.build_absolute_uri(user.thumbnail.url) if user.thumbnail else None,
                'created_at': fav.created_at
            })
        
        return Response({
            'total': favorites.count(),
            'favorites': data
        })
