from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Sum, Count
from django.utils.safestring import mark_safe
from .models import Payment
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.contrib import messages


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'user', 'handyman', 'amount_display', 
        'status_badge', 'method', 'created_at', 'withdrawal_status'
    ]
    list_filter = [
        'status', 'method', 'collect_status', 'payout_status',
        'admin_withdrawal_status', 'created_at'
    ]
    search_fields = [
        'user__username', 'handyman__username', 'payer_number',
        'collect_ref', 'payout_ref'
    ]
    readonly_fields = [
        'collect_ref', 'payout_ref', 'collect_status', 
        'payout_status', 'created_at', 'updated_at'
    ]
    ordering = ['-created_at']
    
    # Admin withdrawal action
    actions = ['mark_for_withdrawal']
    
    fieldsets = (
        ('Payment Info', {
            'fields': ('booking', 'user', 'handyman', 'method')
        }),
        ('Amounts', {
            'fields': ('gross_amount', 'platform_fee', 'handyman_amount')
        }),
        ('Phone Numbers', {
            'fields': ('payer_number', 'handyman_payment_number')
        }),
        ('MeSomb References', {
            'fields': ('collect_ref', 'payout_ref', 'collect_status', 'payout_status'),
            'classes': ('collapse',)
        }),
        ('Admin Withdrawal', {
            'fields': (
                'admin_withdrawal_requested', 
                'admin_withdrawal_amount',
                'admin_withdrawal_number',
                'admin_withdrawal_status'
            ),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('status', 'error_message')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def amount_display(self, obj):
        return format_html(
            '<div style="text-align:right">'
            '<div>Total: <strong>{}</strong></div>'
            '<div style="color:#6b7280;font-size:11px">Platform: {}</div>'
            '<div style="color:#22c55e;font-size:11px">Handyman: {}</div>'
            '</div>',
            obj.gross_amount,
            obj.platform_fee,
            obj.handyman_amount
        )
    amount_display.short_description = 'Amount Breakdown'
    
    def status_badge(self, obj):
        colors = {
            'pending': '#f59e0b',
            'collected': '#3b82f6', 
            'split': '#8b5cf6',
            'failed': '#ef4444',
            'refunded': '#6b7280'
        }
        color = colors.get(obj.status, '#6b7280')
        return format_html(
            '<span style="background:{};color:white;padding:3px 10px;'
            'border-radius:12px;font-size:12px;font-weight:600">'
            '{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'
    
    def withdrawal_status(self, obj):
        if obj.admin_withdrawal_requested:
            if obj.admin_withdrawal_status == 'processed':
                return format_html(
                    '<span style="background:#22c55e;color:white;padding:2px 8px;'
                    'border-radius:10px;font-size:11px">Withdrawn</span>'
                )
            else:
                return format_html(
                    '<span style="background:#f59e0b;color:white;padding:2px 8px;'
                    'border-radius:10px;font-size:11px">Pending</span>'
                )
        return '—'
    withdrawal_status.short_description = 'Withdrawal'
    
    def mark_for_withdrawal(self, request, queryset):
        """Mark selected payments for admin withdrawal"""
        total_amount = sum(p.platform_fee for p in queryset if p.status == 'split')
        count = queryset.filter(status='split').update(
            admin_withdrawal_requested=True,
            admin_withdrawal_status='pending'
        )
        
        if count > 0:
            self.message_user(
                request, 
                f'Marked {count} payments for withdrawal (Total: {total_amount} XAF)',
                messages.SUCCESS
            )
        else:
            self.message_user(
                request,
                'No split payments found to mark for withdrawal',
                messages.WARNING
            )
    mark_for_withdrawal.short_description = 'Mark selected for withdrawal'
    
    # Revenue dashboard in admin index
    def changelist_view(self, request, extra_context=None):
        # Calculate revenue metrics
        total_revenue = Payment.objects.filter(
            status__in=['collected', 'split']
        ).aggregate(total=Sum('platform_fee'))['total'] or 0
        
        pending_withdrawals = Payment.objects.filter(
            admin_withdrawal_requested=True,
            admin_withdrawal_status='pending'
        ).aggregate(total=Sum('platform_fee'))['total'] or 0
        
        failed_payments = Payment.objects.filter(status='failed').count()
        recent_payments = Payment.objects.order_by('-created_at')[:5]
        
        extra_context = extra_context or {}
        extra_context.update({
            'total_revenue': total_revenue,
            'pending_withdrawals': pending_withdrawals,
            'failed_payments': failed_payments,
            'recent_payments': recent_payments,
        })
        
        return super().changelist_view(request, extra_context)



# Custom admin site template for revenue dashboard
from django.urls import reverse
from django.utils.html import format_html

class PaymentAdmin(admin.ModelAdmin):
    # ... existing code ...
    
    def changelist_view(self, request, extra_context=None):
        # Add withdrawal dashboard link
        extra_context = extra_context or {}
        extra_context['withdrawal_dashboard_url'] = '/payments/withdrawal-dashboard/'
        return super().changelist_view(request, extra_context)

# Custom admin site template for revenue dashboard
admin.site.site_header = "Handyman Platform Admin"
admin.site.site_title = "Admin Portal"
admin.site.index_title = "Welcome to Handyman Platform Administration"
