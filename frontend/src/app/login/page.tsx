"use client";

import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router]);

  const handleGoogleSignIn = async () => {
    if (!auth) {
      setError("Firebase is not configured. Please add config to .env.local");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const result = await signInWithPopup(auth, googleProvider);
      
      if (!result.user.email?.endsWith("@vitstudent.ac.in")) {
        await auth.signOut();
        throw new Error("Only @vitstudent.ac.in emails are allowed.");
      }

      const token = await result.user.getIdToken();
      
      // Call backend to ensure user profile is created
      await api.post("/user/signup", {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center min-h-[calc(100vh-84px)] px-4">
      <div className="w-full max-w-md border-4 border-black bg-neo-purple p-8 text-center shadow-neo">
        <h1 className="font-serif text-4xl font-black mb-2">Welcome Back</h1>
        <p className="font-medium text-lg mb-8">Sign in to rent books and share notes.</p>
        
        {error && (
          <div className="bg-red-200 border-2 border-black p-3 mb-6 font-bold text-red-900">
            {error}
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full border-4 border-black bg-neo-yellow px-6 py-4 font-bold text-xl shadow-neo hover:shadow-neo-hover active:shadow-neo-active transition-all flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "G Sign in with Google"}
        </button>
      </div>
    </div>
  );
}
