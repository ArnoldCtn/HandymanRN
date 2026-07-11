"""
Tests for Password Reset OTP System
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
        """Test that OTP code is auto-generated"""
        otp = PasswordResetOTP.objects.create(email='test@example.com')
        self.assertIsNotNone(otp.otp_code)
        self.assertEqual(len(otp.otp_code), 6)
        self.assertTrue(otp.otp_code.isdigit())
    
    def test_otp_expiration(self):
        """Test OTP expiration logic"""
        otp = PasswordResetOTP.objects.create(email='test@example.com')
        # OTP should not be expired immediately
        self.assertFalse(otp.is_expired())
        
        # Set expiration to the past
        otp.expires_at = timezone.now() - timedelta(minutes=1)
        otp.save()
        self.assertTrue(otp.is_expired())
    
    def test_otp_locking(self):
        """Test OTP locking mechanism"""
        otp = PasswordResetOTP.objects.create(email='test@example.com')
        self.assertFalse(otp.is_locked())
        
        # Increment attempts to max
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
        self.assertIn('OTP sent', response.json()['detail'])
        
        # Verify OTP was created
        otp = PasswordResetOTP.objects.filter(email='test@example.com').first()
        self.assertIsNotNone(otp)
        self.assertEqual(otp.user_type, 'user')
    
    def test_request_otp_email_not_found(self):
        """Test OTP request with non-existent email"""
        response = self.client.post(
            self.url,
            data=json.dumps({'email': 'nonexistent@example.com'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 404)
        self.assertIn('does not exist', response.json()['detail'])
    
    def test_request_otp_missing_email(self):
        """Test OTP request without email"""
        response = self.client.post(
            self.url,
            data=json.dumps({}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
    
    def test_request_otp_rate_limit(self):
        """Test OTP request rate limiting"""
        # Create 3 OTPs (should be allowed)
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
        # Should be rate limited on 4th request
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


class PasswordResetVerifyViewTests(TestCase):
    """Test OTP verification endpoint"""
    
    def setUp(self):
        self.client = Client()
        self.url = '/api/users/password-reset/verify/'
        self.otp = PasswordResetOTP.objects.create(
            email='test@example.com',
            otp_code='123456'
        )
    
    def test_verify_otp_success(self):
        """Test successful OTP verification"""
        response = self.client.post(
            self.url,
            data=json.dumps({
                'email': 'test@example.com',
                'otp_code': '123456'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn('verified', response.json()['detail'].lower())
        
        # Verify OTP was marked as used
        self.otp.refresh_from_db()
        self.assertTrue(self.otp.is_used)
    
    def test_verify_otp_invalid_code(self):
        """Test verification with invalid OTP code"""
        response = self.client.post(
            self.url,
            data=json.dumps({
                'email': 'test@example.com',
                'otp_code': '000000'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('Invalid', response.json()['detail'])
    
    def test_verify_otp_expired(self):
        """Test verification with expired OTP"""
        self.otp.expires_at = timezone.now() - timedelta(minutes=1)
        self.otp.save()
        
        response = self.client.post(
            self.url,
            data=json.dumps({
                'email': 'test@example.com',
                'otp_code': '123456'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('expired', response.json()['detail'].lower())
    
    def test_verify_otp_locked(self):
        """Test verification with locked OTP"""
        self.otp.attempts = 3
        self.otp.max_attempts = 3
        self.otp.save()
        
        response = self.client.post(
            self.url,
            data=json.dumps({
                'email': 'test@example.com',
                'otp_code': '123456'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('locked', response.json()['detail'].lower())
    
    def test_verify_otp_attempt_locking(self):
        """Test that OTP locks after max failed attempts"""
        # Try wrong OTP 3 times
        for i in range(3):
            response = self.client.post(
                self.url,
                data=json.dumps({
                    'email': 'test@example.com',
                    'otp_code': '000000'
                }),
                content_type='application/json'
            )
            self.assertEqual(response.status_code, 400)
        
        # 4th attempt should be locked
        response = self.client.post(
            self.url,
            data=json.dumps({
                'email': 'test@example.com',
                'otp_code': '123456'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn('locked', response.json()['detail'].lower())
        
        # Verify OTP is locked
        self.otp.refresh_from_db()
        self.assertTrue(self.otp.is_locked())


class PasswordResetConfirmViewTests(TestCase):
    """Test password reset confirmation endpoint"""
    
    def setUp(self):
        self.client = Client()
        self.url = '/api/users/password-reset/confirm/'
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='oldpass123'
        )
        self.otp = PasswordResetOTP.objects.create(
            email='test@example.com',
            otp_code='123456'
        )
    
    def test_confirm_password_reset_success(self):
        """Test successful password reset"""
        response = self.client.post(
            self.url,
            data=json.dumps({
                'email': 'test@example.com',
                'otp_code': '123456',
                'password': 'newpass123'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn('updated', response.json()['detail'].lower())
        
        # Verify password was changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newpass123'))
        
        # Verify OTP was marked as used
        self.otp.refresh_from_db()
        self.assertTrue(self.otp.is_used)
    
    def test_confirm_with_invalid_otp(self):
        """Test password reset with invalid OTP"""
        response = self.client.post(
            self.url,
            data=json.dumps({
                'email': 'test@example.com',
                'otp_code': '000000',
                'password': 'newpass123'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        
        # Verify password was NOT changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('oldpass123'))
    
    def test_confirm_with_expired_otp(self):
        """Test password reset with expired OTP"""
        self.otp.expires_at = timezone.now() - timedelta(minutes=1)
        self.otp.save()
        
        response = self.client.post(
            self.url,
            data=json.dumps({
                'email': 'test@example.com',
                'otp_code': '123456',
                'password': 'newpass123'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 400)
        
        # Verify password was NOT changed
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
        
        # Verify OTP was created with correct user_type
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
        
        # Verify OTP
        response = self.client.post(
            '/api/users/password-reset/verify/',
            data=json.dumps({
                'email': 'handyman@example.com',
                'otp_code': otp.otp_code
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        
        # Reset password
        response = self.client.post(
            '/api/users/password-reset/confirm/',
            data=json.dumps({
                'email': 'handyman@example.com',
                'otp_code': otp.otp_code,
                'password': 'newhandymanpass'
            }),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, 200)
        
        # Verify password was changed
        self.handyman.refresh_from_db()
        self.assertTrue(self.handyman.check_password('newhandymanpass'))


class CleanupCommandTests(TestCase):
    """Test cleanup management command"""
    
    def test_cleanup_expired_otps(self):
        """Test cleanup of expired OTPs"""
        from django.core.management import call_command
        
        # Create expired OTP (older than 24 hours)
        old_otp = PasswordResetOTP.objects.create(
            email='old@example.com',
            otp_code='111111',
            created_at=timezone.now() - timedelta(hours=25),
            expires_at=timezone.now() - timedelta(hours=1)
        )
        
        # Create recent OTP (not expired)
        recent_otp = PasswordResetOTP.objects.create(
            email='recent@example.com',
            otp_code='222222',
            created_at=timezone.now() - timedelta(hours=1)
        )
        
        # Run cleanup
        call_command('cleanup_expired_otps')
        
        # Verify old OTP was deleted
        self.assertFalse(PasswordResetOTP.objects.filter(pk=old_otp.pk).exists())
        
        # Verify recent OTP still exists
        self.assertTrue(PasswordResetOTP.objects.filter(pk=recent_otp.pk).exists())
    
    def test_cleanup_dry_run(self):
        """Test cleanup dry run mode"""
        from django.core.management import call_command
        from io import StringIO
        
        # Create expired OTP
        old_otp = PasswordResetOTP.objects.create(
            email='old@example.com',
            otp_code='111111',
            created_at=timezone.now() - timedelta(hours=25),
            expires_at=timezone.now() - timedelta(hours=1)
        )
        
        # Run cleanup in dry-run mode
        out = StringIO()
        call_command('cleanup_expired_otps', '--dry-run', stdout=out)
        output = out.getvalue()
        
        # Verify OTP still exists (not deleted in dry run)
        self.assertTrue(PasswordResetOTP.objects.filter(pk=old_otp.pk).exists())
        
        # Verify output mentions dry run
        self.assertIn('DRY RUN', output)