from django.conf import settings
from django.db import transaction
from django.utils import timezone
from .models import Payment, Wallet, Transaction
from bookings.models import Booking
import logging

logger = logging.getLogger(__name__)


class MeSombService:
    """Service for handling MeSomb payment operations"""

    def __init__(self):
        # Read from Django settings (which loads .env via python-dotenv)
        self.access_key = getattr(settings, 'MESOMB_ACCESS_KEY', None)
        self.secret_key = getattr(settings, 'MESOMB_SECRET_KEY', None)
        self.application_key = getattr(settings, 'MESOMB_APPLICATION_KEY', None)
        self.environment = getattr(settings, 'MESOMB_ENVIRONMENT', 'sandbox')
        logger.info(f"[MeSombService] Initialized with environment={self.environment}, access_key={'*' * 8 if self.access_key else 'MISSING'}")
        if not all([self.access_key, self.secret_key, self.application_key]):
            logger.error("[MeSombService] MISSING API KEYS! Check your .env file.")
    
    def _check_keys(self):
        """Validate that all MeSomb API keys are configured."""
        missing = []
        if not self.application_key or self.application_key == 'your_app_key_here':
            missing.append('MESOMB_APPLICATION_KEY')
        if not self.access_key or self.access_key == 'your_access_key_here':
            missing.append('MESOMB_ACCESS_KEY')
        if not self.secret_key or self.secret_key == 'your_secret_key_here':
            missing.append('MESOMB_SECRET_KEY')
        return missing

    def _map_mesomb_error(self, raw_error, error_code=None):
        """
        Map MeSomb error messages/codes to user-friendly messages.
        Returns a dict with 'code' (machine-readable) and 'message' (user-friendly).
        """
        raw_lower = (raw_error or '').lower()
        
        error_map = [
            # Insufficient balance
            ('insufficient', 'INSUFFICIENT_BALANCE', 'Insufficient balance: Your mobile money account does not have enough funds for this payment. Please top up and try again.'),
            ('insuffisant', 'INSUFFICIENT_BALANCE', 'Insufficient balance: Your mobile money account does not have enough funds for this payment. Please top up and try again.'),
            ('not enough', 'INSUFFICIENT_BALANCE', 'Insufficient balance: Your mobile money account does not have enough funds for this payment. Please top up and try again.'),
            ('solde insuffisant', 'INSUFFICIENT_BALANCE', 'Insufficient balance: Your mobile money account does not have enough funds for this payment. Please top up and try again.'),
            
            # Wrong PIN / Authentication
            ('pin', 'WRONG_PIN', 'Wrong PIN: The transaction was cancelled because the wrong PIN was entered. Please try again with the correct PIN.'),
            ('password', 'WRONG_PIN', 'Wrong PIN: The transaction was cancelled because the wrong PIN was entered. Please try again with the correct PIN.'),
            ('cancelled by user', 'CANCELLED_BY_USER', 'Transaction cancelled: You cancelled the payment on your phone. Please try again if you want to proceed.'),
            ('refused', 'PAYMENT_REFUSED', 'Payment refused: The payment was refused. Please check your account status or try again.'),
            
            # Invalid/inactive phone number
            ('not found', 'INVALID_NUMBER', 'Invalid phone number: The phone number was not found or is not registered for mobile money. Please check and try again.'),
            ('not exist', 'INVALID_NUMBER', 'Invalid phone number: The phone number was not found or is not registered for mobile money. Please check and try again.'),
            ('invalid number', 'INVALID_NUMBER', 'Invalid phone number: The phone number format is incorrect. Please use a valid Cameroon mobile number.'),
            ('does not exist', 'INVALID_NUMBER', 'Invalid phone number: The phone number does not exist or is not registered for mobile money.'),
            
            # Account inactive/blocked
            ('inactive', 'ACCOUNT_INACTIVE', 'Account inactive: Your mobile money account is not active. Please contact your provider (MTN/Orange) to activate it.'),
            ('not active', 'ACCOUNT_INACTIVE', 'Account inactive: This mobile money account is not active. Please contact your provider (MTN/Orange) to activate it.'),
            ('blocked', 'ACCOUNT_BLOCKED', 'Account blocked: Your mobile money account is temporarily blocked. Please contact your provider to resolve this.'),
            ('suspend', 'ACCOUNT_SUSPENDED', 'Account suspended: Your mobile money account has been suspended. Please contact your provider.'),
            
            # Transaction limits
            ('limit', 'LIMIT_EXCEEDED', 'Transaction limit exceeded: You have reached your daily/monthly transaction limit. Please try again tomorrow or contact your provider.'),
            ('maximum', 'LIMIT_EXCEEDED', 'Transaction limit exceeded: The amount exceeds your transaction limit. Please try a smaller amount or contact your provider.'),
            ('quota', 'LIMIT_EXCEEDED', 'Transaction limit exceeded: You have reached your transaction quota. Please try again later.'),
            
            # Timeout
            ('timeout', 'TIMEOUT', 'Network timeout: The request took too long. Please check your connection and try again.'),
            ('too much time', 'TIMEOUT_PIN', 'Timeout: You took too long to enter the PIN on your phone. Please try again and enter the PIN immediately when you receive the SMS.'),
            ('took too long', 'TIMEOUT_PIN', 'Timeout: You took too long to enter the PIN on your phone. Please try again and enter the PIN immediately when you receive the SMS.'),
            ('validate the transaction', 'TIMEOUT_PIN', 'Timeout: You took too long to enter the PIN on your phone. Please try again and enter the PIN immediately when you receive the SMS.'),
            
            # Service unavailable
            ('temporarily unavailable', 'SERVICE_UNAVAILABLE', 'Service temporarily unavailable: The mobile money service is currently down. Please try again in a few minutes.'),
            ('service unavailable', 'SERVICE_UNAVAILABLE', 'Service temporarily unavailable: The mobile money service is currently down. Please try again in a few minutes.'),
        ]
        
        for pattern, code, message in error_map:
            if pattern in raw_lower:
                return {'code': code, 'message': message}
        
        if error_code:
            code_map = {
                '400': ('INVALID_REQUEST', 'Invalid request: The payment details are incorrect. Please check your information and try again.'),
                '401': ('AUTH_FAILED', 'Authentication failed: The API credentials are invalid. Please contact support.'),
                '403': ('FORBIDDEN', 'Permission denied: This operation is not allowed. Please contact support.'),
                '404': ('SERVICE_NOT_FOUND', 'Service not found: The requested mobile money service is unavailable.'),
                '409': ('DUPLICATE', 'Duplicate transaction: A transaction with this ID already exists.'),
                '422': ('INVALID_DATA', 'Invalid data: The phone number or amount is not valid. Please check and try again.'),
                '429': ('TOO_MANY_REQUESTS', 'Too many requests: You are sending too many requests. Please wait a moment and try again.'),
                '500': ('SERVER_ERROR', 'MeSomb server error: The payment service is experiencing issues. Please try again later.'),
                '503': ('SERVICE_UNAVAILABLE', 'Service unavailable: The mobile money service is temporarily down. Please try again later.'),
            }
            if str(error_code) in code_map:
                code, message = code_map[str(error_code)]
                return {'code': code, 'message': message}
        
        if raw_error:
            return {'code': 'UNKNOWN_ERROR', 'message': f'Payment failed: {raw_error}. Please try again or contact support if the problem persists.'}
        
        return {'code': 'UNKNOWN_ERROR', 'message': 'Payment failed: An unexpected error occurred. Please try again or contact support.'}

    def collect_payment(self, amount, payer_number, service, booking_id, user_id):
        """
        Collect payment FROM user via MeSomb.
        This is the FIRST step: user pays the platform.
        """
        logger.info(f"[MeSombService.collect_payment] START | amount={amount}, payer={payer_number}, service={service}, booking={booking_id}")

        missing = self._check_keys()
        if missing:
            err = f"Missing MeSomb API keys: {', '.join(missing)}. Set them in your .env file or environment."
            logger.error(f"[MeSombService.collect_payment] {err}")
            return {'success': False, 'error_code': 'CONFIG_ERROR', 'error': err}

        try:
            from pymesomb.operations import PaymentOperation
            logger.info("[MeSombService.collect_payment] pymesomb imported successfully")

            operation = PaymentOperation(
                application_key=self.application_key,
                access_key=self.access_key,
                secret_key=self.secret_key,
            )
            logger.info("[MeSombService.collect_payment] PaymentOperation initialized")

            mesomb_service = service.upper() if service else 'MTN'
            logger.info(f"[MeSombService.collect_payment] Using service={mesomb_service}")

            logger.info(f"[MeSombService.collect_payment] CALLING make_collect() | payer={payer_number}, amount={amount}")
            response = operation.make_collect(
                amount=amount,
                service=mesomb_service,
                payer=payer_number,
                trx_id=str(booking_id),
            )

            logger.info(f"[MeSombService.collect_payment] MeSomb response type={type(response).__name__}")
            logger.info(f"[MeSombService.collect_payment] is_operation_success={response.is_operation_success()}, is_transaction_success={response.is_transaction_success()}")

            if response.is_operation_success():
                txn = response.transaction
                txn_id = getattr(txn, 'reference', None) if txn else None
                status = getattr(response, 'status', 'SUCCESS')
                logger.info(f"[MeSombService.collect_payment] SUCCESS | txn_id={txn_id}")
                return {
                    'success': True,
                    'transaction_id': txn_id,
                    'status': status,
                    'amount': getattr(txn, 'amount', amount) if txn else amount,
                    'mesomb_response': {
                        'operation_success': response.is_operation_success(),
                        'transaction_success': response.is_transaction_success(),
                        'status': status,
                        'transaction_id': txn_id
                    }
                }
            else:
                raw_error = None
                error_code = None
                
                if hasattr(response, 'message') and response.message:
                    raw_error = response.message
                elif hasattr(response, 'detail') and response.detail:
                    raw_error = response.detail
                elif hasattr(response, 'raw_response') and response.raw_response:
                    raw_error = str(response.raw_response)
                
                if hasattr(response, 'code'):
                    error_code = response.code
                elif hasattr(response, 'status'):
                    error_code = response.status
                
                mapped = self._map_mesomb_error(raw_error, error_code)
                
                logger.error(f"[MeSombService.collect_payment] FAILED | code={error_code} | raw={raw_error} | mapped={mapped}")
                return {
                    'success': False,
                    'error_code': mapped['code'],
                    'error': mapped['message'],
                    'mesomb_raw_error': raw_error,
                    'mesomb_error_code': error_code,
                    'mesomb_response': {
                        'operation_success': response.is_operation_success(),
                        'transaction_success': response.is_transaction_success()
                    }
                }

        except ImportError as e:
            logger.error(f"[MeSombService.collect_payment] pymesomb NOT installed! Run: pip install pymesomb | {e}")
            return {
                'success': False,
                'error_code': 'SDK_MISSING',
                'error': 'pymesomb SDK not installed. Please run: pip install pymesomb'
            }
        except Exception as e:
            error_msg = str(e)
            logger.error(f"[MeSombService.collect_payment] EXCEPTION | {type(e).__name__}: {error_msg}")
            
            if 'NameResolutionError' in error_msg or 'Failed to resolve' in error_msg:
                return {
                    'success': False,
                    'error_code': 'NETWORK_ERROR',
                    'error': 'Network error: Cannot connect to MeSomb servers. Please check your internet connection and try again.',
                    'mesomb_error': 'DNS resolution failed - mesomb.hachther.com unreachable'
                }
            elif 'ConnectionError' in error_msg or 'Max retries exceeded' in error_msg:
                return {
                    'success': False,
                    'error_code': 'NETWORK_ERROR',
                    'error': 'Network error: MeSomb servers are not responding. Please try again in a few moments.',
                    'mesomb_error': 'Connection timeout - MeSomb service unavailable'
                }
            else:
                return {
                    'success': False,
                    'error_code': 'EXCEPTION',
                    'error': f'{type(e).__name__}: {error_msg}'
                }
    
    def process_automatic_payout(self, payment):
        """Automatically transfer handyman's share when payment is completed"""
        try:
            handyman_share = self._calculate_handyman_share(payment)
            
            if handyman_share <= 0:
                logger.warning(f"No payout needed for payment {payment.id}")
                return False
            
            # Use handyman's phone number for payout
            payout_phone = payment.handyman.phone
            
            if not payout_phone:
                logger.error(f"No phone number for handyman {payment.handyman.id}")
                return False
            
            transfer_result = self._initiate_transfer(
                amount=float(handyman_share),
                recipient=payout_phone,
                payment_id=payment.id
            )
            
            if transfer_result['success']:
                payment.handyman_withdrawal_status = 'completed'
                payment.save()
                
                logger.info(f"Automatic payout successful: {transfer_result['transaction_id']} to {payout_phone}")
                return True
            else:
                logger.error(f"Automatic payout failed: {transfer_result['error']}")
                return False
                
        except Exception as e:
            logger.error(f"Automatic payout error: {str(e)}")
            return False
    
    def _calculate_handyman_share(self, payment):
        """Calculate handyman's share using fixed platform split"""
        total_amount = payment.gross_amount
        return total_amount * 0.70
    
    def _initiate_transfer(self, amount, recipient, payment_id):
        """Initiate MeSomb transfer (deposit) to handyman"""
        logger.info(f"[_initiate_transfer] START | amount={amount}, recipient={recipient}, payment_id={payment_id}")

        missing = self._check_keys()
        if missing:
            err = f"Missing MeSomb API keys: {', '.join(missing)}. Set them in your .env file or environment."
            logger.error(f"[_initiate_transfer] {err}")
            return {'success': False, 'error': err}

        try:
            from pymesomb.operations import PaymentOperation

            operation = PaymentOperation(
                application_key=self.application_key,
                access_key=self.access_key,
                secret_key=self.secret_key,
            )

            service = 'MTN' if recipient.startswith(('67', '650', '651', '652', '653', '654')) else 'ORANGE'

            logger.info(f"[_initiate_transfer] CALLING make_deposit | amount={amount}, recipient={recipient}, service={service}")
            response = operation.make_deposit(
                amount=amount,
                service=service,
                receiver=recipient,
                trx_id=f"payout_{payment_id}",
            )

            logger.info(f"[_initiate_transfer] response type={type(response).__name__}")

            if response.is_operation_success():
                txn = response.transaction
                txn_id = getattr(txn, 'reference', None) if txn else None
                logger.info(f"[_initiate_transfer] SUCCESS | txn_id={txn_id}")
                return {
                    'success': True,
                    'transaction_id': txn_id,
                    'amount': getattr(txn, 'amount', amount) if txn else amount,
                    'recipient': recipient
                }
            else:
                error_msg = 'MeSomb deposit failed'
                if hasattr(response, 'message') and response.message:
                    error_msg = response.message
                elif hasattr(response, 'detail') and response.detail:
                    error_msg = response.detail
                logger.error(f"[_initiate_transfer] FAILED | {error_msg}")
                return {
                    'success': False,
                    'error': error_msg
                }

        except ImportError:
            logger.error("pymesomb not installed. Run: pip install pymesomb")
            return {
                'success': False,
                'error': 'MeSomb SDK not installed'
            }
        except Exception as e:
            logger.error(f"MeSomb transfer error: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }


def process_payment_sync(booking, payment_provider, payment_number):
    """
    Process payment synchronously - wait for MeSomb response.
    Returns a dict with success/error info including proper error codes.
    """
    from decimal import Decimal
    
    handyman = booking.handyman
    
    total = float(booking.total_amount)
    handyman_pct = 0.70
    platform_fee = round(total * (1 - handyman_pct), 2)
    handyman_amount = round(total * handyman_pct, 2)
    
    logger.info(f"[process_payment_sync] booking={booking.id} | total={total} | handyman_pct={handyman_pct} | platform_fee={platform_fee} | handyman_amount={handyman_amount}")
    
    # Create Payment record
    try:
        payment = Payment.objects.create(
            booking=booking,
            user=booking.user,
            handyman=handyman,
            gross_amount=total,
            platform_fee=platform_fee,
            handyman_amount=handyman_amount,
            method=payment_provider,
            payer_number=payment_number,
            status='pending'
        )
        logger.info(f"[process_payment_sync] Payment record created | id={payment.id}")
    except Exception as e:
        logger.error(f"[process_payment_sync] FAILED to create Payment record: {e}")
        return {
            'success': False,
            'error_code': 'PAYMENT_RECORD_ERROR',
            'error': f'Failed to create payment record: {str(e)}',
            'http_status': 500
        }
    
    # Call MeSomb synchronously - this waits for the user to enter PIN
    mesomb = MeSombService()
    collect_result = mesomb.collect_payment(
        amount=total,
        payer_number=payment_number,
        service=payment_provider,
        booking_id=booking.id,
        user_id=booking.user.id
    )
    
    logger.info(f"[process_payment_sync] MeSomb result for payment {payment.id}: success={collect_result.get('success')}")
    
    if collect_result['success']:
        # Payment successful - update all records atomically
        with transaction.atomic():
            payment.collect_ref = collect_result.get('transaction_id')
            payment.collect_status = collect_result.get('status')
            payment.status = 'collected'
            payment.save()
            
            booking.status = 'completed'
            booking.completed_at = timezone.now()
            booking.save()
            
            # Create wallet transaction for user (debit)
            wallet, _ = Wallet.objects.get_or_create(user=booking.user)
            service_name = booking.service.name if booking.service else 'Service'
            
            Transaction.objects.create(
                wallet=wallet,
                payment=payment,
                amount=total,
                transaction_type='debit',
                status='success',
                description=f'Payment for booking #{booking.id} - {service_name}',
                related_handyman=handyman
            )
            
            # Create wallet transaction for handyman (credit)
            handyman_wallet, _ = Wallet.objects.get_or_create(handyman=handyman)
            handyman_wallet.balance += handyman_amount
            handyman_wallet.total_earned_gross += total
            handyman_wallet.total_earned_net += handyman_amount
            handyman_wallet.total_app_commissions += platform_fee
            handyman_wallet.save()
            
            Transaction.objects.create(
                wallet=handyman_wallet,
                payment=payment,
                amount=handyman_amount,
                transaction_type='credit',
                status='success',
                description=f'Payment received for booking #{booking.id} - {service_name}',
                related_user=booking.user
            )
        
        # Trigger automatic payout to handyman in background
        try:
            payout_result = mesomb.process_automatic_payout(payment)
            if payout_result:
                payment.status = 'completed'
                payment.handyman_withdrawal_status = 'completed'
                payment.save()
                logger.info(f"[process_payment_sync] Payment FULLY COMPLETED | payment={payment.id}")
            else:
                logger.warning(f"[process_payment_sync] Payment COLLECTED but payout failed | payment={payment.id}")
        except Exception as e:
            logger.error(f"[process_payment_sync] Payout error: {e}")
        
        return {
            'success': True,
            'payment_id': payment.id,
            'transaction_id': collect_result.get('transaction_id'),
            'amount': total,
            'handyman_amount': handyman_amount,
            'platform_fee': platform_fee,
            'payment_status': 'completed',
            'booking_status': 'completed',
            'detail': 'Payment successful! The booking has been completed.'
        }
    else:
        # Payment failed - update payment record
        error_code = collect_result.get('error_code', 'UNKNOWN_ERROR')
        error_msg = collect_result.get('error', 'Payment failed')
        
        payment.status = 'failed'
        payment.error_message = error_msg
        payment.save()
        
        logger.info(f"[process_payment_sync] Payment FAILED | payment={payment.id} | code={error_code} | error={error_msg}")
        
        return {
            'success': False,
            'error_code': error_code,
            'error': error_msg,
            'mesomb_raw_error': collect_result.get('mesomb_raw_error'),
            'mesomb_error_code': collect_result.get('mesomb_error_code'),
            'http_status': 402
        }


def process_payment_webhook(payment_data):
    """
    Process payment success webhook and trigger automatic payout
    """
    try:
        with transaction.atomic():
            payment = Payment.objects.get(id=payment_data['payment_id'])
            
            payment.status = 'collected'
            payment.save()
            
            meSomb_service = MeSombService()
            payout_success = meSomb_service.process_automatic_payout(payment)
            
            if payout_success:
                payment.status = 'completed'
                payment.save()
                logger.info(f"Payment {payment.id} processed with automatic payout")
            else:
                payment.status = 'payout_failed'
                payment.save()
                logger.error(f"Automatic payout failed for payment {payment.id}")
            
            return True
            
    except Payment.DoesNotExist:
        logger.error(f"Payment {payment_data.get('payment_id')} not found")
        return False
    except Exception as e:
        logger.error(f"Payment webhook processing error: {str(e)}")
        return False