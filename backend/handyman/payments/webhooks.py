from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
import logging

logger = logging.getLogger(__name__)

@csrf_exempt
@require_http_methods(["POST"])
def payment_success_webhook(request):
    """Handle successful payment notifications from MeSomb"""
    try:
        data = json.loads(request.body)
        logger.info(f"Payment success webhook: {data}")
        
        # Extract payment details
        transaction_id = data.get('transaction', {}).get('id')
        amount = data.get('transaction', {}).get('amount')
        phone = data.get('transaction', {}).get('payer_phone')
        
        # Update payment status in database
        # TODO: Add actual payment update logic
        
        return JsonResponse({'status': 'success', 'message': 'Webhook received'})
    
    except Exception as e:
        logger.error(f"Payment success webhook error: {str(e)}")
        return JsonResponse({'status': 'error', 'message': 'Webhook processing failed'}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def payment_failed_webhook(request):
    """Handle failed payment notifications from MeSomb"""
    try:
        data = json.loads(request.body)
        logger.info(f"Payment failed webhook: {data}")
        
        # Extract payment details
        transaction_id = data.get('transaction', {}).get('id')
        reason = data.get('transaction', {}).get('reason')
        
        # Update payment status in database
        # TODO: Add actual payment update logic
        
        return JsonResponse({'status': 'success', 'message': 'Webhook received'})
    
    except Exception as e:
        logger.error(f"Payment failed webhook error: {str(e)}")
        return JsonResponse({'status': 'error', 'message': 'Webhook processing failed'}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def transfer_success_webhook(request):
    """Handle successful transfer notifications from MeSomb"""
    try:
        data = json.loads(request.body)
        logger.info(f"Transfer success webhook: {data}")
        
        # Extract transfer details
        transfer_id = data.get('transfer', {}).get('id')
        amount = data.get('transfer', {}).get('amount')
        recipient = data.get('transfer', {}).get('recipient')
        
        # Update transfer status in database
        # TODO: Add actual transfer update logic
        
        return JsonResponse({'status': 'success', 'message': 'Webhook received'})
    
    except Exception as e:
        logger.error(f"Transfer success webhook error: {str(e)}")
        return JsonResponse({'status': 'error', 'message': 'Webhook processing failed'}, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def balance_update_webhook(request):
    """Handle balance update notifications from MeSomb"""
    try:
        data = json.loads(request.body)
        logger.info(f"Balance update webhook: {data}")
        
        # Extract balance details
        balance = data.get('account', {}).get('balance')
        last_transaction = data.get('account', {}).get('last_transaction')
        
        # Update dashboard metrics
        # TODO: Add actual balance update logic
        
        return JsonResponse({'status': 'success', 'message': 'Webhook received'})
    
    except Exception as e:
        logger.error(f"Balance update webhook error: {str(e)}")
        return JsonResponse({'status': 'error', 'message': 'Webhook processing failed'}, status=400)
