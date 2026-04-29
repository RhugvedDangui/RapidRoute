import React from 'react';

const OrderManagement = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header Section */}
      <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--fg)]/10 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium mb-2">Order Management</h1>
            <p className="text-xs opacity-70 uppercase tracking-widest">Forward & Reverse Logistics Sync</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-[10px] rounded-xl uppercase tracking-widest border border-[var(--fg)]/20 px-4 py-3 hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-colors">
              + Add Manual
            </button>
            <button className="text-[10px] rounded-xl shadow-sm uppercase tracking-widest bg-[var(--fg)] text-[var(--bg)] px-4 py-3 hover:opacity-80 transition-opacity">
              Sync Shopify
            </button>
          </div>
        </div>
      </div>

      {/* Main Analytics Grid layout for Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Orders Table Section */}
        <div className="lg:col-span-2 bg-[var(--card-bg)] rounded-3xl border border-[var(--fg)]/10 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--fg)]/10">
            <h3 className="text-lg font-medium">Forward Orders</h3>
            <div className="bg-[var(--fg)]/5 rounded-xl p-2 border border-[var(--fg)]/10">
              <svg className="w-6 h-6 text-[var(--fg)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--fg)]/10 text-[9px] uppercase tracking-widest opacity-50">
                  <th className="p-4 font-normal">Order ID</th>
                  <th className="p-4 font-normal">Customer</th>
                  <th className="p-4 font-normal">Zone / Pin</th>
                  <th className="p-4 font-normal">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                <tr className="border-b border-[var(--fg)]/5 hover:bg-[var(--fg)]/5 transition-colors">
                  <td className="p-4 font-medium">ORD-9012</td><td className="p-4">Arjun M.</td><td className="p-4 opacity-70">Zone A (560001)</td>
                  <td className="p-4"><span className="bg-[var(--fg)] rounded-full text-[var(--bg)] px-3 py-1 text-[9px] uppercase font-medium">Out for Delivery</span></td>
                </tr>
                <tr className="border-b border-[var(--fg)]/5 hover:bg-[var(--fg)]/5 transition-colors">
                  <td className="p-4 font-medium">ORD-9013</td><td className="p-4">Priya S.</td><td className="p-4 opacity-70">Zone B (560034)</td>
                  <td className="p-4"><span className="bg-[var(--fg)]/10 rounded-full px-3 py-1 text-[9px] uppercase font-medium">Batched</span></td>
                </tr>
                <tr className="border-b border-[var(--fg)]/5 hover:bg-[var(--fg)]/5 bg-red-500/5 transition-colors">
                  <td className="p-4 font-medium">ORD-9014</td><td className="p-4">Rahul K.</td><td className="p-4 opacity-70">Zone A (560002)</td>
                  <td className="p-4 text-red-500"><span className="bg-red-500/20 rounded-full px-3 py-1 text-[9px] uppercase font-medium">Partial (OOS)</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Reverse Logistics Summary */}
        <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--fg)]/10 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--fg)]/10">
            <h3 className="text-lg font-medium">Reverse Logistics</h3>
          </div>
          
          <div className="space-y-4">
            <div className="border border-[var(--fg)]/10 rounded-2xl p-6 relative bg-[var(--fg)]/5">
               <div className="text-[var(--fg)]/70 text-xs font-medium uppercase tracking-widest mb-2">Pending Returns</div>
               <div className="text-[var(--fg)] font-medium text-lg mt-2">4</div>
            </div>

            <div className="space-y-3 mt-6">
              <div className="flex items-center justify-between p-4 rounded-2xl border border-[var(--fg)]/10 text-xs hover:bg-[var(--fg)]/5 transition-colors cursor-pointer shadow-sm">
                <div className="flex items-center gap-4">
                   <div className="bg-[var(--fg)] rounded-xl text-[var(--bg)] p-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg></div>
                   <div>
                     <div className="font-medium text-sm">RET-102</div>
                     <div className="opacity-50 text-[10px] mt-0.5">Wrong Size • Unopened</div>
                   </div>
                </div>
                <div className="text-[9px] font-medium uppercase bg-[var(--fg)]/10 rounded-full px-3 py-1">Scheduled</div>
              </div>
            </div>

            <div className="pt-6 border-t border-[var(--fg)]/10 mt-6">
              <button className="w-full text-center px-4 py-3 rounded-xl text-xs uppercase tracking-widest bg-[var(--fg)] text-[var(--bg)] font-medium hover:opacity-80 transition-opacity shadow-sm">
                Combine with Forward →
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrderManagement;
