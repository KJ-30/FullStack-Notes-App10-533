from django.db import models
from django.contrib.auth.models import User
# Create your models here.

class Note(models.Model):
    auther = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')
    title = models.CharField(max_length=100)
    content = models.TextField()
    cover = models.ImageField(upload_to='covers/%Y/%m/', blank=True, null=True)
    cover_thumbnail = models.ImageField(upload_to='covers/%Y/%m/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title
