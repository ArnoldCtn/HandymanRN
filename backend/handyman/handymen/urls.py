# handymen/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (HandymanSignInView, HandymanSignUpView, HandymanTokenRefreshView,
                    HandymanUpdateView, HandymanMarkOnlineView,
                    HandymanMarkOfflineView,HandymanAvailableServicesView,HandymanAvailableLocationsView,HandymanTokenRefreshView,
                    HandymanListByServiceView,HandymanDetailView)

urlpatterns = [
    path('signin/',        HandymanSignInView.as_view()),
    path('signup/',        HandymanSignUpView.as_view()),
    path('me/update/',     HandymanUpdateView.as_view()),
    path('me/online/',     HandymanMarkOnlineView.as_view()),
    path('me/offline/',    HandymanMarkOfflineView.as_view()),
    path('token/refresh/', HandymanTokenRefreshView.as_view()),  # ← replaced
    # path('token/refresh/', TokenRefreshView.as_view()),
    path('services/',      HandymanAvailableServicesView.as_view()),   # ← add
    path('locations/',     HandymanAvailableLocationsView.as_view()),

    path('services/<int:service_id>/handymen/', HandymanListByServiceView.as_view(), name='handymen-by-service'),
    path('<int:pk>/', HandymanDetailView.as_view(), name='handymanDetail'),
]