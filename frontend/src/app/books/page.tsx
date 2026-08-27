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

interface Book {
  id: number;
  title: string;
  author: string;
  category: string;
  cover_image: string;
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

  const categories = ["All", "Engineering", "Medical", "Business", "Fiction", "Other"];

  const filteredBooks = useMemo(() => {
    if (!books) return [];
    return books.filter((book) => {
      const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            book.author.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "All" || book.category === selectedCategory;
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
          <h1 className="font-serif text-5xl font-black mb-2">Library</h1>
          <p className="font-medium text-xl text-gray-700">Find the textbooks you need for this semester.</p>
        </div>
        <Link href="/books/upload">
          <NeoButton variant="primary" size="lg">Upload a Book</NeoButton>
        </Link>
      </div>

      {/* Discovery / Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-6 mb-12">
        <div className="flex-grow">
          <NeoInput 
            placeholder="Search by title or author..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {categories.map((cat) => (
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
        <div className="p-12 text-center font-bold text-xl border-4 border-black bg-red-100">Failed to load books.</div>
      ) : books?.length === 0 ? (
        <div className="p-12 text-center font-bold text-2xl border-4 border-black border-dashed bg-white shadow-neo">
          No books available right now. Be the first to upload one!
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
                <div className="aspect-[3/4] w-full border-b-4 border-black bg-neo-blue relative overflow-hidden flex-shrink-0">
                  {book.cover_image ? (
                    <img src={book.cover_image} alt={book.title} className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-serif text-3xl opacity-50 p-4 text-center">
                      {book.title}
                    </div>
                  )}
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
                  <div className="mt-4 inline-block border-2 border-black bg-neo-yellow px-2 py-1 text-xs font-bold self-start shadow-neo">
                    {book.category || "Uncategorized"}
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
