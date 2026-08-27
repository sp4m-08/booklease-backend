"use client";

import Link from "next/link";
import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { NeoButton } from "@/components/ui/NeoButton";
import { NeoCard } from "@/components/ui/NeoCard";

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

    // 2. Infinite Marquee
    gsap.to(".marquee-content", {
      xPercent: -50,
      ease: "none",
      duration: 15,
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

    // Animate the traveling knot and vertical line drawn down
    ropeTl.to(".connecting-line", { height: "100%", ease: "none" }, 0)
          .to(".traveling-knot", { top: "100%", ease: "none" }, 0);

    steps.forEach((step, i) => {
      // Box slide-in
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

      // Horizontal connector line shoot-out
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
      <main className="relative min-h-[90vh] flex flex-col items-center justify-center px-8 py-24 text-center w-full">
        {/* Decorative Floating Shapes */}
        <div className="hero-shape absolute top-32 left-[10%] w-24 h-24 bg-neo-peach border-4 border-black rounded-full hidden md:block" />
        <div className="hero-shape absolute bottom-32 right-[10%] w-32 h-32 bg-neo-yellow border-4 border-black rotate-12 hidden md:block" />
        <div className="hero-shape absolute top-48 right-[20%] w-16 h-16 bg-neo-green border-4 border-black rotate-45 hidden md:block" />

        <div className="flex flex-col items-center text-center w-full max-w-4xl mx-auto space-y-6 z-10">
          <div className="hero-text inline-block border-2 border-black rounded-full px-4 py-1 font-bold bg-white shadow-neo text-sm mb-4">
            ✨ Exclusively for VIT Students
          </div>
          
          <h1 className="hero-text font-serif text-6xl md:text-8xl font-black leading-[1.1] tracking-tight">Rent books.</h1>
          <h1 className="hero-text font-serif text-6xl md:text-8xl font-black leading-[1.1] tracking-tight">Share notes.</h1>
          <h1 className="hero-text font-serif text-6xl md:text-8xl font-black leading-[1.1] tracking-tight">
            <span className="bg-neo-purple px-4 inline-block border-4 border-black shadow-neo transform -rotate-2 mt-2">Learn together.</span>
          </h1>
          
          <p className="hero-desc text-xl md:text-2xl font-medium max-w-2xl leading-relaxed text-gray-800 mt-8">
            Booklease is a peer-to-peer textbook rental and notes sharing platform. Discover, rent, and return — all from one place.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 pt-8 pb-12">
            <div className="hero-btn">
              <Link href="/login">
                <NeoButton variant="primary" size="lg" className="w-full sm:w-auto">Get Started Now</NeoButton>
              </Link>
            </div>
            <div className="hero-btn">
              <Link href="#features">
                <NeoButton variant="ghost" size="lg" className="w-full sm:w-auto bg-white">Learn More ↓</NeoButton>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* 2. INFINITE MARQUEE */}
      <div className="w-full overflow-hidden border-y-4 border-black bg-neo-yellow py-4 flex whitespace-nowrap">
        <div className="marquee-content flex gap-8 font-black text-3xl font-serif">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-8 items-center">
              <span>★ NO LATE FEES</span>
              <span>TEXTBOOKS</span>
              <span>★ ENGINEERING</span>
              <span>MEDICAL</span>
              <span>★ FICTION</span>
              <span>STUDY NOTES</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. HOW IT WORKS SECTION */}
      <section className="how-it-works-section w-full max-w-5xl mx-auto px-8 py-32 relative">
        <div className="text-center mb-24">
          <h2 className="font-serif text-5xl md:text-7xl font-black inline-block bg-neo-green px-6 py-2 border-4 border-black shadow-neo transform rotate-1">How It Works</h2>
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
            { num: "01", title: "Search & Discover", desc: "Find the exact textbook or study notes you need from peers on campus.", color: "white" },
            { num: "02", title: "Request & Rent", desc: "Send a request to the owner. Once approved, the book is yours for the semester.", color: "blue" },
            { num: "03", title: "Return & Repeat", desc: "Return the book when you're done and pass the knowledge onto the next student.", color: "peach" },
          ].map((step, i) => (
            <div key={step.num} className={`step-card w-full md:w-[45%] flex relative z-10 ${i % 2 === 0 ? "md:self-start" : "md:self-end"}`}>
              {/* Horizontal line extending from the rope to the box */}
              <div 
                className="horizontal-line hidden md:block absolute top-1/2 h-1 border-b-4 border-dashed border-black z-10" 
                style={{ 
                  [i % 2 === 0 ? 'right' : 'left']: '-10%', 
                  width: '10%',
                  marginTop: '-2px'
                }} 
              />
              {/* Number Badge */}
              <div className="hidden md:flex absolute top-1/2 -mt-6 w-12 h-12 rounded-full border-4 border-black bg-white items-center justify-center font-black z-20 shadow-neo"
                   style={{ [i % 2 === 0 ? 'right' : 'left']: '-3rem' }}>
                {step.num}
              </div>
              <NeoCard color={step.color as any} className="w-full relative z-20">
                <h3 className="font-serif text-3xl font-black mb-4">{step.title}</h3>
                <p className="font-medium text-lg text-gray-800">{step.desc}</p>
              </NeoCard>
            </div>
          ))}
        </div>
      </section>

      {/* 4. FEATURES SECTION */}
      <section id="features" className="features-section w-full bg-gray-100 border-y-4 border-black py-32 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-serif text-5xl md:text-6xl font-black">Everything you need</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <NeoCard color="purple" className="feature-card">
              <div className="h-16 w-16 bg-white border-4 border-black rounded-full flex items-center justify-center mb-6 shadow-neo text-3xl">📚</div>
              <h3 className="font-serif text-3xl font-black mb-4">Peer Catalog</h3>
              <p className="font-medium text-lg text-gray-900">Explore a massive catalog of academic books uploaded by other students just like you.</p>
            </NeoCard>

            <NeoCard color="blue" className="feature-card mt-0 md:mt-12">
              <div className="h-16 w-16 bg-white border-4 border-black rounded-full flex items-center justify-center mb-6 shadow-neo text-3xl">📝</div>
              <h3 className="font-serif text-3xl font-black mb-4">Note Sharing</h3>
              <p className="font-medium text-lg text-gray-900">Download and upload high-quality PDF study notes for every subject and exam.</p>
            </NeoCard>

            <NeoCard color="peach" className="feature-card mt-0 md:mt-24">
              <div className="h-16 w-16 bg-white border-4 border-black rounded-full flex items-center justify-center mb-6 shadow-neo text-3xl">💜</div>
              <h3 className="font-serif text-3xl font-black mb-4">Wishlists</h3>
              <p className="font-medium text-lg text-gray-900">Save books you want to rent later. Keep track of what you need for the upcoming semester.</p>
            </NeoCard>
          </div>
        </div>
      </section>

      {/* 5. FINAL CTA */}
      <section className="final-cta-wrapper w-full py-32 px-4 md:px-8 bg-white overflow-hidden">
        <div className="final-cta max-w-5xl mx-auto border-4 border-black bg-neo-purple p-16 md:p-32 text-center shadow-neo-lg rounded-none">
          <h2 className="font-serif text-5xl md:text-7xl font-black mb-8 leading-tight">Ready to ace your next semester?</h2>
          <Link href="/login">
            <NeoButton variant="primary" size="lg" className="bg-white text-3xl px-12 py-6 rounded-full transform hover:scale-110 transition-transform duration-300">
              Join Booklease Now
            </NeoButton>
          </Link>
        </div>
      </section>

    </div>
  );
}
