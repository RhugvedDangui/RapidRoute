require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.raw({ type: 'application/json' }));

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
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

    return { lat: null, lng: null };
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return { lat: null, lng: null };
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
      batch_id: null
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

    console.log(`Order ${orderId} saved successfully with coordinates (${lat}, ${lng})`);
    
    res.status(200).json({
      success: true,
      message: 'Order processed successfully',
      order_id: orderId,
      customer: customerName,
      time_window: timeWindow,
      coordinates: { lat, lng },
      status: 'pending'
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
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
