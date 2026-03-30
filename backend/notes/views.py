from django.shortcuts import render, get_object_or_404
from django.contrib.auth.models import User
from .serializers import *
from .models import Note
from .utils.image_handler import save_cover_with_thumbnail, delete_cover_files, validate_image_file
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

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


# 封面图上传视图
class NoteCoverUploadView(APIView):
    """
    上传笔记封面图
    POST /api/v1/notes/{id}/cover/
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pk):
        # 获取笔记
        note = get_object_or_404(Note, pk=pk, auther=request.user)
        
        # 检查是否有上传文件
        if 'cover' not in request.FILES:
            return Response(
                {'error': '请上传图片文件'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        image_file = request.FILES['cover']
        
        # 验证图片文件
        is_valid, error_message = validate_image_file(image_file)
        if not is_valid:
            return Response(
                {'error': error_message}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 删除旧封面（如果存在）
        if note.cover:
            delete_cover_files(note.cover.name, note.cover_thumbnail.name if note.cover_thumbnail else None)
        
        try:
            # 保存封面并生成缩略图
            result = save_cover_with_thumbnail(note, image_file)
            
            # 更新笔记的封面字段
            note.cover = result['cover_path']
            note.cover_thumbnail = result['thumbnail_path']
            note.save()
            
            return Response({
                'message': '封面上传成功',
                'cover_url': result['cover_url'],
                'thumbnail_url': result['thumbnail_url'],
                'filename': result['filename']
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': f'上传失败: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def delete(self, request, pk):
        """
        删除笔记封面
        DELETE /api/v1/notes/{id}/cover/
        """
        note = get_object_or_404(Note, pk=pk, auther=request.user)
        
        if not note.cover:
            return Response(
                {'error': '该笔记没有封面'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # 删除文件
        delete_cover_files(note.cover.name, note.cover_thumbnail.name if note.cover_thumbnail else None)
        
        # 清空字段
        note.cover = None
        note.cover_thumbnail = None
        note.save()
        
        return Response(
            {'message': '封面删除成功'}, 
            status=status.HTTP_200_OK
        )