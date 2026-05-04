# chats/views.py
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from handymen.models import Handyman
from bookings.models import Booking
from handyman.auth import DualJWTAuthentication
from .models import BookingMessage
from .serializers import BookingMessageSerializer


class BookingMessageListView(generics.ListAPIView):
    serializer_class = BookingMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [DualJWTAuthentication]

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


class MarkMessagesReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [DualJWTAuthentication]

    def post(self, request, booking_id):
        user = request.user
        booking = get_object_or_404(Booking, pk=booking_id)

        if isinstance(user, Handyman):
            if booking.handyman != user:
                return Response({"detail": "Not your booking"}, status=status.HTTP_403_FORBIDDEN)
            updated = BookingMessage.objects.filter(
                booking=booking, sender_user__isnull=False, is_read=False
            ).update(is_read=True)
        else:
            if booking.user != user:
                return Response({"detail": "Not your booking"}, status=status.HTTP_403_FORBIDDEN)
            updated = BookingMessage.objects.filter(
                booking=booking, sender_handyman__isnull=False, is_read=False
            ).update(is_read=True)

        print(f"[MarkRead] booking={booking_id}, user={user}, updated={updated}")
        return Response({"marked_as_read": updated})


class MyChatsListView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [DualJWTAuthentication]

    def get(self, request):
        user = request.user
        print(f"[MyChats] user={user}, type={type(user).__name__}, auth={request.auth}")
        
        # Get all bookings where user is involved and status is accepted
        if isinstance(user, Handyman):
            bookings = Booking.objects.filter(handyman=user, status='accepted')
            print(f"[MyChats] Handyman bookings found: {bookings.count()}")
        else:
            bookings = Booking.objects.filter(user=user, status='accepted')
            print(f"[MyChats] User bookings found: {bookings.count()}")
        
        chats_data = []
        
        for booking in bookings:
            # Get last message for this booking
            last_message = BookingMessage.objects.filter(booking=booking).order_by('-created_at').first()
            
            # Check if there are unread messages
            if isinstance(user, Handyman):
                # For handyman, messages sent by user are unread
                unread_count = BookingMessage.objects.filter(
                    booking=booking, 
                    sender_user__isnull=False,  # Sent by user
                    is_read=False
                ).count()
            else:
                # For user, messages sent by handyman are unread
                unread_count = BookingMessage.objects.filter(
                    booking=booking, 
                    sender_handyman__isnull=False,  # Sent by handyman
                    is_read=False
                ).count()
            
            # Get the other person's info
            other_person = booking.user if isinstance(user, Handyman) else booking.handyman
            
            # Build absolute URL for thumbnail (prevents ImageFieldFile serialization error)
            if other_person.thumbnail and hasattr(other_person.thumbnail, 'url'):
                other_thumbnail_url = request.build_absolute_uri(other_person.thumbnail.url)
            else:
                other_thumbnail_url = None
            
            chat_data = {
                'booking_id': booking.id,
                'other_username': other_person.username,
                'other_thumbnail': other_thumbnail_url,
                'last_message': last_message.message if last_message else None,
                'last_message_time': last_message.created_at.isoformat() if last_message else None,
                'has_unread_messages': unread_count > 0,
                'unread_count': unread_count,
            }
            
            chats_data.append(chat_data)
        
        # Sort by last message time (most recent first)
        chats_data.sort(key=lambda x: x['last_message_time'] or '', reverse=True)
        
        print(f"[MyChats] Returning {len(chats_data)} chats")
        for c in chats_data:
            print(f"  - booking={c['booking_id']}, other={c['other_username']}, thumb={c['other_thumbnail']}")
        return Response(chats_data)