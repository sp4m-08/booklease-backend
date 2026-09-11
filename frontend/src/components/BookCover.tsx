"use client";

import { useState, useEffect } from "react";
import { getImageUrl } from "@/lib/utils";
import { FileText, Book } from "lucide-react";

import Image from "next/image";

interface BookCoverProps {
  src?: string;
  title: string;
  author?: string;
  category?: string;
  className?: string;
  priority?: boolean;
}

const SHIMMER_BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTZlNmMzIi8+PC9zdmc+";

export function BookCover({ src, title, author, category, className = "", priority = false }: BookCoverProps) {
  const [hasError, setHasError] = useState(false);
  const imageUrl = getImageUrl(src);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  // 1. Fallback if no file or image failed
  if (!imageUrl || hasError) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-between p-4 text-center bg-neo-yellow/30 border-b-4 border-black select-none ${className}`}>
        <span className="text-xs font-black uppercase tracking-wider bg-black text-white px-2 py-0.5 border border-black">
          {category || "Book"}
        </span>
        <div className="my-auto px-2">
          <div className="font-serif font-black text-xl text-black line-clamp-3 leading-snug">
            {title}
          </div>
          {author && (
            <div className="text-xs font-bold text-gray-800 mt-2 truncate">
              {author}
            </div>
          )}
        </div>
        <div className="flex justify-center mb-2">
          <Book size={32} />
        </div>
      </div>
    );
  }

  const imageCount = src ? src.split(",").filter((s) => s.trim()).length : 0;

  // 4. Direct High-Speed Image Rendering
  return (
    <div className={`relative w-full h-full overflow-hidden bg-gray-100 ${className}`}>
      <Image
        src={imageUrl}
        alt={title}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        placeholder="blur"
        blurDataURL={SHIMMER_BLUR_DATA_URL}
        onError={() => setHasError(true)}
        className="object-cover"
        unoptimized
        loading="eager"
        decoding="async"
        priority={priority}
      />
      {imageCount > 1 && (
        <div className="absolute top-2 right-2 bg-black/85 text-white text-[10px] font-black px-1.5 py-0.5 border border-white/40 shadow-xs flex items-center gap-1 rounded-sm">
          <span>📷 {imageCount}</span>
        </div>
      )}
    </div>
  );
}
