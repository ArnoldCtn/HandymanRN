# services/urls.py
from django.urls import path
from .views import ServiceListCreateView, ServiceDetailView, CategoryListCreateView, CategoryDetailView, CategoryByServiceView

urlpatterns = [
    path('', ServiceListCreateView.as_view()),
    path('<int:pk>/', ServiceDetailView.as_view()),

    path('categories/', CategoryListCreateView.as_view()),
    path('categories/<int:pk>/', CategoryDetailView.as_view()),
    path('<int:service_id>/categories/', CategoryByServiceView.as_view()),
]
