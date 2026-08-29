"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { NeoCard } from "@/components/ui/NeoCard";
import { NeoButton } from "@/components/ui/NeoButton";
import { NeoInput } from "@/components/ui/NeoInput";
import { BookCover } from "@/components/BookCover";
import { NoteCover } from "@/components/NoteCover";
import { EditListingModal } from "@/components/EditListingModal";
import { SlotBadges } from "@/components/SlotBadges";
import { BookOpen, FileText, Plus, Trash2, ExternalLink, Search, Sparkles, Edit3 } from "lucide-react";

export default function YourListingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filterTab, setFilterTab] = useState<"all" | "books" | "notes">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingItem, setEditingItem] = useState<{ type: "book" | "note"; item: any } | null>(null);

  // Redirect if not logged in
  if (!loading && !user) {
    if (typeof window !== "undefined") router.push("/login");
  }

  // 1. Fetch User's Books
  const { data: myBooks = [], isLoading: loadingBooks } = useQuery({
    queryKey: ["mybooks"],
    queryFn: async () => {
      const res = await api.get("/book/mybooks");
      return res.data || [];
    },
    enabled: !!user,
  });

  // 2. Fetch User's Notes
  const { data: myNotes = [], isLoading: loadingNotes } = useQuery({
    queryKey: ["mynotes"],
    queryFn: async () => {
      const res = await api.get("/notes/mynotes");
      return res.data || [];
    },
    enabled: !!user,
  });

  // Delete Book Mutation
  const deleteBook = useMutation({
    mutationFn: async (bookId: number) => {
      return api.delete(`/book/${bookId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mybooks"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast.success("Book listing deleted successfully!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete book.");
    }
  });

  // Delete Note Mutation
  const deleteNote = useMutation({
    mutationFn: async (noteId: number) => {
      return api.delete(`/notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mynotes"] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Note listing deleted successfully!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete note.");
    }
  });

  // Filter and search logic
  const filteredBooks = useMemo(() => {
    return myBooks.filter((book: any) => 
      book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [myBooks, searchTerm]);

  const filteredNotes = useMemo(() => {
    return myNotes.filter((note: any) => 
      note.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.subject?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [myNotes, searchTerm]);

  const totalListings = (myBooks?.length || 0) + (myNotes?.length || 0);

  if (loading || (loadingBooks && loadingNotes)) {
    return (
      <div className="p-16 text-center font-bold text-2xl animate-pulse flex-grow">
        Loading your listings...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-12 flex-grow">
      {/* Top Header Banner */}
      <div className="mb-10 border-b-4 border-black pb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-block border-2 border-black px-3 py-1 bg-neo-yellow font-black text-xs uppercase mb-3 shadow-neo">
            🎓 VIT Vellore Student Hub
          </div>
          <h1 className="font-serif text-5xl font-black mb-2">Your Listings</h1>
          <p className="font-medium text-lg text-gray-700">
            Manage all the CAT/FAT course reference books you've listed for rent and the revision notes you've shared with VITians.
          </p>
        </div>

        {/* Quick Action Upload Buttons */}
        <div className="flex flex-wrap gap-3">
          <Link href="/books/upload">
            <NeoButton variant="primary" className="bg-neo-green flex items-center gap-2">
              <Plus size={18} />
              List a Book
            </NeoButton>
          </Link>
          <Link href="/notes/upload">
            <NeoButton variant="primary" className="bg-neo-purple flex items-center gap-2">
              <Plus size={18} />
              Share Notes
            </NeoButton>
          </Link>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <NeoCard color="yellow" className="p-6">
          <span className="text-xs font-black uppercase text-gray-700 block mb-1">Total Active Listings</span>
          <div className="font-serif text-4xl font-black">{totalListings}</div>
          <p className="text-xs font-bold text-gray-600 mt-2">Books + Study Materials</p>
        </NeoCard>

        <NeoCard color="green" className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-black uppercase text-gray-700 block mb-1">Books Listed</span>
              <div className="font-serif text-4xl font-black">{myBooks?.length || 0}</div>
            </div>
            <BookOpen className="w-8 h-8 opacity-40" />
          </div>
          <p className="text-xs font-bold text-gray-600 mt-2">Available for student rental</p>
        </NeoCard>

        <NeoCard color="blue" className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-black uppercase text-gray-700 block mb-1">Notes Uploaded</span>
              <div className="font-serif text-4xl font-black">{myNotes?.length || 0}</div>
            </div>
            <FileText className="w-8 h-8 opacity-40" />
          </div>
          <p className="text-xs font-bold text-gray-600 mt-2">PDFs, Docs & Notes shared</p>
        </NeoCard>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 mb-8">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterTab("all")}
            className={`border-4 border-black px-4 py-2 font-black text-sm transition-all ${
              filterTab === "all" ? "bg-black text-white shadow-neo" : "bg-white hover:bg-gray-100"
            }`}
          >
            All Listings ({totalListings})
          </button>
          <button
            onClick={() => setFilterTab("books")}
            className={`border-4 border-black px-4 py-2 font-black text-sm transition-all ${
              filterTab === "books" ? "bg-neo-green text-black shadow-neo" : "bg-white hover:bg-gray-100"
            }`}
          >
            Books ({myBooks?.length || 0})
          </button>
          <button
            onClick={() => setFilterTab("notes")}
            className={`border-4 border-black px-4 py-2 font-black text-sm transition-all ${
              filterTab === "notes" ? "bg-neo-blue text-black shadow-neo" : "bg-white hover:bg-gray-100"
            }`}
          >
            Notes ({myNotes?.length || 0})
          </button>
        </div>

        <div className="w-full sm:w-72">
          <NeoInput 
            placeholder="Search your listings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Empty State */}
      {totalListings === 0 ? (
        <div className="border-4 border-black border-dashed bg-white p-12 text-center shadow-neo my-8">
          <div className="text-5xl mb-4">📦</div>
          <h3 className="font-serif text-3xl font-black mb-2">No Listings Yet</h3>
          <p className="text-gray-600 font-medium max-w-md mx-auto mb-6">
            You haven't listed any textbooks or notes yet. Start listing to help fellow students and earn!
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/books/upload">
              <NeoButton variant="primary" className="bg-neo-green">List Your First Book</NeoButton>
            </Link>
            <Link href="/notes/upload">
              <NeoButton variant="primary" className="bg-neo-purple">Share Study Notes</NeoButton>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {/* SECTION 1: BOOKS */}
          {(filterTab === "all" || filterTab === "books") && (
            <div>
              <div className="flex justify-between items-center mb-4 border-b-2 border-black pb-2">
                <h2 className="font-serif text-2xl font-black flex items-center gap-2">
                  <BookOpen size={24} />
                  Your Listed Books ({filteredBooks.length})
                </h2>
              </div>

              {filteredBooks.length === 0 ? (
                <div className="p-8 text-center border-2 border-black bg-gray-50 text-gray-500 font-bold">
                  {searchTerm ? "No books match your search." : "No books listed yet."}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredBooks.map((book: any) => (
                    <NeoCard key={book.id} color="white" className="p-0 overflow-hidden flex flex-col justify-between">
                      <div>
                        <div className="aspect-[16/10] w-full border-b-4 border-black overflow-hidden bg-white">
                          <BookCover src={book.cover_image} title={book.title} author={book.author} category={book.category} />
                        </div>
                        <div className="p-5">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex flex-wrap gap-1 items-center">
                              <span className="text-xs font-black uppercase bg-neo-yellow px-2 py-0.5 border border-black shadow-sm">
                                {book.category || "General"}
                              </span>
                              <SlotBadges slot={book.slot} rentedSlots={book.rented_slots} />
                            </div>
                            <span className="text-xs font-black uppercase bg-neo-green px-2 py-0.5 border border-black shadow-sm">
                              {book.price && book.price > 0 ? `₹${book.price} Rent` : "FREE"}
                            </span>
                          </div>

                          <h3 className="font-serif text-2xl font-black mb-1 line-clamp-1">{book.title}</h3>
                          <p className="text-sm font-bold text-gray-600 mb-3">{book.author || "Unknown Author"}</p>

                          <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-block text-xs font-black px-2.5 py-1 border border-black ${
                              book.available ? "bg-neo-green text-black" : "bg-red-400 text-white"
                            }`}>
                              {book.available ? "🟢 Available to Rent" : "🔴 Currently Rented Out"}
                            </span>
                          </div>

                          {book.description && (
                            <p className="text-xs text-gray-600 font-medium line-clamp-2 mt-2 italic bg-gray-50 p-2 border border-black">
                              "{book.description}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="p-5 pt-0 flex gap-2 border-t-2 border-gray-200 mt-2">
                        <Link href={`/books/${book.id}`} className="flex-1">
                          <NeoButton variant="primary" size="sm" className="w-full flex items-center justify-center gap-1">
                            <ExternalLink size={14} /> View
                          </NeoButton>
                        </Link>
                        <NeoButton 
                          variant="secondary" 
                          size="sm"
                          onClick={() => setEditingItem({ type: "book", item: book })}
                          className="bg-neo-yellow hover:bg-yellow-300 flex items-center gap-1"
                        >
                          <Edit3 size={14} /> Edit
                        </NeoButton>
                        <NeoButton 
                          variant="danger" 
                          size="sm"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete listing for "${book.title}"?`)) {
                              deleteBook.mutate(book.id);
                            }
                          }}
                          disabled={deleteBook.isPending}
                          className="flex items-center gap-1"
                        >
                          <Trash2 size={14} /> Delete
                        </NeoButton>
                      </div>
                    </NeoCard>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SECTION 2: STUDY NOTES */}
          {(filterTab === "all" || filterTab === "notes") && (
            <div>
              <div className="flex justify-between items-center mb-4 border-b-2 border-black pb-2">
                <h2 className="font-serif text-2xl font-black flex items-center gap-2">
                  <FileText size={24} />
                  Your Uploaded Study Notes ({filteredNotes.length})
                </h2>
              </div>

              {filteredNotes.length === 0 ? (
                <div className="p-8 text-center border-2 border-black bg-gray-50 text-gray-500 font-bold">
                  {searchTerm ? "No study notes match your search." : "No study notes shared yet."}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredNotes.map((note: any) => (
                    <NeoCard key={note.id} color="white" className="p-0 overflow-hidden flex flex-col justify-between">
                      <div>
                        <div className="aspect-[16/10] w-full border-b-4 border-black overflow-hidden bg-white">
                          <NoteCover src={note.file_path} title={note.title} subject={note.subject} />
                        </div>
                        <div className="p-5">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex flex-wrap gap-1 items-center">
                              <span className="text-xs font-black uppercase bg-neo-yellow px-2 py-0.5 border border-black shadow-sm">
                                {note.subject || "General"}
                              </span>
                              <SlotBadges slot={note.slot} rentedSlots={note.rented_slots} />
                            </div>
                            <span className="text-xs font-black uppercase bg-neo-green px-2 py-0.5 border border-black shadow-sm">
                              {note.price && note.price > 0 ? `₹${note.price}` : "FREE"}
                            </span>
                          </div>

                          <h3 className="font-serif text-2xl font-black mb-1 line-clamp-1">{note.title}</h3>
                          <p className="text-xs text-gray-500 mb-2">Uploaded on {new Date(note.created_at).toLocaleDateString()}</p>
                          <p className="text-sm font-medium text-gray-700 line-clamp-2">{note.description || "Shared note file."}</p>
                        </div>
                      </div>

                      <div className="p-5 pt-0 flex gap-2 border-t-2 border-gray-200 mt-2">
                        <Link href={`/notes/${note.id}`} className="flex-1">
                          <NeoButton variant="primary" size="sm" className="w-full flex items-center justify-center gap-1">
                            <ExternalLink size={14} /> View
                          </NeoButton>
                        </Link>
                        <NeoButton 
                          variant="secondary" 
                          size="sm"
                          onClick={() => setEditingItem({ type: "note", item: note })}
                          className="bg-neo-yellow hover:bg-yellow-300 flex items-center gap-1"
                        >
                          <Edit3 size={14} /> Edit
                        </NeoButton>
                        <NeoButton 
                          variant="danger" 
                          size="sm"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete note "${note.title}"?`)) {
                              deleteNote.mutate(note.id);
                            }
                          }}
                          disabled={deleteNote.isPending}
                          className="flex items-center gap-1"
                        >
                          <Trash2 size={14} /> Delete
                        </NeoButton>
                      </div>
                    </NeoCard>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Edit Listing Modal */}
      {editingItem && (
        <EditListingModal 
          isOpen={!!editingItem}
          type={editingItem.type}
          item={editingItem.item}
          onClose={() => setEditingItem(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["mybooks"] });
            queryClient.invalidateQueries({ queryKey: ["mynotes"] });
            queryClient.invalidateQueries({ queryKey: ["books"] });
            queryClient.invalidateQueries({ queryKey: ["notes"] });
          }}
        />
      )}
    </div>
  );
}
