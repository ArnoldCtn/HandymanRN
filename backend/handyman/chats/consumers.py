# chats/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import BookingMessage, SupportConversation, SupportMessage
from bookings.models import Booking
from handymen.models import Handyman
import logging
from urllib.parse import urlparse

logger = logging.getLogger(__name__)


def _extract_file_path(url):
    """
    Extract the relative path from an absolute URL.
    E.g. 'http://host/media/chat_videos/uuid.mp4' -> 'chat_videos/uuid.mp4'
    The model field now has upload_to='' so we store the full relative path.
    """
    if not url:
        return None
    from urllib.parse import urlparse
    path = urlparse(url).path.lstrip('/')
    # Remove 'media/' prefix if present
    if path.startswith('media/'):
        path = path[len('media/'):].lstrip('/')
    # Return the full path including folder (e.g., 'chat_videos/uuid.mp4')
    return path if path else None


class BookingChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.booking_id = self.scope['url_route']['kwargs']['booking_id']
        self.room_group_name = f'chat_booking_{self.booking_id}'

        can_join = await self.can_access_booking()
        if not can_join:
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)

        if data.get('type') == 'typing':
            await self.channel_layer.group_send(
                self.room_group_name,
                {'type': 'typing_indicator', 'username': self.scope['user'].username}
            )
            return

        message = data.get('message', '')
        image_url = data.get('image_url')
        video_url = data.get('video_url')
        audio_url = data.get('audio_url')
        # Use relative_path directly from upload if provided (avoids URL parsing issues)
        image_path = data.get('image_path')
        video_path = data.get('video_path')
        audio_path = data.get('audio_path')
        duration = data.get('duration', 0)

        if not message and not image_url and not video_url and not audio_url:
            return

        saved_message = await self.save_message(message, image_url, video_url, audio_url, image_path, video_path, audio_path, duration)

        await self.channel_layer.group_send(
            self.room_group_name,
            {'type': 'chat_message', 'message': saved_message}
        )

    async def typing_indicator(self, event):
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'username': event['username'],
        }))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message']
        }))

    @database_sync_to_async
    def can_access_booking(self):
        try:
            booking = Booking.objects.get(id=self.booking_id)
            user = self.scope['user']
            if isinstance(user, Handyman):
                return booking.handyman == user
            return booking.user == user
        except Exception:
            return False

    @database_sync_to_async
    def save_message(self, message_text, image_url, video_url, audio_url, image_path, video_path, audio_path, duration):
        user = self.scope['user']
        booking = Booking.objects.get(id=self.booking_id)

        if isinstance(user, Handyman):
            sender_handyman = user
            sender_user = None
        else:
            sender_handyman = None
            sender_user = user

        # Use relative_path from upload if provided, otherwise extract from URL
        # relative_path is like 'chat_videos/uuid.mp4' - exactly what the model needs
        if not image_path and image_url:
            image_path = _extract_file_path(image_url)
        if not video_path and video_url:
            video_path = _extract_file_path(video_url)
        if not audio_path and audio_url:
            audio_path = _extract_file_path(audio_url)
        
        video_thumbnail_path = None
        
        print(f"[Consumer] BEFORE SAVE:")
        print(f"  image_path={image_path}")
        print(f"  video_path={video_path}")
        print(f"  audio_path={audio_path}")
        print(f"[Consumer] Saving to database...")

        msg = BookingMessage.objects.create(
            booking=booking,
            sender_user=sender_user,
            sender_handyman=sender_handyman,
            message=message_text,
            image=image_path,
            video=video_path,
            video_thumbnail=video_thumbnail_path,
            audio=audio_path,
            duration=int(duration) if duration else 0
        )
        
        print(f"[Consumer] AFTER SAVE:")
        print(f"  msg.image={msg.image}")
        print(f"  msg.video={msg.video}")
        print(f"  msg.audio={msg.audio}")
        print(f"[Consumer] Message saved successfully! ID={msg.id}")

        # Build response with absolute URLs for WebSocket
        from django.conf import settings

        def build_url(path):
            if not path:
                return None
            return f"{settings.MEDIA_URL.rstrip('/')}/{path}"

        return {
            'id': msg.id,
            'message': msg.message,
            'image_url': image_url,  # Use original URL from upload
            'video_url': video_url,
            'audio_url': audio_url,
            'duration': msg.duration,
            'sender_username': user.username,
            'is_handyman': sender_handyman is not None,
            'created_at': msg.created_at.strftime("%Y-%m-%d %H:%M")
        }


class SupportChatConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.room_group_name = None

    async def connect(self):
        self.user = self.scope['user']

        if not self.user or not getattr(self.user, 'is_authenticated', False):
            await self.close()
            return

        if isinstance(self.user, Handyman):
            computed_room = f"support_h_{self.user.id}"
        else:
            computed_room = f"support_{self.user.id}"

        url_room_name = self.scope['url_route']['kwargs'].get('room_name', None)

        if url_room_name:
            if self.user.is_staff:
                self.room_name = url_room_name
            else:
                if url_room_name != computed_room:
                    await self.close()
                    return
                self.room_name = url_room_name
        else:
            self.room_name = computed_room

        self.room_group_name = f'chat_{self.room_name}'
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if self.room_group_name:
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get('message', '')
        image_url = data.get('image_url')

        if not message and not image_url:
            return

        saved_message = await self.save_support_message(message, image_url)
        if 'error' in saved_message:
            await self.send(text_data=json.dumps(saved_message))
            return

        await self.channel_layer.group_send(
            self.room_group_name,
            {'type': 'chat_message', 'message': saved_message}
        )

        if not self.user.is_staff:
            await self.channel_layer.group_send(
                'chat_support_global',
                {'type': 'global_notification', 'message': saved_message, 'room_name': self.room_name}
            )

    async def global_notification(self, event):
        await self.send(text_data=json.dumps({
            'type': 'global_notification',
            'message': event['message'],
            'room_name': event['room_name']
        }))

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message']
        }))

    @database_sync_to_async
    def save_support_message(self, message_text, image_url):
        try:
            if self.user.is_staff:
                parts = self.room_name.split('_')
                if len(parts) == 3 and parts[1] == 'h':
                    participant_id = parts[2]
                    conv = SupportConversation.objects.filter(handyman_id=participant_id).first()
                    if not conv:
                        conv = SupportConversation.objects.create(handyman_id=participant_id)
                elif len(parts) == 2:
                    participant_id = parts[1]
                    conv = SupportConversation.objects.filter(user_id=participant_id).first()
                    if not conv:
                        conv = SupportConversation.objects.create(user_id=participant_id)
                else:
                    return {'error': 'Invalid room format'}
            else:
                if isinstance(self.user, Handyman):
                    conv = SupportConversation.objects.filter(handyman=self.user).first()
                    if not conv:
                        conv = SupportConversation.objects.create(handyman=self.user)
                else:
                    conv = SupportConversation.objects.filter(user=self.user).first()
                    if not conv:
                        conv = SupportConversation.objects.create(user=self.user)

            image_path = _extract_file_path(image_url)

            msg = SupportMessage.objects.create(
                conversation=conv,
                sender_user=self.user if not self.user.is_staff and not isinstance(self.user, Handyman) else None,
                sender_handyman=self.user if not self.user.is_staff and isinstance(self.user, Handyman) else None,
                is_from_admin=self.user.is_staff,
                message=message_text,
                image=image_path
            )
            conv.save()

            return {
                'id': msg.id,
                'message': msg.message,
                'image_url': image_url,
                'sender_username': "Admin" if self.user.is_staff else self.user.username,
                'is_from_admin': self.user.is_staff,
                'created_at': msg.created_at.strftime("%Y-%m-%d %H:%M")
            }
        except Exception as e:
            return {'error': str(e)}