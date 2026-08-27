"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { NeoCard } from "@/components/ui/NeoCard";
import { NeoButton } from "@/components/ui/NeoButton";
import { toast } from "sonner";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useGSAP(() => {
    gsap.from(".dash-column", {
      y: 50,
      opacity: 0,
      stagger: 0.2,
      duration: 0.6,
      ease: "back.out(1.5)"
    });
  }, { scope: container });

  const { data: borrowed, isLoading: loadingBorrowed } = useQuery({
    queryKey: ["rentals", "borrowed"],
    queryFn: async () => {
      const response = await api.get("/rentals/borrowed");
      return response.data || [];
    },
    enabled: !!user,
  });

  const { data: lent, isLoading: loadingLent } = useQuery({
    queryKey: ["rentals", "lent"],
    queryFn: async () => {
      const response = await api.get("/rentals/lent");
      return response.data || [];
    },
    enabled: !!user,
  });

  const decideMutation = useMutation({
    mutationFn: async ({ id, accept }: { id: string | number; accept: boolean }) => {
      return api.post(`/rentals/${id}/decision`, { accept });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["rentals", "lent"] });
      toast.success(variables.accept ? "Rental Approved!" : "Rental Rejected!");
    },
    onError: () => toast.error("Failed to process decision.")
  });

  const returnMutation = useMutation({
    mutationFn: async (id: string | number) => {
      return api.patch(`/rentals/${id}/return`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rentals", "borrowed"] });
      toast.success("Book returned successfully!");
    },
    onError: () => toast.error("Failed to return book.")
  });

  if (loading || loadingBorrowed || loadingLent) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center font-black text-2xl gap-4">
        <div className="w-16 h-16 border-4 border-black border-t-neo-blue rounded-full animate-spin" />
        Loading dashboard...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div ref={container} className="max-w-7xl mx-auto w-full px-8 py-12 flex-grow overflow-hidden">
      <h1 className="font-serif text-5xl font-black mb-12 border-b-4 border-black pb-6">Your Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        
        {/* Borrowed Section */}
        <div className="dash-column">
          <h2 className="font-serif text-3xl font-black mb-6 bg-neo-blue inline-block px-4 py-2 border-4 border-black shadow-neo">Books you requested</h2>
          <div className="space-y-6">
            {(!borrowed || borrowed.length === 0) ? (
              <p className="font-medium text-gray-600 border-4 border-black border-dashed p-6 bg-white shadow-sm">You haven't requested any books yet.</p>
            ) : (
              borrowed?.map((rental: any) => (
                <NeoCard key={rental.id} color="white" className="hover:-translate-y-1 transition-transform">
                  <h3 className="font-bold text-2xl mb-1 truncate">{rental.book?.title}</h3>
                  <p className="text-sm font-bold text-gray-600 mb-6">Owner: {rental.book?.uploader?.username || "Unknown"}</p>
                  
                  <div className="flex flex-wrap justify-between items-end gap-4">
                    <div className={`inline-block border-2 border-black px-4 py-2 font-bold text-sm shadow-neo ${
                      rental.status === null ? "bg-neo-yellow" : 
                      rental.status === true ? "bg-neo-green" : "bg-red-400 text-white"
                    }`}>
                      {rental.status === null ? "⏳ Pending Approval" : 
                       rental.status === true ? "✅ Approved" : "❌ Rejected"}
                    </div>

                    {rental.status === true && !rental.is_returned && (
                      <NeoButton 
                        variant="primary" 
                        className="bg-neo-purple"
                        onClick={() => returnMutation.mutate(rental.id)}
                        disabled={returnMutation.isPending}
                      >
                        {returnMutation.isPending ? "Returning..." : "Return Book"}
                      </NeoButton>
                    )}

                    {rental.is_returned && (
                      <span className="font-black text-gray-400 italic">Returned</span>
                    )}
                  </div>
                </NeoCard>
              ))
            )}
          </div>
        </div>

        {/* Lent Section */}
        <div className="dash-column">
          <h2 className="font-serif text-3xl font-black mb-6 bg-neo-peach inline-block px-4 py-2 border-4 border-black shadow-neo">Requests for your books</h2>
          <div className="space-y-6">
            {(!lent || lent.length === 0) ? (
              <p className="font-medium text-gray-600 border-4 border-black border-dashed p-6 bg-white shadow-sm">No one has requested your books yet.</p>
            ) : (
              lent?.map((rental: any) => (
                <NeoCard key={rental.id} color="white" className="hover:-translate-y-1 transition-transform">
                  <h3 className="font-bold text-2xl mb-1 truncate">{rental.book?.title}</h3>
                  <p className="text-sm font-bold text-gray-600 mb-6">Requested by: {rental.user?.username || `User ${rental.user_id}`}</p>
                  
                  {rental.status === null ? (
                    <div className="flex gap-4 mt-4">
                       <NeoButton 
                          variant="primary"
                          className="bg-neo-green w-full"
                          onClick={() => decideMutation.mutate({ id: rental.id, accept: true })}
                          disabled={decideMutation.isPending}
                        >
                         Approve
                       </NeoButton>
                       <NeoButton 
                          variant="danger"
                          className="w-full"
                          onClick={() => decideMutation.mutate({ id: rental.id, accept: false })}
                          disabled={decideMutation.isPending}
                        >
                         Reject
                       </NeoButton>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center mt-4 border-t-2 border-black pt-4">
                      <div className="inline-block font-bold text-sm bg-gray-200 text-gray-800 px-3 py-1 border-2 border-black">
                        {rental.status === true ? "✅ You Approved" : "❌ You Rejected"}
                      </div>
                      {rental.is_returned && (
                        <span className="font-black text-gray-400 italic">User Returned It</span>
                      )}
                    </div>
                  )}
                </NeoCard>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
