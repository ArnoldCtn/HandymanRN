                                         # chats/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import BookingMessage, SupportConversation, SupportMessage
from bookings.models import Booking
from handymen.models import Handyman


class BookingChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.booking_id = self.scope['url_route']['kwargs']['booking_id']
        self.room_group_name = f'chat_booking_{self.booking_id}'

        # Check if user is part of this booking
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
        
        # Handle typing indicator
        if data.get('type') == 'typing':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'typing_indicator',
                    'username': self.scope['user'].username,
                }
            )
            return

        message = data.get('message', '')
        image_url = data.get('image_url')

        if not message and not image_url:
            return

        # Save message to database
        saved_message = await self.save_message(message, image_url)

        # Broadcast to group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': saved_message,
            }
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
    def save_message(self, message_text, image_url):
        user = self.scope['user']
        booking = Booking.objects.get(id=self.booking_id)

        if isinstance(user, Handyman):
            sender_handyman = user
            sender_user = None
        else:
            sender_handyman = None
            sender_user = user

        image_path = None
        if image_url:
            from urllib.parse import urlparse
            path = urlparse(image_url).path
            image_path = path.lstrip('/')
            if image_path.startswith('media/'):
                image_path = image_path[len('media/'):].lstrip('/')

        msg = BookingMessage.objects.create(
            booking=booking,
            sender_user=sender_user,
            sender_handyman=sender_handyman,
            message=message_text,
            image=image_path if image_path else None
        )

        return {
            'id': msg.id,
            'message': msg.message,
            'image_url': image_url,
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
        
        # If AnonymousUser or not authenticated
        if not self.user or not getattr(self.user, 'is_authenticated', False):
            print(f"[SupportWS] Rejecting unauthenticated user")
            await self.close()
            return

        # Determine default room name for this user
        if isinstance(self.user, Handyman):
            computed_room = f"support_h_{self.user.id}"
        else:
            computed_room = f"support_{self.user.id}"

        # If room_name is in URL (for admin or client to specify)
        url_room_name = self.scope['url_route']['kwargs'].get('room_name', None)
        
        if url_room_name:
            if self.user.is_staff:
                # Admin can join any room
                self.room_name = url_room_name
            else:
                # Non-staff can only join their own room
                if url_room_name != computed_room:
                    print(f"[SupportWS] Access denied: {self.user} tried to join {url_room_name}")
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

        if not message and not image_url: return

        saved_message = await self.save_support_message(message, image_url)
        if 'error' in saved_message:
            await self.send(text_data=json.dumps(saved_message))
            return

        # Broadcast to specific room
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': saved_message,
            }
        )

        # Broadcast to global support room for admin notifications
        if not self.user.is_staff:
            await self.channel_layer.group_send(
                'chat_support_global',
                {
                    'type': 'global_notification',
                    'message': saved_message,
                    'room_name': self.room_name,
                }
            )

    async def global_notification(self, event):
        """Handler for global notifications (only staff should really care)"""
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
            # Admin sending: Need to extract the correct room to find conversation
            if self.user.is_staff:
                parts = self.room_name.split('_')
                if len(parts) == 3 and parts[1] == 'h':
                    participant_id = parts[2]
                    conv = SupportConversation.objects.filter(handyman_id=participant_id).first()
                    if not conv: conv = SupportConversation.objects.create(handyman_id=participant_id)
                elif len(parts) == 2:
                    participant_id = parts[1]
                    conv = SupportConversation.objects.filter(user_id=participant_id).first()
                    if not conv: conv = SupportConversation.objects.create(user_id=participant_id)
                else:
                    return {'error': 'Invalid room format'}
            else:
                # Client/Handyman sending
                if isinstance(self.user, Handyman):
                    conv = SupportConversation.objects.filter(handyman=self.user).first()
                    if not conv: conv = SupportConversation.objects.create(handyman=self.user)
                else:
                    conv = SupportConversation.objects.filter(user=self.user).first()
                    if not conv: conv = SupportConversation.objects.create(user=self.user)

            # Extract image path
            image_path = None
            if image_url:
                from django.conf import settings
                image_path = image_url.replace(settings.MEDIA_URL, '').lstrip('/')

            # Create the message
            msg = SupportMessage.objects.create(
                conversation=conv,
                sender_user=self.user if not self.user.is_staff and not isinstance(self.user, Handyman) else None,
                sender_handyman=self.user if not self.user.is_staff and isinstance(self.user, Handyman) else None,
                is_from_admin=self.user.is_staff,
                message=message_text,
                image=image_path if image_path else None
            )
            conv.save() # Update updated_at

            if self.user.is_staff:
                try:
                    from notifications.services import create_and_send_notification
                    recipient = conv.user or conv.handyman
                    create_and_send_notification(
                        recipient=recipient,
                        title="Support Message",
                        body=f"New message from support: {message_text[:50]}...",
                        notification_type='new_message'
                    )
                except Exception as e:
                    print(f"Error sending notification: {e}")

            return {
                'id': msg.id,
                'message': msg.message,
                'image_url': image_url,
                'sender_username': "Admin" if self.user.is_staff else self.user.username,
                'is_from_admin': self.user.is_staff,
                'created_at': msg.created_at.strftime("%Y-%m-%d %H:%M")
            }
        except Exception as e:
            print(f"[SupportWS] Error saving message: {e}")
            return {'error': str(e)}
