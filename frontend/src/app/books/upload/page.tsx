"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { uploadFile } from "@/lib/upload";
import { toast } from "sonner";
import { NeoInput } from "@/components/ui/NeoInput";
import { NeoSelect } from "@/components/ui/NeoSelect";
import { NeoMultiSelect } from "@/components/ui/NeoMultiSelect";
import { SlotSelector } from "@/components/SlotSelector";

const bookSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  author: z.string().min(2, "Author is required").max(100),
  category: z.string().min(2, "Category is required"),
  slot: z.string().optional(),
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
  const { register, handleSubmit, control, formState: { errors } } = useForm<BookFormData>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      price: "0",
      category: "CSE",
      condition: "Good",
    }
  });
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedSlots, setSelectedSlots] = useState<string[]>(["A1"]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) return <div className="p-8 text-center font-bold">Loading...</div>;
  if (!user) {
    if (typeof window !== "undefined") router.push("/login");
    return null;
  }

  const onSubmit = async (data: BookFormData) => {
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
      const formattedSlots = selectedSlots.length === 12
        ? "All Slots" 
        : selectedSlots.join(", ") || "All Slots";

      await api.post("/book/", {
        title: data.title,
        author: data.author,
        category: data.category,
        slot: data.slot || "",
        condition: data.condition,
        price: isNaN(numPrice) ? 0 : numPrice,
        description: data.description,
        cover_image: finalFileUrl,
        available: true,
      });

      toast.success("Textbook uploaded successfully!");
      router.push("/books");

    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || err.message || "Failed to upload book.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-8 py-12 flex-grow">
      <div className="mb-8 border-b-4 border-black pb-4">
        <div className="inline-block border-2 border-black px-3 py-0.5 bg-neo-yellow font-black text-xs uppercase mb-2 shadow-sm">
          🎓 VIT Vellore Campus
        </div>
        <h1 className="font-serif text-5xl font-black mb-1">List a Textbook for Rent</h1>
        <p className="font-medium text-lg text-gray-700">Help fellow VITians ace their CAT & FAT exams by listing your course reference books.</p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 border-4 border-black bg-neo-purple p-8 shadow-neo">
        
        {/* Book Title */}
        <div className="space-y-2">
          <label className="font-bold text-xl block">Book Title / Course *</label>
          <NeoInput 
            {...register("title")}
            placeholder="e.g. Digital Design (DSD) or Introduction to Algorithms"
          />
          {errors.title && <span className="text-red-900 font-bold bg-white px-2 border-2 border-black inline-block mt-2 shadow-sm">{errors.title.message}</span>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="font-bold text-lg block">Author *</label>
            <NeoInput 
              {...register("author")}
              placeholder="e.g. Morris Mano"
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="font-bold text-xl block">Slot (Optional)</label>
            <Controller
              name="slot"
              control={control}
              render={({ field }) => (
                <NeoMultiSelect
                  value={field.value ? field.value.split(',').map(s => s.trim()).filter(Boolean) : []}
                  onChange={(arr) => field.onChange(arr.join(', '))}
                  options={VIT_SLOTS.map(s => ({ label: s, value: s }))}
                  placeholder="Select Slots (Multiple)"
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
          {isSubmitting ? "Uploading Book..." : "List Textbook for Rent"}
        </button>

      </form>
    </div>
  );
}
