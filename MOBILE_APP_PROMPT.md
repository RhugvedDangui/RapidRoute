# RapidRoute Driver App - Mobile Development Prompt

You are an Elite Senior Mobile Engineer. You specialize in building offline-first, high-performance iOS and Android applications using React Native (Expo), NativeWind (Tailwind for React Native), and Supabase. You write incredibly clean, modular, and production-ready code.

## 🎯 The Project: RapidRoute Driver App

We are building the "Driver/Delivery Person" mobile app for a B2B logistics platform called RapidRoute. This is a native Expo application used by delivery drivers who are often outside, on two-wheelers, dealing with bright sunlight and spotty internet connections.

## 🛠️ The Tech Stack

* **Framework:** React Native with Expo (SDK 52+)
* **Navigation:** Expo Router (File-based routing)
* **Styling:** NativeWind (Tailwind CSS for React Native)
* **Backend & DB:** Supabase (PostgreSQL, Auth, Realtime, Storage)
* **Mapping:** 
  - Map Rendering: `react-native-maps`or leaflet with OpenStreetMap tiles
  - Routing: OpenRouteService API (already configured in backend)
  - Traffic: TomTom Traffic API (already configured in backend)
* **Offline State:** `expo-sqlite` for local caching and mutation queues
* **Hardware APIs:** 
  - `expo-camera` (Proof of delivery photos)
  - `expo-location` (Driver tracking)
  - `expo-network` (Connectivity detection)

## 🔗 Backend Integration

The FastAPI backend is already running with these endpoints:

### Delay Prediction API
```
POST /api/v1/predict-delay
- Predicts delivery delay risk
- Uses real-time weather (Open-Meteo) and traffic (TomTom)
- Returns risk_score, risk_level, explanation, suggested_action
```

### Supabase Tables (Already Created)

**Core Tables:**
- `orders` - Order details
  - id, customer, address, lat, lng, total, status, time_window
  - weight_kg, payment_type, is_return, proof_of_delivery
  - batch_id (links to batches)

- `batches` - Order batches assigned to drivers
  - id, driver_id, vehicle_id, status
  - total_orders, estimated_distance, estimated_time, estimated_cost
  - carbon_saved

- `routes` - Optimized routes with polylines
  - id, batch_id, order_sequence (jsonb), total_distance, total_time
  - polyline (jsonb) - route coordinates

- `drivers` - Driver profiles
  - id, seller_id, name, phone (unique), email
  - vehicle_id, status, current_lat, current_lng

- `vehicles` - Vehicle information
  - id, seller_id, name, plate, type (bike/car/van)
  - capacity_kg, cost_per_km, active

- `customers` - Customer information
  - id, seller_id, name, phone, address, lat, lng, pincode, notes

- `sellers` - Seller/warehouse data
  - id, name, email, phone
  - warehouse_lat, warehouse_lng
  - working_start_time, working_end_time

**Delay Prediction Tables:**
- `delay_predictions` - ML predictions with weather data
  - id, order_id, risk_score, risk_level, explanation, suggested_action
  - precipitation_mm, wind_speed_kmh, weather_code, temperature_celsius
  - distance_km, courier_reliability_score, time_of_day
  - actual_delayed, actual_delay_minutes (for retraining)

- `predictions` - Legacy predictions table
  - order_id, risk_level, risk_score, reasons (jsonb), suggested_action

**Other Tables:**
- `notifications` - Push notifications
- `zones` - Delivery zones
- `courier_partners` - External courier integrations
- `settings` - App settings

**Sample Data Structure:**
```json
// Order example
{
  "id": "10012",
  "customer": "Nisha Chari",
  "address": "Siolim Church Rd, Siolim",
  "lat": 15.6012,
  "lng": 73.7654,
  "status": "pending",
  "payment_type": "prepaid", // or "cod"
  "weight_kg": 2.0,
  "time_window": "morning",
  "batch_id": "BATCH-001"
}

// Batch example
{
  "id": "BATCH-001",
  "driver_id": "uuid",
  "vehicle_id": "uuid",
  "status": "dispatched",
  "total_orders": 8,
  "estimated_distance": 25.5,
  "estimated_time": 90
}
```

### Environment Variables (Already Configured)
```
SUPABASE_URL=https://sujbxntyrfqgvxgxbbyk.supabase.co
SUPABASE_KEY=sb_publishable_SDcPl8QR_BlENdKMcPUCMg_RuS2cR6D
OPENROUTE_API_KEY=eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImFkYTk2MzU1NGNiNTQxODg5YmIzMTNiMzk0ZDJlNmU3IiwiaCI6Im11cm11cjY0In0=
TOMTOM_API_KEY=FUjE3QskZFEEKUqFDye3yYY8cHThknuv
```

## 🎨 Strict UI/UX Guidelines (The "Pure Monochrome Minimalist" Theme)

* **Color Palette:** STRICTLY Black, White, and shades of Dark Gray. This is a pure Dark Mode, high-contrast app. There are NO accent colors (no orange, no blue).
  - Backgrounds: `#000000` or `#09090b`
  - Text: `#ffffff` or `#a1a1aa`
  - Borders/Dividers: `#27272a`
  - Primary Actions: Pure White (`#ffffff`) backgrounds with Black (`#000000`) text
  - Route Line on Map: Pure White (`#ffffff`) or Light Gray (`#d4d4d8`)
  - Success/Failure States: Do not rely on color. Use thick borders, bold text, and clear iconography (e.g., a white checkmark for success, a white 'X' for failure)

* **Typography:** Sans-serif, large, and highly readable
* **Touch Targets:** Massive, thumb-friendly buttons. Action buttons must span the full width of the screen (`w-full`, `p-6`)
* **Outdoor Readability:** High contrast for bright sunlight visibility

## ⚙️ Core Architecture Requirements

This app MUST be "Offline-First". Drivers will lose cell service in buildings or remote areas.

1. **Reads:** Fetch today's itinerary from Supabase on launch and cache it locally (SQLite). If offline, read from the local cache.

2. **Writes:** When a driver marks an order "Delivered", upload the photo via `expo-camera` and update the status. If offline, save the mutation to a local `sync_queue` table and sync to Supabase in the background once network connectivity (`expo-network`) returns.

3. **Real-time Updates:** Use Supabase Realtime to listen for route updates from the seller dashboard.

## 🚀 Step-by-Step Build Instructions

Please execute this project step-by-step. Do not move to the next step until I confirm the current step is complete and working.

### Step 1: Project Scaffolding & Expo Setup
* Initialize a new Expo project with Expo Router and TypeScript
* Install and configure NativeWind for Tailwind styling
* Set up the initial folder structure (`app/(auth)`, `app/(tabs)`, `components`, `utils`, `store`)
* Configure the app background color to pure black in `app.json`

### Step 2: Supabase Integration & Auth
* Install Supabase JS client and `react-native-url-polyfill`
* Create a simple, massive-input Login screen (`app/index.tsx`) using Phone/OTP (common in India)
* Set up the Auth Provider context to protect the `(tabs)` routes
* Fetch driver profile from `drivers` table after login

### Step 3: Offline-First Local Storage Engine
* Set up the local database using `expo-sqlite`
* Define the schema/types for `local_orders` and `sync_queue`
* Write helper functions to:
  1. Fetch from Supabase and write to local cache
  2. Push local queued mutations to Supabase when connection is restored
  3. Handle photo uploads to Supabase Storage with retry logic

### Step 4: The Driver Home Dashboard (UI)
* Build the main screen (`app/(tabs)/home.tsx`) showing:
  - Header: Status indicator (Online/Offline) and Earnings/Progress
  - Hero Card: The "Next Up" delivery with a giant "Start Navigation" button (White background, Black text)
  - List: A `FlatList` of the remaining itinerary stops
  - Pull-to-refresh to sync with Supabase

### Step 5: OpenStreetMap Integration (Active Navigation)
* Create the navigation screen (`app/route/[id].tsx`)
* Implement `react-native-maps` with OpenStreetMap tiles:
  ```jsx
  <MapView>
    <UrlTile
      urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
  </MapView>
  ```
* Draw the route polyline in pure white between current location and destination
* Use OpenRouteService API to fetch route coordinates
* Show real-time driver location with `expo-location`
* Include a floating bottom sheet with massive "Call", "WhatsApp", and "Open in Google Maps" buttons

### Step 6: Traffic & Delay Prediction Integration
* Before starting navigation, call the FastAPI delay prediction endpoint
* Show risk level (low/medium/high) with monochrome indicators
* Display suggested actions (e.g., "Heavy traffic - add 30 min buffer")
* Cache predictions locally for offline access

### Step 7: The Delivery Workflow & Camera
* Build the swipe-up delivery action view
* Create a massive toggle/tab layout: [ Delivered ] | [ Failed ]
* If Delivered:
  - Integrate `expo-camera` for a large "Take Photo" button
  - Add a "Swipe to Complete" slider mechanism
  - Upload photo to Supabase Storage
  - Update order status in Supabase
* If Failed:
  - Show a clean grid of failure reasons (Wrong address, Customer unavailable, Access issue, etc.)
  - Allow notes input
  - Queue for retry or return to warehouse
* Wire these actions to the offline-sync engine

### Step 8: Real-time Updates & Notifications
* Subscribe to Supabase Realtime for route changes
* Show toast notifications for new orders added to route
* Update local cache when changes are received
* Use `expo-notifications` for push notifications when app is in background

### Step 9: Performance & Testing
* Implement proper error boundaries
* Add loading states for all async operations
* Test offline functionality thoroughly
* Optimize map rendering for smooth 60fps
* Test on actual devices in bright sunlight

## 📱 Key Features Checklist

- [ ] Phone/OTP authentication
- [ ] Offline-first data sync
- [ ] Today's delivery list with sequence
- [ ] Turn-by-turn navigation with OSM
- [ ] Real-time traffic warnings
- [ ] Delay risk predictions
- [ ] Photo proof of delivery
- [ ] Failed delivery reasons
- [ ] Call/WhatsApp customer
- [ ] Earnings tracker
- [ ] Real-time route updates
- [ ] Background location tracking
- [ ] Push notifications
- [ ] Pure monochrome UI

## 🎯 Success Criteria

1. App works completely offline after initial sync
2. All UI is readable in bright sunlight (high contrast)
3. All touch targets are thumb-friendly (minimum 48x48dp)
4. Photos upload reliably with retry logic
5. Location tracking is battery-efficient
6. App feels fast and responsive (no jank)
7. Zero color dependencies (pure monochrome)

Let's begin with **Step 1**. Please provide the terminal commands for initialization (Expo, NativeWind, Expo Router) and the base configuration files to get the pure monochrome shell running.
