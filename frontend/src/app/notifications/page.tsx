"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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

  if (loading || isLoading) return <div className="p-8 text-center font-bold text-2xl">Loading notifications...</div>;
  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto w-full px-8 py-12 flex-grow">
      <div className="flex justify-between items-end mb-12 border-b-4 border-black pb-6">
        <h1 className="font-serif text-5xl font-black">Notifications</h1>
        {notifications && notifications.length > 0 && (
          <button 
            onClick={() => clearAll.mutate()}
            className="border-2 border-black bg-red-400 text-white px-4 py-2 font-bold shadow-neo hover:shadow-neo-hover active:shadow-neo-active"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-4">
        {(!notifications || notifications.length === 0) ? (
          <div className="border-4 border-black border-dashed p-12 text-center text-gray-600 font-bold text-xl">
            You're all caught up!
          </div>
        ) : (
          notifications.map((notif: any) => (
            <div 
              key={notif.id} 
              className={`border-4 border-black p-6 shadow-neo flex justify-between items-center ${
                notif.is_seen ? "bg-white opacity-70" : "bg-neo-yellow"
              }`}
            >
              <div>
                <p className="font-bold text-lg mb-1">{notif.message}</p>
                <p className="text-sm font-medium text-gray-600">
                  {new Date(notif.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                {!notif.is_seen && (
                  <button 
                    onClick={() => markSeen.mutate(notif.id)}
                    className="border-2 border-black bg-white px-3 py-1 font-bold text-sm shadow-neo hover:bg-gray-100"
                  >
                    Mark Seen
                  </button>
                )}
                <button 
                  onClick={() => deleteNotif.mutate(notif.id)}
                  className="border-2 border-black bg-red-400 text-white px-3 py-1 font-bold text-sm shadow-neo"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
