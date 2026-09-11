"use client";

import { useState, useEffect } from "react";
import { getImageUrl } from "@/lib/utils";
import { FileText } from "lucide-react";

import Image from "next/image";

interface NoteCoverProps {
  src?: string;
  title: string;
  subject?: string;
  className?: string;
  priority?: boolean;
}

const SHIMMER_BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTZlNmMzIi8+PC9zdmc+";

export function NoteCover({ src, title, subject, className = "", priority = false }: NoteCoverProps) {
  const [hasError, setHasError] = useState(false);
  const imageUrl = getImageUrl(src);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const imageCount = src ? src.split(",").filter((s) => s.trim()).length : 0;

  if (imageUrl && !hasError) {
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

  // Clean fallback card for Notes
  return (
    <div className={`w-full h-full flex flex-col justify-between p-4 bg-neo-blue/20 border-b-4 border-black select-none ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-xs font-black uppercase tracking-wider bg-black text-white px-2 py-0.5 border border-black">
          {subject || "Notes"}
        </span>
        <span className="text-xs font-black uppercase px-2 py-0.5 border-2 border-black bg-neo-yellow">
          Study Material
        </span>
      </div>

      <div className="my-auto text-center px-2">
        <div className="w-12 h-12 mx-auto mb-2 border-2 border-black bg-white flex items-center justify-center shadow-neo">
          <FileText className="w-6 h-6 text-black" />
        </div>
        <div className="font-serif font-black text-lg text-black line-clamp-2 leading-tight">
          {title}
        </div>
      </div>

      <div className="text-center text-xs font-bold text-gray-700 flex items-center justify-center gap-1">
        <FileText size={14} /> View Note Details
      </div>
    </div>
  );
}
