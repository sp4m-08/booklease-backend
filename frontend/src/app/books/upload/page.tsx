"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import axios from "axios";
import { toast } from "sonner";
import { NeoButton } from "@/components/ui/NeoButton";
import { NeoInput } from "@/components/ui/NeoInput";

const bookSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  author: z.string().min(2, "Author is required").max(100),
  category: z.string().min(2, "Category is required"),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
  file: z.any().optional(), // File list
});

type BookFormData = z.infer<typeof bookSchema>;

export default function BookUploadPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<BookFormData>({
    resolver: zodResolver(bookSchema),
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

      // 1. If there's a file, get presigned URL and upload to S3 directly
      if (data.file && data.file[0]) {
        const file = data.file[0];
        if (file.size > 5 * 1024 * 1024) {
          toast.error("File size must be less than 5MB");
          setIsSubmitting(false);
          return;
        }
        
        // Request presigned URL from our backend
        const presignedRes = await api.post("/api/upload/presigned-url", {
          file_name: file.name,
          content_type: file.type,
          folder: "covers",
        });
        
        const { upload_url } = presignedRes.data;

        // PUT request directly to S3
        await axios.put(upload_url, file, {
          headers: { "Content-Type": file.type },
        });

        // The final URL is usually the presigned URL without the query parameters
        finalFileUrl = upload_url.split("?")[0]; 
      }

      // 2. Submit the book metadata to our backend
      await api.post("/book/", {
        title: data.title,
        author: data.author,
        category: data.category,
        description: data.description,
        cover_image: finalFileUrl, // Store the S3 URL
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
      <h1 className="font-serif text-5xl font-black mb-8 border-b-4 border-black pb-4">Upload a Book</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 border-4 border-black bg-neo-purple p-8 shadow-neo">
        
        <div className="space-y-2">
          <label className="font-bold text-xl block">Book Title *</label>
          <NeoInput 
            {...register("title")}
            placeholder="e.g. Introduction to Algorithms"
          />
          {errors.title && <span className="text-red-900 font-bold bg-white px-2 border-2 border-black inline-block mt-2 shadow-sm">{errors.title.message}</span>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="font-bold text-xl block">Author *</label>
            <NeoInput 
              {...register("author")}
              placeholder="e.g. Thomas H. Cormen"
            />
            {errors.author && <span className="text-red-900 font-bold bg-white px-2 border-2 border-black inline-block mt-2 shadow-sm">{errors.author.message}</span>}
          </div>
          <div className="space-y-2">
            <label className="font-bold text-xl block">Category *</label>
            <NeoInput 
              {...register("category")}
              placeholder="e.g. Engineering, Fiction"
            />
            {errors.category && <span className="text-red-900 font-bold bg-white px-2 border-2 border-black inline-block mt-2 shadow-sm">{errors.category.message}</span>}
          </div>
        </div>

        <div className="space-y-2">
          <label className="font-bold text-xl block">Description</label>
          <textarea 
            {...register("description")}
            rows={4}
            className="w-full border-4 border-black p-3 font-medium focus:outline-none focus:ring-4 focus:ring-black focus:shadow-neo-active transition-all"
            placeholder="Condition of the book, edition, etc."
          />
          {errors.description && <span className="text-red-900 font-bold bg-white px-2 border-2 border-black inline-block mt-2 shadow-sm">{errors.description.message}</span>}
        </div>

        <div className="space-y-2">
          <label className="font-bold text-xl block">Cover Image (Optional)</label>
          <input 
            type="file"
            {...register("file")}
            accept="image/*"
            className="w-full border-4 border-black bg-white p-3 font-medium focus:outline-none focus:ring-4 focus:ring-black"
          />
          <p className="text-xs font-bold text-gray-800 mt-1">Max file size: 5MB</p>
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
