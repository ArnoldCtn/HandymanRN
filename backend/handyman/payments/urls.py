from django.urls import path
from . import admin_views, webhooks

app_name = 'payments'

urlpatterns = [
    # Admin withdrawal endpoints
    path('withdrawal-dashboard/', admin_views.admin_withdrawal_view, name='withdrawal_dashboard'),
    path('process-withdrawal/', admin_views.process_withdrawal_view, name='process_withdrawal'),
    path('refresh-mesomb-balance/', admin_views.refresh_mesomb_balance_view, name='refresh_mesomb_balance'),
    
    # Webhook endpoints
    path('webhooks/success/', webhooks.payment_success_webhook, name='payment_success_webhook'),
    path('webhooks/failed/', webhooks.payment_failed_webhook, name='payment_failed_webhook'),
    path('webhooks/transfer/', webhooks.transfer_success_webhook, name='transfer_success_webhook'),
    path('webhooks/balance/', webhooks.balance_update_webhook, name='balance_update_webhook'),
]