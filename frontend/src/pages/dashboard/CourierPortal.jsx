import React from 'react';

const CourierPortal = () => {
  return (
    <div className="flex flex-col gap-6 animate-fade-in text-[var(--fg)] w-full">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-xl font-bold mb-1">Financial Analytics</h3>
          <p className="text-[11px] text-[var(--fg)]/50">Shipping costs, carrier rates, and routing savings.</p>
        </div>
        <button className="border border-[var(--fg)]/20 rounded-full px-5 py-2 text-xs font-medium flex items-center gap-2 hover:bg-[var(--fg)]/5 transition-colors">
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-6 flex flex-col justify-center shadow-sm">
          <div className="text-3xl font-bold mb-1">₹12.4k</div>
          <div className="text-[11px] text-[var(--fg)]/50">Total Spend (Month)</div>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-6 flex flex-col justify-center shadow-sm">
          <div className="text-3xl font-bold mb-1 text-green-400">₹3,240</div>
          <div className="text-[11px] text-green-400/50">Savings via AI</div>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-6 flex flex-col justify-center shadow-sm">
          <div className="text-3xl font-bold mb-1">₹42.5</div>
          <div className="text-[11px] text-[var(--fg)]/50">Avg Cost per Delivery</div>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-6 flex flex-col justify-center shadow-sm">
          <div className="text-3xl font-bold mb-1">45%</div>
          <div className="text-[11px] text-[var(--fg)]/50">Shared Capacity Used</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        
        {/* Third-Party Handoffs Costs */}
        <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--border-color)] shadow-sm p-8">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-color)]">
            <h3 className="text-sm font-medium text-[var(--fg)]/80">3PL Carrier Breakdown</h3>
            <div className="bg-[var(--fg)]/5 rounded-xl p-2 border border-[var(--border-color)]">
              <svg className="w-4 h-4 text-[var(--fg)]/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
            </div>
          </div>
          
          <div className="space-y-4 text-xs">
             <div className="flex justify-between items-center rounded-2xl border border-[var(--border-color)] p-5 bg-[var(--fg)]/[0.02] hover:bg-[var(--fg)]/[0.04] transition-colors">
                <div>
                  <span className="font-bold block text-sm">Delhivery</span>
                  <span className="text-[var(--fg)]/50 mt-1 block font-mono">142 Orders • Avg ₹45</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-lg block">₹6,390</span>
                  <span className="text-[9px] text-[var(--fg)]/40 block">This Week</span>
                </div>
             </div>
             
             <div className="flex justify-between items-center rounded-2xl border border-[var(--border-color)] p-5 bg-[var(--fg)]/[0.02] hover:bg-[var(--fg)]/[0.04] transition-colors">
                <div>
                  <span className="font-bold block text-sm">Shadowfax (Hyperlocal)</span>
                  <span className="text-[var(--fg)]/50 mt-1 block font-mono">28 Orders • Avg ₹38</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-lg block">₹1,064</span>
                  <span className="text-[9px] text-[var(--fg)]/40 block">This Week</span>
                </div>
             </div>
             
             <div className="flex justify-between items-center rounded-2xl border border-[var(--border-color)] p-5 bg-[var(--fg)]/[0.02] hover:bg-[var(--fg)]/[0.04] transition-colors">
                <div>
                  <span className="font-bold block text-sm">Dunzo</span>
                  <span className="text-[var(--fg)]/50 mt-1 block font-mono">12 Orders • Avg ₹65</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-lg block text-red-400">₹780</span>
                  <span className="text-[9px] text-[var(--fg)]/40 block">High Surge Area</span>
                </div>
             </div>
          </div>
        </div>

        {/* Real-time Ledger */}
        <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--border-color)] shadow-sm p-8 flex flex-col">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-color)]">
            <h3 className="text-sm font-medium text-[var(--fg)]/80">Real-Time Ledger</h3>
            <div className="bg-[var(--fg)]/5 rounded-xl p-2 border border-[var(--border-color)]">
              <svg className="w-4 h-4 text-[var(--fg)]/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
          </div>
          
          <div className="bg-[var(--bg)]/50 text-[var(--fg)]/80 p-6 rounded-2xl font-mono text-[10px] h-[300px] overflow-y-auto space-y-3 flex-1 border border-[var(--border-color)] hide-scrollbar">
            <div className="text-green-400/90 flex justify-between"><span>[SAVINGS] AI Batch Merge #882</span> <span>+₹120.00</span></div>
            <div className="text-[var(--fg)]/70 flex justify-between"><span>[DEBIT] Porter Express Dispatch</span> <span>-₹65.00</span></div>
            <div className="text-[var(--fg)]/70 flex justify-between"><span>[DEBIT] Delhivery Bulk Upload (40)</span> <span>-₹1,800.00</span></div>
            <div className="text-green-400/90 flex justify-between"><span>[SAVINGS] Shared Cap Partner Match</span> <span>+₹340.00</span></div>
            <div className="text-[var(--fg)]/70 flex justify-between"><span>[DEBIT] Shadowfax Rush Order</span> <span>-₹85.00</span></div>
            <div className="text-[var(--fg)]/40 mt-4 italic">Waiting for incoming transactions...</div>
            <div className="w-1.5 h-3 bg-[var(--fg)]/40 animate-pulse inline-block mt-2"></div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default CourierPortal;
