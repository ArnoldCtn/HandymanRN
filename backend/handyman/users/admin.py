from datetime import timedelta

from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from django.utils.safestring import mark_safe
from rest_framework_simplejwt.tokens import RefreshToken

from django.contrib.auth.admin import UserAdmin

from .models import User, PasswordResetOTP

# admin.site.register(User)

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['id','username','email','image_preview',
                    'last_seen_display','status_badge','user_type'
                    ]
    search_fields = ['username','email']
    readonly_fields = ['image_preview']
    list_filter   = ['is_online', 'is_active']
    ordering      = ['-is_online', '-last_seen']

    
    def image_preview(self,obj):
        if obj.thumbnail:
            return format_html(
                '<img src="{}" style="width:60px; height:60px; '
                'object-fit:cover; border-radius:6px;" />',
                obj.thumbnail.url
            )
        return '—'
        image_preview.short_description = 'Image'

    # ── Shows larger preview inside the change form ──
        fieldsets = (
        ('Service Info', {
            'fields': ('name', 'description')
        }),
        ('Image', {
            'fields': ('thumbnail', 'image_preview')
        }),
          ('Status', {
            'fields': ('is_online', 'last_seen', 'thumbnail')
        }),
        
    )
        

     
    # ── Online / Offline badge ───────────────────────────
    def status_badge(self, obj):
        if obj.is_online:
            # mark_safe is fine here — zero variables, fully static string
            return mark_safe(
                '<span style="background:#22c55e;color:white;'
                'padding:3px 10px;border-radius:12px;'
                'font-size:12px;font-weight:600;">● Online</span>'
            )
        return mark_safe(
            '<span style="background:#9ca3af;color:white;'
            'padding:3px 10px;border-radius:12px;'
            'font-size:12px;font-weight:600;">○ Offline</span>'
        )
    status_badge.short_description = 'Status'

    # ── Last seen ────────────────────────────────────────
    def last_seen_display(self, obj):
        if obj.is_online:
            # Static HTML → mark_safe (no variables)
            return mark_safe(
                '<span style="color:#22c55e;font-weight:600;">'
                '● Active now</span>'
            )

        if not obj.last_seen:
            # Static HTML → mark_safe
            return mark_safe(
                '<span style="color:#d1d5db;">Never seen</span>'
            )

        # Has a variable (label) → must use format_html
        delta = timezone.now() - obj.last_seen

        if delta < timedelta(minutes=1):
            label = 'Just now'
        elif delta < timedelta(hours=1):
            m = int(delta.total_seconds() / 60)
            label = f'{m}m ago'
        elif delta < timedelta(days=1):
            h = int(delta.total_seconds() / 3600)
            label = f'{h}h ago'
        elif delta.days < 7:
            label = f'{delta.days}d ago'
        else:
            label = obj.last_seen.strftime('%b %d, %Y')

        # ✅ format_html because `label` is a variable
        return format_html(
            '<span style="color:#6b7280;">{label}</span>',
            label=label
        )
    last_seen_display.short_description = 'Last Seen'


@admin.register(PasswordResetOTP)
class PasswordResetOTPAdmin(admin.ModelAdmin):
    list_display = [
        'email',
        'otp_code',
        'user_type',
        'ip_address',
        'attempts',
        'max_attempts',
        'is_used',
        'is_expired_display',
        'is_locked_display',
        'created_at',
        'expires_at',
        'verified_at'
    ]
    
    list_filter = [
        'user_type',
        'is_used',
        'created_at',
        'expires_at',
    ]
    
    search_fields = ['email', 'otp_code', 'ip_address']
    
    readonly_fields = [
        'email',
        'otp_code',
        'user_type',
        'ip_address',
        'user_agent',
        'attempts',
        'max_attempts',
        'is_used',
        'created_at',
        'expires_at',
        'verified_at',
        'is_expired_display',
        'is_locked_display',
    ]
    
    fieldsets = (
        ('OTP Information', {
            'fields': ('email', 'otp_code', 'user_type', 'is_used')
        }),
        ('Security Tracking', {
            'fields': ('ip_address', 'user_agent', 'attempts', 'max_attempts')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'expires_at', 'verified_at')
        }),
        ('Status', {
            'fields': ('is_expired_display', 'is_locked_display')
        }),
    )
    
    ordering = ['-created_at']
    date_hierarchy = 'created_at'
    
    def is_expired_display(self, obj):
        if obj.is_expired():
            return mark_safe('<span style="color: red; font-weight: bold;">Expired</span>')
        return mark_safe('<span style="color: green;">Active</span>')
    is_expired_display.short_description = 'Status'
    
    def is_locked_display(self, obj):
        if obj.is_locked():
            return mark_safe('<span style="color: red; font-weight: bold;">Locked</span>')
        return mark_safe('<span style="color: green;">Unlocked</span>')
    is_locked_display.short_description = 'Lock Status'
    
    def has_add_permission(self, request):
        return False  # Prevent manual creation of OTPs
    
    def has_change_permission(self, request, obj=None):
        return False  # Prevent editing of OTPs
