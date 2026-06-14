from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
import random

# Create your models here.


def upload_thumbnail(instance, filename):
    path = f"thumbnails/{instance.username}"
    extension = filename.split('.')[-1]
    if extension:
        path = path + '.' + extension
    return path


class User(AbstractUser):

    class UserType(models.TextChoices):
        CLIENT = 'client',   'Client'

    user_type = models.CharField(
        max_length=20,
        choices=UserType.choices,
        default=UserType.CLIENT,
        null=True, blank=True
    )

    def save(self, *args, **kwargs):
        # Admin/staff have no user_type — it's irrelevant to them
        if self.is_staff or self.is_superuser:
            self.user_type = None
        elif not self.user_type:
            self.user_type = self.UserType.CLIENT
        super().save(*args, **kwargs)

    thumbnail = models.ImageField(
        upload_to=upload_thumbnail,
        null=True,
        blank=True,
    )
    email = models.CharField(unique=True)
    is_online = models.BooleanField(default=False)
    last_seen = models.DateTimeField(null=True, blank=True)
    two_fa_enabled = models.BooleanField(default=False)
    two_fa_secret = models.CharField(max_length=64, blank=True, null=True)

    def __str__(self):
        return self.username

    def mark_online(self):
        self.is_online = True
        self.save(update_fields=['is_online'])

    def mark_offline(self):
        self.is_online = False
        self.last_seen = timezone.now()
        self.save(update_fields=['is_online', 'last_seen'])


class PasswordResetOTP(models.Model):
    email = models.EmailField()
    otp_code = models.CharField(max_length=6)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def is_expired(self):
        return timezone.now() > self.expires_at

    def save(self, *args, **kwargs):
        if not self.otp_code:
            self.otp_code = str(random.randint(100000, 999999))
        if not self.expires_at:
            self.expires_at = timezone.now() + timezone.timedelta(minutes=5)
        super().save(*args, **kwargs)

