import React, { useRef, useState, useEffect, useCallback } from 'react';

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (cropData: CropArea) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

const ImageCropper: React.FC<ImageCropperProps> = ({
  imageSrc,
  onCropComplete,
  onCancel,
  aspectRatio = 16 / 9,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [crop, setCrop] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string>('');
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialCrop, setInitialCrop] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });

  const initCrop = useCallback(() => {
    if (!imageRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    const img = imageRef.current;

    const imgNaturalWidth = img.naturalWidth;
    const imgNaturalHeight = img.naturalHeight;
    
    const scaleX = imgNaturalWidth / img.width;
    const scaleY = imgNaturalHeight / img.height;

    let cropWidth = containerRect.width * 0.8;
    let cropHeight = cropWidth / aspectRatio;

    if (cropHeight > containerRect.height * 0.8) {
      cropHeight = containerRect.height * 0.8;
      cropWidth = cropHeight * aspectRatio;
    }

    const cropX = (containerRect.width - cropWidth) / 2;
    const cropY = (containerRect.height - cropHeight) / 2;

    setCrop({
      x: cropX,
      y: cropY,
      width: cropWidth,
      height: cropHeight,
    });

    setImageDimensions({
      width: img.width,
      height: img.height,
    });
  }, [aspectRatio]);

  useEffect(() => {
    if (imageLoaded) {
      initCrop();
    }
  }, [imageLoaded, initCrop]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleMouseDown = (e: React.MouseEvent, handle?: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
    } else {
      setIsDragging(true);
    }

    setDragStart({ x: e.clientX, y: e.clientY });
    setInitialCrop({ ...crop });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging && !isResizing) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      if (isDragging) {
        let newX = initialCrop.x + deltaX;
        let newY = initialCrop.y + deltaY;

        newX = Math.max(0, Math.min(newX, imageDimensions.width - crop.width));
        newY = Math.max(0, Math.min(newY, imageDimensions.height - crop.height));

        setCrop((prev) => ({ ...prev, x: newX, y: newY }));
      } else if (isResizing) {
        let newWidth = initialCrop.width;
        let newHeight = initialCrop.height;
        let newX = initialCrop.x;
        let newY = initialCrop.y;

        switch (resizeHandle) {
          case 'se':
            newWidth = Math.max(50, initialCrop.width + deltaX);
            newHeight = newWidth / aspectRatio;
            break;
          case 'sw':
            newWidth = Math.max(50, initialCrop.width - deltaX);
            newHeight = newWidth / aspectRatio;
            newX = initialCrop.x + initialCrop.width - newWidth;
            break;
          case 'ne':
            newWidth = Math.max(50, initialCrop.width + deltaX);
            newHeight = newWidth / aspectRatio;
            newY = initialCrop.y + initialCrop.height - newHeight;
            break;
          case 'nw':
            newWidth = Math.max(50, initialCrop.width - deltaX);
            newHeight = newWidth / aspectRatio;
            newX = initialCrop.x + initialCrop.width - newWidth;
            newY = initialCrop.y + initialCrop.height - newHeight;
            break;
        }

        if (newX >= 0 && newY >= 0 && 
            newX + newWidth <= imageDimensions.width && 
            newY + newHeight <= imageDimensions.height) {
          setCrop({ x: newX, y: newY, width: newWidth, height: newHeight });
        }
      }
    },
    [isDragging, isResizing, dragStart, initialCrop, aspectRatio, imageDimensions, resizeHandle, crop.width, crop.height]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle('');
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const handleConfirm = () => {
    if (!imageRef.current) return;

    const img = imageRef.current;
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    const realCrop: CropArea = {
      x: Math.round(crop.x * scaleX),
      y: Math.round(crop.y * scaleY),
      width: Math.round(crop.width * scaleX),
      height: Math.round(crop.height * scaleY),
    };

    onCropComplete(realCrop);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">裁剪封面图片</h3>
        
        <div
          ref={containerRef}
          className="relative bg-gray-100 rounded-lg overflow-hidden"
          style={{ height: '400px' }}
        >
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Crop preview"
            className="max-w-full max-h-full mx-auto"
            style={{ maxHeight: '400px' }}
            onLoad={handleImageLoad}
            draggable={false}
          />

          {imageLoaded && crop.width > 0 && (
            <>
              <div className="absolute inset-0 pointer-events-none">
                <div
                  className="absolute bg-black bg-opacity-50"
                  style={{
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: imageDimensions.height - crop.y,
                    height: crop.y,
                  }}
                />
                <div
                  className="absolute bg-black bg-opacity-50"
                  style={{
                    top: crop.y,
                    left: 0,
                    width: crop.x,
                    height: crop.height,
                  }}
                />
                <div
                  className="absolute bg-black bg-opacity-50"
                  style={{
                    top: crop.y,
                    left: crop.x + crop.width,
                    right: 0,
                    height: crop.height,
                  }}
                />
                <div
                  className="absolute bg-black bg-opacity-50"
                  style={{
                    top: crop.y + crop.height,
                    left: 0,
                    right: 0,
                    bottom: 0,
                  }}
                />
              </div>

              <div
                className="absolute border-2 border-white cursor-move"
                style={{
                  top: crop.y,
                  left: crop.x,
                  width: crop.width,
                  height: crop.height,
                }}
                onMouseDown={(e) => handleMouseDown(e)}
              >
                <div className="absolute inset-0 border border-white opacity-50" />
                
                <div className="grid grid-cols-3 grid-rows-3 h-full">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="border border-white opacity-30" />
                  ))}
                </div>

                <div
                  className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full -top-2 -left-2 cursor-nw-resize"
                  onMouseDown={(e) => handleMouseDown(e, 'nw')}
                />
                <div
                  className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full -top-2 -right-2 cursor-ne-resize"
                  onMouseDown={(e) => handleMouseDown(e, 'ne')}
                />
                <div
                  className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full -bottom-2 -left-2 cursor-sw-resize"
                  onMouseDown={(e) => handleMouseDown(e, 'sw')}
                />
                <div
                  className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full -bottom-2 -right-2 cursor-se-resize"
                  onMouseDown={(e) => handleMouseDown(e, 'se')}
                />
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
          >
            确认裁剪
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;
