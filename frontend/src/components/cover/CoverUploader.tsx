import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import ImageCropper from './ImageCropper';
import api from '../../api';

interface CoverUploaderProps {
  noteId: number | null;
  currentCover: string | null;
  onUploadComplete: (noteData: any) => void;
  onUploadError: (error: string) => void;
}

const CoverUploader: React.FC<CoverUploaderProps> = ({
  noteId,
  currentCover,
  onUploadComplete,
  onUploadError,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentCover);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        onUploadError('Please upload a valid image file (JPEG, PNG, GIF, WebP)');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        onUploadError('File size must be less than 5MB');
        return;
      }

      // Create preview for cropping
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    },
    [onUploadError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleCropComplete = async (croppedImage: string) => {
    setShowCropper(false);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const file = dataURLtoFile(croppedImage, 'cover.jpg');
      const formData = new FormData();
      formData.append('cover', file);

      const response = await api.post(
        `/api/v1/notes/${noteId}/cover/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(progress);
            }
          },
        }
      );

      setPreviewUrl(response.data.note.cover_image);
      onUploadComplete(response.data.note);
      setUploadProgress(0);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || 'Failed to upload cover image';
      onUploadError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteCover = async () => {
    if (!noteId) return;

    try {
      const response = await api.delete(`/api/v1/notes/${noteId}/cover/`);
      setPreviewUrl(null);
      onUploadComplete(response.data.note);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || 'Failed to delete cover image';
      onUploadError(errorMessage);
    }
  };

  return (
    <div className="w-full">
      {showCropper && imageToCrop && (
        <ImageCropper
          image={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={() => setShowCropper(false)}
          aspectRatio={16 / 9}
        />
      )}

      {previewUrl ? (
        <div className="relative group">
          <img
            src={previewUrl}
            alt="Cover"
            className="w-full h-48 object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <button
              onClick={() => {
                setPreviewUrl(null);
                setImageToCrop(null);
              }}
              className="px-3 py-2 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
            >
              Change
            </button>
            <button
              onClick={handleDeleteCover}
              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            <svg
              className="w-12 h-12 text-gray-400"
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
            <div>
              <p className="text-gray-600 font-medium">
                {isDragActive
                  ? 'Drop the image here...'
                  : 'Drag & drop a cover image here'}
              </p>
              <p className="text-gray-400 text-sm mt-1">
                or click to browse (max 5MB, JPEG, PNG, GIF, WebP)
              </p>
            </div>
          </div>
        </div>
      )}

      {isUploading && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoverUploader;
