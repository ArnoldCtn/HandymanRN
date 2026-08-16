from decimal import Decimal

from django.conf import settings
from django.core.management.base import BaseCommand

from payments.models import Payment
from payments.services import MeSombService


class Command(BaseCommand):
    help = ('Retry automatic handyman payouts for collected payments whose payout is '
            'pending/failed and whose handyman share is at or above the MeSomb minimum deposit.')

    def add_arguments(self, parser):
        parser.add_argument('--payment', type=int, dest='payment_id', help='Retry only this payment id')
        parser.add_argument('--dry-run', action='store_true', help='List what would be retried without sending')

    def handle(self, *args, **options):
        min_payout = Decimal(str(getattr(settings, 'MESOMB_MIN_PAYOUT', '10')))
        qs = Payment.objects.filter(
            status='collected',
            handyman_withdrawal_status__in=['pending', 'failed', 'processing'],
            handyman__isnull=False,
        ).exclude(handyman_amount__lt=min_payout).order_by('id')

        if options.get('payment_id'):
            qs = qs.filter(id=options['payment_id'])

        total = qs.count()
        self.stdout.write(f'Found {total} payment(s) to retry (minimum payout {min_payout} XAF)')

        if options['dry_run']:
            for p in qs:
                self.stdout.write(
                    f'  would retry payment {p.id} (booking {p.booking_id}, handyman_amount={p.handyman_amount})')
            return

        mesomb = MeSombService()
        ok = skipped = errors = 0
        for payment in qs:
            try:
                if mesomb.process_automatic_payout(payment):
                    ok += 1
                    self.stdout.write(self.style.SUCCESS(f'  payout OK  payment {payment.id}'))
                else:
                    skipped += 1
                    self.stdout.write(self.style.WARNING(f'  payout skipped/failed  payment {payment.id}'))
            except Exception as e:
                errors += 1
                self.stdout.write(self.style.ERROR(f'  payout ERROR  payment {payment.id}: {e}'))

        self.stdout.write(self.style.SUCCESS(f'Done: {ok} ok, {skipped} skipped/failed, {errors} errors'))
