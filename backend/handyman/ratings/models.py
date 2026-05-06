# ratings/models.py

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.conf import settings
from handymen.models import Handyman


class Rating(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='ratings_given'
    )
    
    handyman = models.ForeignKey(
        Handyman, 
        on_delete=models.CASCADE, 
        related_name='ratings_received'
    )

    rating = models.PositiveSmallIntegerField(
        validators=[
            MinValueValidator(1, message="Rating must be at least 1"),
            MaxValueValidator(10, message="Rating must be at most 10")
        ]
    )
    review = models.TextField(blank=True, null=True) 

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['user', 'handyman']  # One rating per user-handyman pair

    def __str__(self):
        return f"{self.user.username} rated {self.handyman.username}: {self.rating}/10"