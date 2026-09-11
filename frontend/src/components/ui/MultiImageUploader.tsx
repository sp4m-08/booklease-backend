"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import { X, Plus, FileText, Camera, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { getImageUrl } from "@/lib/utils";

interface MultiImageUploaderProps {
  maxImages?: number;
  files: File[];
  onChangeFiles: (files: File[]) => void;
  existingUrls?: string[];
  onChangeExistingUrls?: (urls: string[]) => void;
  documentFile?: File | null;
  onChangeDocumentFile?: (file: File | null) => void;
  allowDocument?: boolean;
  label?: string;
  description?: string;
}

export function MultiImageUploader({
  maxImages = 4,
  files,
  onChangeFiles,
  existingUrls = [],
  onChangeExistingUrls,
  documentFile = null,
  onChangeDocumentFile,
  allowDocument = true,
  label = "Preview Pictures (Max 4)",
  description = "Upload 1 to 4 clear photos (e.g. Front Cover, Table of Contents, Sample Page, Condition)",
}: MultiImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const totalImageCount = existingUrls.length + files.length;
  const canAddMore = totalImageCount < maxImages;

  // Generate temporary object URLs for newly selected files
  const filePreviews = React.useMemo(() => {
    return files.map((file, idx) => ({
      id: `new-${idx}-${file.name}`,
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: (file.size / 1024).toFixed(0) + " KB",
    }));
  }, [files]);

  // Clean up object URLs when unmounting or changing
  React.useEffect(() => {
    return () => {
      filePreviews.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [filePreviews]);

  const handleFilesAdded = (incomingFiles: FileList | File[]) => {
    const fileArray = Array.from(incomingFiles);
    const imageFiles: File[] = [];

    for (const file of fileArray) {
      const isImg = file.type.startsWith("image/");
      const isDoc = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
      ].includes(file.type) || /\.(pdf|doc|docx|txt)$/i.test(file.name);

      if (isDoc && allowDocument && onChangeDocumentFile) {
        if (file.size > 25 * 1024 * 1024) {
          toast.error(`Document ${file.name} is too large (>25MB)`);
        } else {
          onChangeDocumentFile(file);
          toast.success(`Attached document: ${file.name}`);
        }
        continue;
      }

      if (isImg || /\.(png|jpg|jpeg|webp|gif|bmp)$/i.test(file.name)) {
        if (file.size > 15 * 1024 * 1024) {
          toast.error(`Image ${file.name} is too large (>15MB)`);
          continue;
        }
        imageFiles.push(file);
      } else {
        toast.error(`Unsupported file type: ${file.name}`);
      }
    }

    if (imageFiles.length === 0) return;

    const availableSlots = maxImages - existingUrls.length - files.length;
    if (availableSlots <= 0) {
      toast.warning(`You can upload a maximum of ${maxImages} preview pictures.`);
      return;
    }

    const toAdd = imageFiles.slice(0, availableSlots);
    if (imageFiles.length > availableSlots) {
      toast.info(`Added ${toAdd.length} picture(s). Maximum limit of ${maxImages} reached.`);
    }

    onChangeFiles([...files, ...toAdd]);
  };

  const removeNewFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    onChangeFiles(updated);
  };

  const removeExistingUrl = (urlToRemove: string) => {
    if (onChangeExistingUrls) {
      const updated = existingUrls.filter((u) => u !== urlToRemove);
      onChangeExistingUrls(updated);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesAdded(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <label className="font-bold text-lg sm:text-xl block text-black">
            {label}
          </label>
          <p className="text-xs sm:text-sm font-medium text-gray-800">
            {description}
          </p>
        </div>
        <span className="text-xs font-black px-2.5 py-1 border-2 border-black bg-white shadow-sm self-start sm:self-auto">
          {totalImageCount} / {maxImages} Uploaded
        </span>
      </div>

      {/* Grid of Existing + New Image Previews */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* 1. Existing Uploaded URLs (when editing) */}
        {existingUrls.map((url, idx) => {
          const isCover = idx === 0;
          return (
            <div
              key={`existing-${url}-${idx}`}
              className="relative aspect-[3/4] border-3 sm:border-4 border-black bg-white shadow-neo group overflow-hidden flex flex-col"
            >
              <div className="relative w-full h-full">
                <Image
                  src={getImageUrl(url)}
                  alt={`Preview ${idx + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              {/* Top Badge */}
              <div className="absolute top-1.5 left-1.5">
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 border border-black shadow-sm ${
                    isCover ? "bg-neo-yellow text-black" : "bg-black text-white"
                  }`}
                >
                  {isCover ? "Cover (1)" : `Photo ${idx + 1}`}
                </span>
              </div>

              {/* Remove Button */}
              {onChangeExistingUrls && (
                <button
                  type="button"
                  onClick={() => removeExistingUrl(url)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white border-2 border-black font-black flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                  title="Remove picture"
                >
                  <X size={14} strokeWidth={3} />
                </button>
              )}
            </div>
          );
        })}

        {/* 2. Newly Added Files */}
        {filePreviews.map((item, idx) => {
          const overallIndex = existingUrls.length + idx;
          const isCover = overallIndex === 0;
          return (
            <div
              key={item.id}
              className="relative aspect-[3/4] border-3 sm:border-4 border-black bg-white shadow-neo group overflow-hidden flex flex-col"
            >
              <div className="relative w-full h-full">
                <Image
                  src={item.url}
                  alt={item.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>

              {/* Top Badge */}
              <div className="absolute top-1.5 left-1.5">
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 border border-black shadow-sm ${
                    isCover ? "bg-neo-yellow text-black" : "bg-neo-green text-black"
                  }`}
                >
                  {isCover ? "Cover (1)" : `Photo ${overallIndex + 1}`}
                </span>
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => removeNewFile(idx)}
                className="absolute top-1.5 right-1.5 w-6 h-6 bg-red-500 text-white border-2 border-black font-black flex items-center justify-center shadow-sm hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                title="Remove picture"
              >
                <X size={14} strokeWidth={3} />
              </button>

              {/* Bottom file info pill */}
              <div className="absolute bottom-1 inset-x-1 bg-black/80 text-white text-[9px] font-bold px-1.5 py-0.5 truncate text-center rounded">
                {item.size}
              </div>
            </div>
          );
        })}

        {/* 3. Add More Picture Button Card (if < maxImages) */}
        {canAddMore && (
          <div
            onClick={() => inputRef.current?.click()}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`aspect-[3/4] border-3 sm:border-4 border-dashed border-black bg-white/70 hover:bg-white flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all ${
              dragActive ? "border-solid bg-neo-yellow/40 scale-[1.02]" : "hover:shadow-neo"
            }`}
          >
            <div className="w-10 h-10 border-2 border-black bg-neo-yellow flex items-center justify-center mb-2 shadow-sm">
              <Plus size={20} className="text-black" strokeWidth={3} />
            </div>
            <span className="font-black text-xs text-black block">
              {totalImageCount === 0 ? "Add Cover Photo" : `Add Photo ${totalImageCount + 1}`}
            </span>
            <span className="text-[10px] font-bold text-gray-600 mt-0.5">
              Up to 4 images
            </span>
          </div>
        )}
      </div>

      {/* Quick Mobile Action Bar for Adding Photos */}
      {canAddMore && (
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex-1 border-2 border-black bg-white p-2.5 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm hover:bg-gray-50 active:translate-y-0.5 cursor-pointer"
          >
            <UploadCloud size={16} />
            <span>Upload Photos</span>
          </button>
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex-1 border-2 border-black bg-neo-yellow p-2.5 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm hover:bg-yellow-300 active:translate-y-0.5 cursor-pointer"
          >
            <Camera size={16} />
            <span>Snap with Camera</span>
          </button>
        </div>
      )}

      {/* Hidden Multi-file Input (Gallery / Files) */}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFilesAdded(e.target.files);
            e.target.value = ""; // Reset to allow re-selecting same files
          }
        }}
        className="hidden"
      />

      {/* Hidden Direct Camera Input for Mobile */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFilesAdded(e.target.files);
            e.target.value = "";
          }
        }}
        className="hidden"
      />

      {/* Optional Document Attachment indicator */}
      {allowDocument && onChangeDocumentFile && (
        <div className="pt-1">
          {documentFile ? (
            <div className="flex items-center justify-between border-2 border-black bg-white p-2.5 shadow-sm">
              <div className="flex items-center gap-2 truncate">
                <div className="p-1 border border-black bg-neo-yellow">
                  <FileText size={16} />
                </div>
                <div className="truncate">
                  <span className="text-xs font-black block truncate text-black">{documentFile.name}</span>
                  <span className="text-[10px] font-bold text-gray-600">
                    {(documentFile.size / (1024 * 1024)).toFixed(2)} MB PDF/Document
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onChangeDocumentFile(null)}
                className="text-xs font-black text-red-600 hover:text-red-800 border border-black px-2 py-0.5 bg-red-50 ml-2"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs font-bold text-gray-700 bg-white/60 border border-dashed border-black p-2">
              <span>Have a full PDF / Doc for notes or ebook?</span>
              <button
                type="button"
                onClick={() => docInputRef.current?.click()}
                className="border border-black bg-neo-yellow px-2 py-0.5 font-black text-black hover:bg-yellow-300 shadow-xs cursor-pointer"
              >
                + Attach Document
              </button>
              <input
                ref={docInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    onChangeDocumentFile(e.target.files[0]);
                    e.target.value = "";
                  }
                }}
                className="hidden"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
