from django.contrib import admin
from django.shortcuts import render
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.contrib import messages
from django.db.models import Sum, Count
from django.utils import timezone
from .models import Payment
import requests
import json


def admin_withdrawal_view(request):
    """Dedicated admin page for withdrawals and revenue dashboard"""
    
    # Calculate metrics
    total_revenue = Payment.objects.filter(
        status__in=['collected', 'split']
    ).aggregate(total=Sum('platform_fee'))['total'] or 0
    
    pending_withdrawals = Payment.objects.filter(
        admin_withdrawal_requested=True,
        admin_withdrawal_status='pending'
    ).aggregate(total=Sum('platform_fee'))['total'] or 0
    
    available_for_withdrawal = Payment.objects.filter(
        status='split',
        admin_withdrawal_requested=False
    ).aggregate(total=Sum('platform_fee'))['total'] or 0
    
    failed_payments = Payment.objects.filter(status='failed').count()
    
    # Get recent payments
    recent_payments = Payment.objects.order_by('-created_at')[:10]
    
    # Get withdrawal history
    withdrawal_history = Payment.objects.filter(
        admin_withdrawal_requested=True
    ).order_by('-updated_at')[:10]
    
    # MeSomb balance (mock for now - you'll integrate actual API)
    mesomb_balance = "API Integration Needed"  # Will implement MeSomb API call
    
    context = {
        'total_revenue': total_revenue,
        'pending_withdrawals': pending_withdrawals,
        'available_for_withdrawal': available_for_withdrawal,
        'failed_payments': failed_payments,
        'recent_payments': recent_payments,
        'withdrawal_history': withdrawal_history,
        'mesomb_balance': mesomb_balance,
        'site_header': admin.site.site_header,
        'title': 'Withdrawal & Revenue Dashboard',
    }
    
    return render(request, 'admin/payments/withdrawal_dashboard.html', context)


def process_withdrawal_view(request):
    """Process withdrawal request"""
    if request.method == 'POST':
        withdrawal_amount = request.POST.get('withdrawal_amount')
        withdrawal_number = request.POST.get('withdrawal_number')
        withdrawal_method = request.POST.get('withdrawal_method', 'mtn')
        
        try:
            amount = float(withdrawal_amount)
            if amount <= 0:
                messages.error(request, 'Amount must be greater than 0')
                return HttpResponseRedirect(reverse('admin:withdrawal_dashboard'))
            
            # Check if enough funds are available
            available = Payment.objects.filter(
                status='split',
                admin_withdrawal_requested=False
            ).aggregate(total=Sum('platform_fee'))['total'] or 0
            
            if amount > available:
                messages.error(request, f'Insufficient funds. Available: {available} XAF')
                return HttpResponseRedirect(reverse('admin:withdrawal_dashboard'))
            
            # Mark payments for withdrawal
            payments_to_withdraw = Payment.objects.filter(
                status='split',
                admin_withdrawal_requested=False
            ).order_by('created_at')
            
            remaining_amount = amount
            marked_payments = []
            
            for payment in payments_to_withdraw:
                if remaining_amount <= 0:
                    break
                
                payment.admin_withdrawal_requested = True
                payment.admin_withdrawal_amount = min(payment.platform_fee, remaining_amount)
                payment.admin_withdrawal_number = withdrawal_number
                payment.admin_withdrawal_status = 'pending'
                payment.save()
                
                remaining_amount -= payment.admin_withdrawal_amount
                marked_payments.append(payment)
            
            # TODO: Call MeSomb API here for actual withdrawal
            # mesomb_response = call_mesomb_payout(withdrawal_amount, withdrawal_number, withdrawal_method)
            
            messages.success(
                request, 
                f'Withdrawal request of {amount} XAF processed for {withdrawal_number}. '
                f'Marked {len(marked_payments)} payments.'
            )
            
        except ValueError:
            messages.error(request, 'Invalid amount entered')
        except Exception as e:
            messages.error(request, f'Error processing withdrawal: {str(e)}')
    
    return HttpResponseRedirect(reverse('admin:withdrawal_dashboard'))


def refresh_mesomb_balance_view(request):
    """Refresh MeSomb balance via API"""
    try:
        # TODO: Implement actual MeSomb API call
        # response = call_mesomb_balance_api()
        # balance = response.get('balance', 0)
        
        # For now, mock balance
        balance = "API Integration Needed"
        
        messages.success(request, f'MeSomb balance updated: {balance}')
    except Exception as e:
        messages.error(request, f'Failed to refresh balance: {str(e)}')
    
    return HttpResponseRedirect(reverse('admin:withdrawal_dashboard'))
