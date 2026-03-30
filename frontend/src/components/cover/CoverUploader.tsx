import React, { useState, useRef, useCallback } from 'react';
import api from '../../api';
import ImageCropper from './ImageCropper';

interface CoverUploaderProps {
  noteId: number;
  currentCoverUrl?: string | null;
  currentThumbnailUrl?: string | null;
  onUploadSuccess?: (coverUrl: string, thumbnailUrl: string) => void;
  onDeleteSuccess?: () => void;
}

const CoverUploader: React.FC<CoverUploaderProps> = ({
  noteId,
  currentCoverUrl,
  currentThumbnailUrl,
  onUploadSuccess,
  onDeleteSuccess
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 支持的图片格式
  const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const validateFile = (file: File): string | null => {
    if (!validImageTypes.includes(file.type)) {
      return '不支持的图片格式，请上传 JPG、PNG、GIF、WebP 或 BMP 格式的图片';
    }
    if (file.size > maxFileSize) {
      return '图片大小不能超过 10MB';
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setSelectedFile(file);
    
    // 创建预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, []);

  const handleCropComplete = async (croppedBlob: Blob) => {
    setShowCropper(false);
    setPreviewImage(null);
    
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // 创建 FormData
      const formData = new FormData();
      const croppedFile = new File([croppedBlob], selectedFile.name, {
        type: 'image/jpeg'
      });
      formData.append('cover', croppedFile);

      // 发送上传请求
      const response = await api.post(`/notes/${noteId}/cover/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        }
      });

      if (response.data) {
        onUploadSuccess?.(response.data.cover_url, response.data.thumbnail_url);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '上传失败，请重试');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setSelectedFile(null);
    }
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setPreviewImage(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteCover = async () => {
    if (!currentCoverUrl) return;

    if (!window.confirm('确定要删除封面图片吗？')) {
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await api.delete(`/notes/${noteId}/cover/`);
      onDeleteSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.error || '删除失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* 当前封面预览 */}
      {currentCoverUrl && !isUploading && (
        <div className="mb-4">
          <div className="relative group">
            <img
              src={currentThumbnailUrl || currentCoverUrl}
              alt="笔记封面"
              className="w-full h-48 object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
              <button
                onClick={handleDeleteCover}
                className="opacity-0 group-hover:opacity-100 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-all"
              >
                删除封面
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 拖拽上传区域 */}
      {!currentCoverUrl && !isUploading && (
        <div
          onClick={handleClickUpload}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-all duration-200
            ${isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/bmp"
            onChange={handleInputChange}
            className="hidden"
          />
          
          <div className="flex flex-col items-center">
            <svg
              className={`w-12 h-12 mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
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
            
            <p className="text-lg font-medium text-gray-700 mb-2">
              {isDragging ? '松开以上传' : '点击或拖拽上传封面'}
            </p>
            <p className="text-sm text-gray-500">
              支持 JPG、PNG、GIF、WebP 格式，最大 10MB
            </p>
          </div>
        </div>
      )}

      {/* 上传进度 */}
      {isUploading && (
        <div className="p-6 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">上传中...</span>
            <span className="text-sm text-gray-500">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* 图片裁剪器 */}
      {showCropper && previewImage && (
        <ImageCropper
          imageSrc={previewImage}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={16 / 9}
        />
      )}
    </div>
  );
};

export default CoverUploader;
