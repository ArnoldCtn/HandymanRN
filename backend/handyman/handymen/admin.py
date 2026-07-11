from datetime import timedelta
from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django.utils import timezone
from .models import Handyman


@admin.register(Handyman)
class HandymanAdmin(admin.ModelAdmin):
    list_display  = ['id','username', 'email', 'thumbnail_preview',
                     'status_badge', 'last_seen_display',
                     'is_verified', 'is_available', 'location']
    list_filter   = ['is_online', 'is_active',
                     'is_verified', 'is_available']  
    search_fields = ['username', 'email', 'phone']
    ordering      = ['-is_online', '-last_seen']
    readonly_fields = ['thumbnail_preview', 'last_seen']

    # Shows services/categories as checkboxes in the change form
    filter_horizontal = ['services', 'categories']

    fieldsets = (
        ('Account', {
            'fields': ('username', 'email', 'password', 'phone')
        }),
        ('Profile', {
            'fields': ('thumbnail', 'thumbnail_preview',
                       'bio', 'availability', 'location')
        }),
        ('Services', {
            'fields': ('services',)
        }),
        ('Categories', {
            'fields': ('categories',)
        }),
        ('Status', {
            'fields': ('is_online', 'last_seen',
                       'is_verified', 'is_available', 'is_active')
        }),
    )

    def thumbnail_preview(self, obj):
        if obj.thumbnail:
            return format_html(
                '<img src="{url}" style="width:46px;height:46px;'
                'border-radius:50%;object-fit:cover;" />',
                url=obj.thumbnail.url
            )
        initial = obj.username[0].upper() if obj.username else '?'
        return format_html(
            '<div style="width:46px;height:46px;border-radius:50%;'
            'background:#f59e0b;display:flex;align-items:center;'
            'justify-content:center;color:white;font-weight:bold;">'
            '{i}</div>', i=initial
        )
    thumbnail_preview.short_description = 'Avatar'

    def status_badge(self, obj):
        if obj.is_online:
            return mark_safe(
                '<span style="background:#22c55e;color:white;padding:3px 10px;'
                'border-radius:12px;font-size:12px;font-weight:600;">● Online</span>'
            )
        return mark_safe(
            '<span style="background:#9ca3af;color:white;padding:3px 10px;'
            'border-radius:12px;font-size:12px;font-weight:600;">○ Offline</span>'
        )
    status_badge.short_description = 'Status'

    def last_seen_display(self, obj):
        if obj.is_online:
            return mark_safe(
                '<span style="color:#22c55e;font-weight:600;">Active now</span>'
            )
        if not obj.last_seen:
            return mark_safe('<span style="color:#d1d5db;">Never</span>')
        delta = timezone.now() - obj.last_seen
        if delta   < timedelta(minutes=1): label = 'Just now'
        elif delta < timedelta(hours=1):   label = f'{int(delta.total_seconds()/60)}m ago'
        elif delta < timedelta(days=1):    label = f'{int(delta.total_seconds()/3600)}h ago'
        elif delta.days < 7:               label = f'{delta.days}d ago'
        else:                              label = obj.last_seen.strftime('%b %d, %Y')
        return format_html(
            '<span style="color:#6b7280;">{l}</span>', l=label
        )
    last_seen_display.short_description = 'Last Seen'