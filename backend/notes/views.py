from django.shortcuts import render
from django.contrib.auth.models import User
from .serializers import *
from .models import Note
from .utils.image_handler import process_cover_image, delete_cover_files
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
import os

class CreateUser(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

# View for note list and create
class NoteListCreate(generics.ListCreateAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    # to get the notes of the logged in user only
    def get_queryset(self):
        user = self.request.user
        return Note.objects.filter(auther=user)

    def perform_create(self, serializer):
        if serializer.is_valid():
            serializer.save(auther=self.request.user)
        else:
            print(serializer.errors)

# get single note
class GetNoteDetail(generics.RetrieveAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Note.objects.filter(auther=user)

# view for updating the note
class UpdateNote(generics.UpdateAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Note.objects.filter(auther=user)
    
    def perform_update(self, serializer):
        if serializer.is_valid():
            serializer.save(auther=self.request.user)
        else:
            print(serializer.errors)


# view for deleting the note
class DeleteNote(generics.DestroyAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Note.objects.filter(auther=user)


class CoverUploadView(generics.UpdateAPIView):
    serializer_class = NoteSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        user = self.request.user
        return Note.objects.filter(auther=user)

    def post(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        note = self.get_object()
        
        if 'cover' not in request.FILES:
            return Response(
                {'error': 'No cover image provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        uploaded_file = request.FILES['cover']
        
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if uploaded_file.content_type not in allowed_types:
            return Response(
                {'error': 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if note.cover:
            if note.cover.storage.exists(note.cover.name):
                note.cover.delete(save=False)
            if note.cover_thumbnail and note.cover_thumbnail.storage.exists(note.cover_thumbnail.name):
                note.cover_thumbnail.delete(save=False)
        
        try:
            img = Image.open(uploaded_file)
            
            crop_x = request.data.get('crop_x')
            crop_y = request.data.get('crop_y')
            crop_width = request.data.get('crop_width')
            crop_height = request.data.get('crop_height')
            
            if all([crop_x, crop_y, crop_width, crop_height]):
                try:
                    crop_x = float(crop_x)
                    crop_y = float(crop_y)
                    crop_width = float(crop_width)
                    crop_height = float(crop_height)
                    img = img.crop((crop_x, crop_y, crop_x + crop_width, crop_y + crop_height))
                except (ValueError, TypeError):
                    pass
            
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            
            original_name = os.path.splitext(uploaded_file.name)[0]
            from datetime import datetime
            date_path = datetime.now().strftime('%Y/%m')
            
            import uuid
            unique_id = uuid.uuid4().hex[:8]
            cover_filename = f'{original_name}_{unique_id}.jpg'
            cover_path = f'covers/{date_path}/{cover_filename}'
            
            img_io = BytesIO()
            img.save(img_io, format='JPEG', quality=90)
            img_io.seek(0)
            note.cover.save(cover_path, ContentFile(img_io.read()), save=False)
            
            thumb = img.copy()
            thumb.thumbnail((300, 300), Image.Resampling.LANCZOS)
            thumb_io = BytesIO()
            thumb.save(thumb_io, format='JPEG', quality=85)
            thumb_io.seek(0)
            
            thumb_filename = f'{original_name}_{unique_id}_thumb.jpg'
            thumb_path = f'covers/{date_path}/{thumb_filename}'
            note.cover_thumbnail.save(thumb_path, ContentFile(thumb_io.read()), save=False)
            
            note.save()
            
            return Response(
                {
                    'message': 'Cover uploaded successfully',
                    'cover': note.cover.url if note.cover else None,
                    'cover_thumbnail': note.cover_thumbnail.url if note.cover_thumbnail else None,
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to process image: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    def delete(self, request, *args, **kwargs):
        note = self.get_object()
        
        if note.cover:
            if note.cover.storage.exists(note.cover.name):
                note.cover.delete(save=False)
            if note.cover_thumbnail and note.cover_thumbnail.storage.exists(note.cover_thumbnail.name):
                note.cover_thumbnail.delete(save=False)
            note.save()
            return Response(
                {'message': 'Cover deleted successfully'},
                status=status.HTTP_200_OK
            )
        
        return Response(
            {'error': 'No cover to delete'},
            status=status.HTTP_400_BAD_REQUEST
        )