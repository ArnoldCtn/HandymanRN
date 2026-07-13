from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from .models import Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['id', 'reporter_link', 'handyman_link', 'reason_display', 'status_colored', 'created_at']
    list_filter = ['reason', 'status', 'created_at']
    search_fields = ['reporter__username', 'reported_handyman__username', 'additional_details']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at', 'reporter', 'reported_handyman']
    actions = ['mark_reviewed', 'mark_resolved']

    def reporter_link(self, obj):
        user_admin_url = reverse('admin:users_user_change', args=[obj.reporter.id])
        support_url = reverse('admin:chats_supportconversation_changelist') + f'?q={obj.reporter.username}'
        return format_html(
            '<a href="{}" target="_blank">👤 {}</a> | <a href="{}" style="color:#6366F1;">💬 Support</a>',
            user_admin_url, obj.reporter.username, support_url
        )
    reporter_link.short_description = 'Signalé par'

    def handyman_link(self, obj):
        handyman_admin_url = reverse('admin:handymen_handyman_change', args=[obj.reported_handyman.id])
        return format_html('<a href="{}" target="_blank">🔧 {}</a>', handyman_admin_url, obj.reported_handyman.username)
    handyman_link.short_description = 'Artisan signalé'

    def reason_display(self, obj):
        labels = {
            'arnaque': '🔴 Arnaque',
            'spam': '🟡 Spam',
            'comportement_inapproprie': '🟠 Comportement inapproprié',
        }
        return labels.get(obj.reason, obj.reason)
    reason_display.short_description = 'Motif'

    def status_colored(self, obj):
        colors = {
            'pending': ('#f59e0b', 'En attente'),
            'reviewed': ('#3b82f6', 'Examiné'),
            'resolved': ('#22c55e', 'Résolu'),
        }
        color, label = colors.get(obj.status, ('#6b7280', obj.status))
        return format_html('<span style="color: {}; font-weight: 700;">⬤ {}</span>', color, label)
    status_colored.short_description = 'Statut'

    def mark_reviewed(self, request, queryset):
        queryset.update(status='reviewed')
    mark_reviewed.short_description = 'Marquer comme examiné'

    def mark_resolved(self, request, queryset):
        queryset.update(status='resolved')
    mark_resolved.short_description = 'Marquer comme résolu'

    def has_add_permission(self, request):
        return False