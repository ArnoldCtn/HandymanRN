from django.urls import path
from .views import (
    WalletDetailView, 
    TransactionListView, 
    AdminFinancialOverviewView,
    WithdrawalDashboardView
)
from .webhooks import mesomb_webhook

urlpatterns = [
    path('wallet/', WalletDetailView.as_view(), name='wallet-detail'),
    path('transactions/', TransactionListView.as_view(), name='transaction-list'),
    path('withdrawal_dashboard/', WithdrawalDashboardView.as_view(), name='withdrawal-dashboard'),
    path('financial_overview/', AdminFinancialOverviewView.as_view(), name='financial-overview'),
    path('webhooks/mesomb/', mesomb_webhook, name='mesomb-webhook'),
]
