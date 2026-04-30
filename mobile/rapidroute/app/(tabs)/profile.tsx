import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { useAuth } from '@/store/auth-context';
import { useTheme } from '@/store/theme-context';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { driver, signOut } = useAuth();
  const { isDark, colors, setTheme, theme } = useTheme();

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={48} color={isDark ? "#000000" : "#ffffff"} />
          </View>
          <Text style={styles.nameText}>{driver?.name || 'Driver'}</Text>
          <Text style={styles.statusBadge}>
            {driver?.status?.toUpperCase() || 'AVAILABLE'}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="call" size={20} color={colors.textMuted} style={styles.icon} />
            <View>
              <Text style={styles.label}>PHONE</Text>
              <Text style={styles.value}>{driver?.phone || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Ionicons name="mail" size={20} color={colors.textMuted} style={styles.icon} />
            <View>
              <Text style={styles.label}>EMAIL</Text>
              <Text style={styles.value}>{driver?.email || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Ionicons name="car" size={20} color={colors.textMuted} style={styles.icon} />
            <View>
              <Text style={styles.label}>VEHICLE ID</Text>
              <Text style={styles.value}>{driver?.vehicle_id || 'N/A'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={[styles.row, { justifyContent: 'space-between' }]}>
            <View style={styles.row}>
              <Ionicons 
                name={isDark ? "moon" : "sunny"} 
                size={20} 
                color={colors.textMuted} 
                style={styles.icon} 
              />
              <Text style={styles.value}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#d4d4d8', true: colors.successBg }}
              thumbColor={isDark ? colors.success : '#f4f3f4'}
            />
          </View>
        </View>

        <TouchableOpacity onPress={signOut} style={styles.button}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} style={{ marginRight: 8 }} />
          <Text style={styles.buttonText}>LOGOUT</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  content: {
    padding: 24,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  nameText: {
    color: colors.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: colors.successBg,
    color: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  card: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 16,
    marginLeft: 36,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 4,
  },
  value: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    flexDirection: 'row',
    backgroundColor: colors.dangerBg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
