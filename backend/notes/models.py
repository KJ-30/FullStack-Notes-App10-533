from django.db import models
from django.contrib.auth.models import User
import os
from datetime import datetime


def cover_upload_path(instance, filename):
    date_path = datetime.now().strftime('%Y/%m')
    return f'covers/{date_path}/{filename}'


class Note(models.Model):
    auther = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')
    title = models.CharField(max_length=100)
    content = models.TextField()
    cover = models.ImageField(upload_to=cover_upload_path, blank=True, null=True)
    cover_thumbnail = models.ImageField(upload_to=cover_upload_path, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    def delete(self, *args, **kwargs):
        if self.cover:
            if self.cover.storage.exists(self.cover.name):
                self.cover.delete(save=False)
        if self.cover_thumbnail:
            if self.cover_thumbnail.storage.exists(self.cover_thumbnail.name):
                self.cover_thumbnail.delete(save=False)
        super().delete(*args, **kwargs)
