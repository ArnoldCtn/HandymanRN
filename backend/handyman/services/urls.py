# services/urls.py
from django.urls import path
from .views import ServiceListCreateView, ServiceDetailView

urlpatterns = [
    path('',      ServiceListCreateView.as_view()),
    path('<int:pk>/', ServiceDetailView.as_view()),
    # path('/<int:pk>/handymen/', HandymanPerService.as_view()),
]