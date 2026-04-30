import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useAuth } from '@/store/auth-context';
import { useTheme } from '@/store/theme-context';
import { supabase, Order } from '@/utils/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function HistoryScreen() {
  const { driver } = useAuth();
  const { colors, isDark } = useTheme();
  const [history, setHistory] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (driver?.id) {
      fetchHistory();
    }
  }, [driver?.id]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('driver_id', driver?.id)
        .in('status', ['delivered', 'failed'])
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.warn('Error fetching history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const renderHistoryItem = ({ item }: { item: Order }) => {
    const isDelivered = item.status === 'delivered';
    const date = new Date(item.updated_at || item.created_at).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const styles = getStyles(colors);

    return (
      <View style={styles.historyCard}>
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons
              name={isDelivered ? 'checkmark-circle' : 'close-circle'}
              size={24}
              color={isDelivered ? colors.success : colors.danger}
            />
            <Text style={styles.customerName}>{item.customer}</Text>
          </View>
          <Text style={styles.timeText}>{date}</Text>
        </View>

        <Text style={styles.addressText} numberOfLines={2}>
          {item.address}
        </Text>

        <View style={styles.cardFooter}>
          <Text style={styles.priceText}>₹{Number(item.total).toFixed(2)}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isDelivered ? colors.successBg : colors.dangerBg },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: isDelivered ? colors.success : colors.danger },
              ]}
            >
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const styles = getStyles(colors);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.text} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Delivery History</Text>
        <Text style={styles.subtitle}>
          {history.length} {history.length === 1 ? 'delivery' : 'deliveries'}
        </Text>
      </View>

      {history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color={colors.border} />
          <Text style={styles.emptyTitle}>No History Yet</Text>
          <Text style={styles.emptyText}>
            Your completed and failed deliveries will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.text}
            />
          }
        />
      )}
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
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  listContent: {
    padding: 24,
  },
  historyCard: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  timeText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  addressText: {
    color: colors.textMuted,
    fontSize: 14,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
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
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 14,
  },
});
