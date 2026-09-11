"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { NeoButton } from "@/components/ui/NeoButton";
import { NeoCard } from "@/components/ui/NeoCard";
import { useAuth } from "@/context/AuthContext";
import {
  GraduationCap,
  Clock,
  MapPin,
  Sparkles,
  BookOpen,
  FileText,
  Check,
  Rocket,
  Star,
  Award,
  BookmarkCheck,
  Compass,
  MessageCircle,
  LayoutDashboard,
  PlusCircle,
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Reusable Neo Starburst SVG
function Starburst({ color = "#FACC15", size = 48, className = "" }: { color?: string; size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`drop-shadow-[3px_3px_0px_rgba(0,0,0,1)] ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M50 0 C50 35 65 50 100 50 C65 50 50 65 50 100 C50 65 35 50 0 50 C35 50 50 35 50 0 Z"
        fill={color}
        stroke="#000000"
        strokeWidth="6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Reusable Crosshair SVG
function Crosshair({ className = "" }: { className?: string }) {
  return (
    <div className={`text-black font-black text-2xl select-none opacity-40 hover:opacity-100 transition-opacity ${className}`}>
      ✚
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const container = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // 1. Hero Animation Timeline
    const tl = gsap.timeline();

    tl.from(".hero-text", {
      y: 100,
      opacity: 0,
      duration: 1,
      stagger: 0.15,
      ease: "back.out(1.5)",
      delay: 0.2
    })
      .from(".hero-desc", {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out"
      }, "-=0.4")
      .from(".hero-btn", {
        scale: 0,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "back.out(2)"
      }, "-=0.2")
      .from(".hero-shape, .neo-sticker", {
        scale: 0,
        opacity: 0,
        rotate: 45,
        duration: 0.8,
        stagger: 0.1,
        ease: "back.out(1.8)"
      }, "-=0.8");

    // Continuous floating animation for stickers & shapes (Group 1)
    gsap.to(".float-sticker-1", {
      y: "-=18",
      rotate: "+=12",
      duration: 2.8,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      stagger: {
        each: 0.3,
        from: "random"
      }
    });

    // Continuous floating animation (Group 2 - opposite phase)
    gsap.to(".float-sticker-2", {
      y: "+=16",
      rotate: "-=15",
      duration: 3.4,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      stagger: {
        each: 0.4,
        from: "random"
      }
    });

    // Gentle pulsing for starbursts
    gsap.to(".pulse-starburst", {
      scale: 1.15,
      rotate: "+=45",
      duration: 3,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      stagger: 0.5
    });

    // Icon subtle animations
    gsap.to(".jiggle-icon", {
      rotate: 12,
      duration: 2,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      stagger: 0.3
    });

    gsap.to(".pulse-icon", {
      scale: 1.15,
      duration: 1.5,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      stagger: 0.2
    });

    // Button hover icon animations
    const buttons = gsap.utils.toArray<HTMLElement>(".hover-animate-btn");
    buttons.forEach(btn => {
      const icon = btn.querySelector(".btn-icon");
      if (icon) {
        btn.addEventListener("mouseenter", () => {
          gsap.to(icon, { x: 5, scale: 1.15, duration: 0.3, ease: "back.out(2)" });
        });
        btn.addEventListener("mouseleave", () => {
          gsap.to(icon, { x: 0, scale: 1, duration: 0.3, ease: "back.out(2)" });
        });
      }
    });

    // 2. Infinite Marquee
    gsap.to(".marquee-content", {
      xPercent: -50,
      ease: "none",
      duration: 18,
      repeat: -1,
    });

    // 3. How It Works (Scroll-Driven Rope & Steps)
    const steps = gsap.utils.toArray<HTMLElement>(".step-card");

    const ropeTl = gsap.timeline({
      scrollTrigger: {
        trigger: ".how-it-works-section",
        start: "top center",
        end: "bottom center",
        scrub: 1,
      }
    });

    ropeTl.to(".connecting-line", { height: "100%", ease: "none" }, 0)
      .to(".traveling-knot", { top: "100%", ease: "none" }, 0);

    steps.forEach((step, i) => {
      gsap.from(step, {
        scrollTrigger: {
          trigger: step,
          start: "top 70%",
        },
        x: i % 2 === 0 ? -100 : 100,
        opacity: 0,
        duration: 0.8,
        ease: "back.out(1.2)"
      });

      const hLine = step.querySelector(".horizontal-line");
      if (hLine) {
        gsap.from(hLine, {
          scrollTrigger: {
            trigger: step,
            start: "top 60%",
          },
          width: 0,
          duration: 0.5,
          ease: "power2.out"
        });
      }
    });

    // 4. Feature Cards Stagger & Floating Stickers in Features Section
    gsap.from(".feature-card", {
      scrollTrigger: {
        trigger: ".features-section",
        start: "top 85%",
      },
      y: 40,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: "power2.out",
      clearProps: "transform,opacity"
    });

    // Parallax on scroll for background feature stickers
    gsap.to(".feature-bg-sticker", {
      scrollTrigger: {
        trigger: ".features-section",
        start: "top bottom",
        end: "bottom top",
        scrub: 1.5,
      },
      y: -60,
      ease: "none"
    });

    // 5. Final CTA Parallax/Fade
    gsap.from(".final-cta", {
      scrollTrigger: {
        trigger: ".final-cta-wrapper",
        start: "top 85%",
      },
      y: 30,
      opacity: 0,
      duration: 0.7,
      ease: "power2.out",
      clearProps: "transform,opacity"
    });

  }, { scope: container });

  return (
    <div ref={container} className="flex flex-col overflow-hidden bg-[#FAFAF8] min-h-screen">

      {/* 1. HERO SECTION */}
      <main className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-20 text-center w-full bg-[radial-gradient(#000000_1.3px,transparent_1.3px)] [background-size:26px_26px] overflow-hidden">

        {/* Floating Neo Stickers & Starbursts in Hero */}
        <div className="neo-sticker float-sticker-1 absolute top-24 left-[6%] hidden lg:block select-none z-0">
          <Starburst color="#FACC15" size={54} className="pulse-starburst" />
        </div>

        <div className="neo-sticker float-sticker-2 absolute top-36 right-[8%] hidden lg:block select-none z-0">
          <Starburst color="#C084FC" size={60} className="pulse-starburst" />
        </div>

        <div className="neo-sticker float-sticker-1 absolute bottom-28 left-[10%] hidden md:block select-none z-0">
          <div className="border-3 border-black bg-white px-3 py-1.5 font-black text-xs uppercase tracking-wider rounded-lg shadow-neo rotate-[-8deg] flex items-center gap-1.5">
            <Award size={16} className="text-neo-yellow drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]" />
            <span>Grade A+ Prep</span>
          </div>
        </div>

        <div className="neo-sticker float-sticker-2 absolute bottom-36 right-[12%] hidden md:block select-none z-0">
          <div className="border-3 border-black bg-neo-yellow px-3.5 py-1.5 font-black text-xs uppercase tracking-wider rounded-lg shadow-neo rotate-[6deg] flex items-center gap-1.5">
            <BookmarkCheck size={16} className="text-black" />
            <span>100% Peer Verified</span>
          </div>
        </div>

        <div className="neo-sticker float-sticker-1 absolute top-1/2 left-[3%] hidden xl:block select-none opacity-60">
          <Crosshair />
        </div>
        <div className="neo-sticker float-sticker-2 absolute top-1/3 right-[4%] hidden xl:block select-none opacity-60">
          <Crosshair />
        </div>

        {/* Decorative Floating Shapes */}
        <div className="hero-shape absolute top-32 left-[8%] w-20 h-20 bg-neo-peach border-4 border-black rounded-full hidden md:block opacity-75 shadow-neo" />
        <div className="hero-shape absolute bottom-28 right-[7%] w-24 h-24 bg-neo-green border-4 border-black rotate-12 hidden md:block opacity-75 shadow-neo" />

        <div className="flex flex-col items-center text-center w-full max-w-5xl mx-auto space-y-4 sm:space-y-6 z-10">
          <div className="hero-text flex flex-wrap gap-2 justify-center items-center">
            <span className="flex items-center gap-1 border-2 border-black rounded-full px-3 sm:px-4 py-1 font-black bg-neo-yellow shadow-neo text-[11px] sm:text-xs uppercase">
              <GraduationCap size={14} className="jiggle-icon" /> For VIT Vellore Students
            </span>
            <span className="flex items-center gap-1 border-2 border-black rounded-full px-3 sm:px-4 py-1 font-black bg-neo-green shadow-neo text-[11px] sm:text-xs uppercase">
              <Sparkles size={14} className="pulse-icon" /> CAT-2 • FAT Prep
            </span>
          </div>

          <h1 className="hero-text font-serif text-3xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[1.15] sm:leading-[1.1] tracking-tight">
            Rent textbooks.
          </h1>
          <h1 className="hero-text font-serif text-3xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[1.15] sm:leading-[1.1] tracking-tight">
            Ace your <span className="bg-neo-yellow px-2 sm:px-3 border-3 sm:border-4 border-black shadow-neo inline-block transform -rotate-1">CAT & FAT</span>.
          </h1>
          <h1 className="hero-text font-serif text-3xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[1.15] sm:leading-[1.1] tracking-tight">
            <span className="bg-neo-purple px-3 sm:px-4 inline-block border-3 sm:border-4 border-black shadow-neo transform rotate-1 mt-1 sm:mt-2 text-black">
              Share handwritten notes.
            </span>
          </h1>

          <p className="hero-desc text-base sm:text-xl md:text-2xl font-medium max-w-3xl leading-relaxed text-gray-800 mt-4 sm:mt-6 px-2">
            Couldn&apos;t find your book at the library? Borrow course textbooks and module notes directly from your peers across VIT Vellore hostels & academic blocks.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 pt-4 sm:pt-6 pb-6 sm:pb-8 w-full sm:w-auto px-4 sm:px-0">
            <div className="hero-btn w-full sm:w-auto">
              <Link href="/books" className="w-full block">
                <NeoButton variant="primary" size="lg" className="hover-animate-btn flex items-center justify-center gap-2 w-full bg-neo-green text-black text-lg sm:text-xl px-6 sm:px-8 py-3.5 sm:py-4">
                  Find Books for Rent <BookOpen size={22} className="btn-icon" />
                </NeoButton>
              </Link>
            </div>
            <div className="hero-btn w-full sm:w-auto">
              <Link href="/notes" className="w-full block">
                <NeoButton variant="secondary" size="lg" className="hover-animate-btn flex items-center justify-center gap-2 w-full bg-white text-black text-lg sm:text-xl px-6 sm:px-8 py-3.5 sm:py-4">
                  Browse Exam Notes <FileText size={22} className="btn-icon" />
                </NeoButton>
              </Link>
            </div>
          </div>

          <div className="hero-text flex flex-wrap gap-2 sm:gap-4 justify-center text-[11px] sm:text-xs font-black uppercase text-gray-700 pt-1 px-2">
            <span className="flex items-center gap-1"><Check size={14} className="text-neo-green drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]" /> Verified @vitstudent.ac.in Only</span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1"><Check size={14} className="text-neo-green drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]" /> Central Library & Hostel Handover</span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1"><Check size={14} className="text-neo-green drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]" /> Zero Late Fees</span>
          </div>
        </div>
      </main>

      {/* 2. INFINITE MARQUEE */}
      <div className="w-full overflow-hidden border-y-4 border-black bg-neo-yellow py-4 flex whitespace-nowrap z-10">
        <div className="marquee-content flex gap-8 font-black text-2xl md:text-3xl font-serif">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-8 items-center">
              <span className="flex items-center gap-2"><Star size={24} className="fill-black" /> BOOKS FOR CAT2</span>
              <span className="flex items-center gap-2"><Star size={24} className="fill-black" /> FAT EXAM REVISION</span>
              <span className="flex items-center gap-2"><Star size={24} className="fill-black" /> CONVENIENT HANDOVERS</span>
              <span className="flex items-center gap-2"><Star size={24} className="fill-black" /> HANDWRITTEN NOTES</span>
              <span className="flex items-center gap-2"><Star size={24} className="fill-black" /> VIT VELLORE</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. HOW IT WORKS SECTION */}
      <section className="how-it-works-section w-full bg-[#FAFAF8] py-16 sm:py-28 px-4 sm:px-6 relative">
        <div className="max-w-5xl mx-auto">
          {/* Background Subtle Stickers */}
          <div className="absolute top-20 right-8 hidden md:block select-none float-sticker-1 z-0">
            <Starburst color="#38BDF8" size={44} className="pulse-starburst" />
          </div>
          <div className="absolute bottom-20 left-8 hidden md:block select-none float-sticker-2 z-0">
            <Starburst color="#F472B6" size={48} className="pulse-starburst" />
          </div>

          <div className="text-center mb-12 sm:mb-20 relative z-10">
            <span className="text-xs font-black uppercase tracking-wider bg-black text-white px-3 py-1 border border-black inline-block mb-3">
              Campus Workflow
            </span>
            <br />
            <h2 className="font-serif text-3xl sm:text-5xl md:text-6xl font-black inline-block bg-neo-green px-4 sm:px-6 py-2 border-3 sm:border-4 border-black shadow-neo transform -rotate-1">
              How Booklease Works
            </h2>
            <p className="font-medium text-base sm:text-lg text-gray-700 mt-4 max-w-xl mx-auto">
              From discovering a reference book to campus meetup in simple steps.
            </p>
          </div>

          <div className="relative flex flex-col gap-6 sm:gap-12 md:gap-24">
            {/* The Drawing Line (Rope) - Visible on md+ screens */}
            <div className="hidden md:block absolute left-8 md:left-1/2 top-0 bottom-0 w-2 md:-ml-1 border-r-4 border-dashed border-gray-300">
              <div className="connecting-line w-full border-r-4 border-dashed border-black h-0" />
              <div className="traveling-knot absolute -left-3 md:-left-3 w-8 h-8 bg-neo-yellow border-4 border-black rounded-full shadow-neo z-30 flex items-center justify-center transform -translate-y-1/2">
                <span className="block w-2 h-2 bg-black rounded-full" />
              </div>
            </div>

            {/* Steps */}
            {[
              {
                num: "01",
                tag: "CAT-2 & FAT Exam Prep",
                title: "Worried About CAT-2?",
                desc: "Find syllabus reference textbooks, handwritten formula sheets, and solved question papers uploaded by peers in your own campus blocks.",
                color: "white"
              },
              {
                num: "02",
                tag: "Slot-Based Rentals",
                title: "Request & Connect on WhatsApp",
                desc: "Choose durations tailored to your exam slot (A1–G2) or custom days. Chat directly with student owners on WhatsApp and coordinate a quick handover wherever you like across campus.",
                color: "blue"
              },
              {
                num: "03",
                tag: "Exclusive Student Feature",
                title: "Sell or Rent Your Ebook Printouts",
                desc: "Took spiral printouts of 200-page ebooks or module PPT slides? Don't throw them in the dustbin after exams! List your spiral printouts and xerox booklets to recover your printing costs.",
                color: "yellow"
              },
              {
                num: "04",
                tag: "Zero Late Fees",
                title: "Ace Exams & 1-Click Return",
                desc: "Complete your exam revision without spending thousands on new textbooks. Return the book or pass materials to the next student with a single click on your dashboard.",
                color: "peach"
              },
            ].map((step, i) => (
              <div key={step.num} className={`step-card w-full md:w-[45%] flex relative z-10 ${i % 2 === 0 ? "md:self-start" : "md:self-end"}`}>
                <div
                  className="horizontal-line hidden md:block absolute top-1/2 h-1 border-b-4 border-dashed border-black z-10"
                  style={{
                    [i % 2 === 0 ? 'right' : 'left']: '-10%',
                    width: '10%',
                    marginTop: '-2px'
                  }}
                />
                <div className="hidden md:flex absolute top-1/2 -mt-6 w-12 h-12 rounded-full border-4 border-black bg-white items-center justify-center font-black z-20 shadow-neo"
                  style={{ [i % 2 === 0 ? 'right' : 'left']: '-3rem' }}>
                  {step.num}
                </div>
                <NeoCard color={step.color as any} className="w-full relative z-20 p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="md:hidden border-2 border-black bg-neo-yellow text-black px-2 py-0.5 text-xs font-black">
                      Step {step.num}
                    </span>
                    <span className="inline-block border-2 border-black bg-black text-white px-2 py-0.5 text-xs font-black uppercase">
                      {step.tag}
                    </span>
                  </div>
                  <h3 className="font-serif text-xl sm:text-2xl md:text-3xl font-black mb-2 sm:mb-3 leading-tight">{step.title}</h3>
                  <p className="font-medium text-sm sm:text-base text-gray-800 leading-relaxed">{step.desc}</p>
                </NeoCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEAMLESS DOTTED WRAPPER FOR FEATURES & FINAL CTA */}
      <div className="w-full border-t-4 border-black bg-[radial-gradient(#000000_1.3px,transparent_1.3px)] [background-size:26px_26px] relative overflow-hidden">
        {/* 4. FEATURES SECTION */}
        <section id="features" className="features-section w-full pt-12 pb-2 sm:pt-20 sm:pb-20 px-4 sm:px-6 relative overflow-visible">

          {/* Background Floating Neo-Brutalist Stickers */}
          <div className="feature-bg-sticker float-sticker-1 absolute top-12 left-[4%] hidden lg:block select-none pointer-events-none z-0">
            <Starburst color="#FACC15" size={50} className="pulse-starburst" />
          </div>

          <div className="feature-bg-sticker float-sticker-2 absolute top-10 right-[4%] hidden lg:block select-none pointer-events-none z-0">
            <Starburst color="#C084FC" size={54} className="pulse-starburst" />
          </div>

          <div className="feature-bg-sticker float-sticker-1 absolute top-36 left-4 xl:left-8 hidden xl:block select-none pointer-events-none z-0">
            <div className="border-3 border-black bg-neo-green px-3.5 py-1.5 font-black text-xs uppercase tracking-wider rounded-lg shadow-neo rotate-[-5deg] flex items-center gap-1.5">
              <FileText size={15} className="text-black" />
              <span>Handwritten Notes</span>
            </div>
          </div>

          <div className="feature-bg-sticker float-sticker-2 absolute top-36 right-4 xl:right-8 hidden xl:block select-none pointer-events-none z-0">
            <div className="border-3 border-black bg-neo-yellow px-3.5 py-1.5 font-black text-xs uppercase tracking-wider rounded-lg shadow-neo rotate-[5deg] flex items-center gap-1.5">
              <MessageCircle size={15} className="text-black" />
              <span>1-Click WhatsApp Handovers</span>
            </div>
          </div>

          <div className="feature-bg-sticker float-sticker-2 absolute top-1/2 left-[2%] hidden 2xl:block select-none opacity-40">
            <Crosshair />
          </div>
          <div className="feature-bg-sticker float-sticker-1 absolute top-1/2 right-[2%] hidden 2xl:block select-none opacity-40">
            <Crosshair />
          </div>

          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-8 sm:mb-16">
              <span className="text-xs font-black uppercase bg-neo-yellow px-3 py-1 border-2 border-black inline-block mb-2 sm:mb-3 shadow-neo">
                Built for VITians
              </span>
              <h2 className="font-serif text-2xl sm:text-5xl md:text-6xl font-black tracking-tight">Everything You Need for Exam Week</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pb-6 sm:pb-8">
              <NeoCard color="purple" className="feature-card p-4 sm:p-6 hover:-translate-y-1 sm:hover:-translate-y-2 transition-transform duration-300 flex flex-col justify-between">
                <div>
                  <div className="h-10 w-10 sm:h-14 sm:w-14 bg-white border-3 sm:border-4 border-black rounded-full flex items-center justify-center mb-3 sm:mb-5 shadow-neo text-neo-purple drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 jiggle-icon" />
                  </div>
                  <h3 className="font-serif text-lg sm:text-2xl font-black mb-1.5 sm:mb-2 leading-tight">CAT-2 & FAT Sprints</h3>
                  <p className="font-medium text-xs sm:text-sm text-gray-900 leading-relaxed">
                    Rent syllabus textbooks for flexible exam durations. Pass books to juniors when done.
                  </p>
                </div>
              </NeoCard>

              <NeoCard color="blue" className="feature-card p-4 sm:p-6 hover:-translate-y-1 sm:hover:-translate-y-2 transition-transform duration-300 flex flex-col justify-between">
                <div>
                  <div className="h-10 w-10 sm:h-14 sm:w-14 bg-white border-3 sm:border-4 border-black rounded-full flex items-center justify-center mb-3 sm:mb-5 shadow-neo text-blue-300 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                    <FileText className="w-5 h-5 sm:w-6 sm:h-6 jiggle-icon" />
                  </div>
                  <h3 className="font-serif text-lg sm:text-2xl font-black mb-1.5 sm:mb-2 leading-tight">Notes & Solved Papers</h3>
                  <p className="font-medium text-xs sm:text-sm text-gray-900 leading-relaxed">
                    Handwritten class notes, module formula sheets, and solved CAT papers from your peers.
                  </p>
                </div>
              </NeoCard>

              <NeoCard color="yellow" className="feature-card p-4 sm:p-6 hover:-translate-y-1 sm:hover:-translate-y-2 transition-transform duration-300 flex flex-col justify-between">
                <div>
                  <div className="h-10 w-10 sm:h-14 sm:w-14 bg-white border-3 sm:border-4 border-black rounded-full flex items-center justify-center mb-3 sm:mb-5 shadow-neo text-yellow-600 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                    <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 jiggle-icon" />
                  </div>
                  <h3 className="font-serif text-lg sm:text-2xl font-black mb-1.5 sm:mb-2 leading-tight">Ebook Printouts Hub</h3>
                  <p className="font-medium text-xs sm:text-sm text-gray-900 leading-relaxed">
                    Turn your spiral-bound prints and module xerox booklets into cash after exams.
                  </p>
                </div>
              </NeoCard>

              <NeoCard color="peach" className="feature-card p-4 sm:p-6 hover:-translate-y-1 sm:hover:-translate-y-2 transition-transform duration-300 flex flex-col justify-between">
                <div>
                  <div className="h-10 w-10 sm:h-14 sm:w-14 bg-white border-3 sm:border-4 border-black rounded-full flex items-center justify-center mb-3 sm:mb-5 shadow-neo text-neo-peach drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                    <MapPin className="w-5 h-5 sm:w-6 sm:h-6 jiggle-icon" />
                  </div>
                  <h3 className="font-serif text-lg sm:text-2xl font-black mb-1.5 sm:mb-2 leading-tight">Campus Handovers</h3>
                  <p className="font-medium text-xs sm:text-sm text-gray-900 leading-relaxed">
                    Coordinate fast handovers at SJT, TT, library, or hostels convenient for both.
                  </p>
                </div>
              </NeoCard>
            </div>
          </div>
        </section>

        {/* 5. FINAL CTA */}
        <section className="final-cta-wrapper w-full pt-2 pb-32 sm:pt-16 sm:pb-24 px-4 sm:px-8 relative mt-0 sm:mt-8">
          {/* Floating stickers in CTA */}
          <div className="float-sticker-1 absolute top-6 left-10 hidden lg:block select-none z-0">
            <Starburst color="#C084FC" size={50} className="pulse-starburst" />
          </div>
          <div className="float-sticker-2 absolute bottom-12 right-10 hidden lg:block select-none z-0">
            <Starburst color="#FACC15" size={56} className="pulse-starburst" />
          </div>

          <div className="final-cta max-w-5xl mx-auto border-3 sm:border-4 border-black bg-neo-yellow p-5 sm:p-12 md:p-20 text-center shadow-neo-lg relative z-10 mb-6 sm:mb-10 rounded-none">
            <div className="inline-block border-2 border-black bg-white px-3 sm:px-4 py-1 text-xs sm:text-sm font-black uppercase mb-3 sm:mb-6 shadow-neo">
              <span className="flex items-center gap-1 justify-center"><Sparkles size={14} className="text-yellow-400 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] pulse-icon" /> Free & Instant for All VIT Students</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-5xl md:text-7xl font-black mb-3 sm:mb-6 leading-tight">
              {user ? "Ready for your upcoming CAT / FAT slots?" : "Ready to ace your next CAT or FAT exam?"}
            </h2>
            <p className="font-medium text-sm sm:text-xl text-gray-800 max-w-2xl mx-auto mb-5 sm:mb-8 leading-relaxed">
              {user
                ? "Check your active textbook rentals, track return due dates, or list notes on your student dashboard."
                : "Join hundreds of VIT students saving money and acing their semesters with Booklease."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center w-full sm:w-auto">
              {user ? (
                <>
                  <Link href="/dashboard" className="w-full sm:w-auto">
                    <NeoButton variant="primary" size="lg" className="hover-animate-btn flex items-center justify-center gap-2 w-full bg-neo-purple text-base sm:text-2xl px-5 sm:px-10 py-3.5 sm:py-5">
                      Open Your Dashboard <LayoutDashboard size={20} className="btn-icon" />
                    </NeoButton>
                  </Link>
                  <Link href="/books/upload" className="w-full sm:w-auto">
                    <NeoButton variant="secondary" size="lg" className="hover-animate-btn flex items-center justify-center gap-2 w-full bg-white text-base sm:text-2xl px-5 sm:px-10 py-3.5 sm:py-5">
                      Post a Book or Note <PlusCircle size={20} className="btn-icon" />
                    </NeoButton>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="w-full sm:w-auto">
                    <NeoButton variant="primary" size="lg" className="hover-animate-btn flex items-center justify-center gap-2 w-full bg-neo-purple text-base sm:text-2xl px-5 sm:px-10 py-3.5 sm:py-5">
                      Sign Up / In with VIT Email <Rocket size={20} className="btn-icon" />
                    </NeoButton>
                  </Link>
                  <Link href="/books" className="w-full sm:w-auto">
                    <NeoButton variant="secondary" size="lg" className="hover-animate-btn flex items-center justify-center gap-2 w-full bg-white text-base sm:text-2xl px-5 sm:px-10 py-3.5 sm:py-5">
                      Browse Campus Books <BookOpen size={20} className="btn-icon" />
                    </NeoButton>
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>
      </div>

    </div>
  );
}
