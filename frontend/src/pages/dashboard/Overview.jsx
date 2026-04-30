import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../supabaseClient';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function MiniCalendar({ selectedDate, onSelectDate }) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay  = new Date(year, month, 1).getDay();   // 0–6
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();

  // Build 6×7 grid
  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: daysInPrev - firstDay + 1 + i, cur: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, cur: true });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ day: cells.length - firstDay - daysInMonth + 1, cur: false });
  }

  const isToday = (cell) =>
    cell.cur &&
    cell.day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  const prev = () => setViewDate(new Date(year, month - 1, 1));
  const next = () => setViewDate(new Date(year, month + 1, 1));

  return (
    <div style={{ padding: '20px', backgroundColor: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--fg)' }}>{today.getDate()} </span>
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--fg)', opacity: 0.75 }}>
            {DAYS[today.getDay()]}
          </span>
          <div style={{ fontSize: '11px', color: 'var(--fg)', opacity: 0.45, marginTop: '2px' }}>
            {MONTHS[month]} {year}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={prev} style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--dashboard-bg)', color: 'var(--fg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={next} style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--dashboard-bg)', color: 'var(--fg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '8px' }}>
        {DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '9px', fontWeight: '600', color: 'var(--fg)', opacity: 0.35, paddingBottom: '6px', letterSpacing: '0.04em' }}>{d}</div>
        ))}
      </div>

      {/* Date grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', rowGap: '4px' }}>
        {cells.map((cell, i) => {
          const cellDate = cell.cur ? new Date(year, month, cell.day) : null;
          const isSelected = selectedDate && cellDate && 
            selectedDate.getDate() === cellDate.getDate() && 
            selectedDate.getMonth() === cellDate.getMonth() && 
            selectedDate.getFullYear() === cellDate.getFullYear();
          
          return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <button 
              onClick={() => cell.cur && onSelectDate(cellDate)}
              style={{
              width: '26px', height: '26px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '50%',
              fontSize: '11px',
              border: 'none',
              fontWeight: isSelected ? '800' : isToday(cell) ? '800' : '400',
              backgroundColor: isSelected ? 'var(--fg)' : isToday(cell) ? 'var(--fg)' : 'transparent',
              color: isSelected ? 'var(--bg)' : isToday(cell) ? 'var(--bg)' : cell.cur ? 'var(--fg)' : 'var(--fg)',
              opacity: isSelected ? 1 : isToday(cell) ? 0.7 : cell.cur ? 0.75 : 0.25,
              cursor: cell.cur ? 'pointer' : 'default',
              transition: 'all 0.15s',
            }}>
              {cell.day}
            </button>
          </div>
        )})}
      </div>
    </div>
  );
}

const QUICK_ACTIONS = [
  { label: 'Log Activity', path: 'M12 4v16m8-8H4' },
  { label: 'Add Order',    path: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z' },
  { label: 'Optimise',     path: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
  { label: 'Send Report',  path: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
];



const Overview = ({ theme = 'dark' }) => {
  const [allOrders, setAllOrders] = useState([]);
  const [upcomingBatches, setUpcomingBatches] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  const isDark        = theme === 'dark';
  const lineColor     = isDark ? '#ffffff' : '#111113';
  const axisColor     = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
  const fillColor     = isDark ? '#ffffff' : '#111113';
  const tooltipBg     = isDark ? '#1c1c1e' : '#ffffff';
  const tooltipText   = isDark ? '#ffffff' : '#111113';
  const tooltipBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';

  useEffect(() => {
    fetchStats();
    const sub = supabase.channel('overview_stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchStats)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  const fetchStats = async () => {
    const { data: oData } = await supabase.from('orders').select('status, created_at, order_date');
    if (oData) {
      setAllOrders(oData);
    }

    const { data: bData } = await supabase.from('batches').select('*').order('created_at', { ascending: false }).limit(3);
    if (bData) {
      setUpcomingBatches(bData);
    }
  };

  const handleSelectDate = (date) => {
    if (selectedDate && date && selectedDate.getTime() === date.getTime()) {
      setSelectedDate(null); // Toggle off
    } else {
      setSelectedDate(date);
    }
  };

  // Compute filtered stats for KPIs
  const filteredOrders = React.useMemo(() => {
    if (!selectedDate) return allOrders;
    return allOrders.filter(o => {
      const d = new Date(o.order_date || o.created_at);
      return d.getDate() === selectedDate.getDate() && 
             d.getMonth() === selectedDate.getMonth() && 
             d.getFullYear() === selectedDate.getFullYear();
    });
  }, [allOrders, selectedDate]);

  const stats = {
    total: filteredOrders.length,
    pending: filteredOrders.filter(o => o.status === 'pending').length,
    batched: filteredOrders.filter(o => o.status === 'batched' || o.status === 'dispatched').length
  };

  // Compute dynamic chart data (Last 7 Days vs Previous 7 Days)
  const perfData = React.useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    
    let chart = [];
    for(let i=6; i>=0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      
      const prev = new Date(d);
      prev.setDate(prev.getDate() - 7);

      // Count this week
      const thisWeekCount = allOrders.filter(o => {
        const od = new Date(o.order_date || o.created_at);
        return od.getDate() === d.getDate() && od.getMonth() === d.getMonth();
      }).length;

      // Count last week
      const lastWeekCount = allOrders.filter(o => {
        const od = new Date(o.order_date || o.created_at);
        return od.getDate() === prev.getDate() && od.getMonth() === prev.getMonth();
      }).length;

      chart.push({
        name: DAYS[d.getDay()],
        thisWeek: thisWeekCount,
        lastWeek: lastWeekCount
      });
    }
    return chart;
  }, [allOrders]);

  return (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', color: 'var(--fg)' }}>

      {/* ── LEFT COLUMN ── */}
      <div style={{ flex: '1 1 420px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Quick Actions */}
        <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', opacity: 0.5, marginBottom: '16px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Quick Actions</div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {QUICK_ACTIONS.map(a => (
              <button key={a.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg)' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--dashboard-bg)' }}>
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={a.path} /></svg>
                </div>
                <span style={{ fontSize: '10px', opacity: 0.6, whiteSpace: 'nowrap' }}>{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[
            { value: stats.total.toString(), label: 'Total Orders' },
            { value: stats.pending.toString(), label: 'Pending Dispatch' },
            { value: stats.batched.toString(), label: 'Batched Routes' },
          ].map(k => (
            <div key={k.label} style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '20px 18px' }}>
              <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--fg)', lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: '11px', color: 'var(--fg)', opacity: 0.5, marginTop: '6px' }}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Performance Chart */}
        <div style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--fg)' }}>Performance</div>
              <div style={{ fontSize: '11px', color: 'var(--fg)', opacity: 0.45, marginTop: '3px' }}>This week vs last week</div>
            </div>
            <div style={{ display: 'flex', gap: '14px', fontSize: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--fg)', opacity: 0.8 }}>
                <span style={{ display: 'inline-block', width: '20px', height: '2px', borderRadius: '1px', backgroundColor: lineColor }} />
                This week
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--fg)', opacity: 0.4 }}>
                <span style={{ display: 'inline-block', width: '20px', height: '2px', borderRadius: '1px', backgroundColor: lineColor, opacity: 0.4 }} />
                Last week
              </div>
            </div>
          </div>
          <div style={{ height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={perfData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={fillColor} stopOpacity={isDark ? 0.28 : 0.12} />
                    <stop offset="100%" stopColor={fillColor} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={fillColor} stopOpacity={isDark ? 0.08 : 0.04} />
                    <stop offset="100%" stopColor={fillColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="transparent" tick={{ fill: axisColor, fontSize: 10 }} tickLine={false} axisLine={false} dy={8} />
                <YAxis stroke="transparent" tick={{ fill: axisColor, fontSize: 10 }} tickLine={false} axisLine={false} tickCount={4} dx={-4} />
                <Tooltip
                  contentStyle={{ background: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: '10px', fontSize: '12px', color: tooltipText, padding: '8px 14px' }}
                  itemStyle={{ color: tooltipText }}
                  labelStyle={{ color: tooltipText, opacity: 0.6, fontSize: '11px' }}
                  cursor={{ stroke: axisColor, strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area type="monotone" dataKey="thisWeek" name="This Week" stroke={lineColor} strokeWidth={2} fillOpacity={1} fill="url(#gA)" dot={false} activeDot={{ r: 4, fill: lineColor }} />
                <Area type="monotone" dataKey="lastWeek" name="Last Week" stroke={lineColor} strokeWidth={1.5} strokeOpacity={0.3} fillOpacity={1} fill="url(#gB)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ── RIGHT COLUMN ── */}
      <div style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Real Calendar */}
        <MiniCalendar selectedDate={selectedDate} onSelectDate={handleSelectDate} />

        {/* Upcoming Events */}
        <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: '600', opacity: 0.5, marginBottom: '16px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Upcoming Dispatches</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {upcomingBatches.length === 0 ? (
              <div style={{ fontSize: '11px', opacity: 0.5, textAlign: 'center', padding: '20px 0' }}>No active batches today.</div>
            ) : upcomingBatches.map((b, i) => {
              const bTime = new Date(b.created_at);
              // Calculate dispatch time roughly 30 mins after batch creation
              bTime.setMinutes(bTime.getMinutes() + 30);
              const timeString = bTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              
              return (
              <div key={b.id} style={{ display: 'flex', gap: '12px', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', backgroundColor: 'var(--dashboard-bg)', cursor: 'pointer' }}>
                <div style={{ width: '3px', borderRadius: '2px', backgroundColor: 'var(--fg)', opacity: 0.3, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--fg)', marginBottom: '2px' }}>Dispatch {b.id.substring(0, 8)}</div>
                  <div style={{ fontSize: '10px', color: 'var(--fg)', opacity: 0.45, marginBottom: '10px' }}>{b.total_orders} Orders • {parseFloat(b.estimated_distance).toFixed(1)} km</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex' }}>
                      {Array.from({ length: Math.min(b.total_orders, 4) }).map((_, j) => (
                        <div key={j} style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--fg)', opacity: 0.15 + j * 0.08, border: '2px solid var(--card-bg)', marginLeft: j > 0 ? '-6px' : '0' }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--fg)', opacity: 0.5 }}>{timeString}</span>
                  </div>
                </div>
              </div>
            )})}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Overview;
