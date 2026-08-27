"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import api from "@/lib/api";
import { uploadFile } from "@/lib/upload";
import { NeoButton } from "@/components/ui/NeoButton";
import { NeoInput } from "@/components/ui/NeoInput";
import { VIT_BRANCHES, VIT_SLOTS } from "@/lib/constants";
import { SlotSelector, VIT_INDIVIDUAL_SLOTS } from "@/components/SlotSelector";
import { X, UploadCloud, Check, Edit3 } from "lucide-react";

interface EditListingModalProps {
  isOpen: boolean;
  type: "book" | "note";
  item: any;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditListingModal({ isOpen, type, item, onClose, onSuccess }: EditListingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<string[]>(["A1"]);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      title: "",
      author: "",
      category: "CSE",
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
      setValue("subject", item.subject || "CSE");
      setValue("price", (item.price !== undefined && item.price !== null) ? String(item.price) : "0");
      setValue("description", item.description || "");
      setValue("available", item.available !== undefined ? item.available : true);
      setSelectedFile(null);

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
  }, [item, isOpen, setValue]);

  if (!isOpen || !item) return null;

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      let newFileUrl = type === "book" ? item.cover_image : item.file_path;

      if (selectedFile) {
        toast.info("Uploading replacement file...");
        newFileUrl = await uploadFile(selectedFile, type === "book" ? "covers" : "notes");
      }

      const numPrice = data.price ? parseFloat(data.price) : 0;
      const formattedSlots = selectedSlots.length === VIT_INDIVIDUAL_SLOTS.length 
        ? "All Slots" 
        : selectedSlots.join(", ") || "All Slots";

      if (type === "book") {
        await api.put(`/book/${item.id}`, {
          title: data.title,
          author: data.author,
          category: data.category,
          slot: formattedSlots,
          price: isNaN(numPrice) ? 0 : numPrice,
          description: data.description,
          available: Boolean(data.available),
          cover_image: newFileUrl,
        });
        toast.success("Textbook listing updated successfully!");
      } else {
        await api.put(`/notes/${item.id}`, {
          title: data.title,
          subject: data.subject,
          slot: formattedSlots,
          price: isNaN(numPrice) ? 0 : numPrice,
          description: data.description,
          file_path: newFileUrl,
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border-4 border-black p-6 sm:p-8 max-w-2xl w-full shadow-neo-lg space-y-6 my-8 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-4 border-black pb-4">
          <div>
            <div className="inline-block border-2 border-black px-2.5 py-0.5 bg-neo-yellow font-black text-xs uppercase mb-1 shadow-sm">
              ✏️ Edit {type === "book" ? "Textbook Listing" : "Study Note"}
            </div>
            <h2 className="font-serif text-3xl font-black">Edit Listing Information</h2>
          </div>
          <button 
            onClick={onClose}
            className="border-2 border-black p-1.5 font-black hover:bg-gray-200 shadow-sm transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          
          {/* Title */}
          <div className="space-y-1">
            <label className="font-bold text-base block">
              {type === "book" ? "Book Title *" : "Note Title *"}
            </label>
            <NeoInput 
              {...register("title", { required: "Title is required" })}
              placeholder={type === "book" ? "e.g. Digital Logic and Computer Design" : "e.g. OS CAT-1 Cheatsheet"}
            />
            {errors.title && <span className="text-red-700 font-bold text-xs">{errors.title.message as string}</span>}
          </div>

          {/* Book-Specific: Author & Branch */}
          {type === "book" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <option value="true">🟢 Available to Rent</option>
                  <option value="false">🔴 Currently Rented Out</option>
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

          {/* Replace Uploaded File / Cover (Optional) */}
          <div className="space-y-1 bg-gray-50 border-2 border-black p-3">
            <label className="font-bold text-sm block mb-1">
              Replace {type === "book" ? "Cover Image / Document" : "Study Notes File"} (Optional)
            </label>
            <input 
              type="file"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
              accept={type === "book" ? ".pdf,.doc,.docx,.png,.jpg,.jpeg,image/*" : ".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,image/*"}
              className="w-full text-xs font-bold file:mr-3 file:py-1 file:px-3 file:border-2 file:border-black file:bg-neo-yellow file:font-black"
            />
            {selectedFile && (
              <p className="text-xs font-bold text-green-700 mt-1">
                ✓ New file selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
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
