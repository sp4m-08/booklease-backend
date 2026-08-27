"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { NeoCard } from "@/components/ui/NeoCard";
import { NeoButton } from "@/components/ui/NeoButton";
import { NeoInput } from "@/components/ui/NeoInput";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  // Fetch User Profile
  const { data: profile, isLoading: loadingProfile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await api.get("/user/");
      return res.data;
    },
    enabled: !!user,
  });

  // Fetch Wishlist
  const { data: wishlist, isLoading: loadingWishlist } = useQuery({
    queryKey: ["wishlist"],
    queryFn: async () => {
      const res = await api.get("/book/wishlist");
      return res.data || [];
    },
    enabled: !!user,
  });

  // Fetch My Books
  const { data: myBooks, isLoading: loadingMyBooks } = useQuery({
    queryKey: ["mybooks"],
    queryFn: async () => {
      const res = await api.get("/book/mybooks");
      return res.data || [];
    },
    enabled: !!user,
  });

  // Update Phone Mutation
  const updatePhone = useMutation({
    mutationFn: async (phoneNumber: string) => {
      return api.post("/user/phone", { phone_number: phoneNumber });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Phone number updated!");
      setPhone("");
    },
    onError: () => {
      toast.error("Failed to update phone number.");
    }
  });

  // Delete Book Mutation
  const deleteBook = useMutation({
    mutationFn: async (bookId: number) => {
      return api.delete(`/book/${bookId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mybooks"] });
      toast.success("Book deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete book.");
    }
  });

  if (loading || loadingProfile) return <div className="p-8 text-center font-bold text-2xl animate-pulse">Loading profile...</div>;
  if (!user || !profile) return null;

  return (
    <div className="max-w-6xl mx-auto w-full px-8 py-12 flex-grow">
      <h1 className="font-serif text-5xl font-black mb-12 border-b-4 border-black pb-6">Your Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* User Details Sidebar */}
        <div className="lg:col-span-1 space-y-8">
          <NeoCard color="purple" className="flex flex-col space-y-6">
            <h2 className="font-serif text-3xl font-black">Account Details</h2>
            <div className="space-y-4 font-medium text-lg overflow-hidden">
              <div className="break-words">
                <strong>Name:</strong> <br/>
                <span className="text-gray-800">{profile.username}</span>
              </div>
              <div className="break-all">
                <strong>Email:</strong> <br/>
                <span className="text-gray-800">{profile.email}</span>
              </div>
              <div>
                <strong>Reg No:</strong> <br/>
                <span className="text-gray-800">{profile.registration_no || "N/A"}</span>
              </div>
              <div>
                <strong>Phone:</strong> <br/>
                <span className="text-gray-800">{profile.phone_number || "Not Set"}</span>
              </div>
              
              <div className="pt-6 border-t-4 border-black">
                <label className="block font-bold mb-2">Update Phone Number</label>
                <div className="flex flex-col gap-3">
                  <NeoInput 
                    placeholder="Enter phone..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <NeoButton 
                    variant="primary"
                    onClick={() => updatePhone.mutate(phone)}
                    disabled={updatePhone.isPending || !phone}
                    className="w-full"
                  >
                    Save
                  </NeoButton>
                </div>
              </div>
            </div>
          </NeoCard>
        </div>

        {/* Wishlist & My Books */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Wishlist */}
          <div>
            <h2 className="font-serif text-3xl font-black mb-6 bg-neo-peach inline-block px-4 py-1 border-4 border-black shadow-neo">Your Wishlist</h2>
            <div className="space-y-4">
              {(!wishlist || wishlist.length === 0) ? (
                <p className="font-medium text-gray-600 border-4 border-black border-dashed p-6 bg-white">Your wishlist is empty.</p>
              ) : (
                wishlist.map((item: any) => (
                  <NeoCard key={item.id} color="white" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="overflow-hidden w-full pr-4">
                      <h3 className="font-bold text-xl truncate">{item.book?.title}</h3>
                      <p className="text-sm font-medium text-gray-600 truncate">{item.book?.author}</p>
                    </div>
                    <Link href={`/books/${item.book?.id}`} className="shrink-0 w-full sm:w-auto">
                      <NeoButton variant="secondary" className="w-full">View</NeoButton>
                    </Link>
                  </NeoCard>
                ))
              )}
            </div>
          </div>

          {/* My Uploaded Books */}
          <div>
            <h2 className="font-serif text-3xl font-black mb-6 bg-neo-green inline-block px-4 py-1 border-4 border-black shadow-neo">Books You Uploaded</h2>
            <div className="space-y-4">
              {(!myBooks || myBooks.length === 0) ? (
                <p className="font-medium text-gray-600 border-4 border-black border-dashed p-6 bg-white">You haven't uploaded any books yet.</p>
              ) : (
                myBooks.map((book: any) => (
                  <NeoCard key={book.id} color="white" className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="overflow-hidden w-full pr-4">
                      <h3 className="font-bold text-xl truncate">{book.title}</h3>
                      <p className="text-sm font-medium text-gray-600">
                        {book.available ? "🟢 Available" : "🔴 Rented Out"}
                      </p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto shrink-0">
                      <Link href={`/books/${book.id}`} className="flex-1">
                        <NeoButton variant="primary" className="w-full">View</NeoButton>
                      </Link>
                      <NeoButton 
                        variant="danger"
                        className="flex-1"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${book.title}"?`)) {
                            deleteBook.mutate(book.id);
                          }
                        }}
                        disabled={deleteBook.isPending}
                      >
                        Delete
                      </NeoButton>
                    </div>
                  </NeoCard>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
