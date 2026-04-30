import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/store/auth-context';
import { useTheme } from '@/store/theme-context';
import { supabase, Order, Batch } from '@/utils/supabase';
import * as Network from 'expo-network';

export default function HomeScreen() {
  const { driver, signOut } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [earnings, setEarnings] = useState(0);

  const styles = getStyles(colors);

  useEffect(() => {
    if (!driver?.id) return;

    checkConnectivity();
    fetchTodaysDeliveries();

    const networkSubscription = Network.addNetworkStateListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });

    return () => {
      networkSubscription.remove();
    };
  }, [driver?.id]);

  const checkConnectivity = async () => {
    const networkState = await Network.getNetworkStateAsync();
    setIsOnline(networkState.isConnected ?? false);
  };

  const fetchTodaysDeliveries = async () => {
    try {
      const { data: batchData, error: batchError } = await supabase
        .from('batches')
        .select('*')
        .eq('driver_id', driver?.id)
        .in('status', ['dispatched', 'in_progress', 'out_for_delivery'])
        .limit(1)
        .single();

      if (batchError && batchError.code !== 'PGRST116') {
        console.error('Batch error:', batchError);
        throw batchError;
      }
      setBatch(batchData);

      if (batchData) {
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .eq('batch_id', batchData.id)
          .in('status', ['pending', 'dispatched', 'in_progress', 'out_for_delivery']);

        if (ordersError) throw ordersError;

        // Fetch optimized route sequence
        const { data: routeData } = await supabase
          .from('routes')
          .select('order_sequence')
          .eq('batch_id', batchData.id)
          .single();

        let finalOrders = ordersData || [];

        if (routeData && routeData.order_sequence) {
          try {
            // order_sequence might be a stringified JSON array or an actual array
            const sequence: string[] = typeof routeData.order_sequence === 'string' 
              ? JSON.parse(routeData.order_sequence) 
              : routeData.order_sequence;
              
            finalOrders.sort((a, b) => {
              const indexA = sequence.indexOf(a.id);
              const indexB = sequence.indexOf(b.id);
              const aPos = indexA === -1 ? 9999 : indexA;
              const bPos = indexB === -1 ? 9999 : indexB;
              return aPos - bPos;
            });
          } catch (e) {
            console.warn('Failed to parse route sequence', e);
          }
        } else {
          // Fallback to created_at if no route sequence
          finalOrders.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        }

        setOrders(finalOrders);

        const { data: deliveredOrders } = await supabase
          .from('orders')
          .select('total')
          .eq('batch_id', batchData.id)
          .eq('status', 'delivered');

        const totalEarnings = deliveredOrders?.reduce(
          (sum, order) => sum + Number(order.total),
          0
        ) || 0;
        setEarnings(totalEarnings);
      }
    } catch (error: any) {
      console.error('Error fetching deliveries:', error);
      Alert.alert('Error', 'Failed to load deliveries');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTodaysDeliveries();
  };

  const startBatch = async () => {
    if (!batch) return;
    setLoading(true);
    try {
      // 1. Update batch status in Supabase
      const { error } = await supabase
        .from('batches')
        .update({ status: 'out_for_delivery' })
        .eq('id', batch.id);

      if (error) throw error;
      setBatch({ ...batch, status: 'out_for_delivery' } as Batch);

      // 2. Hit Ngrok endpoint with order IDs
      const orderIds = orders.map(o => o.id);
      
      try {
        await fetch('https://bunion-transpose-tinkling.ngrok-free.dev/api/v1/notify-customers', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
          },
          body: JSON.stringify({ batch_id: batch.id, order_ids: orderIds })
        });
      } catch (err) {
        console.warn('Failed to notify customers:', err);
      }
      
      Alert.alert('Out for Delivery', 'Batch started. Customers have been notified!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start batch');
    } finally {
      setLoading(false);
    }
  };

  const handleStartNavigation = (order: Order) => {
    router.push(`/route/${order.id}`);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => signOut(),
      },
    ]);
  };

  const renderOrderCard = ({ item, index }: { item: Order; index: number }) => {
    const isNext = index === 0;

    return (
      <TouchableOpacity
        style={[styles.orderCard, isNext && styles.orderCardNext]}
        onPress={() => handleStartNavigation(item)}
        activeOpacity={0.7}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderLabel}>
              {isNext ? 'NEXT UP' : `STOP ${index + 1}`}
            </Text>
            <Text style={styles.orderCustomer}>{item.customer}</Text>
          </View>
          <View style={styles.paymentBadge}>
            <Text style={styles.paymentText}>
              {item.payment_type.toUpperCase()}
            </Text>
          </View>
        </View>

        <Text style={styles.orderAddress} numberOfLines={2}>
          {item.address}
        </Text>

        <View style={styles.orderFooter}>
          <View style={styles.orderPriceContainer}>
            <Text style={styles.orderPrice}>
              ₹{Number(item.total).toFixed(2)}
            </Text>
            <Text style={styles.orderWeight}>• {item.weight_kg}kg</Text>
          </View>

          {isNext && (
            <View style={styles.startButton}>
              <Text style={styles.startButtonText}>START →</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.statusText}>
              {isOnline ? '● ONLINE' : '○ OFFLINE'}
            </Text>
            <Text style={styles.driverName}>{driver?.name || 'Driver'}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Text style={styles.logoutText}>LOGOUT</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.stats}>
          <View>
            <Text style={styles.statLabel}>TODAY'S EARNINGS</Text>
            <Text style={styles.statValue}>₹{earnings.toFixed(0)}</Text>
          </View>
          <View>
            <Text style={styles.statLabel}>DELIVERIES</Text>
            <Text style={styles.statValue}>{batch?.total_orders || 0}</Text>
          </View>
        </View>
        
        {batch && batch.status === 'dispatched' && (
          <TouchableOpacity style={styles.startBatchBtn} onPress={startBatch}>
            <Text style={styles.startBatchBtnText}>BEGIN DELIVERY ROUTE →</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={orders}
        renderItem={renderOrderCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={orders.length === 0 ? [styles.listContent, { flex: 1 }] : styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.text}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Deliveries Today</Text>
            <Text style={styles.emptyText}>
              Pull down to refresh or check back later
            </Text>
          </View>
        }
      />
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    backgroundColor: colors.card,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  driverName: {
    color: colors.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 24,
  },
  orderCard: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  orderCardNext: {
    borderColor: colors.text,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  orderInfo: {
    flex: 1,
  },
  orderLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  orderCustomer: {
    color: colors.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  paymentBadge: {
    backgroundColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paymentText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  orderAddress: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 16,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderPrice: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  orderWeight: {
    color: colors.textMuted,
    fontSize: 12,
    marginLeft: 8,
  },
  startButton: {
    backgroundColor: colors.text,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  startButtonText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
  },
  startBatchBtn: {
    backgroundColor: colors.text,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startBatchBtnText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});
