import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabaseClient';

// ── helpers ──────────────────────────────────────────────────────
const vehicleIcon = t => ({ bike: '🏍️', van: '🚐', truck: '🚛' }[t] || '🚗');
const timeWindowColor = tw => ({
  morning:   { bg: 'rgba(251,191,36,0.12)',  text: '#fbbf24' },
  afternoon: { bg: 'rgba(99,102,241,0.12)',  text: '#818cf8' },
  evening:   { bg: 'rgba(244,114,182,0.12)', text: '#f472b6' },
  other:     { bg: 'rgba(156,163,175,0.1)',  text: '#9ca3af' },
}[tw] || { bg: 'rgba(156,163,175,0.1)', text: '#9ca3af' });

const fmt = (n, d = 1) => (n ?? 0).toFixed(d);

// ── stat card ─────────────────────────────────────────────────────
const Stat = ({ label, value, sub, accent }) => (
  <div style={{
    background: 'var(--card-bg)', border: '1px solid var(--border-color)',
    borderRadius: '16px', padding: '18px 20px',
  }}>
    <div style={{ fontSize: '10px', opacity: 0.45, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>{label}</div>
    <div style={{ fontSize: '26px', fontWeight: '800', color: accent || 'var(--fg)', lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: '10px', opacity: 0.45, marginTop: '6px' }}>{sub}</div>}
  </div>
);

// ── badge ─────────────────────────────────────────────────────────
const Badge = ({ children, bg, color }) => (
  <span style={{
    background: bg, color, borderRadius: '999px',
    padding: '2px 10px', fontSize: '9px', fontWeight: '600',
    textTransform: 'uppercase', letterSpacing: '0.06em',
  }}>{children}</span>
);

// ── order row inside expanded batch ──────────────────────────────
const OrderRow = ({ order }) => {
  const { bg, text } = timeWindowColor(order.time_window);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px', borderRadius: '10px',
      background: 'var(--dashboard-bg)', marginBottom: '6px',
      fontSize: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontWeight: '700', opacity: 0.5, fontSize: '10px' }}>#{order.id}</span>
        <span style={{ fontWeight: '600' }}>{order.customer}</span>
        {order.is_return && <Badge bg="rgba(239,68,68,0.15)" color="#f87171">Return</Badge>}
        {order.payment_type === 'cod' && <Badge bg="rgba(251,191,36,0.15)" color="#fbbf24">COD</Badge>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ opacity: 0.5, fontSize: '11px' }}>{order.weight_kg} kg</span>
        <span style={{ opacity: 0.5, fontSize: '11px' }}>₹{order.total}</span>
        <Badge bg={bg} color={text}>{order.time_window}</Badge>
      </div>
    </div>
  );
};

// ── batch card ────────────────────────────────────────────────────
const BatchCard = ({ batch, vehicle, orders, route, index }) => {
  const [open,        setOpen]        = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [dispatched,  setDispatched]  = useState(
    // pre-mark as dispatched if all orders are already out_for_delivery
    orders.length > 0 && orders.every(o => ['dispatched','out_for_delivery','delivered'].includes(o.status))
  );
  const [dispatchMsg, setDispatchMsg] = useState(null);
  const vname   = vehicle ? `${vehicleIcon(vehicle.type)} ${vehicle.name}` : '⚠ Unassigned';
  const stops   = route ? JSON.parse(route.order_sequence || '[]').length : batch.total_orders;
  const routeKm = route ? fmt(route.total_distance) : fmt(batch.estimated_distance);

  const handleDispatch = async () => {
    if (dispatched || dispatching) return;
    setDispatching(true);
    setDispatchMsg(null);
    try {
      const res = await fetch(`http://localhost:3000/batches/${batch.id}/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Dispatch failed');
      setDispatched(true);
      setDispatchMsg(`🚚 ${json.dispatched_orders} orders dispatched!`);
    } catch (e) {
      setDispatchMsg(`❌ ${e.message}`);
    } finally {
      setDispatching(false);
    }
  };

  const codCount  = orders.filter(o => o.payment_type === 'cod').length;
  const retCount  = orders.filter(o => o.is_return).length;
  const totalWt   = orders.reduce((s, o) => s + (o.weight_kg || 1), 0);
  const capPct    = vehicle ? Math.min(100, (totalWt / vehicle.capacity_kg) * 100) : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      style={{
        background: 'var(--card-bg)', border: '1px solid var(--border-color)',
        borderRadius: '20px', overflow: 'hidden',
      }}
    >
      {/* ── header row ── */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* index pill */}
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'var(--fg)', color: 'var(--bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '800', fontSize: '13px', flexShrink: 0,
          }}>{index + 1}</div>

          <div>
            <div style={{ fontWeight: '700', fontSize: '14px' }}>{batch.id}</div>
            <div style={{ fontSize: '10px', opacity: 0.5, marginTop: '3px' }}>
              {batch.total_orders} orders · {stops} stops · {vname}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* key metrics inline */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '16px', fontWeight: '800' }}>{routeKm} km</div>
            <div style={{ fontSize: '10px', opacity: 0.4 }}>{fmt(batch.estimated_time, 0)} min · ₹{fmt(batch.estimated_cost, 0)}</div>
          </div>
          <div style={{ fontSize: '12px', color: '#4ade80', fontWeight: '600' }}>
            🌿 {fmt(batch.carbon_saved, 2)} kg CO₂
          </div>
          {/* chevron */}
          <motion.svg
            animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}
            width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            style={{ opacity: 0.4 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </div>
      </div>

      {/* ── expanded detail ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 24px 24px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>

              {/* vehicle + capacity */}
              {vehicle && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                    <span>Vehicle Capacity Used</span>
                    <span>{fmt(totalWt, 1)} / {vehicle.capacity_kg} kg</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--fg)', opacity: 0.1, borderRadius: '99px', overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${capPct}%` }} transition={{ duration: 0.7 }}
                      style={{ height: '100%', background: capPct > 85 ? '#f87171' : 'var(--fg)', borderRadius: '99px', opacity: 1 }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '10px', opacity: 0.5 }}>{vehicleIcon(vehicle.type)} {vehicle.name} · {vehicle.plate}</span>
                    <span style={{ fontSize: '10px', opacity: 0.5 }}>₹{vehicle.cost_per_km}/km</span>
                    {codCount > 0 && <Badge bg="rgba(251,191,36,0.15)" color="#fbbf24">{codCount} COD</Badge>}
                    {retCount > 0 && <Badge bg="rgba(239,68,68,0.15)" color="#f87171">{retCount} Returns</Badge>}
                  </div>
                </div>
              )}

              {/* orders */}
              <div style={{ fontSize: '10px', opacity: 0.45, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                Stop Sequence
              </div>
              {orders.length === 0
                ? <div style={{ opacity: 0.4, fontSize: '12px' }}>No orders found</div>
                : orders.map((o, i) => <OrderRow key={o.id} order={o} seq={i + 1} />)
              }

              {/* dispatch button */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={handleDispatch}
                  disabled={dispatching || dispatched}
                  style={{
                    background: dispatched ? 'rgba(74,222,128,0.15)' : 'var(--fg)',
                    color: dispatched ? '#4ade80' : 'var(--bg)',
                    border: dispatched ? '1px solid #4ade80' : 'none',
                    borderRadius: '10px', padding: '10px 20px', fontSize: '11px',
                    fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em',
                    cursor: dispatching || dispatched ? 'default' : 'pointer',
                    opacity: dispatching ? 0.6 : 1, transition: 'all 0.2s',
                  }}
                >
                  {dispatching ? 'Dispatching...' : dispatched ? '✓ Dispatched' : 'Approve & Dispatch'}
                </button>
                <button style={{
                  background: 'transparent', color: 'var(--fg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px', padding: '10px 20px', fontSize: '11px',
                  fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em',
                  cursor: 'pointer',
                }}>View Route</button>
                {dispatchMsg && (
                  <span style={{ fontSize: '11px', opacity: 0.7 }}>{dispatchMsg}</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};


// ══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════
export default function Batching() {
  const [batches,  setBatches]  = useState([]);
  const [vehicles, setVehicles] = useState({});
  const [orders,   setOrders]   = useState({});
  const [routes,   setRoutes]   = useState({});
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [filter,   setFilter]   = useState('all');

  useEffect(() => {
    fetchAll();
    const sub = supabase.channel('batching_page')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'batches' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders'  }, fetchAll)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  const fetchAll = async () => {
    try {
      const [bRes, vRes, oRes, rRes] = await Promise.all([
        supabase.from('batches').select('*').order('created_at', { ascending: false }),
        supabase.from('vehicles').select('*'),
        supabase.from('orders').select('*').not('batch_id', 'is', null),
        supabase.from('routes').select('*'),
      ]);

      // Surface any RLS / network errors
      const errs = [bRes, vRes, oRes, rRes].map(r => r.error).filter(Boolean);
      if (errs.length) {
        const msg = errs.map(e => e.message).join('; ');
        console.error('Supabase fetch errors:', msg);
        setError(msg);
        return;
      }

      console.log('batches:', bRes.data?.length, 'vehicles:', vRes.data?.length,
                  'orders:', oRes.data?.length, 'routes:', rRes.data?.length);

      const vMap = {};
      (vRes.data || []).forEach(v => { vMap[v.id] = v; });

      const oMap = {};
      (oRes.data || []).forEach(o => {
        if (!oMap[o.batch_id]) oMap[o.batch_id] = [];
        oMap[o.batch_id].push(o);
      });

      const rMap = {};
      (rRes.data || []).forEach(r => { rMap[r.batch_id] = r; });

      setBatches(bRes.data || []);
      setVehicles(vMap);
      setOrders(oMap);
      setRoutes(rMap);
      setError(null);
    } catch (e) {
      console.error('Batching fetch error:', e.message);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── summary stats ──────────────────────────────────────────────
  const totalOrders   = batches.reduce((s, b) => s + (b.total_orders || 0), 0);
  const totalKm       = batches.reduce((s, b) => s + (b.estimated_distance || 0), 0);
  const totalCost     = batches.reduce((s, b) => s + (b.estimated_cost || 0), 0);
  const totalCarbon   = batches.reduce((s, b) => s + (b.carbon_saved || 0), 0);

  // ── filter by time window of batch's orders ────────────────────
  const visibleBatches = filter === 'all' ? batches : batches.filter(b => {
    const bOrders = orders[b.id] || [];
    return bOrders.some(o => o.time_window === filter);
  });

  const timeFilters = ['all', 'morning', 'afternoon', 'evening'];
  const { bg: mBg, text: mT } = timeWindowColor('morning');
  const { bg: aBg, text: aT } = timeWindowColor('afternoon');
  const { bg: eBg, text: eT } = timeWindowColor('evening');
  const filterColors = { all: { bg: 'var(--fg)', text: 'var(--bg)' }, morning: { bg: mBg, text: mT }, afternoon: { bg: aBg, text: aT }, evening: { bg: eBg, text: eT } };

  return (
    <div style={{ color: 'var(--fg)', fontFamily: "'Poppins', sans-serif" }}>

      {/* ── Header ───────────────────────────────────────────── */}
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--border-color)',
        borderRadius: '20px', padding: '20px 24px', marginBottom: '24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px',
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '17px', fontWeight: '700' }}>Batch Management</h1>
          <p style={{ margin: '4px 0 0', fontSize: '10px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            K-Means Geo-Clustering · Vehicle Capacity Constraints
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {timeFilters.map(f => {
            const active = filter === f;
            const c = filterColors[f];
            return (
              <button key={f} onClick={() => setFilter(f)} style={{
                background: active ? c.bg : 'transparent',
                color: active ? c.text : 'var(--fg)',
                border: `1px solid ${active ? 'transparent' : 'var(--border-color)'}`,
                borderRadius: '999px', padding: '5px 14px', fontSize: '10px',
                fontWeight: '600', textTransform: 'capitalize', cursor: 'pointer',
                opacity: active ? 1 : 0.6, transition: 'all 0.15s',
              }}>{f === 'all' ? 'All Batches' : f}</button>
            );
          })}
        </div>
      </div>

      {/* ── Summary Stats ─────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <Stat label="Total Batches"   value={batches.length}           sub={`${totalOrders} orders`} />
        <Stat label="Total Distance"  value={`${fmt(totalKm)} km`}     sub="After OR-Tools optimisation" />
        <Stat label="Est. Cost"       value={`₹${fmt(totalCost, 0)}`}  sub="Based on vehicle rate/km" />
        <Stat label="CO₂ Saved"       value={`${fmt(totalCarbon, 2)} kg`} sub="vs individual trips" accent="#4ade80" />
      </div>

      {/* ── Batch Cards ───────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: 'center', opacity: 0.4, fontSize: '12px', padding: '60px 0' }}>
          Loading batches...
        </div>
      ) : error ? (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '16px', padding: '24px', color: '#f87171', fontSize: '12px',
        }}>
          <strong>Fetch error (likely RLS):</strong> {error}<br />
          <span style={{ opacity: 0.7, marginTop: '6px', display: 'block' }}>
            Run the RLS policy SQL in your Supabase dashboard to allow anon reads.
          </span>
        </div>
      ) : visibleBatches.length === 0 ? (
        <div style={{ textAlign: 'center', opacity: 0.4, fontSize: '12px', padding: '60px 0' }}>
          No batches found. Run <code>python run_full_pipeline.py</code> to generate batches.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {visibleBatches.map((b, i) => (
            <BatchCard
              key={b.id}
              index={i}
              batch={b}
              vehicle={vehicles[b.vehicle_id] || null}
              orders={orders[b.id] || []}
              route={routes[b.id] || null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
