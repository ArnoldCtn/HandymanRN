from django.contrib import admin
from django.urls import path
from django.shortcuts import render
from .models import BookingMessage, SupportConversation, SupportMessage

@admin.register(BookingMessage)
class BookingMessageAdmin(admin.ModelAdmin):
    list_display = ('booking', 'sender_user', 'sender_handyman', 'message', 'created_at')
    list_filter = ('created_at', 'is_read')

@admin.register(SupportConversation)
class SupportConversationAdmin(admin.ModelAdmin):
    list_display = ('__str__', 'is_active', 'updated_at', 'created_at')
    list_filter = ('is_active',)
    change_list_template = "admin/chats/support_conversation_changelist.html"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('dashboard/', self.admin_site.admin_view(self.support_dashboard), name='support_dashboard'),
        ]
        return custom_urls + urls

    def support_dashboard(self, request):
        conversations = SupportConversation.objects.filter(is_active=True).order_by('-updated_at')
        context = {
            **self.admin_site.each_context(request),
            'conversations': conversations,
            'title': 'Support Dashboard',
        }
        return render(request, 'admin/chats/support_dashboard.html', context)

@admin.register(SupportMessage)
class SupportMessageAdmin(admin.ModelAdmin):
    list_display = ('conversation', 'is_from_admin', 'message', 'created_at')
    list_filter = ('is_from_admin', 'created_at')
