"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { NeoCard } from "@/components/ui/NeoCard";
import { NeoButton } from "@/components/ui/NeoButton";
import { NeoInput } from "@/components/ui/NeoInput";
import { BookCover } from "@/components/BookCover";
import { NoteCover } from "@/components/NoteCover";
import { BookOpen, FileText, Heart, User as UserIcon, Trash2, ExternalLink } from "lucide-react";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState("");
  const [activeTab, setActiveTab] = useState<"books" | "notes" | "wishlist">("books");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  // Fetch User Profile
  const { data: profile, isLoading: loadingProfile, error: profileError } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      try {
        const res = await api.get("/user/");
        return res.data;
      } catch (err: any) {
        if (err.response?.status === 404) {
          await api.post("/user/signup").catch(() => {});
          const res2 = await api.get("/user/");
          return res2.data;
        }
        throw err;
      }
    },
    enabled: !!user,
  });

  // Fetch Wishlist
  const { data: wishlist, isLoading: loadingWishlist } = useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const res = await api.get("/book/wishlist");
      return res.data || [];
    },
    enabled: !!user,
  });

  // Fetch My Uploaded Books
  const { data: myBooks, isLoading: loadingMyBooks } = useQuery({
    queryKey: ["mybooks"],
    queryFn: async () => {
      const res = await api.get("/book/mybooks");
      return res.data || [];
    },
    enabled: !!user,
  });

  // Fetch My Uploaded Notes
  const { data: myNotes, isLoading: loadingMyNotes } = useQuery({
    queryKey: ["mynotes"],
    queryFn: async () => {
      const res = await api.get("/notes/mynotes");
      return res.data || [];
    },
    enabled: !!user,
  });

  // Update Phone Mutation
  const updatePhone = useMutation({
    mutationFn: async (phoneNumber: string) => {
      return api.post("/user/phone", { phone_number: phoneNumber });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Phone number updated successfully!");
      setPhone("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to update phone number.");
    }
  });

  // Delete Book Mutation
  const deleteBook = useMutation({
    mutationFn: async (bookId: number) => {
      return api.delete(`/book/${bookId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mybooks"] });
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast.success("Book listing deleted!");
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
      toast.success("Note deleted successfully!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete note.");
    }
  });

  // Remove from Wishlist Mutation
  const removeFromWishlist = useMutation({
    mutationFn: async (bookId: number) => {
      return api.delete(`/book/${bookId}/wishlist`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Removed from wishlist!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to remove from wishlist.");
    }
  });

  if (loading || (loadingProfile && !profileError)) {
    return (
      <div className="p-12 text-center font-bold text-2xl animate-pulse">
        Loading profile details...
      </div>
    );
  }

  if (profileError || (!profile && !loadingProfile)) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 border-4 border-black bg-neo-yellow shadow-neo text-center space-y-4">
        <h2 className="font-serif text-3xl font-black">Backend Server Offline</h2>
        <p className="font-medium text-gray-800">
          Cannot connect to the Go API backend on <code className="bg-white px-2 py-0.5 border border-black font-bold">http://localhost:8080</code>.
        </p>
        <p className="text-sm text-gray-700">
          Please make sure your Go server is running (<code className="bg-white px-1 border border-black">go run main.go</code> in the backend terminal).
        </p>
        <NeoButton variant="primary" onClick={() => queryClient.invalidateQueries({ queryKey: ["profile"] })}>
          Retry Connection 🔄
        </NeoButton>
      </div>
    );
  }

  if (!user || !profile) return null;

  return (
    <div className="max-w-6xl mx-auto w-full px-6 py-12 flex-grow">
      {/* Header */}
      <div className="mb-12 border-b-4 border-black pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-5xl font-black mb-2">Your Student Profile</h1>
          <p className="font-medium text-lg text-gray-700">Manage your account, listings, notes, and saved items.</p>
        </div>
        {profile.is_admin && (
          <Link href="/admin">
            <span className="border-4 border-black bg-red-500 text-white font-black px-4 py-2 text-sm shadow-neo hover:bg-red-600 inline-block">
              🛡️ Admin Moderation Panel
            </span>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
        
        {/* User Details Sidebar */}
        <div className="lg:col-span-1 space-y-8">
          <NeoCard color="purple" className="flex flex-col space-y-6">
            <div className="flex items-center gap-3 border-b-4 border-black pb-4">
              <div className="w-12 h-12 border-3 border-black bg-neo-yellow flex items-center justify-center font-black text-2xl shadow-neo">
                {profile.username?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <h2 className="font-serif text-2xl font-black">{profile.username}</h2>
                <span className="text-xs font-bold bg-white px-2 py-0.5 border-2 border-black inline-block">
                  {profile.is_admin ? "Administrator" : "Verified Student"}
                </span>
              </div>
            </div>

            <div className="space-y-4 font-medium text-base">
              <div>
                <span className="text-xs font-black uppercase text-gray-700 block">Email Address</span>
                <span className="font-bold break-all">{profile.email}</span>
              </div>
              <div>
                <span className="text-xs font-black uppercase text-gray-700 block">Registration Number</span>
                <span className="font-bold">{profile.registration_no || "N/A"}</span>
              </div>
              <div>
                <span className="text-xs font-black uppercase text-gray-700 block">WhatsApp / Phone</span>
                <span className="font-bold">{profile.phone_number || "Not Set (Add below to receive WhatsApp messages)"}</span>
              </div>
            </div>
            
            <div className="pt-6 border-t-4 border-black">
              <label className="block font-bold mb-2 text-sm">Update WhatsApp / Phone Number</label>
              <div className="flex flex-col gap-3">
                <NeoInput 
                  placeholder="10-digit mobile number (e.g. 9876543210)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <NeoButton 
                  variant="primary"
                  onClick={() => updatePhone.mutate(phone)}
                  disabled={updatePhone.isPending || !phone}
                  className="w-full bg-neo-yellow"
                >
                  {updatePhone.isPending ? "Saving..." : "Save Phone Number"}
                </NeoButton>
              </div>
            </div>
          </NeoCard>
        </div>

        {/* Tabbed Content Sections */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Navigation Tabs */}
          <div className="flex flex-wrap gap-3 border-b-4 border-black pb-4">
            <button
              onClick={() => setActiveTab("books")}
              className={`flex items-center gap-2 border-4 border-black px-4 py-2 font-bold text-base transition-all ${
                activeTab === "books" ? "bg-neo-green shadow-neo" : "bg-white hover:bg-gray-100"
              }`}
            >
              <BookOpen size={18} />
              My Books ({myBooks?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`flex items-center gap-2 border-4 border-black px-4 py-2 font-bold text-base transition-all ${
                activeTab === "notes" ? "bg-neo-blue shadow-neo" : "bg-white hover:bg-gray-100"
              }`}
            >
              <FileText size={18} />
              My Notes ({myNotes?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("wishlist")}
              className={`flex items-center gap-2 border-4 border-black px-4 py-2 font-bold text-base transition-all ${
                activeTab === "wishlist" ? "bg-neo-peach shadow-neo" : "bg-white hover:bg-gray-100"
              }`}
            >
              <Heart size={18} />
              Wishlist ({wishlist?.length || 0})
            </button>
          </div>

          {/* TAB 1: My Uploaded Books */}
          {activeTab === "books" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-serif text-2xl font-black">Books Listed for Rent</h3>
                <Link href="/books/upload">
                  <NeoButton variant="primary" size="sm">List New Book +</NeoButton>
                </Link>
              </div>

              {loadingMyBooks ? (
                <div className="p-8 text-center font-bold">Loading your books...</div>
              ) : (!myBooks || myBooks.length === 0) ? (
                <div className="p-8 text-center border-4 border-black border-dashed bg-white shadow-sm">
                  <p className="font-medium text-gray-600 mb-4">You haven't listed any books for rent yet.</p>
                  <Link href="/books/upload">
                    <NeoButton variant="primary">List Your First Book</NeoButton>
                  </Link>
                </div>
              ) : (
                myBooks.map((book: any) => (
                  <NeoCard key={book.id} color="white" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex gap-4 items-center overflow-hidden">
                      <div className="w-16 h-20 border-2 border-black flex-shrink-0 overflow-hidden">
                        <BookCover src={book.cover_image} title={book.title} />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-bold text-xl truncate">{book.title}</h4>
                        <p className="text-sm font-medium text-gray-600">{book.author}</p>
                        <div className="flex gap-2 mt-1 items-center">
                          <span className={`inline-block text-xs font-black px-2 py-0.5 border border-black ${
                            book.available ? "bg-neo-green text-black" : "bg-red-400 text-white"
                          }`}>
                            {book.available ? "Available" : "Rented Out"}
                          </span>
                          <span className="inline-block text-xs font-black px-2 py-0.5 border border-black bg-neo-yellow">
                            {book.price && book.price > 0 ? `₹${book.price}` : "FREE"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto shrink-0">
                      <Link href={`/books/${book.id}`} className="flex-1 sm:flex-none">
                        <NeoButton variant="primary" size="sm" className="w-full">View</NeoButton>
                      </Link>
                      <NeoButton 
                        variant="danger"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${book.title}"?`)) {
                            deleteBook.mutate(book.id);
                          }
                        }}
                        disabled={deleteBook.isPending}
                      >
                        Delete
                      </NeoButton>
                    </div>
                  </NeoCard>
                ))
              )}
            </div>
          )}

          {/* TAB 2: My Uploaded Notes */}
          {activeTab === "notes" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-serif text-2xl font-black">Your Shared Study Material</h3>
                <Link href="/notes/upload">
                  <NeoButton variant="primary" size="sm">Upload Note +</NeoButton>
                </Link>
              </div>

              {loadingMyNotes ? (
                <div className="p-8 text-center font-bold">Loading your notes...</div>
              ) : (!myNotes || myNotes.length === 0) ? (
                <div className="p-8 text-center border-4 border-black border-dashed bg-white shadow-sm">
                  <p className="font-medium text-gray-600 mb-4">You haven't uploaded any study notes yet.</p>
                  <Link href="/notes/upload">
                    <NeoButton variant="primary">Share Your First Note</NeoButton>
                  </Link>
                </div>
              ) : (
                myNotes.map((note: any) => (
                  <NeoCard key={note.id} color="white" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex gap-4 items-center overflow-hidden">
                      <div className="w-16 h-20 border-2 border-black flex-shrink-0 overflow-hidden bg-white">
                        <NoteCover src={note.file_path} title={note.title} subject={note.subject} />
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex gap-2 mb-1 items-center">
                          <span className="text-xs font-black uppercase bg-neo-yellow px-2 py-0.5 border border-black inline-block">
                            {note.subject || "General"}
                          </span>
                          <span className="text-xs font-black uppercase bg-neo-green px-2 py-0.5 border border-black inline-block">
                            {note.price && note.price > 0 ? `₹${note.price}` : "FREE"}
                          </span>
                        </div>
                        <h4 className="font-bold text-xl truncate">{note.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">Uploaded on {new Date(note.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto shrink-0">
                      <Link href={`/notes/${note.id}`} className="flex-1 sm:flex-none">
                        <NeoButton variant="primary" size="sm" className="w-full">View</NeoButton>
                      </Link>
                      <NeoButton 
                        variant="danger"
                        size="sm"
                        className="flex-1 sm:flex-none"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete note "${note.title}"?`)) {
                            deleteNote.mutate(note.id);
                          }
                        }}
                        disabled={deleteNote.isPending}
                      >
                        Delete
                      </NeoButton>
                    </div>
                  </NeoCard>
                ))
              )}
            </div>
          )}

          {/* TAB 3: Wishlist */}
          {activeTab === "wishlist" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-serif text-2xl font-black">Saved for Later</h3>
                <Link href="/books">
                  <NeoButton variant="secondary" size="sm" className="bg-white">Browse Library</NeoButton>
                </Link>
              </div>

              {loadingWishlist ? (
                <div className="p-8 text-center font-bold">Loading your wishlist...</div>
              ) : (!wishlist || wishlist.length === 0) ? (
                <div className="p-8 text-center border-4 border-black border-dashed bg-white shadow-sm">
                  <p className="font-medium text-gray-600 mb-4">Your wishlist is empty.</p>
                  <Link href="/books">
                    <NeoButton variant="primary">Discover Books to Save</NeoButton>
                  </Link>
                </div>
              ) : (
                wishlist.map((item: any) => (
                  <NeoCard key={item.id} color="white" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex gap-4 items-center overflow-hidden">
                      <div className="w-16 h-20 border-2 border-black flex-shrink-0 overflow-hidden">
                        <BookCover src={item.book?.cover_image} title={item.book?.title || "Book"} />
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-bold text-xl truncate">{item.book?.title}</h4>
                        <p className="text-sm font-medium text-gray-600">{item.book?.author}</p>
                        <div className="flex gap-2 mt-1 items-center">
                          <span className={`inline-block text-xs font-black px-2 py-0.5 border border-black ${
                            item.book?.available ? "bg-neo-green text-black" : "bg-red-400 text-white"
                          }`}>
                            {item.book?.available ? "Available" : "Rented Out"}
                          </span>
                          <span className="inline-block text-xs font-black px-2 py-0.5 border border-black bg-neo-yellow">
                            {item.book?.price && item.book.price > 0 ? `₹${item.book.price}` : "FREE"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto shrink-0">
                      <Link href={`/books/${item.book?.id}`} className="flex-1 sm:flex-none">
                        <NeoButton variant="primary" size="sm" className="w-full">View</NeoButton>
                      </Link>
                      <NeoButton 
                        variant="secondary"
                        size="sm"
                        className="flex-1 sm:flex-none text-red-600 bg-white"
                        onClick={() => removeFromWishlist.mutate(item.book?.id)}
                        disabled={removeFromWishlist.isPending}
                      >
                        Remove
                      </NeoButton>
                    </div>
                  </NeoCard>
                ))
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
