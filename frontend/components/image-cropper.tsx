"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, ZoomIn, ZoomOut, Check } from "lucide-react";

interface ImageCropperProps {
  src: string;
  onCropComplete: (croppedImageBase64: string) => void;
  onCancel: () => void;
}

export function ImageCropper({ src, onCropComplete, onCancel }: ImageCropperProps) {
  const VIEWPORT_W = 280;
  const VIEWPORT_H = 210;

  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);

  const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setNaturalSize({ w: naturalWidth, h: naturalHeight });
    // Reset pan/zoom on image load
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  const clampPan = (x: number, y: number, currentZoom: number) => {
    if (!naturalSize.w || !naturalSize.h) return { x: 0, y: 0 };

    const imageRatio = naturalSize.w / naturalSize.h;
    const viewportRatio = VIEWPORT_W / VIEWPORT_H;
    let bW = 0;
    let bH = 0;

    if (imageRatio > viewportRatio) {
      bH = VIEWPORT_H;
      bW = VIEWPORT_H * imageRatio;
    } else {
      bW = VIEWPORT_W;
      bH = VIEWPORT_W / imageRatio;
    }

    const w = bW * currentZoom;
    const h = bH * currentZoom;

    const cX = (VIEWPORT_W - w) / 2;
    const cY = (VIEWPORT_H - h) / 2;

    const minX = VIEWPORT_W - cX - w;
    const maxX = -cX;

    const minY = VIEWPORT_H - cY - h;
    const maxY = -cY;

    return {
      x: minX <= maxX ? Math.min(maxX, Math.max(minX, x)) : 0,
      y: minY <= maxY ? Math.min(maxY, Math.max(minY, y)) : 0};
  };

  // Keep pan bounded when zoom changes
  useEffect(() => {
    queueMicrotask(() => {
      setPan((prev) => clampPan(prev.x, prev.y, zoom));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, naturalSize]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { x: pan.x, y: pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const nextPan = clampPan(panStartRef.current.x + dx, panStartRef.current.y + dy, zoom);
    setPan(nextPan);
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panStartRef.current = { x: pan.x, y: pan.y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    const nextPan = clampPan(panStartRef.current.x + dx, panStartRef.current.y + dy, zoom);
    setPan(nextPan);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleCrop = () => {
    if (!naturalSize.w || !naturalSize.h || !imgRef.current) return;

    const img = imgRef.current;
    const imageRatio = naturalSize.w / naturalSize.h;
    const viewportRatio = VIEWPORT_W / VIEWPORT_H;
    let bW = 0;
    let bH = 0;

    if (imageRatio > viewportRatio) {
      bH = VIEWPORT_H;
      bW = VIEWPORT_H * imageRatio;
    } else {
      bW = VIEWPORT_W;
      bH = VIEWPORT_W / imageRatio;
    }

    const w = bW * zoom;
    const h = bH * zoom;

    const cX = (VIEWPORT_W - w) / 2;
    const cY = (VIEWPORT_H - h) / 2;

    const offsetX = cX + pan.x;
    const offsetY = cY + pan.y;

    const scale = w / naturalSize.w;

    const cropX = -offsetX / scale;
    const cropY = -offsetY / scale;
    const cropW = VIEWPORT_W / scale;
    const cropH = VIEWPORT_H / scale;

    const canvas = document.createElement("canvas");
    canvas.width = 560; // High resolution target
    canvas.height = 420;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      ctx.drawImage(
        img,
        cropX,
        cropY,
        cropW,
        cropH,
        0,
        0,
        560,
        420
      );
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      onCropComplete(dataUrl);
    }
  };

  // Calculate scaled base size for styling
  const imageRatio = naturalSize.w && naturalSize.h ? naturalSize.w / naturalSize.h : 1;
  const viewportRatio = VIEWPORT_W / VIEWPORT_H;
  let bW = 0;
  let bH = 0;

  if (naturalSize.w && naturalSize.h) {
    if (imageRatio > viewportRatio) {
      bH = VIEWPORT_H;
      bW = VIEWPORT_H * imageRatio;
    } else {
      bW = VIEWPORT_W;
      bH = VIEWPORT_W / imageRatio;
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm px-5">
      <div className="relative w-full max-w-sm rounded-[2rem] border border-[#C6FF00]/30 bg-[#050a0d] p-6 shadow-[0_34px_100px_rgba(0,0,0,0.8)] flex flex-col items-center">
        {/* Close Button */}
        <button 
          onClick={onCancel}
          type="button"
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-white/10 text-zinc-400 hover:text-white cursor-pointer"
        >
          <X className="size-5" />
        </button>

        <h3 className="font-display uppercase tracking-wider text-xl italic text-white text-center mt-2 mb-4">
          Crop Profile Pic
        </h3>

        {/* Viewport Frame */}
        <div 
          className="relative overflow-hidden rounded-2xl border-2 border-white/10 bg-black cursor-grab active:cursor-grabbing select-none"
          style={{ width: `${VIEWPORT_W}px`, height: `${VIEWPORT_H}px` }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Image */}
          <img
            ref={imgRef}
            src={src}
            onLoad={onImgLoad}
            alt="To crop"
            className="absolute max-w-none max-h-none pointer-events-none origin-center"
            style={{
              width: bW ? `${bW}px` : "0",
              height: bH ? `${bH}px` : "0",
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              left: bW ? `calc(50% - ${bW / 2}px)` : "50%",
              top: bH ? `calc(50% - ${bH / 2}px)` : "50%"}}
          />

          {/* Mask representing the final rectangular crop shape overlay with corner brackets */}
          <div className="absolute inset-0 pointer-events-none border border-white/20 rounded-2xl" />
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
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
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
            onClick={handleCrop}
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
