from django.contrib import admin
from .models import Location
from django.utils.html import format_html
# from django.db import models

# Register your models here.

# admin.site.register(Service)
@admin.register(Location)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ['location','region','handyman_per_location','created_at']
    search_fields = ['location']
    readonly_fields = ['created_at']
    # list_editable = ['image']

   