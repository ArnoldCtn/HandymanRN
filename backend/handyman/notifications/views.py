# notifications/views.py
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from handymen.models import Handyman
from handyman.auth import DualJWTAuthentication
from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [DualJWTAuthentication]

    def get_queryset(self):
        user = self.request.user
        print(f"🔍 DEBUG: NotificationListView.get_queryset called for user: {user} (type: {type(user)})")
        
        if isinstance(user, Handyman):
            # Only return notifications where handyman is the ACTUAL recipient (user=None)
            # NOT notifications where handyman is merely referenced in a user notification
            queryset = Notification.objects.filter(handyman=user, user__isnull=True).order_by('-created_at')
            print(f"🔍 DEBUG: Handyman notifications count: {queryset.count()}")
            print(f"🔍 DEBUG: Handyman ID: {user.id}")
            return queryset
        else:
            queryset = Notification.objects.filter(user=user).order_by('-created_at')
            print(f"🔍 DEBUG: User notifications count: {queryset.count()}")
            print(f"🔍 DEBUG: User ID: {user.id}")
            return queryset


class NotificationMarkReadView(generics.UpdateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [DualJWTAuthentication]

    def patch(self, request, pk):
        user = request.user
        if isinstance(user, Handyman):
            notif = Notification.objects.filter(pk=pk, handyman=user, user__isnull=True).first()
        else:
            notif = Notification.objects.filter(pk=pk, user=user).first()

        if not notif:
            return Response({"detail": "Not found"}, status=status.HTTP_404_NOT_FOUND)

        notif.is_read = True
        notif.save()
        return Response(NotificationSerializer(notif).data)


class NotificationMarkAllReadView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [DualJWTAuthentication]

    def post(self, request):
        user = request.user
        if isinstance(user, Handyman):
            Notification.objects.filter(handyman=user, user__isnull=True, is_read=False).update(is_read=True)
        else:
            Notification.objects.filter(user=user, is_read=False).update(is_read=True)
        return Response({"detail": "All marked as read"})


class NotificationUnreadCountView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [DualJWTAuthentication]

    def get(self, request):
        user = request.user
        if isinstance(user, Handyman):
            count = Notification.objects.filter(handyman=user, user__isnull=True, is_read=False).count()
        else:
            count = Notification.objects.filter(user=user, is_read=False).count()
        return Response({"unread_count": count})
