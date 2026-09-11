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

import { BookCover } from "@/components/BookCover";
import { SlotBadges } from "@/components/SlotBadges";
import { NeoSelect } from "@/components/ui/NeoSelect";
import { GraduationCap, Filter, Award, Tag, X, CheckCircle2, Flame, Clock, BookOpen, FileText, ArrowRight } from "lucide-react";

import { getStoredCache, setStoredCache } from "@/lib/cache";

interface Book {
  id: number;
  title: string;
  author: string;
  category: string;
  slot?: string;
  rented_slots?: string;
  cover_image: string;
  price?: number;
  available: boolean;
  type?: string;
  condition?: string;
}

export default function BooksPage() {
  const container = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSlot, setSelectedSlot] = useState("All");
  const [selectedType, setSelectedType] = useState<"All" | "Textbook" | "Printout">("All");
  const [availability, setAvailability] = useState<"All" | "available" | "rented">("All");
  const [sortBy, setSortBy] = useState<"popular" | "price_asc" | "price_desc" | "newest">("popular");

  const { data: books, isLoading, error } = useQuery<Book[]>({
    queryKey: ["books"],
    queryFn: async () => {
      const response = await api.get("/book/");
      if (response.data) {
        setStoredCache("books", response.data);
      }
      return response.data;
    },
    placeholderData: () => getStoredCache<Book[]>("books") || [],
    staleTime: 5000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const branches = ["All", "CSE", "ECE", "EEE", "Mechanical", "Biotech", "Civil", "Common"];
  const slots = ["All", "A1", "A2", "B1", "B2", "C1", "C2", "D1", "D2", "E1", "E2", "F1", "F2", "G1", "G2"];

  const filteredBooks = useMemo(() => {
    if (!books) return [];
    let filtered = books.filter((book) => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        !searchTerm ||
        book.title.toLowerCase().includes(search) || 
        book.author.toLowerCase().includes(search) ||
        (book.category || "").toLowerCase().includes(search) ||
        (book.type || "").toLowerCase().includes(search) ||
        (book.slot || "").toLowerCase().includes(search);

      const matchesCategory = selectedCategory === "All" || 
                              book.category?.toLowerCase() === selectedCategory.toLowerCase();

      const matchesSlot = selectedSlot === "All" ||
        (book.slot && (
          book.slot.toLowerCase() === "all slots" ||
          book.slot.split(",").map((s) => s.trim().toLowerCase()).includes(selectedSlot.toLowerCase())
        ));

      const matchesType = 
        selectedType === "All" ||
        (selectedType === "Textbook" && (!book.type || book.type.toLowerCase().includes("textbook"))) ||
        (selectedType === "Printout" && book.type && (book.type.toLowerCase().includes("printout") || book.type.toLowerCase().includes("xerox")));

      const matchesAvailability = 
        availability === "All" ||
        (availability === "available" && book.available) ||
        (availability === "rented" && !book.available);

      return matchesSearch && matchesCategory && matchesSlot && matchesType && matchesAvailability;
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
        return (b.id || 0) - (a.id || 0);
      }
      // default: available first, then id
      if (a.available !== b.available) {
        return a.available ? -1 : 1;
      }
      return (b.id || 0) - (a.id || 0);
    });
  }, [books, searchTerm, selectedCategory, selectedSlot, selectedType, availability, sortBy]);

  useGSAP(() => {
    if (filteredBooks.length > 0) {
      gsap.from(".book-card", {
        y: 50,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "back.out(1.5)",
      });
    }
  }, { dependencies: [filteredBooks], scope: container });

  const hasActiveFilters = 
    searchTerm !== "" || 
    selectedCategory !== "All" || 
    selectedSlot !== "All" || 
    selectedType !== "All" ||
    availability !== "All" || 
    sortBy !== "popular";

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("All");
    setSelectedSlot("All");
    setSelectedType("All");
    setAvailability("All");
    setSortBy("popular");
  };

  return (
    <div ref={container} className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-12 flex-grow">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 sm:mb-8 border-b-4 border-black pb-4 sm:pb-6 gap-4 sm:gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 border-2 border-black px-2.5 sm:px-3 py-0.5 bg-neo-yellow font-black text-xs uppercase mb-2 shadow-sm">
            <GraduationCap size={13} className="text-black" />
            <span>VIT Vellore Library</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-black mb-2">Course Reference Books</h1>
          <p className="font-medium text-sm sm:text-lg text-gray-700">Find and rent syllabus textbooks and spiral printouts for your CAT-2 and FAT exam preparation.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <Link href="/notes" className="w-full sm:w-auto">
            <NeoButton variant="secondary" size="lg" className="w-full bg-neo-purple text-black flex items-center justify-center gap-2 hover:scale-105 transition-transform text-sm sm:text-base py-2.5 sm:py-3">
              <FileText size={18} />
              Browse Notes
            </NeoButton>
          </Link>
          <Link href="/books/upload" className="w-full sm:w-auto">
            <NeoButton variant="primary" size="lg" className="w-full bg-neo-green text-black hover:scale-105 transition-transform text-sm sm:text-base py-2.5 sm:py-3">
              List a Book or Printout
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
              placeholder="Search by course code, title, or author (e.g. DSD, Cormen, OS)..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Branch Filter Dropdown */}
          <div className="sm:col-span-1 lg:col-span-2">
            <NeoSelect
              value={selectedCategory}
              onChange={setSelectedCategory}
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
                { label: "Available First", value: "popular" },
                { label: "Price: Low to High", value: "price_asc" },
                { label: "Price: High to Low", value: "price_desc" },
                { label: "Newest Listed", value: "newest" },
              ]}
            />
          </div>
        </div>

        {/* Second Row: Format, Exam & Availability Quick Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t-2 border-dashed border-black">
          <div className="flex flex-wrap items-center gap-4">
            {/* Format Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-black uppercase text-gray-700 mr-1 flex items-center gap-1">
                <BookOpen size={13} /> Format:
              </span>
              {[
                { label: "All Formats", value: "All" },
                { label: "Textbooks", value: "Textbook" },
                { label: "Spiral Printouts / Xerox", value: "Printout" },
              ].map((fmt) => (
                <button
                  key={fmt.value}
                  onClick={() => setSelectedType(fmt.value as typeof selectedType)}
                  className={`border-2 border-black px-2.5 py-1 font-black text-xs transition-all ${
                    selectedType === fmt.value 
                      ? "bg-neo-yellow text-black shadow-neo" 
                      : "bg-white text-black hover:bg-neo-yellow"
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Availability Pills */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-black uppercase text-gray-700 mr-1 flex items-center gap-1">
              <CheckCircle2 size={13} /> Status:
            </span>
            {[
              { label: "All Status", value: "All" },
              { label: "Available Now", value: "available" },
              { label: "Rented Out", value: "rented" },
            ].map((st) => (
              <button
                key={st.value}
                onClick={() => setAvailability(st.value as typeof availability)}
                className={`border-2 border-black px-2.5 py-1 font-black text-xs transition-all ${
                  availability === st.value 
                    ? "bg-neo-green text-black shadow-neo" 
                    : "bg-white text-black hover:bg-neo-yellow"
                }`}
              >
                {st.label}
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
            {branches.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`border-2 border-black px-2.5 py-0.5 font-bold text-xs transition-all ${
                  selectedCategory === cat 
                    ? "bg-black text-white shadow-neo" 
                    : "bg-white text-black hover:bg-neo-yellow"
                }`}
              >
                {cat}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse border-4 border-black bg-gray-200 h-96 shadow-neo" />
          ))}
        </div>
      ) : error ? (
        <div className="p-12 text-center font-bold text-xl border-4 border-black bg-red-100">Failed to load textbooks.</div>
      ) : books?.length === 0 ? (
        <div className="p-12 text-center font-bold text-2xl border-4 border-black border-dashed bg-white shadow-neo">
          No textbooks or printouts listed for rent right now. Be the first VITian to list one!
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="p-12 text-center border-4 border-black bg-neo-yellow shadow-neo space-y-4">
          <p className="font-black text-2xl">No books or printouts found matching your search.</p>
          <p className="font-bold text-gray-800">Looking for handwritten study notes or formula sheets instead?</p>
          <Link href="/notes" className="inline-block">
            <NeoButton variant="secondary" className="bg-white hover:bg-neo-purple flex items-center gap-2 mx-auto">
              <FileText size={18} /> Browse Notes & Materials <ArrowRight size={16} />
            </NeoButton>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {filteredBooks.map((book) => (
            <Link href={`/books/${book.id}`} key={book.id} className="book-card block group">
              <NeoCard color="white" className="h-full flex flex-col p-0 transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-neo-hover">
                <div className="aspect-[3/4] w-full border-b-4 border-black relative overflow-hidden flex-shrink-0">
                  <BookCover 
                    src={book.cover_image} 
                    title={book.title} 
                    author={book.author} 
                    category={book.category} 
                    className="transform group-hover:scale-105 transition-transform duration-500" 
                  />
                  {!book.available && (
                    <div className="absolute top-4 right-4 border-2 border-black bg-red-400 text-white font-bold px-3 py-1 shadow-neo transform rotate-12">
                      Rented Out
                    </div>
                  )}
                </div>
                <div className="p-4 flex-grow flex flex-col justify-between bg-white">
                  <div>
                    <h3 className="font-bold text-xl line-clamp-2 leading-tight mb-1">{book.title}</h3>
                    <p className="text-sm font-medium text-gray-600 mb-2 truncate">{book.author}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-1.5 justify-between items-center">
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className="border-2 border-black bg-neo-yellow px-2 py-0.5 text-xs font-bold shadow-sm">
                        {book.category || "General"}
                      </span>
                      {book.type && book.type !== "Original Textbook" && (
                        <span className="border-2 border-black bg-neo-blue/80 px-2 py-0.5 text-xs font-bold shadow-sm">
                          {book.type.includes("Spiral") ? "Spiral Printout" : book.type.includes("Xerox") ? "Xerox Copy" : "Printout"}
                        </span>
                      )}
                      <SlotBadges slot={book.slot} rentedSlots={book.rented_slots} />
                    </div>
                    <span className="border-2 border-black bg-neo-green px-2 py-0.5 text-xs font-black shadow-sm">
                      {book.price && book.price > 0 ? `₹${book.price}` : "FREE"}
                    </span>
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
