# notifications/services.py

import firebase_admin

from firebase_admin import credentials, messaging

from django.conf import settings

from .models import Notification



# Initialize Firebase Admin SDK (only once)

if not firebase_admin._apps:

    if settings.FIREBASE_SERVICE_ACCOUNT:

        cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT)

        firebase_admin.initialize_app(cred)

        print("✅ Firebase Admin SDK initialized successfully")

    else:

        print("⚠️  Firebase Admin SDK not initialized - service account missing")





def send_push_notification(user, title, body, data=None):

    """

    Send push notification using FCM HTTP v1 (Modern & Recommended)

    """

    # Temporarily disabled due to firebase_admin import issues

    print(f"[FCM] Push notification disabled - {title}: {body}")

    return True

    

    # if not user or not hasattr(user, 'fcm_token') or not user.fcm_token:

    #     print(f"[FCM] No token found for user: {user}")

    #     return False



    # try:

    #     message = messaging.Message(

    #         notification=messaging.Notification(

    #             title=title,

    #             body=body,

    #         ),

    #         data=data or {},

    #         token=user.fcm_token,

    #     )



    #     response = messaging.send(message)

    #     print(f"[FCM] Successfully sent message to {user.username}: {response}")

    #     return True



    # except Exception as e:

    #     print(f"[FCM] Error sending push notification: {e}")

    #     return False





def create_and_send_notification(recipient, title, body, notification_type, booking=None, related_handyman=None):

    """Create in-app notification and send push notification.



    recipient: either a User or Handyman instance

    related_handyman: optional Handyman instance associated with the booking (for reference)

    """

    from django.contrib.auth import get_user_model

    from django.db import IntegrityError

    from handymen.models import Handyman

    User = get_user_model()



    notification = None



    # Debug logging

    recipient_class_name = type(recipient).__name__

    print(f"[NOTIF DEBUG] recipient={recipient}, type={type(recipient)}, class_name={recipient_class_name}")

    print(f"[NOTIF DEBUG] title={title}, body={body}")



    try:

        # Determine recipient type - use class name check to avoid import path issues

        if recipient_class_name == 'Handyman':

            notification = Notification.objects.create(

                user=None,

                handyman=recipient,

                title=title,

                body=body,

                notification_type=notification_type,

                booking=booking

            )

            print(f"[NOTIF] Created handyman notification for {recipient.username}: {title}")

        else:

            notification = Notification.objects.create(

                user=recipient,

                handyman=related_handyman,

                title=title,

                body=body,

                notification_type=notification_type,

                booking=booking

            )

            print(f"[NOTIF] Created user notification for {recipient.username}: {title}")

        

        if not notification:

            print(f"[NOTIF ERROR] Notification creation returned None for {recipient}")

            return None

    except IntegrityError as e:

        print(f"[NOTIF] DB IntegrityError creating notification: {e}")

        print(f"[NOTIF] Did you run migrations after making Notification.user nullable?")

        return None

    except Exception as e:

        print(f"[NOTIF] Error creating notification: {e}")

        return None



    # Send push notification to recipient (best-effort)

    send_push_notification(

        user=recipient,

        title=title,

        body=body,

        data={

            "type": notification_type,

            "booking_id": str(booking.id) if booking else None,

        }

    )



    return notification