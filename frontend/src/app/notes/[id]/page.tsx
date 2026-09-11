"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { NeoCard } from "@/components/ui/NeoCard";
import { NeoButton } from "@/components/ui/NeoButton";
import { getImageUrl, formatStudentName, getAvailableSlotOptions } from "@/lib/utils";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Download, ExternalLink, FileText, Trash2, UserCheck, MessageSquare, ThumbsUp, Edit3, Bell } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import dynamic from "next/dynamic";
import { NeoSelect } from "@/components/ui/NeoSelect";
import { SlotBadges } from "@/components/SlotBadges";
import { DocumentViewerSkeleton } from "@/components/DocumentViewer";

const DocumentViewer = dynamic(() => import("@/components/DocumentViewer"), {
  ssr: false,
  loading: () => <DocumentViewerSkeleton />,
});

const EditListingModal = dynamic(
  () => import("@/components/EditListingModal").then((mod) => mod.EditListingModal),
  { ssr: false }
);

interface NoteDetail {
  id: number;
  title: string;
  subject: string;
  slot?: string;
  rented_slots?: string;
  condition?: string;
  available: boolean;
  description: string;
  file_path: string;
  price?: number;
  upvotes: number;
  is_upvoted?: boolean;
  uploaded_by: number;
  uploader: {
    id: number;
    username: string;
    email: string;
    phone_number: string;
    registration_no: string;
  };
  created_at: string;
}

export default function NoteDetailPage() {
  const { id } = useParams();
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isRentModalOpen, setIsRentModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rentDuration, setRentDuration] = useState("A1");
  const [customDays, setCustomDays] = useState(7);
  const [rentalNote, setRentalNote] = useState("");

  const { data: note, isLoading, error } = useQuery<NoteDetail>({
    queryKey: ["note", id],
    queryFn: async () => {
      const response = await api.get(`/notes/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async () => api.delete(`/notes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Note deleted successfully!");
      router.push("/notes");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete note.");
    }
  });

  const upvoteMutation = useMutation({
    mutationFn: async () => api.post(`/notes/${id}/upvote`),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["note", id] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      if (res.data?.is_upvoted) {
        toast.success("Upvoted! Thanks for rating this note.");
      }
    },
    onError: (err: any) => {
      toast.error("Failed to upvote.");
    }
  });

  const { data: waitlistStatus } = useQuery({
    queryKey: ["noteWaitlist", id],
    queryFn: async () => {
      if (!user) return { waitlisted: false };
      const response = await api.get(`/notes/${id}/waitlist`);
      return response.data;
    },
    enabled: !!id && !!user,
  });
  const isWaitlisted = waitlistStatus?.waitlisted || false;

  const joinWaitlistMutation = useMutation({
    mutationFn: async () => api.post(`/notes/${id}/waitlist`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["noteWaitlist", id] });
      toast.success("Joined waitlist! We'll notify you when it's returned.");
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to join waitlist")
  });

  const leaveWaitlistMutation = useMutation({
    mutationFn: async () => api.delete(`/notes/${id}/waitlist`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["noteWaitlist", id] });
      toast.success("Left the waitlist.");
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Failed to leave waitlist")
  });

  const requestRentalMutation = useMutation({
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
        notes_id: parseInt(id as string),
        description: rentalNote || `Requested for ${durationStr} lease.`,
        slot: rentDuration !== "custom" ? durationStr : ""
      });
    },
    onSuccess: () => {
      toast.success("Rental request submitted! The owner has been notified.");
      setIsRentModalOpen(false);
      setRentalNote("");
      queryClient.invalidateQueries({ queryKey: ["note", id] });
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
      router.push("/dashboard?tab=borrowed");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || err.message || "Failed to submit request.");
    }
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!isLoading && note && containerRef.current) {
      gsap.from(".animate-element", {
        y: 40,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out"
      });
    }
  }, [isLoading, note]);

  if (isLoading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[calc(100vh-84px)]">
        <div className="animate-spin w-16 h-16 border-8 border-black border-t-neo-yellow rounded-full" />
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-red-200 border-4 border-black p-8 font-black text-2xl shadow-neo max-w-lg mb-6">
          Failed to load study note details.
        </div>
        <Link href="/notes">
          <NeoButton variant="primary" className="flex items-center gap-2"><ArrowLeft size={18} /> Back to Notes</NeoButton>
        </Link>
      </div>
    );
  }

  const fileUrl = getImageUrl(note.file_path);
  const fileExt = note.file_path ? note.file_path.split(".").pop()?.toLowerCase() : "";
  const isPdf = fileExt === "pdf";
  const isImage = ["png", "jpg", "jpeg", "webp", "gif"].includes(fileExt || "");
  const isDoc = ["doc", "docx", "txt"].includes(fileExt || "");

  const isOwner = userProfile?.id === note.uploaded_by;
  const canDelete = isOwner || userProfile?.is_admin;

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-12 flex-grow">
      {/* Top Header */}
      <div className="mb-6 sm:mb-8 flex justify-between items-center animate-element">
        <Link href="/notes">
          <NeoButton variant="secondary" className="bg-white flex items-center gap-2 text-sm sm:text-base">
            <ArrowLeft size={18} />
            Back to Notes
          </NeoButton>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {isOwner && (
            <NeoButton 
              variant="secondary"
              onClick={() => setIsEditModalOpen(true)}
              className="bg-neo-yellow hover:bg-yellow-300 flex items-center gap-2 text-sm sm:text-base"
            >
              <Edit3 size={18} />
              Edit Note
            </NeoButton>
          )}

          {canDelete && (
            <NeoButton 
              variant="danger"
              onClick={() => {
                if (confirm(`Are you sure you want to delete note "${note.title}"?`)) {
                  deleteNoteMutation.mutate();
                }
              }}
              disabled={deleteNoteMutation.isPending}
              className="flex items-center gap-2 text-sm sm:text-base"
            >
              <Trash2 size={18} />
              Delete Note
            </NeoButton>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12 items-start">
        
        {/* Left Column: Document / File Preview (Lazy-loaded) */}
        <div className="lg:col-span-2 space-y-4 animate-element">
          <DocumentViewer fileUrl={note.file_path} fileExt={fileExt} title={note.title} />
        </div>

        {/* Right Column: Note Metadata & Contact */}
        <div className="flex flex-col gap-6 sm:gap-8">
          <NeoCard color="yellow" className="p-4 sm:p-6 animate-element">
              <div className="flex flex-wrap gap-2 mb-4 items-center justify-between w-full">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-block px-2.5 sm:px-3 py-0.5 sm:py-1 bg-white border-2 border-black font-black text-xs uppercase shadow-sm">
                    {note.subject || "General Study Material"}
                  </span>
                  <SlotBadges slot={note.slot} rentedSlots={note.rented_slots} variant="purple" className="inline-flex" />
                  {note.condition && (
                    <span className="inline-block px-2.5 sm:px-3 py-0.5 sm:py-1 bg-white border-2 border-black font-black text-xs uppercase shadow-sm">
                      {note.condition}
                    </span>
                  )}
                  <span className="inline-block px-2.5 sm:px-3 py-0.5 sm:py-1 bg-neo-green border-2 border-black font-black text-xs uppercase shadow-sm">
                    {note.price && note.price > 0 ? `₹${note.price}` : "FREE"}
                  </span>
                  {!note.available && (
                    <span className="inline-block px-2.5 sm:px-3 py-0.5 sm:py-1 bg-black text-white border-2 border-black font-black text-xs uppercase shadow-sm">
                      🔴 Rented Out
                    </span>
                  )}
                </div>
              <button 
                onClick={() => {
                  if (!user) {
                    toast.error("Please sign in to upvote notes.");
                    router.push("/login");
                    return;
                  }
                  upvoteMutation.mutate();
                }}
                disabled={upvoteMutation.isPending}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 border-2 border-black font-black text-xs sm:text-sm transition-all shadow-sm ${note.is_upvoted ? "bg-neo-blue text-white" : "bg-white hover:bg-gray-100"}`}
              >
                <ThumbsUp size={15} className={note.is_upvoted ? "fill-white" : ""} />
                {note.upvotes || 0} Upvotes
              </button>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-black mb-3 leading-tight">{note.title}</h1>
            <p className="font-medium text-sm sm:text-base text-gray-800 leading-relaxed whitespace-pre-wrap">
              {note.description || "No specific summary provided for this note file."}
            </p>
            <p className="text-xs font-bold text-gray-600 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t-2 border-black">
              Shared on {new Date(note.created_at).toLocaleDateString()}
            </p>
          </NeoCard>

          <NeoCard color="blue" className="p-4 sm:p-6 animate-element">
            <div className="flex items-center gap-3 mb-4 sm:mb-6 border-b-3 sm:border-b-4 border-black pb-2 sm:pb-3">
              <UserCheck size={22} />
              <h2 className="font-serif text-xl sm:text-2xl font-black">Author & Contact</h2>
            </div>
            
            <div className="space-y-3 font-medium text-sm">
              <div>
                <span className="text-xs font-black uppercase text-gray-700 block">Uploaded By</span>
                <span className="font-bold text-base sm:text-lg">
                  {formatStudentName(note.uploader?.username, "Campus Student")}
                </span>
              </div>

              {note.uploader?.phone_number ? (
                <div className="pt-3 sm:pt-4 border-t-2 border-dashed border-black">
                  {user ? (
                    <a 
                      href={`https://wa.me/91${note.uploader.phone_number}?text=Hi, I found your notes "${note.title}" on BookLease and wanted to thank you / ask a doubt!`} 
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
                        toast.error("Please sign in to contact the uploader.");
                        router.push("/login");
                      }}
                    >
                      <MessageSquare size={18} className="group-hover:animate-bounce" /> Sign In to WhatsApp Author
                    </NeoButton>
                  )}
                </div>
              ) : (
                <div className="bg-white border-2 border-black p-3 text-xs font-bold text-gray-600">
                  Uploader has not set a public phone number.
                </div>
              )}
            </div>
          </NeoCard>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:gap-4 animate-element">
            {isOwner ? (
              <div className="border-3 sm:border-4 border-black bg-neo-yellow px-4 sm:px-6 py-3 sm:py-4 font-bold text-base sm:text-lg shadow-neo w-full text-center flex justify-center items-center gap-2">
                <span className="w-5 h-5 bg-black text-neo-yellow rounded-full flex items-center justify-center text-xs">i</span> You shared this note.
              </div>
            ) : note.available ? (
              <NeoButton 
                variant="primary" 
                size="lg" 
                onClick={() => {
                  if (!user) {
                    router.push("/login");
                    return;
                  }
                  const slotOptions = getAvailableSlotOptions(note.slot, note.rented_slots);
                  setRentDuration(slotOptions[0]?.value || "All Slots");
                  setIsRentModalOpen(true);
                }}
                className="w-full text-lg sm:text-xl bg-neo-green flex items-center justify-center gap-2 group hover:scale-105 transition-transform py-3 sm:py-4"
              >
                Request to Rent 
                <FileText size={22} className="group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" />
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
                className={`w-full text-lg sm:text-xl flex items-center justify-center gap-2 group hover:scale-105 transition-transform py-3 sm:py-4 ${isWaitlisted ? 'bg-neo-blue text-white' : 'bg-gray-200'}`}
              >
                {isWaitlisted ? "On Waitlist" : "Join Waitlist"}
                <Bell size={20} className={isWaitlisted ? "fill-white" : ""} />
              </NeoButton>
            )}
          </div>
        </div>

      </div>

      {/* Rental Request Modal Dialog / Mobile Bottom Sheet */}
      {isRentModalOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsRentModalOpen(false)}
        >
          <div 
            className="bg-white border-t-4 sm:border-4 border-black p-5 sm:p-8 max-w-lg w-full shadow-neo-lg space-y-4 sm:space-y-6 rounded-t-2xl sm:rounded-none animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start border-b-3 sm:border-b-4 border-black pb-3 sm:pb-4">
              <div>
                <h3 className="font-serif text-2xl sm:text-3xl font-black">Request to Rent Note</h3>
                <p className="text-xs sm:text-sm font-bold text-gray-600 mt-1">{note.title}</p>
              </div>
              <button 
                onClick={() => setIsRentModalOpen(false)}
                className="border-2 border-black px-2.5 py-1 font-black text-base sm:text-lg bg-gray-100 hover:bg-gray-200 cursor-pointer shadow-xs"
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
                  options={getAvailableSlotOptions(note.slot, note.rented_slots)}
                  className="mb-3"
                />

                {rentDuration === "custom" && (
                  <div className="flex items-center gap-3 mt-3">
                    <input 
                      type="number"
                      min="1"
                      value={customDays}
                      onChange={(e) => setCustomDays(parseInt(e.target.value) || 1)}
                      className="border-3 sm:border-4 border-black p-2 font-bold w-24 text-center focus:outline-none"
                    />
                    <span className="font-bold">Days</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold mb-2 text-sm sm:text-base">Message to Owner (Optional)</label>
                <textarea 
                  value={rentalNote}
                  onChange={(e) => setRentalNote(e.target.value)}
                  placeholder="e.g. Hi! Need this note for CAT-2 revision. Can meet near SJT or Block L for handover."
                  className="w-full border-3 sm:border-4 border-black p-3 font-medium focus:outline-none h-24 resize-none text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 pt-3 sm:pt-4 border-t-3 sm:border-t-4 border-black">
              <NeoButton 
                variant="secondary" 
                className="w-full sm:flex-1 bg-white"
                onClick={() => setIsRentModalOpen(false)}
              >
                Cancel
              </NeoButton>
              <NeoButton 
                variant="primary" 
                className="w-full sm:flex-1 bg-neo-green"
                onClick={() => requestRentalMutation.mutate()}
                disabled={requestRentalMutation.isPending}
              >
                Submit Request
              </NeoButton>
            </div>
          </div>
        </div>
      )}

      {/* Edit Listing Modal */}
      {note && (
        <EditListingModal
          isOpen={isEditModalOpen}
          type="note"
          item={note}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["note", id] });
            queryClient.invalidateQueries({ queryKey: ["notes"] });
            queryClient.invalidateQueries({ queryKey: ["mynotes"] });
          }}
        />
      )}
    </div>
  );
}
