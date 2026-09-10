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

  const fileExt = src ? src.split("?")[0].split(".").pop()?.toLowerCase() : "";
  const isImage = ["png", "jpg", "jpeg", "webp", "gif"].includes(fileExt || "");
  const isPdf = fileExt === "pdf";
  const isDoc = ["doc", "docx"].includes(fileExt || "");

  if (isImage && imageUrl && !hasError) {
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
      </div>
    );
  }

  // Graphic document preview for PDF, Doc, or fallback
  return (
    <div className={`w-full h-full flex flex-col justify-between p-4 bg-neo-blue/20 border-b-4 border-black select-none ${className}`}>
      <div className="flex justify-between items-center">
        <span className="text-xs font-black uppercase tracking-wider bg-black text-white px-2 py-0.5 border border-black">
          {subject || "Notes"}
        </span>
        <span className="text-xs font-black uppercase px-2 py-0.5 border-2 border-black bg-neo-yellow">
          {fileExt?.toUpperCase() || "DOC"}
        </span>
      </div>

      <div className="my-auto text-center px-2">
        <div className="w-12 h-12 mx-auto mb-2 border-2 border-black bg-white flex items-center justify-center shadow-neo">
          {isPdf ? (
            <span className="font-black text-red-600 text-sm">PDF</span>
          ) : isDoc ? (
            <span className="font-black text-blue-600 text-sm">DOC</span>
          ) : (
            <FileText className="w-6 h-6 text-black" />
          )}
        </div>
        <div className="font-serif font-black text-lg text-black line-clamp-2 leading-tight">
          {title}
        </div>
      </div>

      <div className="text-center text-xs font-bold text-gray-700 flex items-center justify-center gap-1">
        <FileText size={14} /> Click to view & download
      </div>
    </div>
  );
}
