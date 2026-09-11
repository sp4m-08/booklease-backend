"use client";

import React, { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { GraduationCap, Search, Filter, ThumbsUp, X, Book, FileText, CheckCircle2 } from "lucide-react";

import { BookCover } from "@/components/BookCover";
import { NoteCover } from "@/components/NoteCover";
import { SlotBadges } from "@/components/SlotBadges";
import { NeoCard } from "@/components/ui/NeoCard";
import { NeoButton } from "@/components/ui/NeoButton";
import { NeoInput } from "@/components/ui/NeoInput";
import { NeoSelect } from "@/components/ui/NeoSelect";
import { getStoredCache, setStoredCache } from "@/lib/cache";
import { formatStudentName } from "@/lib/utils";
import api from "@/lib/api";

gsap.registerPlugin(useGSAP);

interface Listing {
  id: number;
  listingType: "book" | "note";
  title: string;
  branch: string;
  slot?: string;
  rentedSlots?: string;
  price?: number;
  available: boolean;
  coverSrc: string;
  condition?: string;
  bookType?: string;
  upvotes?: number;
  isUpvoted?: boolean;
  author?: string;
  createdAt: string;
  uploaderName?: string;
  description?: string;
}

const BRANCHES = ["All", "CSE", "ECE", "EEE", "Mechanical", "Biotech", "Civil", "Common"];
const SLOTS = ["All", "A1", "A2", "B1", "B2", "C1", "C2", "D1", "D2", "E1", "E2", "F1", "F2", "G1", "G2"];
const SORT_OPTIONS = ["Available First", "Price: Low to High", "Price: High to Low", "Newest Listed"];
const TYPE_FILTERS = ["All Listings", "Books & Printouts", "Study Notes"];
const AVAILABILITY_FILTERS = ["All", "Available Now", "Rented Out"];

function BrowseContent() {
  const searchParams = useSearchParams();
  const initialTypeParam = searchParams.get("type");
  const containerRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState(
    initialTypeParam === "books" ? "Books & Printouts" : 
    initialTypeParam === "notes" ? "Study Notes" : "All Listings"
  );
  const [selectedBranch, setSelectedBranch] = useState("All");
  const [selectedSlot, setSelectedSlot] = useState("All");
  const [selectedSort, setSelectedSort] = useState("Newest Listed");
  const [selectedAvailability, setSelectedAvailability] = useState("All");

  const { data: booksData, isLoading: isLoadingBooks, isError: isErrorBooks } = useQuery({
    queryKey: ["books"],
    queryFn: async () => {
      try {
        const response = await api.get("/book/");
        setStoredCache("books", response.data);
        return response.data;
      } catch (error) {
        const cached = getStoredCache("books");
        if (cached) return cached;
        throw error;
      }
    },
    initialData: () => getStoredCache("books") || undefined,
    staleTime: 5000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const { data: notesData, isLoading: isLoadingNotes, isError: isErrorNotes } = useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      try {
        const response = await api.get("/notes/");
        setStoredCache("notes", response.data);
        return response.data;
      } catch (error) {
        const cached = getStoredCache("notes");
        if (cached) return cached;
        throw error;
      }
    },
    initialData: () => getStoredCache("notes") || undefined,
    staleTime: 5000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const isLoading = isLoadingBooks || isLoadingNotes;
  const isError = isErrorBooks && isErrorNotes;

  const unifiedListings: Listing[] = useMemo(() => {
    const listings: Listing[] = [];

    if (booksData && Array.isArray(booksData)) {
      booksData.forEach((book: any) => {
        listings.push({
          id: book.id,
          listingType: "book",
          title: book.title,
          branch: book.category || "Common",
          slot: book.slot,
          rentedSlots: book.rentedSlots,
          price: book.price,
          available: book.available !== false,
          coverSrc: book.cover_image || "",
          condition: book.condition,
          bookType: book.type,
          author: book.author,
          createdAt: book.createdAt || new Date().toISOString(),
        });
      });
    }

    if (notesData && Array.isArray(notesData)) {
      notesData.forEach((note: any) => {
        listings.push({
          id: note.id,
          listingType: "note",
          title: note.title,
          branch: note.subject || "Common",
          slot: note.slot,
          price: note.price,
          available: note.available !== false,
          coverSrc: note.file_path || "",
          upvotes: note.upvotes || 0,
          isUpvoted: note.isUpvoted || false,
          createdAt: note.createdAt || new Date().toISOString(),
          uploaderName: note.uploader?.username || "Unknown Student",
          description: note.description,
        });
      });
    }

    return listings;
  }, [booksData, notesData]);

  const filteredAndSortedListings = useMemo(() => {
    let result = [...unifiedListings];

    if (selectedType === "Books & Printouts") {
      result = result.filter(l => l.listingType === "book");
    } else if (selectedType === "Study Notes") {
      result = result.filter(l => l.listingType === "note");
    }

    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(l => 
        l.title.toLowerCase().includes(lowerQuery) ||
        (l.author && l.author.toLowerCase().includes(lowerQuery)) ||
        (l.branch && l.branch.toLowerCase().includes(lowerQuery)) ||
        (l.description && l.description.toLowerCase().includes(lowerQuery))
      );
    }

    if (selectedBranch !== "All") {
      result = result.filter(l => l.branch === selectedBranch);
    }

    if (selectedSlot !== "All") {
      result = result.filter(l => l.slot && l.slot.includes(selectedSlot));
    }

    if (selectedAvailability === "Available Now") {
      result = result.filter(l => l.available);
    } else if (selectedAvailability === "Rented Out") {
      result = result.filter(l => !l.available);
    }

    result.sort((a, b) => {
      switch (selectedSort) {
        case "Price: Low to High":
          return (a.price || 0) - (b.price || 0);
        case "Price: High to Low":
          return (b.price || 0) - (a.price || 0);
        case "Available First":
          if (a.available === b.available) return 0;
          return a.available ? -1 : 1;
        case "Newest Listed":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [unifiedListings, searchQuery, selectedType, selectedBranch, selectedSlot, selectedSort, selectedAvailability]);

  useGSAP(() => {
    if (!isLoading && filteredAndSortedListings.length > 0) {
      gsap.from(".listing-card", {
        y: 50,
        opacity: 0,
        duration: 0.6,
        stagger: 0.08,
        ease: "back.out(1.5)",
        clearProps: "all"
      });
    }
  }, { dependencies: [isLoading, filteredAndSortedListings.length], scope: containerRef });

  const hasActiveFilters = searchQuery !== "" || selectedBranch !== "All" || selectedSlot !== "All" || selectedSort !== "Newest Listed" || selectedAvailability !== "All" || selectedType !== "All Listings";

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedType("All Listings");
    setSelectedBranch("All");
    setSelectedSlot("All");
    setSelectedSort("Newest Listed");
    setSelectedAvailability("All");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 border-2 border-black px-2.5 sm:px-3 py-0.5 bg-neo-yellow font-black text-xs uppercase mb-2 shadow-sm">
            <GraduationCap size={13} className="text-black" />
            <span>VIT Vellore Study Hub</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-black mb-2">Browse All Listings</h1>
          <p className="font-medium text-sm sm:text-lg text-gray-700 max-w-2xl">
            Find textbooks, printouts, handwritten notes, and solved papers — all in one place.
          </p>
        </div>
        <Link href="/books/upload">
          <NeoButton size="lg" className="w-full md:w-auto">
            Post a Listing
          </NeoButton>
        </Link>
      </div>

      <NeoCard className="mb-8 p-4 sm:p-6 bg-white border-4 border-black shadow-neo">
        <div className="flex flex-wrap items-center gap-2 mb-6 border-b-2 border-black/10 pb-4">
          {TYPE_FILTERS.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-4 py-2 text-sm font-bold border-2 border-black rounded-full transition-all ${
                selectedType === type
                  ? "bg-neo-blue text-white shadow-[2px_2px_0px_rgba(0,0,0,1)] translate-y-[-2px]"
                  : "bg-white text-black hover:bg-gray-100"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1">
            <label className="block text-xs font-bold uppercase mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <NeoInput
                placeholder="Title, author, branch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold uppercase mb-1">Branch</label>
            <NeoSelect 
              value={selectedBranch}
              onChange={setSelectedBranch}
              options={BRANCHES.map(b => ({ label: b, value: b }))}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase mb-1">Slot</label>
            <NeoSelect 
              value={selectedSlot}
              onChange={setSelectedSlot}
              options={SLOTS.map(s => ({ label: s === "All" ? "All Slots" : s, value: s }))}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase mb-1">Sort By</label>
            <NeoSelect 
              value={selectedSort}
              onChange={setSelectedSort}
              options={SORT_OPTIONS.map(s => ({ label: s, value: s }))}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-4 border-t-2 border-black/10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold mr-2">Availability:</span>
            {AVAILABILITY_FILTERS.map((status) => (
              <button
                key={status}
                onClick={() => setSelectedAvailability(status)}
                className={`px-3 py-1.5 text-xs font-bold border-2 border-black rounded-md transition-all ${
                  selectedAvailability === status
                    ? "bg-neo-green text-black shadow-[2px_2px_0px_rgba(0,0,0,1)] translate-y-[-2px]"
                    : "bg-white text-black hover:bg-gray-100"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-sm font-bold text-red-600 hover:text-red-800 transition-colors"
            >
              <X size={16} />
              Clear All Filters
            </button>
          )}
        </div>
      </NeoCard>

      <div ref={containerRef}>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse border-4 border-black bg-gray-200 h-80 shadow-neo rounded-xl"></div>
            ))}
          </div>
        ) : isError ? (
          <div className="py-16 text-center border-4 border-black bg-neo-red/20 shadow-neo rounded-2xl max-w-2xl mx-auto">
            <h3 className="text-2xl font-black mb-2">Oops! Something went wrong.</h3>
            <p className="font-medium mb-6">We couldn't load the listings. Please try again later.</p>
            <NeoButton onClick={() => window.location.reload()}>Refresh Page</NeoButton>
          </div>
        ) : filteredAndSortedListings.length === 0 ? (
          <div className="py-20 text-center border-4 border-black bg-white shadow-neo rounded-2xl">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-neo-yellow border-4 border-black mb-6">
              <Search size={32} className="text-black" />
            </div>
            <h3 className="text-3xl font-black mb-3">No Listings Found</h3>
            <p className="font-medium text-gray-600 mb-6 max-w-md mx-auto">
              We couldn't find any listings matching your current filters. Try adjusting your search criteria.
            </p>
            {hasActiveFilters && (
              <NeoButton onClick={clearFilters}>
                Clear Filters
              </NeoButton>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredAndSortedListings.map((listing) => (
              <Link 
                key={`${listing.listingType}-${listing.id}`} 
                href={`/${listing.listingType === "book" ? "books" : "notes"}/${listing.id}`}
                className="listing-card group relative block"
              >
                <div className="absolute top-0 right-0 z-10 m-3">
                  {listing.listingType === "book" ? (
                    <div className="inline-flex items-center gap-1 bg-neo-yellow border-2 border-black px-2 py-1 text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                      <Book size={12} /> Book
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1 bg-neo-peach border-2 border-black px-2 py-1 text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                      <FileText size={12} /> Notes
                    </div>
                  )}
                </div>

                <div className="h-full border-4 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] group-hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] group-hover:-translate-y-1 group-hover:-translate-x-1 transition-all duration-200 overflow-hidden flex flex-col rounded-xl">
                  {listing.listingType === "book" ? (
                    <>
                      <div className="h-48 w-full border-b-4 border-black relative bg-gray-100 overflow-hidden">
                        <BookCover src={listing.coverSrc} title={listing.title} author={listing.author || ""} category={listing.branch} className="w-full h-full object-cover" />
                        {!listing.available && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
                            <div className="bg-neo-red border-4 border-black px-4 py-2 transform -rotate-12 shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                              <span className="text-white font-black uppercase tracking-widest text-lg">Rented Out</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-4 flex-grow flex flex-col">
                        <div className="flex gap-2 mb-2 flex-wrap">
                          <span className="bg-neo-yellow border-2 border-black px-2 py-0.5 text-xs font-bold whitespace-nowrap">
                            {listing.branch}
                          </span>
                          {listing.bookType && listing.bookType !== "Textbook" && (
                            <span className="bg-neo-blue/80 text-white border-2 border-black px-2 py-0.5 text-xs font-bold whitespace-nowrap">
                              {listing.bookType}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-lg leading-tight mb-1 line-clamp-2">{listing.title}</h3>
                        {listing.author && <p className="text-sm font-medium text-gray-600 mb-3 line-clamp-1">{listing.author}</p>}
                        
                        <div className="mt-auto pt-3 flex items-center justify-between">
                          <SlotBadges slot={listing.slot} rentedSlots={listing.rentedSlots} />
                          {listing.price !== undefined && (
                            <span className="bg-neo-green border-2 border-black px-2 py-1 text-sm font-black whitespace-nowrap shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                              ₹{listing.price}
                            </span>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h-40 w-full border-b-4 border-black relative bg-gray-100">
                        <NoteCover src={listing.coverSrc} title={listing.title} subject={listing.branch} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-4 flex-grow flex flex-col">
                        <div className="flex gap-2 mb-2 flex-wrap">
                          <span className="bg-neo-yellow border-2 border-black px-2 py-0.5 text-xs font-bold whitespace-nowrap">
                            {listing.branch}
                          </span>
                          {listing.upvotes !== undefined && (
                            <span className="inline-flex items-center gap-1 bg-white border-2 border-black px-2 py-0.5 text-xs font-bold whitespace-nowrap">
                              <ThumbsUp size={12} className={listing.isUpvoted ? "fill-black" : ""} /> {listing.upvotes}
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-lg leading-tight mb-1 line-clamp-2">{listing.title}</h3>
                        {listing.description && (
                          <p className="text-xs font-medium text-gray-600 mb-3 line-clamp-2">{listing.description}</p>
                        )}
                        
                        <div className="mt-auto pt-3">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-bold text-gray-500">
                              By {listing.uploaderName ? formatStudentName(listing.uploaderName) : "Unknown"}
                            </span>
                            {listing.price ? (
                              <span className="bg-neo-green border-2 border-black px-2 py-1 text-sm font-black shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                                ₹{listing.price}
                              </span>
                            ) : (
                              <span className="bg-white border-2 border-black px-2 py-1 text-xs font-bold shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                                FREE
                              </span>
                            )}
                          </div>
                          <SlotBadges slot={listing.slot} variant="purple" />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="animate-pulse flex flex-col gap-8">
          <div className="h-32 bg-gray-200 border-4 border-black rounded-xl"></div>
          <div className="h-48 bg-gray-200 border-4 border-black rounded-xl"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <div key={i} className="h-80 bg-gray-200 border-4 border-black rounded-xl"></div>)}
          </div>
        </div>
      </div>
    }>
      <BrowseContent />
    </Suspense>
  );
}
