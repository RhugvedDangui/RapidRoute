require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.raw({ type: 'application/json' }));

// Supabase — anon key for read/webhook operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Supabase — service role key for privileged writes (dispatch, POD)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper function: Assign time window based on hour
const getTimeWindow = (dateString) => {
  const hour = new Date(dateString).getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'other';
};

// Helper function: Geocode address using Nominatim
const geocodeAddress = async (address) => {
  try {
    const fullAddress = `${address.address_1}, ${address.city}, ${address.state} ${address.postcode}, ${address.country}`;
    
    const geoRes = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: fullAddress,
        format: 'json',
        limit: 1
      },
      headers: {
        'User-Agent': 'LogisticsOptimizerDemo/1.0'
      }
    });

    if (geoRes.data && geoRes.data.length > 0) {
      return {
        lat: parseFloat(geoRes.data[0].lat),
        lng: parseFloat(geoRes.data[0].lon)
      };
    }

    // Fallback to hub coordinates if geocoding fails
    console.warn(`Geocoding returned no results. Using fallback coordinates.`);
    return { lat: 15.5494, lng: 73.8248 }; // Default Mapusa Hub
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return { lat: 15.5494, lng: 73.8248 }; // Default Mapusa Hub
  }
};

// POST /webhook/order - WooCommerce order webhook handler
app.post('/webhook/order', async (req, res) => {
  try {
    const order = req.body;

    // Extract required fields
    const orderId = order.id?.toString();
    const total = parseFloat(order.total) || 0;
    const dateCreated = order.date_created;
    const shipping = order.shipping;

    // Validate required fields
    if (!orderId || !shipping) {
      return res.status(400).json({ error: 'Missing required order fields' });
    }

    // Build customer name and full address
    const customerName = `${shipping.first_name || ''} ${shipping.last_name || ''}`.trim();
    const fullAddress = `${shipping.address_1 || ''}, ${shipping.address_2 || ''}, ${shipping.city || ''}, ${shipping.state || ''} ${shipping.postcode || ''}, ${shipping.country || ''}`.replace(/,\s*,/g, ',').trim();

    // Geocode the shipping address
    console.log(`Geocoding address for order ${orderId}...`);
    const { lat, lng } = await geocodeAddress(shipping);

    // Determine time window
    const timeWindow = getTimeWindow(dateCreated);

    // --- New fields ---
    // Weight in kg (from WooCommerce meta_data or default to 1.0)
    const weightKg = order.weight_kg
      ?? order.meta_data?.find(m => m.key === 'weight_kg')?.value
      ?? 1.0;

    // Payment type: 'cod' or 'prepaid' (WooCommerce payment_method tells us)
    const paymentType = (order.payment_method === 'cod') ? 'cod' : 'prepaid';

    // Is this a return order?
    const isReturn = !!(order.is_return
      ?? order.meta_data?.find(m => m.key === 'is_return')?.value
      ?? false);

    // Prepare order data for Supabase (matching the schema)
    const orderData = {
      id: orderId,
      customer: customerName,
      address: fullAddress,
      lat: lat,
      lng: lng,
      total: total,
      status: 'pending',
      time_window: timeWindow,
      created_at: dateCreated,
      order_date: dateCreated,
      batch_id: null,
      // New columns
      weight_kg: parseFloat(weightKg) || 1.0,
      payment_type: paymentType,
      is_return: isReturn,
      proof_of_delivery: null  // Filled later on delivery confirmation
    };

    // Insert into Supabase
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Failed to save order', details: error.message });
    }

    console.log(`✅ Order ${orderId} saved — coords (${lat}, ${lng}), weight ${weightKg}kg, ${paymentType}, return=${isReturn}`);
    
    res.status(200).json({
      success: true,
      message: 'Order processed successfully',
      order_id: orderId,
      customer: customerName,
      time_window: timeWindow,
      coordinates: { lat, lng },
      weight_kg: parseFloat(weightKg) || 1.0,
      payment_type: paymentType,
      is_return: isReturn,
      status: 'pending'
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// PATCH /orders/:id/pod - Upload Proof of Delivery URL
app.patch('/orders/:id/pod', async (req, res) => {
  try {
    const { id } = req.params;
    const { proof_of_delivery } = req.body;

    if (!proof_of_delivery) {
      return res.status(400).json({ error: 'proof_of_delivery URL is required' });
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ proof_of_delivery, status: 'delivered' })
      .eq('id', id)
      .select();

    if (error) throw error;

    console.log(`📷 POD recorded for order ${id}`);
    res.status(200).json({ success: true, order: data[0] });
  } catch (error) {
    console.error('POD update error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// POST /batches/:id/dispatch — Mark batch as dispatched
app.post('/batches/:id/dispatch', async (req, res) => {
  const { id } = req.params;
  const { driverId } = req.body || {};
  try {
    // 1. Update batch status and assign driver
    const updatePayload = { status: 'dispatched' };
    if (driverId) updatePayload.driver_id = driverId;

    const { error: batchErr } = await supabaseAdmin
      .from('batches')
      .update(updatePayload)
      .eq('id', id);
    if (batchErr) throw batchErr;

    const { data: orders, error: oErr } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('batch_id', id);
    if (oErr) throw oErr;

    if (!orders || orders.length === 0) {
      return res.status(404).json({ error: `No orders found for batch ${id}` });
    }

    const orderIds = orders.map(o => o.id);
    const { error: uErr } = await supabaseAdmin
      .from('orders')
      .update({ status: 'dispatched' })   // driver app later moves to out_for_delivery
      .in('id', orderIds);
    if (uErr) throw uErr;

    // Also update the batch status
    await supabaseAdmin.from('batches').update({ status: 'dispatched' }).eq('id', id);

    console.log(`✅ Batch ${id} dispatched — ${orders.length} orders → dispatched`);
    res.status(200).json({
      success: true,
      batch_id: id,
      dispatched_orders: orders.length,
    });
  } catch (err) {
    console.error('Dispatch error:', err);
    res.status(500).json({ error: 'Dispatch failed', details: err.message });
  }
});

// POST /batches/:id/start — driver starts the trip (called from driver app)
// Moves orders: dispatched → out_for_delivery
app.post('/batches/:id/start', async (req, res) => {
  const { id } = req.params;
  try {
    const { data: orders, error: oErr } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('batch_id', id)
      .eq('status', 'dispatched');  // only move dispatched orders
    if (oErr) throw oErr;

    if (!orders || orders.length === 0) {
      return res.status(404).json({ error: `No dispatched orders found for batch ${id}` });
    }

    const { error: uErr } = await supabaseAdmin
      .from('orders')
      .update({ status: 'out_for_delivery' })
      .in('id', orders.map(o => o.id));
    if (uErr) throw uErr;

    // Also update the batch status
    await supabaseAdmin.from('batches').update({ status: 'in_progress' }).eq('id', id);

    console.log(`🚚 Batch ${id} started — ${orders.length} orders → out_for_delivery`);
    res.status(200).json({ success: true, batch_id: id, orders_started: orders.length });
  } catch (err) {
    console.error('Start error:', err);
    res.status(500).json({ error: 'Start failed', details: err.message });
  }
});

// DELETE /batches/:id — Delete a batch, its route, and reset its orders to 'pending'
app.delete('/batches/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // 1. Reset orders: remove batch_id, set status back to 'pending'
    const { error: ordErr } = await supabaseAdmin
      .from('orders')
      .update({ batch_id: null, status: 'pending' })
      .eq('batch_id', id);
    if (ordErr) throw ordErr;

    // 2. Delete the route associated with this batch
    const { error: routeErr } = await supabaseAdmin
      .from('routes')
      .delete()
      .eq('batch_id', id);
    if (routeErr) throw routeErr;

    // 3. Delete the batch itself
    const { error: batchErr } = await supabaseAdmin
      .from('batches')
      .delete()
      .eq('id', id);
    if (batchErr) throw batchErr;

    console.log(`🗑️ Batch ${id} deleted — orders reset to pending`);
    res.status(200).json({ success: true, message: `Batch ${id} deleted successfully` });
  } catch (err) {
    console.error('Delete batch error:', err);
    res.status(500).json({ error: 'Failed to delete batch', details: err.message });
  }
});

// POST /api/batch/run — Execute the Python batching pipeline
app.post('/api/batch/run', (req, res) => {
  const { orderIds } = req.body || {}; // array of order IDs
  console.log('🚀 Triggering batching pipeline...');
  
  const args = ['run_full_pipeline.py'];
  if (orderIds && Array.isArray(orderIds) && orderIds.length > 0) {
    console.log(`Filtering to ${orderIds.length} specific orders:`, orderIds.join(','));
    args.push('--orders');
    args.push(orderIds.join(','));
  }

  // Define the path to the batching folder
  const batchingDir = path.join(__dirname, 'batching');

  // We spawn the python script and don't block the HTTP response (run async)
  // so the frontend doesn't hang. You could also await it if you want sync.
  const pyProcess = spawn('python', args, { cwd: batchingDir });

  pyProcess.stdout.on('data', (data) => console.log(`[Pipeline] ${data.toString()}`));
  pyProcess.stderr.on('data', (data) => console.error(`[Pipeline ERR] ${data.toString()}`));

  pyProcess.on('close', (code) => {
    console.log(`[Pipeline] process exited with code ${code}`);
  });

  res.status(200).json({ 
    success: true, 
    message: 'Batching pipeline started in the background.',
    target_orders: orderIds || 'all_pending'
  });
});

// POST /api/vehicles — Create new vehicle
app.post('/api/vehicles', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('vehicles')
      .insert([req.body])
      .select();
    
    if (error) throw error;
    res.status(201).json({ success: true, vehicle: data[0] });
  } catch (err) {
    console.error('Create vehicle error:', err);
    res.status(500).json({ error: 'Failed to create vehicle', details: err.message });
  }
});

// PATCH /api/vehicles/:id — Update vehicle (active status, name, etc.)
app.patch('/api/vehicles/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from('vehicles')
      .update(req.body)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    res.status(200).json({ success: true, vehicle: data[0] });
  } catch (err) {
    console.error('Update vehicle error:', err);
    res.status(500).json({ error: 'Failed to update vehicle', details: err.message });
  }
});

// POST /api/drivers — Create new driver
app.post('/api/drivers', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('drivers')
      .insert([req.body])
      .select();
    
    if (error) throw error;
    res.status(201).json({ success: true, driver: data[0] });
  } catch (err) {
    console.error('Create driver error:', err);
    res.status(500).json({ error: 'Failed to create driver', details: err.message });
  }
});

// PATCH /api/drivers/:id — Update driver (status, name, etc.)
app.patch('/api/drivers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from('drivers')
      .update(req.body)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    res.status(200).json({ success: true, driver: data[0] });
  } catch (err) {
    console.error('Update driver error:', err);
    res.status(500).json({ error: 'Failed to update driver', details: err.message });
  }
});

// POST /api/predict-all — Run delay prediction for all active orders
app.post('/api/predict-all', async (req, res) => {
  try {
    // Fetch active orders
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .in('status', ['pending', 'batched', 'dispatched']);
      
    if (error) throw error;
    if (!orders || orders.length === 0) {
      return res.status(200).json({ success: true, message: 'No active orders to predict.', count: 0 });
    }

    const HUB_LAT = 15.3533;
    const HUB_LNG = 73.9575;
    
    let successCount = 0;
    
    for (const order of orders) {
      try {
        // Build payload for FastAPI model
        const payload = {
          order_id: order.id.toString(),
          origin_lat: HUB_LAT,
          origin_lon: HUB_LNG,
          dest_lat: order.lat || HUB_LAT,
          dest_lon: order.lng || HUB_LNG,
          courier_id: "default-courier",
          courier_reliability_score: 0.8 // Override to avoid failing if no history
        };
        
        await axios.post('https://dbb0-2401-4900-561f-c477-741e-8d29-738-63.ngrok-free.app/api/v1/predict-delay', payload, {
          headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        successCount++;
      } catch (innerErr) {
        console.error(`Failed to predict for order ${order.id}:`, innerErr.message);
      }
    }
    
    res.status(200).json({
      success: true, 
      message: `Ran delay prediction for ${successCount}/${orders.length} orders.`,
      count: successCount
    });
  } catch (err) {
    console.error('Predict all error:', err);
    res.status(500).json({ error: 'Failed to run predictions', details: err.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Logistics Optimizer Backend running on port ${PORT}`);
  console.log(`📍 Webhook endpoint: http://localhost:${PORT}/webhook/order`);
});
