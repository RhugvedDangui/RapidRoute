# RapidRoute Driver App - Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies

Run the installation script:
```bash
cd mobile/rapidroute
install-packages.bat
```

Or manually install:
```bash
npm install nativewind tailwindcss
npm install @supabase/supabase-js react-native-url-polyfill @react-native-async-storage/async-storage
npm install expo-sqlite expo-network expo-camera expo-location react-native-maps expo-notifications axios
```

### 2. Initialize Tailwind CSS

```bash
npx tailwindcss init
```

### 3. Start the Development Server

```bash
npm start
```

Then press:
- `a` for Android
- `i` for iOS
- `w` for Web

## 📱 Current Implementation Status

### ✅ Completed (Steps 1-2)

**Step 1: Project Scaffolding & Expo Setup**
- ✅ Expo project with Expo Router and TypeScript
- ✅ NativeWind configured with pure monochrome theme
- ✅ Folder structure created (app/(auth), app/(tabs), utils, store)
- ✅ Pure black background (#000000) configured in app.json
- ✅ Metro config with NativeWind integration

**Step 2: Supabase Integration & Auth**
- ✅ Supabase client configured with AsyncStorage
- ✅ Phone/OTP login screen (app/(auth)/login.tsx)
- ✅ Auth Provider context with session management
- ✅ Protected routes (tabs require authentication)
- ✅ Driver profile fetching from `drivers` table
- ✅ TypeScript interfaces for all database tables

**Step 4: Driver Home Dashboard (Partial)**
- ✅ Home screen with online/offline indicator
- ✅ Earnings and delivery count display
- ✅ FlatList of today's deliveries
- ✅ Pull-to-refresh functionality
- ✅ Pure monochrome UI with high contrast

### 🔄 Next Steps

**Step 3: Offline-First Local Storage Engine**
- [ ] Set up expo-sqlite database
- [ ] Create local_orders and sync_queue tables
- [ ] Implement sync functions (fetch from Supabase, push to Supabase)
- [ ] Add photo upload with retry logic
- [ ] Network connectivity monitoring

**Step 5: OpenStreetMap Integration**
- [ ] Create navigation screen (app/route/[id].tsx)
- [ ] Implement react-native-maps with OSM tiles
- [ ] Draw white polyline for route
- [ ] Real-time driver location tracking
- [ ] Bottom sheet with Call/WhatsApp/Google Maps buttons
- [ ] OpenRouteService API integration

**Step 6: Traffic & Delay Prediction**
- [ ] Call FastAPI delay prediction endpoint
- [ ] Display risk level with monochrome indicators
- [ ] Show suggested actions
- [ ] Cache predictions locally

**Step 7: Delivery Workflow & Camera**
- [ ] Create delivery action screen (app/delivery/[id].tsx)
- [ ] Implement expo-camera for proof of delivery
- [ ] Delivered/Failed toggle
- [ ] Swipe-to-complete slider
- [ ] Failure reasons grid
- [ ] Photo upload to Supabase Storage

**Step 8: Real-time Updates & Notifications**
- [ ] Supabase Realtime subscriptions
- [ ] Push notifications with expo-notifications
- [ ] Background location tracking
- [ ] Toast notifications for route changes

**Step 9: Performance & Testing**
- [ ] Error boundaries
- [ ] Loading states
- [ ] Offline functionality testing
- [ ] Map performance optimization
- [ ] Bright sunlight testing

## 🎨 Design System

### Color Palette (Pure Monochrome)
```javascript
{
  'pure-black': '#000000',      // Primary background
  'pure-white': '#ffffff',      // Primary text & buttons
  'bg-primary': '#000000',      // Main background
  'bg-secondary': '#09090b',    // Card backgrounds
  'text-primary': '#ffffff',    // Primary text
  'text-secondary': '#a1a1aa',  // Secondary text
  'border': '#27272a',          // Borders & dividers
  'border-light': '#3f3f46',    // Lighter borders
}
```

### Typography
- **Headings:** Bold, 24-32px
- **Body:** Regular, 14-16px
- **Labels:** Semibold, 10-12px, uppercase, letter-spacing

### Touch Targets
- **Minimum size:** 48x48dp
- **Primary buttons:** Full width, 64px height
- **Secondary buttons:** Minimum 120px width, 48px height

## 🔐 Environment Variables

The app uses hardcoded Supabase credentials for development:

```typescript
const supabaseUrl = 'https://sujbxntyrfqgvxgxbbyk.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

For production, move these to environment variables:
```bash
# .env
EXPO_PUBLIC_SUPABASE_URL=https://sujbxntyrfqgvxgxbbyk.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 📊 Database Schema

### Key Tables

**drivers**
- id (uuid, primary key)
- seller_id (uuid)
- name (text)
- phone (text, unique) - Used for authentication
- email (text)
- vehicle_id (uuid)
- status ('available' | 'on_delivery' | 'offline')
- current_lat, current_lng (float)

**orders**
- id (text, primary key)
- customer (text)
- address (text)
- lat, lng (float)
- total (numeric)
- status ('pending' | 'in_progress' | 'delivered' | 'failed')
- time_window ('morning' | 'afternoon' | 'evening')
- batch_id (text)
- weight_kg (numeric)
- payment_type ('prepaid' | 'cod')
- is_return (boolean)
- proof_of_delivery (text) - URL to photo

**batches**
- id (text, primary key)
- driver_id (uuid)
- vehicle_id (uuid)
- status ('pending' | 'dispatched' | 'in_progress' | 'completed')
- total_orders (integer)
- estimated_distance, estimated_time, estimated_cost (numeric)
- carbon_saved (float)

**routes**
- id (text, primary key)
- batch_id (text)
- order_sequence (jsonb) - Array of order IDs
- total_distance, total_time (numeric)
- polyline (jsonb) - Array of {lat, lng} coordinates

## 🧪 Testing

### Test Driver Account

For testing, you'll need to create a driver in Supabase:

```sql
INSERT INTO drivers (name, phone, email, status)
VALUES ('Test Driver', '+919876543210', 'test@rapidroute.com', 'available');
```

### Test Flow

1. **Login:** Use phone +919876543210
2. **OTP:** Check Supabase Auth logs for OTP (or configure Twilio)
3. **Home:** Should show today's deliveries
4. **Navigation:** Tap "START" on first delivery
5. **Delivery:** Complete delivery with photo proof

## 🐛 Troubleshooting

### NativeWind not working
```bash
# Clear cache and restart
npx expo start -c
```

### Supabase Auth errors
- Check phone number format (+91 prefix for India)
- Verify Supabase Auth is enabled
- Check Supabase logs for OTP delivery

### Maps not loading
- Ensure react-native-maps is installed
- Check OpenStreetMap tile URL
- Verify location permissions

### Camera not working
- Check camera permissions in app.json
- Test on physical device (camera doesn't work in simulator)

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev/)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [Supabase React Native Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)
- [React Native Maps](https://github.com/react-native-maps/react-native-maps)
- [OpenStreetMap Tiles](https://wiki.openstreetmap.org/wiki/Tile_servers)

## 🎯 Next Session

When you're ready to continue, we'll implement:
1. **Offline storage** with expo-sqlite
2. **Maps & navigation** with react-native-maps
3. **Camera integration** for proof of delivery
4. **Real-time updates** with Supabase Realtime

Let me know when you're ready to proceed with Step 3!
