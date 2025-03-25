"use client"

import { useState } from "react";
import Image from "next/image";

interface PoolLogoProps {
  logoUrl: string | undefined;
  title: string;
  width?: number;
  height?: number;
  className?: string;
  containerClassName?: string;
  placeholder?: string;
}

export function PoolLogo({
  logoUrl,
  title,
  width = 64,
  height = 64,
  className = "",
  containerClassName = "",
  placeholder = "/logos/habibi.jpg"
}: PoolLogoProps) {
  const [hasError, setHasError] = useState(false);
  const firstLetter = title.charAt(0).toUpperCase();
  const placeholderUrl = placeholder || `https://placehold.co/${width}x${height}/e9e9dc/0c252a?text=${encodeURIComponent(firstLetter)}`;

  // If logoUrl is undefined or empty, or if there was an error loading the image
  if (!logoUrl || hasError) {
    // Check if we should use the default placeholder or the fallback letter
    if (placeholder) {
      return (
        <div className={containerClassName}>
          <Image
            src={placeholderUrl}
            alt={title}
            width={width}
            height={height}
            className={className}
            onError={() => {
              // If even the placeholder fails, set error to true to show the letter fallback
              setHasError(true);
            }}
          />
        </div>
      );
    } else {
      // Letter fallback
      return (
        <div className={`flex items-center justify-center bg-gray-200 ${containerClassName}`} style={{ width, height }}>
          <span className="text-gray-500 font-bold" style={{ fontSize: width * 0.5 }}>
            {firstLetter}
          </span>
        </div>
      );
    }
  }

  // Normal case - try to load the image from logoUrl
  return (
    <div className={containerClassName}>
      <Image
        src={logoUrl}
        alt={title}
        width={width}
        height={height}
        className={className}
        onError={() => {
          // If logoUrl fails to load, mark as error to use fallback
          setHasError(true);
        }}
      />
    </div>
  );
} 