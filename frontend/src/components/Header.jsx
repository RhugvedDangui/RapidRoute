import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import Logo from './Logo';

const STORAGE_KEY = 'rr-theme';

const Header = () => {
  const location = useLocation();
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEY) || 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark',  theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  useEffect(() => {
    gsap.fromTo('.nav-item',
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, stagger: 0.1, ease: 'power3.out', delay: 0.2 }
    );
  }, []);

  return (
    <>
      {/* Logo Layer - separate to avoid mix-blend-difference affecting the image colors */}
      <div className="fixed top-0 left-0 w-full p-6 md:p-10 z-[10000] pointer-events-none flex justify-between items-center">
        <Link to="/" className="pointer-events-auto -mt-2 md:-mt-4">
          <Logo className="h-10 md:h-16" />
        </Link>
      </div>

      {/* Navigation Layer - uses mix-blend-difference for dynamic text contrast */}
      <header className="fixed top-0 left-0 w-full p-6 md:p-10 flex justify-end items-center mix-blend-difference z-[9999] pointer-events-none">
        <nav className="pointer-events-auto flex gap-6 md:gap-10 items-center font-sans text-[10px] md:text-sm uppercase tracking-[0.2em] font-medium text-white">
          <button 
            onClick={toggleTheme} 
            className="nav-item hover:opacity-50 transition-opacity flex items-center gap-2"
          >
            {theme === 'dark' ? (
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
            {theme === 'dark' ? 'LIGHT' : 'DARK'}
          </button>
          
          <Link to="/login" className={`nav-item hover:opacity-50 transition-opacity ${location.pathname === '/login' ? 'border-b-2 border-white pb-1' : ''}`}>
            Join
          </Link>
        </nav>
      </header>
    </>
  );
};

export default Header;