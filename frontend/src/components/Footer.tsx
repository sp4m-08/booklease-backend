"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { 
  GraduationCap, 
  Zap, 
  MapPin, 
  Book, 
  FileText, 
  PlusCircle, 
  Upload, 
  Package, 
  BarChart, 
  User, 
  HelpCircle 
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    // Staggered reveal animation for footer sections
    gsap.from(".footer-section", {
      scrollTrigger: {
        trigger: footerRef.current,
        start: "top 90%",
      },
      y: 30,
      opacity: 0,
      duration: 0.6,
      stagger: 0.15,
      ease: "power2.out"
    });

    // Icon hover animation setup (for links)
    const iconLinks = gsap.utils.toArray<HTMLElement>(".footer-link");
    iconLinks.forEach(link => {
      const icon = link.querySelector(".footer-icon");
      if (icon) {
        link.addEventListener("mouseenter", () => {
          gsap.to(icon, { scale: 1.2, rotate: "random(-10, 10)", duration: 0.3, ease: "back.out(2)" });
        });
        link.addEventListener("mouseleave", () => {
          gsap.to(icon, { scale: 1, rotate: 0, duration: 0.3, ease: "back.out(2)" });
        });
      }
    });
  }, { scope: footerRef });

  return (
    <footer ref={footerRef} className="border-t-4 border-black bg-white mt-auto overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand Col */}
          <div className="footer-section md:col-span-2 space-y-4">
            <div className="inline-block text-2xl font-serif font-black tracking-tight border-4 border-black px-3 py-1 bg-neo-yellow shadow-neo select-none">
              Booklease VIT
            </div>
            <p className="font-medium text-base text-gray-700 max-w-md">
              Peer-to-peer textbook rentals and handwritten study notes designed specifically for <strong>VIT Vellore University</strong> students preparing for <strong>CAT-1, CAT-2, and FAT</strong> exams.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="flex items-center gap-1 border-2 border-black px-2.5 py-0.5 bg-neo-green font-black text-xs uppercase shadow-sm">
                <GraduationCap size={14} /> VIT Vellore Verified
              </span>
              <span className="flex items-center gap-1 border-2 border-black px-2.5 py-0.5 bg-neo-yellow font-black text-xs uppercase shadow-sm">
                <Zap size={14} /> CAT & FAT Prep
              </span>
              <span className="flex items-center gap-1 border-2 border-black px-2.5 py-0.5 bg-neo-peach font-black text-xs uppercase shadow-sm">
                <MapPin size={14} /> SJT • TT • Hostels
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section space-y-3 font-bold text-sm">
            <h4 className="font-serif text-lg font-black uppercase tracking-wider text-black border-b-2 border-black pb-1">
              Exam Material
            </h4>
            <ul className="space-y-2 text-gray-800">
              <li>
                <Link href="/books" className="footer-link flex items-center gap-2 hover:text-black">
                  <Book size={16} className="footer-icon text-neo-purple drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]" /> Course Reference Books
                </Link>
              </li>
              <li>
                <Link href="/notes" className="footer-link flex items-center gap-2 hover:text-black">
                  <FileText size={16} className="footer-icon text-neo-peach drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]" /> CAT & FAT Revision Notes
                </Link>
              </li>
              <li>
                <Link href="/books/upload" className="footer-link flex items-center gap-2 hover:text-black">
                  <PlusCircle size={16} className="footer-icon text-neo-green drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]" /> List a Textbook for Rent
                </Link>
              </li>
              <li>
                <Link href="/notes/upload" className="footer-link flex items-center gap-2 hover:text-black">
                  <Upload size={16} className="footer-icon text-neo-yellow drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]" /> Share Module Cheatsheets
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Account */}
          <div className="footer-section space-y-3 font-bold text-sm">
            <h4 className="font-serif text-lg font-black uppercase tracking-wider text-black border-b-2 border-black pb-1">
              Campus Hub
            </h4>
            <ul className="space-y-2 text-gray-800">
              <li>
                <Link href="/listings" className="footer-link flex items-center gap-2 hover:text-black">
                  <Package size={16} className="footer-icon text-blue-300 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]" /> Your Active Listings
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="footer-link flex items-center gap-2 hover:text-black">
                  <BarChart size={16} className="footer-icon text-orange-300 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]" /> Rental Requests & Returns
                </Link>
              </li>
              <li>
                <Link href="/profile" className="footer-link flex items-center gap-2 hover:text-black">
                  <User size={16} className="footer-icon text-pink-300 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]" /> Student Profile & Wishlist
                </Link>
              </li>
              <li>
                <Link href="/faq" className="footer-link flex items-center gap-2 hover:text-black">
                  <HelpCircle size={16} className="footer-icon text-green-300 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]" /> CAT/FAT Prep & Campus FAQ
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="footer-section pt-8 border-t-2 border-dashed border-black flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold text-gray-600">
          <div>
            © {new Date().getFullYear()} Booklease. Built for VIT Vellore University students.
          </div>
          <div className="flex gap-4">
            <Link href="/faq" className="hover:underline text-gray-900">CAT/FAT Fair Use</Link>
            <span className="text-gray-400">•</span>
            <Link href="/faq" className="hover:underline text-gray-900">Hostel Handover Safety</Link>
            <span className="text-gray-400">•</span>
            <Link href="/faq" className="hover:underline text-gray-900">VIT Guidelines</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
