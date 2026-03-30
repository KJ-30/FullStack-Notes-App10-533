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
    cover_url = serializers.SerializerMethodField()
    thumbnail_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Note
        fields = ['id', 'auther', 'title', 'content', 'cover', 'cover_thumbnail', 
                  'cover_url', 'thumbnail_url', 'created_at', 'updated_at']
        extra_kwargs = {
            'auther' : {'read_only': True},
            'cover': {'write_only': True, 'required': False},
            'cover_thumbnail': {'write_only': True, 'required': False}
        }
    
    def get_cover_url(self, obj):
        if obj.cover:
            return obj.cover.url
        return None
    
    def get_thumbnail_url(self, obj):
        if obj.cover_thumbnail:
            return obj.cover_thumbnail.url
        return None