from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
import json
import logging
from .models import Payment
from bookings.models import Booking

logger = logging.getLogger(__name__)

# Messages that carry no usable reason for users/admins. MeSomb sends our own
# merchant name ("By HandymanWest") in the webhook `message` field, and older
# code stored raw Python errors like "TypeError: 'NoneType' ...".
_JUNK_MESSAGE_MARKERS = ('by handymanwest', 'handymanwest', 'typeerror', 'nonetype')
_DEFAULT_FAILED_MESSAGE = 'Payment failed. Please check your mobile money account and try again.'
_DEFAULT_CANCELLED_MESSAGE = 'Transaction cancelled: You cancelled the payment on your phone. Please try again if you want to proceed.'
_TERMINAL_SUCCESS_STATUSES = ('collected', 'completed', 'split', 'refunded')


def _message_is_actionable(message):
    """True when a failure message carries a usable reason."""
    if not message or not str(message).strip():
        return False
    normalized = str(message).strip().lower()
    return not any(marker in normalized for marker in _JUNK_MESSAGE_MARKERS)


def _failure_details_from_webhook(incoming, current):
    """
    Pick the best (message, error_code) pair for a failed payment.
    Never degrades an existing specific message with generic webhook noise.
    """
    if _message_is_actionable(current):
        return current, None

    incoming_text = (incoming or '').strip()
    if _message_is_actionable(incoming_text):
        mapped = None
        try:
            from .services import MeSombService
            mapped = MeSombService()._map_mesomb_error(incoming_text)
        except Exception as e:
            logger.warning(f"[WEBHOOK] Could not map webhook message: {e}")
        if mapped and mapped['code'] != 'UNKNOWN_ERROR':
            return mapped['message'], mapped['code']
        return incoming_text, None

    return _DEFAULT_FAILED_MESSAGE, 'UNKNOWN_ERROR'

@csrf_exempt
def mesomb_webhook(request):
    if request.method != 'POST':
        logger.warning(f"[WEBHOOK] Received non-POST request: {request.method}")
        return HttpResponse(status=405)
    
    try:
        # Log the incoming webhook
        body = request.body.decode('utf-8')
        logger.info(f"[WEBHOOK] Received webhook: {body}")
        
        data = json.loads(request.body)
        ref = data.get('reference')
        status = data.get('status')
        transaction_id = data.get('fin_trx_id') or data.get('transaction_id')
        amount = data.get('amount')
        
        logger.info(f"[WEBHOOK] Processing: ref={ref}, status={status}, tx_id={transaction_id}")
        
        if not ref:
            logger.error("[WEBHOOK] No reference in webhook data")
            return HttpResponse("Missing reference", status=400)
        
        # Find payment by collection reference
        payment = Payment.objects.filter(collect_ref=ref).first()
        if not payment:
            # Maybe it's a payout
            payment = Payment.objects.filter(payout_ref=ref).first()
        if not payment and str(ref).isdigit():
            payment = Payment.objects.filter(booking_id=int(ref)).order_by('-id').first()
        if not payment:
            logger.warning(f"[WEBHOOK] Payment not found for ref={ref}")
            return HttpResponse("Payment not found", status=404)
        
        logger.info(f"[WEBHOOK] Found payment: id={payment.id}, current_status={payment.status}, booking={payment.booking.id if payment.booking else 'None'}")
        
        # Update status based on MeSomb status
        if status == 'SUCCESS':
            if payment.status in ['pending', 'collected']:
                payment.status = 'collected'
                payment.collect_status = 'SUCCESS'
                if transaction_id:
                    payment.collect_ref = transaction_id
                
                # Update booking status to completed
                if payment.booking and payment.booking.status != 'completed':
                    payment.booking.status = 'completed'
                    payment.booking.completed_at = timezone.now()
                    payment.booking.save()
                    logger.info(f"[WEBHOOK] Booking {payment.booking.id} marked as completed")
                
                payment.save()
                logger.info(f"[WEBHOOK] Payment {payment.id} marked as collected")
                
        elif status == 'FAILED':
            # Never downgrade a terminal success state
            if payment.status in _TERMINAL_SUCCESS_STATUSES:
                logger.warning(f"[WEBHOOK] Ignoring FAILED webhook for payment {payment.id}: already '{payment.status}'")
                return HttpResponse("OK", status=200)

            new_message, new_code = _failure_details_from_webhook(
                data.get('message'), payment.error_message
            )
            payment.status = 'failed'
            payment.collect_status = 'FAILED'
            payment.error_message = new_message
            if new_code:
                payment.error_code = new_code
            elif not payment.error_code:
                payment.error_code = 'WEBHOOK_FAILED'
            payment.save()
            logger.info(f"[WEBHOOK] Payment {payment.id} marked as failed: {payment.error_message} (code={payment.error_code})")

        elif status == 'CANCELLED':
            # Never downgrade a terminal success state
            if payment.status in _TERMINAL_SUCCESS_STATUSES:
                logger.warning(f"[WEBHOOK] Ignoring CANCELLED webhook for payment {payment.id}: already '{payment.status}'")
                return HttpResponse("OK", status=200)

            incoming_text = (data.get('message') or '').strip()
            payment.status = 'failed'
            payment.collect_status = 'CANCELLED'
            if _message_is_actionable(incoming_text):
                payment.error_message = incoming_text
            elif not _message_is_actionable(payment.error_message):
                payment.error_message = _DEFAULT_CANCELLED_MESSAGE
            # A cancellation event is definitive - always override stale codes
            payment.error_code = 'CANCELLED_BY_USER'
            payment.save()
            logger.info(f"[WEBHOOK] Payment {payment.id} marked as cancelled: {payment.error_message}")
        
        # Return 200 OK to MeSomb
        return HttpResponse("OK", status=200)
        
    except Exception as e:
        logger.error(f"[WEBHOOK] Error processing webhook: {e}", exc_info=True)
        return HttpResponse(str(e), status=400)
