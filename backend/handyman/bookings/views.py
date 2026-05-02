# bookings/views.py
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Booking
from .serializers import BookingSerializer, BookingCreateSerializer
from handymen.models import Handyman
from handyman.auth import DualJWTAuthentication


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
            booking.status = 'completed'
            booking.save()
            return Response(BookingSerializer(booking, context={'request': request}).data)

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