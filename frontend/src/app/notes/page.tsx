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
import { NeoSelect } from "@/components/ui/NeoSelect";
import { SlotBadges } from "@/components/SlotBadges";
import { NoteCover } from "@/components/NoteCover";
import { ThumbsUp, Filter, Sparkles, X, ArrowUpDown, Tag, Flame, Clock, Award, BookOpen, ArrowRight } from "lucide-react";
import { formatStudentName } from "@/lib/utils";

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

import { getStoredCache, setStoredCache } from "@/lib/cache";

export default function NotesPage() {
  const container = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [selectedSlot, setSelectedSlot] = useState("All");
  const [priceType, setPriceType] = useState<"All" | "free" | "paid">("All");
  const [sortBy, setSortBy] = useState<"upvotes" | "price_asc" | "price_desc" | "newest">("upvotes");

  const { data: notes, isLoading, error } = useQuery<Note[]>({
    queryKey: ["notes"],
    queryFn: async () => {
      const response = await api.get("/notes/");
      if (response.data) {
        setStoredCache("notes", response.data);
      }
      return response.data;
    },
    placeholderData: () => getStoredCache<Note[]>("notes") || [],
    staleTime: 1000 * 60 * 3, // 3 minutes fresh
  });

  const branches = ["All", "CSE", "ECE", "EEE", "Mechanical", "Biotech", "Civil", "Common"];
  const slots = ["All", "A1", "A2", "B1", "B2", "C1", "C2", "D1", "D2", "E1", "E2", "F1", "F2", "G1", "G2"];

  const filteredNotes = useMemo(() => {
    if (!notes) return [];
    let filtered = notes.filter((note) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        !searchTerm ||
        note.title.toLowerCase().includes(search) || 
        (note.subject || "").toLowerCase().includes(search) ||
        (note.description || "").toLowerCase().includes(search) ||
        (note.slot || "").toLowerCase().includes(search);

      const matchesSubject = selectedSubject === "All" || 
                            (note.subject || "").toLowerCase() === selectedSubject.toLowerCase();

      const matchesSlot = selectedSlot === "All" ||
        (note.slot && (
          note.slot.toLowerCase() === "all slots" ||
          note.slot.split(",").map((s) => s.trim().toLowerCase()).includes(selectedSlot.toLowerCase())
        ));

      const matchesPrice = 
        priceType === "All" ||
        (priceType === "free" && (!note.price || Number(note.price) === 0)) ||
        (priceType === "paid" && note.price && Number(note.price) > 0);

      return matchesSearch && matchesSubject && matchesSlot && matchesPrice;
    });

    // Sort items
    return filtered.sort((a, b) => {
      if (sortBy === "price_asc") {
        return (Number(a.price) || 0) - (Number(b.price) || 0);
      }
      if (sortBy === "price_desc") {
        return (Number(b.price) || 0) - (Number(a.price) || 0);
      }
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      // default: most upvotes
      return (b.upvotes || 0) - (a.upvotes || 0);
    });
  }, [notes, searchTerm, selectedSubject, selectedSlot, priceType, sortBy]);

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

  const hasActiveFilters = 
    searchTerm !== "" || 
    selectedSubject !== "All" || 
    selectedSlot !== "All" || 
    priceType !== "All" || 
    sortBy !== "upvotes";

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSubject("All");
    setSelectedSlot("All");
    setPriceType("All");
    setSortBy("upvotes");
  };

  return (
    <div ref={container} className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-12 flex-grow">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 sm:mb-8 border-b-4 border-black pb-4 sm:pb-6 gap-4 sm:gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 border-2 border-black px-2.5 sm:px-3 py-0.5 bg-neo-purple font-black text-xs uppercase mb-2 shadow-sm">
            <Sparkles size={13} className="text-black" />
            <span>Exam Revision Hub</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-black mb-2">CAT & FAT Study Notes</h1>
          <p className="font-medium text-sm sm:text-lg text-gray-700">Handwritten class notes, module formula sheets, and solved papers shared by VITians.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <Link href="/books" className="w-full sm:w-auto">
            <NeoButton variant="secondary" size="lg" className="w-full bg-neo-green text-black flex items-center justify-center gap-2 hover:scale-105 transition-transform text-sm sm:text-base py-2.5 sm:py-3">
              <BookOpen size={18} />
              Browse Books
            </NeoButton>
          </Link>
          <Link href="/notes/upload" className="w-full sm:w-auto">
            <NeoButton variant="primary" size="lg" className="w-full bg-neo-purple text-black hover:scale-105 transition-transform text-sm sm:text-base py-2.5 sm:py-3">
              Share Study Notes
            </NeoButton>
          </Link>
        </div>
      </div>

      {/* Discovery / Filter Bar */}
      <div className="mb-8 sm:mb-10 space-y-4 border-3 sm:border-4 border-black bg-white p-3.5 sm:p-5 shadow-neo">
        {/* Top Controls: Search + Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Main Search Input */}
          <div className="sm:col-span-2 lg:col-span-5">
            <NeoInput 
              placeholder="Search notes by subject, title, module, or course code..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Branch Filter Dropdown */}
          <div className="sm:col-span-1 lg:col-span-2">
            <NeoSelect
              value={selectedSubject}
              onChange={setSelectedSubject}
              placeholder="Branch"
              options={[
                { label: "All Branches", value: "All" },
                ...branches.filter((b) => b !== "All").map((b) => ({ label: b, value: b }))
              ]}
            />
          </div>

          {/* Slot Filter Dropdown */}
          <div className="sm:col-span-1 lg:col-span-2">
            <NeoSelect
              value={selectedSlot}
              onChange={setSelectedSlot}
              placeholder="Slot"
              options={[
                { label: "All Slots", value: "All" },
                ...slots.filter((s) => s !== "All").map((s) => ({ label: `Slot ${s}`, value: s }))
              ]}
            />
          </div>

          {/* Sort By Dropdown */}
          <div className="sm:col-span-2 lg:col-span-3">
            <NeoSelect
              value={sortBy}
              onChange={(val) => setSortBy(val as typeof sortBy)}
              placeholder="Sort By"
              options={[
                { label: "Most Upvoted", value: "upvotes" },
                { label: "Price: Low to High", value: "price_asc" },
                { label: "Price: High to Low", value: "price_desc" },
                { label: "Newest First", value: "newest" },
              ]}
            />
          </div>
        </div>

        {/* Second Row: Price Quick Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t-2 border-dashed border-black">
          {/* Price Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-black uppercase text-gray-700 mr-1 flex items-center gap-1">
              <Tag size={13} /> Price:
            </span>
            {[
              { label: "All Prices", value: "All" },
              { label: "Free (₹0)", value: "free" },
              { label: "Paid", value: "paid" },
            ].map((p) => (
              <button
                key={p.value}
                onClick={() => setPriceType(p.value as typeof priceType)}
                className={`border-2 border-black px-2.5 py-1 font-black text-xs transition-all ${
                  priceType === p.value 
                    ? "bg-neo-green text-black shadow-neo" 
                    : "bg-white text-black hover:bg-neo-yellow"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Third Row: Quick Branch Pills & Clear All Action */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t-2 border-dashed border-gray-200">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-black uppercase text-gray-600 mr-1 flex items-center gap-1">
              <Filter size={13} /> Branch:
            </span>
            {branches.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`border-2 border-black px-2.5 py-0.5 font-bold text-xs transition-all ${
                  selectedSubject === sub 
                    ? "bg-black text-white shadow-neo" 
                    : "bg-white text-black hover:bg-neo-yellow"
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs font-black uppercase text-red-600 border-2 border-red-600 bg-red-50 hover:bg-red-100 px-3 py-1 transition-all self-start md:self-auto shadow-xs"
            >
              <X size={13} /> Clear All Filters
            </button>
          )}
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
        <div className="p-12 text-center border-4 border-black bg-neo-yellow shadow-neo space-y-4">
          <p className="font-black text-2xl">No notes found matching your search.</p>
          <p className="font-bold text-gray-800">Looking for course reference books or printouts instead?</p>
          <Link href="/books" className="inline-block">
            <NeoButton variant="secondary" className="bg-white hover:bg-neo-green flex items-center gap-2 mx-auto">
              <BookOpen size={18} /> Browse Reference Books <ArrowRight size={16} />
            </NeoButton>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
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
                      <div className="flex gap-2 items-center flex-wrap">
                        <span className="inline-block px-2 py-0.5 bg-neo-yellow border-2 border-black font-bold text-xs uppercase shadow-sm">
                          {note.subject || "General"}
                        </span>
                        {note.slot && <SlotBadges slot={note.slot} variant="purple" />}
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
                      By {formatStudentName(note.uploader?.username, "Student")}
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
