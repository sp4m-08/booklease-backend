"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { NeoCard } from "@/components/ui/NeoCard";
import { NeoButton } from "@/components/ui/NeoButton";
import { NeoSelect } from "@/components/ui/NeoSelect";
import { BookCover } from "@/components/BookCover";
import { SlotBadges } from "@/components/SlotBadges";
import Link from "next/link";
import { ArrowLeft, Heart, MessageSquare, Trash2, Calendar, UserCheck, BookOpen, Bell } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";

export default function BookDetailsPage() {
  const { id } = useParams();
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rentalNote, setRentalNote] = useState("");
  const [rentDuration, setRentDuration] = useState("A1");

  // Fetch Book Data
  const { data: book, isLoading, error } = useQuery({
    queryKey: ["book", id],
    queryFn: async () => {
      const response = await api.get(`/book/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  // Fetch Wishlist to check if currently wishlisted
  const { data: wishlist } = useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const res = await api.get("/book/wishlist");
      return res.data || [];
    },
    enabled: !!user,
  });

  const isWishlisted = wishlist?.some((item: any) => item.book_id === Number(id) || item.book?.id === Number(id));

  // Wishlist Mutations
  const addToWishlistMutation = useMutation({
    mutationFn: async () => api.post(`/book/${id}/wishlist`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Added to wishlist!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to add to wishlist.");
    }
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: async () => api.delete(`/book/${id}/wishlist`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Removed from wishlist!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to remove from wishlist.");
    }
  });

  // Rental Request Mutation
  const rentMutation = useMutation({
    mutationFn: async () => {
      let durationStr = rentDuration;
      if (rentDuration === "custom") {
        const customVal = (document.getElementById("customDaysInput") as HTMLInputElement)?.value;
        if (!customVal || parseInt(customVal) < 1) {
          throw new Error("Please enter a valid number of days for the custom duration.");
        }
        durationStr = `${customVal} days`;
      }
      return api.post("/rentals/", {
        book_id: parseInt(id as string),
        description: rentalNote || `Requested for ${durationStr} lease.`
      });
    },
    onSuccess: () => {
      setIsRentModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["book", id] });
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
      toast.success("Rental request submitted! The owner has been notified.");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to send rental request.");
    }
  });

  // Waitlist Status
  const { data: waitlistData } = useQuery({
    queryKey: ["waitlist", id],
    queryFn: async () => {
      const res = await api.get(`/book/${id}/waitlist`);
      return res.data;
    },
    enabled: !!user,
  });

  const isWaitlisted = waitlistData?.waitlisted || false;

  const joinWaitlistMutation = useMutation({
    mutationFn: async () => api.post(`/book/${id}/waitlist`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waitlist", id] });
      toast.success("Joined waitlist! You'll be notified when it's returned.");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to join waitlist.");
    }
  });

  const leaveWaitlistMutation = useMutation({
    mutationFn: async () => api.delete(`/book/${id}/waitlist`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["waitlist", id] });
      toast.success("Left waitlist.");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to leave waitlist.");
    }
  });

  // Delete Book Mutation (for owner or admin)
  const deleteBookMutation = useMutation({
    mutationFn: async () => api.delete(`/book/${id}`),
    onSuccess: () => {
      toast.success("Book deleted successfully!");
      router.push("/books");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete book.");
    }
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!isLoading && book && containerRef.current) {
      gsap.from(".animate-element", {
        y: 40,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out"
      });
    }
  }, [isLoading, book]);

  if (isLoading) {
    return (
      <div className="flex-grow flex items-center justify-center p-12">
        <div className="animate-spin w-16 h-16 border-8 border-black border-t-neo-yellow rounded-full" />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-12 text-center">
        <div className="bg-red-200 border-4 border-black p-8 font-black text-2xl shadow-neo max-w-lg mb-6">
          Book not found or unavailable.
        </div>
        <Link href="/books">
          <NeoButton variant="primary" className="flex items-center gap-2"><ArrowLeft size={18} /> Back to Library</NeoButton>
        </Link>
      </div>
    );
  }

  const isOwner = userProfile?.id === book.uploaded_by;
  const canDelete = isOwner || userProfile?.is_admin;

  return (
    <div ref={containerRef} className="max-w-6xl mx-auto w-full px-6 py-12 flex-grow">
      {/* Back Link */}
      <div className="mb-8 flex justify-between items-center animate-element">
        <Link href="/books">
          <NeoButton variant="secondary" className="bg-white flex items-center gap-2">
            <ArrowLeft size={18} />
            Back to Library
          </NeoButton>
        </Link>

        {canDelete && (
          <NeoButton 
            variant="danger"
            onClick={() => {
              if (confirm(`Are you sure you want to delete "${book.title}"?`)) {
                deleteBookMutation.mutate();
              }
            }}
            disabled={deleteBookMutation.isPending}
            className="flex items-center gap-2"
          >
            <Trash2 size={18} />
            Delete Listing
          </NeoButton>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Column: Book Cover */}
        <div className="lg:col-span-5 animate-element">
          <div className="border-4 border-black shadow-neo-lg aspect-[3/4] overflow-hidden bg-white">
            <BookCover 
              src={book.cover_image} 
              title={book.title} 
              author={book.author} 
              category={book.category} 
            />
          </div>
          
          <div className="mt-4 flex justify-between items-center p-4 border-4 border-black bg-white shadow-neo">
            <div>
              <span className="text-xs font-black uppercase text-gray-600 block">Status</span>
              <span className={`font-black text-lg flex items-center gap-2 ${book.available ? "text-green-600" : "text-red-500"}`}>
                <span className={`w-3 h-3 rounded-full border-2 border-black ${book.available ? "bg-green-500" : "bg-red-500"}`}></span>
                {book.available ? "Available for Rent" : "Currently Rented Out"}
              </span>
            </div>
            <span className="border-2 border-black px-3 py-1 bg-neo-yellow font-black text-xs uppercase shadow-sm">
              {book.category || "General"}
            </span>
          </div>
        </div>

        {/* Right Column: Book Details & Actions */}
        <div className="lg:col-span-7 space-y-8">
          <div className="animate-element">
            <div className="flex flex-wrap gap-2 mb-3 items-center">
              <span className="inline-block border-2 border-black bg-neo-purple px-3 py-1 font-black text-xs uppercase shadow-neo">
                {book.category || "Academic Textbook"}
              </span>
              <SlotBadges slot={book.slot} variant="yellow" />
              <span className="inline-block border-2 border-black bg-neo-green px-3 py-1 font-black text-sm uppercase shadow-neo">
                {book.price && book.price > 0 ? `₹${book.price} Rent` : "FREE to Rent"}
              </span>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-black mb-2 leading-tight">
              {book.title}
            </h1>
            <p className="text-2xl font-bold text-gray-700">by {book.author || "Unknown Author"}</p>
          </div>

          {/* Description */}
          <NeoCard color="white" className="p-6 animate-element">
            <div className="flex justify-between items-center mb-3 border-b-2 border-black pb-2">
              <h3 className="font-serif text-xl font-black">
                Book Condition & Description
              </h3>
              {book.condition && (
                <span className="bg-neo-yellow border-2 border-black px-2 py-0.5 text-xs font-black uppercase">
                  {book.condition}
                </span>
              )}
            </div>
            <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">
              {book.description || "The uploader has not provided a specific description for this book. Inquire with the owner for edition or condition details."}
            </p>
          </NeoCard>

          {/* Owner Info Card */}
          <NeoCard color="peach" className="p-6 animate-element">
            <div className="flex items-center gap-3 mb-4 border-b-2 border-black pb-3">
              <UserCheck size={24} />
              <h3 className="font-serif text-xl font-black">Listed By Campus Student</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-medium">
              <div>
                <span className="text-xs font-black uppercase text-gray-700 block">Student Name</span>
                <span className="font-bold text-base">
                  {book.uploader?.username ? book.uploader.username.replace(/\b\d{2}[A-Z]{3}\d{4}\b/gi, '').trim() : "Verified Student"}
                </span>
              </div>
            </div>

            {book.uploader?.phone_number && (
              <div className="mt-4 pt-3 border-t-2 border-dashed border-black">
                {user ? (
                  <a 
                    href={`https://wa.me/91${book.uploader.phone_number}?text=Hi, I saw your book "${book.title}" on BookLease and I'm interested in renting it!`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <NeoButton variant="primary" size="sm" className="w-full bg-[#25D366] text-white border-black group hover:scale-105 transition-transform">
                      <MessageSquare size={16} className="inline mr-2 group-hover:animate-bounce" />
                      Chat with Owner on WhatsApp
                    </NeoButton>
                  </a>
                ) : (
                  <NeoButton 
                    variant="primary" 
                    size="sm" 
                    className="w-full bg-[#25D366] text-white border-black group hover:scale-105 transition-transform"
                    onClick={() => {
                      toast.error("Please sign in to contact the owner.");
                      router.push("/login");
                    }}
                  >
                    <MessageSquare size={16} className="inline mr-2 group-hover:animate-bounce" />
                    Sign In to WhatsApp Owner
                  </NeoButton>
                )}
              </div>
            )}
          </NeoCard>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 pt-4 animate-element">
            {isOwner ? (
              <div className="border-4 border-black bg-neo-yellow px-6 py-4 font-bold text-lg shadow-neo w-full text-center flex justify-center items-center gap-2">
                <span className="w-5 h-5 bg-black text-neo-yellow rounded-full flex items-center justify-center text-xs">i</span> You listed this book for rent.
              </div>
            ) : book.available ? (
              <NeoButton 
                variant="primary" 
                size="lg" 
                onClick={() => {
                  if (!user) {
                    router.push("/login");
                    return;
                  }
                  if (book.slot) {
                    const firstSlot = book.slot.split(',')[0].trim();
                    setRentDuration(firstSlot);
                  } else {
                    setRentDuration("A1");
                  }
                  setIsRentModalOpen(true);
                }}
                className="flex-1 min-w-[200px] text-xl bg-neo-green flex items-center justify-center gap-2 group hover:scale-105 transition-transform"
              >
                Request to Rent 
                <BookOpen size={24} className="group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" />
              </NeoButton>
            ) : (
              <NeoButton 
                variant="primary" 
                size="lg" 
                onClick={() => {
                  if (!user) {
                    router.push("/login");
                    return;
                  }
                  if (isWaitlisted) {
                    leaveWaitlistMutation.mutate();
                  } else {
                    joinWaitlistMutation.mutate();
                  }
                }}
                className={`flex-1 min-w-[200px] text-xl flex items-center justify-center gap-2 group hover:scale-105 transition-transform ${isWaitlisted ? 'bg-neo-blue text-white' : 'bg-gray-200'}`}
              >
                {isWaitlisted ? "On Waitlist" : "Join Waitlist"}
                <Bell size={20} className={isWaitlisted ? "fill-white" : ""} />
              </NeoButton>
            )}

            <button
              onClick={() => {
                if (!user) {
                  router.push("/login");
                  return;
                }
                if (isWishlisted) {
                  removeFromWishlistMutation.mutate();
                } else {
                  addToWishlistMutation.mutate();
                }
              }}
              className={`border-4 border-black px-6 py-4 font-black text-lg shadow-neo hover:shadow-neo-hover active:shadow-neo-active transition-all flex items-center gap-2 group hover:scale-105 ${
                isWishlisted ? "bg-neo-yellow" : "bg-white"
              }`}
            >
              <Heart size={20} className={`group-hover:scale-110 transition-transform ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
              {isWishlisted ? "Saved in Wishlist" : "Add to Wishlist"}
            </button>
          </div>
        </div>
      </div>

      {/* Rental Request Modal Dialog */}
      {isRentModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-black p-8 max-w-lg w-full shadow-neo-lg space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start border-b-4 border-black pb-4">
              <div>
                <h3 className="font-serif text-3xl font-black">Request to Rent</h3>
                <p className="text-sm font-bold text-gray-600 mt-1">{book.title}</p>
              </div>
              <button 
                onClick={() => setIsRentModalOpen(false)}
                className="border-2 border-black px-3 py-1 font-black text-lg bg-gray-200 hover:bg-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-bold mb-2 text-base">Desired Exam Slot / Duration</label>
                <NeoSelect
                  value={rentDuration}
                  onChange={(val) => setRentDuration(val)}
                  options={
                    book.slot
                      ? [
                          ...book.slot.split(',').map((s: string) => ({ label: s.trim(), value: s.trim() })),
                          { label: "Custom (Select Days)", value: "custom" }
                        ]
                      : [
                          { label: "A1", value: "A1" },
                          { label: "A2", value: "A2" },
                          { label: "B1", value: "B1" },
                          { label: "B2", value: "B2" },
                          { label: "C1", value: "C1" },
                          { label: "C2", value: "C2" },
                          { label: "D1", value: "D1" },
                          { label: "D2", value: "D2" },
                          { label: "E1", value: "E1" },
                          { label: "E2", value: "E2" },
                          { label: "F1", value: "F1" },
                          { label: "F2", value: "F2" },
                          { label: "G1", value: "G1" },
                          { label: "G2", value: "G2" },
                          { label: "Custom (Select Days)", value: "custom" }
                        ]
                  }
                  className="mb-3"
                />

                {rentDuration === "custom" && (
                  <div className="flex items-center gap-3 mt-3">
                    <input 
                      type="number"
                      min="1"
                      max="365"
                      id="customDaysInput"
                      placeholder="e.g. 10"
                      className="w-full border-4 border-black p-3 font-bold bg-white focus:outline-none"
                    />
                    <span className="font-bold whitespace-nowrap">Days</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold mb-2 text-base">Message / Handover Spot (Optional)</label>
                <textarea
                  value={rentalNote}
                  onChange={(e) => setRentalNote(e.target.value)}
                  rows={3}
                  placeholder="e.g. Hi! Need this book for CAT-2 revision. Can meet near SJT or Block L for handover."
                  className="w-full border-4 border-black p-3 font-medium focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t-4 border-black">
              <NeoButton 
                variant="secondary" 
                className="w-1/2 bg-white"
                onClick={() => setIsRentModalOpen(false)}
              >
                Cancel
              </NeoButton>
              <NeoButton 
                variant="primary" 
                className="w-1/2 bg-neo-green text-black"
                onClick={() => rentMutation.mutate()}
                disabled={rentMutation.isPending}
              >
                {rentMutation.isPending ? "Sending..." : "Submit Request"}
              </NeoButton>
            </div>
          </div>
        </div>
      )}

      {/* Edit Listing Modal */}
      {book && (
        <EditListingModal
          isOpen={isEditModalOpen}
          type="book"
          item={book}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["book", id] });
            queryClient.invalidateQueries({ queryKey: ["books"] });
            queryClient.invalidateQueries({ queryKey: ["mybooks"] });
          }}
        />
      )}
    </div>
  );
}
