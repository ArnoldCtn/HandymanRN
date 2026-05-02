from django.db import models
from django.conf import settings
from bookings.models import Booking

class BookingMessage(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='messages')
    
    # Who sent the message
    sender_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='sent_messages'
    )
    sender_handyman = models.ForeignKey(
        'handymen.Handyman', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='sent_messages'
    )

    message = models.TextField()
    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Message in Booking #{self.booking.id}"