import React, { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import gsap from "gsap";

const Hero = () => {
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const yImage = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);

  useEffect(() => {
    let ctx = gsap.context(() => {
      gsap.fromTo(".hero-text-layer", {
        y: "110%", opacity: 0, rotateZ: 3
      }, {
        y: "0%", opacity: 1, rotateZ: 0, duration: 1.5, stagger: 0.1, ease: "power4.out", delay: 0.2
      });

      gsap.fromTo(".hero-meta", {
        opacity: 0, y: 15
      }, {
        opacity: 1, y: 0, duration: 1, delay: 1.2, stagger: 0.1
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="relative w-full h-[120vh] flex flex-col items-center justify-start overflow-hidden bg-[var(--bg)] text-[var(--fg)]">

      {/* Schematic Grids */}
      <div className="absolute inset-0 z-0 opacity-25 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, var(--fg) 1px, transparent 1px), linear-gradient(to bottom, var(--fg) 1px, transparent 1px)`,
          backgroundSize: '40px 40px', backgroundPosition: 'top left',
          WebkitMaskImage: 'radial-gradient(ellipse 100% 100% at top left, black 10%, transparent 60%)'
        }}
      />
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, var(--fg) 1px, transparent 1px), linear-gradient(to bottom, var(--fg) 1px, transparent 1px)`,
          backgroundSize: '10px 10px', backgroundPosition: 'top left',
          WebkitMaskImage: 'radial-gradient(ellipse 100% 100% at top left, black 5%, transparent 50%)'
        }}
      />

      {/* Parallax Video / Abstract Tech Visual */}
      <motion.div style={{ y: yImage }} className="absolute top-[15%] w-[85%] md:w-[60%] h-[70vh] md:h-[80vh] z-10 overflow-hidden border border-[var(--fg)]/30 shadow-2xl">
        <div className="absolute top-4 left-4 w-8 h-8 border-t border-l border-[var(--fg)]/60 z-20 pointer-events-none"></div>
        <div className="absolute top-4 right-4 w-8 h-8 border-t border-r border-[var(--fg)]/60 z-20 pointer-events-none"></div>
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b border-l border-[var(--fg)]/60 z-20 pointer-events-none"></div>
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b border-r border-[var(--fg)]/60 z-20 pointer-events-none"></div>

        <video className="w-full h-full object-cover grayscale opacity-70 scale-105" playsInline autoPlay muted loop>
          <source src="/Hero.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg)]/10 via-transparent to-[var(--bg)]/40 mix-blend-overlay"></div>
      </motion.div>

      {/* Typography Overlay */}
      <div className="z-50 flex flex-col items-center justify-center text-center px-4 w-full h-screen top-0 relative pointer-events-none">

        <div className="absolute top-32 md:top-40 left-6 md:left-12 hero-meta flex flex-col items-start gap-1 font-sans text-[10px] uppercase tracking-[0.3em] text-[var(--fg)]/70 backdrop-blur-sm bg-[var(--bg)]/20 p-2 border border-[var(--fg)]/10">
          <span>AI Logistics</span>
          <span>Optimization Engine</span>
        </div>

        <div className="absolute top-32 md:top-40 right-6 md:right-12 hero-meta flex flex-col items-end gap-1 font-sans text-[10px] uppercase tracking-[0.3em] text-[var(--fg)]/70 backdrop-blur-sm bg-[var(--bg)]/20 p-2 border border-[var(--fg)]/10">
          <span>Version 1.0</span>
          <span>Small Sellers</span>
        </div>

        <div className="flex flex-col items-center justify-center max-w-4xl mt-[-5%] mix-blend-difference pointer-events-auto">
          <div className="overflow-hidden pb-4">
            <h1 className="hero-text-layer inline-block font-['Playfair_Display'] text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter italic text-[var(--fg)] text-center leading-[1.1]">
              Stop Losing Margins.
            </h1>
          </div>
        </div>

        <div className="absolute bottom-12 flex justify-between w-full px-6 md:px-12 hero-meta">
          <button className="font-sans text-[10px] uppercase tracking-widest text-[var(--fg)] hover:text-white pointer-events-auto border border-[var(--fg)]/20 bg-[var(--bg)]/40 backdrop-blur-md px-6 py-3 hover:bg-[var(--fg)]/20 transition-all duration-300">
            Start Free Trial
          </button>
          <button className="font-sans text-[10px] uppercase tracking-widest text-[var(--fg)] hover:text-white pointer-events-auto border border-[var(--fg)]/20 bg-[var(--bg)]/40 backdrop-blur-md px-6 py-3 hover:bg-[var(--fg)]/20 transition-all duration-300">
            View Live Demo
          </button>
        </div>
      </div>
    </section>
  );
};
export default Hero;