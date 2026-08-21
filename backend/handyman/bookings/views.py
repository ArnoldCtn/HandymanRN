# bookings/views.py
import logging

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
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

        elif action == 'cancel':
            # Only the user (customer) can cancel their own booking
            if isinstance(request.user, Handyman):
                return Response({"detail": "Only the customer can cancel"}, status=status.HTTP_403_FORBIDDEN)
            if booking.user != request.user:
                return Response({"detail": "Not your booking"}, status=status.HTTP_403_FORBIDDEN)
            if booking.status not in ['pending', 'accepted']:
                return Response({"detail": "Cannot cancel booking at this stage"}, status=status.HTTP_400_BAD_REQUEST)
            
            booking.status = 'cancelled'
            booking.cancelled_at = timezone.now()
            booking.cancellation_reason = request.data.get('reason', 'Cancelled by user')
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
            
            logger.info(f"[PAYMENT] action=complete | booking={booking.id} | provider={payment_provider} | number={payment_number} | amount={booking.total_amount}")
            
            if not payment_provider or not payment_number:
                logger.error(f"[PAYMENT] Missing payment details | provider={payment_provider} | number={payment_number}")
                return Response({
                    "detail": "Payment provider and phone number are required",
                    "error_code": "MISSING_PAYMENT_DETAILS"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Import here to avoid circular imports
            from payments.services import process_payment_async
            
            # Process payment asynchronously - returns immediately
            result = process_payment_async(booking, payment_provider, payment_number)
            
            logger.info(f"[PAYMENT] Async result for booking {booking.id}: success={result['success']}")
            
            if result['success']:
                # Return immediately with pending status - webhook will update later
                return Response({
                    "detail": "Payment initiated. Please check your phone for PIN entry.",
                    "payment_id": result['payment_id'],
                    "status": "pending",
                    "message": "You will receive a PIN request on your phone. Please enter your PIN to complete the payment."
                }, status=status.HTTP_200_OK)
            else:
                # Return specific error with proper HTTP status
                http_status = result.get('http_status', 402)
                error_code = result.get('error_code', 'UNKNOWN_ERROR')
                error_msg = result.get('error', 'Payment failed')
                
                return Response({
                    "detail": error_msg,
                    "error_code": error_code,
                    "mesomb_raw_error": result.get('mesomb_raw_error'),
                    "mesomb_error_code": result.get('mesomb_error_code')
                }, status=http_status)

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

        # Enforce category minimum price floor on modification
        if booking.category and booking.category.price is not None:
            if new_amount < float(booking.category.price):
                return Response({
                    "detail": f"Price cannot be less than the category minimum of {booking.category.price} FCFA"
                }, status=status.HTTP_400_BAD_REQUEST)

        booking.total_amount = new_amount
        booking.save()
        return Response(BookingSerializer(booking, context={'request': request}).data)


class PaymentStatusView(generics.RetrieveAPIView):
    """Get payment status for a booking (for polling)"""
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [DualJWTAuthentication]

    def get(self, request, pk):
        try:
            booking = get_object_or_404(Booking, pk=pk)
            
            # Check permissions
            if isinstance(request.user, Handyman):
                if booking.handyman != request.user:
                    return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
            else:
                if booking.user != request.user:
                    return Response({"detail": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
            
            # Get payment info
            try:
                # Use related_name='payment' from the Payment model
                payment = booking.payment.first()
                if not payment:
                    return Response({
                        "status": "no_payment",
                        "booking_status": booking.status,
                        "message": "No payment initiated"
                    })
                
                # Safely get payment fields with defaults
                return Response({
                    "payment_id": payment.id,
                    "status": payment.status or 'pending',
                    "booking_status": booking.status,
                    "amount": float(payment.gross_amount) if payment.gross_amount else 0.0,
                    "method": payment.method or 'mtn',
                    "payer_number": payment.payer_number or '',
                    "collect_ref": payment.collect_ref or '',
                    "error_message": payment.error_message if payment.status == 'failed' else None,
                    "error_code": payment.error_code if payment.status == 'failed' else None,
                    "handyman_amount": float(payment.handyman_amount) if payment.handyman_amount else 0.0,
                    "platform_fee": float(payment.platform_fee) if payment.platform_fee else 0.0
                })
            except Exception as e:
                logger.error(f"Error fetching payment status: {e}", exc_info=True)
                return Response({
                    "status": "error",
                    "message": f"Failed to fetch payment status: {str(e)}"
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            logger.error(f"Critical error in PaymentStatusView: {e}", exc_info=True)
            return Response({
                "status": "error",
                "message": "Critical server error"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
