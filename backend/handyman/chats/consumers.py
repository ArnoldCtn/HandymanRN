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
        message = data.get('message')

        if not message:
            return

        # Save message to database
        saved_message = await self.save_message(message)

        # Broadcast to group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': saved_message,
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message']
        }))

    @database_sync_to_async
    def can_access_booking(self):
        try:
            booking = Booking.objects.get(id=self.booking_id)
            user = self.scope['user']
            # Handyman IS its own user model — compare directly
            if isinstance(user, Handyman):
                return booking.handyman == user
            return booking.user == user
        except Exception:
            return False

    @database_sync_to_async
    def save_message(self, message_text):
        user = self.scope['user']
        booking = Booking.objects.get(id=self.booking_id)

        if isinstance(user, Handyman):
            sender_handyman = user
            sender_user = None
        else:
            sender_handyman = None
            sender_user = user

        msg = BookingMessage.objects.create(
            booking=booking,
            sender_user=sender_user,
            sender_handyman=sender_handyman,
            message=message_text
        )

        return {
            'id': msg.id,
            'message': msg.message,
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
        if not self.user.is_authenticated:
            await self.close()
            return

        # Room name: support_<user_id> if user, support_h_<handyman_id> if handyman
        if isinstance(self.user, Handyman):
            self.room_name = f"support_h_{self.user.id}"
        else:
            self.room_name = f"support_{self.user.id}"

        # If admin is connecting to a specific user's support chat
        url_room_name = self.scope['url_route']['kwargs'].get('room_name', None)
        if url_room_name:
            if self.user.is_staff:
                self.room_name = url_room_name
            else:
                if self.room_name != url_room_name:
                    await self.close()
                    return

        self.room_group_name = f'chat_{self.room_name}'

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if self.room_group_name:
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data.get('message')

        if not message:
            return

        saved_message = await self.save_support_message(message)

        # Broadcast to group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': saved_message,
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message']
        }))

    @database_sync_to_async
    def save_support_message(self, message_text):
        # Admin sending: Need to extract the correct room to find conversation
        if self.user.is_staff:
            # self.room_name is already set to support_u_<id> or support_h_<id>
            parts = self.room_name.split('_')
            if len(parts) >= 3:
                is_handyman_chat = parts[1] == 'h'
                participant_id = parts[2]
                if is_handyman_chat:
                    conv, _ = SupportConversation.objects.get_or_create(handyman_id=participant_id)
                else:
                    conv, _ = SupportConversation.objects.get_or_create(user_id=participant_id)
            else:
                # Fallback if room name is malformed
                return {'error': 'Invalid room format'}
        else:
            # Client/Handyman sending
            if isinstance(self.user, Handyman):
                conv, _ = SupportConversation.objects.get_or_create(handyman=self.user)
            else:
                conv, _ = SupportConversation.objects.get_or_create(user=self.user)

        # Create the message
        msg = SupportMessage.objects.create(
            conversation=conv,
            sender_user=self.user if not self.user.is_staff and not isinstance(self.user, Handyman) else None,
            sender_handyman=self.user if not self.user.is_staff and isinstance(self.user, Handyman) else None,
            is_from_admin=self.user.is_staff,
            message=message_text
        )
        conv.save()

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
            'sender_username': "Admin" if self.user.is_staff else self.user.username,
            'is_from_admin': self.user.is_staff,
            'created_at': msg.created_at.strftime("%Y-%m-%d %H:%M")
        }
