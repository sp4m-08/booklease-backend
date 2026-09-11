"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  BookOpen,
  FileText,
  Plus,
  Bell,
  User,
  LayoutDashboard,
  X,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const [isUploadSheetOpen, setIsUploadSheetOpen] = useState(false);

  // Fetch unread notifications for badge
  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await api.get("/notifications/");
      return res.data || [];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const unreadCount = Array.isArray(notifications)
    ? notifications.filter((n: any) => !n.is_seen && !n.seen).length
    : 0;

  const handleCenterPlusClick = () => {
    if (!user) {
      router.push("/login");
      return;
    }
    setIsUploadSheetOpen(true);
  };

  const navItems = [
    {
      label: "Browse",
      href: "/browse",
      icon: BookOpen,
      isActive: pathname === "/browse" || (pathname.startsWith("/books") && pathname !== "/books/upload") || (pathname.startsWith("/notes") && pathname !== "/notes/upload"),
    },
    {
      label: "Alerts",
      href: user ? "/notifications" : "/login",
      icon: Bell,
      isActive: pathname === "/notifications",
      badge: unreadCount,
    },
    {
      label: "Dashboard",
      href: user ? "/dashboard" : "/login",
      icon: LayoutDashboard,
      isActive: pathname === "/dashboard",
    },
    {
      label: user ? "Profile" : "Sign In",
      href: user ? "/profile" : "/login",
      icon: User,
      isActive: pathname === "/profile" || pathname === "/login",
    },
  ];

  return (
    <>
      {/* Sticky Bottom Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 inset-x-0 z-40 bg-white border-t-3 border-black shadow-[0_-3px_0_0_rgba(0,0,0,1)] md:hidden safe-area-pb"
      >
        <div className="flex items-center justify-around px-2 py-1 h-15 max-w-md mx-auto relative">
          
          {/* 1. Browse Tab */}
          <Link
            href={navItems[0].href}
            className={`flex flex-col items-center justify-center flex-1 py-0.5 transition-transform active:scale-95 ${
              navItems[0].isActive
                ? "text-black font-black"
                : "text-gray-600 hover:text-black font-bold"
            }`}
          >
            <div
              className={`p-1 rounded-sm border-2 transition-all ${
                navItems[0].isActive
                  ? "bg-neo-yellow border-black shadow-xs"
                  : "border-transparent"
              }`}
            >
              <BookOpen size={19} strokeWidth={navItems[0].isActive ? 2.5 : 2} />
            </div>
            <span className="text-[10px] font-bold leading-tight mt-0.5">
              {navItems[0].label}
            </span>
          </Link>

          {/* 2. Alerts Tab with Unread Badge */}
          <Link
            href={navItems[1].href}
            className={`flex flex-col items-center justify-center flex-1 py-0.5 transition-transform active:scale-95 relative ${
              navItems[1].isActive
                ? "text-black font-black"
                : "text-gray-600 hover:text-black font-bold"
            }`}
          >
            <div
              className={`p-1 rounded-sm border-2 relative transition-all ${
                navItems[1].isActive
                  ? "bg-neo-yellow border-black shadow-xs"
                  : "border-transparent"
              }`}
            >
              <Bell size={19} strokeWidth={navItems[1].isActive ? 2.5 : 2} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1.5 bg-red-500 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full border border-black flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold leading-tight mt-0.5">
              {navItems[1].label}
            </span>
          </Link>

          {/* Center Elevated Quick-Post Button */}
          <div className="flex flex-col items-center justify-center -mt-5 px-1">
            <button
              onClick={handleCenterPlusClick}
              aria-label="Post a Listing"
              className="w-11 h-11 rounded-full border-2 border-black bg-neo-green text-black flex items-center justify-center shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:bg-green-400 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
            >
              <Plus size={22} strokeWidth={3} />
            </button>
            <span className="text-[9px] font-black uppercase tracking-wider text-black mt-0.5">
              Post
            </span>
          </div>

          {/* 3. Dashboard Tab */}
          <Link
            href={navItems[2].href}
            className={`flex flex-col items-center justify-center flex-1 py-0.5 transition-transform active:scale-95 ${
              navItems[2].isActive
                ? "text-black font-black"
                : "text-gray-600 hover:text-black font-bold"
            }`}
          >
            <div
              className={`p-1 rounded-sm border-2 transition-all ${
                navItems[2].isActive
                  ? "bg-neo-peach border-black shadow-xs"
                  : "border-transparent"
              }`}
            >
              <LayoutDashboard size={19} strokeWidth={navItems[2].isActive ? 2.5 : 2} />
            </div>
            <span className="text-[10px] font-bold leading-tight mt-0.5">
              {navItems[2].label}
            </span>
          </Link>

          {/* 4. Profile Tab */}
          <Link
            href={navItems[3].href}
            className={`flex flex-col items-center justify-center flex-1 py-0.5 transition-transform active:scale-95 ${
              navItems[3].isActive
                ? "text-black font-black"
                : "text-gray-600 hover:text-black font-bold"
            }`}
          >
            <div
              className={`p-1 rounded-sm border-2 transition-all ${
                navItems[3].isActive
                  ? "bg-neo-purple border-black shadow-xs"
                  : "border-transparent"
              }`}
            >
              <User size={19} strokeWidth={navItems[3].isActive ? 2.5 : 2} />
            </div>
            <span className="text-[10px] font-bold leading-tight mt-0.5">
              {navItems[3].label}
            </span>
          </Link>

        </div>
      </nav>

      {/* Quick Upload Action Bottom Sheet */}
      {isUploadSheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end md:hidden animate-in fade-in duration-200"
          onClick={() => setIsUploadSheetOpen(false)}
        >
          <div
            className="w-full bg-white border-t-4 border-black p-5 sm:p-6 shadow-neo-lg rounded-t-2xl space-y-4 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sheet Handle & Header */}
            <div className="flex items-center justify-between border-b-3 border-black pb-3">
              <div>
                <div className="inline-flex items-center gap-1 border border-black bg-neo-yellow px-2 py-0.5 text-[10px] font-black uppercase mb-1">
                  <Sparkles size={11} /> Quick Campus Listing
                </div>
                <h3 className="font-serif text-2xl font-black">What would you like to post?</h3>
              </div>
              <button
                onClick={() => setIsUploadSheetOpen(false)}
                className="p-1.5 border-2 border-black bg-white hover:bg-gray-100 shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            {/* Selection Options */}
            <div className="grid grid-cols-1 gap-3 pt-1">
              {/* Option 1: Book or Printout */}
              <Link
                href="/books/upload"
                onClick={() => setIsUploadSheetOpen(false)}
                className="border-3 border-black bg-neo-yellow p-4 shadow-neo flex items-center justify-between hover:bg-yellow-300 active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 border-2 border-black bg-white shadow-sm">
                    <BookOpen size={24} className="text-black" />
                  </div>
                  <div className="text-left">
                    <span className="font-serif font-black text-lg block leading-tight">
                      List a Book or Printout
                    </span>
                    <span className="text-xs font-bold text-gray-800">
                      Textbooks, spiral printouts, & xerox booklets
                    </span>
                  </div>
                </div>
                <ArrowRight size={20} className="shrink-0 ml-2" />
              </Link>

              {/* Option 2: Study Notes */}
              <Link
                href="/notes/upload"
                onClick={() => setIsUploadSheetOpen(false)}
                className="border-3 border-black bg-neo-blue p-4 shadow-neo flex items-center justify-between hover:bg-sky-300 active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 border-2 border-black bg-white shadow-sm">
                    <FileText size={24} className="text-black" />
                  </div>
                  <div className="text-left">
                    <span className="font-serif font-black text-lg block leading-tight">
                      Share Exam Study Notes
                    </span>
                    <span className="text-xs font-bold text-gray-800">
                      Handwritten notes, formulas, & solved papers
                    </span>
                  </div>
                </div>
                <ArrowRight size={20} className="shrink-0 ml-2" />
              </Link>
            </div>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => setIsUploadSheetOpen(false)}
              className="w-full border-2 border-black py-2.5 font-bold text-sm bg-gray-100 hover:bg-gray-200 mt-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
