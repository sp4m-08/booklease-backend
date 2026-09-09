"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { NeoCard } from "@/components/ui/NeoCard";
import { NeoInput } from "@/components/ui/NeoInput";
import { NeoButton } from "@/components/ui/NeoButton";
import Link from "next/link";
import { ChevronDown, BookOpen, ShieldCheck, RefreshCw, GraduationCap, Clock, MapPin, Sparkles, Bookmark, UploadCloud } from "lucide-react";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

const defaultVITFAQs: FAQItem[] = [
  {
    id: 1,
    question: "How does Booklease help with CAT-2 and FAT exam preparation at VIT Vellore?",
    answer: "Instead of buying expensive ₹1,000+ reference textbooks (like Cormen Algorithms, Morris Mano DSD, Sedra Smith Microelectronics, Korth DBMS), you can borrow physical copies from peers according to your exam slots or for specific days, as well as download digital module-wise notes and formula cheatsheets."
  },
  {
    id: 2,
    question: "How do book handovers and returns work on the VIT campus?",
    answer: "Once the book owner approves your rental request on Booklease, you can click 'Chat with Owner on WhatsApp' to coordinate a quick handover anywhere over campus in VIT Vellore."
  },
  {
    id: 3,
    question: "Can I borrow books according to exam slots or for specific days?",
    answer: "Yes! When requesting a textbook, you can borrow it according to your exam slots or choose flexible rental durations by days (such as 7 Days for CAT-2 revision, 15 Days for FATs & lab prep, 1 Month, or a Full Semester)."
  },
  {
    id: 4,
    question: "How does the Book Waitlist / Wishlist work if a book is already rented out?",
    answer: "If a required textbook is currently rented out by another student, click 'Add to Wishlist' on the book's page. This places you on the waitlist so you can track its live status from your Profile/Wishlist and immediately request it as soon as the current student's exam slot ends or the book is returned."
  },
  {
    id: 5,
    question: "How do I upload handwritten notes or list my reference textbooks for rent?",
    answer: "To share notes, go to 'Notes' and click 'Upload Notes'. Enter your subject, course code, module number, and attach your PDF or document. To list physical textbooks, head to 'Your Listings' -> 'List a Book', upload clear photos, set your rental price and slot/daily rates, and publish instantly for students across VIT Vellore."
  },
  {
    id: 6,
    question: "Why is authentication restricted to @vitstudent.ac.in emails?",
    answer: "To ensure a 100% verified, trusted, and safe student-to-student community. Every user is authenticated with their official VIT email, eliminating spam and lost books."
  },
  {
    id: 7,
    question: "What types of study material and notes can I upload?",
    answer: "You can upload module-wise handwritten lecture notes, CAT-2 solved question papers, formula sheets, lab manuals, and FAT revision cheatsheets in PDF, Word (.doc/.docx), or image formats."
  },
  {
    id: 8,
    question: "How do I return a borrowed textbook after my exam is over?",
    answer: "Head to Dashboard -> 'Books You Requested', and click 'Return Book'. Hand the physical book back to the owner anywhere over campus in VIT Vellore, and the owner will mark the return complete to restore the book's availability for other students."
  }
];

export default function FAQPage() {
  const [search, setSearch] = useState("");
  const [openItems, setOpenItems] = useState<{ [key: number]: boolean }>({ 0: true });

  const { data: apiFAQs, isLoading } = useQuery<FAQItem[]>({
    queryKey: ["faqs"],
    queryFn: async () => {
      try {
        const res = await api.get("/api/FAQ");
        if (Array.isArray(res.data) && res.data.length > 0) {
          return res.data;
        }
      } catch (e) {
        console.warn("Could not fetch FAQs from backend, using defaults:", e);
      }
      return defaultVITFAQs;
    }
  });

  const faqs = (apiFAQs && apiFAQs.length > 0) ? apiFAQs : defaultVITFAQs;

  const filteredFAQs = faqs.filter(
    (item) =>
      item.question.toLowerCase().includes(search.toLowerCase()) ||
      item.answer.toLowerCase().includes(search.toLowerCase())
  );

  const toggleItem = (index: number) => {
    setOpenItems((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="max-w-5xl mx-auto w-full px-6 py-12 flex-grow">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 border-4 border-black bg-neo-yellow px-4 py-1.5 text-sm font-black uppercase mb-4 shadow-neo">
          <Sparkles className="w-4 h-4 text-black" />
          <span>Built for VIT Students</span>
        </div>
        <h1 className="font-serif text-5xl md:text-6xl font-black mb-4">
          CAT-2 & FAT Exam Prep FAQ
        </h1>
        <p className="font-medium text-xl text-gray-700 max-w-2xl mx-auto">
          Everything you need to know about renting reference books, sharing handwritten notes, and campus handovers.
        </p>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <NeoCard color="blue" className="text-center p-6">
          <Clock className="w-10 h-10 mx-auto mb-3" />
          <h3 className="font-black text-xl mb-1">CAT-2 & FAT</h3>
          <p className="text-sm font-medium text-gray-800">Borrow reference books tailored to your exam slots or rent flexibly by days.</p>
        </NeoCard>
        <NeoCard color="yellow" className="text-center p-6">
          <MapPin className="w-10 h-10 mx-auto mb-3" />
          <h3 className="font-black text-xl mb-1">Campus Handover</h3>
          <p className="text-sm font-medium text-gray-800">Meet up anywhere over campus in VIT Vellore.</p>
        </NeoCard>
        <NeoCard color="peach" className="text-center p-6">
          <ShieldCheck className="w-10 h-10 mx-auto mb-3" />
          <h3 className="font-black text-xl mb-1">VIT Verified Only</h3>
          <p className="text-sm font-medium text-gray-800">Safe peer network verified with @vitstudent.ac.in emails.</p>
        </NeoCard>
      </div>

      {/* Search Filter */}
      <div className="mb-8">
        <NeoInput
          placeholder="Search VIT exam prep questions (e.g. CAT, FAT, handovers, returns, notes)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Accordion FAQ Items */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center font-bold text-xl">Loading questions...</div>
        ) : filteredFAQs.length === 0 ? (
          <div className="p-8 text-center border-4 border-black bg-white shadow-neo font-bold">
            No matching questions found for "{search}".
          </div>
        ) : (
          filteredFAQs.map((faq, index) => {
            const isOpen = !!openItems[index];
            return (
              <div
                key={faq.id || index}
                className="border-4 border-black bg-white shadow-neo transition-all"
              >
                <button
                  onClick={() => toggleItem(index)}
                  className="w-full p-6 text-left font-serif font-black text-xl md:text-2xl flex justify-between items-center hover:bg-neo-purple/10 transition-colors"
                >
                  <span className="pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-6 h-6 flex-shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-black" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 pt-2 border-t-2 border-dashed border-black font-medium text-lg text-gray-800 leading-relaxed bg-gray-50">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Help Banner */}
      <div className="mt-16 border-4 border-black bg-neo-green p-8 shadow-neo flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
        <div>
          <h2 className="font-serif text-3xl font-black mb-1">Ready for your upcoming CAT/FAT exams?</h2>
          <p className="font-medium text-lg text-gray-900">Find reference books and revision notes from your peers right now.</p>
        </div>
        <div className="flex gap-4">
          <Link href="/books">
            <NeoButton variant="primary" size="lg">Find Books</NeoButton>
          </Link>
          <Link href="/notes">
            <NeoButton variant="secondary" size="lg" className="bg-white">Browse Notes</NeoButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
