from django.db import models
from users.models import User

# Create your models here.


def service_image_path(instance, filename):
    path=f"services/{instance.name}"
    extension = filename.split('.')[-1]
    if extension:
        path = path + '.' + extension
    return path



class Service(models.Model):
    name        = models.CharField(max_length=100)
    description = models.TextField()
    image       = models.ImageField(upload_to=service_image_path, null=True, blank=True)
    created_by  = models.ForeignKey(User, on_delete=models.CASCADE, related_name='services')
    created_at  = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name