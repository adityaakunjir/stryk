"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { X, Check, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import AvatarEditor from "react-avatar-editor";
import * as faceapi from 'face-api.js';
import { toast } from "sonner";

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
            inputSize: 512,
            scoreThreshold: 0.15 
          })
        );

        if (detection && isMounted) {
          const imgWidth = img.naturalWidth;
          const imgHeight = img.naturalHeight;
          const { x, y, width, height } = detection.box;
          
          const faceCenterX = x + width / 2;
          // Face center Y — go slightly above face center so full face + little bit of hair is visible
          const faceCenterY = y + height * 0.4;
          
          const xPercent = faceCenterX / imgWidth;
          const yPercent = faceCenterY / imgHeight;
          
          // Calculate ideal zoom based on face size
          const minDim = Math.min(imgWidth, imgHeight);
          const editorDim = CROP_SIZE * 3;
          // How big the face is at scale 1
          const faceOnScreenAtScale1 = (width / minDim) * editorDim;
          
          // We want face to fill about 65% of the visible circle
          const targetFaceWidth = CROP_SIZE * 0.65;
          const idealZoom = targetFaceWidth / faceOnScreenAtScale1;
          
          // Clamp zoom between 1 and 3
          const clampedZoom = Math.max(1, Math.min(3, idealZoom));

          setScale(clampedZoom);
          setPosition({ x: xPercent, y: yPercent });
        } else if (isMounted) {
          // Fallback if face not found (e.g. sunglasses)
          setPosition({ x: 0.5, y: 0.35 });
          setScale(1);
        }
      } catch (err: any) {
        console.error("Face detection failed", err);
        toast.error(`Face AI Error: ${err.message || "Failed to scan"}`);
        if (isMounted) {
          setPosition({ x: 0.5, y: 0.35 });
          setScale(1);
        }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl px-4 sm:px-5">
      <div className="relative w-full max-w-sm rounded-[2rem] border border-white/10 bg-[#0F0D0A]/80 backdrop-blur-2xl p-6 shadow-[0_0_80px_rgba(212,248,41,0.05)] flex flex-col items-center">
        {/* Subtle glow behind modal */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#D4F829]/5 to-transparent rounded-[2rem] pointer-events-none" />

        {/* Close Button */}
        <button 
          onClick={onCancel}
          type="button"
          className="absolute right-5 top-5 grid size-8 place-items-center rounded-full border border-white/10 bg-black/40 text-[#808080] hover:text-[#D4F829] hover:border-[#D4F829]/50 hover:bg-[#D4F829]/10 cursor-pointer z-20 transition-all backdrop-blur-md"
        >
          <X className="size-4" />
        </button>

        <h3 className="font-display font-black uppercase tracking-widest text-2xl italic bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent text-center mt-1 mb-7 drop-shadow-md z-10">
          CROP PROFILE PIC
        </h3>

        {/* Viewport Frame with Floating Brackets */}
        <div className="relative p-3 flex items-center justify-center z-10 w-full mb-2">
          {/* Futuristic Targeting Brackets OUTSIDE the hidden overflow */}
          <div className="absolute top-1 left-1 w-8 h-8 border-t-[3px] border-l-[3px] border-[#D4F829] pointer-events-none drop-shadow-[0_0_8px_rgba(212,248,41,0.5)] rounded-tl-xl z-20" />
          <div className="absolute top-1 right-1 w-8 h-8 border-t-[3px] border-r-[3px] border-[#D4F829] pointer-events-none drop-shadow-[0_0_8px_rgba(212,248,41,0.5)] rounded-tr-xl z-20" />
          <div className="absolute bottom-1 left-1 w-8 h-8 border-b-[3px] border-l-[3px] border-[#D4F829] pointer-events-none drop-shadow-[0_0_8px_rgba(212,248,41,0.5)] rounded-bl-xl z-20" />
          <div className="absolute bottom-1 right-1 w-8 h-8 border-b-[3px] border-r-[3px] border-[#D4F829] pointer-events-none drop-shadow-[0_0_8px_rgba(212,248,41,0.5)] rounded-br-xl z-20" />

          <div 
            className="relative overflow-hidden rounded-full border-[3px] border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.8)] cursor-grab active:cursor-grabbing select-none flex justify-center bg-[#0a0a0a]"
            style={{ width: `${CROP_SIZE}px`, height: `${CROP_SIZE}px` }}
          >
            {isDetecting ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm rounded-full">
                <Loader2 className="size-8 text-[#D4F829] animate-spin mb-3 drop-shadow-[0_0_10px_rgba(212,248,41,0.5)]" />
                <p className="text-[#D4F829] font-display font-bold uppercase tracking-widest text-[10px] animate-pulse">Scanning Face</p>
              </div>
            ) : (
              <AvatarEditor
                ref={editorRef}
                image={src}
                width={CROP_SIZE * 3}
                height={CROP_SIZE * 3}
                border={0}
                borderRadius={0}
                color={[0, 0, 0, 0.8]} 
                scale={scale}
                rotate={rotate}
                position={position}
                onPositionChange={(pos) => setPosition(pos)}
                style={{ width: `${CROP_SIZE}px`, height: `${CROP_SIZE}px` }}
              />
            )}

            <div className="absolute inset-0 pointer-events-none rounded-full ring-1 ring-white/10 shadow-[inset_0_0_40px_rgba(0,0,0,0.5)] z-20" />
          </div>
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
        <div className="w-full mt-10 flex items-center justify-between gap-4 px-2 z-10">
          <ZoomOut size={20} className="text-[#808080]" />
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.01"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="flex-1 custom-slider h-[6px] rounded-full bg-[#1A1A1A] cursor-pointer appearance-none outline-none shadow-inner"
          />
          <ZoomIn size={20} className="text-[#D4F829] drop-shadow-[0_0_8px_rgba(212,248,41,0.4)]" />
        </div>
        <div className="text-[10px] font-display font-bold uppercase tracking-[0.2em] text-[#808080] mt-5 text-center w-full z-10">
          DRAG TO PAN · SLIDE TO ZOOM
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 w-full mt-8 mb-2 px-1 z-10">
          <button
            onClick={onCancel}
            type="button"
            className="h-[52px] rounded-full border border-white/5 bg-black/40 backdrop-blur-md text-[13px] font-display font-black tracking-[0.05em] text-[#E8E8E8] uppercase hover:bg-black/60 hover:border-white/10 cursor-pointer transition-all shadow-sm"
          >
            CANCEL
          </button>
          <button
            onClick={handleConfirm}
            type="button"
            className="h-[52px] rounded-full bg-gradient-to-b from-[#D4F829] to-[#bce020] text-[#110E0A] text-[13px] font-display font-black tracking-[0.05em] uppercase hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_4px_20px_rgba(212,248,41,0.25)] border border-[#D4F829]"
          >
            <Check size={16} strokeWidth={3} /> SAVE CROP
          </button>
        </div>
      </div>
    </div>
  );
}
