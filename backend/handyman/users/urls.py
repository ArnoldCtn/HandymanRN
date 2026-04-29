# from os import name

from django.urls import path
from .views import SignInView, SignUpView, UserUpdateView, MarkOnlineView, MarkOfflineView
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
     path('signin/', SignInView.as_view()),
     path('signup/', SignUpView.as_view()),
     path('me/update/', UserUpdateView.as_view()),
     path('me/online/', MarkOnlineView.as_view()),
     path('me/offline/', MarkOfflineView.as_view()),   # ← add
     path('token/refresh/', TokenRefreshView.as_view()),   # ← add


]
