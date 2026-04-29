# Logistics Optimizer Backend

Node.js Express server that receives WooCommerce order webhooks, geocodes addresses, and stores orders in Supabase.

## Features

- ✅ WooCommerce webhook signature verification
- ✅ Address geocoding via Nominatim API
- ✅ Time window assignment (morning/afternoon/evening)
- ✅ Supabase integration for order storage

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Update the `.env` file with your credentials:

```env
# Supabase Configuration
SUPABASE_URL=https://sujbxntyrfqgvxgxbbyk.supabase.co
SUPABASE_ANON_KEY=your_actual_supabase_anon_key

# WooCommerce Webhook Secret
WC_WEBHOOK_SECRET=your_woocommerce_webhook_secret

# Server Configuration
PORT=3000
```

**To get your Supabase credentials:**
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the `URL` and `anon/public` key

**To get your WooCommerce webhook secret:**
1. In WooCommerce, go to Settings → Advanced → Webhooks
2. Create a new webhook or edit existing one
3. Copy the Secret key

### 3. Create Supabase Table

Run this SQL in your Supabase SQL Editor:

```sql
CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  total NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending',
  time_window TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state TEXT,
  postcode TEXT,
  country TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  customer_name TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_time_window ON orders(time_window);
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

### 4. Start the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### POST /webhook/order

Receives WooCommerce order webhooks.

**Headers:**
- `Content-Type: application/json`
- `X-WC-Webhook-Signature: <signature>` (for verification)

**Request Body Example:**
```json
{
  "id": 12345,
  "total": "99.99",
  "date_created": "2026-04-29T14:30:00",
  "shipping": {
    "first_name": "John",
    "last_name": "Doe",
    "address_1": "123 Main St",
    "address_2": "Apt 4B",
    "city": "New York",
    "state": "NY",
    "postcode": "10001",
    "country": "US"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order processed successfully",
  "order_id": "12345",
  "time_window": "afternoon",
  "coordinates": {
    "lat": 40.7128,
    "lng": -74.0060
  }
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-29T14:30:00.000Z"
}
```

## Time Window Logic

Orders are automatically assigned to time windows based on the `date_created` hour:

- **6:00–12:00** → `morning`
- **12:00–17:00** → `afternoon`
- **17:00–21:00** → `evening`
- **Other times** → `other`

## Geocoding

The server uses the free Nominatim API (OpenStreetMap) to geocode addresses:

- Includes proper `User-Agent` header as required by Nominatim
- Returns `lat` and `lng` coordinates
- Handles geocoding failures gracefully (stores `null` coordinates)

## Security

The webhook endpoint verifies the `X-WC-Webhook-Signature` header using HMAC-SHA256:

1. WooCommerce signs the payload with your secret key
2. Server recomputes the signature and compares
3. Rejects requests with invalid or missing signatures

## Testing

### Test with curl:

```bash
curl -X POST http://localhost:3000/webhook/order \
  -H "Content-Type: application/json" \
  -d '{
    "id": 12345,
    "total": "99.99",
    "date_created": "2026-04-29T14:30:00",
    "shipping": {
      "first_name": "John",
      "last_name": "Doe",
      "address_1": "1600 Amphitheatre Parkway",
      "city": "Mountain View",
      "state": "CA",
      "postcode": "94043",
      "country": "US"
    }
  }'
```

### Configure WooCommerce Webhook:

1. Go to WooCommerce → Settings → Advanced → Webhooks
2. Click "Add webhook"
3. Set:
   - **Name:** Order Created
   - **Status:** Active
   - **Topic:** Order created
   - **Delivery URL:** `https://your-domain.com/webhook/order`
   - **Secret:** (generate a strong secret)
4. Save and copy the secret to your `.env` file

## Troubleshooting

**Geocoding fails:**
- Check that the address format is correct
- Nominatim has rate limits (1 request/second for free tier)
- Consider adding retry logic or using a paid geocoding service

**Signature verification fails:**
- Ensure `WC_WEBHOOK_SECRET` matches the secret in WooCommerce
- Check that the payload hasn't been modified in transit
- Verify the webhook is sending the `X-WC-Webhook-Signature` header

**Supabase insert fails:**
- Verify your `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- Check that the `orders` table exists with the correct schema
- Review Supabase logs for detailed error messages

## Next Steps

- Add route optimization logic
- Implement batch processing for time windows
- Add webhook retry mechanism
- Set up monitoring and alerting
- Deploy to production (Heroku, Railway, Render, etc.)
