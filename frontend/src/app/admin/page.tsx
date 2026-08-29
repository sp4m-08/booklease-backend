"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { NeoCard } from "@/components/ui/NeoCard";
import { NeoButton } from "@/components/ui/NeoButton";
import { toast } from "sonner";
import { useState } from "react";

export default function AdminDashboardPage() {
  const { user, loading, userProfile } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"books" | "notes">("books");

  const { data: books, isLoading: booksLoading } = useQuery<any[]>({
    queryKey: ["books"],
    queryFn: async () => {
      const response = await api.get("/book/");
      return response.data;
    },
    enabled: !!userProfile?.is_admin,
  });

  const { data: notes, isLoading: notesLoading } = useQuery<any[]>({
    queryKey: ["notes"],
    queryFn: async () => {
      const response = await api.get("/notes/");
      return response.data;
    },
    enabled: !!userProfile?.is_admin,
  });

  const deleteBookMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/book/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast.success("Book deleted permanently");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete book");
    }
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/notes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Note deleted permanently");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete note");
    }
  });

  if (loading || !userProfile) return <div className="p-8 text-center font-bold">Loading...</div>;
  if (!user || !userProfile.is_admin) {
    return (
      <div className="flex-grow flex items-center justify-center p-8 text-center">
        <div className="bg-red-200 border-4 border-black p-8 font-black text-2xl shadow-neo max-w-lg">
          ACCESS DENIED. You are not an administrator.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-8 py-12 flex-grow">
      <div className="mb-12 border-b-4 border-black pb-6">
        <h1 className="font-serif text-5xl font-black mb-2 text-red-600">Admin Moderation Panel</h1>
        <p className="font-medium text-xl text-gray-700">Manage all content on the platform.</p>
      </div>

      <div className="flex gap-4 mb-8">
        <NeoButton 
          variant="primary" 
          onClick={() => setActiveTab("books")}
          className={activeTab === "books" ? "bg-black text-white" : "bg-white"}
        >
          Manage Books
        </NeoButton>
        <NeoButton 
          variant="primary" 
          onClick={() => setActiveTab("notes")}
          className={activeTab === "notes" ? "bg-black text-white" : "bg-white"}
        >
          Manage Notes
        </NeoButton>
      </div>

      <NeoCard color="white" className="overflow-x-auto">
        {activeTab === "books" && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-4 border-black text-xl">
                <th className="p-4">ID</th>
                <th className="p-4">Title</th>
                <th className="p-4">Uploader</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {booksLoading ? (
                <tr><td colSpan={4} className="p-4 text-center font-bold">Loading...</td></tr>
              ) : books?.length === 0 ? (
                <tr><td colSpan={4} className="p-4 text-center font-bold">No books found.</td></tr>
              ) : books?.map((book) => (
                <tr key={book.id} className="border-b-2 border-gray-300 font-medium">
                  <td className="p-4">#{book.id}</td>
                  <td className="p-4">{book.title}</td>
                  <td className="p-4">{book.uploader?.username ? book.uploader.username.replace(/\b\d{2}[A-Z]{3}\d{4}\b/gi, '').trim() : `User #${book.uploaded_by}`}</td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => {
                        if (confirm(`Are you sure you want to permanently delete "${book.title}"?`)) {
                          deleteBookMutation.mutate(book.id);
                        }
                      }}
                      className="bg-red-500 text-white font-bold border-2 border-black px-4 py-2 hover:bg-red-600 shadow-sm"
                    >
                      DELETE
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {activeTab === "notes" && (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-4 border-black text-xl">
                <th className="p-4">ID</th>
                <th className="p-4">Title</th>
                <th className="p-4">Uploader</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {notesLoading ? (
                <tr><td colSpan={4} className="p-4 text-center font-bold">Loading...</td></tr>
              ) : notes?.length === 0 ? (
                <tr><td colSpan={4} className="p-4 text-center font-bold">No notes found.</td></tr>
              ) : notes?.map((note) => (
                <tr key={note.id} className="border-b-2 border-gray-300 font-medium">
                  <td className="p-4">#{note.id}</td>
                  <td className="p-4">{note.title}</td>
                  <td className="p-4">{note.uploader?.username ? note.uploader.username.replace(/\b\d{2}[A-Z]{3}\d{4}\b/gi, '').trim() : `User #${note.uploaded_by}`}</td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => {
                        if (confirm(`Are you sure you want to permanently delete "${note.title}"?`)) {
                          deleteNoteMutation.mutate(note.id);
                        }
                      }}
                      className="bg-red-500 text-white font-bold border-2 border-black px-4 py-2 hover:bg-red-600 shadow-sm"
                    >
                      DELETE
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </NeoCard>
    </div>
  );
}
