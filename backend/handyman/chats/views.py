# chats/views.py
from rest_framework import generics, permissions
from handymen.models import Handyman
from bookings.models import Booking
from .models import BookingMessage
from .serializers import BookingMessageSerializer


class BookingMessageListView(generics.ListAPIView):
    serializer_class = BookingMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        booking_id = self.kwargs['booking_id']
        user = self.request.user
        # Verify user is part of this booking
        try:
            booking = Booking.objects.get(pk=booking_id)
            if isinstance(user, Handyman):
                assert booking.handyman == user
            else:
                assert booking.user == user
        except (Booking.DoesNotExist, AssertionError):
            return BookingMessage.objects.none()

        return BookingMessage.objects.filter(booking_id=booking_id).order_by('created_at')