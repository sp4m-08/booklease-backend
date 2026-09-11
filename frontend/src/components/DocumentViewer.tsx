"use client";

import React, { useState } from "react";
import Image from "next/image";
import { FileText, ExternalLink, Loader2, ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";
import { NeoButton } from "@/components/ui/NeoButton";
import { NeoCard } from "@/components/ui/NeoCard";
import { getImageUrls } from "@/lib/utils";

interface DocumentViewerProps {
  fileUrl?: string;
  fileExt?: string;
  title: string;
}

export function DocumentViewerSkeleton() {
  return (
    <div className="w-full h-[70vh] min-h-[400px] border-4 border-black bg-gray-100 flex flex-col items-center justify-center shadow-neo animate-pulse">
      <Loader2 className="w-10 h-10 animate-spin text-black mb-3" />
      <span className="font-bold text-sm text-gray-700">Loading document viewer...</span>
    </div>
  );
}

export default function DocumentViewer({ fileUrl, fileExt, title }: DocumentViewerProps) {
  const [iframeLoading, setIframeLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);

  const allUrls = getImageUrls(fileUrl);
  const primaryUrl = allUrls[0] || fileUrl || "";
  const effectiveExt = fileExt || (primaryUrl ? primaryUrl.split("?")[0].split(".").pop()?.toLowerCase() : "");

  const isPdf = effectiveExt === "pdf";
  const isImage = ["png", "jpg", "jpeg", "webp", "gif", "bmp"].includes(effectiveExt || "") || allUrls.length > 0;
  const hasMultipleImages = allUrls.length > 1;

  const currentImage = allUrls[activeImageIndex] || primaryUrl;

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % allUrls.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + allUrls.length) % allUrls.length);
  };

  return (
    <NeoCard className="flex flex-col p-0 overflow-hidden shadow-neo-lg" color="white">
      <div className="bg-black text-white p-4 font-bold border-b-4 border-black flex justify-between items-center">
        <span className="flex items-center gap-2 text-sm uppercase">
          <FileText size={18} />
          {hasMultipleImages
            ? `Study Material (${allUrls.length} Preview Photos)`
            : `Document Viewer (${effectiveExt?.toUpperCase() || "FILE"})`}
        </span>
        {currentImage && (
          <div className="flex gap-2">
            <a href={currentImage} target="_blank" rel="noreferrer">
              <NeoButton variant="primary" size="sm" className="bg-neo-blue text-black flex items-center gap-1">
                <ExternalLink size={14} /> Open Full Size
              </NeoButton>
            </a>
          </div>
        )}
      </div>

      {/* Study Material Photo Viewer */}
      {currentImage ? (
        <div className="flex flex-col bg-gray-100 p-4 sm:p-6 space-y-4">
          {/* Main Photo Display */}
          <div className="relative w-full aspect-[4/3] max-h-[65vh] border-4 border-black shadow-neo overflow-hidden bg-white mx-auto flex items-center justify-center group">
            <Image 
              src={currentImage} 
              alt={`${title} - Photo ${activeImageIndex + 1}`} 
              fill
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-contain"
              priority
              unoptimized
            />

            {/* Top Indicator */}
            {hasMultipleImages && (
              <div className="absolute top-2 left-2 bg-black/85 text-white text-xs font-black px-2.5 py-1 border border-white/40 shadow-xs">
                Page {activeImageIndex + 1} of {allUrls.length}
              </div>
            )}

            {/* Navigation Arrows */}
            {hasMultipleImages && (
              <>
                <button
                  type="button"
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border-3 border-black font-black flex items-center justify-center shadow-neo hover:bg-neo-yellow cursor-pointer"
                  aria-label="Previous photo"
                >
                  <ChevronLeft size={22} strokeWidth={3} />
                </button>
                <button
                  type="button"
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border-3 border-black font-black flex items-center justify-center shadow-neo hover:bg-neo-yellow cursor-pointer"
                  aria-label="Next photo"
                >
                  <ChevronRight size={22} strokeWidth={3} />
                </button>
              </>
            )}

            {/* Zoom Button */}
            <button
              type="button"
              onClick={() => setIsZoomOpen(true)}
              className="absolute bottom-2.5 right-2.5 bg-white border-2 border-black p-2 font-black shadow-neo hover:bg-neo-yellow active:scale-95 transition-all flex items-center gap-1.5 text-xs cursor-pointer"
              title="Click to zoom full screen"
            >
              <Maximize2 size={15} />
              <span className="hidden sm:inline font-bold">Zoom</span>
            </button>
          </div>

          {/* Interactive Thumbnails for Multi-Picture Notes */}
          {hasMultipleImages && (
            <div className="grid grid-cols-4 gap-2.5 max-w-xl mx-auto w-full">
              {allUrls.map((url, idx) => {
                const isActive = idx === activeImageIndex;
                return (
                  <button
                    key={`note-thumb-${url}-${idx}`}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative aspect-[4/3] border-2 sm:border-3 border-black overflow-hidden bg-white cursor-pointer transition-all ${
                      isActive ? "ring-3 ring-black shadow-neo bg-neo-yellow scale-[1.03]" : "opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image
                      src={url}
                      alt={`Page ${idx + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <span className={`absolute bottom-0 inset-x-0 text-[10px] font-black text-center py-0.5 border-t border-black ${isActive ? "bg-neo-yellow text-black" : "bg-black text-white"}`}>
                      Page {idx + 1}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="p-12 text-center bg-neo-yellow/20 flex flex-col items-center justify-center min-h-[350px]">
          <FileText className="w-20 h-20 text-black mb-4 stroke-1" />
          <h3 className="font-serif text-3xl font-black mb-2">{title}</h3>
          <p className="font-bold text-gray-700 max-w-md">
            No preview photos available for this study material.
          </p>
        </div>
      )}

      {/* Fullscreen Zoom Modal */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          onClick={() => setIsZoomOpen(false)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] bg-white border-4 border-black shadow-neo-lg p-3 sm:p-4 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-3 border-b-3 border-black mb-3">
              <div className="flex items-center gap-2">
                <span className="font-serif font-black text-base sm:text-xl truncate max-w-md">
                  {title}
                </span>
                {hasMultipleImages && (
                  <span className="text-xs font-black bg-neo-yellow px-2 py-0.5 border border-black">
                    Page {activeImageIndex + 1} of {allUrls.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsZoomOpen(false)}
                className="border-2 border-black p-1 bg-white hover:bg-red-200 shadow-sm cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative w-full h-[70vh] bg-gray-50 flex items-center justify-center border-2 border-black overflow-hidden">
              <Image
                src={currentImage}
                alt={`${title} Zoom`}
                fill
                className="object-contain"
                unoptimized
              />

              {hasMultipleImages && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border-3 border-black font-black flex items-center justify-center shadow-neo hover:bg-neo-yellow cursor-pointer"
                  >
                    <ChevronLeft size={24} strokeWidth={3} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white border-3 border-black font-black flex items-center justify-center shadow-neo hover:bg-neo-yellow cursor-pointer"
                  >
                    <ChevronRight size={24} strokeWidth={3} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </NeoCard>
  );
}