from django.contrib import admin
from .models import Service
from django.utils.html import format_html
# from django.db import models

# Register your models here.

# admin.site.register(Service)
@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['name','description','image_preview','created_by','created_at']
    search_fields = ['name']
    readonly_fields = ['image_preview', 'created_at']
    # list_editable = ['image']

    def image_preview(self,obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="width:60px; height:60px; '
                'object-fit:cover; border-radius:6px;" />',
                obj.image.url
            )
        return '—'
    image_preview.short_description = 'Image'

    # ── Shows larger preview inside the change form ──
    fieldsets = (
        ('Service Info', {
            'fields': ('name', 'description', 'created_by')
        }),
        ('Image', {
            'fields': ('image', 'image_preview')
        }),
        
    )