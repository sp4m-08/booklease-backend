"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef } from "react";
import { Menu, X, Bell, Shield, BookOpen, FileText, HelpCircle, LayoutDashboard, User } from "lucide-react";
import { NeoButton } from "./ui/NeoButton";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Navbar() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  // Fetch unread notifications count
  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await api.get("/notifications/");
      return res.data || [];
    },
    enabled: !!user,
    refetchInterval: 30000, // Check every 30 seconds
  });

  const unreadCount = Array.isArray(notifications) 
    ? notifications.filter((n: any) => !n.is_seen && !n.seen).length 
    : 0;

  const handleSignOut = async () => {
    await signOut(auth);
    setMobileOpen(false);
    router.push("/");
  };

  const navLinks = [
    { name: "Books", href: "/books", color: "hover:bg-neo-blue" },
    { name: "Notes", href: "/notes", color: "hover:bg-neo-peach" },
    { name: "FAQ", href: "/faq", color: "hover:bg-neo-yellow" },
  ];

  if (user) {
    navLinks.push({ name: "Your Listings", href: "/listings", color: "hover:bg-neo-yellow" });
    navLinks.push({ name: "Dashboard", href: "/dashboard", color: "hover:bg-neo-purple" });
    navLinks.push({ name: "Profile", href: "/profile", color: "hover:bg-neo-green" });
  }

  useGSAP(() => {
    let lastScrollY = window.scrollY;
    
    ScrollTrigger.create({
      start: "top top",
      end: 99999,
      onUpdate: () => {
        if (!headerRef.current) return;
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 10) {
          headerRef.current.classList.add("shadow-neo-lg");
        } else {
          headerRef.current.classList.remove("shadow-neo-lg");
        }

        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          gsap.to(headerRef.current, { yPercent: -100, duration: 0.3, ease: "power2.out" });
        } else {
          gsap.to(headerRef.current, { yPercent: 0, duration: 0.3, ease: "power2.out" });
        }
        lastScrollY = currentScrollY;
      }
    });

    if (logoRef.current) {
      logoRef.current.addEventListener("mouseenter", () => {
        gsap.to(logoRef.current, { 
          rotate: "random(-5, 5)", 
          scale: 1.05, 
          duration: 0.2, 
          ease: "back.out(2)" 
        });
      });
      logoRef.current.addEventListener("mouseleave", () => {
        gsap.to(logoRef.current, { 
          rotate: 0, 
          scale: 1, 
          duration: 0.2, 
          ease: "back.out(2)" 
        });
      });
    }
  }, { scope: headerRef });

  return (
    <header 
      ref={headerRef} 
      className="flex items-center justify-between px-6 py-4 border-b-4 border-black bg-white sticky top-0 z-50 transition-shadow duration-300"
    >
      {/* Brand Logo */}
      <Link href="/" onClick={() => setMobileOpen(false)}>
        <div ref={logoRef} className="text-3xl font-serif font-black tracking-tight border-4 border-black px-4 py-2 bg-neo-yellow shadow-neo cursor-pointer select-none flex items-center gap-2">
          Booklease
        </div>
      </Link>
      
      {/* Desktop Navigation */}
      <nav className="hidden md:flex gap-3 items-center font-bold text-base">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link 
              key={link.name} 
              href={link.href} 
              className={`px-4 py-2 border-2 transition-all duration-200 transform hover:-translate-y-0.5 ${
                isActive 
                  ? "border-black shadow-neo bg-gray-100 font-black" 
                  : `border-transparent hover:border-black hover:shadow-neo ${link.color}`
              }`}
            >
              {link.name}
            </Link>
          );
        })}

        {/* Notifications Icon with Unread Badge */}
        {user && (
          <Link 
            href="/notifications" 
            className={`relative p-2.5 border-2 transition-all hover:border-black hover:shadow-neo hover:bg-neo-yellow ${
              pathname === "/notifications" ? "border-black shadow-neo bg-neo-yellow" : "border-transparent"
            }`}
            title="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[11px] font-black w-5 h-5 rounded-full border-2 border-black flex items-center justify-center animate-bounce">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        )}

        {/* Admin Badge link if admin */}
        {userProfile?.is_admin && (
          <Link 
            href="/admin" 
            className={`px-3 py-1.5 border-2 border-black bg-red-500 text-white text-sm font-black shadow-neo hover:bg-red-600 transition-all flex items-center gap-1.5 ${
              pathname === "/admin" ? "ring-2 ring-black" : ""
            }`}
          >
            <Shield size={16} /> Admin
          </Link>
        )}
        
        {/* Auth CTA */}
        <div className="ml-2 border-l-4 border-black pl-6">
          {user ? (
            <NeoButton variant="danger" size="sm" onClick={handleSignOut}>
              Sign Out
            </NeoButton>
          ) : (
            <Link href="/login">
              <NeoButton variant="primary" size="sm" className="bg-neo-green">Sign In</NeoButton>
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile Menu Toggle */}
      <button 
        className="md:hidden border-4 border-black p-2 bg-neo-yellow shadow-neo active:shadow-none active:translate-y-1 transition-all"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle Navigation Menu"
      >
        {mobileOpen ? <X size={24} strokeWidth={3} /> : <Menu size={24} strokeWidth={3} />}
      </button>

      {/* Mobile Dropdown Menu */}
      {mobileOpen && (
        <div className="absolute top-[80px] left-0 w-full bg-white border-b-4 border-black flex flex-col p-6 gap-3 font-bold text-xl z-40 md:hidden shadow-neo-lg max-h-[85vh] overflow-y-auto">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href} 
              onClick={() => setMobileOpen(false)}
              className={`w-full border-4 border-black px-5 py-3 transition-transform active:scale-95 ${link.color} ${
                pathname === link.href ? "bg-gray-100 shadow-neo translate-x-1 font-black" : "bg-white"
              }`}
            >
              {link.name}
            </Link>
          ))}

          {user && (
            <Link 
              href="/notifications" 
              onClick={() => setMobileOpen(false)}
              className={`w-full border-4 border-black px-5 py-3 flex justify-between items-center bg-white hover:bg-neo-yellow ${
                pathname === "/notifications" ? "bg-neo-yellow shadow-neo" : ""
              }`}
            >
              <span>Alerts & Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 border border-black rounded-full">
                  {unreadCount} new
                </span>
              )}
            </Link>
          )}

          {userProfile?.is_admin && (
            <Link 
              href="/admin" 
              onClick={() => setMobileOpen(false)}
              className="w-full border-4 border-black px-5 py-3 bg-red-500 text-white font-black shadow-neo"
            >
              <div className="flex items-center gap-2">
                <Shield size={20} /> Admin Moderation Panel
              </div>
            </Link>
          )}
          
          <div className="border-t-4 border-black pt-4 mt-2">
            {user ? (
              <NeoButton variant="danger" size="lg" className="w-full" onClick={handleSignOut}>
                Sign Out
              </NeoButton>
            ) : (
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <NeoButton variant="primary" size="lg" className="w-full bg-neo-green">Sign In</NeoButton>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
