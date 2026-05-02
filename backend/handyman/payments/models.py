from django.db import models
from bookings.models import Booking

class Payment(models.Model):
    PAYMENT_STATUS = [
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    ]

    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='payment')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='pending')
    
    transaction_id = models.CharField(max_length=100, null=True, blank=True)
    payment_gateway = models.CharField(max_length=50, default='flutterwave')  # or mesomb
    payment_method = models.CharField(max_length=50, null=True, blank=True)   # MTN, Orange, Card, etc.

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Payment for Booking #{self.booking.id} - {self.status}"