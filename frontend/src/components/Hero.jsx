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
      <motion.div style={{ y: yImage }} className="absolute top-[10%] w-[95%] md:w-[80%] h-[80vh] md:h-[90vh] z-10 overflow-hidden border border-[var(--fg)]/30 shadow-2xl">
        <div className="absolute top-4 left-4 w-8 h-8 border-t border-l border-[var(--fg)]/60 z-20 pointer-events-none"></div>
        <div className="absolute top-4 right-4 w-8 h-8 border-t border-r border-[var(--fg)]/60 z-20 pointer-events-none"></div>
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b border-l border-[var(--fg)]/60 z-20 pointer-events-none"></div>
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b border-r border-[var(--fg)]/60 z-20 pointer-events-none"></div>

        <video className="w-full h-full object-cover grayscale opacity-80 scale-105" playsInline autoPlay muted loop>
          <source src="/Hero.mp4" type="video/mp4" />
        </video>
        {/* Original overlay style but using absolute dark colors so light mode isn't washed out */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/60 mix-blend-overlay"></div>
        {/* Soften the video slightly in light mode without making it milky */}
        <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
      </motion.div>

      {/* Typography Overlay */}
      <div className="z-50 flex flex-col items-center justify-center text-center px-4 w-full h-screen top-0 relative pointer-events-none">
        <div className="flex flex-col items-center justify-center max-w-4xl mt-[-5%] pointer-events-auto">
          <div className="overflow-hidden pb-4">
            <h1 className="hero-text-layer inline-block font-['Playfair_Display'] text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter italic text-white text-center leading-[1.1]">
              Stop Losing Margins.
            </h1>
          </div>
        </div>
      </div>
    </section>
  );
};
export default Hero;