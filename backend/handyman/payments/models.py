from django.db import models
from django.conf import settings
from handymen.models import Handyman
from bookings.models import Booking


class Payment(models.Model):
    STATUS_CHOICES = [
        ('pending',   'Pending'),
        ('collected', 'Collected'),   # user paid successfully
        ('split',     'Split'),       # handyman payout sent
        ('failed',    'Failed'),
        ('refunded',  'Refunded'),
    ]
    METHOD_CHOICES = [
        ('mtn',    'MTN Money'),
        ('orange', 'Orange Money'),
    ]

    booking        = models.ForeignKey(
        Booking, on_delete=models.PROTECT,
        related_name='payment', null=True, blank=True
    )
    user           = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT, related_name='payments',
        null=True, blank=True

    )
    handyman       = models.ForeignKey(
        Handyman, on_delete=models.PROTECT, related_name='received_payments',
        null=True, blank=True
    )



    # ── Amounts ──────────────────────────────────────────
    gross_amount    = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    platform_fee    = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)  # 30%
    handyman_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)  # 70%

    # ── Payment method ────────────────────────────────────
    method          = models.CharField(max_length=10, choices=METHOD_CHOICES,default='mtn')
    payer_number    = models.CharField(max_length=20, null=True)   # user's phone paying
    handyman_payment_number = models.CharField(max_length=20, null=True, blank=True)

    # ── MeSomb references ─────────────────────────────────
    collect_ref     = models.CharField(max_length=100, blank=True, null=True)  # collection tx id
    payout_ref      = models.CharField(max_length=100, blank=True, null=True)  # payout tx id
    
    # ── Automatic Payout Status ──────────────────────────────
    handyman_withdrawal_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('processing', 'Processing'),
            ('completed', 'Completed'),
            ('failed', 'Failed')
        ],
        default='pending'
    )
    collect_status  = models.CharField(max_length=30, blank=True, null=True)
    payout_status   = models.CharField(max_length=30, blank=True, null=True)

    # Track admin withdrawal requests  
    admin_withdrawal_requested = models.BooleanField(default=False)
    admin_withdrawal_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    admin_withdrawal_number = models.CharField(max_length=20, null=True, blank=True)
    admin_withdrawal_status = models.CharField(max_length=20, default='pending')  # pending/processed

    status          = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    error_message   = models.TextField(blank=True, null=True)

    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Payment #{self.id} | {self.gross_amount} FCFA | {self.status}'

class Wallet(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='wallet')
    handyman = models.OneToOneField(Handyman, on_delete=models.CASCADE, null=True, blank=True, related_name='wallet')
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    # Handyman specific fields
    total_earned_gross = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_earned_net = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_app_commissions = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        owner = self.user.username if self.user else self.handyman.username
        return f"Wallet of {owner} | {self.balance} FCFA"

class Transaction(models.Model):
    TRANSACTION_TYPE = [
        ('credit', 'Credit'),
        ('debit', 'Debit'),
    ]
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('success', 'Success'),
        ('failed', 'Failed'),
    ]

    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='transactions')
    payment = models.ForeignKey(Payment, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPE)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    description = models.CharField(max_length=255)
    
    # For user transactions: which handyman was paid
    # For handyman transactions: from which user was paid
    related_user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    related_handyman = models.ForeignKey(Handyman, on_delete=models.SET_NULL, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.transaction_type} | {self.amount} | {self.status}"
