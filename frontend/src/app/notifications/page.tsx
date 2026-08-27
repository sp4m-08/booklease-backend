"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { NeoButton } from "@/components/ui/NeoButton";
import { Bell, ArrowRight, Trash2, CheckCircle, ExternalLink } from "lucide-react";

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await api.get("/notifications/");
      return res.data || [];
    },
    enabled: !!user,
  });

  const markSeen = useMutation({
    mutationFn: async (id: number) => {
      return api.patch(`/notifications/${id}/seen`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  const deleteNotif = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  const clearAll = useMutation({
    mutationFn: async () => {
      return api.delete("/notifications/");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  // Handle clicking a notification: mark it as seen AND navigate to the relevant dashboard tab
  const handleOpenNotification = async (notif: any) => {
    if (!notif.is_seen && !notif.seen) {
      try {
        await api.patch(`/notifications/${notif.id}/seen`);
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      } catch (err) {
        console.error("Failed to mark notification seen:", err);
      }
    }

    const message = (notif.message || "").toLowerCase();
    
    // If it's a rental request for the user's book -> Go to 'Incoming Requests' (lent)
    if (message.includes("wants to rent") || message.includes("request")) {
      router.push("/dashboard?tab=lent");
    } else if (message.includes("accepted") || message.includes("rejected") || message.includes("returned")) {
      // If it's an update on a book the user borrowed -> Go to 'Borrowed Books'
      router.push("/dashboard?tab=borrowed");
    } else {
      router.push("/dashboard?tab=lent");
    }
  };

  if (loading || isLoading) return <div className="p-16 text-center font-bold text-2xl animate-pulse">Loading notifications...</div>;
  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto w-full px-6 py-12 flex-grow">
      <div className="flex justify-between items-end mb-10 border-b-4 border-black pb-6">
        <div>
          <div className="inline-block border-2 border-black px-3 py-0.5 bg-neo-yellow font-black text-xs uppercase mb-2 shadow-sm">
            🎓 Campus Alerts
          </div>
          <h1 className="font-serif text-5xl font-black">Notifications</h1>
        </div>
        {notifications && notifications.length > 0 && (
          <NeoButton 
            variant="danger"
            onClick={() => clearAll.mutate()}
            disabled={clearAll.isPending}
            className="flex items-center gap-1.5 text-sm"
          >
            <Trash2 size={16} /> Clear All
          </NeoButton>
        )}
      </div>

      <div className="space-y-4">
        {(!notifications || notifications.length === 0) ? (
          <div className="border-4 border-black border-dashed p-16 text-center bg-white shadow-neo">
            <div className="text-5xl mb-3">🔔</div>
            <h3 className="font-serif text-2xl font-black mb-1">You're All Caught Up!</h3>
            <p className="text-gray-600 font-medium">When students request your textbooks or respond to your rentals, notifications will appear here.</p>
          </div>
        ) : (
          notifications.map((notif: any) => {
            const isUnread = !notif.is_seen && !notif.seen;
            return (
              <div 
                key={notif.id} 
                onClick={() => handleOpenNotification(notif)}
                className={`border-4 border-black p-6 shadow-neo flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-neo-hover ${
                  isUnread ? "bg-neo-yellow ring-2 ring-black" : "bg-white opacity-85"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 border-2 border-black flex items-center justify-center flex-shrink-0 shadow-sm ${
                    isUnread ? "bg-black text-white" : "bg-gray-100 text-gray-700"
                  }`}>
                    <Bell size={20} className={isUnread ? "animate-pulse" : ""} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {isUnread && (
                        <span className="bg-red-500 text-white text-[10px] font-black uppercase px-2 py-0.5 border border-black shadow-sm">
                          New Request
                        </span>
                      )}
                      <span className="text-xs font-bold text-gray-600">
                        {new Date(notif.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="font-bold text-lg leading-snug">{notif.message}</p>
                    <p className="text-xs font-bold text-blue-800 mt-1 flex items-center gap-1">
                      Click to review & approve in Dashboard <ArrowRight size={12} />
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto justify-end shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => handleOpenNotification(notif)}
                    className="border-2 border-black bg-white hover:bg-neo-green px-4 py-2 font-black text-sm shadow-neo transition-colors flex items-center gap-1.5"
                  >
                    View in Dashboard <ExternalLink size={14} />
                  </button>

                  <button 
                    onClick={() => deleteNotif.mutate(notif.id)}
                    className="border-2 border-black bg-red-400 hover:bg-red-500 text-white p-2 shadow-neo"
                    title="Delete Notification"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
