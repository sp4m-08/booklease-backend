"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { NeoCard } from "@/components/ui/NeoCard";
import { NeoButton } from "@/components/ui/NeoButton";
import Link from "next/link";

interface NoteDetail {
  id: number;
  title: string;
  subject: string;
  description: string;
  file_path: string;
  uploader: {
    username: string;
    email: string;
    phone_number: string;
    registration_no: string;
  };
  created_at: string;
}

export default function NoteDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const { data: note, isLoading, error } = useQuery<NoteDetail>({
    queryKey: ["note", id],
    queryFn: async () => {
      const response = await api.get(`/notes/${id}`);
      return response.data;
    },
    enabled: !!id,
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
        <div className="bg-red-200 border-4 border-black p-8 font-black text-2xl shadow-neo max-w-lg">
          Failed to load note details.
        </div>
        <NeoButton variant="secondary" className="mt-8" onClick={() => router.push("/notes")}>
          ⬅️ Back to Notes
        </NeoButton>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-8 py-12 flex-grow">
      <div className="mb-8">
        <Link href="/notes">
          <NeoButton variant="secondary" className="bg-white">⬅️ Back to Notes</NeoButton>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: PDF Preview */}
        <div className="lg:col-span-2">
          <NeoCard className="h-[80vh] flex flex-col p-0 overflow-hidden" color="white">
            <div className="bg-black text-white p-4 font-bold border-b-4 border-black flex justify-between items-center">
              <span>PDF Preview</span>
              <a href={note.file_path} target="_blank" rel="noreferrer">
                <NeoButton variant="primary" size="sm" className="bg-neo-blue">Open Fullscreen ↗️</NeoButton>
              </a>
            </div>
            <iframe 
              src={`${note.file_path}#view=FitH`} 
              className="w-full h-full border-none flex-grow"
              title={note.title}
            />
          </NeoCard>
        </div>

        {/* Right Column: Details & Contact */}
        <div className="flex flex-col gap-8">
          <NeoCard color="yellow">
            <span className="inline-block px-3 py-1 bg-white border-2 border-black font-bold text-xs uppercase mb-4 shadow-sm">
              {note.subject || "General"}
            </span>
            <h1 className="font-serif text-4xl font-black mb-4">{note.title}</h1>
            <p className="font-medium text-lg mb-6">{note.description}</p>
          </NeoCard>

          <NeoCard color="blue">
            <h2 className="font-serif text-2xl font-black mb-6 border-b-4 border-black pb-2">Contact Owner</h2>
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs font-bold uppercase text-gray-800">Uploader</p>
                <p className="font-black text-xl">{note.uploader?.username}</p>
              </div>
              
              {note.uploader?.registration_no && (
                <div>
                  <p className="text-xs font-bold uppercase text-gray-800">Registration No.</p>
                  <p className="font-black text-xl">{note.uploader?.registration_no}</p>
                </div>
              )}

              {note.uploader?.email && (
                <div>
                  <p className="text-xs font-bold uppercase text-gray-800">Email</p>
                  <a href={`mailto:${note.uploader?.email}`} className="font-black text-lg underline hover:text-blue-700 break-all">
                    {note.uploader?.email}
                  </a>
                </div>
              )}

              {note.uploader?.phone_number ? (
                <div>
                  <p className="text-xs font-bold uppercase text-gray-800">WhatsApp</p>
                  <a 
                    href={`https://wa.me/91${note.uploader?.phone_number}?text=Hi, I found your note "${note.title}" on BookLease and wanted to ask about it!`} 
                    target="_blank" 
                    rel="noreferrer"
                  >
                    <NeoButton variant="primary" className="w-full mt-2 bg-[#25D366] text-white">
                      Message on WhatsApp
                    </NeoButton>
                  </a>
                </div>
              ) : (
                <div className="bg-white border-2 border-black p-4 mt-2">
                  <p className="font-bold text-sm text-gray-600">This user hasn't provided a phone number.</p>
                </div>
              )}
            </div>
          </NeoCard>
        </div>
      </div>
    </div>
  );
}
