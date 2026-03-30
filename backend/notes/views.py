from django.shortcuts import render
from django.contrib.auth.models import User
from .serializers import *
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from .utils.image_handler import save_image_with_thumbnail
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


# Cover image upload view
class NoteCoverUpload(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            note = Note.objects.get(pk=pk, auther=request.user)
        except Note.DoesNotExist:
            return Response(
                {"error": "Note not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if 'cover' not in request.FILES:
            return Response(
                {"error": "No image file provided"},
                status=status.HTTP_400_BAD_REQUEST
            )

        image_file = request.FILES['cover']
        
        # Validate file type
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if image_file.content_type not in allowed_types:
            return Response(
                {"error": "Invalid file type. Please upload an image file."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate file size (max 5MB)
        if image_file.size > 5 * 1024 * 1024:
            return Response(
                {"error": "File too large. Maximum size is 5MB."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Save image and thumbnail
            save_image_with_thumbnail(note, image_file)
            note.save()

            serializer = NoteSerializer(note)
            return Response(
                {
                    "message": "Cover image uploaded successfully",
                    "note": serializer.data
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"error": f"Failed to process image: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def delete(self, request, pk):
        try:
            note = Note.objects.get(pk=pk, auther=request.user)
        except Note.DoesNotExist:
            return Response(
                {"error": "Note not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Delete images from storage
        if note.cover_image:
            if os.path.isfile(note.cover_image.path):
                os.remove(note.cover_image.path)
            note.cover_image.delete()

        if note.cover_thumbnail:
            if os.path.isfile(note.cover_thumbnail.path):
                os.remove(note.cover_thumbnail.path)
            note.cover_thumbnail.delete()

        note.save()

        serializer = NoteSerializer(note)
        return Response(
            {
                "message": "Cover image deleted successfully",
                "note": serializer.data
            },
            status=status.HTTP_200_OK
        )