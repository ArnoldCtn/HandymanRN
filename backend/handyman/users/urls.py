from django.urls import path
from .views import (SignInView, SignUpView, UserUpdateView, MarkOnlineView, MarkOfflineView,
                    PasswordResetRequestView, PasswordResetVerifyView, PasswordResetVerifyAndConfirmView)
from .oauth_views import google_oauth_login
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
     path('signin/', SignInView.as_view()),
     path('signup/', SignUpView.as_view()),
     path('auth/google/', google_oauth_login, name='google_oauth_login'),
     path('me/update/', UserUpdateView.as_view()),
     path('me/online/', MarkOnlineView.as_view()),
     path('me/offline/', MarkOfflineView.as_view()),
     path('token/refresh/', TokenRefreshView.as_view()),
     path('password-reset/request/', PasswordResetRequestView.as_view()),
     path('password-reset/verify/', PasswordResetVerifyView.as_view()),
     path('password-reset/verify-and-confirm/', PasswordResetVerifyAndConfirmView.as_view()),
]
