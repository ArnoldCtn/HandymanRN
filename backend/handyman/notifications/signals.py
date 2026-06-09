# notifications/signals.py
import sys
print(f"[SIGNALS MODULE] Loading notifications/signals.py, path={__file__}", file=sys.stderr)

from django.db.models.signals import post_save
from django.dispatch import receiver
from bookings.models import Booking
from chats.models import BookingMessage
from handymen.models import Handyman
from .services import create_and_send_notification

print("[SIGNALS MODULE] Imports successful, registering receivers...", file=sys.stderr)


@receiver(post_save, sender=Booking)
def booking_status_changed(sender, instance, created, **kwargs):
    try:
        print(f"[SIGNAL] Booking signal fired: created={created}, id={instance.id}, status={instance.status}")
        
        if created:
            print(f"[SIGNAL] New booking: user={instance.user.username}, handyman={instance.handyman.username}")
            
            # 1) Notify USER: their request was sent
            user_notif = create_and_send_notification(
                recipient=instance.user,
                title="Booking Request Sent",
                body=f"Your booking request was sent to {instance.handyman.username}.",
                notification_type='booking_request',
                booking=instance,
                related_handyman=instance.handyman
            )
            print(f"[SIGNAL] User notification created: {user_notif is not None}")

            # 2) Notify HANDYMAN: new request received
            print(f"[SIGNAL] Creating handyman notification for: {instance.handyman.username}")
            print(f"[SIGNAL] Handyman FCM Token status: {getattr(instance.handyman, 'fcm_token', 'NOT ATTACHED')}")
            handyman_notif = create_and_send_notification(
                recipient=instance.handyman,
                title="New Booking Request",
                body=f"{instance.user.username} sent you a booking request.",
                notification_type='booking_request',
                booking=instance,
                related_handyman=instance.handyman
            )
            print(f"[SIGNAL] Handyman notification created: {handyman_notif is not None}")

        else:
            # Status changed → notify the user (customer) about what happened
            print(f"[SIGNAL] Booking status updated to: {instance.status}")
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
    except Exception as e:
        print(f"[SIGNAL ERROR] booking_status_changed failed: {e}")
        import traceback
        traceback.print_exc()


@receiver(post_save, sender=BookingMessage)
def new_chat_message(sender, instance, created, **kwargs):
    if not created:
        return
    
    try:
        booking = instance.booking
        print(f"[SIGNAL] New chat message: booking={booking.id}, sender_user={instance.sender_user}, sender_handyman={instance.sender_handyman}")

        if instance.sender_user:
            # User sent message → notify handyman
            print(f"[SIGNAL] User sent message, notifying handyman: {booking.handyman.username}")
            create_and_send_notification(
                recipient=booking.handyman,
                title="New Message",
                body=f"{instance.sender_user.username}: {instance.message[:100]}",
                notification_type='new_message',
                booking=booking,
                related_handyman=booking.handyman
            )
        elif instance.sender_handyman:
            # Handyman sent message → notify user
            print(f"[SIGNAL] Handyman sent message, notifying user: {booking.user.username}")
            create_and_send_notification(
                recipient=booking.user,
                title="New Message",
                body=f"{booking.handyman.username}: {instance.message[:100]}",
                notification_type='new_message',
                booking=booking,
                related_handyman=booking.handyman
            )
        else:
            print(f"[SIGNAL WARNING] Message has no sender: id={instance.id}")
    except Exception as e:
        print(f"[SIGNAL ERROR] new_chat_message failed: {e}")
        import traceback
        traceback.print_exc()

print("[SIGNALS MODULE] All receivers registered successfully", file=sys.stderr)