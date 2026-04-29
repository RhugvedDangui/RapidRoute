import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Register = () => {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)] flex items-center justify-center pt-24 pb-12 px-6 relative overflow-hidden">
      
      {/* Background Abstract Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(var(--fg) 1px, transparent 1px), linear-gradient(90deg, var(--fg) 1px, transparent 1px)', backgroundSize: '40px 40px', WebkitMaskImage: 'radial-gradient(circle at center, black, transparent 60%)' }}></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="w-full max-w-lg bg-[var(--bg)] border border-[var(--fg)]/20 p-8 md:p-12 shadow-2xl relative z-10"
      >
        <div className="mb-10 text-center">
          <h2 className="font-['Playfair_Display'] text-4xl md:text-5xl font-bold tracking-tighter italic mb-4">
            Join Rapid Route.
          </h2>
          <p className="font-sans text-xs uppercase tracking-widest opacity-60">
            Stop losing margins. Start optimizing today.
          </p>
        </div>

        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block font-sans text-[10px] uppercase tracking-[0.2em] mb-2 opacity-70" htmlFor="firstName">First Name</label>
              <input 
                type="text" 
                id="firstName" 
                className="w-full bg-transparent border-b border-[var(--fg)]/30 py-3 text-sm focus:outline-none focus:border-[var(--fg)] transition-colors placeholder-[var(--fg)]/20"
                placeholder="John"
                required
              />
            </div>
            <div>
              <label className="block font-sans text-[10px] uppercase tracking-[0.2em] mb-2 opacity-70" htmlFor="lastName">Last Name</label>
              <input 
                type="text" 
                id="lastName" 
                className="w-full bg-transparent border-b border-[var(--fg)]/30 py-3 text-sm focus:outline-none focus:border-[var(--fg)] transition-colors placeholder-[var(--fg)]/20"
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-sans text-[10px] uppercase tracking-[0.2em] mb-2 opacity-70" htmlFor="companyName">Company / Store Name</label>
            <input 
              type="text" 
              id="companyName" 
              className="w-full bg-transparent border-b border-[var(--fg)]/30 py-3 text-sm focus:outline-none focus:border-[var(--fg)] transition-colors placeholder-[var(--fg)]/20"
              placeholder="Your E-Commerce Store"
              required
            />
          </div>

          <div>
            <label className="block font-sans text-[10px] uppercase tracking-[0.2em] mb-2 opacity-70" htmlFor="email">Work Email</label>
            <input 
              type="email" 
              id="email" 
              className="w-full bg-transparent border-b border-[var(--fg)]/30 py-3 text-sm focus:outline-none focus:border-[var(--fg)] transition-colors placeholder-[var(--fg)]/20"
              placeholder="you@company.com"
              required
            />
          </div>
          
          <div>
            <label className="block font-sans text-[10px] uppercase tracking-[0.2em] mb-2 opacity-70" htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              className="w-full bg-transparent border-b border-[var(--fg)]/30 py-3 text-sm focus:outline-none focus:border-[var(--fg)] transition-colors placeholder-[var(--fg)]/20"
              placeholder="Create a strong password"
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full mt-8 border border-[var(--fg)] bg-[var(--fg)] text-[var(--bg)] font-sans text-xs uppercase tracking-widest py-4 hover:bg-transparent hover:text-[var(--fg)] transition-colors duration-300"
          >
            Request Beta Access
          </button>
        </form>

        <div className="mt-8 text-center border-t border-[var(--fg)]/10 pt-8">
          <p className="font-sans text-[10px] uppercase tracking-widest opacity-60">
            Already a member?{' '}
            <Link to="/login" className="text-[var(--fg)] font-bold hover:opacity-70 transition-opacity">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
