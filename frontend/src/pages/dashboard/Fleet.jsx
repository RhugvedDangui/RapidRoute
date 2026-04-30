import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const vehicleIcon = t => ({ bike: '🏍️', van: '🚐', truck: '🚛' }[t] || '🚗');

const Fleet = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null); // ID of vehicle currently being toggled
  
  // Modal State
  const [editModal, setEditModal] = useState(null);
  const [formData, setFormData] = useState({ name: '', plate: '', type: 'van', capacity_kg: 10, cost_per_km: 15, active: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchVehicles();
    
    const sub = supabase.channel('fleet_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vehicles' }, () => fetchVehicles())
      .subscribe();
      
    return () => supabase.removeChannel(sub);
  }, []);

  const fetchVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('type', { ascending: true })
        .order('capacity_kg', { ascending: true });
        
      if (error) throw error;
      setVehicles(data || []);
    } catch (err) {
      console.error('Error fetching vehicles:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id, currentStatus) => {
    setToggling(id);
    try {
      const res = await fetch(`http://localhost:3000/api/vehicles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentStatus })
      });
      if (!res.ok) throw new Error('Toggle failed');
      
      // Update local state instantly for snappy UI
      setVehicles(prev => prev.map(v => v.id === id ? { ...v, active: !currentStatus } : v));
    } catch (err) {
      alert(`Error updating vehicle: ${err.message}`);
    } finally {
      setToggling(null);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isNew = !editModal.id;
      const url = isNew ? `http://localhost:3000/api/vehicles` : `http://localhost:3000/api/vehicles/${editModal.id}`;
      const method = isNew ? 'POST' : 'PATCH';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error('Save failed');
      
      setEditModal(null);
      fetchVehicles();
    } catch (err) {
      alert(`Error saving vehicle: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const openModal = (vehicle = null) => {
    if (vehicle) {
      setFormData({ 
        name: vehicle.name, plate: vehicle.plate, type: vehicle.type, 
        capacity_kg: vehicle.capacity_kg, cost_per_km: vehicle.cost_per_km, active: vehicle.active 
      });
      setEditModal(vehicle);
    } else {
      setFormData({ name: '', plate: '', type: 'van', capacity_kg: 10, cost_per_km: 15, active: true });
      setEditModal({});
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-[var(--fg)] font-['Poppins',sans-serif]">
      
      {/* Header Section */}
      <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--fg)]/10 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold mb-1">Fleet Management</h1>
            <p className="text-[10px] opacity-50 uppercase tracking-widest">
              Vehicle Availability & Constraints Settings
            </p>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-[10px] font-medium opacity-60 uppercase tracking-widest">
                {vehicles.filter(v => v.active).length} / {vehicles.length} Active
             </div>
             <button 
               onClick={() => openModal()}
               className="border border-[var(--fg)]/20 rounded-xl px-5 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-colors"
             >
               + Add Vehicle
             </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Vehicles List */}
        <div className="lg:col-span-2 bg-[var(--card-bg)] rounded-3xl border border-[var(--fg)]/10 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--fg)]/10">
            <h3 className="text-lg font-medium">Available Vehicles</h3>
            <div className="bg-[var(--fg)]/5 rounded-xl p-2 border border-[var(--fg)]/10">
              <svg className="w-6 h-6 text-[var(--fg)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              <div className="text-center opacity-40 text-xs py-10 uppercase tracking-widest">Loading fleet data...</div>
            ) : vehicles.length === 0 ? (
              <div className="text-center opacity-40 text-xs py-10 uppercase tracking-widest">No vehicles found.</div>
            ) : (
              vehicles.map(vehicle => (
                <div key={vehicle.id} className="p-5 rounded-2xl border border-[var(--fg)]/10 hover:shadow-md transition-shadow bg-[var(--fg)]/5 flex items-center justify-between">
                   <div className="flex items-center gap-5">
                     <div className="w-14 h-14 rounded-full bg-[var(--card-bg)] flex items-center justify-center text-2xl border border-[var(--fg)]/20 shadow-sm">
                       {vehicleIcon(vehicle.type)}
                     </div>
                     <div>
                       <h4 className="font-bold text-sm">{vehicle.name}</h4>
                       <div className="flex items-center gap-3 mt-2">
                         <span className="text-[10px] uppercase tracking-widest opacity-70 bg-[var(--fg)]/10 px-2 py-0.5 rounded-md">
                           {vehicle.plate}
                         </span>
                         <span className="text-[10px] uppercase tracking-widest opacity-60">
                           {vehicle.capacity_kg} kg Capacity
                         </span>
                         <span className="text-[10px] uppercase tracking-widest opacity-60">
                           ₹{vehicle.cost_per_km}/km
                         </span>
                       </div>
                     </div>
                   </div>
                   
                   <div className="flex flex-col items-end gap-3">
                     <div className="flex items-center gap-2">
                       <button onClick={() => openModal(vehicle)} className="text-[10px] font-bold uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity">Edit</button>
                       <div className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${vehicle.active ? 'text-green-500 bg-green-500/10 border border-green-500/20' : 'text-red-500 bg-red-500/10 border border-red-500/20'}`}>
                         {vehicle.active ? 'Available' : 'Inactive'}
                       </div>
                     </div>
                     
                     <button
                       onClick={() => handleToggle(vehicle.id, vehicle.active)}
                       disabled={toggling === vehicle.id}
                       className={`text-[9px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${
                         vehicle.active 
                           ? 'border border-[var(--fg)]/20 text-[var(--fg)] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30' 
                           : 'bg-[var(--fg)] text-[var(--bg)] hover:opacity-80'
                       }`}
                     >
                       {toggling === vehicle.id ? 'Updating...' : vehicle.active ? 'Mark Inactive' : 'Mark Available'}
                     </button>
                   </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--fg)]/10 shadow-sm p-8 flex flex-col h-fit">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--fg)]/10">
            <h3 className="text-lg font-medium">Batching Rules</h3>
          </div>
          
          <div className="space-y-6 text-xs opacity-80 leading-relaxed">
            <p>
              <strong>1. Availability Check:</strong> The python batching pipeline only reads vehicles that are marked as <strong>Available</strong>.
            </p>
            <p>
              <strong>2. Capacity Constraints:</strong> The pipeline groups orders to strictly fit inside the maximum capacity of the chosen vehicle type.
            </p>
            <p>
              <strong>3. Cost Optimization:</strong> When multiple vehicles are available, the algorithm attempts to assign the cheapest vehicle per km that can fit the geographic cluster.
            </p>
            
            <div className="p-4 mt-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded-xl">
              <p className="font-bold mb-1 uppercase text-[10px] tracking-widest">Note on Changes</p>
              <p>Toggling a vehicle to inactive will NOT delete its currently assigned batches. It only prevents it from receiving new batches during the next pipeline run.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Add / Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <form onSubmit={handleSave} className="bg-[var(--card-bg)] border border-[var(--fg)]/10 rounded-3xl shadow-2xl w-full max-w-md p-8">
            <h3 className="text-xl font-bold mb-6">{editModal.id ? 'Edit Vehicle' : 'Add Vehicle'}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2">Vehicle Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[var(--dashboard-bg)] border border-[var(--fg)]/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--fg)]" placeholder="e.g. TRUCK-02" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2">License Plate</label>
                  <input required type="text" value={formData.plate} onChange={e => setFormData({...formData, plate: e.target.value})} className="w-full bg-[var(--dashboard-bg)] border border-[var(--fg)]/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--fg)]" placeholder="e.g. GA-03-A-1234" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2">Type</label>
                  <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-[var(--dashboard-bg)] border border-[var(--fg)]/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--fg)]">
                    <option value="bike">Bike 🏍️</option>
                    <option value="van">Van 🚐</option>
                    <option value="truck">Truck 🚛</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2">Capacity (KG)</label>
                  <input required type="number" min="1" value={formData.capacity_kg} onChange={e => setFormData({...formData, capacity_kg: Number(e.target.value)})} className="w-full bg-[var(--dashboard-bg)] border border-[var(--fg)]/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--fg)]" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2">Cost per KM (₹)</label>
                  <input required type="number" step="0.1" min="0" value={formData.cost_per_km} onChange={e => setFormData({...formData, cost_per_km: Number(e.target.value)})} className="w-full bg-[var(--dashboard-bg)] border border-[var(--fg)]/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--fg)]" />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button type="button" onClick={() => setEditModal(null)} className="flex-1 border border-[var(--fg)]/20 rounded-xl py-3 text-xs font-bold uppercase tracking-widest hover:bg-[var(--fg)]/5 transition-colors">Cancel</button>
              <button type="submit" disabled={saving} className="flex-1 bg-[var(--fg)] text-[var(--bg)] rounded-xl py-3 text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default Fleet;
