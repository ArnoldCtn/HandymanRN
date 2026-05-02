# notifications/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from bookings.models import Booking
from chats.models import BookingMessage
from handymen.models import Handyman
from .services import create_and_send_notification


@receiver(post_save, sender=Booking)
def booking_status_changed(sender, instance, created, **kwargs):
    if created:
        # 1) Notify USER: their request was sent
        create_and_send_notification(
            recipient=instance.user,
            title="Booking Request Sent",
            body=f"Your booking request was sent to {instance.handyman.username}.",
            notification_type='booking_request',
            booking=instance,
            related_handyman=instance.handyman
        )

        # 2) Notify HANDYMAN: new request received
        create_and_send_notification(
            recipient=instance.handyman,
            title="New Booking Request",
            body=f"{instance.user.username} sent you a booking request.",
            notification_type='booking_request',
            booking=instance,
            related_handyman=instance.handyman
        )

    else:
        # Status changed → notify the user (customer) about what happened
        if instance.status == 'accepted':
            create_and_send_notification(
                recipient=instance.user,
                title="Booking Accepted",
                body=f"{instance.handyman.username} accepted your request.",
                notification_type='booking_accepted',
                booking=instance,
                related_handyman=instance.handyman
            )

        elif instance.status == 'declined':
            create_and_send_notification(
                recipient=instance.user,
                title="Booking Declined",
                body=f"{instance.handyman.username} declined your request.",
                notification_type='booking_declined',
                booking=instance,
                related_handyman=instance.handyman
            )

        elif instance.status == 'completed':
            create_and_send_notification(
                recipient=instance.user,
                title="Booking Completed",
                body=f"{instance.handyman.username} marked your booking as completed.",
                notification_type='booking_completed',
                booking=instance,
                related_handyman=instance.handyman
            )


@receiver(post_save, sender=BookingMessage)
def new_chat_message(sender, instance, created, **kwargs):
    if not created:
        return

    booking = instance.booking

    if instance.sender_user:
        # User sent message → notify handyman
        create_and_send_notification(
            recipient=booking.handyman,
            title="New Message",
            body=f"{instance.sender_user.username}: {instance.message[:100]}",
            notification_type='new_message',
            booking=booking,
            related_handyman=booking.handyman
        )
    else:
        # Handyman sent message → notify user
        create_and_send_notification(
            recipient=booking.user,
            title="New Message",
            body=f"{booking.handyman.username}: {instance.message[:100]}",
            notification_type='new_message',
            booking=booking,
            related_handyman=booking.handyman
        )