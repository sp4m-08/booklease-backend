"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { uploadFile, uploadMultipleFiles } from "@/lib/upload";
import { toast } from "sonner";
import { NeoInput } from "@/components/ui/NeoInput";
import { NeoSelect } from "@/components/ui/NeoSelect";
import { NeoButton } from "@/components/ui/NeoButton";
import { SlotSelector, VIT_INDIVIDUAL_SLOTS } from "@/components/SlotSelector";
import { MultiImageUploader } from "@/components/ui/MultiImageUploader";
import { AlertTriangle, PhoneCall, ArrowRight, Sparkles } from "lucide-react";

const noteSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  subject: z.string().min(2, "Subject is required"),
  condition: z.string().min(2, "Condition is required"),
  price: z.string().optional(),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
});

type NoteFormData = z.infer<typeof noteSchema>;

export const VIT_BRANCHES = [
  "CSE",
  "ECE",
  "EEE",
  "Mechanical",
  "Biotech",
  "Civil",
  "Common",
] as const;

export const BOOK_CONDITIONS = [
  "Brand New",
  "Like New",
  "Good",
  "Highlighted / Notated",
  "Acceptable (Torn Pages)",
] as const;

export default function NoteUploadPage() {
  const { register, handleSubmit, control, formState: { errors } } = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      price: "0",
      subject: "CSE",
      condition: "Good",
    }
  });
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedSlots, setSelectedSlots] = useState<string[]>(["A1"]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) return <div className="p-8 text-center font-bold">Loading...</div>;
  if (!user) {
    if (typeof window !== "undefined") router.push("/login");
    return null;
  }

  const hasPhone = Boolean(userProfile?.phone_number && userProfile.phone_number.trim() !== "");

  const onSubmit = async (data: NoteFormData) => {
    if (!hasPhone) {
      toast.error("Please add your phone number in your profile before uploading notes.");
      router.push("/profile");
      return;
    }

    if (imageFiles.length === 0 && !documentFile) {
      toast.error("Please upload at least 1 preview picture or attach a document for your notes.");
      return;
    }

    try {
      setIsSubmitting(true);
      const uploadedUrls: string[] = [];

      // 1. Upload preview images (1 to 4 photos)
      if (imageFiles.length > 0) {
        toast.info(`Uploading ${imageFiles.length} preview picture(s)...`);
        const imgUrls = await uploadMultipleFiles(imageFiles, "notes");
        uploadedUrls.push(...imgUrls);
      }

      // 2. Upload full document if provided
      if (documentFile) {
        toast.info(`Uploading document ${documentFile.name}...`);
        const docUrl = await uploadFile(documentFile, "notes");
        if (uploadedUrls.length === 0) {
          uploadedUrls.push(docUrl);
        }
      }

      const finalFilePath = uploadedUrls.join(",");

      const numPrice = data.price ? parseFloat(data.price) : 0;
      const formattedSlots = selectedSlots.length === VIT_INDIVIDUAL_SLOTS.length 
        ? "All Slots" 
        : selectedSlots.join(", ") || "All Slots";

      await api.post("/notes/", {
        title: data.title,
        subject: data.subject,
        slot: formattedSlots,
        condition: data.condition,
        price: isNaN(numPrice) ? 0 : numPrice,
        description: data.description,
        file_path: finalFilePath,
        is_public: true,
      });

      await queryClient.invalidateQueries({ queryKey: ["notes"] });
      await queryClient.invalidateQueries({ queryKey: ["mynotes"] });

      toast.success("Note uploaded successfully!");
      router.push("/notes");
      router.refresh();

    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || err.message || "Failed to upload note.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-12 flex-grow">
      <div className="mb-6 sm:mb-8 border-b-4 border-black pb-3 sm:pb-4">
        <div className="inline-flex items-center gap-1.5 border-2 border-black px-2.5 sm:px-3 py-0.5 bg-neo-purple font-black text-xs uppercase mb-2 shadow-sm">
          <Sparkles size={13} className="text-black" />
          <span>VIT Exam Revision Hub</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-black mb-1">Share Exam Study Notes</h1>
        <p className="font-medium text-sm sm:text-lg text-gray-700">Upload handwritten notes, module formula sheets, and solved CAT/FAT question banks for fellow VITians.</p>
      </div>
      
      {!hasPhone && (
        <div className="mb-6 sm:mb-8 border-3 sm:border-4 border-black bg-neo-yellow p-4 sm:p-6 shadow-neo animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-start gap-3">
              <div className="p-1.5 sm:p-2 border-2 border-black bg-white shadow-sm shrink-0 mt-0.5">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-black" />
              </div>
              <div>
                <h3 className="font-black text-lg sm:text-xl flex items-center gap-2 text-black">
                  Phone Number Required
                </h3>
                <p className="font-medium text-xs sm:text-sm mt-1 text-black/90">
                  You must add your mobile number in your profile before sharing notes so students can reach you directly for study queries and revisions.
                </p>
              </div>
            </div>
            <NeoButton
              type="button"
              variant="primary"
              className="w-full sm:w-auto whitespace-nowrap shrink-0 flex items-center justify-center gap-2 bg-white text-black hover:bg-black hover:text-white text-xs sm:text-sm py-2 sm:py-2.5"
              onClick={() => router.push("/profile")}
            >
              <PhoneCall className="h-4 w-4" />
              Add Phone in Profile
              <ArrowRight className="h-4 w-4 ml-1" />
            </NeoButton>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6 border-3 sm:border-4 border-black bg-neo-blue p-4 sm:p-8 shadow-neo">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-1.5 sm:space-y-2">
            <label className="font-bold text-base sm:text-xl block">Note Title *</label>
            <NeoInput 
              {...register("title")}
              placeholder="e.g. OS CAT-2 Module 1-3 Cheatsheet"
            />
            {errors.title && <span className="text-red-900 font-bold bg-white px-2 border-2 border-black inline-block mt-2 shadow-sm">{errors.title.message}</span>}
          </div>
          <div className="space-y-2">
            <label className="font-bold text-xl block">Branch *</label>
            <Controller
              name="subject"
              control={control}
              render={({ field }) => (
                <NeoSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={VIT_BRANCHES.map(b => ({ label: b, value: b }))}
                />
              )}
            />
            {errors.subject && <span className="text-red-900 font-bold bg-white px-2 border-2 border-black inline-block mt-2 shadow-sm">{errors.subject.message}</span>}
          </div>
        </div>

        {/* Condition & Price */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-1.5 sm:space-y-2">
            <label className="font-bold text-base sm:text-xl block">Condition *</label>
            <Controller
              name="condition"
              control={control}
              render={({ field }) => (
                <NeoSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={BOOK_CONDITIONS.map(c => ({ label: c, value: c }))}
                />
              )}
            />
            {errors.condition && <span className="text-red-900 font-bold bg-white px-2 border-2 border-black inline-block mt-2 shadow-sm">{errors.condition.message}</span>}
          </div>
          <div className="space-y-1.5 sm:space-y-2">
            <label className="font-bold text-base sm:text-lg block">Price (₹)</label>
            <NeoInput 
              type="number"
              min="0"
              step="1"
              {...register("price")}
              placeholder="0 for Free"
            />
          </div>
        </div>

        {/* Multi-Slot Selector */}
        <SlotSelector 
          selectedSlots={selectedSlots}
          onChange={setSelectedSlots}
          label="Select Applicable VIT Exam Slots"
        />

        <div className="space-y-2">
          <label className="font-bold text-xl block">Topics Covered & Exam Details</label>
          <textarea 
            {...register("description")}
            rows={3}
            className="w-full border-4 border-black p-3 font-medium focus:outline-none focus:ring-4 focus:ring-black focus:shadow-neo-active transition-all"
            placeholder="e.g. Complete handwritten notes for C1 & C2 slot CAT exam covering Modules 1 to 4 with formulas."
          />
        </div>

        {/* Multi-Image Preview Uploader (1 to 4 pictures) & Document */}
        <MultiImageUploader
          maxImages={4}
          files={imageFiles}
          onChangeFiles={setImageFiles}
          documentFile={documentFile}
          onChangeDocumentFile={setDocumentFile}
          allowDocument={true}
          label="Preview Pictures & Notes Material (Up to 4 Photos)"
          description="Upload 1 to 4 photo previews of your handwritten notes/formulas, or attach a full PDF/Doc file"
        />

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full border-4 border-black bg-neo-yellow px-6 py-4 font-bold text-xl shadow-neo hover:shadow-neo-hover active:shadow-neo-active transition-all disabled:opacity-50"
        >
          {isSubmitting
            ? "Uploading..."
            : !hasPhone
            ? "⚠️ Add Phone in Profile to Share Notes"
            : "Share Study Material"}
        </button>

      </form>
    </div>
  );
}
