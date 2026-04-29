import React from 'react';

const Team = () => {
  return (
    <div className="flex flex-col gap-6 animate-fade-in text-[var(--fg)] w-full">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-xl font-bold mb-1">Team Management</h3>
          <p className="text-[11px] text-[var(--fg)]/50">Manage your dispatchers, drivers, and support staff.</p>
        </div>
        <button className="border border-[var(--border-color)] rounded-full px-5 py-2 text-xs font-medium flex items-center gap-2 hover:bg-[var(--fg)]/5 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
          Add Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-6 flex flex-col justify-center">
          <div className="text-3xl font-bold mb-1">24</div>
          <div className="text-[11px] text-[var(--fg)]/50">Active Drivers</div>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-6 flex flex-col justify-center">
          <div className="text-3xl font-bold mb-1">3</div>
          <div className="text-[11px] text-[var(--fg)]/50">Dispatchers</div>
        </div>
        <div className="bg-[var(--card-bg)] border border-[var(--border-color)] rounded-3xl p-6 flex flex-col justify-center">
          <div className="text-3xl font-bold mb-1">98%</div>
          <div className="text-[11px] text-[var(--fg)]/50">On-Time Rating</div>
        </div>
      </div>

      <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--border-color)] shadow-sm p-8 mt-4">
        <h3 className="text-sm font-medium mb-6 text-[var(--fg)]/80">Staff Directory</h3>
        
        <div className="space-y-4">
          {[
            { name: 'Arjun Kumar', role: 'Fleet Manager', status: 'Online', perf: 'Excellent' },
            { name: 'Priya Sharma', role: 'Support Agent', status: 'Online', perf: 'Good' },
            { name: 'Rahul Verma', role: 'Delivery Partner', status: 'On Route', perf: 'Excellent' },
            { name: 'Amit Singh', role: 'Delivery Partner', status: 'Offline', perf: 'Needs Attention' },
          ].map((member, i) => (
            <div key={i} className="flex justify-between items-center p-4 border border-[var(--border-color)] rounded-2xl bg-[var(--fg)]/[0.02] hover:bg-[var(--fg)]/[0.04] transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[var(--fg)]/5 border border-[var(--border-color)] flex items-center justify-center font-bold text-xs">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-bold">{member.name}</div>
                  <div className="text-[10px] text-[var(--fg)]/50 mt-1">{member.role}</div>
                </div>
              </div>
              <div className="text-right flex items-center gap-4">
                <div className={`text-[10px] font-bold ${
                  member.perf === 'Excellent' ? 'text-green-500' :
                  member.perf === 'Needs Attention' ? 'text-red-500' : 'text-yellow-500'
                }`}>
                  {member.perf}
                </div>
                <div className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full w-24 text-center ${
                  member.status === 'Online' ? 'bg-green-500/10 text-green-500' :
                  member.status === 'On Route' ? 'bg-blue-500/10 text-blue-500' : 'bg-[var(--fg)]/10 text-[var(--fg)]/70'
                }`}>{member.status}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Team;
