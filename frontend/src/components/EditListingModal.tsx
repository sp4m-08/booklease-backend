"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import api from "@/lib/api";
import { uploadFile, uploadMultipleFiles } from "@/lib/upload";
import { NeoButton } from "@/components/ui/NeoButton";
import { NeoInput } from "@/components/ui/NeoInput";
import { VIT_BRANCHES, BOOK_TYPES } from "@/lib/constants";
import { SlotSelector, VIT_INDIVIDUAL_SLOTS } from "@/components/SlotSelector";
import { MultiImageUploader } from "@/components/ui/MultiImageUploader";
import { X, Check, Edit3 } from "lucide-react";

interface EditListingModalProps {
  isOpen: boolean;
  type: "book" | "note";
  item: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditListingModal({ isOpen, type, item, onClose, onSuccess }: EditListingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [existingUrls, setExistingUrls] = useState<string[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>(["A1"]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      title: "",
      author: "",
      category: "CSE",
      bookType: "Original Textbook",
      subject: "CSE",
      price: "0",
      description: "",
      available: true,
    }
  });

  useEffect(() => {
    if (item && isOpen) {
      setValue("title", item.title || "");
      setValue("author", item.author || "");
      setValue("category", item.category || "CSE");
      setValue("bookType", item.type || "Original Textbook");
      setValue("subject", item.subject || "CSE");
      setValue("price", (item.price !== undefined && item.price !== null) ? String(item.price) : "0");
      setValue("description", item.description || "");
      setValue("available", item.available !== undefined ? item.available : true);
      setNewImageFiles([]);

      const rawUrl = type === "book" ? item.cover_image : item.file_path;
      if (rawUrl) {
        const parsed = rawUrl.split(",").map((u: string) => u.trim()).filter(Boolean);
        setExistingUrls(parsed);
      } else {
        setExistingUrls([]);
      }

      // Parse multi-slots from item.slot
      if (item.slot) {
        if (item.slot === "All Slots") {
          setSelectedSlots([...VIT_INDIVIDUAL_SLOTS]);
        } else {
          const parsed = item.slot.split(",").map((s: string) => s.trim()).filter(Boolean);
          setSelectedSlots(parsed.length > 0 ? parsed : ["A1"]);
        }
      } else {
        setSelectedSlots(["A1"]);
      }
    }
  }, [item, isOpen, setValue, type]);

  if (!isOpen || !item) return null;

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      const combinedUrls = [...existingUrls];

      if (newImageFiles.length > 0) {
        toast.info(`Uploading ${newImageFiles.length} new preview image(s)...`);
        const uploaded = await uploadMultipleFiles(newImageFiles, type === "book" ? "covers" : "notes");
        combinedUrls.push(...uploaded);
      }

      const finalFileUrl = combinedUrls.join(",");

      const numPrice = data.price ? parseFloat(data.price) : 0;
      const formattedSlots = selectedSlots.length === VIT_INDIVIDUAL_SLOTS.length 
        ? "All Slots" 
        : selectedSlots.join(", ") || "All Slots";

      if (type === "book") {
        await api.put(`/book/${item.id}`, {
          title: data.title,
          author: data.author,
          category: data.category,
          type: data.bookType || "Original Textbook",
          slot: formattedSlots,
          price: isNaN(numPrice) ? 0 : numPrice,
          description: data.description,
          available: Boolean(data.available),
          cover_image: finalFileUrl,
        });
        toast.success("Textbook listing updated successfully!");
      } else {
        await api.put(`/notes/${item.id}`, {
          title: data.title,
          subject: data.subject,
          slot: formattedSlots,
          price: isNaN(numPrice) ? 0 : numPrice,
          description: data.description,
          file_path: finalFileUrl,
          is_public: true,
        });
        toast.success("Study note updated successfully!");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || err.message || "Failed to update listing.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white border-t-4 sm:border-4 border-black p-4 sm:p-8 max-w-2xl w-full shadow-neo-lg space-y-5 rounded-t-2xl sm:rounded-none max-h-[85vh] sm:max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-4 border-black pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 border-2 border-black px-2.5 py-0.5 bg-neo-yellow font-black text-xs uppercase mb-1 shadow-sm">
              <Edit3 size={12} className="text-black" />
              <span>Edit {type === "book" ? "Textbook / Printout" : "Study Note"}</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-black">Edit Listing Information</h2>
          </div>
          <button 
            onClick={onClose}
            className="border-2 border-black p-1.5 font-black hover:bg-gray-200 shadow-sm transition-all"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          
          {/* Title */}
          <div className="space-y-1">
            <label className="font-bold text-base block">
              {type === "book" ? "Book / Printout Title *" : "Note Title *"}
            </label>
            <NeoInput 
              {...register("title", { required: "Title is required" })}
              placeholder={type === "book" ? "e.g. Digital Logic and Computer Design" : "e.g. OS CAT-2 Cheatsheet"}
            />
            {errors.title && <span className="text-red-700 font-bold text-xs">{errors.title.message as string}</span>}
          </div>

          {/* Book-Specific: Author, Branch & Format */}
          {type === "book" ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="font-bold text-base block">Author *</label>
                <NeoInput 
                  {...register("author", { required: "Author is required" })}
                  placeholder="e.g. M. Morris Mano"
                />
                {errors.author && <span className="text-red-700 font-bold text-xs">{errors.author.message as string}</span>}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-base block">Branch *</label>
                <select
                  {...register("category")}
                  className="w-full border-4 border-black p-3 font-bold bg-white focus:outline-none focus:ring-4 focus:ring-black shadow-sm"
                >
                  {VIT_BRANCHES.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-base block">Format / Type *</label>
                <select
                  {...register("bookType")}
                  className="w-full border-4 border-black p-3 font-bold bg-white focus:outline-none focus:ring-4 focus:ring-black shadow-sm"
                >
                  {BOOK_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="font-bold text-base block">Branch *</label>
              <select
                {...register("subject")}
                className="w-full border-4 border-black p-3 font-bold bg-white focus:outline-none focus:ring-4 focus:ring-black shadow-sm"
              >
                {VIT_BRANCHES.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
          )}

          {/* Multi-Slot Selector Component */}
          <SlotSelector 
            selectedSlots={selectedSlots}
            onChange={setSelectedSlots}
            label="Applicable Exam Slots"
          />

          {/* Pricing & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-base block">Price (₹)</label>
              <NeoInput 
                type="number"
                min="0"
                step="1"
                {...register("price")}
                placeholder="0 for Free"
              />
              <span className="text-xs font-bold text-gray-600">Enter 0 to list for free</span>
            </div>

            {type === "book" && (
              <div className="space-y-1">
                <label className="font-bold text-base block">Rental Availability</label>
                <select
                  {...register("available")}
                  className="w-full border-4 border-black p-3 font-bold bg-white focus:outline-none focus:ring-4 focus:ring-black shadow-sm"
                >
                  <option value="true">Available to Rent</option>
                  <option value="false">Currently Rented Out</option>
                </select>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="font-bold text-base block">
              {type === "book" ? "Condition & Handover Location" : "Topics Covered & Exam Info"}
            </label>
            <textarea 
              {...register("description")}
              rows={3}
              className="w-full border-4 border-black p-3 font-medium focus:outline-none focus:ring-4 focus:ring-black focus:shadow-neo transition-all"
              placeholder={type === "book" ? "e.g. Good condition with solved CAT problems. Available near SJT or TT." : "e.g. Handwritten notes covering Modules 1 to 4 with formulas."}
            />
          </div>

          {/* Multi-Image Preview Management (Up to 4 Pictures) */}
          <div className="bg-gray-50 border-3 border-black p-3.5 shadow-sm">
            <MultiImageUploader
              maxImages={4}
              files={newImageFiles}
              onChangeFiles={setNewImageFiles}
              existingUrls={existingUrls}
              onChangeExistingUrls={setExistingUrls}
              label={`Preview Pictures (${existingUrls.length + newImageFiles.length} / 4)`}
              description={`Add or remove preview photos for this ${type === "book" ? "book / printout" : "study note"}`}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="border-2 border-black px-5 py-2.5 font-bold hover:bg-gray-100 transition-all shadow-sm"
            >
              Cancel
            </button>
            <NeoButton
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="bg-neo-green text-black flex items-center gap-2"
            >
              <Check size={18} />
              {isSubmitting ? "Saving Changes..." : "Save Changes"}
            </NeoButton>
          </div>

        </form>

      </div>
    </div>
  );
}
