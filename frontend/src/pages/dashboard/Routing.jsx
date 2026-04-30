import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../supabaseClient';
import { MapContainer, TileLayer, Polyline, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

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
  const [ordersMap, setOrdersMap]= useState({});  // map: order_id → order
  const [loading, setLoading]   = useState(true);
  const [selectedBatchId, setSelectedBatchId] = useState(null);

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

      // Fetch orders (to show customer details on map)
      const { data: oData, error: oErr } = await supabase
        .from('orders')
        .select('*')
        .not('batch_id', 'is', null);
      if (oErr) throw oErr;

      // Build lookup maps
      const vMap = {};
      (vData || []).forEach(v => { vMap[v.id] = v; });

      const rMap = {};
      (rData || []).forEach(r => { rMap[r.batch_id] = r; });

      const oMap = {};
      (oData || []).forEach(o => { oMap[o.id] = o; });

      setBatches(batchData || []);
      setVehicles(vMap);
      setRoutes(rMap);
      setOrdersMap(oMap);
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

      <div className="grid grid-cols-1 gap-8">

        {/* ── Batches List ─────────────────────────────────── */}
        <div className="space-y-6">
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
                    <button 
                      onClick={() => setSelectedBatchId(selectedBatchId === batch.id ? null : batch.id)}
                      className={`text-[10px] font-medium uppercase tracking-widest border rounded-xl px-6 py-3 transition-colors ${
                        selectedBatchId === batch.id 
                          ? 'bg-[var(--fg)] text-[var(--bg)] border-[var(--fg)]'
                          : 'border-[var(--fg)]/20 text-[var(--fg)] hover:bg-[var(--fg)]/10'
                      }`}
                    >
                      {selectedBatchId === batch.id ? 'Hide Route' : 'View on Map'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* Map Modal Overlay */}
      {selectedBatchId && (
        <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-sm animate-fade-in" style={{ zIndex: 9999 }}>
          <div className="bg-[var(--card-bg)] border border-[var(--fg)]/10 rounded-3xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden relative">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--fg)]/10">
              <div>
                <h3 className="text-xl font-bold">Route Map: {selectedBatchId}</h3>
                <p className="text-[10px] uppercase tracking-widest opacity-60 mt-1">Interactive OpenStreetMap Feed</p>
              </div>
              <div className="flex items-center gap-4">
                {(() => {
                  const route = routes[selectedBatchId];
                  if (!route) return null;
                  const orderSeq = typeof route.order_sequence === 'string' ? JSON.parse(route.order_sequence) : (route.order_sequence || []);
                  const polyCoords = typeof route.polyline === 'string' ? JSON.parse(route.polyline) : (route.polyline || []);
                  
                  const latlngs = polyCoords.map(p => [p.lat, p.lng]);
                  const waypoints = [];
                  orderSeq.forEach(orderId => {
                    const order = ordersMap[orderId];
                    if (order && order.lat && order.lng) waypoints.push(`${order.lat},${order.lng}`);
                  });
                  
                  if (waypoints.length > 0) {
                    const hub = [15.3533, 73.9575];
                    const gmapUrl = `https://www.google.com/maps/dir/?api=1&origin=${hub[0]},${hub[1]}&destination=${hub[0]},${hub[1]}&waypoints=${waypoints.join('|')}&travelmode=driving`;
                    return (
                      <a href={gmapUrl} target="_blank" rel="noopener noreferrer" 
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors shadow-md">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
                        Open in Google Maps
                      </a>
                    );
                  }
                  return null;
                })()}
                
                <button 
                  onClick={() => setSelectedBatchId(null)}
                  className="w-10 h-10 rounded-full bg-[var(--fg)]/5 hover:bg-[var(--fg)]/10 flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative z-0">
              <MapContainer center={[15.3533, 73.9575]} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  attribution='&copy; OSM'
                />
                {(() => {
                  const batch = batches.find(b => b.id === selectedBatchId);
                  const route = routes[selectedBatchId];
                  if (!batch || !route) return null;
                  
                  try {
                    const orderSeq = typeof route.order_sequence === 'string' ? JSON.parse(route.order_sequence) : (route.order_sequence || []);
                    let polyCoords = typeof route.polyline === 'string' ? JSON.parse(route.polyline) : (route.polyline || []);
                    
                    let latlngs = polyCoords.map(p => [p.lat, p.lng]);
                    
                    // Fallback: If polyline is missing, build it from ordersMap
                    if (latlngs.length < 2) {
                      const hub = [15.3533, 73.9575];
                      latlngs = [hub];
                      orderSeq.forEach(orderId => {
                        const order = ordersMap[orderId];
                        if (order && order.lat && order.lng) latlngs.push([order.lat, order.lng]);
                      });
                      latlngs.push(hub);
                    }
                    
                    if (latlngs.length < 2) return null;

                    return (
                      <React.Fragment>
                        <Polyline positions={latlngs} color="#3b82f6" weight={5} opacity={0.8} />
                        {latlngs.map((coord, idx) => {
                          const isHub = idx === 0 || idx === latlngs.length - 1;
                          const orderId = !isHub ? orderSeq[idx - 1] : null;
                          const order = orderId ? ordersMap[orderId] : null;

                          return (
                            <CircleMarker 
                              key={idx} center={coord} radius={isHub ? 8 : 6} 
                              fillColor={isHub ? '#000' : '#3b82f6'} color="#fff" weight={2} fillOpacity={1}
                            >
                              <Tooltip permanent direction="top">
                                <div className="text-xs font-['Poppins'] text-gray-800">
                                  {isHub ? (
                                    <strong>{idx === 0 ? '🏭 Warehouse Hub (Start)' : '🏭 Warehouse Hub (End)'}</strong>
                                  ) : (
                                    <>
                                      <strong>Stop {idx}</strong><br/>
                                      {order && <><span className="opacity-70">Order:</span> #{orderId}<br/>{order.customer}</>}
                                    </>
                                  )}
                                </div>
                              </Tooltip>
                            </CircleMarker>
                          );
                        })}
                      </React.Fragment>
                    );
                  } catch (e) {
                    console.error("Error drawing map", e);
                    return null;
                  }
                })()}
              </MapContainer>
            </div>
            
          </div>
        </div>
      )}
      
    </div>
  );
};

export default Routing;
