from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .oauth_views import google_oauth_login

router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='user')

urlpatterns = [
    path('auth/', include('rest_framework.urls')),
    path('auth/google/', google_oauth_login, name='google_oauth_login'),
    path('', include(router.urls)),
]
