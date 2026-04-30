import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const Team = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);
  
  // Modal State
  const [editModal, setEditModal] = useState(null); // null = closed, {} = add new, {id...} = edit
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', status: 'available' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDrivers();
    
    const sub = supabase.channel('drivers_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, () => fetchDrivers())
      .subscribe();
      
    return () => supabase.removeChannel(sub);
  }, []);

  const fetchDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('name', { ascending: true });
        
      if (error) throw error;
      setDrivers(data || []);
    } catch (err) {
      console.error('Error fetching drivers:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id, currentStatus) => {
    setToggling(id);
    const newStatus = currentStatus === 'available' ? 'unavailable' : 'available';
    try {
      const res = await fetch(`http://localhost:3000/api/drivers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Toggle failed');
      
      // Update local state instantly for snappy UI
      setDrivers(prev => prev.map(d => d.id === id ? { ...d, status: newStatus } : d));
    } catch (err) {
      alert(`Error updating driver: ${err.message}`);
    } finally {
      setToggling(null);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const isNew = !editModal.id;
      const url = isNew ? `http://localhost:3000/api/drivers` : `http://localhost:3000/api/drivers/${editModal.id}`;
      const method = isNew ? 'POST' : 'PATCH';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!res.ok) throw new Error('Save failed');
      
      setEditModal(null);
      fetchDrivers(); // refresh list
    } catch (err) {
      alert(`Error saving driver: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const openModal = (driver = null) => {
    if (driver) {
      setFormData({ name: driver.name, phone: driver.phone, email: driver.email || '', status: driver.status });
      setEditModal(driver);
    } else {
      setFormData({ name: '', phone: '', email: '', status: 'available' });
      setEditModal({});
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-[var(--fg)] font-['Poppins',sans-serif]">
      
      {/* Header Section */}
      <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--fg)]/10 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold mb-1">Driver Management</h1>
            <p className="text-[10px] opacity-50 uppercase tracking-widest">
              Manage Driver Roster & Availability
            </p>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-[10px] font-medium opacity-60 uppercase tracking-widest">
                {drivers.filter(d => d.status === 'available').length} / {drivers.length} Available
             </div>
             <button 
               onClick={() => openModal()}
               className="border border-[var(--fg)]/20 rounded-xl px-5 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-colors"
             >
               + Add Driver
             </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Drivers List */}
        <div className="lg:col-span-2 bg-[var(--card-bg)] rounded-3xl border border-[var(--fg)]/10 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--fg)]/10">
            <h3 className="text-lg font-medium">Driver Roster</h3>
            <div className="bg-[var(--fg)]/5 rounded-xl p-2 border border-[var(--fg)]/10">
              <svg className="w-5 h-5 text-[var(--fg)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            </div>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              <div className="text-center opacity-40 text-xs py-10 uppercase tracking-widest">Loading drivers...</div>
            ) : drivers.length === 0 ? (
              <div className="text-center opacity-40 text-xs py-10 uppercase tracking-widest">No drivers found.</div>
            ) : (
              drivers.map(driver => (
                <div key={driver.id} className="p-5 rounded-2xl border border-[var(--fg)]/10 hover:shadow-md transition-shadow bg-[var(--fg)]/5 flex items-center justify-between">
                   <div className="flex items-center gap-5">
                     <div className="w-12 h-12 rounded-full bg-[var(--card-bg)] flex items-center justify-center font-bold text-sm border border-[var(--fg)]/20 shadow-sm uppercase">
                       {driver.name.substring(0, 2)}
                     </div>
                     <div>
                       <h4 className="font-bold text-sm">{driver.name}</h4>
                       <div className="flex items-center gap-3 mt-2">
                         <span className="text-[10px] uppercase tracking-widest opacity-70 bg-[var(--fg)]/10 px-2 py-0.5 rounded-md">
                           {driver.phone}
                         </span>
                         <span className="text-[10px] opacity-60">
                           {driver.email}
                         </span>
                       </div>
                     </div>
                   </div>
                   
                   <div className="flex flex-col items-end gap-3">
                     <div className="flex items-center gap-2">
                       <button onClick={() => openModal(driver)} className="text-[10px] font-bold uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity">Edit</button>
                       <div className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full ${driver.status === 'available' ? 'text-green-500 bg-green-500/10 border border-green-500/20' : 'text-[var(--fg)]/60 bg-[var(--fg)]/5 border border-[var(--fg)]/10'}`}>
                         {driver.status}
                       </div>
                     </div>
                     
                     <button
                       onClick={() => handleToggle(driver.id, driver.status)}
                       disabled={toggling === driver.id}
                       className={`text-[9px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${
                         driver.status === 'available'
                           ? 'border border-[var(--fg)]/20 text-[var(--fg)] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30' 
                           : 'bg-[var(--fg)] text-[var(--bg)] hover:opacity-80'
                       }`}
                     >
                       {toggling === driver.id ? 'Updating...' : driver.status === 'available' ? 'Mark Unavailable' : 'Mark Available'}
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
            <h3 className="text-lg font-medium">Assignment Rules</h3>
          </div>
          
          <div className="space-y-6 text-xs opacity-80 leading-relaxed">
            <p>
              <strong>1. Dispatching:</strong> Only drivers marked as <strong>Available</strong> will appear in the dropdown list when dispatching a batch.
            </p>
            <p>
              <strong>2. Mobile App:</strong> When a batch is assigned to a driver, they will instantly receive a notification on their driver app to start the route.
            </p>
            <p>
              <strong>3. Unassigning:</strong> Marking a driver as unavailable prevents them from taking new routes, but does not cancel their current active delivery.
            </p>
          </div>
        </div>

      </div>

      {/* Add / Edit Modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleSave} className="bg-[var(--card-bg)] border border-[var(--fg)]/10 rounded-3xl shadow-2xl w-full max-w-md p-8">
            <h3 className="text-xl font-bold mb-6">{editModal.id ? 'Edit Driver' : 'Add Driver'}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2">Full Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[var(--dashboard-bg)] border border-[var(--fg)]/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--fg)]" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2">Phone Number</label>
                <input required type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-[var(--dashboard-bg)] border border-[var(--fg)]/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--fg)]" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest opacity-60 mb-2">Email Address</label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-[var(--dashboard-bg)] border border-[var(--fg)]/20 rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--fg)]" />
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

export default Team;
