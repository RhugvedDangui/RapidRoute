import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

import Hero from '../components/Hero';

function Home() {
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  const yParallax = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  const fadeUpVariant = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="bg-[var(--bg)] text-[var(--fg)] font-sans selection:bg-[var(--fg)] selection:text-[var(--bg)]" ref={containerRef}>
      <Hero />

      {/* The Margin Problem */}
      <div className="w-full border-t border-[var(--fg)]/10 pt-32 pb-40 px-6 md:px-12 bg-[var(--bg)] relative z-10">
        <div className="max-w-[1200px] mx-auto text-center flex flex-col items-center">
          <motion.p initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant} className="font-sans text-[10px] uppercase tracking-[0.3em] text-[var(--fg)]/50 mb-8">
            The Margin Problem
          </motion.p>
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant} className="font-['Playfair_Display'] text-4xl md:text-6xl font-bold tracking-tighter leading-tight italic max-w-4xl">
            "Small sellers bleed margins on inefficient logistics. We built the engine to stop it."
          </motion.h2>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant} className="w-[1px] h-24 bg-[var(--fg)]/30 mt-16"></motion.div>
        </div>
      </div>

      {/* Route Optimization */}
      <div className="w-full py-32 px-6 md:px-12 bg-[var(--bg)] relative z-10 border-t border-[var(--fg)]/10 overflow-hidden">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="space-y-8">
            <motion.span variants={fadeUpVariant} className="font-sans text-[10px] uppercase tracking-[0.3em] border border-[var(--fg)]/20 px-4 py-2 rounded-full">
              Core Module 01
            </motion.span>
            <motion.h3 variants={fadeUpVariant} className="font-['Playfair_Display'] text-5xl md:text-7xl font-bold tracking-tighter">
              Dynamic <br /> Routing.
            </motion.h3>
            <motion.p variants={fadeUpVariant} className="font-sans text-[var(--fg)]/70 text-lg font-light max-w-md leading-relaxed">
              Instantly compute the most cost-effective path for your daily orders. We factor in time windows, vehicle constraints, and live traffic.
            </motion.p>
            <motion.div variants={fadeUpVariant} className="pt-8 flex gap-12">
              <div>
                <p className="font-serif text-4xl font-bold italic">-32%</p>
                <p className="font-sans text-xs uppercase tracking-widest text-[var(--fg)]/50 mt-2">Avg. Distance</p>
              </div>
              <div>
                <p className="font-serif text-4xl font-bold italic">+40%</p>
                <p className="font-sans text-xs uppercase tracking-widest text-[var(--fg)]/50 mt-2">Time Saved</p>
              </div>
            </motion.div>
          </motion.div>

          <div className="relative w-full border border-[var(--fg)]/20 bg-[var(--fg)]/5 flex items-center justify-center overflow-hidden rounded-xl shadow-2xl">
            {/* Dynamic Route Video */}
            <video className="w-full h-auto rounded-xl scale-105" playsInline autoPlay muted loop>
              <source src="/Dynamicroute.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </div>

      {/* Order Batching */}
      <div className="w-full py-32 px-6 md:px-12 bg-[var(--fg)] text-[var(--bg)] relative z-10 border-t border-[var(--bg)]/10">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Literal Visual Representation (Left Side) */}
          <div className="order-2 lg:order-1 relative w-full flex items-center justify-center overflow-hidden rounded-xl shadow-2xl border border-[var(--bg)]/20 bg-[var(--bg)]/5">
             <img src="/batching.png" alt="Order Batching" className="w-full h-auto" />
          </div>

          {/* Text Description (Right Side) */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="space-y-8 order-1 lg:order-2">
            <motion.span variants={fadeUpVariant} className="font-sans text-[10px] uppercase tracking-[0.3em] border border-[var(--bg)]/20 px-4 py-2 rounded-full">
              Core Module 02
            </motion.span>
            <motion.h3 variants={fadeUpVariant} className="font-['Playfair_Display'] text-5xl md:text-7xl font-bold tracking-tighter italic">
              Intelligent Grouping.
            </motion.h3>
            <motion.p variants={fadeUpVariant} className="font-sans text-[var(--bg)]/70 text-lg font-light max-w-md leading-relaxed">
              Merge orders by proximity, dimensions, and SLA. Cut logistics costs by utilizing shared capacity across our seller network.
            </motion.p>
            <motion.ul variants={fadeUpVariant} className="space-y-4 pt-4 border-t border-[var(--bg)]/20">
              <li className="flex justify-between items-center text-sm uppercase tracking-widest py-2"><span className="opacity-50">01</span><span>Geo-Clustering</span></li>
              <li className="flex justify-between items-center text-sm uppercase tracking-widest py-2"><span className="opacity-50">02</span><span>Volumetric Merging</span></li>
              <li className="flex justify-between items-center text-sm uppercase tracking-widest py-2"><span className="opacity-50">03</span><span>Collaborative Dispatch</span></li>
            </motion.ul>
          </motion.div>

        </div>
      </div>

      {/* Delay Prediction */}
      <div className="w-full py-32 px-6 md:px-12 bg-[var(--bg)] relative z-10 border-t border-[var(--fg)]/10">
        <div className="max-w-[1400px] mx-auto text-center flex flex-col items-center mb-24">
          <motion.span initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant} className="font-sans text-[10px] uppercase tracking-[0.3em] border border-[var(--fg)]/20 px-4 py-2 rounded-full mb-8">
            Core Module 03
          </motion.span>
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUpVariant} className="font-['Playfair_Display'] text-5xl md:text-7xl font-bold tracking-tighter max-w-3xl">
            Predict Delays Before They Happen.
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1200px] mx-auto">
          {[
            { title: "Risk Scoring", val: "94%", desc: "Accuracy in flagging high-risk orders prior to dispatch." },
            { title: "Proactive Alerts", val: "< 1s", desc: "Real-time SLA breach warnings based on traffic density." },
            { title: "Courier Data", val: "50k+", desc: "Historical delivery points analyzed for partner reliability." }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUpVariant}
              transition={{ delay: i * 0.1 }}
              className="border border-[var(--fg)]/20 p-8 flex flex-col items-start hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-colors duration-500 group cursor-default"
            >
              <span className="text-xs uppercase tracking-widest opacity-50 group-hover:opacity-80 mb-12">{stat.title}</span>
              <h4 className="font-serif text-6xl font-bold italic mb-4">{stat.val}</h4>
              <p className="font-light text-sm opacity-70 group-hover:opacity-90 leading-relaxed">{stat.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <div className="w-full bg-[var(--fg)] text-[var(--bg)] px-6 md:px-12 py-32 relative z-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl space-y-8"
        >
          <h2 className="font-['Playfair_Display'] text-5xl md:text-7xl font-bold tracking-tighter italic">
            Stop Losing Margins.
          </h2>
          <p className="font-sans opacity-70 text-lg font-light">
            Integrate Rapid Route in 5 minutes. Optimize instantly.
          </p>
          <button className="mt-8 font-sans text-xs uppercase tracking-widest text-[var(--fg)] bg-[var(--bg)] px-8 py-4 hover:opacity-80 transition-opacity duration-300">
            Start Optimizing Now
          </button>
        </motion.div>
      </div>

    </div>
  );
}

export default Home;