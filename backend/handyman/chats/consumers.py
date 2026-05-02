# chats/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import BookingMessage
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