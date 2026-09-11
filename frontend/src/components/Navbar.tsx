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
    { name: "Browse", href: "/browse", color: "hover:bg-neo-blue", icon: BookOpen },
    { name: "FAQ", href: "/faq", color: "hover:bg-neo-yellow", icon: HelpCircle },
  ];

  if (user) {
    navLinks.push({ name: "Your Listings", href: "/listings", color: "hover:bg-neo-yellow", icon: LayoutDashboard });
    navLinks.push({ name: "Dashboard", href: "/dashboard", color: "hover:bg-neo-purple", icon: LayoutDashboard });
    navLinks.push({ name: "Profile", href: "/profile", color: "hover:bg-neo-green", icon: User });
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
      className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b-4 border-black bg-white sticky top-0 z-50 transition-shadow duration-300"
    >
      {/* Brand Logo */}
      <Link href="/" onClick={() => setMobileOpen(false)}>
        <div ref={logoRef} className="text-xl sm:text-3xl font-serif font-black tracking-tight border-3 sm:border-4 border-black px-3 py-1.5 sm:px-4 sm:py-2 bg-neo-yellow shadow-neo cursor-pointer select-none flex items-center gap-1.5 sm:gap-2">
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
              <NeoButton variant="primary" size="sm" className="bg-neo-green font-bold">Sign Up / In</NeoButton>
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile Right Quick Controls */}
      <div className="flex md:hidden items-center gap-2">
        {/* Quick Sign Up / In Button for Mobile visitors */}
        {!user && (
          <Link href="/login" onClick={() => setMobileOpen(false)}>
            <NeoButton variant="primary" size="sm" className="bg-neo-green font-black text-xs px-3 py-1.5 shadow-neo">
              Sign Up
            </NeoButton>
          </Link>
        )}

        {/* Mobile Quick Notifications Button */}
        {user && (
          <Link 
            href="/notifications" 
            onClick={() => setMobileOpen(false)}
            className="relative border-3 border-black p-2 bg-white shadow-neo active:shadow-none active:translate-y-1 transition-all"
            aria-label="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full border-2 border-black flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>
        )}

        {/* Mobile Menu Toggle */}
        <button 
          className="border-3 border-black p-2 bg-neo-yellow shadow-neo active:shadow-none active:translate-y-1 transition-all touch-target flex items-center justify-center"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle Navigation Menu"
        >
          {mobileOpen ? <X size={22} strokeWidth={3} /> : <Menu size={22} strokeWidth={3} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileOpen && (
        <div className="absolute top-[64px] sm:top-[80px] left-0 w-full bg-white border-b-4 border-black flex flex-col p-4 sm:p-6 gap-2.5 font-bold text-lg z-40 md:hidden shadow-neo-lg max-h-[calc(100vh-70px)] overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.name} 
                href={link.href} 
                onClick={() => setMobileOpen(false)}
                className={`w-full border-3 border-black px-4 py-3 flex items-center gap-3 transition-transform active:scale-[0.98] ${link.color} ${
                  isActive ? "bg-gray-100 shadow-neo font-black" : "bg-white"
                }`}
              >
                <Icon size={20} />
                <span>{link.name}</span>
              </Link>
            );
          })}

          {user && (
            <Link 
              href="/notifications" 
              onClick={() => setMobileOpen(false)}
              className={`w-full border-3 border-black px-4 py-3 flex justify-between items-center bg-white hover:bg-neo-yellow ${
                pathname === "/notifications" ? "bg-neo-yellow shadow-neo" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell size={20} />
                <span>Alerts & Notifications</span>
              </div>
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
              className="w-full border-3 border-black px-4 py-3 bg-red-500 text-white font-black shadow-neo flex items-center gap-3"
            >
              <Shield size={20} />
              <span>Admin Moderation Panel</span>
            </Link>
          )}
          
          <div className="border-t-3 border-black pt-3 mt-1">
            {user ? (
              <NeoButton variant="danger" size="lg" className="w-full text-base py-3" onClick={handleSignOut}>
                Sign Out
              </NeoButton>
            ) : (
              <Link href="/login" onClick={() => setMobileOpen(false)} className="w-full block">
                <NeoButton variant="primary" size="lg" className="w-full bg-neo-green text-base py-3.5 font-black shadow-neo flex items-center justify-center gap-2">
                  Sign Up / Sign In
                </NeoButton>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
