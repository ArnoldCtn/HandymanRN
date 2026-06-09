from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
import json
from .models import Payment

@csrf_exempt
def mesomb_webhook(request):
    if request.method != 'POST':
        return HttpResponse(status=405)
    
    try:
        data = json.loads(request.body)
        ref = data.get('reference')
        status = data.get('status')
        
        # Find payment by collection reference
        payment = Payment.objects.filter(collect_ref=ref).first()
        if not payment:
            # Maybe it's a payout
            payment = Payment.objects.filter(payout_ref=ref).first()
            if not payment:
                return HttpResponse("Payment not found", status=404)
        
        # Update status based on MeSomb status
        if status == 'SUCCESS':
            if payment.status == 'pending':
                payment.status = 'collected'
        else:
            payment.status = 'failed'
            
        payment.save()
        return HttpResponse("OK", status=200)
    except Exception as e:
        return HttpResponse(str(e), status=400)
