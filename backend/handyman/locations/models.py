from django.db import models

# Create your models here.
class Location(models.Model):
    location  = models.CharField(max_length=100)
    region  = models.CharField(max_length=100,default='West Region Cameroon')
    handyman_per_location = models.CharField(null=True,blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.location