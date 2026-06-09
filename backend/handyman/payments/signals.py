from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from handymen.models import Handyman
from .models import Payment, Wallet, Transaction

User = get_user_model()

@receiver(post_save, sender=User)
def create_user_wallet(sender, instance, created, **kwargs):
    if created:
        Wallet.objects.get_or_create(user=instance)

@receiver(post_save, sender=Handyman)
def create_handyman_wallet(sender, instance, created, **kwargs):
    if created:
        Wallet.objects.get_or_create(handyman=instance)

@receiver(post_save, sender=Payment)
def handle_payment_transaction(sender, instance, created, **kwargs):
    """
    When a payment is created or updated, update wallets and transactions.
    """
    if created:
        # Create initial pending transactions
        if instance.user:
            user_wallet, _ = Wallet.objects.get_or_create(user=instance.user)
            Transaction.objects.create(
                wallet=user_wallet,
                payment=instance,
                amount=instance.gross_amount,
                transaction_type='debit',
                status='pending',
                description=f"Payment for booking #{instance.booking.id}",
                related_handyman=instance.handyman
            )
        
        if instance.handyman:
            handyman_wallet, _ = Wallet.objects.get_or_create(handyman=instance.handyman)
            Transaction.objects.create(
                wallet=handyman_wallet,
                payment=instance,
                amount=instance.handyman_amount,
                transaction_type='credit',
                status='pending',
                description=f"Earnings from booking #{instance.booking.id}",
                related_user=instance.user
            )

    else:
        # Payment updated
        if instance.status in ['collected', 'split']:
            # Success! Update transactions and balances
            transactions = Transaction.objects.filter(payment=instance, status='pending')
            for tx in transactions:
                tx.status = 'success'
                tx.save()
                
                # Update balance
                wallet = tx.wallet
                if tx.transaction_type == 'credit':
                    wallet.balance += tx.amount
                    # Handyman specific fields
                    if wallet.handyman:
                        wallet.total_earned_gross += instance.gross_amount
                        wallet.total_earned_net += instance.handyman_amount
                        wallet.total_app_commissions += instance.platform_fee
                else:
                    # For user, we don't necessarily subtract from a 'balance' 
                    # unless they pre-funded, but for history we mark it success.
                    # If you want to track negative balance or something, do it here.
                    pass
                wallet.save()

        elif instance.status == 'failed':
            Transaction.objects.filter(payment=instance, status='pending').update(status='failed')
