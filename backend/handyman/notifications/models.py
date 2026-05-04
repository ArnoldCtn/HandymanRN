# notifications/models.py
from django.db import models
from django.conf import settings
from bookings.models import Booking

class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('booking_request', 'New Booking Request'),
        ('booking_accepted', 'Booking Accepted'),
        ('booking_declined', 'Booking Declined'),
        ('booking_completed', 'Booking Completed'),
        ('booking_cancelled', 'Booking Cancelled'),
        ('new_message', 'New Message'),
        ('payment_success', 'Payment Successful'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        null=True,
        blank=True,
        related_name='notifications'
    )
    
    handyman = models.ForeignKey(
        'handymen.Handyman', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='handyman_notifications'
    )

    title = models.CharField(max_length=255)
    body = models.TextField()
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    
    booking = models.ForeignKey(Booking, on_delete=models.SET_NULL, null=True, blank=True)
    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        if self.user:
            return f"{self.title} - User:{self.user.username}"
        elif self.handyman:
            return f"{self.title} - Handyman:{self.handyman.username}"
        return f"{self.title} - Unknown"