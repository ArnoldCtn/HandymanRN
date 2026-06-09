from .models import SupportMessage

def support_unread_count(request):
    """Provides the count of unread support messages from users to the admin."""
    if request.user.is_authenticated and request.user.is_staff:
        count = SupportMessage.objects.filter(is_from_admin=False, is_read=False).count()
        return {'support_unread_count': count}
    return {'support_unread_count': 0}
