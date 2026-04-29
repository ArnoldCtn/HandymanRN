from datetime import timedelta

from django.contrib import admin
from django.utils.html import format_html
# Register your models here.
from .models import User
from django.utils import timezone
from django.utils.safestring import mark_safe
from rest_framework_simplejwt.tokens import RefreshToken

from django.contrib.auth.admin import UserAdmin

# admin.site.register(User)

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['username','email','image_preview',
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