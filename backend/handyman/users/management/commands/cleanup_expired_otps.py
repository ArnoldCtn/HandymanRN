from django.core.management.base import BaseCommand
from django.db import models
from django.utils import timezone
from datetime import timedelta
from users.models import PasswordResetOTP


class Command(BaseCommand):
    help = 'Clean up expired and used OTPs older than 24 hours'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )

    def handle(self, *args, **options):
        # Delete OTPs that are either:
        # 1. Expired and older than 24 hours
        # 2. Used and older than 24 hours
        # 3. Locked and older than 24 hours
        
        cutoff_time = timezone.now() - timedelta(hours=24)
        
        expired_otps = PasswordResetOTP.objects.filter(
            expires_at__lt=timezone.now(),
            created_at__lt=cutoff_time
        )
        
        used_otps = PasswordResetOTP.objects.filter(
            is_used=True,
            created_at__lt=cutoff_time
        )
        
        locked_otps = PasswordResetOTP.objects.filter(
            attempts__gte=models.F('max_attempts'),
            created_at__lt=cutoff_time
        )
        
        # Combine all querysets (using union to avoid duplicates)
        all_otps_to_delete = expired_otps.union(used_otps, locked_otps)
        
        count = all_otps_to_delete.count()
        
        if options['dry_run']:
            self.stdout.write(
                self.style.WARNING(f'DRY RUN: Would delete {count} expired/used OTPs')
            )
            self.stdout.write('Breakdown:')
            self.stdout.write(f'  - Expired OTPs: {expired_otps.count()}')
            self.stdout.write(f'  - Used OTPs: {used_otps.count()}')
            self.stdout.write(f'  - Locked OTPs: {locked_otps.count()}')
        else:
            if count > 0:
                deleted_count, _ = all_otps_to_delete.delete()
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully deleted {deleted_count} expired/used OTPs')
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS('No expired OTPs to clean up')
                )