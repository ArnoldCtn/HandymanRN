# ratings/urls.py
from django.urls import path
from .views import (
    RatingListCreateView, 
    HandymanRatingsView, 
    handyman_rating_summary,
    user_rating_for_handyman
)

urlpatterns = [
    # User ratings
    path('', RatingListCreateView.as_view(), name='rating-list-create'),
    
    # Handyman specific ratings
    path('handyman/<int:handyman_id>/', HandymanRatingsView.as_view(), name='handyman-ratings'),
    path('handyman/<int:handyman_id>/summary/', handyman_rating_summary, name='handyman-rating-summary'),
    path('handyman/<int:handyman_id>/user-rating/', user_rating_for_handyman, name='user-rating-for-handyman'),
]
