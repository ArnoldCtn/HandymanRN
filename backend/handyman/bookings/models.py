# bookings/models.py

from datetime import timezone

from django.db import models
from django.conf import settings
from handymen.models import Handyman
from services.models import Service
from locations.models import Location


class Booking(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
        ('paid', 'Paid'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='bookings_as_user'
    )
    
    handyman = models.ForeignKey(
        Handyman, 
        on_delete=models.CASCADE, 
        related_name='bookings_as_handyman'
    )

    service = models.ForeignKey(Service, on_delete=models.PROTECT)
    location = models.ForeignKey(Location, on_delete=models.PROTECT, null=True, blank=True)

    # Core booking details
    scheduled_date = models.DateTimeField()           # Full datetime (date + time)
    job_description = models.TextField(blank=True, null=True)   # What the user wants done

    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending'
    )

    # Important timestamps
    completed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    # Reason for cancellation (especially useful for handyman)
    cancellation_reason = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Booking"
        verbose_name_plural = "Bookings"

    def __str__(self):
        return f"Booking #{self.id} | {self.user} → {self.handyman} | {self.status}"

    @property
    def is_past(self):
        """Check if the booking date has already passed"""
        return self.scheduled_date < timezone.now()

    @property
    def can_be_cancelled(self):
        """Logic to check if booking can still be cancelled"""
        return self.status in ['pending', 'accepted']