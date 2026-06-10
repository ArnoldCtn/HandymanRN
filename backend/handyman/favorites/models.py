from django.db import models
from django.conf import settings
from handymen.models import Handyman

class Favorite(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites')
    handyman = models.ForeignKey(Handyman, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'handyman')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} favorited {self.handyman.username}"
