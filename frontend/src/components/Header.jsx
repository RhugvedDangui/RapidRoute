import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import gsap from 'gsap';

const Header = () => {
  const location = useLocation();

  useEffect(() => {
    gsap.fromTo('.nav-item',
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: 'power3.out', delay: 0.2 }
    );
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full p-6 md:p-10 flex justify-between items-center mix-blend-difference z-9999 pointer-events-none">
      <Link to="/" className="pointer-events-auto nav-item font-['Playfair_Display'] text-[var(--fg)] text-3xl font-black tracking-tighter uppercase italic">
        RAPID—R.
      </Link>

      <nav className="pointer-events-auto flex gap-6 md:gap-10 items-center font-sans text-[10px] md:text-sm uppercase tracking-[0.2em] font-medium text-[var(--fg)]">
        <Link to="/" className={`nav-item hover:opacity-50 transition-opacity ${location.pathname === '/' ? 'border-b-2 border-white pb-1' : ''}`}>
          Platform
        </Link>
        <Link to="/features" className={`nav-item hover:opacity-50 transition-opacity ${location.pathname === '/features' ? 'border-b-2 border-white pb-1' : ''}`}>
          Features
        </Link>
        <Link to="/login" className={`nav-item hover:opacity-50 transition-opacity ${location.pathname === '/login' ? 'border-b-2 border-white pb-1' : ''}`}>
          Join
        </Link>
      </nav>
    </header>
  );
};

export default Header;