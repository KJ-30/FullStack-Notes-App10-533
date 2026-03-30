import React, { useState, useRef, useCallback } from 'react';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedImage: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

const ImageCropper: React.FC<ImageCropperProps> = ({
  imageSrc,
  onCropComplete,
  onCancel,
  aspectRatio = 16 / 9
}) => {
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleImageLoad = () => {
    if (imageRef.current && containerRef.current) {
      const img = imageRef.current;
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      
      // 计算图片在容器中的实际显示尺寸
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const containerAspect = containerRect.width / containerRect.height;
      
      let displayWidth, displayHeight;
      if (imgAspect > containerAspect) {
        displayWidth = containerRect.width;
        displayHeight = displayWidth / imgAspect;
      } else {
        displayHeight = containerRect.height;
        displayWidth = displayHeight * imgAspect;
      }
      
      // 初始化裁剪区域（居中，保持宽高比）
      let cropWidth = displayWidth * 0.8;
      let cropHeight = cropWidth / aspectRatio;
      
      if (cropHeight > displayHeight * 0.8) {
        cropHeight = displayHeight * 0.8;
        cropWidth = cropHeight * aspectRatio;
      }
      
      setCropArea({
        x: (displayWidth - cropWidth) / 2,
        y: (displayHeight - cropHeight) / 2,
        width: cropWidth,
        height: cropHeight
      });
      setImageLoaded(true);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDragging(true);
    setDragStart({ x, y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const deltaX = x - dragStart.x;
    const deltaY = y - dragStart.y;
    
    setCropArea(prev => ({
      ...prev,
      x: Math.max(0, Math.min(prev.x + deltaX, rect.width - prev.width)),
      y: Math.max(0, Math.min(prev.y + deltaY, rect.height - prev.height))
    }));
    
    setDragStart({ x, y });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const getCroppedImage = async (): Promise<Blob | null> => {
    if (!imageRef.current || !containerRef.current) return null;
    
    const img = imageRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // 计算图片在容器中的实际显示尺寸和位置
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const containerAspect = containerRect.width / containerRect.height;
    
    let displayWidth, displayHeight, offsetX, offsetY;
    if (imgAspect > containerAspect) {
      displayWidth = containerRect.width;
      displayHeight = displayWidth / imgAspect;
      offsetX = 0;
      offsetY = (containerRect.height - displayHeight) / 2;
    } else {
      displayHeight = containerRect.height;
      displayWidth = displayHeight * imgAspect;
      offsetX = (containerRect.width - displayWidth) / 2;
      offsetY = 0;
    }
    
    // 计算缩放比例
    const scaleX = img.naturalWidth / displayWidth;
    const scaleY = img.naturalHeight / displayHeight;
    
    // 计算实际的裁剪坐标
    const actualX = (cropArea.x - offsetX) * scaleX;
    const actualY = (cropArea.y - offsetY) * scaleY;
    const actualWidth = cropArea.width * scaleX;
    const actualHeight = cropArea.height * scaleY;
    
    // 设置画布尺寸
    canvas.width = actualWidth;
    canvas.height = actualHeight;
    
    // 绘制裁剪后的图片
    ctx.drawImage(
      img,
      Math.max(0, actualX),
      Math.max(0, actualY),
      actualWidth,
      actualHeight,
      0,
      0,
      actualWidth,
      actualHeight
    );
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.9);
    });
  };

  const handleConfirm = async () => {
    const croppedBlob = await getCroppedImage();
    if (croppedBlob) {
      onCropComplete(croppedBlob);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">裁剪图片</h3>
        
        <div 
          ref={containerRef}
          className="relative w-full h-96 bg-gray-100 overflow-hidden cursor-move"
          onMouseDown={handleMouseDown}
        >
          <img
            ref={imageRef}
            src={imageSrc}
            alt="待裁剪图片"
            className="w-full h-full object-contain"
            onLoad={handleImageLoad}
            draggable={false}
          />
          
          {imageLoaded && (
            <div
              className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20"
              style={{
                left: `${cropArea.x}px`,
                top: `${cropArea.y}px`,
                width: `${cropArea.width}px`,
                height: `${cropArea.height}px`,
                cursor: isDragging ? 'grabbing' : 'grab'
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-blue-700 text-xs font-medium">拖拽移动</span>
              </div>
            </div>
          )}
        </div>
        
        <p className="text-sm text-gray-500 mt-2">
          拖拽选框调整裁剪区域
        </p>
        
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            确认裁剪
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
