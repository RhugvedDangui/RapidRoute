import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/utils/supabase';

type DeliveryMode = 'delivered' | 'failed';

const FAILURE_REASONS = [
  'Wrong address',
  'Customer unavailable',
  'Access issue',
  'Refused delivery',
  'No payment ready',
  'Damaged package',
  'Wrong item',
  'Customer request',
];

export default function DeliveryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [mode, setMode] = useState<DeliveryMode>('delivered');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [showCamera, setShowCamera] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const takePhoto = async () => {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera access is needed for proof of delivery.');
        return;
      }
    }
    setShowCamera(true);
  };

  const capturePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const pic = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: false });
      if (pic?.uri) {
        setPhoto(pic.uri);
        setShowCamera(false);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const uploadPhotoToSupabase = async (localUri: string): Promise<string | null> => {
    try {
      const fileName = `pod_${id}_${Date.now()}.jpg`;
      const formData = new FormData();
      formData.append('file', { uri: localUri, name: fileName, type: 'image/jpeg' } as any);

      const { data, error } = await supabase.storage
        .from('Orders')
        .upload(fileName, formData as any, { contentType: 'image/jpeg', upsert: true });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('Orders')
        .getPublicUrl(data.path);

      return publicUrlData.publicUrl;
    } catch (err) {
      console.error('Photo upload error:', err);
      return null;
    }
  };

  const handleComplete = async () => {
    if (mode === 'delivered' && !photo) {
      Alert.alert('Photo Required', 'Please take a proof of delivery photo before completing.');
      return;
    }
    if (mode === 'failed' && !selectedReason) {
      Alert.alert('Reason Required', 'Please select a failure reason.');
      return;
    }

    setLoading(true);
    try {
      let photoUrl: string | null = null;

      if (mode === 'delivered' && photo) {
        photoUrl = await uploadPhotoToSupabase(photo);
      }

      const updatePayload: Record<string, any> = {
        status: mode === 'delivered' ? 'delivered' : 'failed',
      };
      if (photoUrl) updatePayload.proof_of_delivery = photoUrl;

      const { error } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', id as string);

      if (error) throw error;

      Alert.alert(
        mode === 'delivered' ? '✓ Delivered!' : 'Delivery Failed',
        mode === 'delivered'
          ? 'Order marked as delivered successfully.'
          : `Reason: ${selectedReason}`,
        [{ text: 'OK', onPress: () => router.replace('/(tabs)/home') }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update order. Will retry when online.');
    } finally {
      setLoading(false);
    }
  };

  // Camera view
  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing="back" />
        <View style={[styles.cameraOverlay, StyleSheet.absoluteFill]}>
          <TouchableOpacity style={styles.captureBtn} onPress={capturePhoto}>
            <View style={styles.captureBtnInner} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelCameraBtn}
            onPress={() => setShowCamera(false)}
          >
            <Text style={styles.cancelCameraText}>CANCEL</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.cameraHint}>
          <Text style={styles.cameraHintText}>Capture proof of delivery</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>DELIVERY #{String(id).slice(-4).toUpperCase()}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Mode Toggle */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'delivered' && styles.modeBtnActive]}
            onPress={() => setMode('delivered')}
          >
            <Text style={[styles.modeBtnText, mode === 'delivered' && styles.modeBtnTextActive]}>
              DELIVERED
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, mode === 'failed' && styles.modeBtnActive]}
            onPress={() => setMode('failed')}
          >
            <Text style={[styles.modeBtnText, mode === 'failed' && styles.modeBtnTextActive]}>
              FAILED
            </Text>
          </TouchableOpacity>
        </View>

        {/* DELIVERED flow */}
        {mode === 'delivered' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PROOF OF DELIVERY</Text>
            <Text style={styles.sectionDesc}>
              Take a photo of the delivered package or handed-to customer
            </Text>

            <TouchableOpacity
              style={[styles.photoBox, photo && styles.photoBoxDone]}
              onPress={takePhoto}
              activeOpacity={0.8}
            >
              {photo ? (
                <>
                  <Text style={styles.photoIcon}>✓</Text>
                  <Text style={styles.photoLabel}>PHOTO CAPTURED</Text>
                  <Text style={styles.photoRetake}>Tap to retake</Text>
                </>
              ) : (
                <>
                  <Text style={styles.photoIcon}>📷</Text>
                  <Text style={styles.photoLabel}>TAKE PHOTO</Text>
                  <Text style={styles.photoRetake}>Required for completion</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* FAILED flow */}
        {mode === 'failed' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>FAILURE REASON</Text>
            <View style={styles.reasonGrid}>
              {FAILURE_REASONS.map((reason) => (
                <TouchableOpacity
                  key={reason}
                  style={[
                    styles.reasonBtn,
                    selectedReason === reason && styles.reasonBtnActive,
                  ]}
                  onPress={() => setSelectedReason(reason)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.reasonText,
                      selectedReason === reason && styles.reasonTextActive,
                    ]}
                  >
                    {reason}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>NOTES (OPTIONAL)</Text>
            <TextInput
              style={[styles.notesInput, { color: '#ffffff' }]}
              placeholder="Add any notes..."
              placeholderTextColor="#52525b"
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        )}

        {/* Complete button */}
        <TouchableOpacity
          style={[styles.completeBtn, loading && styles.completeBtnDisabled]}
          onPress={handleComplete}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#000000" size="small" />
          ) : (
            <Text style={styles.completeBtnText}>
              {mode === 'delivered' ? '✓  COMPLETE DELIVERY' : '✗  MARK AS FAILED'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },

  header: {
    backgroundColor: '#09090b',
    borderBottomWidth: 2,
    borderBottomColor: '#27272a',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backBtn: {
    backgroundColor: '#27272a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '700' },
  headerTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },

  scrollContent: { padding: 24, paddingBottom: 60 },

  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#09090b',
    borderWidth: 2,
    borderColor: '#27272a',
    borderRadius: 16,
    padding: 4,
    marginBottom: 32,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modeBtnActive: { backgroundColor: '#ffffff' },
  modeBtnText: { color: '#a1a1aa', fontSize: 15, fontWeight: '700' },
  modeBtnTextActive: { color: '#000000' },

  section: { marginBottom: 8 },
  sectionTitle: { color: '#a1a1aa', fontSize: 12, fontWeight: '700', marginBottom: 8, letterSpacing: 1 },
  sectionDesc: { color: '#52525b', fontSize: 13, marginBottom: 20 },

  photoBox: {
    borderWidth: 2,
    borderColor: '#27272a',
    borderStyle: 'dashed',
    borderRadius: 20,
    paddingVertical: 56,
    alignItems: 'center',
    backgroundColor: '#09090b',
  },
  photoBoxDone: {
    borderStyle: 'solid',
    borderColor: '#ffffff',
  },
  photoIcon: { fontSize: 48, marginBottom: 12 },
  photoLabel: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  photoRetake: { color: '#a1a1aa', fontSize: 13 },

  reasonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  reasonBtn: {
    borderWidth: 2,
    borderColor: '#27272a',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#09090b',
  },
  reasonBtnActive: { borderColor: '#ffffff', backgroundColor: '#ffffff' },
  reasonText: { color: '#a1a1aa', fontSize: 13, fontWeight: '600' },
  reasonTextActive: { color: '#000000' },

  notesInput: {
    backgroundColor: '#09090b',
    borderWidth: 2,
    borderColor: '#27272a',
    borderRadius: 16,
    padding: 16,
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },

  completeBtn: {
    backgroundColor: '#ffffff',
    paddingVertical: 22,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  completeBtnDisabled: { opacity: 0.5 },
  completeBtnText: { color: '#000000', fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },

  // Camera styles
  cameraContainer: { flex: 1, backgroundColor: '#000000' },
  camera: { flex: 1 },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 60,
    gap: 24,
  },
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'transparent',
    borderWidth: 4,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
  },
  cancelCameraBtn: {
    backgroundColor: '#09090b',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#27272a',
  },
  cancelCameraText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  cameraHint: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  cameraHintText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
});
