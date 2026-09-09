"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { NeoCard } from "@/components/ui/NeoCard";
import { NeoButton } from "@/components/ui/NeoButton";
import { BookCover } from "@/components/BookCover";
import { NoteCover } from "@/components/NoteCover";
import Link from "next/link";
import { toast } from "sonner";
import { BookOpen, RefreshCw, CheckCircle, XCircle, ArrowUpRight, Clock, Trash2, GraduationCap, MessageSquare, Phone } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { formatStudentName } from "@/lib/utils";

function DashboardContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const container = useRef<HTMLDivElement>(null);

  const initialTab = (searchParams.get("tab") === "lent") ? "lent" : "borrowed";
  const [activeTab, setActiveTab] = useState<"borrowed" | "lent">(initialTab);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "lent" || tab === "borrowed") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  // Fetch Borrowed Books
  const { data: borrowed, isLoading: loadingBorrowed } = useQuery({
    queryKey: ["rentals", "borrowed"],
    queryFn: async () => {
      const response = await api.get("/rentals/borrowed");
      return response.data || [];
    },
    enabled: !!user,
  });

  // Fetch Lent Books
  const { data: lent, isLoading: loadingLent } = useQuery({
    queryKey: ["rentals", "lent"],
    queryFn: async () => {
      const response = await api.get("/rentals/lent");
      return response.data || [];
    },
    enabled: !!user,
  });

  const isDataReady = !loading && !loadingBorrowed && !loadingLent && !!user;
  const currentItems = activeTab === "borrowed" ? borrowed : lent;

  useGSAP(() => {
    if (!isDataReady || !container.current) return;
    if (currentItems && currentItems.length > 0) {
      gsap.from(".dash-card", {
        y: 30,
        opacity: 0,
        stagger: 0.1,
        duration: 0.5,
        ease: "power2.out"
      });
    }
  }, { scope: container, dependencies: [activeTab, isDataReady, currentItems] });

  // Decide on Rental (Accept / Reject)
  const decideMutation = useMutation({
    mutationFn: async ({ id, accept }: { id: string | number; accept: boolean }) => {
      return api.post(`/rentals/${id}/decision`, { accept });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
      toast.success(variables.accept ? "Rental Approved! The borrower has been notified." : "Rental request rejected.");
    },
    onError: () => toast.error("Failed to process decision.")
  });

  // Return Book Mutation
  const returnMutation = useMutation({
    mutationFn: async (id: string | number) => {
      return api.patch(`/rentals/${id}/return`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
      toast.success("Book returned successfully! Availability restored.");
    },
    onError: () => toast.error("Failed to return book.")
  });

  // Cancel Pending Rental Request Mutation
  const cancelRentalMutation = useMutation({
    mutationFn: async (id: string | number) => {
      return api.delete(`/rentals/delete/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rentals"] });
      toast.success("Rental request canceled.");
    },
    onError: () => toast.error("Failed to cancel rental request.")
  });

  if (!isDataReady) {
    return (
      <div ref={container} className="max-w-6xl mx-auto w-full px-6 py-12 flex-grow flex flex-col items-center justify-center p-12 gap-4">
        <div className="w-16 h-16 border-8 border-black border-t-neo-blue rounded-full animate-spin" />
        <p className="font-serif text-2xl font-black">Loading your rentals...</p>
      </div>
    );
  }

  if (!user) return null;

  const formatWhatsAppLink = (phone: string, text: string) => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, "");
    const fullNumber = cleaned.length === 10 ? `91${cleaned}` : cleaned;
    return `https://wa.me/${fullNumber}?text=${encodeURIComponent(text)}`;
  };

  return (
    <div ref={container} className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-12 flex-grow">
      {/* Header */}
      <div className="mb-6 sm:mb-10 border-b-4 border-black pb-4 sm:pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1 border-2 border-black px-2.5 sm:px-3 py-0.5 bg-neo-yellow font-black text-xs uppercase mb-2 shadow-sm">
            <GraduationCap size={14} /> VIT Vellore Campus
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-black mb-1">Rental Hub</h1>
          <p className="font-medium text-sm sm:text-lg text-gray-700">Track and manage textbook requests for your CAT and FAT exam cycles.</p>
        </div>
        <Link href="/books" className="w-full sm:w-auto">
          <NeoButton variant="primary" className="w-full sm:w-auto bg-neo-green flex items-center justify-center gap-2 group hover:scale-105 transition-transform text-sm sm:text-base py-2.5 sm:py-3">
            Browse Textbooks <BookOpen size={18} className="group-hover:rotate-12 transition-transform duration-300" />
          </NeoButton>
        </Link>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 mb-6 sm:mb-8">
        <button
          onClick={() => setActiveTab("borrowed")}
          className={`flex items-center justify-center gap-2 border-3 sm:border-4 border-black px-4 sm:px-6 py-2.5 sm:py-3 font-serif font-black text-base sm:text-xl transition-all ${
            activeTab === "borrowed" ? "bg-neo-blue shadow-neo" : "bg-white hover:bg-gray-100"
          }`}
        >
          <BookOpen size={20} />
          Materials You Requested ({borrowed?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("lent")}
          className={`flex items-center justify-center gap-2 border-3 sm:border-4 border-black px-4 sm:px-6 py-2.5 sm:py-3 font-serif font-black text-base sm:text-xl transition-all ${
            activeTab === "lent" ? "bg-neo-peach shadow-neo" : "bg-white hover:bg-gray-100"
          }`}
        >
          <RefreshCw size={20} />
          Incoming Requests ({lent?.length || 0})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "borrowed" ? (
        <div className="space-y-4 sm:space-y-6">
          {(!borrowed || borrowed.length === 0) ? (
            <div className="border-3 sm:border-4 border-black border-dashed p-8 sm:p-12 text-center bg-white shadow-sm">
              <h3 className="font-serif text-xl sm:text-2xl font-black mb-2">No borrowed books yet</h3>
              <p className="font-medium text-sm sm:text-base text-gray-600 mb-6">Browse textbooks listed by other students and send a rental request.</p>
              <Link href="/books">
                <NeoButton variant="primary" size="lg" className="text-sm sm:text-base">Discover Books</NeoButton>
              </Link>
            </div>
          ) : (
            borrowed.map((rental: any) => {
              const isNote = !!rental.notes_id;
              const item = isNote ? rental.note : rental.book;
              const title = item?.title || (isNote ? "Study Note" : "Textbook");
              const owner = item?.uploader;
              const ownerName = formatStudentName(owner?.username, "Student");
              const coverSrc = isNote ? item?.file_path : item?.cover_image;
              const ownerPhone = owner?.phone_number;

              return (
                <div key={rental.id} className="dash-card">
                  <NeoCard 
                    color="white" 
                    className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6 p-4 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-neo-hover"
                  >
                    <div className="flex gap-4 sm:gap-5 items-center overflow-hidden w-full lg:w-auto">
                      <div className="w-20 h-28 sm:w-24 sm:h-32 border-3 sm:border-4 border-black flex-shrink-0 overflow-hidden shadow-sm">
                        {isNote ? (
                          <NoteCover src={coverSrc} title={title} subject={item?.subject} />
                        ) : (
                          <BookCover src={coverSrc} title={title} />
                        )}
                      </div>
                      <div className="overflow-hidden flex flex-col justify-center min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`border-2 border-black px-2 py-0.5 text-[11px] sm:text-xs font-black uppercase shadow-sm ${isNote ? 'bg-neo-peach' : 'bg-neo-yellow'}`}>
                            {isNote ? 'Study Note' : 'Book'}
                          </span>
                        </div>
                        <h3 className="font-serif text-xl sm:text-2xl md:text-3xl font-black truncate mb-1">{title}</h3>
                        <p className="text-xs sm:text-sm font-bold text-gray-800 bg-gray-100 border border-black inline-block px-2 py-0.5 sm:py-1 shadow-sm mb-1.5 self-start">
                          Owner: {ownerName}
                        </p>
                        {rental.description && (
                          <p className="text-xs sm:text-sm font-medium text-gray-700 italic truncate border-l-3 sm:border-l-4 border-black pl-2">"{rental.description}"</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full lg:w-auto justify-between lg:justify-end pt-2 lg:pt-0 border-t-2 lg:border-t-0 border-dashed border-gray-200">
                      {/* Status Badge */}
                      <div className={`border-3 sm:border-4 border-black px-3 sm:px-4 py-1.5 sm:py-2 font-black text-xs sm:text-sm shadow-neo flex items-center gap-1.5 sm:gap-2 ${
                        rental.is_returned ? "bg-gray-200 text-gray-800" :
                        rental.status === null ? "bg-neo-yellow text-black" : 
                        rental.status === true ? "bg-neo-green text-black" : "bg-red-500 text-white"
                      }`}>
                        {rental.is_returned ? <><CheckCircle size={16} /> Returned</> :
                         rental.status === null ? <><Clock size={16} /> Pending</> : 
                         rental.status === true ? <><CheckCircle size={16} /> Active Lease</> : <><XCircle size={16} /> Rejected</>}
                      </div>

                      {/* WhatsApp Chat Button with Owner */}
                      {ownerPhone && (
                        <a
                          href={formatWhatsAppLink(
                            ownerPhone,
                            `Hi, I requested "${title}" on BookLease! When and where on campus would you like to meet for the handover?`
                          )}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <NeoButton 
                            variant="primary" 
                            size="sm"
                            className="bg-[#25D366] text-white border-3 sm:border-4 border-black flex items-center gap-1.5 hover:scale-105 transition-transform text-xs sm:text-sm"
                          >
                            <MessageSquare size={15} />
                            WhatsApp Owner
                          </NeoButton>
                        </a>
                      )}

                      {/* Actions */}
                      {rental.status === true && !rental.is_returned && (
                        <NeoButton 
                          variant="primary" 
                          size="sm"
                          className="bg-neo-purple flex items-center gap-1.5 sm:gap-2 group hover:scale-105 transition-transform text-xs sm:text-sm"
                          onClick={() => returnMutation.mutate(rental.id)}
                          disabled={returnMutation.isPending}
                        >
                          {returnMutation.isPending ? "Returning..." : (
                            <>
                              Return Item <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                            </>
                          )}
                        </NeoButton>
                      )}

                      {rental.status === null && (
                        <NeoButton 
                          variant="secondary" 
                          size="sm"
                          className="bg-white text-red-600 border-2 text-xs sm:text-sm"
                          onClick={() => {
                            if (confirm("Are you sure you want to cancel this rental request?")) {
                              cancelRentalMutation.mutate(rental.id);
                            }
                          }}
                          disabled={cancelRentalMutation.isPending}
                        >
                          Cancel
                        </NeoButton>
                      )}
                    </div>
                  </NeoCard>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {(!lent || lent.length === 0) ? (
            <div className="border-3 sm:border-4 border-black border-dashed p-8 sm:p-12 text-center bg-white shadow-sm">
              <h3 className="font-serif text-xl sm:text-2xl font-black mb-2">No incoming requests</h3>
              <p className="font-medium text-sm sm:text-base text-gray-600 mb-6">When other students request your textbooks, they will appear here for your review.</p>
              <Link href="/books/upload">
                <NeoButton variant="primary" size="lg" className="text-sm sm:text-base">List Another Book</NeoButton>
              </Link>
            </div>
          ) : (
            lent.map((rental: any) => {
              const isNote = !!rental.notes_id;
              const item = isNote ? rental.note : rental.book;
              const title = item?.title || (isNote ? "Study Note" : "Textbook");
              const coverSrc = isNote ? item?.file_path : item?.cover_image;
              const requester = rental.user;
              const requesterName = formatStudentName(requester?.username, `Student #${rental.user_id}`);
              const requesterPhone = requester?.phone_number;

              return (
                <div key={rental.id} className="dash-card">
                  <NeoCard 
                    color="white" 
                    className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6 p-4 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-neo-hover"
                  >
                    <div className="flex gap-4 sm:gap-5 items-center overflow-hidden w-full lg:w-auto">
                      <div className="w-20 h-28 sm:w-24 sm:h-32 border-3 sm:border-4 border-black flex-shrink-0 overflow-hidden shadow-sm">
                        {isNote ? (
                          <NoteCover src={coverSrc} title={title} subject={item?.subject} />
                        ) : (
                          <BookCover src={coverSrc} title={title} />
                        )}
                      </div>
                      <div className="overflow-hidden flex flex-col justify-center min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`border-2 border-black px-2 py-0.5 text-[11px] sm:text-xs font-black uppercase shadow-sm ${isNote ? 'bg-neo-peach' : 'bg-neo-yellow'}`}>
                            {isNote ? 'Study Note' : 'Book'}
                          </span>
                        </div>
                        <h3 className="font-serif text-xl sm:text-2xl md:text-3xl font-black truncate mb-1">{title}</h3>
                        <p className="text-xs sm:text-sm font-bold text-gray-800 bg-gray-100 border border-black inline-block px-2 py-0.5 sm:py-1 shadow-sm mb-1.5 self-start">
                          Requested by: <span className="underline font-black">{requesterName}</span>
                        </p>
                        {rental.description && (
                          <p className="text-xs sm:text-sm font-medium text-gray-700 italic truncate border-l-3 sm:border-l-4 border-black pl-2">"{rental.description}"</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 w-full lg:w-auto justify-between lg:justify-end pt-2 lg:pt-0 border-t-2 lg:border-t-0 border-dashed border-gray-200">
                      {/* WhatsApp Chat Button with Requester for Owner */}
                      {requesterPhone && (
                        <a
                          href={formatWhatsAppLink(
                            requesterPhone,
                            `Hi ${requesterName}, I saw your request for "${title}" on BookLease! When and where on campus would you like to meet for the handover?`
                          )}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <NeoButton 
                            variant="primary" 
                            size="sm"
                            className="bg-[#25D366] text-white border-3 sm:border-4 border-black flex items-center gap-1.5 hover:scale-105 transition-transform shadow-neo text-xs sm:text-sm"
                          >
                            <MessageSquare size={15} />
                            WhatsApp Requester
                          </NeoButton>
                        </a>
                      )}

                      {rental.status === null ? (
                        <div className="flex gap-2 w-full sm:w-auto">
                          <NeoButton 
                            variant="primary" 
                            size="sm"
                            className="bg-neo-green flex-1 sm:flex-none border-3 sm:border-4 text-xs sm:text-sm py-2"
                            onClick={() => decideMutation.mutate({ id: rental.id, accept: true })}
                            disabled={decideMutation.isPending}
                          >
                            Approve
                          </NeoButton>
                          <NeoButton 
                            variant="danger"
                            size="sm"
                            className="flex-1 sm:flex-none border-3 sm:border-4 text-xs sm:text-sm py-2"
                            onClick={() => decideMutation.mutate({ id: rental.id, accept: false })}
                            disabled={decideMutation.isPending}
                          >
                            Reject
                          </NeoButton>
                        </div>
                      ) : (
                        <div className={`border-3 sm:border-4 border-black px-3 sm:px-4 py-1.5 sm:py-2 font-black text-xs sm:text-sm shadow-neo flex items-center gap-1.5 sm:gap-2 ${
                          rental.is_returned ? "bg-gray-200 text-gray-800" :
                          rental.status === true ? "bg-neo-green text-black" : "bg-red-500 text-white"
                        }`}>
                          {rental.is_returned ? <><CheckCircle size={16} /> Returned</> :
                           rental.status === true ? <><CheckCircle size={16} /> You Approved</> : <><XCircle size={16} /> You Rejected</>}
                        </div>
                      )}
                    </div>
                  </NeoCard>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center font-bold text-2xl animate-pulse">Loading dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
