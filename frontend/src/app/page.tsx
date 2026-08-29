"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { NeoButton } from "@/components/ui/NeoButton";
import { NeoCard } from "@/components/ui/NeoCard";
import { 
  GraduationCap, 
  Clock, 
  MapPin, 
  Sparkles, 
  BookOpen, 
  FileText, 
  Check, 
  Zap,
  Rocket,
  Star
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Home() {
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
    .from(".hero-shape", {
      y: 50,
      opacity: 0,
      rotate: 45,
      duration: 0.8,
      stagger: 0.2,
      ease: "back.out(1.5)"
    }, "-=0.8");

    // Continuous floating animation for shapes
    gsap.to(".hero-shape", {
      y: "-=20",
      duration: 2,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      stagger: 0.5
    });

    // Icon subtle animations
    gsap.to(".jiggle-icon", {
      rotate: 10,
      duration: 2,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
      stagger: 0.3
    });

    gsap.to(".pulse-icon", {
      scale: 1.1,
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
          gsap.to(icon, { x: 5, scale: 1.1, duration: 0.3, ease: "back.out(2)" });
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

    // 4. Feature Cards Stagger
    gsap.from(".feature-card", {
      scrollTrigger: {
        trigger: ".features-section",
        start: "top 70%",
      },
      y: 100,
      opacity: 0,
      duration: 0.8,
      stagger: 0.2,
      ease: "back.out(1.5)"
    });

    // 5. Final CTA Parallax/Grow
    gsap.from(".final-cta", {
      scrollTrigger: {
        trigger: ".final-cta-wrapper",
        start: "top bottom",
        end: "bottom bottom",
        scrub: true,
      },
      scale: 0.8,
      borderRadius: "100px",
      ease: "none"
    });

  }, { scope: container });

  return (
    <div ref={container} className="flex flex-col overflow-hidden">
      
      {/* 1. HERO SECTION */}
      <main className="relative min-h-[92vh] flex flex-col items-center justify-center px-6 py-20 text-center w-full">
        {/* Decorative Floating Shapes */}
        <div className="hero-shape absolute top-32 left-[8%] w-24 h-24 bg-neo-peach border-4 border-black rounded-full hidden md:block" />
        <div className="hero-shape absolute bottom-32 right-[8%] w-32 h-32 bg-neo-yellow border-4 border-black rotate-12 hidden md:block" />
        <div className="hero-shape absolute top-48 right-[18%] w-16 h-16 bg-neo-green border-4 border-black rotate-45 hidden md:block" />

        <div className="flex flex-col items-center text-center w-full max-w-5xl mx-auto space-y-6 z-10">
          <div className="hero-text flex flex-wrap gap-2 justify-center items-center">
            <span className="flex items-center gap-1 border-2 border-black rounded-full px-4 py-1 font-black bg-neo-yellow shadow-neo text-xs uppercase">
              <GraduationCap size={14} className="jiggle-icon" /> Exclusively for VIT Vellore Students
            </span>
            <span className="flex items-center gap-1 border-2 border-black rounded-full px-4 py-1 font-black bg-neo-green shadow-neo text-xs uppercase">
              <Zap size={14} className="pulse-icon" /> CAT-1 • CAT-2 • FAT Prep
            </span>
          </div>
          
          <h1 className="hero-text font-serif text-5xl sm:text-7xl md:text-8xl font-black leading-[1.1] tracking-tight">
            Rent textbooks.
          </h1>
          <h1 className="hero-text font-serif text-5xl sm:text-7xl md:text-8xl font-black leading-[1.1] tracking-tight">
            Ace your <span className="bg-neo-yellow px-3 border-4 border-black shadow-neo inline-block transform -rotate-1">CAT & FAT</span>.
          </h1>
          <h1 className="hero-text font-serif text-5xl sm:text-7xl md:text-8xl font-black leading-[1.1] tracking-tight">
            <span className="bg-neo-purple px-4 inline-block border-4 border-black shadow-neo transform rotate-1 mt-2 text-black">
              Share handwritten notes.
            </span>
          </h1>
          
          <p className="hero-desc text-lg sm:text-xl md:text-2xl font-medium max-w-3xl leading-relaxed text-gray-800 mt-6">
            Don't spend ₹1,000+ on reference books for a 2-week exam cycle. Borrow course textbooks and module notes directly from your peers across VIT Vellore hostels & academic blocks.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 pt-6 pb-8">
            <div className="hero-btn">
              <Link href="/books">
                <NeoButton variant="primary" size="lg" className="hover-animate-btn flex items-center justify-center gap-2 w-full sm:w-auto bg-neo-green text-black text-xl px-8">
                  Find Books for Rent <BookOpen size={24} className="btn-icon" />
                </NeoButton>
              </Link>
            </div>
            <div className="hero-btn">
              <Link href="/notes">
                <NeoButton variant="secondary" size="lg" className="hover-animate-btn flex items-center justify-center gap-2 w-full sm:w-auto bg-white text-black text-xl px-8">
                  Browse Exam Notes <FileText size={24} className="btn-icon" />
                </NeoButton>
              </Link>
            </div>
          </div>

          <div className="hero-text flex flex-wrap gap-4 justify-center text-xs font-black uppercase text-gray-700 pt-2">
            <span className="flex items-center gap-1"><Check size={14} className="text-neo-green drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]" /> Verified @vitstudent.ac.in Only</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Check size={14} className="text-neo-green drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]" /> Central Library & Hostel Handover</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Check size={14} className="text-neo-green drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]" /> Zero Late Fees</span>
          </div>
        </div>
      </main>

      {/* 2. INFINITE MARQUEE */}
      <div className="w-full overflow-hidden border-y-4 border-black bg-neo-yellow py-4 flex whitespace-nowrap">
        <div className="marquee-content flex gap-8 font-black text-2xl md:text-3xl font-serif">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-8 items-center">
              <span className="flex items-center gap-2"><Star size={24} className="fill-black" /> CAT-1 & CAT-2 SPRINTS</span>
              <span className="flex items-center gap-2"><Star size={24} className="fill-black" /> FAT EXAM REVISION</span>
              <span className="flex items-center gap-2"><Star size={24} className="fill-black" /> CORMEN • MORRIS MANO • SEDRA SMITH</span>
              <span className="flex items-center gap-2"><Star size={24} className="fill-black" /> SJT, TT & HOSTEL HANDOVERS</span>
              <span className="flex items-center gap-2"><Star size={24} className="fill-black" /> HANDWRITTEN CHEATSHEETS</span>
              <span className="flex items-center gap-2"><Star size={24} className="fill-black" /> VIT VELLORE VERIFIED</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. HOW IT WORKS SECTION */}
      <section className="how-it-works-section w-full max-w-5xl mx-auto px-6 py-28 relative">
        <div className="text-center mb-20">
          <span className="text-xs font-black uppercase tracking-wider bg-black text-white px-3 py-1 border border-black inline-block mb-3">
            Campus Workflow
          </span>
          <h2 className="font-serif text-5xl md:text-6xl font-black inline-block bg-neo-green px-6 py-2 border-4 border-black shadow-neo transform -rotate-1">
            How Booklease Works
          </h2>
          <p className="font-medium text-lg text-gray-700 mt-4 max-w-xl mx-auto">
            From discovering a reference book to campus meetup in 3 simple steps.
          </p>
        </div>

        <div className="relative flex flex-col gap-24">
          {/* The Drawing Line (Rope) */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-2 md:-ml-1 border-r-4 border-dashed border-gray-300">
            <div className="connecting-line w-full border-r-4 border-dashed border-black h-0" />
            <div className="traveling-knot absolute -left-3 md:-left-3 w-8 h-8 bg-neo-yellow border-4 border-black rounded-full shadow-neo z-30 flex items-center justify-center transform -translate-y-1/2">
               <span className="block w-2 h-2 bg-black rounded-full" />
            </div>
          </div>

          {/* Steps */}
          {[
            { 
              num: "01", 
              title: "Discover CAT & FAT Material", 
              desc: "Search by course code, book title, or subject (e.g. DSD, MPMC, OS, DSA, Calculus, Chemistry). Find textbooks listed by students in your own campus blocks.", 
              color: "white" 
            },
            { 
              num: "02", 
              title: "Request & Coordinate on WhatsApp", 
              desc: "Choose a rental duration (7 days for CAT, 15 days for FAT, or semester). Once the owner accepts, coordinate a quick meetup at SJT, TT, Library, Gazebo, or Hostels.", 
              color: "blue" 
            },
            { 
              num: "03", 
              title: "Ace Exams & 1-Click Return", 
              desc: "Complete your exam prep without spending thousands on new books. Return the book to the owner with one click on your dashboard.", 
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
              <NeoCard color={step.color as any} className="w-full relative z-20">
                <h3 className="font-serif text-3xl font-black mb-3">{step.title}</h3>
                <p className="font-medium text-base text-gray-800 leading-relaxed">{step.desc}</p>
              </NeoCard>
            </div>
          ))}
        </div>
      </section>

      {/* 4. FEATURES SECTION */}
      <section id="features" className="features-section w-full bg-gray-100 border-y-4 border-black py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-black uppercase bg-neo-yellow px-3 py-1 border-2 border-black inline-block mb-3 shadow-neo">
              Built for VITians
            </span>
            <h2 className="font-serif text-5xl md:text-6xl font-black">Everything You Need for Exam Week</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <NeoCard color="purple" className="feature-card hover:-translate-y-2 transition-transform duration-300">
              <div className="h-16 w-16 bg-white border-4 border-black rounded-full flex items-center justify-center mb-6 shadow-neo text-3xl text-neo-purple drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                <Clock size={32} className="jiggle-icon" />
              </div>
              <h3 className="font-serif text-3xl font-black mb-3">CAT & FAT Sprints</h3>
              <p className="font-medium text-base text-gray-900 leading-relaxed">
                Rent standard syllabus reference books for 7 or 15 days. Save money and pass the book along to the next student once your exams wrap up.
              </p>
            </NeoCard>

            <NeoCard color="blue" className="feature-card mt-0 md:mt-8 hover:-translate-y-2 transition-transform duration-300">
              <div className="h-16 w-16 bg-white border-4 border-black rounded-full flex items-center justify-center mb-6 shadow-neo text-3xl text-blue-300 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                <FileText size={32} className="jiggle-icon" />
              </div>
              <h3 className="font-serif text-3xl font-black mb-3">Module Notes & Solved Papers</h3>
              <p className="font-medium text-base text-gray-900 leading-relaxed">
                Download handwritten class notes, module formula sheets, and solved CAT question papers uploaded by high-GPA peers.
              </p>
            </NeoCard>

            <NeoCard color="peach" className="feature-card mt-0 md:mt-16 hover:-translate-y-2 transition-transform duration-300">
              <div className="h-16 w-16 bg-white border-4 border-black rounded-full flex items-center justify-center mb-6 shadow-neo text-3xl text-neo-peach drop-shadow-[1px_1px_0px_rgba(0,0,0,1)]">
                <MapPin size={32} className="jiggle-icon" />
              </div>
              <h3 className="font-serif text-3xl font-black mb-3">Hostel & Block Handover</h3>
              <p className="font-medium text-base text-gray-900 leading-relaxed">
                Coordinate handovers right inside VIT campus. Meet at the Central Library, SJT, TT, MB, PRB, Foodys, or your hostel gate.
              </p>
            </NeoCard>
          </div>
        </div>
      </section>

      {/* 5. FINAL CTA */}
      <section className="final-cta-wrapper w-full py-28 px-4 md:px-8 bg-white overflow-hidden">
        <div className="final-cta max-w-5xl mx-auto border-4 border-black bg-neo-yellow p-12 md:p-24 text-center shadow-neo-lg">
          <div className="inline-block border-2 border-black bg-white px-4 py-1 text-sm font-black uppercase mb-6 shadow-neo">
            <span className="flex items-center gap-1 justify-center"><Sparkles size={16} className="text-yellow-400 drop-shadow-[1px_1px_0px_rgba(0,0,0,1)] pulse-icon" /> Free & Instant for All VIT Students</span>
          </div>
          <h2 className="font-serif text-4xl sm:text-6xl md:text-7xl font-black mb-6 leading-tight">
            Ready to ace your next CAT or FAT exam?
          </h2>
          <p className="font-medium text-xl text-gray-800 max-w-2xl mx-auto mb-8">
            Join hundreds of VIT students saving money and acing their semesters with Booklease.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <NeoButton variant="primary" size="lg" className="hover-animate-btn flex items-center justify-center gap-2 bg-neo-purple text-2xl px-10 py-5">
                Sign In with VIT Email <Rocket size={24} className="btn-icon" />
              </NeoButton>
            </Link>
            <Link href="/books">
              <NeoButton variant="secondary" size="lg" className="hover-animate-btn flex items-center justify-center gap-2 bg-white text-2xl px-10 py-5">
                Browse Campus Books <BookOpen size={24} className="btn-icon" />
              </NeoButton>
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
