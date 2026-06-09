# ratings/urls.py
from django.urls import path
from .views import (
    RatingListCreateView, 
    HandymanRatingsView, 
    RecentRatingsView,
    handyman_rating_summary,
    user_rating_for_handyman
)

urlpatterns = [
    # User ratings
    path('', RatingListCreateView.as_view(), name='rating-list-create'),
    path('recent/', RecentRatingsView.as_view(), name='recent-ratings'),
    
    # Handyman specific ratings
    path('handyman/<int:handyman_id>/', HandymanRatingsView.as_view(), name='handyman-ratings'),
    path('handyman/<int:handyman_id>/summary/', handyman_rating_summary, name='handyman-rating-summary'),
    path('handyman/<int:handyman_id>/user-rating/', user_rating_for_handyman, name='user-rating-for-handyman'),
]
