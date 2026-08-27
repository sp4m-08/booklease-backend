"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { NeoButton } from "@/components/ui/NeoButton";
import { NeoCard } from "@/components/ui/NeoCard";
import { NeoInput } from "@/components/ui/NeoInput";

interface Note {
  id: number;
  title: string;
  subject: string;
  description: string;
  file_path: string;
  uploader: { 
    username: string;
    registration_no?: string;
    email?: string;
    phone_number?: string;
  };
  created_at: string;
}

export default function NotesPage() {
  const container = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");

  const { data: notes, isLoading, error } = useQuery<Note[]>({
    queryKey: ["notes"],
    queryFn: async () => {
      const response = await api.get("/notes/");
      return response.data;
    },
  });

  const subjects = useMemo(() => {
    if (!notes) return ["All"];
    const uniqueSubjects = new Set(notes.map(n => n.subject || "General"));
    return ["All", ...Array.from(uniqueSubjects)];
  }, [notes]);

  const filteredNotes = useMemo(() => {
    if (!notes) return [];
    return notes.filter((note) => {
      const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (note.subject || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSubject = selectedSubject === "All" || (note.subject || "General") === selectedSubject;
      return matchesSearch && matchesSubject;
    });
  }, [notes, searchTerm, selectedSubject]);

  useGSAP(() => {
    if (filteredNotes.length > 0) {
      gsap.from(".note-card", {
        scale: 0.8,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "back.out(1.5)",
      });
    }
  }, { dependencies: [filteredNotes], scope: container });

  return (
    <div ref={container} className="max-w-7xl mx-auto w-full px-8 py-12 flex-grow">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b-4 border-black pb-6 gap-6">
        <div>
          <h1 className="font-serif text-5xl font-black mb-2">Study Notes</h1>
          <p className="font-medium text-xl text-gray-700">Download notes uploaded by your peers.</p>
        </div>
        <Link href="/notes/upload">
          <NeoButton variant="primary" size="lg" className="bg-neo-purple">Upload Notes</NeoButton>
        </Link>
      </div>

      {/* Discovery / Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-6 mb-12">
        <div className="flex-grow">
          <NeoInput 
            placeholder="Search notes by title or subject..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {subjects.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`border-2 border-black px-4 py-2 font-bold text-sm transition-all ${
                selectedSubject === sub 
                  ? "bg-black text-white shadow-neo" 
                  : "bg-white text-black hover:bg-gray-100"
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse border-4 border-black bg-gray-200 h-64 shadow-neo" />
          ))}
        </div>
      ) : error ? (
        <div className="p-12 text-center font-bold text-xl border-4 border-black bg-red-100">Failed to load notes.</div>
      ) : notes?.length === 0 ? (
        <div className="p-12 text-center font-bold text-2xl border-4 border-black border-dashed bg-white shadow-neo">
          No notes available right now. Share yours!
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="p-12 text-center font-bold text-xl border-4 border-black bg-neo-yellow shadow-neo">
          No notes found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredNotes.map((note, i) => (
            <Link key={note.id} href={`/notes/${note.id}`} className="block">
              <NeoCard
                className="note-card w-full h-full cursor-pointer hover:-translate-y-2 hover:translate-x-2 transition-transform duration-300"
                color={["pink", "yellow", "blue", "green", "purple"][i % 5] as any}
              >
                <div className="flex flex-col h-full justify-between gap-6">
                  <div>
                    <span className="inline-block px-3 py-1 bg-white border-2 border-black font-bold text-xs uppercase mb-4 shadow-sm">
                      {note.subject || "General"}
                    </span>
                    <h3 className="font-serif text-3xl font-black mb-2">{note.title}</h3>
                    <p className="text-gray-700 font-bold mb-4">
                      By {note.uploader?.username} {note.uploader?.registration_no}
                    </p>
                    <p className="font-medium">{note.description}</p>
                  </div>
                  
                  <div className="w-full">
                    <NeoButton variant="primary" className="w-full bg-white pointer-events-none">
                      View Details & Contact ➡️
                    </NeoButton>
                  </div>
                </div>
              </NeoCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
