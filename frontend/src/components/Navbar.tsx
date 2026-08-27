"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef } from "react";
import { Menu, X } from "lucide-react";
import { NeoButton } from "./ui/NeoButton";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Navbar() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await signOut(auth);
    setMobileOpen(false);
    router.push("/");
  };

  const navLinks = [
    { name: "Books", href: "/books", color: "hover:bg-neo-blue" },
    { name: "Notes", href: "/notes", color: "hover:bg-neo-peach" },
  ];

  if (user) {
    navLinks.push({ name: "Dashboard", href: "/dashboard", color: "hover:bg-neo-purple" });
    navLinks.push({ name: "Profile", href: "/profile", color: "hover:bg-neo-yellow" });
    navLinks.push({ name: "Alerts", href: "/notifications", color: "hover:bg-neo-green" });
  }

  useGSAP(() => {
    // 1. Hide/Show Navbar on scroll
    let lastScrollY = window.scrollY;
    
    ScrollTrigger.create({
      start: "top top",
      end: 99999,
      onUpdate: (self) => {
        if (!headerRef.current) return;
        const currentScrollY = window.scrollY;
        
        // Add shadow when scrolled down
        if (currentScrollY > 10) {
          headerRef.current.classList.add("shadow-neo-lg");
        } else {
          headerRef.current.classList.remove("shadow-neo-lg");
        }

        // Hide on scroll down, show on scroll up
        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          gsap.to(headerRef.current, { yPercent: -100, duration: 0.3, ease: "power2.out" });
        } else {
          gsap.to(headerRef.current, { yPercent: 0, duration: 0.3, ease: "power2.out" });
        }
        lastScrollY = currentScrollY;
      }
    });

    // 2. Logo Hover Wiggle
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
      <Link href="/" onClick={() => setMobileOpen(false)}>
        <div ref={logoRef} className="text-3xl font-serif font-black tracking-tight border-4 border-black px-4 py-2 bg-neo-yellow shadow-neo cursor-pointer select-none">
          Booklease
        </div>
      </Link>
      
      {/* Desktop Nav */}
      <nav className="hidden md:flex gap-4 items-center font-bold text-lg">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link 
              key={link.name} 
              href={link.href} 
              className={`px-4 py-2 border-2 transition-all duration-200 transform hover:-translate-y-1 ${
                isActive 
                  ? "border-black shadow-neo bg-gray-100" 
                  : `border-transparent hover:border-black hover:shadow-neo ${link.color}`
              }`}
            >
              {link.name}
            </Link>
          );
        })}
        
        <div className="ml-4 border-l-4 border-black pl-8">
          {user ? (
            <NeoButton variant="danger" size="md" onClick={handleSignOut}>
              Sign Out
            </NeoButton>
          ) : (
            <Link href="/login">
              <NeoButton variant="primary" size="md">Sign In</NeoButton>
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile Toggle */}
      <button 
        className="md:hidden border-4 border-black p-2 bg-neo-yellow shadow-neo active:shadow-none active:translate-y-1 transition-all"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={24} strokeWidth={3} /> : <Menu size={24} strokeWidth={3} />}
      </button>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="absolute top-[80px] left-0 w-full bg-white border-b-4 border-black flex flex-col p-6 gap-4 font-bold text-2xl z-40 md:hidden shadow-neo-lg">
          {navLinks.map((link) => (
            <Link 
              key={link.name} 
              href={link.href} 
              onClick={() => setMobileOpen(false)}
              className={`w-full border-4 border-black px-6 py-4 transition-transform active:scale-95 ${link.color} ${
                pathname === link.href ? "bg-gray-100 shadow-neo translate-x-2" : "bg-white"
              }`}
            >
              {link.name}
            </Link>
          ))}
          
          <div className="border-t-4 border-black pt-6 mt-4">
            {user ? (
              <NeoButton variant="danger" size="lg" className="w-full" onClick={handleSignOut}>
                Sign Out
              </NeoButton>
            ) : (
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <NeoButton variant="primary" size="lg" className="w-full">Sign In</NeoButton>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
