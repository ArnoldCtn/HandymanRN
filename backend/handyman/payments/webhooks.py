from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import logging

logger = logging.getLogger(__name__)

def _update_payment_from_webhook(data, webhook_type):
    """Update payment and booking status based on webhook data."""
    try:
        from payments.models import Payment
        from bookings.models import Booking
        from payments.services import MeSombService
        
        # Extract data from webhook
        status = data.get('status')  # SUCCESS or FAILED
        transaction_id = data.get('pk') or data.get('id')
        reference = data.get('reference')  # This is our booking_id
        amount = data.get('amount')
        
        logger.info(f"[Webhook] Processing {webhook_type} | status={status} | ref={reference} | txn={transaction_id}")
        
        if not reference:
            logger.error("[Webhook] No reference (booking_id) in webhook data")
            return False
        
        try:
            booking_id = int(reference)
            booking = Booking.objects.get(id=booking_id)
            payment = Payment.objects.filter(booking=booking).order_by('-created_at').first()
            
            if not payment:
                logger.error(f"[Webhook] No payment found for booking {booking_id}")
                return False
            
            if status == 'SUCCESS':
                # Payment succeeded
                payment.collect_ref = transaction_id
                payment.collect_status = 'SUCCESS'
                payment.status = 'collected'
                payment.save()
                
                booking.status = 'completed'
                booking.save()
                
                # Trigger automatic payout
                mesomb = MeSombService()
                payout_result = mesomb.process_automatic_payout(payment)
                if payout_result:
                    payment.status = 'completed'
                    payment.handyman_withdrawal_status = 'completed'
                    payment.save()
                    logger.info(f"[Webhook] Payment FULLY COMPLETED for booking {booking_id}")
                else:
                    payment.status = 'collected'
                    payment.save()
                    logger.warning(f"[Webhook] Payment collected but payout failed for booking {booking_id}")
                
            elif status == 'FAILED':
                # Payment failed
                reason = data.get('message') or data.get('reason') or 'Payment failed'
                payment.collect_ref = transaction_id
                payment.collect_status = 'FAILED'
                payment.status = 'failed'
                payment.error_message = reason
                payment.save()
                
                logger.info(f"[Webhook] Payment FAILED for booking {booking_id}: {reason}")
            else:
                logger.warning(f"[Webhook] Unknown status '{status}' for booking {booking_id}")
                
            return True
            
        except Booking.DoesNotExist:
            logger.error(f"[Webhook] Booking {reference} not found")
            return False
        except Exception as e:
            logger.error(f"[Webhook] Error updating payment: {e}")
            return False
            
    except Exception as e:
        logger.error(f"[Webhook] Error in _update_payment_from_webhook: {e}")
        return False

@csrf_exempt
@require_http_methods(["POST"])
def payment_success_webhook(request):
    """Handle successful payment notifications from MeSomb"""
    try:
        data = json.loads(request.body)
        logger.info(f"[Webhook] Payment success webhook received: {data}")
        
        success = _update_payment_from_webhook(data, 'payment_success')
        
        if success:
            return JsonResponse({'status': 'success', 'message': 'Payment processed'})
        else:
            return JsonResponse({'status': 'error', 'message': 'Payment not found or update failed'}, status=400)
    
    except Exception as e:
        logger.error(f"[Webhook] Payment success webhook error: {str(e)}")
        return JsonResponse({'status': 'error', 'message': 'Webhook processing failed'}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def payment_failed_webhook(request):
    """Handle failed payment notifications from MeSomb"""
    try:
        data = json.loads(request.body)
        logger.info(f"[Webhook] Payment failed webhook received: {data}")
        
        success = _update_payment_from_webhook(data, 'payment_failed')
        
        if success:
            return JsonResponse({'status': 'success', 'message': 'Payment failure processed'})
        else:
            return JsonResponse({'status': 'error', 'message': 'Payment not found or update failed'}, status=400)
    
    except Exception as e:
        logger.error(f"[Webhook] Payment failed webhook error: {str(e)}")
        return JsonResponse({'status': 'error', 'message': 'Webhook processing failed'}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def transfer_success_webhook(request):
    """Handle successful transfer notifications from MeSomb"""
    try:
        data = json.loads(request.body)
        logger.info(f"[Webhook] Transfer success webhook: {data}")
        
        # TODO: Update transfer/payout status when transfer webhook is implemented
        
        return JsonResponse({'status': 'success', 'message': 'Transfer webhook received'})
    
    except Exception as e:
        logger.error(f"[Webhook] Transfer success webhook error: {str(e)}")
        return JsonResponse({'status': 'error', 'message': 'Webhook processing failed'}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def balance_update_webhook(request):
    """Handle balance update notifications from MeSomb"""
    try:
        data = json.loads(request.body)
        logger.info(f"[Webhook] Balance update webhook: {data}")
        
        # TODO: Implement balance tracking when needed
        
        return JsonResponse({'status': 'success', 'message': 'Balance webhook received'})
    
    except Exception as e:
        logger.error(f"[Webhook] Balance update webhook error: {str(e)}")
        return JsonResponse({'status': 'error', 'message': 'Webhook processing failed'}, status=400)
