import React from "react";

interface CardImageProps {
  photoUrl: string;
  cropPosition: string;
}

export function CardImage({ photoUrl, cropPosition }: CardImageProps) {
  return (
    <div className="absolute inset-0 z-10 w-full h-full overflow-hidden rounded-2xl">
      <img
        src={photoUrl}
        alt="Player Photo"
        className="w-full h-full object-cover transition-all duration-300 ease-out pointer-events-none"
        style={{ objectPosition: cropPosition || "center 15%" }}
      />
      
      {/* Bottom gradient overlay to blend into the card */}
      <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
      
      {/* Subtle vignette on edges */}
      <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(0,0,0,0.5)] pointer-events-none rounded-2xl" />
    </div>
  );
}
