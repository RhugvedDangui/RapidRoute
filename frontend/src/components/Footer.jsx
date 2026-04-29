import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

const Footer = () => {
  const footerRef = useRef(null);

  // High-performance mouse tracking for the spotlight
  const handleMouseMove = (e) => {
    if (!footerRef.current) return;
    const rect = footerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Direct DOM manipulation prevents React re-rendering on every pixel move
    footerRef.current.style.setProperty('--mouse-x', `${x}px`);
    footerRef.current.style.setProperty('--mouse-y', `${y}px`);
  };

  // Encapsulated scroll parallax logic specifically for the footer
  const { scrollYProgress } = useScroll({
    target: footerRef,
    offset: ["start end", "end end"]
  });

  const footerScale = useTransform(scrollYProgress, [0, 1], [0.8, 1]);
  const footerOpacity = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <footer
      ref={footerRef}
      onMouseMove={handleMouseMove}
      className="group h-[80vh] bg-[var(--bg)] text-[var(--fg)] relative flex flex-col justify-between p-6 md:p-12 overflow-hidden z-0"
    >
      {/* Dynamic Spotlight Layer */}
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-500 group-hover:opacity-100 z-0"
        style={{
          background: `radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(232, 220, 204, 0.06), transparent 40%)`
        }}
      />

      {/* Grid line overlay to give the light texture to reveal */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `
               linear-gradient(to right, var(--fg) 1px, transparent 1px),
               linear-gradient(to bottom, var(--fg) 1px, transparent 1px)
             `,
          backgroundSize: '40px 40px',
          maskImage: 'radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), black, transparent 40%)',
          WebkitMaskImage: 'radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), black, transparent 40%)'
        }}
      />

      <div className="relative z-10 flex justify-between font-sans text-[10px] uppercase tracking-[0.3em] text-[var(--fg)]/40">
        <span>Logistics Core</span>
        <span>© 2026 // Rights Reserved</span>
      </div>

      <motion.div
        style={{ scale: footerScale, opacity: footerOpacity }}
        className="relative z-10 flex-grow flex flex-col items-center justify-center text-center origin-bottom"
      >
        <h2 className="font-['Playfair_Display'] text-[18vw] md:text-[15vw] font-black tracking-tighter leading-none text-[var(--fg)] italic drop-shadow-2xl pointer-events-none">
          OPTIMIZE.
        </h2>
        {/* Added backdrop-blur so the button slightly distorts the spotlight passing behind it */}
        <button className="mt-12 md:mt-16 font-sans border border-[var(--fg)]/30 bg-[var(--bg)]/30 backdrop-blur-sm px-10 py-4 uppercase tracking-[0.2em] text-[10px] md:text-xs hover:bg-[var(--fg)] hover:text-[var(--bg)] hover:border-[var(--fg)] transition-all duration-700">
          Start Free Trial
        </button>
      </motion.div>

      <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-8 font-sans text-[10px] uppercase tracking-widest text-[var(--fg)]/40 border-t border-[var(--fg)]/10 pt-8 mt-12 text-center md:text-left">
        {['LinkedIn', 'Twitter', 'Platform API', 'Contact Sales'].map((link) => (
          <a key={link} href="#" className="hover:text-[var(--fg)] transition-colors duration-300">{link}</a>
        ))}
      </div>
    </footer>
  );
};

export default Footer;