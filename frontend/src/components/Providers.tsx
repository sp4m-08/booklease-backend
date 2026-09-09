"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes fresh data (instant page transitions)
            gcTime: 1000 * 60 * 30, // Keep in cache memory for 30 minutes
            refetchOnWindowFocus: false, // Prevent background refetch bursts on tab switches
            refetchOnReconnect: true, // Auto refetch when internet reconnects
            retry: 1, // Quick retry on transient network errors
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}
