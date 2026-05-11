from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db import transaction
from .models import Payment
from .services import process_payment_webhook
import logging

logger = logging.getLogger(__name__)

@csrf_exempt
@require_http_methods(["POST"])
def payment_success_webhook(request):
    """Handle all MeSomb webhook events (single URL, multiple events)"""
    try:
        import json
        data = json.loads(request.body)
        logger.info(f"MeSomb webhook received: {data}")
        
        # Get event type
        event_type = data.get('event')
        
        # Handle different event types
        if event_type == 'payment.success':
            return handle_payment_success(data)
        elif event_type == 'payment.failed':
            return handle_payment_failed(data)
        elif event_type == 'transfer.success':
            return handle_transfer_success(data)
        elif event_type == 'balance.update':
            return handle_balance_update(data)
        else:
            logger.warning(f"Unknown event type: {event_type}")
            return JsonResponse({'status': 'success', 'message': f'Event {event_type} received'})
    
    except Exception as e:
        logger.error(f"Webhook processing error: {str(e)}")
        return JsonResponse({'status': 'error', 'message': 'Webhook processing failed'}, status=400)

def handle_payment_success(data):
    """Handle successful payment event"""
    payment_id = data.get('transaction', {}).get('id')
    
    if payment_id:
        # Trigger automatic payout to handyman
        payout_success = process_payment_webhook({
            'payment_id': payment_id,
            'transaction_data': data
        })
        
        if payout_success:
            return JsonResponse({'status': 'success', 'message': 'Payment processed with automatic payout'})
        else:
            return JsonResponse({'status': 'error', 'message': 'Payout processing failed'}, status=500)
    
    return JsonResponse({'status': 'success', 'message': 'Payment success event processed'})

def handle_payment_failed(data):
    """Handle failed payment event"""
    payment_id = data.get('transaction', {}).get('id')
    
    if payment_id:
        # Update payment status to failed
        Payment.objects.filter(id=payment_id).update(status='failed')
        logger.info(f"Payment {payment_id} marked as failed")
    
    return JsonResponse({'status': 'success', 'message': 'Payment failed event processed'})

def handle_transfer_success(data):
    """Handle successful transfer event"""
    transfer_id = data.get('transfer', {}).get('id')
    logger.info(f"Transfer {transfer_id} completed successfully")
    return JsonResponse({'status': 'success', 'message': 'Transfer success event processed'})

def handle_balance_update(data):
    """Handle balance update event"""
    balance = data.get('account', {}).get('balance')
    logger.info(f"Account balance updated: {balance}")
    return JsonResponse({'status': 'success', 'message': 'Balance update event processed'})

@csrf_exempt
@require_http_methods(["POST"])
def payment_failed_webhook(request):
    """Handle failed payment notifications from MeSomb"""
    try:
        import json
        data = json.loads(request.body)
        logger.info(f"Payment failed webhook: {data}")
        
        # Extract payment details
        payment_id = data.get('transaction', {}).get('id')
        
        if payment_id:
            # Update payment status to failed
            Payment.objects.filter(id=payment_id).update(status='failed')
            logger.info(f"Payment {payment_id} marked as failed")
        
        return JsonResponse({'status': 'success', 'message': 'Webhook received'})
    
    except Exception as e:
        logger.error(f"Payment failed webhook error: {str(e)}")
        return JsonResponse({'status': 'error', 'message': 'Webhook processing failed'}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def transfer_success_webhook(request):
    """Handle successful transfer notifications from MeSomb"""
    try:
        import json
        data = json.loads(request.body)
        logger.info(f"Transfer success webhook: {data}")
        
        # Extract transfer details
        transfer_id = data.get('transfer', {}).get('id')
        
        # You can add transfer tracking logic here
        logger.info(f"Transfer {transfer_id} completed successfully")
        
        return JsonResponse({'status': 'success', 'message': 'Webhook received'})
    
    except Exception as e:
        logger.error(f"Transfer success webhook error: {str(e)}")
        return JsonResponse({'status': 'error', 'message': 'Webhook processing failed'}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def balance_update_webhook(request):
    """Handle balance update notifications from MeSomb"""
    try:
        import json
        data = json.loads(request.body)
        logger.info(f"Balance update webhook: {data}")
        
        # Extract balance details
        balance = data.get('account', {}).get('balance')
        
        # You can add balance tracking logic here
        logger.info(f"Account balance updated: {balance}")
        
        return JsonResponse({'status': 'success', 'message': 'Webhook received'})
    
    except Exception as e:
        logger.error(f"Balance update webhook error: {str(e)}")
        return JsonResponse({'status': 'error', 'message': 'Webhook processing failed'}, status=400)
