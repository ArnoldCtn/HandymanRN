from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser, BaseUserManager, PermissionsMixin
)
from django.utils import timezone
from services.models import Service
from locations.models import Location
# from ratings.models import Rating


def upload_handyman_thumbnail(instance, filename):
    path      = f"handyman_thumbnails/{instance.username}"
    extension = filename.split('.')[-1]
    return f"{path}.{extension}" if extension else path


def upload_handyman_id_card_front(instance, filename):
    path = f"handyman_id_cards/{instance.username}"
    extension = filename.split('.')[-1]
    return f"{path}_front.{extension}" if extension else f"{path}_front"


def upload_handyman_id_card_back(instance, filename):
    path = f"handyman_id_cards/{instance.username}"
    extension = filename.split('.')[-1]
    return f"{path}_back.{extension}" if extension else f"{path}_back"


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

    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
    ]

    ID_VERIFICATION_CHOICES = [
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('failed', 'Failed'),
    ]

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
    legal_name   = models.CharField(
        max_length=255, null=True, blank=True,
        help_text='Full legal name as printed on the government ID',
    )
    birth_date   = models.DateField(null=True, blank=True)
    gender       = models.CharField(
        max_length=10, choices=GENDER_CHOICES, default='male',
    )
    id_number    = models.CharField(
        max_length=64, unique=True, null=True, blank=True,
        help_text='National ID number extracted from ID card',
    )
    id_card_image = models.ImageField(
        upload_to=upload_handyman_id_card_front, null=True, blank=True,
        help_text='Front of national ID card',
    )
    id_card_back_image = models.ImageField(
        upload_to=upload_handyman_id_card_back, null=True, blank=True,
        help_text='Back of national ID card',
    )
    id_verification_status = models.CharField(
        max_length=20, choices=ID_VERIFICATION_CHOICES, default='pending',
    )
    id_verified_at = models.DateTimeField(null=True, blank=True)
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

    # MANY categories per handyman — sub-types within their services
    categories = models.ManyToManyField(
        'services.Category',
        blank=True,
        related_name='handymen'
    )

    average_rating = models.DecimalField(
        max_digits=3,decimal_places=2,null=True,blank=True,
                help_text="Average rating from 1.00 to 10.00"

    )

    total_ratings = models.PositiveIntegerField(default=0)


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


def upload_job_picture(instance, filename):
    path = f"job_pictures/{instance.handyman.username}"
    timestamp = timezone.now().strftime("%Y%m%d_%H%M%S")
    extension = filename.split('.')[-1]
    return f"{path}/{timestamp}.{extension}" if extension else f"{path}/{timestamp}"


class JobPicture(models.Model):
    handyman = models.ForeignKey(Handyman, on_delete=models.CASCADE, related_name='job_pictures')
    image = models.ImageField(upload_to=upload_job_picture)
    description = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Job pic for {self.handyman.username} at {self.created_at}"
