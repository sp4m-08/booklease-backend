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

const noteSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  subject: z.string().min(2, "Subject is required"),
  slot: z.string().optional(),
  condition: z.string().min(2, "Condition is required"),
  price: z.string().optional(),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
  file: z.any().optional(),
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

export const VIT_SLOTS = [
  "A1", "A2", "B1", "B2", "C1", "C2", "D1", "D2", "E1", "E2", "F1", "F2", "G1", "G2"
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
  const { user, loading } = useAuth();
  const router = useRouter();
  const [selectedSlots, setSelectedSlots] = useState<string[]>(["A1"]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) return <div className="p-8 text-center font-bold">Loading...</div>;
  if (!user) {
    if (typeof window !== "undefined") router.push("/login");
    return null;
  }

  const onSubmit = async (data: NoteFormData) => {
    try {
      setIsSubmitting(true);
      let finalFileUrl = "";

      if (data.file && data.file[0]) {
        const file = data.file[0];
        
        if (file.size > 25 * 1024 * 1024) {
          toast.error("File size must be less than 25MB");
          setIsSubmitting(false);
          return;
        }

        finalFileUrl = await uploadFile(file, "notes");
      }

      const numPrice = data.price ? parseFloat(data.price) : 0;
      const formattedSlots = selectedSlots.length === VIT_INDIVIDUAL_SLOTS.length 
        ? "All Slots" 
        : selectedSlots.join(", ") || "All Slots";

      await api.post("/notes/", {
        title: data.title,
        subject: data.subject,
        slot: data.slot || "",
        condition: data.condition,
        price: isNaN(numPrice) ? 0 : numPrice,
        description: data.description,
        file_path: finalFileUrl,
        is_public: true,
      });

      toast.success("Note uploaded successfully!");
      router.push("/notes");

    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || err.message || "Failed to upload note.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full px-8 py-12 flex-grow">
      <div className="mb-8 border-b-4 border-black pb-4">
        <div className="inline-block border-2 border-black px-3 py-0.5 bg-neo-purple font-black text-xs uppercase mb-2 shadow-sm">
          ⚡ VIT Exam Revision Hub
        </div>
        <h1 className="font-serif text-5xl font-black mb-1">Share Exam Study Notes</h1>
        <p className="font-medium text-lg text-gray-700">Upload handwritten notes, module formula sheets, and solved CAT/FAT question banks for fellow VITians.</p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 border-4 border-black bg-neo-blue p-8 shadow-neo">
        
        <div className="space-y-2">
          <label className="font-bold text-xl block">Note Title *</label>
          <NeoInput 
            {...register("title")}
            placeholder="e.g. OS CAT-1 Module 1-3 Cheatsheet"
          />
          {errors.title && <span className="text-red-900 font-bold bg-white px-2 border-2 border-black inline-block mt-2 shadow-sm">{errors.title.message}</span>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="font-bold text-xl block">Note Title *</label>
            <NeoInput 
              {...register("title")}
              placeholder="e.g. OS CAT-1 Module 1-3 Cheatsheet"
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

        <div className="space-y-2">
          <label className="font-bold text-xl block">Topics Covered & Exam Details</label>
          <textarea 
            {...register("description")}
            rows={3}
            className="w-full border-4 border-black p-3 font-medium focus:outline-none focus:ring-4 focus:ring-black focus:shadow-neo-active transition-all"
            placeholder="e.g. Complete handwritten notes for C1 & C2 slot CAT exam covering Modules 1 to 4 with formulas."
          />
        </div>

        <div className="space-y-2">
          <label className="font-bold text-xl block">Upload Document / Notes *</label>
          <input 
            type="file"
            {...register("file")}
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,image/*"
            className="w-full border-4 border-black bg-white p-3 font-medium focus:outline-none focus:ring-4 focus:ring-black shadow-sm file:mr-4 file:py-2 file:px-4 file:border-2 file:border-black file:bg-neo-yellow file:font-black"
          />
          <p className="text-xs font-bold text-gray-800">Accepted formats: PDF, DOC, DOCX, TXT, PNG, JPG (Max 25MB)</p>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full border-4 border-black bg-neo-yellow px-6 py-4 font-bold text-xl shadow-neo hover:shadow-neo-hover active:shadow-neo-active transition-all disabled:opacity-50"
        >
          {isSubmitting ? "Uploading..." : "Share Study Material"}
        </button>

      </form>
    </div>
  );
}
