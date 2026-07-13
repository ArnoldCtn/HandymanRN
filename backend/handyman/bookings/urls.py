# bookings/urls.py
from django.urls import path
from .views import BookingListCreateView, BookingDetailView, BookingAcceptDeclineView, BookingModifyPriceView, PaymentStatusView

urlpatterns = [
    path('', BookingListCreateView.as_view(), name='booking-list-create'),
    path('<int:pk>/', BookingDetailView.as_view(), name='booking-detail'),
    path('<int:pk>/action/', BookingAcceptDeclineView.as_view(), name='booking-action'),
    path('<int:pk>/modify-price/', BookingModifyPriceView.as_view(), name='booking-modify-price'),
    path('<int:pk>/payment-status/', PaymentStatusView.as_view(), name='payment-status'),
]
