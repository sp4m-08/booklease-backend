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
import { NeoMultiSelect } from "@/components/ui/NeoMultiSelect";
import { NeoButton } from "@/components/ui/NeoButton";
import { SlotSelector, VIT_INDIVIDUAL_SLOTS } from "@/components/SlotSelector";
import { MultiImageUploader } from "@/components/ui/MultiImageUploader";
import { AlertTriangle, PhoneCall, ArrowRight, GraduationCap } from "lucide-react";

const bookSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  author: z.string().min(2, "Author is required").max(100),
  category: z.string().min(2, "Category is required"),
  slot: z.string().optional(),
  type: z.string().min(1, "Type is required"),
  condition: z.string().min(2, "Condition is required"),
  price: z.string().optional(),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
});

type BookFormData = z.infer<typeof bookSchema>;

export const VIT_BRANCHES = [
  "CSE",
  "ECE",
  "EEE",
  "Mechanical",
  "Biotech",
  "Civil",
  "Common",
] as const;

export const BOOK_TYPES = [
  "Original Textbook",
  "Spiral-Bound Printout",
  "Xerox / Printed Booklet",
  "Loose Module Printout",
] as const;

export const BOOK_CONDITIONS = [
  "Brand New",
  "Like New",
  "Good",
  "Highlighted / Notated",
  "Acceptable (Torn Pages)",
] as const;

export const VIT_SLOTS = [
  "A1", "A2", "B1", "B2", "C1", "C2", "D1", "D2", "E1", "E2", "F1", "F2", "G1", "G2"
] as const;

export default function BookUploadPage() {
  const { register, handleSubmit, control, watch, formState: { errors } } = useForm<BookFormData>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      price: "0",
      category: "CSE",
      type: "Original Textbook",
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

  const onSubmit = async (data: BookFormData) => {
    if (!hasPhone) {
      toast.error("Please add your phone number in your profile before uploading books.");
      router.push("/profile");
      return;
    }

    try {
      setIsSubmitting(true);
      const uploadedUrls: string[] = [];

      // 1. Upload all preview images (1 to 4 images)
      if (imageFiles.length > 0) {
        toast.info(`Uploading ${imageFiles.length} preview picture(s)...`);
        const imgUrls = await uploadMultipleFiles(imageFiles, "covers");
        uploadedUrls.push(...imgUrls);
      }

      // 2. Upload optional PDF/Doc if attached
      if (documentFile) {
        toast.info(`Uploading document: ${documentFile.name}...`);
        const docUrl = await uploadFile(documentFile, "covers");
        if (uploadedUrls.length === 0) {
          uploadedUrls.push(docUrl);
        }
      }

      const finalCoverImage = uploadedUrls.join(",");

      const numPrice = data.price ? parseFloat(data.price) : 0;
      const formattedSlots = selectedSlots.length === VIT_INDIVIDUAL_SLOTS.length
        ? "All Slots"
        : selectedSlots.join(", ") || "All Slots";

      await api.post("/book/", {
        title: data.title,
        author: data.author,
        category: data.category,
        slot: formattedSlots,
        type: data.type || "Original Textbook",
        condition: data.condition,
        price: isNaN(numPrice) ? 0 : numPrice,
        description: data.description,
        cover_image: finalCoverImage,
        available: true,
      });

      await queryClient.invalidateQueries({ queryKey: ["books"] });
      await queryClient.invalidateQueries({ queryKey: ["mybooks"] });

      toast.success("Textbook or printout listed successfully!");
      router.push("/books");
      router.refresh();

    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || err.message || "Failed to upload book.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType = watch("type");

  return (
    <div className="max-w-3xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-12 flex-grow">
      <div className="mb-6 sm:mb-8 border-b-4 border-black pb-3 sm:pb-4">
        <div className="inline-flex items-center gap-1.5 border-2 border-black px-2.5 sm:px-3 py-0.5 bg-neo-yellow font-black text-xs uppercase mb-2 shadow-sm">
          <GraduationCap size={13} className="text-black" />
          <span>VIT Vellore Campus</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-5xl font-black mb-1">List a Book or Printout</h1>
        <p className="font-medium text-sm sm:text-lg text-gray-700">List course textbooks, spiral-bound ebook printouts, or module xerox copies for fellow VITians.</p>
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
                <p className="text-xs sm:text-sm font-medium text-gray-800">
                  You need to save your WhatsApp phone number in your profile so students can coordinate campus handovers with you.
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

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6 border-3 sm:border-4 border-black bg-neo-purple p-4 sm:p-8 shadow-neo">

        {/* Book Title */}
        <div className="space-y-1.5 sm:space-y-2">
          <label className="font-bold text-base sm:text-xl block">Title / Subject Course *</label>
          <NeoInput
            {...register("title")}
            placeholder="e.g. Introduction to Algorithms (CLRS) or DSD Module Xerox"
          />
          {errors.title && <span className="text-red-900 font-bold bg-white px-2 border-2 border-black inline-block mt-1 sm:mt-2 shadow-sm text-xs sm:text-sm">{errors.title.message}</span>}
        </div>

        {/* Author / Source & Branch */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-1.5 sm:space-y-2">
            <label className="font-bold text-base sm:text-lg block">Author / Source *</label>
            <NeoInput
              {...register("author")}
              placeholder="e.g. Cormen / Ebook Printout / SJT Xerox"
            />
            {errors.author && <span className="text-red-900 font-bold bg-white px-2 border-2 border-black inline-block mt-2 shadow-sm">{errors.author.message}</span>}
          </div>

          <div className="space-y-2">
            <label className="font-bold text-xl block">Branch *</label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <NeoSelect
                  value={field.value}
                  onChange={field.onChange}
                  options={VIT_BRANCHES.map(b => ({ label: b, value: b }))}
                />
              )}
            />
            {errors.category && <span className="text-red-900 font-bold bg-white px-2 border-2 border-black inline-block mt-2 shadow-sm">{errors.category.message}</span>}
          </div>
        </div>

        {/* Format / Type & Condition & Price */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="font-bold text-xl block">Format / Type *</label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <NeoSelect
                  value={field.value || "Original Textbook"}
                  onChange={field.onChange}
                  options={BOOK_TYPES.map(t => ({ label: t, value: t }))}
                />
              )}
            />
          </div>

          <div className="space-y-2">
            <label className="font-bold text-xl block">Condition *</label>
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

          <div className="space-y-2">
            <label className="font-bold text-lg block">Price (₹)</label>
            <NeoInput
              type="number"
              min="0"
              step="1"
              {...register("price")}
              placeholder="0 for Free"
            />
          </div>
        </div>

        {selectedType && selectedType.includes("Printout") && (
          <div className="bg-neo-yellow border-2 border-black p-3 font-bold text-xs text-black shadow-sm flex items-center gap-2">
            <span>💡</span>
            <span>Awesome! Listing your spiral/ebook printouts saves paper and helps juniors skip costly xerox shop queues!</span>
          </div>
        )}

        {/* Multi-Slot Selector */}
        <SlotSelector
          selectedSlots={selectedSlots}
          onChange={setSelectedSlots}
          label="Select Applicable VIT Exam Slots"
        />

        {/* Handover Description */}
        <div className="space-y-2">
          <label className="font-bold text-xl block">Condition & Handover Details</label>
          <textarea
            {...register("description")}
            rows={3}
            className="w-full border-4 border-black p-3 font-medium focus:outline-none focus:ring-4 focus:ring-black focus:shadow-neo-active transition-all"
            placeholder="e.g. Available for C1 and C2 slot CAT exams. Can handover near SJT or TT."
          />
        </div>

        {/* Multi-Image Preview Uploader (1 to 4 pictures) */}
        <MultiImageUploader
          maxImages={4}
          files={imageFiles}
          onChangeFiles={setImageFiles}
          documentFile={documentFile}
          onChangeDocumentFile={setDocumentFile}
          allowDocument={true}
          label="Preview Pictures (Upload Up to 4 Photos)"
          description="Add up to 4 preview photos (e.g. Front Cover, Table of Contents, Inside Pages, Condition) or attach an ebook document"
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full border-4 border-black bg-neo-yellow px-6 py-4 font-bold text-xl shadow-neo hover:shadow-neo-hover active:shadow-neo-active transition-all disabled:opacity-50"
        >
          {isSubmitting
            ? "Uploading Book..."
            : !hasPhone
            ? "⚠️ Add Phone in Profile to List Book"
            : "List Textbook for Rent"}
        </button>

      </form>
    </div>
  );
}
