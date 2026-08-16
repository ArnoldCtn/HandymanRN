from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
import json
import logging
from .models import Payment
from bookings.models import Booking

logger = logging.getLogger(__name__)

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
            payment.status = 'failed'
            payment.collect_status = 'FAILED'
            payment.error_message = data.get('message', 'Payment failed via webhook')
            payment.save()
            logger.info(f"[WEBHOOK] Payment {payment.id} marked as failed: {payment.error_message}")
            
        elif status == 'CANCELLED':
            payment.status = 'failed'
            payment.collect_status = 'CANCELLED'
            payment.error_message = data.get('message', 'Payment cancelled by user')
            payment.save()
            logger.info(f"[WEBHOOK] Payment {payment.id} marked as cancelled")
        
        # Return 200 OK to MeSomb
        return HttpResponse("OK", status=200)
        
    except Exception as e:
        logger.error(f"[WEBHOOK] Error processing webhook: {e}", exc_info=True)
        return HttpResponse(str(e), status=400)
