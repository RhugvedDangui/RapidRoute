import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, Driver } from '@/utils/supabase';

const DRIVER_STORAGE_KEY = '@rapidroute_driver';

interface AuthContextType {
  session: { driver_id: string } | null; // lightweight local session
  user: null;
  driver: Driver | null;
  loading: boolean;
  signInWithPhone: (phone: string) => Promise<void>;
  verifyOTP: (phone: string, otp: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<{ driver_id: string } | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore persisted driver session on launch
  useEffect(() => {
    AsyncStorage.getItem(DRIVER_STORAGE_KEY)
      .then((stored) => {
        if (stored) {
          const parsed: Driver = JSON.parse(stored);
          setDriver(parsed);
          setSession({ driver_id: parsed.id });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  /**
   * signInWithPhone — looks up driver by phone number in Supabase.
   * No SMS/OTP required. If found, driver is logged in immediately.
   * Phone must be in E.164 format: +91XXXXXXXXXX
   */
  const signInWithPhone = async (phone: string) => {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .eq('phone', phone)
      .single();

    if (error || !data) {
      throw new Error(
        'No driver account found for this number.\n\nUse one of the test numbers:\n+917890123401\n+917890123402\n+917890123403\n+917890123404'
      );
    }

    // Persist locally
    await AsyncStorage.setItem(DRIVER_STORAGE_KEY, JSON.stringify(data));
    setDriver(data);
    setSession({ driver_id: data.id });
  };

  /**
   * verifyOTP — not used in this flow, kept for API compatibility.
   * Login completes in signInWithPhone directly.
   */
  const verifyOTP = async (_phone: string, _otp: string) => {
    // No-op: direct lookup auth doesn't need OTP verification
  };

  const signOut = async () => {
    await AsyncStorage.removeItem(DRIVER_STORAGE_KEY);
    setDriver(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: null,
        driver,
        loading,
        signInWithPhone,
        verifyOTP,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

