from django.db import models
from django.conf import settings
from handymen.models import Handyman


class Report(models.Model):
    REASON_CHOICES = [
        ('arnaque', 'Arnaque'),
        ('spam', 'Spam'),
        ('comportement_inapproprie', 'Comportement inapproprié'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('reviewed', 'Examiné'),
        ('resolved', 'Résolu'),
    ]

    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reports_made'
    )
    reported_handyman = models.ForeignKey(
        Handyman,
        on_delete=models.CASCADE,
        related_name='reports_received'
    )
    reason = models.CharField(max_length=50, choices=REASON_CHOICES)
    additional_details = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Signalement'
        verbose_name_plural = 'Signalements'

    def __str__(self):
        return f"#{self.id} {self.reporter} → {self.reported_handyman} | {self.get_reason_display()}"