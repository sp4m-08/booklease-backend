"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { uploadFile } from "@/lib/upload";
import { toast } from "sonner";
import { NeoInput } from "@/components/ui/NeoInput";

const noteSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  subject: z.string().min(2, "Subject is required"),
  price: z.string().optional(),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
  file: z.any()
    .refine((files) => files?.length === 1, "Please select a document or image file (PDF, Word, JPG, PNG)."),
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

export default function NoteUploadPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      price: "0",
      subject: "CSE",
    }
  });
  const { user, loading } = useAuth();
  const router = useRouter();
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

      await api.post("/notes/", {
        title: data.title,
        subject: data.subject,
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <select
              {...register("subject")}
              className="w-full border-4 border-black p-3 font-bold bg-white focus:outline-none focus:ring-4 focus:ring-black shadow-sm"
            >
              {VIT_BRANCHES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            {errors.subject && <span className="text-red-900 font-bold bg-white px-2 border-2 border-black inline-block mt-2 shadow-sm">{errors.subject.message}</span>}
          </div>
          <div className="space-y-2">
            <label className="font-bold text-xl block">Price (₹)</label>
            <NeoInput 
              type="number"
              min="0"
              step="1"
              {...register("price")}
              placeholder="0 for Free"
            />
            <span className="text-xs font-bold text-gray-800">Enter 0 to share for free</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="font-bold text-xl block">Topics Covered & Exam Details</label>
          <textarea 
            {...register("description")}
            rows={4}
            className="w-full border-4 border-black p-3 font-medium focus:outline-none focus:ring-4 focus:ring-black focus:shadow-neo-active transition-all"
            placeholder="e.g. Complete handwritten notes for Modules 1 to 4 with CPU scheduling, deadlocks, and solved past CAT-1 & CAT-2 papers."
          />
          {errors.description && <span className="text-red-900 font-bold bg-white px-2 border-2 border-black inline-block mt-2 shadow-sm">{errors.description.message}</span>}
        </div>

        <div className="space-y-2">
          <label className="font-bold text-xl block">Upload Document / Notes *</label>
          <input 
            type="file"
            {...register("file")}
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,image/*"
            className="w-full border-4 border-black bg-white p-3 font-medium focus:outline-none focus:ring-4 focus:ring-black"
          />
          {errors.file && <span className="text-red-900 font-bold bg-white px-2 border-2 border-black inline-block mt-2 shadow-sm">{errors.file.message as string}</span>}
          <p className="text-xs font-bold text-gray-800 mt-1">Accepts Word (.doc/.docx), PDF, Images, Text (Max size: 25MB)</p>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full border-4 border-black bg-neo-yellow px-6 py-4 font-bold text-xl shadow-neo hover:shadow-neo-hover active:shadow-neo-active transition-all mt-8 disabled:opacity-50"
        >
          {isSubmitting ? "Uploading..." : "Share Note"}
        </button>

      </form>
    </div>
  );
}
