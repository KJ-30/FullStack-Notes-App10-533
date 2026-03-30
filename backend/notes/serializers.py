from django.contrib.auth.models import User
from rest_framework import serializers
from .models import *

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password']
        extra_kwargs = {
            'password' : {'write_only': True}
        }

    def create(self, validate_data):
        user = User.objects.create_user(**validate_data)
        return user
    

class NoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Note
        fields = ['id', 'auther', 'title', 'content', 'cover', 'cover_thumbnail', 'created_at', 'updated_at']
        extra_kwargs = {
            'auther': {'read_only': True},
            'cover': {'read_only': True},
            'cover_thumbnail': {'read_only': True},
        }


class CoverUploadSerializer(serializers.Serializer):
    cover = serializers.ImageField()
    crop_x = serializers.FloatField(required=False)
    crop_y = serializers.FloatField(required=False)
    crop_width = serializers.FloatField(required=False)
    crop_height = serializers.FloatField(required=False)