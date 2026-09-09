"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { uploadFile } from "@/lib/upload";
import { toast } from "sonner";
import { NeoInput } from "@/components/ui/NeoInput";
import { NeoSelect } from "@/components/ui/NeoSelect";
import { NeoMultiSelect } from "@/components/ui/NeoMultiSelect";
import { NeoButton } from "@/components/ui/NeoButton";
import { SlotSelector, VIT_INDIVIDUAL_SLOTS } from "@/components/SlotSelector";
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
  file: z.any().optional(),
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
      let finalFileUrl = "";

      if (data.file && data.file[0]) {
        const file = data.file[0];
        if (file.size > 15 * 1024 * 1024) {
          toast.error("File size must be less than 15MB");
          setIsSubmitting(false);
          return;
        }

        finalFileUrl = await uploadFile(file, "covers");
      }

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
        cover_image: finalFileUrl,
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
    <div className="max-w-3xl mx-auto w-full px-8 py-12 flex-grow">
      <div className="mb-8 border-b-4 border-black pb-4">
        <div className="inline-flex items-center gap-1.5 border-2 border-black px-3 py-0.5 bg-neo-yellow font-black text-xs uppercase mb-2 shadow-sm">
          <GraduationCap size={13} className="text-black" />
          <span>VIT Vellore Campus</span>
        </div>
        <h1 className="font-serif text-5xl font-black mb-1">List a Book or Printout</h1>
        <p className="font-medium text-lg text-gray-700">List course textbooks, spiral-bound ebook printouts, or module xerox copies for fellow VITians.</p>
      </div>

      {!hasPhone && (
        <div className="mb-8 border-4 border-black bg-neo-yellow p-6 shadow-neo animate-in fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 border-2 border-black bg-white shadow-sm shrink-0 mt-0.5">
                <AlertTriangle className="h-6 w-6 text-black" />
              </div>
              <div>
                <h3 className="font-black text-xl flex items-center gap-2 text-black">
                  Phone Number Required
                </h3>
                <p className="text-sm font-medium text-gray-800">
                  You need to save your WhatsApp phone number in your profile so students can coordinate campus handovers with you.
                </p>
              </div>
            </div>
            <NeoButton
              type="button"
              variant="primary"
              className="whitespace-nowrap shrink-0 flex items-center gap-2 bg-white text-black hover:bg-black hover:text-white"
              onClick={() => router.push("/profile")}
            >
              <PhoneCall className="h-4 w-4" />
              Add Phone in Profile
              <ArrowRight className="h-4 w-4 ml-1" />
            </NeoButton>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 border-4 border-black bg-neo-purple p-8 shadow-neo">

        {/* Book Title */}
        <div className="space-y-2">
          <label className="font-bold text-xl block">Title / Subject Course *</label>
          <NeoInput
            {...register("title")}
            placeholder="e.g. Introduction to Algorithms (CLRS) or DSD Module Xerox"
          />
          {errors.title && <span className="text-red-900 font-bold bg-white px-2 border-2 border-black inline-block mt-2 shadow-sm">{errors.title.message}</span>}
        </div>

        {/* Author / Source & Branch */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="font-bold text-lg block">Author / Source *</label>
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

        {/* File / Cover Upload */}
        <div className="space-y-2">
          <label className="font-bold text-xl block">Book Cover / Document (Word, PDF, JPG, PNG - Optional)</label>
          <input
            type="file"
            {...register("file")}
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,image/*"
            className="w-full border-4 border-black bg-white p-3 font-medium focus:outline-none focus:ring-4 focus:ring-black shadow-sm file:mr-4 file:py-2 file:px-4 file:border-2 file:border-black file:bg-neo-yellow file:font-black"
          />
          <p className="text-xs font-bold text-gray-800">Supports image covers, lecture slides, and PDF/Word book previews.</p>
        </div>

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
