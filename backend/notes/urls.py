from django.urls import path, include
from .views import *


urlpatterns = [
    path('notes/', NoteListCreate.as_view(), name='note-list-create'),
    path('notes/<int:pk>/', GetNoteDetail.as_view(), name='note-detail'),
    path('notes/<int:pk>/update/', UpdateNote.as_view(), name='note-update'),
    path('notes/<int:pk>/delete/', DeleteNote.as_view(), name='note-delete'),
]
