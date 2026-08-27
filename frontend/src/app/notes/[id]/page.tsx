"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { NeoCard } from "@/components/ui/NeoCard";
import { NeoButton } from "@/components/ui/NeoButton";
import { getImageUrl } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Download, ExternalLink, FileText, Trash2, UserCheck, MessageSquare } from "lucide-react";

interface NoteDetail {
  id: number;
  title: string;
  subject: string;
  description: string;
  file_path: string;
  price?: number;
  uploaded_by: number;
  uploader: {
    id: number;
    username: string;
    email: string;
    phone_number: string;
    registration_no: string;
  };
  created_at: string;
}

export default function NoteDetailPage() {
  const { id } = useParams();
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: note, isLoading, error } = useQuery<NoteDetail>({
    queryKey: ["note", id],
    queryFn: async () => {
      const response = await api.get(`/notes/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async () => api.delete(`/notes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Note deleted successfully!");
      router.push("/notes");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete note.");
    }
  });

  if (isLoading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[calc(100vh-84px)]">
        <div className="animate-spin w-16 h-16 border-8 border-black border-t-neo-yellow rounded-full" />
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-red-200 border-4 border-black p-8 font-black text-2xl shadow-neo max-w-lg mb-6">
          Failed to load study note details.
        </div>
        <Link href="/notes">
          <NeoButton variant="primary">⬅️ Back to Notes</NeoButton>
        </Link>
      </div>
    );
  }

  const fileUrl = getImageUrl(note.file_path);
  const fileExt = note.file_path ? note.file_path.split(".").pop()?.toLowerCase() : "";
  const isPdf = fileExt === "pdf";
  const isImage = ["png", "jpg", "jpeg", "webp", "gif"].includes(fileExt || "");
  const isDoc = ["doc", "docx", "txt"].includes(fileExt || "");

  const isOwner = userProfile?.id === note.uploaded_by;
  const canDelete = isOwner || userProfile?.is_admin;

  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-12 flex-grow">
      {/* Top Header */}
      <div className="mb-8 flex justify-between items-center">
        <Link href="/notes">
          <NeoButton variant="secondary" className="bg-white flex items-center gap-2">
            <ArrowLeft size={18} />
            Back to Notes
          </NeoButton>
        </Link>

        {canDelete && (
          <NeoButton 
            variant="danger"
            onClick={() => {
              if (confirm(`Are you sure you want to delete note "${note.title}"?`)) {
                deleteNoteMutation.mutate();
              }
            }}
            disabled={deleteNoteMutation.isPending}
            className="flex items-center gap-2"
          >
            <Trash2 size={18} />
            Delete Note
          </NeoButton>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        
        {/* Left Column: Document / File Preview */}
        <div className="lg:col-span-2 space-y-4">
          <NeoCard className="flex flex-col p-0 overflow-hidden shadow-neo-lg" color="white">
            <div className="bg-black text-white p-4 font-bold border-b-4 border-black flex justify-between items-center">
              <span className="flex items-center gap-2 text-sm uppercase">
                <FileText size={18} />
                Document Viewer ({fileExt?.toUpperCase() || "FILE"})
              </span>
              {fileUrl && (
                <div className="flex gap-2">
                  <a href={fileUrl} target="_blank" rel="noreferrer" download>
                    <NeoButton variant="primary" size="sm" className="bg-neo-green text-black flex items-center gap-1">
                      <Download size={14} /> Download
                    </NeoButton>
                  </a>
                  <a href={fileUrl} target="_blank" rel="noreferrer">
                    <NeoButton variant="primary" size="sm" className="bg-neo-blue text-black flex items-center gap-1">
                      <ExternalLink size={14} /> Fullscreen
                    </NeoButton>
                  </a>
                </div>
              )}
            </div>

            {/* Adaptive File Viewer */}
            {isPdf && fileUrl ? (
              <div className="h-[75vh] w-full bg-gray-100">
                <iframe 
                  src={`${fileUrl}#view=FitH`} 
                  className="w-full h-full border-none"
                  title={note.title}
                />
              </div>
            ) : isImage && fileUrl ? (
              <div className="p-8 bg-gray-100 flex items-center justify-center min-h-[400px]">
                <img 
                  src={fileUrl} 
                  alt={note.title} 
                  className="max-h-[70vh] object-contain border-4 border-black shadow-neo"
                />
              </div>
            ) : (
              <div className="p-12 text-center bg-neo-yellow/20 flex flex-col items-center justify-center min-h-[350px]">
                <FileText className="w-20 h-20 text-black mb-4 stroke-1" />
                <h3 className="font-serif text-3xl font-black mb-2">{note.title}</h3>
                <p className="font-bold text-gray-700 mb-6 max-w-md">
                  This document format ({fileExt?.toUpperCase() || "DOC"}) is ready for download.
                </p>
                {fileUrl && (
                  <a href={fileUrl} target="_blank" rel="noreferrer" download>
                    <NeoButton variant="primary" size="lg" className="bg-neo-green text-black flex items-center gap-2">
                      <Download size={20} /> Download Document File
                    </NeoButton>
                  </a>
                )}
              </div>
            )}
          </NeoCard>
        </div>

        {/* Right Column: Note Metadata & Contact */}
        <div className="flex flex-col gap-8">
          <NeoCard color="yellow" className="p-6">
            <div className="flex flex-wrap gap-2 mb-4 items-center">
              <span className="inline-block px-3 py-1 bg-white border-2 border-black font-black text-xs uppercase shadow-sm">
                {note.subject || "General Study Material"}
              </span>
              <span className="inline-block px-3 py-1 bg-neo-green border-2 border-black font-black text-xs uppercase shadow-sm">
                {note.price && note.price > 0 ? `₹${note.price}` : "FREE"}
              </span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-black mb-4 leading-tight">{note.title}</h1>
            <p className="font-medium text-base text-gray-800 leading-relaxed whitespace-pre-wrap">
              {note.description || "No specific summary provided for this note file."}
            </p>
            <p className="text-xs font-bold text-gray-600 mt-6 pt-4 border-t-2 border-black">
              Shared on {new Date(note.created_at).toLocaleDateString()}
            </p>
          </NeoCard>

          <NeoCard color="blue" className="p-6">
            <div className="flex items-center gap-3 mb-6 border-b-4 border-black pb-3">
              <UserCheck size={24} />
              <h2 className="font-serif text-2xl font-black">Author & Contact</h2>
            </div>
            
            <div className="space-y-4 font-medium text-sm">
              <div>
                <span className="text-xs font-black uppercase text-gray-700 block">Uploaded By</span>
                <span className="font-bold text-lg">{note.uploader?.username || "Campus Student"}</span>
              </div>
              
              {note.uploader?.registration_no && (
                <div>
                  <span className="text-xs font-black uppercase text-gray-700 block">Registration No.</span>
                  <span className="font-bold">{note.uploader.registration_no}</span>
                </div>
              )}

              {note.uploader?.email && (
                <div>
                  <span className="text-xs font-black uppercase text-gray-700 block">Email Address</span>
                  <a href={`mailto:${note.uploader.email}`} className="font-bold underline hover:text-blue-900 break-all">
                    {note.uploader.email}
                  </a>
                </div>
              )}

              {note.uploader?.phone_number ? (
                <div className="pt-4 border-t-2 border-dashed border-black">
                  <a 
                    href={`https://wa.me/91${note.uploader.phone_number}?text=Hi, I found your notes "${note.title}" on BookLease and wanted to thank you / ask a doubt!`} 
                    target="_blank" 
                    rel="noreferrer"
                  >
                    <NeoButton variant="primary" className="w-full bg-[#25D366] text-white flex items-center justify-center gap-2">
                      <MessageSquare size={18} /> Message on WhatsApp
                    </NeoButton>
                  </a>
                </div>
              ) : (
                <div className="bg-white border-2 border-black p-3 text-xs font-bold text-gray-600">
                  Uploader has not set a public phone number.
                </div>
              )}
            </div>
          </NeoCard>
        </div>

      </div>
    </div>
  );
}
