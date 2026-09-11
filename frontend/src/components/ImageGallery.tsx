"use client";

import React, { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2, X, Eye, BookOpen } from "lucide-react";
import { getImageUrls } from "@/lib/utils";
import { BookCover } from "./BookCover";

interface ImageGalleryProps {
  src?: string | string[];
  title: string;
  author?: string;
  category?: string;
  className?: string;
}

export function ImageGallery({
  src,
  title,
  author,
  category,
  className = "",
}: ImageGalleryProps) {
  const images = getImageUrls(src);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  // If no images or only non-image document
  if (!images || images.length === 0) {
    return (
      <div className={`border-3 sm:border-4 border-black shadow-neo-lg aspect-[3/4] overflow-hidden bg-white ${className}`}>
        <BookCover
          src=""
          title={title}
          author={author}
          category={category}
        />
      </div>
    );
  }

  // Check if primary is a document (pdf/doc)
  const primaryExt = images[0].split("?")[0].split(".").pop()?.toLowerCase();
  const isDocOrPdf = ["pdf", "doc", "docx"].includes(primaryExt || "");

  if (isDocOrPdf && images.length === 1) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="border-3 sm:border-4 border-black shadow-neo-lg aspect-[3/4] overflow-hidden bg-white">
          <BookCover
            src={images[0]}
            title={title}
            author={author}
            category={category}
          />
        </div>
        <a
          href={images[0]}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 border-3 sm:border-4 border-black bg-neo-yellow hover:bg-yellow-300 font-black text-sm sm:text-base py-3 px-4 shadow-neo transition-all text-black"
        >
          <BookOpen size={18} /> Open {primaryExt?.toUpperCase()} Document
        </a>
      </div>
    );
  }

  const currentImage = images[currentIndex] || images[0];
  const hasMultiple = images.length > 1;

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main Preview Container */}
      <div className="relative border-3 sm:border-4 border-black shadow-neo-lg aspect-[3/4] overflow-hidden bg-gray-100 group">
        <Image
          src={currentImage}
          alt={`${title} - Preview ${currentIndex + 1}`}
          fill
          className="object-cover transition-all duration-300"
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority={currentIndex === 0}
          unoptimized
        />

        {/* Top Badges */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-center z-10 pointer-events-none">
          <span className="text-xs font-black uppercase px-2.5 py-1 border-2 border-black bg-neo-yellow text-black shadow-sm">
            {currentIndex === 0 ? "Main Cover (1)" : `Preview ${currentIndex + 1}`}
          </span>

          {hasMultiple && (
            <span className="text-xs font-black px-2 py-1 border-2 border-black bg-black text-white shadow-sm">
              {currentIndex + 1} / {images.length}
            </span>
          )}
        </div>

        {/* Navigation Arrows for Multi-image */}
        {hasMultiple && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevImage();
              }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 bg-white border-2 sm:border-3 border-black font-black flex items-center justify-center shadow-neo hover:bg-neo-yellow active:translate-y-[-40%] transition-all cursor-pointer z-20"
              aria-label="Previous photo"
            >
              <ChevronLeft size={22} strokeWidth={3} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextImage();
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 bg-white border-2 sm:border-3 border-black font-black flex items-center justify-center shadow-neo hover:bg-neo-yellow active:translate-y-[-40%] transition-all cursor-pointer z-20"
              aria-label="Next photo"
            >
              <ChevronRight size={22} strokeWidth={3} />
            </button>
          </>
        )}

        {/* Zoom Button */}
        <button
          onClick={() => setIsZoomOpen(true)}
          className="absolute bottom-2.5 right-2.5 bg-white border-2 border-black p-2 font-black shadow-neo hover:bg-neo-yellow active:scale-95 transition-all flex items-center gap-1.5 text-xs cursor-pointer z-10"
          title="Click to expand full size"
        >
          <Maximize2 size={15} />
          <span className="hidden sm:inline font-bold">Zoom</span>
        </button>
      </div>

      {/* Thumbnail Selector Strip (When 2-4 images exist) */}
      {hasMultiple && (
        <div className="grid grid-cols-4 gap-2 pt-1">
          {images.map((img, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={`thumb-${img}-${idx}`}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`relative aspect-[3/4] border-2 sm:border-3 border-black overflow-hidden bg-white transition-all cursor-pointer ${
                  isActive
                    ? "ring-3 ring-black shadow-neo scale-[1.03] bg-neo-yellow"
                    : "opacity-70 hover:opacity-100"
                }`}
              >
                <Image
                  src={img}
                  alt={`Thumbnail ${idx + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <span
                  className={`absolute bottom-0 inset-x-0 text-[10px] font-black text-center py-0.5 border-t border-black ${
                    isActive ? "bg-neo-yellow text-black" : "bg-black text-white"
                  }`}
                >
                  {idx === 0 ? "Cover" : `P${idx + 1}`}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Fullscreen Zoom Modal */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          onClick={() => setIsZoomOpen(false)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] bg-white border-4 border-black shadow-neo-lg p-3 sm:p-4 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b-3 border-black mb-3">
              <div className="flex items-center gap-2">
                <span className="font-serif font-black text-base sm:text-xl truncate max-w-md">
                  {title}
                </span>
                {hasMultiple && (
                  <span className="text-xs font-black bg-neo-yellow px-2 py-0.5 border border-black">
                    Photo {currentIndex + 1} of {images.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsZoomOpen(false)}
                className="border-2 border-black p-1 bg-white hover:bg-red-200 shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Main Image Display */}
            <div className="relative w-full h-[65vh] sm:h-[75vh] bg-gray-50 flex items-center justify-center border-2 border-black overflow-hidden">
              <Image
                src={currentImage}
                alt={`${title} Zoom`}
                fill
                className="object-contain"
                unoptimized
              />

              {/* Modal Arrows */}
              {hasMultiple && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border-3 border-black font-black flex items-center justify-center shadow-neo hover:bg-neo-yellow"
                  >
                    <ChevronLeft size={24} strokeWidth={3} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border-3 border-black font-black flex items-center justify-center shadow-neo hover:bg-neo-yellow"
                  >
                    <ChevronRight size={24} strokeWidth={3} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
