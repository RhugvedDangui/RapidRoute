import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [batchingState, setBatchingState] = useState(null); // null | 'running' | 'success' | 'error'
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addingOrder, setAddingOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customer: '',
    address: '',
    city: 'Mapusa',
    state: 'Goa',
    pincode: '403507',
    total: ''
  });

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
      const res = await fetch(`http://${window.location.hostname}:3000/api/batch/run`, {
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
      case 'dispatched':
      case 'out for delivery':
        return <span className="bg-[var(--fg)] text-[var(--bg)] rounded-full px-3 py-1 text-[9px] uppercase font-medium">Dispatched</span>;
      case 'delivered':
        return <span className="bg-green-500/20 text-green-500 rounded-full px-3 py-1 text-[9px] uppercase font-medium">Delivered</span>;
      default:
        return <span className="bg-gray-500/20 text-gray-500 rounded-full px-3 py-1 text-[9px] uppercase font-medium">{status || 'Unknown'}</span>;
    }
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedOrders = React.useMemo(() => {
    let sortableOrders = [...orders];
    
    // Filter
    if (statusFilter !== 'all') {
      sortableOrders = sortableOrders.filter(o => o.status === statusFilter);
    }
    
    // Sort
    sortableOrders.sort((a, b) => {
      let aVal = a[sortConfig.key] || '';
      let bVal = b[sortConfig.key] || '';
      
      // Handle dates
      if (sortConfig.key === 'order_date' || sortConfig.key === 'created_at') {
        aVal = new Date(a.order_date || a.created_at).getTime();
        bVal = new Date(b.order_date || b.created_at).getTime();
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sortableOrders;
  }, [orders, statusFilter, sortConfig]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const submitNewOrder = async (e) => {
    e.preventDefault();
    setAddingOrder(true);
    
    // Split customer name
    const nameParts = newOrder.customer.split(' ');
    const firstName = nameParts[0] || 'Manual';
    const lastName = nameParts.slice(1).join(' ') || 'Customer';

    // Generate random 5 digit ID
    const randomId = Math.floor(10000 + Math.random() * 90000);

    const payload = {
      id: randomId,
      total: newOrder.total || "0",
      date_created: new Date().toISOString(),
      shipping: {
        first_name: firstName,
        last_name: lastName,
        address_1: newOrder.address,
        city: newOrder.city,
        state: newOrder.state,
        postcode: newOrder.pincode,
        country: "India"
      }
    };

    try {
      const res = await fetch(`http://${window.location.hostname}:3000/webhook/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to create order');
      
      setIsAddModalOpen(false);
      setNewOrder({ customer: '', address: '', city: 'Mapusa', state: 'Goa', pincode: '403507', total: '' });
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert('Error creating manual order');
    } finally {
      setAddingOrder(false);
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
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="text-[10px] rounded-xl uppercase tracking-widest border border-[var(--fg)]/20 px-4 py-3 hover:bg-[var(--fg)] hover:text-[var(--bg)] transition-colors"
            >
              + Add Manual
            </button>
            <button className="text-[10px] rounded-xl shadow-sm uppercase tracking-widest bg-[var(--fg)] text-[var(--bg)] px-4 py-3 hover:opacity-80 transition-opacity">
              Sync Shopify
            </button>
          </div>
        </div>
      </div>

      {/* Main Analytics Grid layout for Orders */}
      <div className="grid grid-cols-1 gap-8">
        
        {/* Orders Table Section */}
        <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--fg)]/10 shadow-sm p-8">
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
            <div className="flex items-center gap-3">
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[var(--dashboard-bg)] border border-[var(--fg)]/20 rounded-xl px-3 py-2 text-xs outline-none focus:border-[var(--fg)] uppercase tracking-widest font-medium"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="batched">Batched</option>
                <option value="dispatched">Dispatched</option>
                <option value="delivered">Delivered</option>
              </select>
              <div className="bg-[var(--fg)]/5 rounded-xl p-2 border border-[var(--fg)]/10 cursor-pointer">
                <svg className="w-5 h-5 text-[var(--fg)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--fg)]/10 text-[9px] uppercase tracking-widest opacity-50 select-none">
                  <th className="p-4 font-normal w-10">
                    <input 
                      type="checkbox" 
                      onChange={handleSelectAll}
                      checked={orders.filter(o => o.status === 'pending').length > 0 && selectedOrders.length === orders.filter(o => o.status === 'pending').length}
                      className="accent-[var(--fg)]"
                    />
                  </th>
                  <th className="p-4 font-normal cursor-pointer hover:opacity-100" onClick={() => requestSort('id')}>
                    Order ID {sortConfig.key === 'id' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-4 font-normal cursor-pointer hover:opacity-100" onClick={() => requestSort('created_at')}>
                    Date {sortConfig.key === 'created_at' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-4 font-normal cursor-pointer hover:opacity-100" onClick={() => requestSort('customer')}>
                    Customer {sortConfig.key === 'customer' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="p-4 font-normal">Address / Pin</th>
                  <th className="p-4 font-normal cursor-pointer hover:opacity-100" onClick={() => requestSort('status')}>
                    Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="p-4 text-center opacity-50 text-[10px] uppercase tracking-widest">
                      Loading orders...
                    </td>
                  </tr>
                ) : filteredAndSortedOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-4 text-center opacity-50 text-[10px] uppercase tracking-widest">
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedOrders.map(order => (
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
                      <td className="p-4 opacity-70 whitespace-nowrap">{formatDate(order.order_date || order.created_at)}</td>
                      <td className="p-4">{order.customer || 'Unknown'}</td>
                      <td className="p-4 opacity-70 max-w-[150px] truncate" title={order.address}>{order.address || 'N/A'}</td>
                      <td className="p-4">{getStatusBadge(order.status)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Manual Order Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-[var(--bg)]/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-[var(--card-bg)] border border-[var(--fg)]/10 rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <button 
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-6 right-6 text-[var(--fg)]/50 hover:text-[var(--fg)]"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <h3 className="text-xl font-medium mb-1">Manual Order Entry</h3>
            <p className="text-xs opacity-50 uppercase tracking-widest mb-6">Create order bypassing Shopify/WooCommerce</p>
            
            <form onSubmit={submitNewOrder} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest opacity-50 mb-1">Customer Name</label>
                <input 
                  type="text" 
                  required
                  value={newOrder.customer}
                  onChange={e => setNewOrder({...newOrder, customer: e.target.value})}
                  className="w-full bg-[var(--bg)] border border-[var(--fg)]/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--fg)] transition-colors"
                  placeholder="Rahul Sharma"
                />
              </div>
              
              <div>
                <label className="block text-[10px] uppercase tracking-widest opacity-50 mb-1">Address Line</label>
                <input 
                  type="text" 
                  required
                  value={newOrder.address}
                  onChange={e => setNewOrder({...newOrder, address: e.target.value})}
                  className="w-full bg-[var(--bg)] border border-[var(--fg)]/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--fg)] transition-colors"
                  placeholder="Agnel Institute of Technology"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest opacity-50 mb-1">City</label>
                  <input 
                    type="text" 
                    required
                    value={newOrder.city}
                    onChange={e => setNewOrder({...newOrder, city: e.target.value})}
                    className="w-full bg-[var(--bg)] border border-[var(--fg)]/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--fg)] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest opacity-50 mb-1">Pincode</label>
                  <input 
                    type="text" 
                    required
                    value={newOrder.pincode}
                    onChange={e => setNewOrder({...newOrder, pincode: e.target.value})}
                    className="w-full bg-[var(--bg)] border border-[var(--fg)]/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--fg)] transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest opacity-50 mb-1">State</label>
                  <input 
                    type="text" 
                    required
                    value={newOrder.state}
                    onChange={e => setNewOrder({...newOrder, state: e.target.value})}
                    className="w-full bg-[var(--bg)] border border-[var(--fg)]/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--fg)] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest opacity-50 mb-1">Order Total (₹)</label>
                  <input 
                    type="number" 
                    value={newOrder.total}
                    onChange={e => setNewOrder({...newOrder, total: e.target.value})}
                    className="w-full bg-[var(--bg)] border border-[var(--fg)]/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--fg)] transition-colors"
                    placeholder="499"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={addingOrder}
                className="w-full mt-4 bg-[var(--fg)] text-[var(--bg)] font-bold text-[10px] uppercase tracking-widest py-4 rounded-xl hover:opacity-90 transition-opacity"
              >
                {addingOrder ? 'Processing & Geocoding...' : 'Create & Geocode Order'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default OrderManagement;
