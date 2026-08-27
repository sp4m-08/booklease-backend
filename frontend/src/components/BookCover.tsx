"use client";

import { useState, useEffect } from "react";
import { getImageUrl } from "@/lib/utils";
import { FileText } from "lucide-react";

interface BookCoverProps {
  src?: string;
  title: string;
  author?: string;
  category?: string;
  className?: string;
}

export function BookCover({ src, title, author, category, className = "" }: BookCoverProps) {
  const [hasError, setHasError] = useState(false);
  const imageUrl = getImageUrl(src);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const fileExt = src ? src.split("?")[0].split(".").pop()?.toLowerCase() : "";
  const isPdf = fileExt === "pdf";
  const isDoc = ["doc", "docx"].includes(fileExt || "");

  // 1. If it's a PDF document uploaded as cover/material
  if (isPdf && imageUrl) {
    return (
      <div className={`w-full h-full flex flex-col justify-between p-4 bg-red-50 border-b-4 border-black select-none ${className}`}>
        <div className="flex justify-between items-center">
          <span className="text-xs font-black uppercase tracking-wider bg-black text-white px-2 py-0.5 border border-black">
            {category || "PDF Book"}
          </span>
          <span className="text-xs font-black uppercase px-2 py-0.5 border-2 border-black bg-red-400 text-white shadow-sm">
            PDF
          </span>
        </div>

        <div className="my-auto text-center px-2">
          <div className="w-14 h-14 mx-auto mb-2 border-2 border-black bg-white flex items-center justify-center shadow-neo">
            <span className="font-black text-red-600 text-base">PDF</span>
          </div>
          <div className="font-serif font-black text-lg text-black line-clamp-3 leading-tight">
            {title}
          </div>
          {author && (
            <p className="text-xs font-bold text-gray-700 mt-1 truncate">
              {author}
            </p>
          )}
        </div>

        <div className="text-center text-xs font-bold text-red-800 bg-red-100 py-1 border border-red-300">
          📕 PDF Document
        </div>
      </div>
    );
  }

  // 2. If it's a Word document
  if (isDoc && imageUrl) {
    return (
      <div className={`w-full h-full flex flex-col justify-between p-4 bg-blue-50 border-b-4 border-black select-none ${className}`}>
        <div className="flex justify-between items-center">
          <span className="text-xs font-black uppercase tracking-wider bg-black text-white px-2 py-0.5 border border-black">
            {category || "Doc"}
          </span>
          <span className="text-xs font-black uppercase px-2 py-0.5 border-2 border-black bg-blue-500 text-white shadow-sm">
            DOC
          </span>
        </div>

        <div className="my-auto text-center px-2">
          <div className="w-14 h-14 mx-auto mb-2 border-2 border-black bg-white flex items-center justify-center shadow-neo">
            <FileText className="w-7 h-7 text-blue-600" />
          </div>
          <div className="font-serif font-black text-lg text-black line-clamp-3 leading-tight">
            {title}
          </div>
        </div>

        <div className="text-center text-xs font-bold text-blue-800 bg-blue-100 py-1 border border-blue-300">
          📘 Word Document
        </div>
      </div>
    );
  }

  // 3. Fallback if no file or image failed
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
        <div className="text-3xl">📚</div>
      </div>
    );
  }

  // 4. Standard Image Rendering (PNG, JPG, JPEG, WebP)
  return (
    <img
      src={imageUrl}
      alt={title}
      onError={() => {
        setHasError(true);
      }}
      className={`object-cover w-full h-full ${className}`}
      loading="lazy"
    />
  );
}
