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
import dynamic from "next/dynamic";
import { ArrowLeft, Heart, MessageSquare, Trash2, Calendar, UserCheck, BookOpen, Bell } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { formatStudentName, getAvailableSlotOptions } from "@/lib/utils";

const EditListingModal = dynamic(
  () => import("@/components/EditListingModal").then((mod) => mod.EditListingModal),
  { ssr: false }
);


export default function BookDetailsPage() {
  const { id } = useParams();
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rentalNote, setRentalNote] = useState("");
  const [rentDuration, setRentDuration] = useState("A1");
  const [customDays, setCustomDays] = useState(7);

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
        const customVal = parseInt(customDays as any);
        if (isNaN(customVal) || customVal < 1) {
          throw new Error("Please enter a valid number of days for the custom duration.");
        }
        durationStr = `${customVal} days`;
      }
      return api.post("/rentals/", {
        book_id: parseInt(id as string),
        description: rentalNote || `Requested for ${durationStr} lease.`,
        slot: rentDuration !== "custom" ? durationStr : ""
      });
    },
    onSuccess: () => {
      setIsRentModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["book", id] });
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
      toast.success("Rental request submitted! The owner has been notified.");
      router.push("/dashboard?tab=borrowed");
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
  }, { dependencies: [isLoading, book], scope: containerRef });

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
    <div ref={containerRef} className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-12 flex-grow">
      {/* Back Link */}
      <div className="mb-6 sm:mb-8 flex justify-between items-center animate-element">
        <Link href="/books">
          <NeoButton variant="secondary" className="bg-white flex items-center gap-2 text-sm sm:text-base">
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
            className="flex items-center gap-2 text-sm sm:text-base"
          >
            <Trash2 size={18} />
            Delete Listing
          </NeoButton>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start">

        {/* Left Column: Book Cover */}
        <div className="lg:col-span-5 animate-element">
          <div className="border-3 sm:border-4 border-black shadow-neo-lg aspect-[3/4] overflow-hidden bg-white">
            <BookCover
              src={book.cover_image}
              title={book.title}
              author={book.author}
              category={book.category}
            />
          </div>

          <div className="mt-4 flex justify-between items-center p-3.5 sm:p-4 border-3 sm:border-4 border-black bg-white shadow-neo">
            <div>
              <span className="text-xs font-black uppercase text-gray-600 block">Status</span>
              <span className={`font-black text-base sm:text-lg flex items-center gap-2 ${book.available ? "text-green-600" : "text-red-500"}`}>
                <span className={`w-3 h-3 rounded-full border-2 border-black ${book.available ? "bg-green-500" : "bg-red-500"}`}></span>
                {book.available ? "Available for Rent" : "Currently Rented Out"}
              </span>
            </div>
            <span className="border-2 border-black px-2.5 sm:px-3 py-1 bg-neo-yellow font-black text-xs uppercase shadow-sm">
              {book.category || "General"}
            </span>
          </div>
        </div>

        {/* Right Column: Book Details & Actions */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8">
          <div className="animate-element">
            <div className="flex flex-wrap gap-2 mb-3 items-center">
              <span className="inline-block border-2 border-black bg-neo-purple px-2.5 sm:px-3 py-0.5 sm:py-1 font-black text-xs uppercase shadow-neo">
                {book.category || "Academic Textbook"}
              </span>
              {book.type && (
                <span className="inline-block border-2 border-black bg-neo-blue/80 px-2.5 sm:px-3 py-0.5 sm:py-1 font-black text-xs uppercase shadow-neo">
                  {book.type}
                </span>
              )}
              <SlotBadges slot={book.slot} rentedSlots={book.rented_slots} variant="yellow" />
              <span className="inline-block border-2 border-black bg-neo-green px-2.5 sm:px-3 py-0.5 sm:py-1 font-black text-xs sm:text-sm uppercase shadow-neo">
                {book.price && book.price > 0 ? `₹${book.price} Rent` : "FREE to Rent"}
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-black mb-2 leading-tight">
              {book.title}
            </h1>
            <p className="text-base sm:text-xl font-bold text-gray-700 mb-4">
              by <span className="text-black">{book.author}</span>
            </p>
          </div>

          <NeoCard color="yellow" className="p-4 sm:p-6 animate-element">
            <h2 className="font-serif text-xl sm:text-2xl font-black mb-3 border-b-2 border-black pb-2">Overview & Condition</h2>
            <div className="space-y-3 font-medium text-sm sm:text-base leading-relaxed">
              <div className="flex justify-between border-b border-black/20 pb-2">
                <span className="font-bold">Book / Item Condition:</span>
                <span className="font-black">{book.condition || "Used - Good Condition"}</span>
              </div>
              <div className="flex justify-between border-b border-black/20 pb-2">
                <span className="font-bold">Subject / Course:</span>
                <span className="font-black">{book.category || "Engineering"}</span>
              </div>
              <div className="pt-2">
                <span className="font-bold block mb-1">Owner&apos;s Notes:</span>
                <p className="text-gray-800 text-sm">
                  {book.description || "Available for flexible duration during CAT-2 and FAT exam preparation. Connect with the owner for edition or condition details."}
                </p>
              </div>
            </div>
          </NeoCard>

          <NeoCard color="peach" className="p-4 sm:p-6 animate-element">
            <div className="flex items-center gap-3 mb-4 border-b-2 border-black pb-2">
              <UserCheck size={22} />
              <h2 className="font-serif text-xl sm:text-2xl font-black">Listed By Campus Student</h2>
            </div>
            <div className="space-y-3 font-medium text-sm sm:text-base">
              <div>
                <span className="text-xs font-black uppercase text-gray-700 block">Owner Name</span>
                <span className="font-bold text-base sm:text-lg">
                  {formatStudentName(book.uploader?.username, "Campus Student")}
                </span>
              </div>
            </div>

            {book.uploader?.phone_number && (
              <div className="mt-4 pt-4 border-t-2 border-dashed border-black">
                {user ? (
                  <a 
                    href={`https://wa.me/91${book.uploader.phone_number}?text=Hi, I found your book "${book.title}" on BookLease and wanted to know if it is available for rent!`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="block"
                  >
                    <NeoButton variant="primary" className="w-full bg-[#25D366] text-white flex items-center justify-center gap-2 border-black group hover:scale-105 transition-transform text-sm sm:text-base py-2.5 sm:py-3">
                      <MessageSquare size={18} className="group-hover:animate-bounce" /> Message on WhatsApp
                    </NeoButton>
                  </a>
                ) : (
                  <NeoButton 
                    variant="primary" 
                    className="w-full bg-[#25D366] text-white flex items-center justify-center gap-2 border-black group hover:scale-105 transition-transform text-sm sm:text-base py-2.5 sm:py-3"
                    onClick={() => {
                      toast.error("Please sign in to contact the owner.");
                      router.push("/login");
                    }}
                  >
                    <MessageSquare size={18} className="group-hover:animate-bounce" />
                    Sign In to WhatsApp Owner
                  </NeoButton>
                )}
              </div>
            )}
          </NeoCard>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 animate-element">
            {isOwner ? (
              <div className="border-3 sm:border-4 border-black bg-neo-yellow px-4 sm:px-6 py-3 sm:py-4 font-bold text-base sm:text-lg shadow-neo w-full text-center flex justify-center items-center gap-2">
                <span className="w-5 h-5 bg-black text-neo-yellow rounded-full flex items-center justify-center text-xs">i</span> You listed this book for rent.
              </div>
            ) : book.available ? (
              <NeoButton
                variant="primary"
                onClick={() => {
                  if (!user) {
                    router.push("/login");
                    return;
                  }
                  const slotOptions = getAvailableSlotOptions(book.slot, book.rented_slots);
                  setRentDuration(slotOptions[0]?.value || "All Slots");
                  setIsRentModalOpen(true);
                }}
                className="w-full sm:flex-1 text-lg sm:text-xl bg-neo-green flex items-center justify-center gap-2 group hover:scale-105 transition-transform py-3 sm:py-4"
              >
                Request to Rent
                <BookOpen size={22} className="group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" />
              </NeoButton>
            ) : (
              <NeoButton
                variant="primary"
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
                className={`w-full sm:flex-1 text-lg sm:text-xl flex items-center justify-center gap-2 group hover:scale-105 transition-transform py-3 sm:py-4 ${isWaitlisted ? 'bg-neo-blue text-white' : 'bg-gray-200'}`}
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
              className={`w-full sm:w-auto border-3 sm:border-4 border-black px-5 sm:px-6 py-3 sm:py-4 font-black text-base sm:text-lg shadow-neo hover:shadow-neo-hover active:shadow-neo-active transition-all flex items-center justify-center gap-2 group hover:scale-105 ${isWishlisted ? "bg-neo-yellow" : "bg-white"
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
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border-3 sm:border-4 border-black p-5 sm:p-8 max-w-lg w-full shadow-neo-lg space-y-4 sm:space-y-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b-3 sm:border-b-4 border-black pb-3 sm:pb-4">
              <div>
                <h3 className="font-serif text-2xl sm:text-3xl font-black">Request to Rent</h3>
                <p className="text-xs sm:text-sm font-bold text-gray-600 mt-1">{book.title}</p>
              </div>
              <button
                onClick={() => setIsRentModalOpen(false)}
                className="border-2 border-black px-2.5 py-1 font-black text-base sm:text-lg bg-gray-200 hover:bg-gray-300"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block font-bold mb-2 text-sm sm:text-base">Desired Exam Slot / Duration</label>
                <NeoSelect
                  value={rentDuration}
                  onChange={(val) => setRentDuration(val)}
                  options={getAvailableSlotOptions(book.slot, book.rented_slots)}
                  className="mb-3"
                />

                {rentDuration === "custom" && (
                  <div className="flex items-center gap-3 mt-3">
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={customDays}
                      onChange={(e) => setCustomDays(parseInt(e.target.value) || 1)}
                      className="border-3 sm:border-4 border-black p-2 font-bold w-24 text-center focus:outline-none"
                    />
                    <span className="font-bold whitespace-nowrap">Days</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold mb-2 text-sm sm:text-base">Message / Handover Spot (Optional)</label>
                <textarea
                  value={rentalNote}
                  onChange={(e) => setRentalNote(e.target.value)}
                  rows={3}
                  placeholder="e.g. Hi! Need this book for CAT-2 revision. Can meet near SJT or Block L for handover."
                  className="w-full border-3 sm:border-4 border-black p-3 font-medium focus:outline-none focus:ring-2 focus:ring-black text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 pt-3 sm:pt-4 border-t-3 sm:border-t-4 border-black">
              <NeoButton
                variant="secondary"
                className="w-full sm:w-1/2 bg-white"
                onClick={() => setIsRentModalOpen(false)}
              >
                Cancel
              </NeoButton>
              <NeoButton
                variant="primary"
                className="w-full sm:w-1/2 bg-neo-green text-black"
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
