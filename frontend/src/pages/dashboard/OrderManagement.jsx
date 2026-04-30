import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [batchingState, setBatchingState] = useState(null); // null | 'running' | 'success' | 'error'

  useEffect(() => {
    fetchOrders();

    // Set up real-time subscription
    const subscription = supabase
      .channel('orders_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, payload => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOrder = (id) => {
    setSelectedOrders(prev => 
      prev.includes(id) ? prev.filter(orderId => orderId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const pendingOrders = orders.filter(o => o.status === 'pending');
    if (selectedOrders.length === pendingOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(pendingOrders.map(o => o.id));
    }
  };

  const handleRunBatching = async () => {
    if (selectedOrders.length === 0) return;
    setBatchingState('running');
    try {
      const res = await fetch('http://localhost:3000/api/batch/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: selectedOrders })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start batching');
      
      setBatchingState('success');
      setTimeout(() => setBatchingState(null), 3000);
      setSelectedOrders([]);
    } catch (e) {
      console.error(e);
      setBatchingState('error');
      setTimeout(() => setBatchingState(null), 3000);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return <span className="bg-yellow-500/20 text-yellow-500 rounded-full px-3 py-1 text-[9px] uppercase font-medium">Pending</span>;
      case 'batched':
        return <span className="bg-[var(--fg)]/10 text-[var(--fg)] rounded-full px-3 py-1 text-[9px] uppercase font-medium">Batched</span>;
      case 'out for delivery':
        return <span className="bg-[var(--fg)] text-[var(--bg)] rounded-full px-3 py-1 text-[9px] uppercase font-medium">Out for Delivery</span>;
      default:
        return <span className="bg-gray-500/20 text-gray-500 rounded-full px-3 py-1 text-[9px] uppercase font-medium">{status || 'Unknown'}</span>;
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header Section */}
      <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--fg)]/10 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-medium mb-2">Order Management</h1>
            <p className="text-xs opacity-70 uppercase tracking-widest">Forward & Reverse Logistics Sync</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-[10px] rounded-xl uppercase tracking-widest border border-[var(--fg)]/20 px-4 py-3 hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-colors">
              + Add Manual
            </button>
            <button className="text-[10px] rounded-xl shadow-sm uppercase tracking-widest bg-[var(--fg)] text-[var(--bg)] px-4 py-3 hover:opacity-80 transition-opacity">
              Sync Shopify
            </button>
          </div>
        </div>
      </div>

      {/* Main Analytics Grid layout for Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Orders Table Section */}
        <div className="lg:col-span-2 bg-[var(--card-bg)] rounded-3xl border border-[var(--fg)]/10 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--fg)]/10">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-medium">Forward Orders</h3>
              {selectedOrders.length > 0 && (
                <button 
                  onClick={handleRunBatching}
                  disabled={batchingState === 'running'}
                  className="bg-[var(--fg)] text-[var(--bg)] text-[10px] uppercase font-bold px-4 py-2 rounded-xl transition-all"
                >
                  {batchingState === 'running' ? 'Running...' : batchingState === 'success' ? 'Started!' : `Run Batching (${selectedOrders.length})`}
                </button>
              )}
            </div>
            <div className="bg-[var(--fg)]/5 rounded-xl p-2 border border-[var(--fg)]/10">
              <svg className="w-6 h-6 text-[var(--fg)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--fg)]/10 text-[9px] uppercase tracking-widest opacity-50">
                  <th className="p-4 font-normal w-10">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll}
                      checked={orders.filter(o => o.status === 'pending').length > 0 && selectedOrders.length === orders.filter(o => o.status === 'pending').length}
                      className="accent-[var(--fg)]"
                    />
                  </th>
                  <th className="p-4 font-normal">Order ID</th>
                  <th className="p-4 font-normal">Customer</th>
                  <th className="p-4 font-normal">Address / Pin</th>
                  <th className="p-4 font-normal">Time Window</th>
                  <th className="p-4 font-normal">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-4 text-center opacity-50 text-[10px] uppercase tracking-widest">
                      Loading orders...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-4 text-center opacity-50 text-[10px] uppercase tracking-widest">
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  orders.map(order => (
                    <tr key={order.id} className="border-b border-[var(--fg)]/5 hover:bg-[var(--fg)]/5 transition-colors">
                      <td className="p-4">
                        {order.status === 'pending' && (
                          <input 
                            type="checkbox" 
                            checked={selectedOrders.includes(order.id)}
                            onChange={() => handleSelectOrder(order.id)}
                            className="accent-[var(--fg)]"
                          />
                        )}
                      </td>
                      <td className="p-4 font-medium">ORD-{order.id}</td>
                      <td className="p-4">{order.customer || 'Unknown'}</td>
                      <td className="p-4 opacity-70 max-w-[150px] truncate" title={order.address}>{order.address || 'N/A'}</td>
                      <td className="p-4 opacity-70 capitalize">{order.time_window || 'N/A'}</td>
                      <td className="p-4">{getStatusBadge(order.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reverse Logistics Summary */}
        <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--fg)]/10 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--fg)]/10">
            <h3 className="text-lg font-medium">Reverse Logistics</h3>
          </div>
          
          <div className="space-y-4">
            <div className="border border-[var(--fg)]/10 rounded-2xl p-6 relative bg-[var(--fg)]/5">
               <div className="text-[var(--fg)]/70 text-xs font-medium uppercase tracking-widest mb-2">Pending Returns</div>
               <div className="text-[var(--fg)] font-medium text-lg mt-2">4</div>
            </div>

            <div className="space-y-3 mt-6">
              <div className="flex items-center justify-between p-4 rounded-2xl border border-[var(--fg)]/10 text-xs hover:bg-[var(--fg)]/5 transition-colors cursor-pointer shadow-sm">
                <div className="flex items-center gap-4">
                   <div className="bg-[var(--fg)] rounded-xl text-[var(--bg)] p-2"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg></div>
                   <div>
                     <div className="font-medium text-sm">RET-102</div>
                     <div className="opacity-50 text-[10px] mt-0.5">Wrong Size • Unopened</div>
                   </div>
                </div>
                <div className="text-[9px] font-medium uppercase bg-[var(--fg)]/10 rounded-full px-3 py-1">Scheduled</div>
              </div>
            </div>

            <div className="pt-6 border-t border-[var(--fg)]/10 mt-6">
              <button className="w-full text-center px-4 py-3 rounded-xl text-xs uppercase tracking-widest bg-[var(--fg)] text-[var(--bg)] font-medium hover:opacity-80 transition-opacity shadow-sm">
                Combine with Forward →
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OrderManagement;
