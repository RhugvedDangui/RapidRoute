import React, { useEffect } from 'react';
import Lenis from 'lenis';
import { Routes, Route, useLocation } from 'react-router-dom';

import Header from './components/Header';
import Cursor from './components/Cursor';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

function App() {
  const location = useLocation();

  // Smooth Scrolling Setup via Lenis
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothTouch: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => lenis.destroy();
  }, []);

  // Reset scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const isDashboard = location.pathname.startsWith('/dashboard');

  return (
    <div className="bg-[var(--bg)] text-[var(--fg)] min-h-screen font-sans selection:bg-[var(--fg)] selection:text-[var(--bg)] overflow-x-hidden">
      {!isDashboard && <Cursor />}
      {!isDashboard && <Header />}

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard/*" element={<Dashboard />} />
        </Routes>
      </main>

      {!['/login', '/register'].includes(location.pathname) && !isDashboard && <Footer />}
    </div>
  );
}

export default App;