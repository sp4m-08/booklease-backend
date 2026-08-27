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

interface Book {
  id: number;
  title: string;
  author: string;
  category: string;
  cover_image: string;
  price?: number;
  available: boolean;
}

export default function BooksPage() {
  const container = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const { data: books, isLoading, error } = useQuery<Book[]>({
    queryKey: ["books"],
    queryFn: async () => {
      const response = await api.get("/book/");
      return response.data;
    },
  });

  const branches = ["All", "CSE", "ECE", "EEE", "Mechanical", "Biotech", "Civil", "Common"];

  const filteredBooks = useMemo(() => {
    if (!books) return [];
    return books.filter((book) => {
      const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (book.category || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "All" || 
                              book.category?.toLowerCase() === selectedCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [books, searchTerm, selectedCategory]);

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

  return (
    <div ref={container} className="max-w-7xl mx-auto w-full px-8 py-12 flex-grow">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b-4 border-black pb-6 gap-6">
        <div>
          <div className="inline-block border-2 border-black px-3 py-0.5 bg-neo-yellow font-black text-xs uppercase mb-2 shadow-sm">
            🎓 VIT Vellore Library
          </div>
          <h1 className="font-serif text-5xl font-black mb-2">Course Reference Books</h1>
          <p className="font-medium text-xl text-gray-700">Find and rent syllabus textbooks for your CAT-1, CAT-2, and FAT exam preparation.</p>
        </div>
        <Link href="/books/upload">
          <NeoButton variant="primary" size="lg" className="bg-neo-green text-black">List a Book for Rent</NeoButton>
        </Link>
      </div>

      {/* Discovery / Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-6 mb-12">
        <div className="flex-grow">
          <NeoInput 
            placeholder="Search by course code, title, or author (e.g. DSD, Cormen, OS, Microprocessors)..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {branches.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`border-2 border-black px-4 py-2 font-bold text-sm transition-all ${
                selectedCategory === cat 
                  ? "bg-black text-white shadow-neo" 
                  : "bg-white text-black hover:bg-gray-100"
              }`}
            >
              {cat}
            </button>
          ))}
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
          No textbooks listed for rent right now. Be the first VITian to list one!
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="p-12 text-center font-bold text-xl border-4 border-black bg-neo-yellow shadow-neo">
          No books found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
                  <div className="mt-4 flex justify-between items-center">
                    <span className="border-2 border-black bg-neo-yellow px-2 py-1 text-xs font-bold shadow-sm">
                      {book.category || "Uncategorized"}
                    </span>
                    <span className="border-2 border-black bg-neo-green px-2 py-1 text-xs font-black shadow-sm">
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
