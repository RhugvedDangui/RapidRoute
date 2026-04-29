import React from 'react';
import { motion } from 'framer-motion';

const Fleet = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header Section */}
      <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--fg)]/10 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium mb-2">Driver Fleet</h1>
            <p className="text-xs opacity-70 uppercase tracking-widest">Live Monitoring & Action Feed</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-[10px] rounded-xl uppercase tracking-widest border border-[var(--fg)]/20 px-4 py-3 hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-colors shadow-sm font-medium">
              + Add Driver
            </button>
            <button className="text-[10px] rounded-xl uppercase tracking-widest bg-[var(--fg)] text-[var(--bg)] px-4 py-3 hover:opacity-80 transition-opacity shadow-sm font-medium">
              Broadcast SOS
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Active Drivers List */}
        <div className="lg:col-span-2 bg-[var(--card-bg)] rounded-3xl border border-[var(--fg)]/10 shadow-sm p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--fg)]/10">
            <h3 className="text-lg font-medium">Active Fleet</h3>
            <div className="bg-[var(--fg)]/5 rounded-xl p-2 border border-[var(--fg)]/10">
              <svg className="w-6 h-6 text-[var(--fg)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
          </div>
          
          <div className="flex-1 space-y-4">
            {/* Driver Card */}
            <div className="p-5 rounded-2xl border border-[var(--fg)]/10 hover:shadow-md transition-shadow bg-[var(--fg)]/5">
               <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full bg-[var(--card-bg)] text-[var(--fg)] flex items-center justify-center font-medium text-lg border border-[var(--fg)]/20 shadow-sm">VK</div>
                   <div>
                     <h4 className="font-medium">Vikram K. (Van-01)</h4>
                     <p className="text-[10px] uppercase tracking-widest opacity-70">Zone 4 (North)</p>
                   </div>
                 </div>
                 <div className="text-right">
                   <div className="text-[10px] font-medium uppercase text-green-500 bg-green-500/10 rounded-full px-3 py-1">On Route</div>
                   <p className="text-[10px] opacity-50 mt-1">Last sync: 2m ago</p>
                 </div>
               </div>
               
               <div className="grid grid-cols-3 gap-4 border-t border-[var(--fg)]/10 pt-4 text-xs">
                 <div>
                   <p className="opacity-50 text-[9px] uppercase tracking-widest mb-1">Status</p>
                   <p className="font-medium">4/14 Delivered</p>
                 </div>
                 <div>
                   <p className="opacity-50 text-[9px] uppercase tracking-widest mb-1">Next Stop</p>
                   <p className="font-medium truncate">124 Residency Rd.</p>
                 </div>
                 <div>
                   <p className="opacity-50 text-[9px] uppercase tracking-widest mb-1">Actions</p>
                   <button className="text-[9px] font-medium uppercase text-[var(--fg)] hover:opacity-70 underline">Ping Loc</button>
                 </div>
               </div>
            </div>

            {/* Driver Card */}
            <div className="p-5 rounded-2xl border border-[var(--fg)]/10 hover:shadow-md transition-shadow bg-red-500/5">
               <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-full bg-[var(--card-bg)] text-[var(--fg)] flex items-center justify-center font-medium text-lg border border-[var(--fg)]/20 shadow-sm">RS</div>
                   <div>
                     <h4 className="font-medium">Rahul S. (Bike-04)</h4>
                     <p className="text-[10px] uppercase tracking-widest opacity-70">Zone 1 (Downtown)</p>
                   </div>
                 </div>
                 <div className="text-right">
                   <div className="text-[10px] font-medium uppercase text-red-500 bg-red-500/10 rounded-full px-3 py-1">Delayed</div>
                   <p className="text-[10px] opacity-50 mt-1">Last sync: 15m ago</p>
                 </div>
               </div>
               
               <div className="grid grid-cols-3 gap-4 border-t border-[var(--fg)]/10 pt-4 text-xs">
                 <div>
                   <p className="opacity-50 text-[9px] uppercase tracking-widest mb-1">Status</p>
                   <p className="font-medium">8/12 Delivered</p>
                 </div>
                 <div>
                   <p className="opacity-50 text-[9px] uppercase tracking-widest mb-1">Next Stop</p>
                   <p className="font-medium truncate">Tech Park Gate 2</p>
                 </div>
                 <div>
                   <p className="opacity-50 text-[9px] uppercase tracking-widest mb-1">Actions</p>
                   <button className="text-[9px] font-medium uppercase text-red-500 hover:opacity-70 underline">Call</button>
                 </div>
               </div>
            </div>

          </div>
        </div>

        {/* Action Feed */}
        <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--fg)]/10 shadow-sm p-8 flex flex-col h-[500px]">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--fg)]/10">
            <h3 className="text-lg font-medium">Live Action Feed</h3>
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full bg-green-400 opacity-75 rounded-full"></span>
              <span className="relative inline-flex h-3 w-3 bg-green-500 rounded-full"></span>
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-6 pr-2">
             <div className="border-l-4 rounded-l border-[var(--fg)] pl-4">
               <p className="text-xs font-medium">Package Delivered</p>
               <p className="text-[10px] opacity-70 mt-1">Vikram K. delivered ORD-9012.</p>
               <p className="text-[9px] font-medium uppercase tracking-widest opacity-50 mt-2">Just Now</p>
             </div>
             <div className="border-l-4 rounded-l border-yellow-500 pl-4">
               <p className="text-xs font-medium text-yellow-500">Route Deviation</p>
               <p className="text-[10px] opacity-70 mt-1">Rahul S. deviated from optimal route.</p>
               <p className="text-[9px] font-medium uppercase tracking-widest opacity-50 mt-2">12 mins ago</p>
             </div>
             <div className="border-l-4 rounded-l border-red-500 pl-4 bg-red-500/5 py-2">
               <p className="text-xs font-medium text-red-500">SOS Alert</p>
               <p className="text-[10px] text-red-500 opacity-70 mt-1">Driver B reported flooded street.</p>
               <p className="text-[9px] font-medium uppercase tracking-widest opacity-50 mt-2 text-red-500">1 hr ago</p>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Fleet;
