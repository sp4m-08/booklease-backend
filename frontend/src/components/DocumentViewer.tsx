"use client";

import React, { useState } from "react";
import Image from "next/image";
import { FileText, ExternalLink, Loader2 } from "lucide-react";
import { NeoButton } from "@/components/ui/NeoButton";
import { NeoCard } from "@/components/ui/NeoCard";

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
  const isPdf = fileExt === "pdf";
  const isImage = ["png", "jpg", "jpeg", "webp", "gif"].includes(fileExt || "");

  return (
    <NeoCard className="flex flex-col p-0 overflow-hidden shadow-neo-lg" color="white">
      <div className="bg-black text-white p-4 font-bold border-b-4 border-black flex justify-between items-center">
        <span className="flex items-center gap-2 text-sm uppercase">
          <FileText size={18} />
          Document Viewer ({fileExt?.toUpperCase() || "FILE"})
        </span>
        {fileUrl && (
          <div className="flex gap-2">
            <a href={fileUrl} target="_blank" rel="noreferrer">
              <NeoButton variant="primary" size="sm" className="bg-neo-blue text-black flex items-center gap-1">
                <ExternalLink size={14} /> View Document
              </NeoButton>
            </a>
          </div>
        )}
      </div>

      {/* Adaptive File Viewer */}
      {isPdf && fileUrl ? (
        <div className="relative h-[75vh] w-full bg-gray-100">
          {iframeLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100/90 z-10">
              <Loader2 className="w-8 h-8 animate-spin text-black mb-2" />
              <span className="font-bold text-xs">Rendering PDF document...</span>
            </div>
          )}
          <iframe 
            src={`${fileUrl}#view=FitH`} 
            className="w-full h-full border-none"
            title={title}
            onLoad={() => setIframeLoading(false)}
          />
        </div>
      ) : isImage && fileUrl ? (
        <div className="relative p-8 bg-gray-100 flex items-center justify-center min-h-[400px]">
          <div className="relative max-h-[70vh] w-full aspect-[4/3] max-w-2xl border-4 border-black shadow-neo overflow-hidden bg-white">
            <Image 
              src={fileUrl} 
              alt={title} 
              fill
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-contain"
              priority
            />
          </div>
        </div>
      ) : (
        <div className="p-12 text-center bg-neo-yellow/20 flex flex-col items-center justify-center min-h-[350px]">
          <FileText className="w-20 h-20 text-black mb-4 stroke-1" />
          <h3 className="font-serif text-3xl font-black mb-2">{title}</h3>
          <p className="font-bold text-gray-700 mb-6 max-w-md">
            This document format ({fileExt?.toUpperCase() || "DOC"}) is ready to be viewed.
          </p>
          {fileUrl && (
            <a href={fileUrl} target="_blank" rel="noreferrer">
              <NeoButton variant="primary" size="lg" className="bg-neo-blue text-black flex items-center gap-2">
                <ExternalLink size={20} /> View Document File
              </NeoButton>
            </a>
          )}
        </div>
      )}
    </NeoCard>
  );
}