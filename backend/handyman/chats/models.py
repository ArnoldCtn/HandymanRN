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

    message = models.TextField(blank=True)
    image = models.ImageField(upload_to='', null=True, blank=True)
    video = models.FileField(upload_to='', null=True, blank=True)
    video_thumbnail = models.ImageField(upload_to='', null=True, blank=True)
    audio = models.FileField(upload_to='', null=True, blank=True)
    duration = models.IntegerField(default=0)  # Duration in seconds for video/audio
    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Message in Booking #{self.booking.id}"


class SupportConversation(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='support_conversations'
    )
    handyman = models.ForeignKey(
        'handymen.Handyman',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='support_conversations'
    )

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        participant = self.user.username if self.user else self.handyman.username
        return f"Support with {participant}"

    class Meta:
        ordering = ['-updated_at']


class SupportMessage(models.Model):
    conversation = models.ForeignKey(
        SupportConversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )

    # If sender_user and sender_handyman are NULL, and is_from_admin is True, it's the Admin
    sender_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    sender_handyman = models.ForeignKey(
        'handymen.Handyman',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    is_from_admin = models.BooleanField(default=False)
    message = models.TextField(blank=True)
    image = models.ImageField(upload_to='support_images/', null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Support Message in {self.conversation}"

    class Meta:
        ordering = ['created_at']