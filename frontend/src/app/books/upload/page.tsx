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

const bookSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  author: z.string().min(2, "Author is required").max(100),
  category: z.string().min(2, "Category is required"),
  price: z.string().optional(),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
  file: z.any().optional(), // File list
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

export default function BookUploadPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<BookFormData>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      price: "0",
      category: "CSE",
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

  const onSubmit = async (data: BookFormData) => {
    try {
      setIsSubmitting(true);
      let finalFileUrl = "";

      // 1. If there's a file, upload it (tries S3 first, fallback to server upload)
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

      // 2. Submit the book metadata to our backend
      await api.post("/book/", {
        title: data.title,
        author: data.author,
        category: data.category,
        price: isNaN(numPrice) ? 0 : numPrice,
        description: data.description,
        cover_image: finalFileUrl, // Store the uploaded URL
        available: true,
      });

      toast.success("Book uploaded successfully!");
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
        
        <div className="space-y-2">
          <label className="font-bold text-xl block">Book Title / Course *</label>
          <NeoInput 
            {...register("title")}
            placeholder="e.g. Digital Design (DSD) or Introduction to Algorithms"
          />
          {errors.title && <span className="text-red-900 font-bold bg-white px-2 border-2 border-black inline-block mt-2 shadow-sm">{errors.title.message}</span>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="font-bold text-xl block">Author *</label>
            <NeoInput 
              {...register("author")}
              placeholder="e.g. Morris Mano / Cormen"
            />
            {errors.author && <span className="text-red-900 font-bold bg-white px-2 border-2 border-black inline-block mt-2 shadow-sm">{errors.author.message}</span>}
          </div>
          <div className="space-y-2">
            <label className="font-bold text-xl block">Branch *</label>
            <select
              {...register("category")}
              className="w-full border-4 border-black p-3 font-bold bg-white focus:outline-none focus:ring-4 focus:ring-black shadow-sm"
            >
              {VIT_BRANCHES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            {errors.category && <span className="text-red-900 font-bold bg-white px-2 border-2 border-black inline-block mt-2 shadow-sm">{errors.category.message}</span>}
          </div>
          <div className="space-y-2">
            <label className="font-bold text-xl block">Rental Price (₹)</label>
            <NeoInput 
              type="number"
              min="0"
              step="1"
              {...register("price")}
              placeholder="0 for Free"
            />
            <span className="text-xs font-bold text-gray-800">Enter 0 for Free rental</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="font-bold text-xl block">Condition & Handover Details</label>
          <textarea 
            {...register("description")}
            rows={4}
            className="w-full border-4 border-black p-3 font-medium focus:outline-none focus:ring-4 focus:ring-black focus:shadow-neo-active transition-all"
            placeholder="e.g. Good condition with solved CAT problems. Available for handover near SJT, Central Library, or Mens Hostel Block."
          />
          {errors.description && <span className="text-red-900 font-bold bg-white px-2 border-2 border-black inline-block mt-2 shadow-sm">{errors.description.message}</span>}
        </div>

        <div className="space-y-2">
          <label className="font-bold text-xl block">Book Cover / Document (Word, PDF, JPG, PNG - Optional)</label>
          <input 
            type="file"
            {...register("file")}
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,image/*"
            className="w-full border-4 border-black bg-white p-3 font-medium focus:outline-none focus:ring-4 focus:ring-black"
          />
          <p className="text-xs font-bold text-gray-800 mt-1">Accepts Word (.doc/.docx), PDF, JPG, PNG (Max size: 15MB)</p>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full border-4 border-black bg-neo-yellow px-6 py-4 font-bold text-xl shadow-neo hover:shadow-neo-hover active:shadow-neo-active transition-all mt-8 disabled:opacity-50"
        >
          {isSubmitting ? "Uploading..." : "List Book for Rent"}
        </button>

      </form>
    </div>
  );
}
