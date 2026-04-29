import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import Overview from './dashboard/Overview';
import OrderManagement from './dashboard/OrderManagement';
import Routing from './dashboard/Routing';
import Batching from './dashboard/Batching';
import Intelligence from './dashboard/Intelligence';
import Analytics from './dashboard/Analytics';
import Fleet from './dashboard/Fleet';
import CourierPortal from './dashboard/CourierPortal';
import Settings from './dashboard/Settings';
import Returns from './dashboard/Returns';
import Team from './dashboard/Team';

const STORAGE_KEY = 'rr-theme';
const SIDEBAR_W = 220;

const navTabs = [
  { id: 'Dashboard',      icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { id: 'Orders',         icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
  { id: 'Routes',         icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
  { id: 'Batching',       icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { id: 'Delays & Risks', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z' },
  { id: 'Costs',          icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { id: 'Analytics',      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { id: 'Returns',        icon: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6' },
];
const bottomTabs = [
  { id: 'Team',     icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  { id: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

const renderPage = (tab, theme) => {
  switch (tab) {
    case 'Dashboard':      return <Overview theme={theme} />;
    case 'Orders':         return <OrderManagement />;
    case 'Routes':         return <Routing />;
    case 'Delays & Risks': return <Intelligence />;
    case 'Analytics':      return <Analytics />;
    case 'Batching':       return <Batching />;
    case 'Costs':          return <CourierPortal />;
    case 'Returns':        return <Returns />;
    case 'Team':           return <Team />;
    case 'Settings':       return <Settings />;
    default:               return <Overview theme={theme} />;
  }
};

const NavBtn = ({ tab, active, onClick }) => (
  <button
    onClick={() => onClick(tab.id)}
    style={{
      display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px',
      borderRadius: '8px', width: '100%', fontSize: '13px',
      fontWeight: active ? '600' : '400',
      color: active ? '#ffffff' : 'rgba(255,255,255,0.5)',
      background: active ? 'rgba(255,255,255,0.09)' : 'transparent',
      border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
    }}
    onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}}
    onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'transparent'; }}}
  >
    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={tab.icon} />
    </svg>
    {tab.id}
  </button>
);

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEY) || 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark',  theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <>
      <style>{`
        /* Hide scrollbar bars everywhere — keeps scroll functional */
        *::-webkit-scrollbar { width: 0 !important; height: 0 !important; }
        * { scrollbar-width: none !important; }

        /* Page background driven by theme */
        body { background: var(--dashboard-bg) !important; margin: 0; }

        /* Independently scrollable inner container (e.g. copilot messages) */
        .dash-scroll {
          overflow-y: auto !important;
          overscroll-behavior: contain !important;
        }

        /* Fixed sidebar */
        #rr-sidebar {
          position: fixed; top: 0; left: 0; bottom: 0;
          width: ${SIDEBAR_W}px; z-index: 100;
          background: #111113;
          border-right: 1px solid rgba(255,255,255,0.06);
          display: flex; flex-direction: column;
          font-family: 'Poppins', sans-serif;
        }
        #rr-sidebar nav { flex: 1; overflow-y: auto; padding: 10px; }

        /* Fixed header */
        #rr-header {
          position: fixed; top: 0; left: ${SIDEBAR_W}px; right: 0; z-index: 99;
          height: 52px;
          background: #111113;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 24px;
          font-family: 'Poppins', sans-serif;
        }

        /* Content wrapper — natural page scroll, NO overflow:hidden */
        #rr-content {
          margin-left: ${SIDEBAR_W}px;
          min-height: 100vh;
          background: var(--dashboard-bg);
          transition: background 0.3s;
        }

        /* Page padding — account for fixed header height */
        #rr-page { padding: 80px 28px 60px; }
      `}</style>

      {/* ── FIXED SIDEBAR ── */}
      <aside id="rr-sidebar">
        {/* Logo */}
        <div style={{ padding: '18px 16px 14px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '13px', flexShrink: 0 }}>R</div>
          <span style={{ fontWeight: '700', fontSize: '13px', color: '#fff' }}>RapidRoute</span>
        </div>

        <nav>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {navTabs.map(t => <NavBtn key={t.id} tab={t} active={activeTab === t.id} onClick={setActiveTab} />)}
          </div>
        </nav>

        <div style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {bottomTabs.map(t => <NavBtn key={t.id} tab={t} active={activeTab === t.id} onClick={setActiveTab} />)}
        </div>
      </aside>

      {/* ── CONTENT (naturally scrollable) ── */}
      <div id="rr-content">

        {/* Sticky header */}
        <header id="rr-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#fff' }}>
            <span style={{ opacity: 0.35 }}>RapidRoute</span>
            <span style={{ opacity: 0.2 }}>/</span>
            <span style={{ fontWeight: '600', opacity: 0.8 }}>{activeTab}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <svg width="12" height="12" fill="none" stroke="#fff" viewBox="0 0 24 24" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.35, pointerEvents: 'none' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="Search…" style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', padding: '5px 12px 5px 28px', fontSize: '11px', color: '#fff', outline: 'none', width: '140px' }} />
            </div>

            {/* Theme toggle */}
            <button onClick={toggle} style={{ width: '30px', height: '30px', borderRadius: '7px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              {theme === 'dark'
                ? <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                : <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              }
            </button>

            {/* Bell */}
            <button style={{ width: '30px', height: '30px', borderRadius: '7px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
              <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
              <span style={{ position: 'absolute', top: '5px', right: '5px', width: '5px', height: '5px', borderRadius: '50%', background: '#ef4444' }} />
            </button>

            {/* Avatar */}
            <div style={{ width: '30px', height: '30px', borderRadius: '7px', background: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', cursor: 'pointer' }}>ST</div>
          </div>
        </header>

        {/* Page */}
        <div id="rr-page">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}>
              {renderPage(activeTab, theme)}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </>
  );
}
