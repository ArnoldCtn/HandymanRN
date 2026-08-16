from decimal import Decimal

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from payments.models import Payment, Wallet, Transaction
from bookings.models import Booking


class Command(BaseCommand):
    help = ("Reconcile a stuck 'pending' Payment/Booking after MeSomb already collected. "
            "Idempotent: refuses to double-credit a non-pending payment.")

    def add_arguments(self, parser):
        parser.add_argument('--payment', type=int, dest='payment_id', help='Payment id to reconcile')
        parser.add_argument('--booking', type=int, dest='booking_id', help='Booking id whose latest payment should be reconciled')
        parser.add_argument('--collect-ref', dest='collect_ref', default=None,
                            help='MeSomb transaction reference to store (e.g. fin_trx_id from the webhook payload)')

    def handle(self, *args, **options):
        payment = self._resolve_payment(options)
        if payment is None:
            raise CommandError('Provide --payment <id> or --booking <id>')

        booking = payment.booking
        if booking is None:
            raise CommandError(f'Payment {payment.id} has no booking')

        if payment.status in ('collected', 'split', 'refunded'):
            self.stdout.write(self.style.WARNING(
                f'Payment {payment.id} already {payment.status} - nothing to do'))
            return
        if payment.status != 'pending':
            self.stdout.write(self.style.WARNING(
                f'Payment {payment.id} status is {payment.status!r} - not reconciling'))
            return

        collect_ref = options['collect_ref'] or payment.collect_ref
        gross = Decimal(str(payment.gross_amount))
        handyman_amt = Decimal(str(payment.handyman_amount))
        platform_fee = Decimal(str(payment.platform_fee))

        with transaction.atomic():
            payment.status = 'collected'
            payment.collect_status = 'SUCCESS'
            if collect_ref:
                payment.collect_ref = collect_ref
            payment.save()

            booking.status = 'completed'
            booking.completed_at = timezone.now()
            booking.save()

            service_name = booking.service.name if booking.service else 'Service'

            wallet, _ = Wallet.objects.get_or_create(user=booking.user)
            Transaction.objects.create(
                wallet=wallet,
                payment=payment,
                amount=gross,
                transaction_type='debit',
                status='success',
                description=f'Payment for booking #{booking.id} - {service_name}',
                related_handyman=booking.handyman,
            )

            handyman_wallet, _ = Wallet.objects.get_or_create(handyman=booking.handyman)
            handyman_wallet.balance += handyman_amt
            handyman_wallet.total_earned_gross += gross
            handyman_wallet.total_earned_net += handyman_amt
            handyman_wallet.total_app_commissions += platform_fee
            handyman_wallet.save()

            Transaction.objects.create(
                wallet=handyman_wallet,
                payment=payment,
                amount=handyman_amt,
                transaction_type='credit',
                status='success',
                description=f'Payment received for booking #{booking.id} - {service_name}',
                related_user=booking.user,
            )

        self.stdout.write(self.style.SUCCESS(
            f'Reconciled payment {payment.id} (booking {booking.id}): '
            f'gross={gross}, platform_fee={platform_fee}, handyman={handyman_amt}'))

    def _resolve_payment(self, options):
        if options.get('payment_id'):
            return Payment.objects.filter(id=options['payment_id']).first()
        if options.get('booking_id'):
            booking = Booking.objects.filter(id=options['booking_id']).first()
            if booking is None:
                return None
            return booking.payment.order_by('-id').first()
        return None
