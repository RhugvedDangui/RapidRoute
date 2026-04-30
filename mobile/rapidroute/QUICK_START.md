# 🚀 RapidRoute Driver App - Quick Start

## Get Running in 5 Minutes

### Step 0: Fix Any Existing Issues (if needed)

If you're seeing errors, run these commands first:
```bash
cd mobile/rapidroute

# Clear cache
npx expo start -c

# If that doesn't work, reinstall
rmdir /s /q node_modules
del package-lock.json
npm install
```

### Step 1: Install Dependencies (2 minutes)

```bash
cd mobile/rapidroute
install-packages.bat
```

This will install:
- NativeWind & Tailwind CSS
- Supabase client
- Camera, Location, Maps, SQLite
- All other dependencies

### Step 2: Create Test Driver in Supabase (1 minute)

Go to your Supabase dashboard and run this SQL:

```sql
-- Create a test driver
INSERT INTO drivers (name, phone, email, status)
VALUES ('Test Driver', '+919876543210', 'test@rapidroute.com', 'available');

-- Create a test batch
INSERT INTO batches (id, driver_id, status, total_orders, estimated_distance, estimated_time, estimated_cost)
SELECT 'BATCH-TEST-001', id, 'dispatched', 3, 15.5, 45, 250
FROM drivers WHERE phone = '+919876543210';

-- Create test orders
INSERT INTO orders (id, customer, address, lat, lng, total, status, time_window, batch_id, weight_kg, payment_type)
VALUES 
  ('ORD-001', 'Rahul Sharma', 'Agnel Institute, Bardez, Goa', 15.602, 73.761, 499.00, 'pending', 'morning', 'BATCH-TEST-001', 2.0, 'prepaid'),
  ('ORD-002', 'Priya Desai', 'Calangute Beach Rd, Goa', 15.544, 73.755, 750.00, 'pending', 'morning', 'BATCH-TEST-001', 3.5, 'cod'),
  ('ORD-003', 'Amit Parab', 'Panaji Ferry Wharf, Goa', 15.499, 73.828, 675.00, 'pending', 'afternoon', 'BATCH-TEST-001', 1.5, 'prepaid');
```

### Step 3: Start the App (1 minute)

```bash
npm start
```

Then press:
- `a` for Android emulator
- `i` for iOS simulator
- Scan QR code for physical device

### Step 4: Login (1 minute)

1. Enter phone: `9876543210` (or `+919876543210`)
2. Click "SEND OTP"
3. Check Supabase Auth logs for OTP code
4. Enter OTP and verify

**Note:** For SMS OTP to work, configure Twilio in Supabase Auth settings.

### Step 5: Test the App

You should now see:
- ✅ Home screen with 3 test deliveries
- ✅ "Next Up" card with white border
- ✅ Earnings: ₹0 (no deliveries completed yet)
- ✅ Total deliveries: 3
- ✅ Pull-to-refresh works

## 🎨 What You'll See

### Login Screen
- Pure black background
- Large white input fields
- Massive "SEND OTP" button (white bg, black text)
- High contrast for outdoor readability

### Home Dashboard
- Online/offline indicator
- Today's earnings (₹0 initially)
- Total deliveries count (3)
- "Next Up" delivery card (white border)
- Remaining deliveries list
- Pull-to-refresh

### Profile Screen
- Driver name, phone, status
- Logout button

## 🐛 Troubleshooting

### "No deliveries today"
- Check that test orders were created in Supabase
- Verify batch_id matches between batches and orders
- Pull down to refresh

### Login not working
- Ensure driver exists in Supabase with matching phone
- Check Supabase Auth is enabled
- For SMS OTP, configure Twilio in Supabase

### App won't start
```bash
# Clear cache and restart
npx expo start -c
```

### NativeWind styles not working
```bash
# Reinstall and clear cache
npm install
npx expo start -c
```

## 📱 Test on Physical Device

For best testing (especially camera and GPS):

1. Install Expo Go app on your phone
2. Run `npm start`
3. Scan QR code with Expo Go (Android) or Camera app (iOS)
4. App will load on your device

## 🎯 Next Steps

Once the app is running, you can:

1. **Test offline mode** - Turn off WiFi and see cached data
2. **Add more test orders** - Create orders in Supabase
3. **Implement navigation** - Step 5 (maps & routing)
4. **Add camera** - Step 7 (proof of delivery)

## 📚 Full Documentation

- **Setup Guide:** `SETUP.md`
- **Progress Report:** `../MOBILE_APP_PROGRESS.md`
- **Original Prompt:** `../MOBILE_APP_PROMPT.md`

## 🆘 Need Help?

Check the logs:
```bash
# In the terminal where you ran npm start
# Look for errors in red
```

Common issues:
- **Port already in use:** Kill other Expo processes
- **Module not found:** Run `npm install` again
- **Supabase errors:** Check credentials in `utils/supabase.ts`

## ✅ Success Checklist

- [ ] Dependencies installed
- [ ] Test driver created in Supabase
- [ ] Test orders created
- [ ] App starts without errors
- [ ] Login works with test phone number
- [ ] Home screen shows 3 deliveries
- [ ] Pull-to-refresh works
- [ ] Profile screen shows driver info

If all checked, you're ready to proceed with Step 3 (Offline Storage)! 🎉
