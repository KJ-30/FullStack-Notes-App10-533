import React, { useState, useRef, useCallback } from 'react';
import ImageCropper from './ImageCropper';
import api from '../../api';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CoverUploaderProps {
  noteId: number | null;
  currentCover?: string | null;
  onCoverUploaded: (coverUrl: string, thumbnailUrl: string) => void;
  onCoverDeleted: () => void;
}

const CoverUploader: React.FC<CoverUploaderProps> = ({
  noteId,
  currentCover,
  onCoverUploaded,
  onCoverDeleted,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxFileSize = 5 * 1024 * 1024;

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return '仅支持 JPEG、PNG、GIF 和 WebP 格式的图片';
    }
    if (file.size > maxFileSize) {
      return '图片大小不能超过 5MB';
    }
    return null;
  };

  const handleFileSelect = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      setSelectedFile(file);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleCropComplete = async (cropData: CropArea) => {
    if (!selectedFile || !noteId) {
      setError('请先保存笔记后再上传封面');
      setShowCropper(false);
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('cover', selectedFile);
    formData.append('crop_x', cropData.x.toString());
    formData.append('crop_y', cropData.y.toString());
    formData.append('crop_width', cropData.width.toString());
    formData.append('crop_height', cropData.height.toString());

    try {
      const response = await api.post(`notes/${noteId}/cover/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.cover) {
        onCoverUploaded(response.data.cover, response.data.cover_thumbnail);
      }
      setShowCropper(false);
      setSelectedImage(null);
      setSelectedFile(null);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      setError(error.response?.data?.error || '上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setSelectedImage(null);
    setSelectedFile(null);
  };

  const handleDeleteCover = async () => {
    if (!noteId) return;

    setIsUploading(true);
    setError(null);

    try {
      await api.delete(`notes/${noteId}/cover/`);
      onCoverDeleted();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } }; message?: string };
      setError(error.response?.data?.error || '删除失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {currentCover ? (
        <div className="relative group">
          <img
            src={currentCover}
            alt="Note cover"
            className="w-full h-48 object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-3">
            <button
              onClick={handleClick}
              className="px-4 py-2 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
              disabled={isUploading}
            >
              更换封面
            </button>
            <button
              onClick={handleDeleteCover}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              disabled={isUploading}
            >
              删除
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={handleClick}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer
            transition-colors
            ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-2"></div>
              <span className="text-gray-500">上传中...</span>
            </div>
          ) : (
            <>
              <svg
                className="w-12 h-12 text-gray-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-gray-500 text-sm">
                拖拽图片到此处或点击上传
              </p>
              <p className="text-gray-400 text-xs mt-1">
                支持 JPEG、PNG、GIF、WebP，最大 5MB
              </p>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />

      {error && (
        <div className="mt-2 text-red-500 text-sm">{error}</div>
      )}

      {showCropper && selectedImage && (
        <ImageCropper
          imageSrc={selectedImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={16 / 9}
        />
      )}
    </div>
  );
};

export default CoverUploader;
