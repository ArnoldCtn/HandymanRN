from django.contrib import admin
from .models import Payment, Wallet, Transaction

@admin.register(Wallet)
class WalletAdmin(admin.ModelAdmin):
    list_display = ['get_owner', 'balance', 'total_earned_gross', 'total_earned_net', 'total_app_commissions']
    search_fields = ['user__username', 'handyman__username']
    
    def get_owner(self, obj):
        return obj.user.username if obj.user else obj.handyman.username
    get_owner.short_description = 'Owner'

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['wallet', 'amount', 'transaction_type', 'status', 'created_at']
    list_filter = ['transaction_type', 'status']
    search_fields = ['wallet__user__username', 'wallet__handyman__username', 'description']

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['id', 'booking', 'user', 'handyman', 'gross_amount', 'status', 'created_at']
    list_filter = ['status', 'method']
    search_fields = ['user__username', 'handyman__username', 'booking__id']
