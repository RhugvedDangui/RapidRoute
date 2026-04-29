import React from 'react';

const Returns = () => {
  return (
    <div className="flex flex-col gap-6 animate-fade-in text-[var(--fg)] w-full">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-xl font-bold mb-1">Reverse Logistics</h3>
          <p className="text-[11px] text-[var(--fg)]/50">Manage customer returns and QC operations.</p>
        </div>
        <button className="border border-[var(--fg)]/20 rounded-full px-5 py-2 text-xs font-medium flex items-center gap-2 hover:bg-[var(--fg)]/5 transition-colors">
          Create Return
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-6 flex flex-col justify-center">
          <div className="text-3xl font-bold mb-1">14</div>
          <div className="text-[11px] text-[var(--fg)]/50">Pending Pickup</div>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-6 flex flex-col justify-center">
          <div className="text-3xl font-bold mb-1">₹4,200</div>
          <div className="text-[11px] text-[var(--fg)]/50">Refund Liability</div>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-6 flex flex-col justify-center">
          <div className="text-3xl font-bold mb-1">89%</div>
          <div className="text-[11px] text-[var(--fg)]/50">QC Pass Rate</div>
        </div>
      </div>

      <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--border-color)] shadow-sm p-8 mt-4">
        <h3 className="text-sm font-medium mb-6 text-[var(--fg)]/80">Recent Returns</h3>
        
        <div className="space-y-4">
          {[
            { id: 'RET-892', item: 'Nike Air Max', reason: 'Size Mismatch', status: 'Pending QC', time: '10:45 AM' },
            { id: 'RET-893', item: 'Sony Headphones', reason: 'Defective', status: 'Approved', time: '11:20 AM' },
            { id: 'RET-894', item: 'Cotton T-Shirt', reason: 'Changed Mind', status: 'In Transit', time: 'Yesterday' },
          ].map((ret, i) => (
            <div key={i} className="flex justify-between items-center p-4 border border-[var(--border-color)] rounded-2xl bg-[var(--fg)]/[0.02] hover:bg-[var(--fg)]/[0.04] transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[var(--fg)]/5 flex items-center justify-center">
                  <svg className="w-4 h-4 text-[var(--fg)]/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                </div>
                <div>
                  <div className="text-sm font-bold">{ret.id} <span className="font-normal text-[var(--fg)]/70">· {ret.item}</span></div>
                  <div className="text-[10px] text-[var(--fg)]/40 mt-1">Reason: {ret.reason}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full inline-block ${
                  ret.status === 'Approved' ? 'bg-green-500/10 text-green-500' :
                  ret.status === 'Pending QC' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-[var(--fg)]/10 text-[var(--fg)]/70'
                }`}>{ret.status}</div>
                <div className="text-[10px] text-[var(--fg)]/30 mt-2">{ret.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Returns;
