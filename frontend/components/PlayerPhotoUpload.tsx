"use client";

import React, { useState, useRef, useEffect } from "react";
import { Loader2, Upload, ScanFace, SlidersHorizontal, Check } from "lucide-react";
import { getSmartCropPosition } from "@/lib/faceDetection";
import { CardImage } from "./CardImage";

interface PlayerPhotoUploadProps {
  currentPhotoUrl?: string;
  currentCropPosition?: string;
  onSave: (photoUrl: string, cropPosition: string) => void;
}

export function PlayerPhotoUpload({ currentPhotoUrl, currentCropPosition, onSave }: PlayerPhotoUploadProps) {
  const [photoUrl, setPhotoUrl] = useState<string>(currentPhotoUrl || "");
  const [cropPosition, setCropPosition] = useState<string>(currentCropPosition || "center 15%");
  const [isDetecting, setIsDetecting] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [showManualControls, setShowManualControls] = useState(false);
  
  // Extract X and Y for manual controls
  const [posX, setPosX] = useState(50);
  const [posY, setPosY] = useState(15);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Parse initial cropPosition if provided
    if (cropPosition) {
      const match = cropPosition.match(/(\d+)%\s+(\d+)%/);
      if (match) {
        setPosX(parseInt(match[1]));
        setPosY(parseInt(match[2]));
      }
    }
  }, [cropPosition]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Url = event.target?.result as string;
      setPhotoUrl(base64Url);
      
      setIsDetecting(true);
      setStatusMsg("Detecting face...");
      
      // Load image to pass to detector
      const img = new Image();
      img.src = base64Url;
      await new Promise(resolve => img.onload = resolve);
      
      const { position, confidence } = await getSmartCropPosition(img);
      
      setCropPosition(position);
      setIsDetecting(false);
      
      if (confidence > 0) {
        setStatusMsg("✓ Face detected");
        setShowManualControls(false);
      } else {
        setStatusMsg("No face found — adjust manually");
        setShowManualControls(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePositionChange = (e: React.ChangeEvent<HTMLInputElement>, axis: "x" | "y") => {
    const val = parseInt(e.target.value);
    if (axis === "x") {
      setPosX(val);
      setCropPosition(`${val}% ${posY}%`);
    } else {
      setPosY(val);
      setCropPosition(`${posX}% ${val}%`);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-6">
      <div className="relative w-48 h-64 rounded-2xl overflow-hidden border border-[#2A2315] shadow-2xl bg-[#0a0a0a]">
        {photoUrl ? (
          <CardImage photoUrl={photoUrl} cropPosition={cropPosition} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-[#110E0A] flex-col gap-2">
            <ScanFace className="size-8 text-[#D4F829]/50" />
            <span className="text-[10px] text-white/40 uppercase tracking-widest">No Photo</span>
          </div>
        )}
        
        {isDetecting && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
            <Loader2 className="size-8 text-[#D4F829] animate-spin mb-3" />
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-2 w-full max-w-xs">
        <input 
          type="file" 
          accept="image/*" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange}
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-12 rounded-[20px] border border-[#D4F829]/30 bg-[#D4F829]/10 text-xs font-display tracking-[0.2em] text-[#D4F829] uppercase hover:bg-[#D4F829]/20 transition flex items-center justify-center gap-2"
        >
          <Upload size={16} /> Choose Photo
        </button>

        {statusMsg && (
          <div className="text-[10px] uppercase tracking-widest text-white/50 font-bold mt-2">
            {statusMsg}
          </div>
        )}

        {photoUrl && !isDetecting && (
          <button
            type="button"
            onClick={() => setShowManualControls(!showManualControls)}
            className="mt-2 text-[#D4F829] text-[10px] uppercase tracking-widest flex items-center gap-1 opacity-70 hover:opacity-100 transition"
          >
            <SlidersHorizontal size={12} /> {showManualControls ? "Hide Controls" : "Manual Adjust"}
          </button>
        )}

        {showManualControls && photoUrl && (
          <div className="w-full mt-4 flex flex-col gap-4 bg-[#110E0A] p-4 rounded-xl border border-white/5">
            <div className="flex flex-col gap-2">
              <label className="text-[9px] uppercase tracking-widest text-white/40 flex justify-between">
                <span>Left / Right</span>
                <span>{posX}%</span>
              </label>
              <input 
                type="range" min="0" max="100" value={posX} 
                onChange={(e) => handlePositionChange(e, "x")}
                className="w-full accent-[#D4F829] h-1 bg-white/10 rounded-full appearance-none outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[9px] uppercase tracking-widest text-white/40 flex justify-between">
                <span>Up / Down</span>
                <span>{posY}%</span>
              </label>
              <input 
                type="range" min="0" max="100" value={posY} 
                onChange={(e) => handlePositionChange(e, "y")}
                className="w-full accent-[#D4F829] h-1 bg-white/10 rounded-full appearance-none outline-none"
              />
            </div>
          </div>
        )}

        {photoUrl && (
          <button
            type="button"
            onClick={() => onSave(photoUrl, cropPosition)}
            className="w-full h-12 mt-4 rounded-[20px] bg-[#D4F829] text-[#181818] text-xs font-display tracking-[0.2em] font-bold uppercase hover:bg-[#bce020] transition shadow-[0_0_20px_rgba(212,248,41,0.2)] flex items-center justify-center gap-2"
          >
            <Check size={16} strokeWidth={2.5} /> Save Photo
          </button>
        )}
      </div>
    </div>
  );
}
