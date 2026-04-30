import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { supabase, Order, DelayPrediction } from '@/utils/supabase';

const { height } = Dimensions.get('window');
const BACKEND_URL = 'http://10.88.104.209:8000';

// Leaflet HTML Template
const mapHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
        body { padding: 0; margin: 0; background-color: #000000; overflow: hidden; }
        html, body, #map { height: 100%; width: 100%; }
        /* Monochrome dark mode tile filter */
        .leaflet-tile { filter: grayscale(100%) invert(100%) contrast(120%); }
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var map = L.map('map', { zoomControl: false, attributionControl: false }).setView([15.4989, 73.8278], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
        
        var driverMarker, destMarker, polyline;
        
        // Dest marker icon using an emoji
        var destIcon = L.divIcon({
            className: 'custom-div-icon',
            html: "<div style='background-color:#000; border:2px solid #fff; border-radius:12px; padding:4px; font-size:16px; text-align:center;'>📦</div>",
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        });

        function updateMap(driverLat, driverLng, destLat, destLng, routeStr) {
            if (driverMarker) map.removeLayer(driverMarker);
            driverMarker = L.circleMarker([driverLat, driverLng], {
                radius: 8, color: '#000000', fillColor: '#ffffff', fillOpacity: 1, weight: 3
            }).addTo(map);

            if (destLat && destLng) {
                if (destMarker) map.removeLayer(destMarker);
                destMarker = L.marker([destLat, destLng], { icon: destIcon }).addTo(map);
            }

            if (polyline) map.removeLayer(polyline);
            if (routeStr && routeStr !== '[]') {
                try {
                    var coords = JSON.parse(routeStr);
                    // Leaflet expects [lat, lng]
                    var latLngs = coords.map(c => [c.latitude, c.longitude]);
                    polyline = L.polyline(latLngs, {color: '#ffffff', weight: 4}).addTo(map);
                    
                    // Fit bounds to polyline
                    map.fitBounds(polyline.getBounds(), { paddingBottomRight: [0, 300] });
                } catch(e) {}
            } else if (destLat && destLng) {
                map.fitBounds([ [driverLat, driverLng], [destLat, destLng] ], { paddingBottomRight: [0, 300] });
            } else {
                map.setView([driverLat, driverLng], 15);
            }
        }
    </script>
</body>
</html>
`;

export default function RouteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);

  const [order, setOrder] = useState<Order | null>(null);
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [prediction, setPrediction] = useState<DelayPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [predLoading, setPredLoading] = useState(false);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    loadOrder();
    startLocationTracking();
    return () => locationSubscription.current?.remove();
  }, [id]);

  const loadOrder = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      setOrder(data);

      // Fetch delay prediction for this order from Supabase cache first
      const { data: pred } = await supabase
        .from('delay_predictions')
        .select('*')
        .eq('order_id', id as string)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (pred) setPrediction(pred);
      else fetchDelayPrediction(data);
    } catch (err) {
      console.error('Error loading order:', err);
    } finally {
      setLoading(false);
    }
  };

  const startLocationTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    const current = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setDriverLocation({ latitude: current.coords.latitude, longitude: current.coords.longitude });

    locationSubscription.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
      (loc) => {
        setDriverLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      }
    );
  };

  const fetchDelayPrediction = async (ord: Order) => {
    if (!ord) return;
    setPredLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/predict-delay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: ord.id,
          lat: ord.lat,
          lng: ord.lng,
          weight_kg: ord.weight_kg,
          time_window: ord.time_window,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setPrediction(data);
      }
    } catch (err) {
      console.warn('Delay prediction unavailable (offline?):', err);
    } finally {
      setPredLoading(false);
    }
  };

  const fetchRoute = async (origin: { latitude: number; longitude: number }, dest: { lat: number; lng: number }) => {
    try {
      const OPENROUTE_KEY =
        'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImFkYTk2MzU1NGNiNTQxODg5YmIzMTNiMzk0ZDJlNmU3IiwiaCI6Im11cm11cjY0In0=';
      const res = await fetch(
        `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${OPENROUTE_KEY}&start=${origin.longitude},${origin.latitude}&end=${dest.lng},${dest.lat}`
      );
      const json = await res.json();
      const coords =
        json.features?.[0]?.geometry?.coordinates?.map(([lng, lat]: number[]) => ({ latitude: lat, longitude: lng })) || [];
      setRouteCoords(coords);
    } catch (err) {
      console.warn('Route fetch failed:', err);
    }
  };

  useEffect(() => {
    if (driverLocation && order) {
      fetchRoute(driverLocation, { lat: order.lat, lng: order.lng });
    }
  }, [driverLocation?.latitude, order?.id]);

  // Sync state to WebView Leaflet Map
  useEffect(() => {
    if (driverLocation && webViewRef.current) {
      const script = `updateMap(${driverLocation.latitude}, ${driverLocation.longitude}, ${order?.lat || 'null'}, ${order?.lng || 'null'}, '${JSON.stringify(routeCoords)}'); true;`;
      webViewRef.current.injectJavaScript(script);
    }
  }, [driverLocation, order, routeCoords]);

  const openGoogleMaps = () => {
    if (!order) return;
    Linking.openURL(`https://maps.google.com/?daddr=${order.lat},${order.lng}`);
  };

  const callCustomer = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const whatsappCustomer = (phone: string) => {
    Linking.openURL(`https://wa.me/${phone.replace(/\D/g, '')}`);
  };

  const handleDeliveryAction = () => {
    router.push(`/delivery/${id}`);
  };

  const getRiskColor = (level?: string) => '#ffffff'; // Monochrome
  const getRiskLabel = (level?: string) => {
    if (level === 'high') return '⚠ HIGH DELAY RISK';
    if (level === 'medium') return '~ MODERATE DELAY RISK';
    return '✓ LOW DELAY RISK';
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* WebView Leaflet Map */}
      <View style={StyleSheet.absoluteFill}>
        <WebView
          ref={webViewRef}
          source={{ html: mapHtml }}
          style={{ flex: 1, backgroundColor: '#000000' }}
          scrollEnabled={false}
          bounces={false}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          onLoadEnd={() => {
            // Trigger initial sync once loaded
            if (driverLocation) {
              const script = `updateMap(${driverLocation.latitude}, ${driverLocation.longitude}, ${order?.lat || 'null'}, ${order?.lng || 'null'}, '${JSON.stringify(routeCoords)}'); true;`;
              webViewRef.current?.injectJavaScript(script);
            }
          }}
        />
      </View>

      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>← BACK</Text>
      </TouchableOpacity>

      {/* Delay prediction banner */}
      {(prediction || predLoading) && (
        <View style={styles.predictionBanner}>
          {predLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Text style={styles.predictionLabel}>{getRiskLabel(prediction?.risk_level)}</Text>
              {prediction?.suggested_action ? (
                <Text style={styles.predictionSub} numberOfLines={2}>
                  {prediction.suggested_action}
                </Text>
              ) : null}
            </>
          )}
        </View>
      )}

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        {/* Order info */}
        <View style={styles.orderInfo}>
          <Text style={styles.customerName}>{order?.customer}</Text>
          <Text style={styles.address} numberOfLines={2}>
            {order?.address}
          </Text>
          <View style={styles.badges}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{order?.payment_type?.toUpperCase()}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{order?.weight_kg}KG</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>₹{Number(order?.total ?? 0).toFixed(0)}</Text>
            </View>
          </View>
        </View>

        {/* Action buttons row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => order && callCustomer('+919876543210')}
          >
            <Text style={styles.actionIcon}>📞</Text>
            <Text style={styles.actionLabel}>CALL</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => order && whatsappCustomer('+919876543210')}
          >
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionLabel}>WHATSAPP</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={openGoogleMaps}>
            <Text style={styles.actionIcon}>🗺</Text>
            <Text style={styles.actionLabel}>MAPS</Text>
          </TouchableOpacity>
        </View>

        {/* Primary CTA */}
        <TouchableOpacity style={styles.deliverBtn} onPress={handleDeliveryAction}>
          <Text style={styles.deliverBtnText}>MARK DELIVERY →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  loading: { flex: 1, backgroundColor: '#000000', alignItems: 'center', justifyContent: 'center' },
  map: { flex: 1 },

  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 40,
    left: 16,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#27272a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  backBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },

  driverDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: '#000000',
  },
  destMarker: {
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  destMarkerText: { fontSize: 20 },

  predictionBanner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 40,
    right: 16,
    backgroundColor: '#09090b',
    borderWidth: 2,
    borderColor: '#27272a',
    borderRadius: 12,
    padding: 12,
    maxWidth: 200,
  },
  predictionLabel: { color: '#ffffff', fontSize: 12, fontWeight: '700' },
  predictionSub: { color: '#a1a1aa', fontSize: 11, marginTop: 4 },

  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#09090b',
    borderTopWidth: 2,
    borderTopColor: '#27272a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },

  orderInfo: { marginBottom: 20 },
  customerName: { color: '#ffffff', fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  address: { color: '#a1a1aa', fontSize: 14, marginBottom: 12 },
  badges: { flexDirection: 'row', gap: 8 },
  badge: {
    backgroundColor: '#27272a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { color: '#ffffff', fontSize: 12, fontWeight: '600' },

  actionRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  actionBtn: { alignItems: 'center', flex: 1 },
  actionIcon: { fontSize: 28, marginBottom: 4 },
  actionLabel: { color: '#a1a1aa', fontSize: 11, fontWeight: '600' },

  deliverBtn: {
    backgroundColor: '#ffffff',
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  deliverBtnText: { color: '#000000', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
});
