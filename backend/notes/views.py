from django.shortcuts import render
from django.contrib.auth.models import User
from .serializers import *
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny

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