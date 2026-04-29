import React from 'react';
import { motion } from 'framer-motion';

const Routing = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header Section */}
      <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--fg)]/10 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium mb-2">Routing & Batching</h1>
            <p className="text-xs opacity-70 uppercase tracking-widest">Geo-Clustered & Collaborative Optimization</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-[10px] rounded-xl shadow-sm uppercase tracking-widest bg-[var(--fg)] text-[var(--bg)] px-6 py-3 hover:opacity-80 transition-opacity font-medium">
              Optimize Day
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Batches List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--fg)]/10 shadow-sm p-8 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="bg-[var(--fg)]/10 rounded-2xl text-[var(--fg)] p-4"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
                <div>
                  <h4 className="text-lg font-medium">Batch Z-A (North)</h4>
                  <p className="text-[10px] uppercase tracking-widest opacity-70 mt-1">14 Orders • Geo-Clustered</p>
                </div>
              </div>
              <div className="text-[10px] font-medium uppercase bg-[var(--fg)]/5 rounded-full px-4 py-2">Van-01</div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 border-y border-[var(--fg)]/10 py-6 mb-6 text-xs">
               <div><span className="opacity-50 block mb-1 uppercase text-[9px] tracking-widest">Distance</span> <span className="font-medium text-base">18.2 km</span></div>
               <div><span className="opacity-50 block mb-1 uppercase text-[9px] tracking-widest">Est. Time</span> <span className="font-medium text-base">2h 15m</span></div>
               <div><span className="opacity-50 block mb-1 uppercase text-[9px] tracking-widest">Cost Est.</span> <span className="font-medium text-base">₹320</span></div>
            </div>
            <div className="flex gap-4">
              <button className="text-[10px] font-medium uppercase tracking-widest border border-[var(--fg)]/20 rounded-xl px-6 py-3 hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-colors shadow-sm">Approve & Dispatch</button>
            </div>
          </div>

          <div className="bg-[var(--fg)] text-[var(--bg)] rounded-3xl border border-[var(--fg)]/10 shadow-md p-8 relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-[var(--card-bg)] text-[var(--fg)] text-[9px] font-medium uppercase px-3 py-1.5 rounded-full">Multi-Seller Share</div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="bg-[var(--card-bg)]/10 rounded-2xl text-[var(--bg)] p-4"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></div>
                <div>
                  <h4 className="text-lg font-medium">Batch Z-C (South)</h4>
                  <p className="text-[10px] uppercase tracking-widest opacity-80 mt-1">8 Orders • Combined with Seller X</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 border-y border-[var(--bg)]/20 py-6 mb-6 text-xs">
               <div><span className="opacity-70 block mb-1 uppercase text-[9px] tracking-widest">Cost Split</span> <span className="font-medium text-base">45% (You)</span></div>
               <div><span className="opacity-70 block mb-1 uppercase text-[9px] tracking-widest">Saved</span> <span className="font-medium text-base text-green-400">₹180</span></div>
               <div><span className="opacity-70 block mb-1 uppercase text-[9px] tracking-widest">Status</span> <span className="font-medium text-base">Pending Sync</span></div>
            </div>
            <button className="text-[10px] font-medium uppercase tracking-widest bg-[var(--card-bg)] text-[var(--fg)] rounded-xl px-6 py-3 hover:opacity-90 transition-colors shadow-sm">Confirm Shared Dispatch</button>
          </div>
        </div>

        {/* Map / Constraints Panel */}
        <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--fg)]/10 shadow-sm p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--fg)]/10">
            <h3 className="text-lg font-medium">Constraints</h3>
            <div className="bg-[var(--fg)]/5 rounded-xl p-2 border border-[var(--fg)]/10">
              <svg className="w-5 h-5 text-[var(--fg)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
          </div>
          
          <div className="space-y-3 text-xs flex-1">
             <label className="flex items-center gap-4 rounded-xl border border-[var(--fg)]/10 p-4 hover:bg-[var(--fg)]/5 cursor-pointer transition-colors shadow-sm"><input type="checkbox" defaultChecked className="accent-[var(--fg)] w-4 h-4 rounded" /> Respect Time Windows</label>
             <label className="flex items-center gap-4 rounded-xl border border-[var(--fg)]/10 p-4 hover:bg-[var(--fg)]/5 cursor-pointer transition-colors shadow-sm"><input type="checkbox" defaultChecked className="accent-[var(--fg)] w-4 h-4 rounded" /> Avoid Toll Roads</label>
             <label className="flex items-center gap-4 rounded-xl border border-[var(--fg)]/10 p-4 hover:bg-[var(--fg)]/5 cursor-pointer transition-colors shadow-sm"><input type="checkbox" defaultChecked className="accent-[var(--fg)] w-4 h-4 rounded" /> Combine Return Pickups</label>
             <label className="flex items-center gap-4 rounded-xl border border-[var(--fg)]/10 p-4 hover:bg-[var(--fg)]/5 cursor-pointer transition-colors shadow-sm"><input type="checkbox" className="accent-[var(--fg)] w-4 h-4 rounded" /> Avoid Highways (2W)</label>
          </div>

          <div className="mt-8 rounded-2xl overflow-hidden border border-[var(--fg)]/10 h-48 relative flex items-center justify-center bg-[var(--fg)]/5 shadow-inner">
             <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" xmlns="http://www.w3.org/2000/svg">
                <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2 }} d="M 50 50 L 150 100 L 100 150 L 200 120" stroke="var(--fg)" strokeWidth="2" fill="none" strokeDasharray="6 6" />
             </svg>
             <div className="text-[10px] font-medium uppercase tracking-widest bg-[var(--card-bg)]/90 backdrop-blur-md rounded-full shadow-sm px-4 py-2 relative z-20">Live Map Feed</div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Routing;
