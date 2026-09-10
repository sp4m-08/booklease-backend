"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { getStoredCache, setStoredCache, preloadImages } from "@/lib/cache";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5, // 5 minutes fresh data (instant page transitions)
          gcTime: 1000 * 60 * 60, // Keep in cache memory for 1 hour
          refetchOnWindowFocus: false, // Prevent background refetch bursts on tab switches
          refetchOnReconnect: true, // Auto refetch when internet reconnects
          retry: 2, // Retry on transient network errors / cold starts
        },
      },
    });

    // Seed query cache synchronously on client from localStorage if available
    if (typeof window !== "undefined") {
      const cachedBooks = getStoredCache<any[]>("books");
      if (cachedBooks) {
        client.setQueryData(["books"], cachedBooks);
        preloadImages(cachedBooks.map(b => b.cover_image));
      }
      const cachedNotes = getStoredCache<any[]>("notes");
      if (cachedNotes) {
        client.setQueryData(["notes"], cachedNotes);
        preloadImages(cachedNotes.map(n => n.file_path));
      }
    }

    return client;
  });

  // Background warm-up and prefetch immediately on app mount
  useEffect(() => {
    // 1. Warm-up backend ping
    api.get("/healthz").catch(() => {});

    // 2. Prefetch books in the background & update local storage
    queryClient
      .prefetchQuery({
        queryKey: ["books"],
        queryFn: async () => {
          const res = await api.get("/book/");
          if (Array.isArray(res.data)) {
            setStoredCache("books", res.data);
            preloadImages(res.data.map(b => b.cover_image));
          }
          return res.data;
        },
      })
      .catch(() => {});

    // 3. Prefetch notes in the background & update local storage
    queryClient
      .prefetchQuery({
        queryKey: ["notes"],
        queryFn: async () => {
          const res = await api.get("/notes/");
          if (Array.isArray(res.data)) {
            setStoredCache("notes", res.data);
            preloadImages(res.data.map(n => n.file_path));
          }
          return res.data;
        },
      })
      .catch(() => {});
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}

