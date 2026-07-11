# chats/views.py
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.authentication import SessionAuthentication
from django.shortcuts import get_object_or_404
from handymen.models import Handyman
from bookings.models import Booking
from handyman.auth import DualJWTAuthentication
from .models import BookingMessage, SupportConversation, SupportMessage
from .serializers import BookingMessageSerializer

class ChatImageUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [DualJWTAuthentication, SessionAuthentication]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if not request.user.is_authenticated:
             return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)
             
        if 'image' not in request.FILES:
            return Response({"detail": "No image provided"}, status=status.HTTP_400_BAD_REQUEST)

        image = request.FILES['image']
        booking_id = request.data.get('booking_id')
        is_support = request.data.get('is_support') == 'true'

        if is_support:
            # Handle support image
            user = request.user
            if user.is_staff:
                return Response({"detail": "Admin image upload not implemented yet"}, status=status.HTTP_400_BAD_REQUEST)

            if isinstance(user, Handyman):
                conv = SupportConversation.objects.filter(handyman=user).first()
                if not conv: conv = SupportConversation.objects.create(handyman=user)
                msg = SupportMessage.objects.create(conversation=conv, sender_handyman=user, image=image)
            else:
                conv = SupportConversation.objects.filter(user=user).first()
                if not conv: conv = SupportConversation.objects.create(user=user)
                msg = SupportMessage.objects.create(conversation=conv, sender_user=user, image=image)

            # Return the absolute URL
            return Response({'image_url': request.build_absolute_uri(msg.image.url)}, status=status.HTTP_201_CREATED)

        else:
            # Handle booking image
            if not booking_id:
                return Response({"detail": "Booking ID required"}, status=status.HTTP_400_BAD_REQUEST)

            booking = get_object_or_404(Booking, pk=booking_id)
            user = request.user

            # Just save the image to the model's image field without creating a full message yet
            # Actually, the consumer needs a way to link the image to the message.
            # Let's create a temporary object or simply return the URL.

            # Since the consumer needs the image to exist, let's save the image 
            # to a temporary 'unassociated' object or just handle it differently.
            # Easiest: Keep the current logic but ensure consumer doesn't double-save.

            # Actually, the best way:
            # 1. API: Save image, return URL.
            # 2. WebSocket: Send URL, consumer saves message + associates image.

            # Current issue: API saves message, WS saves message.
            # FIX: Change API to only return URL, not save BookingMessage.

            # Generate a unique path for the image
            from django.core.files.storage import default_storage
            import uuid
            import os

            ext = os.path.splitext(image.name)[1]
            filename = f"chat_images/{uuid.uuid4()}{ext}"
            saved_path = default_storage.save(filename, image)
            image_url = request.build_absolute_uri(default_storage.url(saved_path))

            print(f"[ChatImageUpload] Saved image to: {saved_path}")
            return Response({'image_url': image_url}, status=status.HTTP_201_CREATED)


class BookingMessageListView(generics.ListAPIView):
    serializer_class = BookingMessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [DualJWTAuthentication, SessionAuthentication]

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
    authentication_classes = [DualJWTAuthentication, SessionAuthentication]

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
    authentication_classes = [DualJWTAuthentication, SessionAuthentication]

    def get(self, request):
        user = request.user
        
        # Get all bookings where user is involved and status is accepted
        if isinstance(user, Handyman):
            bookings = Booking.objects.filter(handyman=user, status='accepted')
        else:
            bookings = Booking.objects.filter(user=user, status='accepted')
        
        chats_data = []
        
        for booking in bookings:
            # Get last message for this booking
            last_message = BookingMessage.objects.filter(booking=booking).order_by('-created_at').first()
            
            # Check if there are unread messages
            if isinstance(user, Handyman):
                unread_count = BookingMessage.objects.filter(
                    booking=booking, 
                    sender_user__isnull=False,
                    is_read=False
                ).count()
            else:
                unread_count = BookingMessage.objects.filter(
                    booking=booking, 
                    sender_handyman__isnull=False,
                    is_read=False
                ).count()
            
            # Get the other person's info
            other_person = booking.user if isinstance(user, Handyman) else booking.handyman
            
            if other_person.thumbnail and hasattr(other_person.thumbnail, 'url'):
                other_thumbnail_url = request.build_absolute_uri(other_person.thumbnail.url)
            else:
                other_thumbnail_url = None
            
            # Determine last message text
            last_msg_text = None
            if last_message:
                if last_message.message:
                    last_msg_text = last_message.message
                elif last_message.image:
                    sender = last_message.sender_user or last_message.sender_handyman
                    sender_name = sender.username if sender else "Unknown"
                    last_msg_text = f"{sender_name} sent a photo"
            
            chat_data = {
                'booking_id': booking.id,
                'other_username': other_person.username,
                'other_thumbnail': other_thumbnail_url,
                'last_message': last_msg_text,
                'last_message_time': last_message.created_at.isoformat() if last_message else None,
                'has_unread_messages': unread_count > 0,
                'unread_count': unread_count,
            }
            
            chats_data.append(chat_data)
        
        chats_data.sort(key=lambda x: x['last_message_time'] or '', reverse=True)
        return Response(chats_data)


class SupportChatHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [DualJWTAuthentication, SessionAuthentication]

    def get(self, request, conversation_id):
        user = request.user
        conv = get_object_or_404(SupportConversation, pk=conversation_id)

        # Verify access
        if not user.is_staff:
            if isinstance(user, Handyman):
                if conv.handyman != user:
                    return Response({"detail": "Access denied"}, status=status.HTTP_403_FORBIDDEN)
            else:
                if conv.user != user:
                    return Response({"detail": "Access denied"}, status=status.HTTP_403_FORBIDDEN)

        messages = SupportMessage.objects.filter(conversation=conv).order_by('created_at')
        data = []
        for msg in messages:
            sender_name = "Admin" if msg.is_from_admin else (msg.sender_user.username if msg.sender_user else msg.sender_handyman.username)
            data.append({
                'id': msg.id,
                'message': msg.message,
                'is_from_admin': msg.is_from_admin,
                'sender_username': sender_name,
                'image_url': request.build_absolute_uri(msg.image.url) if msg.image else None,
                'created_at': msg.created_at.strftime("%Y-%m-%d %H:%M")
            })

        # Mark as read
        if user.is_staff:
            messages.filter(is_from_admin=False, is_read=False).update(is_read=True)
        else:
            messages.filter(is_from_admin=True, is_read=False).update(is_read=True)

        return Response(data)


class GetOrCreateSupportConversationView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [DualJWTAuthentication, SessionAuthentication]

    def post(self, request):
        user = request.user
        try:
            if isinstance(user, Handyman):
                conv, created = SupportConversation.objects.get_or_create(handyman=user)
            else:
                conv, created = SupportConversation.objects.get_or_create(user=user)
        except Exception as e:
            print(f"[SupportInit] Multiple conversations or error: {e}")
            if isinstance(user, Handyman):
                conv = SupportConversation.objects.filter(handyman=user).first()
            else:
                conv = SupportConversation.objects.filter(user=user).first()
            
            if not conv:
                return Response({"detail": "Could not initialize support conversation"}, status=500)

        return Response({
            'conversation_id': conv.id,
            'room_name': f"support_h_{user.id}" if isinstance(user, Handyman) else f"support_{user.id}"
        })
