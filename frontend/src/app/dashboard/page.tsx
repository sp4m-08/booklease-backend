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
import Link from "next/link";
import { toast } from "sonner";
import { BookOpen, RefreshCw, CheckCircle, XCircle, ArrowUpRight, Clock, Trash2, GraduationCap } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

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

  useGSAP(() => {
    gsap.from(".dash-card", {
      y: 30,
      opacity: 0,
      stagger: 0.1,
      duration: 0.5,
      ease: "power2.out"
    });
  }, { scope: container, dependencies: [activeTab] });

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

  if (loading || loadingBorrowed || loadingLent) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-12 gap-4">
        <div className="w-16 h-16 border-8 border-black border-t-neo-blue rounded-full animate-spin" />
        <p className="font-serif text-2xl font-black">Loading your rentals...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div ref={container} className="max-w-6xl mx-auto w-full px-6 py-12 flex-grow">
      {/* Header */}
      <div className="mb-10 border-b-4 border-black pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1 border-2 border-black px-3 py-0.5 bg-neo-yellow font-black text-xs uppercase mb-2 shadow-sm">
            <GraduationCap size={14} /> VIT Vellore Campus
          </div>
          <h1 className="font-serif text-5xl font-black mb-1">Rental Hub</h1>
          <p className="font-medium text-lg text-gray-700">Track and manage textbook requests for your CAT and FAT exam cycles.</p>
        </div>
        <Link href="/books">
          <NeoButton variant="primary" className="bg-neo-green flex items-center gap-2 group hover:scale-105 transition-transform">
            Browse Textbooks <BookOpen size={20} className="group-hover:rotate-12 transition-transform duration-300" />
          </NeoButton>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveTab("borrowed")}
          className={`flex items-center gap-2 border-4 border-black px-6 py-3 font-serif font-black text-xl transition-all ${
            activeTab === "borrowed" ? "bg-neo-blue shadow-neo" : "bg-white hover:bg-gray-100"
          }`}
        >
          <BookOpen size={22} />
          Books You Requested ({borrowed?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("lent")}
          className={`flex items-center gap-2 border-4 border-black px-6 py-3 font-serif font-black text-xl transition-all ${
            activeTab === "lent" ? "bg-neo-peach shadow-neo" : "bg-white hover:bg-gray-100"
          }`}
        >
          <RefreshCw size={22} />
          Incoming Requests for Your Books ({lent?.length || 0})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "borrowed" ? (
        <div className="space-y-6">
          {(!borrowed || borrowed.length === 0) ? (
            <div className="border-4 border-black border-dashed p-12 text-center bg-white shadow-sm">
              <h3 className="font-serif text-2xl font-black mb-2">No borrowed books yet</h3>
              <p className="font-medium text-gray-600 mb-6">Browse textbooks listed by other students and send a rental request.</p>
              <Link href="/books">
                <NeoButton variant="primary" size="lg">Discover Books</NeoButton>
              </Link>
            </div>
          ) : (
            borrowed.map((rental: any) => (
              <div key={rental.id} className="dash-card">
                <NeoCard color="white" className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex gap-4 items-center overflow-hidden w-full md:w-auto">
                    <div className="w-20 h-24 border-2 border-black flex-shrink-0 overflow-hidden">
                      <BookCover src={rental.book?.cover_image} title={rental.book?.title || "Book"} />
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-serif text-2xl font-black truncate">{rental.book?.title}</h3>
                      <p className="text-sm font-bold text-gray-600">Owner: {rental.book?.uploader?.username || "Student"}</p>
                      {rental.description && (
                        <p className="text-xs text-gray-700 italic mt-1 truncate">"{rental.description}"</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                    {/* Status Badge */}
                    <div className={`border-2 border-black px-4 py-2 font-black text-sm shadow-sm flex items-center gap-2 ${
                      rental.is_returned ? "bg-gray-200 text-gray-600" :
                      rental.status === null ? "bg-neo-yellow text-black" : 
                      rental.status === true ? "bg-neo-green text-black" : "bg-red-400 text-white"
                    }`}>
                      {rental.is_returned ? <><CheckCircle size={16} /> Returned</> :
                       rental.status === null ? <><Clock size={16} /> Pending Approval</> : 
                       rental.status === true ? <><CheckCircle size={16} /> Active Lease</> : <><XCircle size={16} /> Rejected by Owner</>}
                    </div>

                    {/* Actions */}
                    {rental.status === true && !rental.is_returned && (
                      <NeoButton 
                        variant="primary" 
                        className="bg-neo-purple flex items-center gap-2 group hover:scale-105 transition-transform"
                        onClick={() => returnMutation.mutate(rental.id)}
                        disabled={returnMutation.isPending}
                      >
                        {returnMutation.isPending ? "Returning..." : (
                          <>
                            Return Book <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
                          </>
                        )}
                      </NeoButton>
                    )}

                    {rental.status === null && (
                      <NeoButton 
                        variant="secondary" 
                        size="sm"
                        className="bg-white text-red-600"
                        onClick={() => {
                          if (confirm("Are you sure you want to cancel this rental request?")) {
                            cancelRentalMutation.mutate(rental.id);
                          }
                        }}
                        disabled={cancelRentalMutation.isPending}
                      >
                        Cancel Request
                      </NeoButton>
                    )}
                  </div>
                </NeoCard>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {(!lent || lent.length === 0) ? (
            <div className="border-4 border-black border-dashed p-12 text-center bg-white shadow-sm">
              <h3 className="font-serif text-2xl font-black mb-2">No incoming requests</h3>
              <p className="font-medium text-gray-600 mb-6">When other students request your textbooks, they will appear here for your review.</p>
              <Link href="/books/upload">
                <NeoButton variant="primary" size="lg">List Another Book</NeoButton>
              </Link>
            </div>
          ) : (
            lent.map((rental: any) => (
              <div key={rental.id} className="dash-card">
                <NeoCard color="white" className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex gap-4 items-center overflow-hidden w-full md:w-auto">
                    <div className="w-20 h-24 border-2 border-black flex-shrink-0 overflow-hidden">
                      <BookCover src={rental.book?.cover_image} title={rental.book?.title || "Book"} />
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="font-serif text-2xl font-black truncate">{rental.book?.title}</h3>
                      <p className="text-sm font-bold text-gray-800">
                        Requested by: <span className="underline">{rental.user?.username || `User #${rental.user_id}`}</span> ({rental.user?.email || "Campus Student"})
                      </p>
                      {rental.description && (
                        <p className="text-xs text-gray-700 italic mt-1">"{rental.description}"</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                    {rental.status === null ? (
                      <div className="flex gap-3 w-full md:w-auto">
                        <NeoButton 
                          variant="primary"
                          className="bg-neo-green flex-1 md:flex-none"
                          onClick={() => decideMutation.mutate({ id: rental.id, accept: true })}
                          disabled={decideMutation.isPending}
                        >
                          Approve Request
                        </NeoButton>
                        <NeoButton 
                          variant="danger"
                          className="flex-1 md:flex-none"
                          onClick={() => decideMutation.mutate({ id: rental.id, accept: false })}
                          disabled={decideMutation.isPending}
                        >
                          Reject
                        </NeoButton>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className={`border-2 border-black px-4 py-2 font-black text-sm flex items-center gap-2 ${
                          rental.status === true ? "bg-neo-green text-black" : "bg-red-400 text-white"
                        }`}>
                          {rental.status === true ? <><CheckCircle size={16} /> You Approved</> : <><XCircle size={16} /> You Rejected</>}
                        </span>
                        {rental.is_returned && (
                          <span className="font-black text-gray-500 italic bg-gray-100 px-3 py-1 border border-black text-xs flex items-center gap-1">
                            <CheckCircle size={12} /> Returned by Student
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </NeoCard>
              </div>
            ))
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
