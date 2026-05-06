from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from django.db.models import Avg, Count
from handymen.models import Handyman
from .models import Rating
from .serializers import RatingSerializer, RatingCreateSerializer
from rest_framework.pagination import PageNumberPagination


class RatingListCreateView(generics.ListCreateAPIView):
    serializer_class = RatingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        print(f"[RATING] Fetching ratings for user: {user.username}")
        return Rating.objects.filter(user=user).order_by('-created_at')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return RatingCreateSerializer
        return RatingSerializer
    
    def perform_create(self, serializer):
        user = self.request.user
        handyman_id = self.request.data.get('handyman')
        rating_value = self.request.data.get('rating')
        review_text = self.request.data.get('review', '')
        
        print(f"[RATING] Create request: user={user.username}, handyman_id={handyman_id}, rating={rating_value}")
        
        # Validate handyman exists
        handyman = get_object_or_404(Handyman, id=handyman_id)
        
        # Check if user already rated this handyman
        try:
            existing_rating = Rating.objects.get(user=user, handyman=handyman)
            print(f"[RATING] Updating existing rating: id={existing_rating.id}")
            existing_rating.rating = rating_value
            existing_rating.review = review_text
            existing_rating.save()
            
            # Update handyman aggregate
            self.update_handyman_rating(handyman)
            
            response_data = RatingSerializer(existing_rating).data
            response_data['message'] = 'Rating updated successfully'
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Rating.DoesNotExist:
            print(f"[RATING] Creating new rating")
            rating = Rating.objects.create(
                user=user,
                handyman=handyman,
                rating=rating_value,
                review=review_text
            )
            
            # Update handyman aggregate
            self.update_handyman_rating(handyman)
            
            response_data = RatingSerializer(rating).data
            response_data['message'] = 'Rating created successfully'
            return Response(response_data, status=status.HTTP_201_CREATED)
    
    def update_handyman_rating(self, handyman):
        """Update handyman's aggregate rating fields"""
        ratings = Rating.objects.filter(handyman=handyman)
        avg_rating = ratings.aggregate(avg=Avg('rating'))['avg']
        total_count = ratings.count()
        
        handyman.average_rating = round(avg_rating, 2) if avg_rating else None
        handyman.total_ratings = total_count
        handyman.save(update_fields=['average_rating', 'total_ratings'])
        
        print(f"[RATING] Updated handyman aggregates: {handyman.username}, avg={handyman.average_rating}, total={handyman.total_ratings}")

class RatingPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = 'limit'
    max_page_size = 20


class HandymanRatingsView(generics.ListAPIView):
    serializer_class = RatingSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = RatingPagination

    
    def get_queryset(self):
        handyman_id = self.kwargs['handyman_id']
        print(f"[RATING] Fetching ratings for handyman: {handyman_id}")
        return Rating.objects.filter(handyman_id=handyman_id).order_by('-created_at')


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def handyman_rating_summary(request, handyman_id):
    """Get rating summary for a handyman"""
    print(f"[RATING] Getting rating summary for handyman: {handyman_id}")
    
    handyman = get_object_or_404(Handyman, id=handyman_id)
    ratings = Rating.objects.filter(handyman=handyman)
    
    # Calculate aggregates
    avg_rating = ratings.aggregate(avg=Avg('rating'))['avg']
    total_count = ratings.count()
    
    # Rating distribution
    distribution = {}
    for i in range(1, 11):
        distribution[str(i)] = ratings.filter(rating=i).count()
    
    data = {
        'handyman_id': handyman.id,
        'handyman_username': handyman.username,
        'average_rating': round(avg_rating, 2) if avg_rating else None,
        'total_ratings': total_count,
        'rating_distribution': distribution,
        'handyman_average_rating': handyman.average_rating,
        'handyman_total_ratings': handyman.total_ratings,
    }
    
    print(f"[RATING] Summary data: {data}")
    return Response(data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_rating_for_handyman(request, handyman_id):
    """Get user's specific rating for a handyman"""
    user = request.user
    handyman = get_object_or_404(Handyman, id=handyman_id)
    
    print(f"[RATING] Getting user rating: user={user.username}, handyman={handyman.username}")
    
    try:
        rating = Rating.objects.get(user=user, handyman=handyman)
        serializer = RatingSerializer(rating)
        return Response(serializer.data)
    except Rating.DoesNotExist:
        return Response({'detail': 'No rating found'}, status=status.HTTP_404_NOT_FOUND)
