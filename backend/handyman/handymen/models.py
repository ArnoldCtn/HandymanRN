from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser, BaseUserManager, PermissionsMixin
)
from django.utils import timezone
from services.models import Service
from locations.models import Location


def upload_handyman_thumbnail(instance, filename):
    path      = f"handyman_thumbnails/{instance.username}"
    extension = filename.split('.')[-1]
    return f"{path}.{extension}" if extension else path


# ── Manager — querying only, no model fields here ────────
class HandymanManager(BaseUserManager):

    def create_user(self, username, email, password=None, **extra):
        if not username: raise ValueError('Username is required')
        if not email:    raise ValueError('Email is required')
        email    = self.normalize_email(email)
        handyman = self.model(username=username, email=email, **extra)
        handyman.set_password(password)
        handyman.save(using=self._db)
        return handyman

    def create_superuser(self, username, email, password=None, **extra):
        extra.setdefault('is_superuser', True)
        return self.create_user(username, email, password, **extra)


# ── Model ─────────────────────────────────────────────────
class Handyman(AbstractBaseUser, PermissionsMixin):

    # ── Fix clash: override related_name on BOTH M2M fields ──
    # This is the ONLY fix needed for the reverse accessor errors
    groups = models.ManyToManyField(
        'auth.Group',
        blank=True,
        related_name='handyman_set',          # ← was 'user_set', now unique
        related_query_name='handyman',
        verbose_name='groups',
        help_text='Groups this handyman belongs to.',
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        blank=True,
        related_name='handyman_set',          # ← was 'user_set', now unique
        related_query_name='handyman',
        verbose_name='user permissions',
    )

    # ── Core fields ──────────────────────────────────────
    username     = models.CharField(max_length=150, unique=True)
    email        = models.EmailField(unique=True)
    phone        = models.CharField(max_length=20,  null=True, blank=True)
    bio          = models.TextField(null=True, blank=True)
    availability = models.JSONField(default=dict, blank=True, null=True)    
    thumbnail    = models.ImageField(
        upload_to=upload_handyman_thumbnail,
        null=True, blank=True
    )

    # ── Relations ────────────────────────────────────────
    # ONE location per handyman (nullable — set after signup)
    location = models.ForeignKey(
        Location,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='handymen'
    )

    # MANY services per handyman — handyman picks from existing services
    services = models.ManyToManyField(
        Service,
        blank=True,
        related_name='handymen'
    )

    # ── Status ───────────────────────────────────────────
    is_online    = models.BooleanField(default=False)
    last_seen    = models.DateTimeField(null=True, blank=True)
    is_available = models.BooleanField(default=True)
    is_verified  = models.BooleanField(default=False)  # admin approves

    # ── 2FA ──────────────────────────────────────────────
    two_fa_enabled = models.BooleanField(default=False)
    two_fa_secret  = models.CharField(max_length=64, blank=True, null=True)

    # ── Django required ───────────────────────────────────
    is_active   = models.BooleanField(default=True)
    is_staff    = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = HandymanManager()

    USERNAME_FIELD  = 'username'
    REQUIRED_FIELDS = ['email']

    class Meta:
        verbose_name        = 'Handyman'
        verbose_name_plural = 'Handymen'

    def __str__(self):
        return self.username

    def mark_online(self):
        self.is_online = True
        self.save(update_fields=['is_online'])

    def mark_offline(self):
        self.is_online = False
        self.last_seen = timezone.now()
        self.save(update_fields=['is_online', 'last_seen'])