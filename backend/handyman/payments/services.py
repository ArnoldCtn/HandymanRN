from django.conf import settings
from django.db import transaction
from .models import Payment
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
        Based on MeSomb API documentation: https://mesomb.hachther.com
        """
        raw_lower = (raw_error or '').lower()
        
        # Map known MeSomb error patterns
        error_map = {
            # Insufficient balance
            'insufficient': 'Insufficient balance: Your mobile money account does not have enough funds for this payment. Please top up and try again.',
            'insuffisant': 'Insufficient balance: Your mobile money account does not have enough funds for this payment. Please top up and try again.',
            'not enough': 'Insufficient balance: Your mobile money account does not have enough funds for this payment. Please top up and try again.',
            'solde insuffisant': 'Insufficient balance: Your mobile money account does not have enough funds for this payment. Please top up and try again.',
            
            # Invalid/inactive phone number
            'not found': 'Invalid phone number: The phone number was not found or is not registered for mobile money. Please check and try again.',
            'not exist': 'Invalid phone number: The phone number was not found or is not registered for mobile money. Please check and try again.',
            'invalid number': 'Invalid phone number: The phone number format is incorrect. Please use a valid Cameroon mobile number.',
            'does not exist': 'Invalid phone number: The phone number does not exist or is not registered for mobile money.',
            
            # Account inactive/blocked
            'inactive': 'Account inactive: Your mobile money account is not active. Please contact your provider (MTN/Orange) to activate it.',
            'not active': 'Account inactive: This mobile money account is not active. Please contact your provider (MTN/Orange) to activate it.',
            'sender account': 'Account inactive: This mobile money account is not active or registered. Please check the number or contact your provider.',
            'blocked': 'Account blocked: Your mobile money account is temporarily blocked. Please contact your provider to resolve this.',
            'suspend': 'Account suspended: Your mobile money account has been suspended. Please contact your provider.',
            'not activated': 'Account inactive: Your mobile money account is not yet activated. Please visit an MTN/Orange service center.',
            
            # Transaction limits
            'limit': 'Transaction limit exceeded: You have reached your daily/monthly transaction limit. Please try again tomorrow or contact your provider.',
            'maximum': 'Transaction limit exceeded: The amount exceeds your transaction limit. Please try a smaller amount or contact your provider.',
            'quota': 'Transaction limit exceeded: You have reached your transaction quota. Please try again later.',
            
            # Wrong PIN / Authentication
            'pin': 'Wrong PIN: The transaction was cancelled because the wrong PIN was entered. Please try again with the correct PIN.',
            'password': 'Wrong PIN: The transaction was cancelled because the wrong PIN was entered. Please try again with the correct PIN.',
            'cancelled by user': 'Transaction cancelled: You cancelled the payment on your phone. Please try again if you want to proceed.',
            'refused': 'Payment refused: The payment was refused. Please check your account status or try again.',
            
            # Network/Service issues
            'timeout': 'Network timeout: The request took too long. Please check your connection and try again.',
            'too much time': 'Timeout: You took too long to enter the PIN on your phone. Please try again and enter the PIN immediately when you receive the SMS.',
            'took too long': 'Timeout: You took too long to enter the PIN on your phone. Please try again and enter the PIN immediately when you receive the SMS.',
            'validate the transaction': 'Timeout: You took too long to enter the PIN on your phone. Please try again and enter the PIN immediately when you receive the SMS.',
            'temporarily unavailable': 'Service temporarily unavailable: The mobile money service is currently down. Please try again in a few minutes.',
            'service unavailable': 'Service temporarily unavailable: The mobile money service is currently down. Please try again in a few minutes.',
            
            # Application/Config errors
            'invalid application': 'Configuration error: The application key is invalid. Please contact support.',
            'unauthorized': 'Authentication error: The API credentials are invalid. Please contact support.',
            'forbidden': 'Permission denied: Your application does not have permission for this operation.',
            'not allowed': 'Operation not allowed: This operation is not permitted for your application.',
            
            # Currency/Amount issues
            'invalid amount': 'Invalid amount: The payment amount is not valid. Please contact support.',
            'minimum': 'Amount too small: The amount is below the minimum allowed. Please increase the amount.',
            'maximum amount': 'Amount too large: The amount exceeds the maximum allowed. Please reduce the amount.',
        }
        
        # Check for known error patterns
        for pattern, message in error_map.items():
            if pattern in raw_lower:
                return message
        
        # Check error codes if provided
        if error_code:
            code_map = {
                '400': 'Invalid request: The payment details are incorrect. Please check your information and try again.',
                '401': 'Authentication failed: The API credentials are invalid. Please contact support.',
                '403': 'Permission denied: This operation is not allowed. Please contact support.',
                '404': 'Service not found: The requested mobile money service is unavailable.',
                '409': 'Duplicate transaction: A transaction with this ID already exists.',
                '422': 'Invalid data: The phone number or amount is not valid. Please check and try again.',
                '429': 'Too many requests: You are sending too many requests. Please wait a moment and try again.',
                '500': 'MeSomb server error: The payment service is experiencing issues. Please try again later.',
                '503': 'Service unavailable: The mobile money service is temporarily down. Please try again later.',
            }
            if str(error_code) in code_map:
                return code_map[str(error_code)]
        
        # If no specific match, return raw error with generic prefix
        if raw_error:
            return f'Payment failed: {raw_error}. Please try again or contact support if the problem persists.'
        
        return 'Payment failed: An unexpected error occurred. Please try again or contact support.'

    def collect_payment(self, amount, payer_number, service, booking_id, user_id):
        """
        Collect payment FROM user via MeSomb.
        This is the FIRST step: user pays the platform.
        """
        logger.info(f"[MeSombService.collect_payment] START | amount={amount}, payer={payer_number}, service={service}, booking={booking_id}")

        # ── 1) Validate API keys ───────────────────────────────
        missing = self._check_keys()
        if missing:
            err = f"Missing MeSomb API keys: {', '.join(missing)}. Set them in your .env file or environment."
            logger.error(f"[MeSombService.collect_payment] {err}")
            return {'success': False, 'error': err}

        try:
            from pymesomb.operations import PaymentOperation
            logger.info("[MeSombService.collect_payment] pymesomb imported successfully")

            # Initialize PaymentOperation (SDK v2.1.1 API)
            operation = PaymentOperation(
                application_key=self.application_key,
                access_key=self.access_key,
                secret_key=self.secret_key,
            )
            logger.info("[MeSombService.collect_payment] PaymentOperation initialized")

            # Normalize service name for MeSomb
            mesomb_service = service.upper() if service else 'MTN'
            logger.info(f"[MeSombService.collect_payment] Using service={mesomb_service}")

            # Call MeSomb to collect from user's phone (SDK v2.1.1 syntax)
            logger.info(f"[MeSombService.collect_payment] CALLING make_collect() | payer={payer_number}, amount={amount}")
            response = operation.make_collect(
                amount=amount,
                service=mesomb_service,
                payer=payer_number,
                trx_id=str(booking_id),
            )

            logger.info(f"[MeSombService.collect_payment] MeSomb response type={type(response).__name__}")
            logger.info(f"[MeSombService.collect_payment] is_operation_success={response.is_operation_success()}, is_transaction_success={response.is_transaction_success()}")

            # Parse response
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
                # Extract specific error details from MeSomb response
                raw_error = None
                error_code = None
                
                # Try to get detailed error from response
                if hasattr(response, 'message') and response.message:
                    raw_error = response.message
                elif hasattr(response, 'detail') and response.detail:
                    raw_error = response.detail
                elif hasattr(response, 'raw_response') and response.raw_response:
                    raw_error = str(response.raw_response)
                
                # Try to extract error code
                if hasattr(response, 'code'):
                    error_code = response.code
                elif hasattr(response, 'status'):
                    error_code = response.status
                
                # Map to user-friendly message
                user_friendly = self._map_mesomb_error(raw_error, error_code)
                
                logger.error(f"[MeSombService.collect_payment] FAILED | code={error_code} | raw={raw_error} | mapped={user_friendly}")
                return {
                    'success': False,
                    'error': user_friendly,
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
                'error': 'pymesomb SDK not installed. Please run: pip install pymesomb'
            }
        except Exception as e:
            error_msg = str(e)
            logger.error(f"[MeSombService.collect_payment] EXCEPTION | {type(e).__name__}: {error_msg}")
            
            # Handle network connectivity issues
            if 'NameResolutionError' in error_msg or 'Failed to resolve' in error_msg:
                return {
                    'success': False,
                    'error': 'Network error: Cannot connect to MeSomb servers. Please check your internet connection and try again.',
                    'mesomb_error': 'DNS resolution failed - mesomb.hachther.com unreachable'
                }
            elif 'ConnectionError' in error_msg or 'Max retries exceeded' in error_msg:
                return {
                    'success': False,
                    'error': 'Network error: MeSomb servers are not responding. Please try again in a few moments.',
                    'mesomb_error': 'Connection timeout - MeSomb service unavailable'
                }
            else:
                return {
                    'success': False,
                    'error': f'{type(e).__name__}: {error_msg}'
                }
    
    def process_automatic_payout(self, payment):
        """
        Automatically transfer handyman's share when payment is completed
        """
        try:
            # Calculate handyman's share based on subscription
            handyman_share = self._calculate_handyman_share(payment)
            
            if handyman_share <= 0:
                logger.warning(f"No payout needed for payment {payment.id}")
                return False
            
            # Get handyman's payment phone from profile
            payout_phone = payment.handyman.get_payment_phone()
            
            if not payout_phone:
                logger.error(f"No payment phone for handyman {payment.handyman.id}")
                return False
            
            # Initiate MeSomb transfer
            transfer_result = self._initiate_transfer(
                amount=float(handyman_share),  # Convert Decimal to float for MeSomb SDK
                recipient=payout_phone,
                payment_id=payment.id
            )
            
            if transfer_result['success']:
                # Update payment status
                payment.status = 'paid'
                payment.amount_to_handyman = handyman_share
                payment.handyman_withdrawal_status = 'completed'
                payment.handyman_withdrawal_transaction_id = transfer_result['transaction_id']
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
        """Calculate handyman's share based on subscription level"""
        total_amount = payment.gross_amount  # Fixed: use gross_amount field
        
        if payment.handyman.subscription_level == 'free':
            # Free: 70% to handyman
            return total_amount * 0.70
        elif payment.handyman.subscription_level == 'pro':
            # Pro: 75% to handyman
            return total_amount * 0.75
        elif payment.handyman.subscription_level == 'premium':
            # Premium: 80% to handyman
            return total_amount * 0.80
        else:
            # Default to 70%
            return total_amount * 0.70
    
    def _initiate_transfer(self, amount, recipient, payment_id):
        """Initiate MeSomb transfer (deposit) to handyman"""
        logger.info(f"[_initiate_transfer] START | amount={amount}, recipient={recipient}, payment_id={payment_id}")

        # ── 1) Validate API keys ───────────────────────────────
        missing = self._check_keys()
        if missing:
            err = f"Missing MeSomb API keys: {', '.join(missing)}. Set them in your .env file or environment."
            logger.error(f"[_initiate_transfer] {err}")
            return {'success': False, 'error': err}

        try:
            from pymesomb.operations import PaymentOperation

            # Initialize PaymentOperation (SDK v2.1.1 API)
            operation = PaymentOperation(
                application_key=self.application_key,
                access_key=self.access_key,
                secret_key=self.secret_key,
            )

            # Determine service from phone prefix
            service = 'MTN' if recipient.startswith(('67', '650', '651', '652', '653', '654')) else 'ORANGE'

            # Make deposit (transfer to handyman) — SDK v2.1.1 syntax
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

def process_payment_webhook(payment_data):
    """
    Process payment success webhook and trigger automatic payout
    """
    try:
        with transaction.atomic():
            # Get payment record
            payment = Payment.objects.get(id=payment_data['payment_id'])
            
            # Update payment status
            payment.status = 'collected'
            payment.save()
            
            # Trigger automatic payout to handyman
            meSomb_service = MeSombService()
            payout_success = meSomb_service.process_automatic_payout(payment)
            
            if payout_success:
                # Update payment to fully processed
                payment.status = 'completed'
                payment.save()
                logger.info(f"Payment {payment.id} processed with automatic payout")
            else:
                # Mark as payout failed for manual review
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
