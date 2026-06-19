"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { X, Check, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import AvatarEditor from "react-avatar-editor";
import * as faceapi from 'face-api.js';

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
  const [rotate] = useState<number>(0);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const [isDetecting, setIsDetecting] = useState<boolean>(true);

  // Refs to persist detected values and guard against editor overwrites
  const detectedPositionRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 });
  const detectedScaleRef = useRef<number>(1);
  const lastProgrammaticSetRef = useRef<number>(0);

  useEffect(() => {
    let isMounted = true;
    const detectFace = async () => {
      try {
        setIsDetecting(true);
        await faceapi.loadTinyFaceDetectorModel('/models');
        
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.src = src;
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
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
          const faceCenterY = y + height * 0.35;
          
          const xPercent = faceCenterX / imgWidth;
          const yPercent = faceCenterY / imgHeight;
          
          // Zoom: both values in display-pixel units
          const minDim = Math.min(imgWidth, imgHeight);
          const faceDisplayAtScale1 = (width / minDim) * CROP_SIZE;
          const targetFaceDisplay = CROP_SIZE * 0.45;
          const idealZoom = targetFaceDisplay / faceDisplayAtScale1;
          const clampedZoom = Math.max(1, Math.min(3, idealZoom));

          console.log("[FaceCrop] Detected face:", {
            box: { x: Math.round(x), y: Math.round(y), w: Math.round(width), h: Math.round(height) },
            imgSize: { w: imgWidth, h: imgHeight },
            position: { x: xPercent.toFixed(3), y: yPercent.toFixed(3) },
            zoom: { idealZoom: idealZoom.toFixed(2), clamped: clampedZoom.toFixed(2) },
          });

          detectedPositionRef.current = { x: xPercent, y: yPercent };
          detectedScaleRef.current = clampedZoom;
          lastProgrammaticSetRef.current = Date.now();
          setScale(clampedZoom);
          setPosition({ x: xPercent, y: yPercent });

        } else if (isMounted) {
          console.log("[FaceCrop] No face detected — using fallback");
          detectedPositionRef.current = { x: 0.5, y: 0.35 };
          detectedScaleRef.current = 1.2;
          lastProgrammaticSetRef.current = Date.now();
          setPosition({ x: 0.5, y: 0.35 });
          setScale(1.2);
        }
      } catch (err: any) {
        console.error("[FaceCrop] Detection error:", err);
        if (isMounted) {
          lastProgrammaticSetRef.current = Date.now();
          setPosition({ x: 0.5, y: 0.35 });
          setScale(1);
        }
      } finally {
        if (isMounted) setIsDetecting(false);
      }
    };
    
    if (src) detectFace();
    return () => { isMounted = false; };
  }, [src]);

  const handleConfirm = useCallback(async () => {
    if (!editorRef.current) return;
    try {
      const canvas = editorRef.current.getImageScaledToCanvas();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
      }
      const dataUrl = canvas.toDataURL(IMAGE_FORMAT, 0.95);
      onCropComplete(dataUrl);
    } catch (error) {
      console.error("Error processing image:", error);
    }
  }, [onCropComplete]);

  // Scroll wheel zoom on the editor area
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.min(Math.max(prev + delta, 0.5), 3));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl px-4 sm:px-5">
      <div className="relative w-full max-w-sm rounded-[2rem] border border-white/10 bg-[#0F0D0A]/80 backdrop-blur-2xl p-6 shadow-[0_0_80px_rgba(212,248,41,0.05)] flex flex-col items-center">
        
        <div className="absolute inset-0 bg-gradient-to-b from-[#D4F829]/5 to-transparent rounded-[2rem] pointer-events-none" />

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

        <div className="relative p-3 flex items-center justify-center z-10 w-full mb-2">
          {/* Corner brackets */}
          <div className="absolute top-1 left-1 w-8 h-8 border-t-[3px] border-l-[3px] border-[#D4F829] pointer-events-none drop-shadow-[0_0_8px_rgba(212,248,41,0.5)] rounded-tl-xl z-20" />
          <div className="absolute top-1 right-1 w-8 h-8 border-t-[3px] border-r-[3px] border-[#D4F829] pointer-events-none drop-shadow-[0_0_8px_rgba(212,248,41,0.5)] rounded-tr-xl z-20" />
          <div className="absolute bottom-1 left-1 w-8 h-8 border-b-[3px] border-l-[3px] border-[#D4F829] pointer-events-none drop-shadow-[0_0_8px_rgba(212,248,41,0.5)] rounded-bl-xl z-20" />
          <div className="absolute bottom-1 right-1 w-8 h-8 border-b-[3px] border-r-[3px] border-[#D4F829] pointer-events-none drop-shadow-[0_0_8px_rgba(212,248,41,0.5)] rounded-br-xl z-20" />

          <div 
            className="relative overflow-hidden rounded-full border-[3px] border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.8)] cursor-grab active:cursor-grabbing select-none flex justify-center bg-[#0a0a0a]"
            style={{ width: `${CROP_SIZE}px`, height: `${CROP_SIZE}px` }}
            onWheel={handleWheel}
          >
            {isDetecting ? (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm rounded-full">
                <Loader2 className="size-8 text-[#D4F829] animate-spin mb-3 drop-shadow-[0_0_10px_rgba(212,248,41,0.5)]" />
                <p className="text-[#D4F829] font-display font-bold uppercase tracking-widest text-[10px] animate-pulse">
                  Scanning Face
                </p>
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
                onPositionChange={(pos) => {
                  // Ignore position changes from editor's internal initialization.
                  // Only accept position changes that happen 500ms+ after our last
                  // programmatic set — those are from user dragging.
                  if (Date.now() - lastProgrammaticSetRef.current < 500) {
                    console.log("[FaceCrop] Blocked editor position override:", pos);
                    return;
                  }
                  setPosition(pos);
                }}
                onImageReady={() => {
                  // Editor has fully loaded the image. Re-apply our detected
                  // position to override whatever the editor set during init.
                  console.log("[FaceCrop] Editor ready — re-applying position:", detectedPositionRef.current);
                  lastProgrammaticSetRef.current = Date.now();
                  setPosition({ ...detectedPositionRef.current });
                  setScale(detectedScaleRef.current);
                }}
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
