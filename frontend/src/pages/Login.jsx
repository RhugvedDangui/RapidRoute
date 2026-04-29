import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex items-center justify-center pt-24 pb-12 px-6 relative overflow-hidden">
      
      {/* Background Abstract Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(var(--fg) 1px, transparent 1px), linear-gradient(90deg, var(--fg) 1px, transparent 1px)', backgroundSize: '40px 40px', WebkitMaskImage: 'radial-gradient(circle at center, black, transparent 60%)' }}></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-[var(--bg)] border border-[var(--fg)]/20 p-8 md:p-12 shadow-2xl relative z-10"
      >
        <div className="mb-10 text-center">
          <h2 className="font-['Playfair_Display'] text-4xl md:text-5xl font-bold tracking-tighter italic mb-4">
            Welcome Back.
          </h2>
          <p className="font-sans text-xs uppercase tracking-widest opacity-60">
            Access your Rapid Route dashboard
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block font-sans text-[10px] uppercase tracking-[0.2em] mb-2 opacity-70" htmlFor="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              className="w-full bg-transparent border-b border-[var(--fg)]/30 py-3 text-sm focus:outline-none focus:border-[var(--fg)] transition-colors placeholder-[var(--fg)]/20"
              placeholder="you@company.com"
              required
            />
          </div>
          
          <div>
            <div className="flex justify-between mb-2">
              <label className="block font-sans text-[10px] uppercase tracking-[0.2em] opacity-70" htmlFor="password">Password</label>
              <a href="#" className="font-sans text-[10px] uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity">Forgot?</a>
            </div>
            <input 
              type="password" 
              id="password" 
              className="w-full bg-transparent border-b border-[var(--fg)]/30 py-3 text-sm focus:outline-none focus:border-[var(--fg)] transition-colors placeholder-[var(--fg)]/20"
              placeholder="••••••••"
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full mt-8 border border-[var(--fg)] bg-[var(--fg)] text-[var(--bg)] font-sans text-xs uppercase tracking-widest py-4 hover:bg-transparent hover:text-[var(--fg)] transition-colors duration-300"
          >
            Sign In
          </button>
        </form>

        <div className="mt-8 text-center border-t border-[var(--fg)]/10 pt-8">
          <p className="font-sans text-[10px] uppercase tracking-widest opacity-60">
            Don't have an account?{' '}
            <Link to="/register" className="text-[var(--fg)] font-bold hover:opacity-70 transition-opacity">
              Apply for Beta
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
