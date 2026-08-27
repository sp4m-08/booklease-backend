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
import { NeoInput } from "@/components/ui/NeoInput";

const noteSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  subject: z.string().min(2, "Subject is required"),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional(),
  file: z.any()
    .refine((files) => files?.length === 1, "A PDF document is required."),
});

type NoteFormData = z.infer<typeof noteSchema>;

export default function NoteUploadPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
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
        
        if (file.size > 10 * 1024 * 1024) {
          toast.error("File size must be less than 10MB");
          setIsSubmitting(false);
          return;
        }

        const presignedRes = await api.post("/api/upload/presigned-url", {
          file_name: file.name,
          content_type: file.type,
          folder: "notes",
        });
        
        const { upload_url } = presignedRes.data;

        await axios.put(upload_url, file, {
          headers: { "Content-Type": file.type },
        });

        finalFileUrl = upload_url.split("?")[0];  
      }

      await api.post("/notes/", {
        title: data.title,
        subject: data.subject,
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
      <h1 className="font-serif text-5xl font-black mb-8 border-b-4 border-black pb-4">Share a Note</h1>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 border-4 border-black bg-neo-blue p-8 shadow-neo">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="font-bold text-xl block">Note Title *</label>
            <NeoInput 
              {...register("title")}
              placeholder="e.g. OS Midterm Cheatsheet"
            />
            {errors.title && <span className="text-red-900 font-bold bg-white px-2 border-2 border-black inline-block mt-2 shadow-sm">{errors.title.message}</span>}
          </div>
          <div className="space-y-2">
            <label className="font-bold text-xl block">Subject *</label>
            <NeoInput 
              {...register("subject")}
              placeholder="e.g. Operating Systems"
            />
            {errors.subject && <span className="text-red-900 font-bold bg-white px-2 border-2 border-black inline-block mt-2 shadow-sm">{errors.subject.message}</span>}
          </div>
        </div>

        <div className="space-y-2">
          <label className="font-bold text-xl block">Description</label>
          <textarea 
            {...register("description")}
            rows={4}
            className="w-full border-4 border-black p-3 font-medium focus:outline-none focus:ring-4 focus:ring-black focus:shadow-neo-active transition-all"
            placeholder="What topics are covered in these notes?"
          />
          {errors.description && <span className="text-red-900 font-bold bg-white px-2 border-2 border-black inline-block mt-2 shadow-sm">{errors.description.message}</span>}
        </div>

        <div className="space-y-2">
          <label className="font-bold text-xl block">Upload PDF/Document *</label>
          <input 
            type="file"
            {...register("file")}
            accept=".pdf,.doc,.docx,.txt"
            className="w-full border-4 border-black bg-white p-3 font-medium focus:outline-none focus:ring-4 focus:ring-black"
          />
          {errors.file && <span className="text-red-900 font-bold bg-white px-2 border-2 border-black inline-block mt-2 shadow-sm">{errors.file.message as string}</span>}
          <p className="text-xs font-bold text-gray-800 mt-1">Max file size: 10MB</p>
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
