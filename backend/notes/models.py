from django.db import models
from django.contrib.auth.models import User
from .utils.image_handler import get_date_based_path

# Create your models here.

def cover_upload_path(instance, filename):
    return f'covers/{get_date_based_path()}{filename}'

class Note(models.Model):
    auther = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')
    title = models.CharField(max_length=100)
    content = models.TextField()
    cover_image = models.ImageField(upload_to=cover_upload_path, null=True, blank=True)
    cover_thumbnail = models.ImageField(upload_to=cover_upload_path, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
