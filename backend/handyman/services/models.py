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


class Category(models.Model):
    service     = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='categories')
    name        = models.CharField(max_length=100)
    description = models.TextField()
    price       = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True,
                                      help_text="Default price for this category")
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name        = 'Category'
        verbose_name_plural = 'Categories'
        ordering = ['service__name', 'name']

    def __str__(self):
        return f"{self.service.name} → {self.name}"
