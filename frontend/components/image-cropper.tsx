"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { X, Check, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import AvatarEditor from "react-avatar-editor";
import * as faceapi from 'face-api.js';

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
  const [isDetecting, setIsDetecting] = useState<boolean>(true);

  // Auto-detect face and set position when src loads
  useEffect(() => {
    let isMounted = true;
    const detectFace = async () => {
      try {
        setIsDetecting(true);
        // Load the tiny face detector model from public/models
        await faceapi.loadTinyFaceDetectorModel('/models');
        
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.src = src;
        
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        const detection = await faceapi.detectSingleFace(
          img,
          new faceapi.TinyFaceDetectorOptions({ 
            inputSize: 320,
            scoreThreshold: 0.4 
          })
        );

        if (detection && isMounted) {
          const imgWidth = img.naturalWidth;
          const imgHeight = img.naturalHeight;
          const { x, y, width, height } = detection.box;
          
          const faceCenterX = x + width / 2;
          const faceCenterY = y + height / 2;
          
          // Target roughly face center minus a portion of height to frame chest
          const targetY = faceCenterY - (height * 0.8);
          
          const xPercent = faceCenterX / imgWidth;
          const yPercent = targetY / imgHeight;
          
          // Clamp to valid editor ranges
          const clampedX = Math.max(0.2, Math.min(0.8, xPercent));
          const clampedY = Math.max(0.0, Math.min(0.8, yPercent));
          
          setPosition({ x: clampedX, y: clampedY });
        }
      } catch (err) {
        console.error("Face detection failed", err);
      } finally {
        if (isMounted) setIsDetecting(false);
      }
    };
    
    if (src) {
      detectFace();
    }
    
    return () => {
      isMounted = false;
    };
  }, [src]);

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
      <div className="relative w-full max-w-sm rounded-[2rem] border border-[#2A2315] bg-[#110E0A] p-6 shadow-2xl flex flex-col items-center">
        {/* Close Button */}
        <button 
          onClick={onCancel}
          type="button"
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-white/10 text-[#808080] hover:text-[#D4F829] hover:border-[#D4F829]/50 hover:bg-[#D4F829]/10 cursor-pointer z-10 transition-colors"
        >
          <X className="size-5" />
        </button>

        <h3 className="font-display font-black uppercase tracking-wider text-2xl italic text-white text-center mt-2 mb-6">
          CROP PROFILE PIC
        </h3>

        {/* Viewport Frame */}
        <div 
          className="relative overflow-hidden rounded-2xl border border-white/5 bg-black cursor-grab active:cursor-grabbing select-none flex justify-center"
        >
          {isDetecting && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
              <Loader2 className="size-8 text-[#D4F829] animate-spin mb-3" />
              <p className="text-white/80 font-display uppercase tracking-widest text-xs animate-pulse">Detecting Face...</p>
            </div>
          )}
          <AvatarEditor
            ref={editorRef}
            image={src}
            width={CROP_SIZE * 3}
            height={CROP_SIZE * 3}
            border={20 * 3}
            borderRadius={140 * 3}
            color={[17, 14, 10, 0.85]} // #110E0A with opacity
            scale={scale}
            rotate={rotate}
            position={position}
            onPositionChange={(pos) => setPosition(pos)}
            style={{ width: `${CROP_SIZE + 40}px`, height: `${CROP_SIZE + 40}px` }}
          />

          {/* Mask representing the final circular crop shape overlay with corner brackets */}
          <div className="absolute inset-0 pointer-events-none rounded-2xl" />
          <div className="absolute top-4 left-4 w-6 h-6 border-t-[3px] border-l-[3px] border-[#D4F829]/60 pointer-events-none rounded-tl-sm" />
          <div className="absolute top-4 right-4 w-6 h-6 border-t-[3px] border-r-[3px] border-[#D4F829]/60 pointer-events-none rounded-tr-sm" />
          <div className="absolute bottom-4 left-4 w-6 h-6 border-b-[3px] border-l-[3px] border-[#D4F829]/60 pointer-events-none rounded-bl-sm" />
          <div className="absolute bottom-4 right-4 w-6 h-6 border-b-[3px] border-r-[3px] border-[#D4F829]/60 pointer-events-none rounded-br-sm" />
        </div>

        <style dangerouslySetInnerHTML={{__html: `
          input[type=range].custom-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #D4F829;
            cursor: pointer;
          }
          input[type=range].custom-slider::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: #D4F829;
            cursor: pointer;
            border: none;
          }
        `}} />

        {/* Zoom controls */}
        <div className="w-full mt-8 flex items-center justify-between gap-4 px-4">
          <ZoomOut size={18} className="text-[#808080]" />
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.01"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="flex-1 custom-slider h-1.5 rounded-full bg-[#1A1A1A] cursor-pointer appearance-none outline-none"
          />
          <ZoomIn size={18} className="text-[#D4F829]" />
        </div>
        <div className="text-[11px] font-black uppercase tracking-[0.1em] text-[#808080]/80 mt-4 text-center w-full">
          DRAG TO PAN · SLIDE TO ZOOM
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 w-full mt-8 mb-2 px-2">
          <button
            onClick={onCancel}
            type="button"
            className="h-[52px] rounded-3xl border border-[#2A2315]/50 bg-[#15120C] text-[13px] font-display font-black tracking-[0.05em] text-[#E8E8E8] uppercase hover:bg-[#1A160F] cursor-pointer transition shadow-sm"
          >
            CANCEL
          </button>
          <button
            onClick={handleConfirm}
            type="button"
            className="h-[52px] rounded-3xl bg-[#D4F829] text-[#110E0A] text-[13px] font-display font-black tracking-[0.05em] uppercase hover:bg-[#bce020] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer transition shadow-[0_0_30px_rgba(212,248,41,0.15)]"
          >
            <Check size={16} strokeWidth={3} /> SAVE CROP
          </button>
        </div>
      </div>
    </div>
  );
}
