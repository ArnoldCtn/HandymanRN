"""
Tests for Password Reset OTP System (merged verify+confirm flow)
"""
from django.test import TestCase, Client, override_settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from unittest.mock import patch, MagicMock
import json

from handymen.models import Handyman
from users.models import PasswordResetOTP

User = get_user_model()


class PasswordResetOTPModelTests(TestCase):
    """Test PasswordResetOTP model functionality"""

    def test_otp_generation(self):
        """Test that OTP code is auto-generated with secrets module"""
        otp = PasswordResetOTP.objects.create(email='test@example.com')
        self.assertIsNotNone(otp.otp_code)
        self.assertEqual(len(otp.otp_code), 6)
        self.assertTrue(otp.otp_code.isdigit())

    def test_otp_expiration(self):
        """Test OTP expiration logic"""
        otp = PasswordResetOTP.objects.create(email='test@example.com')
        self.assertFalse(otp.is_expired())

        otp.expires_at = timezone.now() - timedelta(minutes=1)
        otp.save()
        self.assertTrue(otp.is_expired())

    def test_otp_locking(self):
        """Test OTP locking mechanism"""
        otp = PasswordResetOTP.objects.create(email='test@example.com')
        self.assertFalse(otp.is_locked())

        otp.attempts = 3
        otp.max_attempts = 3
        otp.save()
        self.assertTrue(otp.is_locked())

    def test_increment_attempts(self):
        """Test attempt increment functionality"""
        otp = PasswordResetOTP.objects.create(email='test@example.com')
        self.assertEqual(otp.attempts, 0)

        otp.increment_attempts()
        otp.refresh_from_db()
        self.assertEqual(otp.attempts, 1)

    def test_mark_as_used(self):
        """Test marking OTP as used"""
        otp = PasswordResetOTP.objects.create(email='test@example.com')
        self.assertFalse(otp.is_used)
        self.assertIsNone(otp.verified_at)

        otp.mark_as_used()
        otp.refresh_from_db()
        self.assertTrue(otp.is_used)
        self.assertIsNotNone(otp.verified_at)


class PasswordResetRequestViewTests(TestCase):
    """Test password reset request endpoint"""

    def setUp(self):
        self.client = Client()
        self.url = '/api/users/password-reset/request/'
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )

    def test_request_otp_success(self):
        """Test successful OTP request"""
        response = self.client.post(
            self.url,
            data=json.dumps({'email': 'test@example.com'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)

        otp = PasswordResetOTP.objects.filter(email='test@example.com').first()
        self.assertIsNotNone(otp)
        self.assertEqual(otp.user_type, 'user')

    def test_request_otp_email_not_found_returns_200(self):
        """Test OTP request with non-existent email returns same 200 (anti-enumeration)"""
        response = self.client.post(
            self.url,
            data=json.dumps({'email': 'nonexistent@example.com'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)

    def test_request_otp_missing_email_returns_200(self):
        """Test OTP request without email returns same 200 (anti-enumeration)"""
        response = self.client.post(
            self.url,
            data=json.dumps({}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)

    def test_request_otp_rate_limit(self):
        """Test OTP request rate limiting"""
        for i in range(3):
            PasswordResetOTP.objects.create(
                email='ratelimit@example.com',
                created_at=timezone.now()
            )

        response = self.client.post(
            self.url,
            data=json.dumps({'email': 'ratelimit@example.com'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 429)
        self.assertIn('Too many OTP requests', response.json()['detail'])

    @patch('users.views.send_mail')
    def test_request_otp_sends_email(self, mock_send_mail):
        """Test that OTP request sends email"""
        response = self.client.post(
            self.url,
            data=json.dumps({'email': 'test@example.com'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        mock_send_mail.assert_called_once()


class PasswordResetVerifyAndConfirmViewTests(TestCase):
    """Test the merged verify-and-confirm endpoint"""

    def setUp(self):
        self.client = Client()
        self.url = '/api/users/password-reset/verify-and-confirm/'
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='oldpass123'
        )
        self.otp = PasswordResetOTP.objects.create(
            email='test@example.com',
            otp_code='123456'
        )

    def test_verify_and_confirm_success(self):
        """Test successful OTP verify + password reset in one step"""
        response = self.client.post(
            self.url,
            data=json.dumps({
                'email': 'test@example.com',
                'otp_code': '123456',
                'password': 'NewStrongPass1!'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn('updated', response.json()['detail'].lower())

        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewStrongPass1!'))

        self.otp.refresh_from_db()
        self.assertTrue(self.otp.is_used)

    def test_verify_invalid_otp(self):
        """Test with invalid OTP code"""
        response = self.client.post(
            self.url,
            data=json.dumps({
                'email': 'test@example.com',
                'otp_code': '000000',
                'password': 'NewStrongPass1!'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid', response.json()['detail'])

        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('oldpass123'))

    def test_verify_expired_otp(self):
        """Test with expired OTP"""
        self.otp.expires_at = timezone.now() - timedelta(minutes=1)
        self.otp.save()

        response = self.client.post(
            self.url,
            data=json.dumps({
                'email': 'test@example.com',
                'otp_code': '123456',
                'password': 'NewStrongPass1!'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)

        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('oldpass123'))

    def test_verify_locked_otp(self):
        """Test with locked OTP"""
        self.otp.attempts = 3
        self.otp.max_attempts = 3
        self.otp.save()

        response = self.client.post(
            self.url,
            data=json.dumps({
                'email': 'test@example.com',
                'otp_code': '123456',
                'password': 'NewStrongPass1!'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)

    def test_verify_attempt_locking(self):
        """Test that OTP locks after max failed attempts"""
        for i in range(3):
            response = self.client.post(
                self.url,
                data=json.dumps({
                    'email': 'test@example.com',
                    'otp_code': '000000',
                    'password': 'NewStrongPass1!'
                }),
                content_type='application/json'
            )
            self.assertEqual(response.status_code, 400)

        response = self.client.post(
            self.url,
            data=json.dumps({
                'email': 'test@example.com',
                'otp_code': '123456',
                'password': 'NewStrongPass1!'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)

        self.otp.refresh_from_db()
        self.assertTrue(self.otp.is_locked())

    def test_verify_weak_password_rejected(self):
        """Test that weak password is rejected by Django validators"""
        response = self.client.post(
            self.url,
            data=json.dumps({
                'email': 'test@example.com',
                'otp_code': '123456',
                'password': '1'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)

        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('oldpass123'))


class HandymanPasswordResetTests(TestCase):
    """Test password reset for Handyman accounts"""

    def setUp(self):
        self.client = Client()
        self.handyman = Handyman.objects.create_user(
            username='testhandyman',
            email='handyman@example.com',
            password='testpass123'
        )

    def test_handyman_otp_request(self):
        """Test OTP request for handyman"""
        response = self.client.post(
            '/api/users/password-reset/request/',
            data=json.dumps({'email': 'handyman@example.com'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)

        otp = PasswordResetOTP.objects.filter(email='handyman@example.com').first()
        self.assertIsNotNone(otp)
        self.assertEqual(otp.user_type, 'handyman')

    def test_handyman_password_reset(self):
        """Test complete password reset flow for handyman"""
        # Request OTP
        response = self.client.post(
            '/api/users/password-reset/request/',
            data=json.dumps({'email': 'handyman@example.com'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)

        # Get the OTP
        otp = PasswordResetOTP.objects.filter(email='handyman@example.com').first()

        # Verify and reset in one step
        response = self.client.post(
            '/api/users/password-reset/verify-and-confirm/',
            data=json.dumps({
                'email': 'handyman@example.com',
                'otp_code': otp.otp_code,
                'password': 'NewHandyPass1!'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)

        self.handyman.refresh_from_db()
        self.assertTrue(self.handyman.check_password('NewHandyPass1!'))


class CleanupCommandTests(TestCase):
    """Test cleanup management command"""

    def test_cleanup_expired_otps(self):
        """Test cleanup of expired OTPs"""
        from django.core.management import call_command

        old_otp = PasswordResetOTP.objects.create(
            email='old@example.com',
            otp_code='111111',
            created_at=timezone.now() - timedelta(hours=25),
            expires_at=timezone.now() - timedelta(hours=1)
        )

        recent_otp = PasswordResetOTP.objects.create(
            email='recent@example.com',
            otp_code='222222',
            created_at=timezone.now() - timedelta(hours=1)
        )

        call_command('cleanup_expired_otps')

        self.assertFalse(PasswordResetOTP.objects.filter(pk=old_otp.pk).exists())
        self.assertTrue(PasswordResetOTP.objects.filter(pk=recent_otp.pk).exists())

    def test_cleanup_dry_run(self):
        """Test cleanup dry run mode"""
        from django.core.management import call_command
        from io import StringIO

        old_otp = PasswordResetOTP.objects.create(
            email='old@example.com',
            otp_code='111111',
            created_at=timezone.now() - timedelta(hours=25),
            expires_at=timezone.now() - timedelta(hours=1)
        )

        out = StringIO()
        call_command('cleanup_expired_otps', '--dry-run', stdout=out)
        output = out.getvalue()

        self.assertTrue(PasswordResetOTP.objects.filter(pk=old_otp.pk).exists())
        self.assertIn('DRY RUN', output)
