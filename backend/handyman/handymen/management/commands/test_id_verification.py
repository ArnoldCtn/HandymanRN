"""
Dev helper: test ID verification logic without the mobile app.

Usage (mock — no Gemini, no real photos):
  set ID_VERIFICATION_MOCK=true
  python manage.py test_id_verification --username YOUR_HANDYMAN_USERNAME

Usage (real Gemini — needs two image files):
  python manage.py test_id_verification --username USER \\
    --front path/to/front.jpg --back path/to/back.jpg \\
    --name "Jean Dupont"
"""
from django.core.management.base import BaseCommand, CommandError

from handymen.models import Handyman
from handymen.id_verification import verify_id_card


class Command(BaseCommand):
    help = 'Test handyman ID verification (mock or with image files)'

    def add_arguments(self, parser):
        parser.add_argument('--username', required=True, help='Handyman username')
        parser.add_argument('--name', default='', help='Legal name to match (defaults to username)')
        parser.add_argument('--front', default='', help='Path to front ID image')
        parser.add_argument('--back', default='', help='Path to back ID image')

    def handle(self, *args, **options):
        username = options['username'].strip().lower()
        try:
            handyman = Handyman.objects.get(username=username)
        except Handyman.DoesNotExist:
            raise CommandError(f'Handyman "{username}" not found')

        form_name = options['name'].strip() or handyman.legal_name or handyman.username
        if not handyman.birth_date:
            raise CommandError('Handyman has no birth_date — set it in admin or re-signup.')

        front_path = options['front']
        back_path = options['back']

        if front_path and back_path:
            with open(front_path, 'rb') as f:
                front_bytes = f.read()
            with open(back_path, 'rb') as b:
                back_bytes = b.read()
        else:
            # 1x1 minimal JPEG for mock mode
            import os
            if os.getenv('ID_VERIFICATION_MOCK', '').lower() not in ('1', 'true', 'yes'):
                raise CommandError(
                    'Without --front/--back, set ID_VERIFICATION_MOCK=true in .env for mock test.'
                )
            front_bytes = back_bytes = (
                b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00'
                b'\xff\xd9'
            )

        result = verify_id_card(
            form_name=form_name,
            form_birth_date=handyman.birth_date,
            form_gender=handyman.gender,
            front_bytes=front_bytes,
            front_mime='image/jpeg',
            back_bytes=back_bytes,
            back_mime='image/jpeg',
            exclude_handyman_id=handyman.pk,
        )

        self.stdout.write(self.style.SUCCESS('Verification OK:'))
        for k, v in result.items():
            self.stdout.write(f'  {k}: {v}')
