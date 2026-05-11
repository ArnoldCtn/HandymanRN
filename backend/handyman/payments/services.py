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
                error_msg = 'MeSomb operation failed'
                if hasattr(response, 'message') and response.message:
                    error_msg = response.message
                elif hasattr(response, 'detail') and response.detail:
                    error_msg = response.detail
                logger.error(f"[MeSombService.collect_payment] FAILED | MeSomb error: {error_msg}")
                return {
                    'success': False,
                    'error': error_msg,
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
                amount=handyman_share,
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
        total_amount = payment.total_amount
        
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
