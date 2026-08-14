'use client';

import React, { useState, useEffect } from 'react';

interface FicaLogoProps {
  className?: string;
  size?: number;
  logoUrl?: string | null;
}

export const FicaLogo: React.FC<FicaLogoProps> = ({ className = 'w-8 h-8', size, logoUrl }) => {
  const [imgError, setImgError] = useState(false);
  const style = size ? { width: `${size}px`, height: `${size}px` } : undefined;

  useEffect(() => {
    setImgError(false);
  }, [logoUrl]);

  // If a custom logo URL is uploaded and loads without error, render the uploaded logo image
  if (logoUrl && !imgError) {
    return (
      <div
        className={`relative flex items-center justify-center shrink-0 overflow-hidden rounded-lg bg-slate-800/80 border border-slate-700/60 shadow-sm ${className}`}
        style={style}
      >
        <img
          src={logoUrl}
          alt="Company Logo"
          onError={() => setImgError(true)}
          className="w-full h-full object-contain p-0.5"
        />
      </div>
    );
  }

  // Fallback default Fica Logo SVG
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`} style={style}>
      <svg
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        <defs>
          <linearGradient id="fica-blue-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0078D4" />
            <stop offset="50%" stopColor="#005A9E" />
            <stop offset="100%" stopColor="#003A70" />
          </linearGradient>
          <linearGradient id="fica-blue-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#0369A1" />
          </linearGradient>
        </defs>

        {/* Outer Circular Coin Base */}
        <circle cx="250" cy="250" r="230" fill="url(#fica-blue-grad-1)" />

        {/* 4 Overlapping Financial Petals */}
        <path
          d="M250 20 C350 20, 480 120, 480 250 C380 250, 250 350, 250 250 Z"
          fill="url(#fica-blue-grad-2)"
          opacity="0.65"
        />
        <path
          d="M480 250 C480 350, 380 480, 250 480 C250 380, 350 250, 250 250 Z"
          fill="url(#fica-blue-grad-1)"
          opacity="0.8"
        />
        <path
          d="M250 480 C150 480, 20 380, 20 250 C120 250, 250 150, 250 250 Z"
          fill="url(#fica-blue-grad-2)"
          opacity="0.7"
        />
        <path
          d="M20 250 C20 150, 120 20, 250 20 C250 120, 150 250, 250 250 Z"
          fill="url(#fica-blue-grad-1)"
          opacity="0.85"
        />

        {/* Center Diamond Sparkle */}
        <polygon points="250,170 285,250 250,330 215,250" fill="#FFFFFF" opacity="0.95" />
      </svg>
    </div>
  );
};
