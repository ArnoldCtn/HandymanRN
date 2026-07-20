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

class ChatMediaUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [DualJWTAuthentication, SessionAuthentication]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        if not request.user.is_authenticated:
             return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Determine media type
        media_type = request.data.get('media_type')  # 'image', 'video', 'audio'
        
        if media_type == 'image' and 'image' in request.FILES:
            media_file = request.FILES['image']
            upload_folder = 'chat_images'
            file_extension = 'image_url'
        elif media_type == 'video' and 'video' in request.FILES:
            media_file = request.FILES['video']
            upload_folder = 'chat_videos'
            file_extension = 'video_url'
        elif media_type == 'audio' and 'audio' in request.FILES:
            media_file = request.FILES['audio']
            upload_folder = 'chat_audio'
            file_extension = 'audio_url'
        else:
            return Response({"detail": "No valid media file provided"}, status=status.HTTP_400_BAD_REQUEST)

        booking_id = request.data.get('booking_id')
        is_support = request.data.get('is_support') == 'true'
        duration = int(request.data.get('duration', 0))

        # Enforce 30-second limit for videos
        if media_type == 'video' and duration > 30:
            return Response(
                {"detail": f"Video too long ({duration}s). Maximum allowed duration is 30 seconds."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if is_support:
            # Handle support media
            user = request.user
            if user.is_staff:
                return Response({"detail": "Admin media upload not implemented yet"}, status=status.HTTP_400_BAD_REQUEST)

            if isinstance(user, Handyman):
                conv = SupportConversation.objects.filter(handyman=user).first()
                if not conv: conv = SupportConversation.objects.create(handyman=user)
                msg = SupportMessage.objects.create(conversation=conv, sender_handyman=user, image=media_file)
            else:
                conv = SupportConversation.objects.filter(user=user).first()
                if not conv: conv = SupportConversation.objects.create(user=user)
                msg = SupportMessage.objects.create(conversation=conv, sender_user=user, image=media_file)

            # Return the absolute URL
            return Response({'image_url': request.build_absolute_uri(msg.image.url)}, status=status.HTTP_201_CREATED)

        else:
            # Handle booking media
            if not booking_id:
                return Response({"detail": "Booking ID required"}, status=status.HTTP_400_BAD_REQUEST)

            booking = get_object_or_404(Booking, pk=booking_id)
            
            # Generate a unique path for the media
            from django.core.files.storage import default_storage
            import uuid
            import os

            ext = os.path.splitext(media_file.name)[1]
            filename = f"{upload_folder}/{uuid.uuid4()}{ext}"
            saved_path = default_storage.save(filename, media_file)
            media_url = request.build_absolute_uri(default_storage.url(saved_path))
            
            # saved_path is the relative path like 'chat_videos/uuid.mp4'
            relative_path = saved_path

            print(f"[ChatMediaUpload] ==========")
            print(f"[ChatMediaUpload] {media_type.upper()} UPLOAD:")
            print(f"[ChatMediaUpload]   original filename: {media_file.name}")
            print(f"[ChatMediaUpload]   saved_path: {saved_path}")
            print(f"[ChatMediaUpload]   relative_path: {relative_path}")
            print(f"[ChatMediaUpload]   media_url: {media_url}")
            print(f"[ChatMediaUpload] ==========")
            
            response_data = {file_extension: media_url}
            
            # Return the relative path so WebSocket consumer can save it directly
            response_data['relative_path'] = relative_path
            print(f"[ChatMediaUpload] Returning response_data: {list(response_data.keys())}")
            
            # For videos, also generate a thumbnail (simplified - just return video URL)
            # In production, you'd use ffmpeg to generate actual thumbnails
            if media_type == 'video':
                response_data['video_thumbnail_url'] = media_url  # Placeholder
                response_data['duration'] = duration
            
            if media_type == 'audio':
                response_data['duration'] = duration

            return Response(response_data, status=status.HTTP_201_CREATED)


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
                elif last_message.video:
                    sender = last_message.sender_user or last_message.sender_handyman
                    sender_name = sender.username if sender else "Unknown"
                    last_msg_text = f"{sender_name} sent a video"
                elif last_message.audio:
                    sender = last_message.sender_user or last_message.sender_handyman
                    sender_name = sender.username if sender else "Unknown"
                    last_msg_text = f"{sender_name} sent a voice message"
            
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
