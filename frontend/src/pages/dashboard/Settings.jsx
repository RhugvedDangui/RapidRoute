import React from 'react';

const Settings = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header Section */}
      <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--fg)]/10 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium mb-2">Settings & Configuration</h1>
            <p className="text-xs opacity-70 uppercase tracking-widest">Platform Controls & Integrations</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-[10px] uppercase tracking-widest bg-[var(--fg)] text-[var(--bg)] px-6 py-3 font-medium hover:opacity-80 transition-opacity rounded-xl shadow-sm">
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Settings Form */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--fg)]/10 shadow-sm p-8">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--fg)]/10">
              <h3 className="text-lg font-medium">API Integrations</h3>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest opacity-70 mb-2 font-medium">Shopify Access Token</label>
                <input type="password" value="shpat_89234789234892374" readOnly className="w-full bg-[var(--fg)]/5 border border-[var(--fg)]/10 rounded-xl p-4 text-xs focus:outline-none focus:border-[var(--fg)]/30 transition-colors" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest opacity-70 mb-2 font-medium">Delhivery Client ID</label>
                <input type="text" value="DLV-8823-XYZ" readOnly className="w-full bg-[var(--fg)]/5 border border-[var(--fg)]/10 rounded-xl p-4 text-xs focus:outline-none focus:border-[var(--fg)]/30 transition-colors" />
              </div>
              <button className="text-[10px] font-medium uppercase tracking-widest border border-[var(--fg)]/20 rounded-xl px-5 py-3 hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-colors shadow-sm">
                + Add New Connection
              </button>
            </div>
          </div>

          <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--fg)]/10 shadow-sm p-8">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--fg)]/10">
              <h3 className="text-lg font-medium">Routing Preferences</h3>
            </div>
            <div className="space-y-4 text-xs">
              <label className="flex items-center justify-between rounded-xl border border-[var(--fg)]/10 p-5 hover:shadow-md transition-shadow cursor-pointer bg-[var(--card-bg)]">
                 <span className="font-medium">Enable Multi-Seller Shared Routing</span>
                 <input type="checkbox" defaultChecked className="accent-[var(--fg)] w-5 h-5 cursor-pointer" />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-[var(--fg)]/10 p-5 hover:shadow-md transition-shadow cursor-pointer bg-[var(--card-bg)]">
                 <span className="font-medium">Auto-Assign Drivers (Based on Proximity)</span>
                 <input type="checkbox" defaultChecked className="accent-[var(--fg)] w-5 h-5 cursor-pointer" />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-[var(--fg)]/10 p-5 hover:shadow-md transition-shadow cursor-pointer bg-[var(--card-bg)]">
                 <span className="font-medium">Strict Delivery SLA Enforcement (Drops lower priority)</span>
                 <input type="checkbox" className="accent-[var(--fg)] w-5 h-5 cursor-pointer" />
              </label>
            </div>
          </div>

        </div>

        {/* Sidebar Controls */}
        <div className="space-y-8">
          
          <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--fg)]/10 shadow-sm p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--fg)]/10">
              <h3 className="text-lg font-medium">Data Privacy</h3>
            </div>
            <p className="text-xs opacity-70 mb-6">Manage GDPR compliance, data retention, and customer PII purging.</p>
            <div className="space-y-4">
              <button className="w-full text-left font-medium text-[10px] uppercase tracking-widest border border-[var(--fg)]/20 rounded-xl px-4 py-3 hover:bg-[var(--fg)]/5 transition-colors shadow-sm">
                Export Compliance Report
              </button>
              <button className="w-full text-left font-medium text-[10px] uppercase tracking-widest border border-red-500/30 text-red-500 rounded-xl px-4 py-3 hover:bg-red-500 hover:text-[var(--bg)] transition-colors shadow-sm">
                Purge PII Data (>90 Days)
              </button>
            </div>
          </div>

          <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--fg)]/10 shadow-sm p-8">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--fg)]/10">
              <h3 className="text-lg font-medium">System Status</h3>
            </div>
            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center p-2 rounded-lg hover:bg-[var(--fg)]/5 transition-colors">
                 <span className="opacity-70 font-medium">Core API</span>
                 <span className="text-green-500 font-medium flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span>Operational</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg hover:bg-[var(--fg)]/5 transition-colors">
                 <span className="opacity-70 font-medium">AI Engine</span>
                 <span className="text-green-500 font-medium flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span>Operational</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg hover:bg-[var(--fg)]/5 transition-colors">
                 <span className="opacity-70 font-medium">WhatsApp Bot</span>
                 <span className="text-green-500 font-medium flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500"></span>Operational</span>
              </div>
              <div className="flex justify-between items-center pt-4 mt-2 border-t border-[var(--fg)]/10">
                 <span className="opacity-70 font-medium">Version</span>
                 <span className="font-mono bg-[var(--fg)]/5 px-2 py-1 rounded">v2.1.0-prod</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Settings;
