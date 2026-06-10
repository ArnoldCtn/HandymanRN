from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FavoriteViewSet, FavoritedByListView

router = DefaultRouter()
router.register(r'', FavoriteViewSet, basename='favorite')

urlpatterns = [
    path('favorited-by/', FavoritedByListView.as_view(), name='favorited-by'),
    path('', include(router.urls)),
]
