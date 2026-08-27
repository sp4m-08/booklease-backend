"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function BookDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [renting, setRenting] = useState(false);

  const { data: book, isLoading } = useQuery({
    queryKey: ["book", id],
    queryFn: async () => {
      const response = await api.get(`/book/${id}`);
      return response.data;
    },
  });

  const wishlistMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/book/${id}/wishlist`);
    },
    onSuccess: () => {
      alert("Added to wishlist!");
    }
  });

  const handleRent = async () => {
    if (!user) {
      router.push("/login");
      return;
    }
    
    try {
      setRenting(true);
      await api.post("/rentals/", {
        book_id: parseInt(id as string),
        description: "Requesting to rent this book."
      });
      alert("Rental request sent successfully!");
    } catch (error) {
      alert("Failed to send rental request.");
      console.error(error);
    } finally {
      setRenting(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center font-bold text-2xl">Loading book...</div>;
  if (!book) return <div className="p-8 text-center font-bold text-red-500">Book not found.</div>;

  return (
    <div className="max-w-5xl mx-auto w-full px-8 py-12 flex-grow">
      <div className="flex flex-col md:flex-row gap-12">
        {/* Cover */}
        <div className="w-full md:w-1/3 flex-shrink-0">
          <div className="border-4 border-black bg-neo-blue shadow-neo aspect-[3/4] overflow-hidden">
            {book.cover_image ? (
              <img src={book.cover_image} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-serif text-3xl opacity-50 p-4 text-center bg-neo-yellow">
                No Cover
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="w-full md:w-2/3 flex flex-col items-start">
          <div className="inline-block border-2 border-black bg-neo-purple px-3 py-1 font-bold text-sm mb-4 shadow-neo">
            {book.category || "Book"}
          </div>
          <h1 className="font-serif text-5xl font-black mb-2">{book.title}</h1>
          <p className="text-2xl font-medium text-gray-700 mb-6">by {book.author}</p>
          
          <div className="border-t-4 border-black w-full my-6"></div>
          
          <h3 className="font-bold text-xl mb-2">Description</h3>
          <p className="text-lg mb-8 leading-relaxed">
            {book.description || "No description provided."}
          </p>

          <div className="mt-auto pt-8 flex gap-4 w-full sm:w-auto">
            {book.available ? (
              <button 
                onClick={handleRent}
                disabled={renting}
                className="flex-grow sm:flex-grow-0 border-4 border-black bg-neo-yellow px-8 py-4 font-bold text-xl shadow-neo hover:shadow-neo-hover active:shadow-neo-active transition-all disabled:opacity-50"
              >
                {renting ? "Requesting..." : "Rent this Book"}
              </button>
            ) : (
              <div className="border-4 border-black bg-gray-300 px-8 py-4 font-bold text-xl shadow-neo text-gray-600">
                Currently Rented Out
              </div>
            )}
            
            <button 
              onClick={() => wishlistMutation.mutate()}
              disabled={wishlistMutation.isPending}
              className="border-4 border-black bg-white px-6 py-4 font-bold text-xl shadow-neo hover:shadow-neo-hover active:shadow-neo-active transition-all disabled:opacity-50"
            >
              {wishlistMutation.isPending ? "Adding..." : "💜 Wishlist"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
