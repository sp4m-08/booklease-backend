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
  slot?: string;
  description: string;
  file_path: string;
  price?: number;
  upvotes: number;
  is_upvoted?: boolean;
  uploader: { 
    username: string;
    registration_no?: string;
    email?: string;
    phone_number?: string;
  };
  created_at: string;
}

import { NoteCover } from "@/components/NoteCover";
import { ThumbsUp } from "lucide-react";

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

  const branches = ["All", "CSE", "ECE", "EEE", "Mechanical", "Biotech", "Civil", "Common"];

  const filteredNotes = useMemo(() => {
    if (!notes) return [];
    let filtered = notes.filter((note) => {
      const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (note.subject || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSubject = selectedSubject === "All" || 
                            (note.subject || "").toLowerCase() === selectedSubject.toLowerCase();
      return matchesSearch && matchesSubject;
    });

    // Sort by upvotes descending
    return filtered.sort((a, b) => b.upvotes - a.upvotes);
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
          <div className="inline-block border-2 border-black px-3 py-0.5 bg-neo-purple font-black text-xs uppercase mb-2 shadow-sm">
            ⚡ Exam Revision Hub
          </div>
          <h1 className="font-serif text-5xl font-black mb-2">CAT & FAT Study Notes</h1>
          <p className="font-medium text-xl text-gray-700">Handwritten class notes, module formula sheets, and solved papers shared by VITians.</p>
        </div>
        <Link href="/notes/upload">
          <NeoButton variant="primary" size="lg" className="bg-neo-purple">Share Study Notes</NeoButton>
        </Link>
      </div>

      {/* Discovery / Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-6 mb-12">
        <div className="flex-grow">
          <NeoInput 
            placeholder="Search notes by course code, subject, or exam (e.g. OS CAT-1, DSD Cheatsheet, Calculus FAT)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {branches.map((sub) => (
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse border-4 border-black bg-gray-200 h-80 shadow-neo" />
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredNotes.map((note) => (
            <Link key={note.id} href={`/notes/${note.id}`} className="note-card block group">
              <NeoCard
                className="w-full h-full flex flex-col p-0 overflow-hidden cursor-pointer transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-neo-hover"
                color="white"
              >
                {/* Visual Preview Header */}
                <div className="aspect-[16/10] w-full border-b-4 border-black relative overflow-hidden flex-shrink-0 bg-white">
                  <NoteCover 
                    src={note.file_path} 
                    title={note.title} 
                    subject={note.subject}
                    className="transform group-hover:scale-105 transition-transform duration-500" 
                  />
                </div>

                <div className="p-5 flex-grow flex flex-col justify-between bg-white">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex gap-2">
                        <span className="inline-block px-2 py-0.5 bg-neo-yellow border-2 border-black font-bold text-xs uppercase shadow-sm">
                          {note.subject || "General"}
                        </span>
                        <span className="inline-block px-2 py-0.5 bg-neo-green border-2 border-black font-black text-xs uppercase shadow-sm">
                          {note.price && note.price > 0 ? `₹${note.price}` : "FREE"}
                        </span>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-xs font-black px-2 py-0.5 border-2 border-black shadow-sm ${note.is_upvoted ? "bg-neo-blue text-white" : "bg-white"}`}>
                        <ThumbsUp size={12} className={note.is_upvoted ? "fill-white" : ""} /> {note.upvotes || 0}
                      </span>
                    </div>
                    <h3 className="font-serif text-2xl font-black mb-1 line-clamp-1">{note.title}</h3>
                    <p className="text-gray-600 text-xs font-bold mb-3">
                      By {note.uploader?.username || "Student"} {note.uploader?.registration_no ? `(${note.uploader.registration_no})` : ""}
                    </p>
                    <p className="font-medium text-sm text-gray-700 line-clamp-2">{note.description || "Click to view note details."}</p>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t-2 border-dashed border-gray-300 flex justify-between items-center text-xs font-bold">
                    <span className="text-gray-500">Shared {new Date(note.created_at).toLocaleDateString()}</span>
                    <span className="underline group-hover:text-blue-600">View Document ↗</span>
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
