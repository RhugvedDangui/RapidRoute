import React from 'react';

const Analytics = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header Section */}
      <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--fg)]/10 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium mb-2">Analytics & Cost</h1>
            <p className="text-xs opacity-70 uppercase tracking-widest">Financial Performance & Partner Metrics</p>
          </div>
          <div className="flex items-center space-x-4">
            <select className="bg-[var(--fg)]/5 text-[var(--fg)] text-[10px] uppercase tracking-widest border border-[var(--fg)]/10 rounded-xl px-4 py-3 outline-none cursor-pointer">
               <option>Last 30 Days</option>
               <option>This Quarter</option>
               <option>Year to Date</option>
            </select>
            <button className="text-[10px] uppercase tracking-widest bg-[var(--fg)] text-[var(--bg)] rounded-xl px-6 py-3 font-medium hover:opacity-80 transition-opacity shadow-sm">
              Export PDF
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* KPI Cards */}
        <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--fg)]/10 shadow-sm p-8 flex flex-col justify-center">
          <p className="text-[10px] uppercase tracking-widest opacity-70 mb-2">Total Spend</p>
          <h3 className="text-3xl font-bold tracking-tight mb-4">₹12,450</h3>
          <div className="flex items-center gap-2 text-xs font-medium text-red-500 bg-red-500/10 w-fit px-3 py-1 rounded-full">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
            +4.2% vs last month
          </div>
        </div>

        <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--fg)]/10 shadow-sm p-8 flex flex-col justify-center">
          <p className="text-[10px] uppercase tracking-widest opacity-70 mb-2">Cost per Order (Avg)</p>
          <h3 className="text-3xl font-bold tracking-tight mb-4">₹48.20</h3>
          <div className="flex items-center gap-2 text-xs font-medium text-green-500 bg-green-500/10 w-fit px-3 py-1 rounded-full">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
            -12.5% vs last month
          </div>
        </div>

        <div className="bg-[var(--fg)] rounded-3xl text-[var(--bg)] p-8 flex flex-col justify-center shadow-md relative overflow-hidden">
          <div className="absolute top-4 right-4 bg-[var(--card-bg)]/10 p-2 rounded-xl">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>
          <p className="text-[10px] uppercase tracking-widest opacity-80 mb-2">Network Savings</p>
          <h3 className="text-3xl font-bold tracking-tight mb-4 text-green-400">₹4,120</h3>
          <p className="text-xs font-medium opacity-80">Accumulated via shared routing</p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Partner Performance Table */}
        <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--fg)]/10 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--fg)]/10">
            <h3 className="text-lg font-medium">Partner Performance</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--fg)]/10 text-[9px] uppercase tracking-widest opacity-50">
                  <th className="p-4 font-normal">Partner</th>
                  <th className="p-4 font-normal">SLA Compliance</th>
                  <th className="p-4 font-normal">Cost/Order</th>
                  <th className="p-4 font-normal">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                <tr className="border-b border-[var(--fg)]/5 hover:bg-[var(--fg)]/5 transition-colors">
                  <td className="p-4 font-medium">Delhivery</td>
                  <td className="p-4 text-green-500 font-medium">98.2%</td>
                  <td className="p-4">₹45.00</td>
                  <td className="p-4"><span className="text-[9px] uppercase bg-green-500/10 text-green-500 px-3 py-1 rounded-full font-medium">Optimal</span></td>
                </tr>
                <tr className="border-b border-[var(--fg)]/5 hover:bg-[var(--fg)]/5 transition-colors">
                  <td className="p-4 font-medium">Shadowfax</td>
                  <td className="p-4">94.5%</td>
                  <td className="p-4">₹42.50</td>
                  <td className="p-4"><span className="text-[9px] uppercase bg-[var(--fg)]/10 px-3 py-1 rounded-full font-medium">Active</span></td>
                </tr>
                <tr className="border-b border-[var(--fg)]/5 hover:bg-[var(--fg)]/5 transition-colors bg-red-500/5">
                  <td className="p-4 font-medium">Dunzo</td>
                  <td className="p-4 text-red-500 font-medium">88.1%</td>
                  <td className="p-4">₹55.00</td>
                  <td className="p-4"><span className="text-[9px] uppercase bg-red-500/10 text-red-500 px-3 py-1 rounded-full font-medium">Review</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Forecast / Summary Widget */}
        <div className="bg-[var(--card-bg)] border border-[var(--fg)]/20 p-8">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--fg)]/10">
            <h3 className="text-lg font-['Playfair_Display'] font-medium">Cost Trend</h3>
          </div>
          
          <div className="h-48 border-b border-l border-[var(--fg)]/20 flex items-end gap-4 p-4">
             {/* Mock Chart */}
             <div className="w-full bg-[var(--fg)]/20 h-[80%] relative"><span className="absolute -top-6 text-[8px] opacity-50 uppercase tracking-widest">W1</span></div>
             <div className="w-full bg-[var(--fg)]/20 h-[60%] relative"><span className="absolute -top-6 text-[8px] opacity-50 uppercase tracking-widest">W2</span></div>
             <div className="w-full bg-[var(--fg)]/20 h-[50%] relative"><span className="absolute -top-6 text-[8px] opacity-50 uppercase tracking-widest">W3</span></div>
             <div className="w-full bg-[var(--fg)] h-[35%] relative"><span className="absolute -top-6 text-[8px] font-medium uppercase tracking-widest text-green-500">W4</span></div>
          </div>
          <p className="text-xs opacity-70 mt-6 text-center">Logistics costs trending down by 15% this month due to Shared Network routing.</p>
        </div>

      </div>
    </div>
  );
};

export default Analytics;
