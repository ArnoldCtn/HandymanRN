# bookings/views.py
import logging

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Booking
from .serializers import BookingSerializer, BookingCreateSerializer
from handymen.models import Handyman
from handyman.auth import DualJWTAuthentication

logger = logging.getLogger(__name__)


class BookingListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [DualJWTAuthentication]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return BookingCreateSerializer
        return BookingSerializer

    def get_queryset(self):
        user = self.request.user
        print(f"🔍 DEBUG: BookingListCreateView.get_queryset called for user: {user} (type: {type(user)})")
        
        if isinstance(user, Handyman):
            queryset = Booking.objects.filter(handyman=user).select_related('handyman', 'service', 'location').order_by('-created_at')
            print(f"🔍 DEBUG: Handyman queryset count: {queryset.count()}")
            print(f"🔍 DEBUG: Handyman ID: {user.id}")
            return queryset
        else:
            queryset = Booking.objects.filter(user=user).select_related('handyman', 'service', 'location').order_by('-created_at')
            print(f"🔍 DEBUG: User queryset count: {queryset.count()}")
            print(f"🔍 DEBUG: User ID: {user.id}")
            return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class BookingDetailView(generics.RetrieveAPIView):
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [DualJWTAuthentication]

    def get_queryset(self):
        user = self.request.user
        print(f"🔍 DEBUG: BookingDetailView.get_queryset called for user: {user} (type: {type(user)})")
        
        if isinstance(user, Handyman):
            queryset = Booking.objects.filter(handyman=user).select_related('handyman', 'service', 'location').order_by('-created_at')
            print(f"🔍 DEBUG: Handyman queryset count: {queryset.count()}")
            return queryset
        else:
            queryset = Booking.objects.filter(user=user).select_related('handyman', 'service', 'location').order_by('-created_at')
            print(f"🔍 DEBUG: User queryset count: {queryset.count()}")
            return queryset


class BookingAcceptDeclineView(generics.UpdateAPIView):
    """Handyman accepts/declines, user marks complete"""
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [DualJWTAuthentication]

    def patch(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)
        action = request.data.get('action')

        if action == 'accept':
            # Only handyman can accept
            if not isinstance(request.user, Handyman) or booking.handyman != request.user:
                return Response({"detail": "Only the handyman can accept"}, status=status.HTTP_403_FORBIDDEN)
            booking.status = 'accepted'
            booking.save()
            return Response(BookingSerializer(booking, context={'request': request}).data)

        elif action == 'decline':
            # Only handyman can decline
            if not isinstance(request.user, Handyman) or booking.handyman != request.user:
                return Response({"detail": "Only the handyman can decline"}, status=status.HTTP_403_FORBIDDEN)
            booking.status = 'declined'
            booking.cancellation_reason = request.data.get('reason', '')
            booking.save()
            return Response(BookingSerializer(booking, context={'request': request}).data)

        elif action == 'complete':
            # Only user (customer) can mark complete
            if isinstance(request.user, Handyman):
                return Response({"detail": "Only the customer can mark as completed"}, status=status.HTTP_403_FORBIDDEN)
            if booking.user != request.user:
                return Response({"detail": "Not your booking"}, status=status.HTTP_403_FORBIDDEN)
            if booking.status != 'accepted':
                return Response({"detail": "Booking must be accepted first"}, status=status.HTTP_400_BAD_REQUEST)
            
            # ── PAYMENT COLLECTION ───────────────────────────────────────
            payment_provider = request.data.get('payment_provider')
            payment_number = request.data.get('payment_number')
            
            print(f"[PAYMENT DEBUG] action=complete | booking={booking.id} | provider={payment_provider} | number={payment_number} | amount={booking.total_amount}")
            logger.info(f"[PAYMENT DEBUG] action=complete | booking={booking.id} | provider={payment_provider} | number={payment_number} | amount={booking.total_amount}")
            
            if not payment_provider or not payment_number:
                logger.error(f"[PAYMENT DEBUG] Missing payment details | provider={payment_provider} | number={payment_number}")
                return Response({
                    "detail": "Payment provider and phone number are required",
                    "error_code": "MISSING_PAYMENT_DETAILS"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Import here to avoid circular imports
            from payments.models import Payment
            from payments.services import MeSombService
            from decimal import Decimal
            
            # Calculate fees based on handyman subscription
            total = float(booking.total_amount)
            handyman = booking.handyman
            if handyman.subscription_level == 'premium':
                handyman_pct = 0.80
            elif handyman.subscription_level == 'pro':
                handyman_pct = 0.75
            else:
                handyman_pct = 0.70
            
            platform_fee = round(total * (1 - handyman_pct), 2)
            handyman_amount = round(total * handyman_pct, 2)
            
            print(f"[PAYMENT DEBUG] Split | total={total} | handyman_pct={handyman_pct} | platform_fee={platform_fee} | handyman_amount={handyman_amount}")
            logger.info(f"[PAYMENT DEBUG] Split | total={total} | handyman_pct={handyman_pct} | platform_fee={platform_fee} | handyman_amount={handyman_amount}")
            
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
                print(f"[PAYMENT DEBUG] Payment record created | id={payment.id}")
                logger.info(f"[PAYMENT DEBUG] Payment record created | id={payment.id}")
            except Exception as e:
                print(f"[PAYMENT DEBUG] FAILED to create Payment record: {e}")
                logger.error(f"[PAYMENT DEBUG] FAILED to create Payment record: {e}")
                return Response({
                    "detail": f"Failed to create payment record: {str(e)}",
                    "error_code": "PAYMENT_RECORD_ERROR"
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            # Call MeSomb to collect payment from user's phone
            print(f"[PAYMENT DEBUG] Initializing MeSombService...")
            logger.info(f"[PAYMENT DEBUG] Initializing MeSombService...")
            mesomb = MeSombService()
            
            print(f"[PAYMENT DEBUG] Calling mesomb.collect_payment()...")
            logger.info(f"[PAYMENT DEBUG] Calling mesomb.collect_payment()...")
            collect_result = mesomb.collect_payment(
                amount=total,
                payer_number=payment_number,
                service=payment_provider,
                booking_id=booking.id,
                user_id=booking.user.id
            )
            
            print(f"[PAYMENT DEBUG] MeSomb collect result: {collect_result}")
            logger.info(f"[PAYMENT DEBUG] MeSomb collect result: {collect_result}")
            
            if collect_result['success']:
                # Payment initiated successfully
                payment.collect_ref = collect_result.get('transaction_id')
                payment.collect_status = collect_result.get('status')
                payment.status = 'collected'
                payment.save()
                
                print(f"[PAYMENT DEBUG] Collection SUCCESS | txn_id={payment.collect_ref}")
                logger.info(f"[PAYMENT DEBUG] Collection SUCCESS | txn_id={payment.collect_ref}")
                
                # Now mark booking complete and trigger payout
                booking.status = 'completed'
                booking.save()
                
                # Trigger automatic payout to handyman
                payout_result = mesomb.process_automatic_payout(payment)
                print(f"[PAYMENT DEBUG] Payout result: {payout_result}")
                logger.info(f"[PAYMENT DEBUG] Payout result: {payout_result}")
                
                if payout_result:
                    payment.status = 'completed'
                    payment.handyman_withdrawal_status = 'completed'
                    payment.save()
                    print(f"[PAYMENT DEBUG] Payment FULLY COMPLETED | booking={booking.id}")
                    logger.info(f"[PAYMENT DEBUG] Payment FULLY COMPLETED | booking={booking.id}")
                else:
                    payment.status = 'collected'  # collected but payout pending
                    payment.save()
                    print(f"[PAYMENT DEBUG] Payment COLLECTED but payout failed | booking={booking.id}")
                    logger.warning(f"[PAYMENT DEBUG] Payment COLLECTED but payout failed | booking={booking.id}")
                
                return Response({
                    "detail": "Payment successful! Booking completed.",
                    "payment_status": payment.status,
                    "transaction_id": payment.collect_ref,
                    "amount_paid": total,
                    "handyman_amount": handyman_amount,
                    "platform_fee": platform_fee,
                    "booking": BookingSerializer(booking, context={'request': request}).data
                }, status=status.HTTP_200_OK)
            
            else:
                # MeSomb collection failed
                error_msg = collect_result.get('error', 'Unknown error')
                payment.status = 'failed'
                payment.error_message = error_msg
                payment.save()
                
                print(f"[PAYMENT DEBUG] Collection FAILED | error={error_msg}")
                logger.error(f"[PAYMENT DEBUG] Collection FAILED | error={error_msg}")
                
                return Response({
                    "detail": f"Payment failed: {error_msg}",
                    "error_code": "PAYMENT_FAILED",
                    "mesomb_error": error_msg,
                    "debug_info": collect_result.get('mesomb_response')
                }, status=status.HTTP_402_PAYMENT_REQUIRED)

        return Response({"detail": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)


class BookingModifyPriceView(generics.UpdateAPIView):
    """User modifies the price of a booking (only before payment)"""
    serializer_class = BookingSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [DualJWTAuthentication]

    def patch(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)

        # Only the user (customer) can modify price
        if isinstance(request.user, Handyman):
            return Response({"detail": "Only customers can modify price"}, status=status.HTTP_403_FORBIDDEN)
        if booking.user != request.user:
            return Response({"detail": "Not your booking"}, status=status.HTTP_403_FORBIDDEN)
        if booking.status not in ('pending', 'accepted'):
            return Response({"detail": "Cannot modify price at this stage"}, status=status.HTTP_400_BAD_REQUEST)

        new_amount = request.data.get('total_amount')
        if new_amount is None:
            return Response({"detail": "total_amount required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            new_amount = float(new_amount)
            if new_amount < 0:
                raise ValueError
        except (ValueError, TypeError):
            return Response({"detail": "Invalid amount"}, status=status.HTTP_400_BAD_REQUEST)

        booking.total_amount = new_amount
        booking.save()
        return Response(BookingSerializer(booking, context={'request': request}).data)