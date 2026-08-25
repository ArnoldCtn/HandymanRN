from django.contrib import admin
from django.utils.safestring import mark_safe
from .models import Booking


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user', 'handyman', 'service', 'category',
        'scheduled_date', 'status_badge', 'total_amount', 'created_at',
    ]
    list_filter = ['status', 'created_at']
    search_fields = [
        'user__username', 'handyman__user__username',
        'service__name', 'category__name',
    ]
    readonly_fields = ['created_at', 'updated_at', 'completed_at', 'cancelled_at']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']

    fieldsets = (
        ('Parties', {
            'fields': ('user', 'handyman')
        }),
        ('Job Details', {
            'fields': ('service', 'category', 'location', 'scheduled_date', 'job_description')
        }),
        ('Pricing & Status', {
            'fields': ('total_amount', 'status')
        }),
        ('Cancellation', {
            'fields': ('cancellation_reason', 'cancelled_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'completed_at'),
        }),
    )

    def status_badge(self, obj):
        colors = {
            'pending': '#f59e0b',
            'accepted': '#22c55e',
            'declined': '#ef4444',
            'completed': '#6366f1',
            'cancelled': '#9ca3af',
            'paid': '#3b82f6',
        }
        color = colors.get(obj.status, '#6b7280')
        return mark_safe(
            f'<span style="background:{color};color:white;'
            f'padding:3px 10px;border-radius:12px;'
            f'font-size:12px;font-weight:600;">{obj.get_status_display()}</span>'
        )
    status_badge.short_description = 'Status'
