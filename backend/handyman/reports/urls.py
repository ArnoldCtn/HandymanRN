from django.urls import path
from .views import ReportCreateView, MyReportsView, AllReportsView, ReportDetailView

urlpatterns = [
    path('', ReportCreateView.as_view(), name='report-create'),
    path('mine/', MyReportsView.as_view(), name='my-reports'),
    path('all/', AllReportsView.as_view(), name='all-reports'),
    path('<int:pk>/', ReportDetailView.as_view(), name='report-detail'),
]