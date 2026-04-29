import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../supabaseClient';

const vehicleIcon = (type) => {
  if (type === 'bike') return '🏍️';
  if (type === 'van')  return '🚐';
  if (type === 'truck') return '🚛';
  return '🚗';
};

const Routing = () => {
  const [batches, setBatches]   = useState([]);
  const [vehicles, setVehicles] = useState({});   // map: id → vehicle
  const [routes, setRoutes]     = useState({});   // map: batch_id → route
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetchAll();

    const sub = supabase
      .channel('routing_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'batches' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'routes' },  fetchAll)
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, []);

  const fetchAll = async () => {
    try {
      // Fetch batches
      const { data: batchData, error: bErr } = await supabase
        .from('batches')
        .select('*')
        .order('created_at', { ascending: false });
      if (bErr) throw bErr;

      // Fetch vehicles
      const { data: vData, error: vErr } = await supabase
        .from('vehicles')
        .select('*');
      if (vErr) throw vErr;

      // Fetch routes
      const { data: rData, error: rErr } = await supabase
        .from('routes')
        .select('*');
      if (rErr) throw rErr;

      // Build lookup maps
      const vMap = {};
      (vData || []).forEach(v => { vMap[v.id] = v; });

      const rMap = {};
      (rData || []).forEach(r => { rMap[r.batch_id] = r; });

      setBatches(batchData || []);
      setVehicles(vMap);
      setRoutes(rMap);
    } catch (err) {
      console.error('Error fetching routing data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">

      {/* Header */}
      <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--fg)]/10 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium mb-2">Routing & Batching</h1>
            <p className="text-xs opacity-70 uppercase tracking-widest">
              Capacity-Constrained • 2-Opt Optimised • Geo-Clustered
            </p>
          </div>
          <button className="text-[10px] rounded-xl shadow-sm uppercase tracking-widest bg-[var(--fg)] text-[var(--bg)] px-6 py-3 hover:opacity-80 transition-opacity font-medium">
            Optimize Day
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Batches List ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="text-center opacity-50 text-[10px] uppercase tracking-widest py-8">
              Loading batches...
            </div>
          ) : batches.length === 0 ? (
            <div className="text-center opacity-50 text-[10px] uppercase tracking-widest py-8">
              No batches found. Run the batching pipeline to generate batches.
            </div>
          ) : (
            batches.map(batch => {
              const vehicle = vehicles[batch.vehicle_id] || null;
              const route   = routes[batch.id]           || null;
              const stops   = route ? JSON.parse(route.order_sequence || '[]').length : batch.total_orders;

              return (
                <div
                  key={batch.id}
                  className="bg-[var(--card-bg)] rounded-3xl border border-[var(--fg)]/10 shadow-sm p-8 hover:shadow-md transition-all"
                >
                  {/* Batch header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="bg-[var(--fg)]/10 rounded-2xl text-[var(--fg)] p-4">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-medium">{batch.id}</h4>
                        <p className="text-[10px] uppercase tracking-widest opacity-70 mt-1">
                          {batch.total_orders} Orders • {stops} Stops • 2-Opt Optimised
                        </p>
                      </div>
                    </div>

                    {/* Vehicle chip */}
                    {vehicle ? (
                      <div className="flex items-center gap-2 text-[10px] font-medium uppercase bg-[var(--fg)]/5 rounded-full px-4 py-2 border border-[var(--fg)]/10">
                        <span>{vehicleIcon(vehicle.type)}</span>
                        <span>{vehicle.name}</span>
                        <span className="opacity-50">· {vehicle.capacity_kg} kg</span>
                      </div>
                    ) : (
                      <div className="text-[10px] font-medium uppercase bg-yellow-500/10 text-yellow-500 rounded-full px-4 py-2">
                        Unassigned
                      </div>
                    )}
                  </div>

                  {/* Metrics grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-y border-[var(--fg)]/10 py-6 mb-6 text-xs">
                    <div>
                      <span className="opacity-50 block mb-1 uppercase text-[9px] tracking-widest">Distance</span>
                      <span className="font-medium text-base">{batch.estimated_distance?.toFixed(1)} km</span>
                    </div>
                    <div>
                      <span className="opacity-50 block mb-1 uppercase text-[9px] tracking-widest">Est. Time</span>
                      <span className="font-medium text-base">{batch.estimated_time} min</span>
                    </div>
                    <div>
                      <span className="opacity-50 block mb-1 uppercase text-[9px] tracking-widest">Cost Est.</span>
                      <span className="font-medium text-base">₹{batch.estimated_cost}</span>
                    </div>
                    <div>
                      <span className="opacity-50 block mb-1 uppercase text-[9px] tracking-widest">CO₂ Saved</span>
                      <span className="font-medium text-base text-green-500">
                        🌿 {batch.carbon_saved?.toFixed(2)} kg
                      </span>
                    </div>
                  </div>

                  {/* Vehicle capacity bar */}
                  {vehicle && (
                    <div className="mb-6">
                      <div className="flex justify-between text-[9px] uppercase tracking-widest opacity-50 mb-1">
                        <span>Capacity Used</span>
                        <span>{vehicle.capacity_kg} kg max</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-[var(--fg)]/10 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-[var(--fg)]"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (batch.total_orders / vehicle.capacity_kg) * 100)}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Route polyline preview (stop count) */}
                  {route && (
                    <div className="mb-6 text-[10px] opacity-60 flex items-center gap-2">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      Route: {stops} stops · {route.total_distance?.toFixed(1)} km total
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 flex-wrap">
                    <button className="text-[10px] font-medium uppercase tracking-widest border border-[var(--fg)]/20 rounded-xl px-6 py-3 hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-colors shadow-sm">
                      Approve & Dispatch
                    </button>
                    {!vehicle && (
                      <button className="text-[10px] font-medium uppercase tracking-widest border border-yellow-500/40 text-yellow-500 rounded-xl px-6 py-3 hover:bg-yellow-500/10 transition-colors">
                        Assign Vehicle
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── Constraints Panel ────────────────────────────── */}
        <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--fg)]/10 shadow-sm p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--fg)]/10">
            <h3 className="text-lg font-medium">Constraints</h3>
            <div className="bg-[var(--fg)]/5 rounded-xl p-2 border border-[var(--fg)]/10">
              <svg className="w-5 h-5 text-[var(--fg)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>

          <div className="space-y-3 text-xs flex-1">
            <label className="flex items-center gap-4 rounded-xl border border-[var(--fg)]/10 p-4 hover:bg-[var(--fg)]/5 cursor-pointer transition-colors shadow-sm">
              <input type="checkbox" defaultChecked className="accent-[var(--fg)] w-4 h-4 rounded" />
              Respect Time Windows
            </label>
            <label className="flex items-center gap-4 rounded-xl border border-[var(--fg)]/10 p-4 hover:bg-[var(--fg)]/5 cursor-pointer transition-colors shadow-sm">
              <input type="checkbox" defaultChecked className="accent-[var(--fg)] w-4 h-4 rounded" />
              Respect Vehicle Capacity
            </label>
            <label className="flex items-center gap-4 rounded-xl border border-[var(--fg)]/10 p-4 hover:bg-[var(--fg)]/5 cursor-pointer transition-colors shadow-sm">
              <input type="checkbox" defaultChecked className="accent-[var(--fg)] w-4 h-4 rounded" />
              Avoid Toll Roads
            </label>
            <label className="flex items-center gap-4 rounded-xl border border-[var(--fg)]/10 p-4 hover:bg-[var(--fg)]/5 cursor-pointer transition-colors shadow-sm">
              <input type="checkbox" defaultChecked className="accent-[var(--fg)] w-4 h-4 rounded" />
              Combine Return Pickups
            </label>
            <label className="flex items-center gap-4 rounded-xl border border-[var(--fg)]/10 p-4 hover:bg-[var(--fg)]/5 cursor-pointer transition-colors shadow-sm">
              <input type="checkbox" className="accent-[var(--fg)] w-4 h-4 rounded" />
              Avoid Highways (2W)
            </label>
          </div>

          {/* Animated route preview */}
          <div className="mt-8 rounded-2xl overflow-hidden border border-[var(--fg)]/10 h-48 relative flex items-center justify-center bg-[var(--fg)]/5 shadow-inner">
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" xmlns="http://www.w3.org/2000/svg">
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, repeat: Infinity, repeatType: 'loop', ease: 'linear' }}
                d="M 30 120 L 80 60 L 140 90 L 200 40 L 250 100"
                stroke="var(--fg)" strokeWidth="2" fill="none" strokeDasharray="6 6"
              />
            </svg>
            <div className="text-[10px] font-medium uppercase tracking-widest bg-[var(--card-bg)]/90 backdrop-blur-md rounded-full shadow-sm px-4 py-2 relative z-20">
              Live Map Feed
            </div>
          </div>

          {/* Fleet summary */}
          {Object.values(vehicles).length > 0 && (
            <div className="mt-6 pt-6 border-t border-[var(--fg)]/10">
              <p className="text-[9px] uppercase tracking-widest opacity-50 mb-3">Active Fleet</p>
              <div className="space-y-2">
                {Object.values(vehicles).filter(v => v.active).map(v => (
                  <div key={v.id} className="flex items-center justify-between text-xs rounded-xl border border-[var(--fg)]/10 px-3 py-2">
                    <span>{vehicleIcon(v.type)} {v.name}</span>
                    <span className="opacity-50">{v.capacity_kg} kg · ₹{v.cost_per_km}/km</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Routing;
