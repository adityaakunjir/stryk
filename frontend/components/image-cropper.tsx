"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { X, Check, ZoomIn, ZoomOut } from "lucide-react";
import AvatarEditor from "react-avatar-editor";

const DRAG_SENSITIVITY = 0.5;
const CROP_SIZE = 280;
const IMAGE_FORMAT = "image/webp";

interface ImageCropperProps {
  src: string;
  onCropComplete: (croppedImageBase64: string) => void;
  onCancel: () => void;
}

export function ImageCropper({ src, onCropComplete, onCancel }: ImageCropperProps) {
  const editorRef = useRef<any>(null);
  
  const [scale, setScale] = useState<number>(1);
  const [rotate, setRotate] = useState<number>(0);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  
  const [initialDistance, setInitialDistance] = useState<number>(0);
  const [initialScale, setInitialScale] = useState<number>(1);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [initialPosition, setInitialPosition] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });

  const handleConfirm = useCallback(async () => {
    if (!editorRef.current) return;
    try {
      const canvas = editorRef.current.getImageScaledToCanvas();
      
      // Ensure high quality smoothing before export
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
      }

      // STRYK uses standard base64 strings right now, using 0.95 for ultra sharp WebP
      const dataUrl = canvas.toDataURL(IMAGE_FORMAT, 0.95);
      onCropComplete(dataUrl);
    } catch (error) {
      console.error("Error processing image:", error);
    }
  }, [onCropComplete]);

  const handleDragStart = useCallback(
    (clientX: number, clientY: number) => {
      setIsDragging(true);
      setDragStart({ x: clientX, y: clientY });
      setInitialPosition({ ...position });
    },
    [position],
  );

  const handleDragMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging) return;

      const deltaX = (-(clientX - dragStart.x) / CROP_SIZE) * DRAG_SENSITIVITY;
      const deltaY = (-(clientY - dragStart.y) / CROP_SIZE) * DRAG_SENSITIVITY;

      const newX = Math.max(0, Math.min(1, initialPosition.x + deltaX));
      const newY = Math.max(0, Math.min(1, initialPosition.y + deltaY));

      setPosition({ x: newX, y: newY });
    },
    [isDragging, dragStart, initialPosition],
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const getDistance = useCallback((touches: React.TouchList) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2));
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        const distance = getDistance(e.touches);
        setInitialDistance(distance);
        setInitialScale(scale);
        setIsDragging(false);
      } else if (e.touches.length === 1) {
        const touch = e.touches[0];
        handleDragStart(touch.clientX, touch.clientY);
      }
    },
    [scale, getDistance, handleDragStart],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2 && initialDistance > 0) {
        const distance = getDistance(e.touches);
        const scaleRatio = distance / initialDistance;
        const newScale = Math.min(Math.max(initialScale * scaleRatio, 0.5), 3);
        setScale(newScale);
      } else if (e.touches.length === 1 && isDragging) {
        const touch = e.touches[0];
        handleDragMove(touch.clientX, touch.clientY);
      }
    },
    [initialDistance, initialScale, getDistance, isDragging, handleDragMove],
  );

  const handleTouchEnd = useCallback(() => {
    setInitialDistance(0);
    handleDragEnd();
  }, [handleDragEnd]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newScale = Math.min(Math.max(scale + delta, 0.5), 3);
      setScale(newScale);
    },
    [scale],
  );

  // Mouse handlers for desktop dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragMove(e.clientX, e.clientY);
  };
  const handleMouseUp = () => {
    handleDragEnd();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm px-5">
      <div className="relative w-full max-w-sm rounded-[2rem] border border-[#C6FF00]/30 bg-[#050a0d] p-6 shadow-[0_34px_100px_rgba(0,0,0,0.8)] flex flex-col items-center">
        {/* Close Button */}
        <button 
          onClick={onCancel}
          type="button"
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-white/10 text-zinc-400 hover:text-white cursor-pointer z-10"
        >
          <X className="size-5" />
        </button>

        <h3 className="font-display uppercase tracking-wider text-xl italic text-white text-center mt-2 mb-4">
          Crop Profile Pic
        </h3>

        {/* Viewport Frame */}
        <div 
          className="relative overflow-hidden rounded-2xl border-2 border-white/10 bg-black cursor-grab active:cursor-grabbing select-none flex justify-center"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <AvatarEditor
            ref={editorRef}
            image={src}
            width={CROP_SIZE * 3}
            height={CROP_SIZE * 3}
            border={20 * 3}
            borderRadius={140 * 3}
            color={[5, 10, 13, 0.85]} // #050a0d with opacity
            scale={scale}
            rotate={rotate}
            position={position}
            style={{ width: `${CROP_SIZE + 40}px`, height: `${CROP_SIZE + 40}px`, pointerEvents: "none" }}
          />

          {/* Mask representing the final circular crop shape overlay with corner brackets */}
          <div className="absolute inset-0 pointer-events-none rounded-2xl" />
          <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#C6FF00] pointer-events-none" />
          <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#C6FF00] pointer-events-none" />
          <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#C6FF00] pointer-events-none" />
          <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#C6FF00] pointer-events-none" />
        </div>

        {/* Zoom controls */}
        <div className="w-full mt-6 flex items-center justify-between gap-3 px-2">
          <ZoomOut size={16} className="text-white/40" />
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.01"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="flex-1 accent-[#C6FF00] h-1.5 rounded-full bg-white/10 cursor-pointer appearance-none outline-none"
          />
          <ZoomIn size={16} className="text-[#C6FF00]" />
        </div>
        <div className="text-[10px] uppercase tracking-wider text-white/40 font-bold mt-2.5">
          Drag to Pan · Slide to Zoom
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 w-full mt-6">
          <button
            onClick={onCancel}
            type="button"
            className="h-11 rounded-xl border border-white/10 bg-white/5 text-xs font-display tracking-widest text-white uppercase hover:bg-white/10 cursor-pointer transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            type="button"
            className="h-11 rounded-xl bg-[#C6FF00] text-black text-xs font-display tracking-widest font-bold uppercase hover:bg-[#b0e600] flex items-center justify-center gap-1.5 cursor-pointer transition"
          >
            <Check size={14} strokeWidth={2.5} /> Save Crop
          </button>
        </div>
      </div>
    </div>
  );
}
