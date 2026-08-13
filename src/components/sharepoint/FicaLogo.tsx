'use client';

import React from 'react';

interface FicaLogoProps {
  className?: string;
  size?: number;
}

export const FicaLogo: React.FC<FicaLogoProps> = ({ className = 'w-8 h-8', size }) => {
  const style = size ? { width: `${size}px`, height: `${size}px` } : undefined;

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
          <filter id="fica-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Outer Circular Coin Base */}
        <circle cx="250" cy="250" r="230" fill="url(#fica-blue-grad-1)" />

        {/* 4 Overlapping Financial Petals / Swirl Lines */}
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

        {/* Center Square Cutout (Signature Fica Coin Element) */}
        <rect x="175" y="175" width="150" height="150" fill="#FFFFFF" rx="4" />
      </svg>
    </div>
  );
};
