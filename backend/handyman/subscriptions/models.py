from django.db import models

# Create your models here.

class Subscription(models.Model):
    handyman = models.ForeignKey('handymen.Handyman', on_delete=models.CASCADE, unique=True)
    plan = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=6, decimal_places=2)
    duration = models.DurationField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
