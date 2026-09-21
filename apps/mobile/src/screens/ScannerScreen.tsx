import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  FlatList,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { api, clearStoredAuth } from '../services/api';
import { RegistrationRecord, ScanHistoryItem } from '../types';
import { TicketDetailsModal } from '../components/TicketDetailsModal';
import {
  Zap,
  ZapOff,
  SwitchCamera,
  LogOut,
  Keyboard,
  History,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react-native';

interface ScannerScreenProps {
  user: any;
  onLogout: () => void;
}

export const ScannerScreen: React.FC<ScannerScreenProps> = ({ user, onLogout }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [torch, setTorch] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const [scanned, setScanned] = useState(false);
  const [activeRecord, setActiveRecord] = useState<RegistrationRecord | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Manual entry modal state
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualCode, setManualCode] = useState('');

  // History modal state
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);

  // Throttle scanner so it doesn't trigger 10 times in 1 second
  const isProcessingRef = useRef(false);

  const triggerHaptic = (type: 'success' | 'warning' | 'error') => {
    try {
      if (type === 'success') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (type === 'warning') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {}
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (isProcessingRef.current || scanned || modalVisible) return;

    isProcessingRef.current = true;
    setScanned(true);

    let cleanId = data.trim();
    if (cleanId.startsWith('UHVPASS::')) {
      cleanId = cleanId.split('::')[1];
    } else {
      const uuidMatch = cleanId.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i);
      if (uuidMatch) {
        cleanId = uuidMatch[0];
      }
    }

    await fetchAndDisplayTicket(cleanId);
  };

  const fetchAndDisplayTicket = async (regId: string) => {
    try {
      const record = await api.verifyTicket(regId);
      setActiveRecord(record);
      setModalVisible(true);

      const ticketFee = Number(record.event?.ticketPrice) || 0;
      const regAmount = Number(record.totalAmount) || 0;
      const isPaid = Boolean(
        record.event?.isPaid === true ||
        ticketFee > 0 ||
        regAmount > 0 ||
        (record.paymentStatus && record.paymentStatus !== 'FREE')
      );
      const isVerified = record.paymentStatus === 'VERIFIED' || record.paymentStatus === 'PAID';

      if (record.checkedIn) {
        triggerHaptic('warning');
      } else if (isPaid && !isVerified) {
        triggerHaptic('error');
      } else {
        triggerHaptic('success');
      }
    } catch (err: any) {
      triggerHaptic('error');
      const msg = err?.response?.data?.message || 'Invalid or unregistered ticket pass.';
      Alert.alert('Scan Failed', Array.isArray(msg) ? msg.join(', ') : msg, [
        {
          text: 'Scan Next',
          onPress: () => {
            isProcessingRef.current = false;
            setScanned(false);
          },
        },
      ]);
    }
  };

  const recordScanInHistory = (name: string, status: string, amount: number) => {
    setScanHistory((prev) => [
      {
        id: Math.random().toString(),
        time: new Date().toLocaleTimeString(),
        name,
        status,
        amount,
      },
      ...prev,
    ]);
  };

  const handleCheckIn = async () => {
    if (!activeRecord) return;
    setActionLoading(true);
    try {
      const updated = await api.checkIn(activeRecord.id);
      triggerHaptic('success');
      recordScanInHistory(activeRecord.fullName, '✅ Checked In', activeRecord.totalAmount);
      setActiveRecord({ ...activeRecord, ...updated, checkedIn: true });
      Alert.alert('Admitted', `${activeRecord.fullName} is checked in! Entry authorized.`, [
        { text: 'Scan Next', onPress: closeModalAndResume },
      ]);
    } catch (err: any) {
      triggerHaptic('error');
      Alert.alert('Check-In Error', err?.response?.data?.message || 'Failed to check in attendee.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSpotPayment = async () => {
    if (!activeRecord) return;
    setActionLoading(true);
    try {
      const updated = await api.spotPayment(activeRecord.id);
      triggerHaptic('success');
      recordScanInHistory(activeRecord.fullName, '💵 Spot Paid & Checked In', activeRecord.totalAmount);
      setActiveRecord({ ...activeRecord, ...updated, paymentStatus: 'VERIFIED', checkedIn: true });
      Alert.alert('Payment Recorded', `Spot payment collected! ${activeRecord.fullName} is checked in.`, [
        { text: 'Scan Next', onPress: closeModalAndResume },
      ]);
    } catch (err: any) {
      triggerHaptic('error');
      Alert.alert('Error', err?.response?.data?.message || 'Could not record spot payment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyProof = async () => {
    if (!activeRecord) return;
    setActionLoading(true);
    try {
      await api.verifyPayment(activeRecord.id);
      const updated = await api.checkIn(activeRecord.id);
      triggerHaptic('success');
      recordScanInHistory(activeRecord.fullName, '✅ Proof Verified & In', activeRecord.totalAmount);
      setActiveRecord({ ...activeRecord, ...updated, paymentStatus: 'VERIFIED', checkedIn: true });
      Alert.alert('Verified & Admitted', `Payment confirmed. ${activeRecord.fullName} is checked in.`, [
        { text: 'Scan Next', onPress: closeModalAndResume },
      ]);
    } catch (err: any) {
      triggerHaptic('error');
      Alert.alert('Error', err?.response?.data?.message || 'Failed to verify payment proof.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!activeRecord) return;
    setActionLoading(true);
    try {
      await api.rejectRegistration(activeRecord.id);
      triggerHaptic('warning');
      recordScanInHistory(activeRecord.fullName, '❌ Pass Rejected', activeRecord.totalAmount);
      Alert.alert('Pass Rejected', 'Entry has been denied for this pass.', [
        { text: 'OK', onPress: closeModalAndResume },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not reject pass.');
    } finally {
      setActionLoading(false);
    }
  };

  const closeModalAndResume = () => {
    setModalVisible(false);
    setActiveRecord(null);
    setTimeout(() => {
      isProcessingRef.current = false;
      setScanned(false);
    }, 600);
  };

  const handleManualSubmit = async () => {
    if (!manualCode.trim()) return;
    setManualModalVisible(false);
    await fetchAndDisplayTicket(manualCode.trim());
    setManualCode('');
  };

  const handleLogout = async () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await clearStoredAuth();
          onLogout();
        },
      },
    ]);
  };

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <AlertCircle color="#f59e0b" size={48} />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          The gate scanner requires camera permissions to scan attendee QR codes.
        </Text>
        <TouchableOpacity style={styles.grantBtn} onPress={requestPermission}>
          <Text style={styles.grantBtnText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Live Camera Viewfinder */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing={facing}
        enableTorch={torch}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      {/* Top Floating Control Bar */}
      <View style={styles.topBar}>
        <View style={styles.coordinatorPill}>
          <Text style={styles.coordinatorRole}>GATE COORDINATOR</Text>
          <Text style={styles.coordinatorEmail} numberOfLines={1}>
            {user?.email || 'admin@tkmce.ac.in'}
          </Text>
        </View>

        <View style={styles.topActions}>
          <TouchableOpacity
            style={[styles.iconBtn, torch && styles.iconBtnActive]}
            onPress={() => setTorch(!torch)}
          >
            {torch ? <Zap color="#ffffff" size={20} /> : <ZapOff color="#ffffff" size={20} />}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
          >
            <SwitchCamera color="#ffffff" size={20} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={handleLogout}>
            <LogOut color="#f87171" size={18} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Targeting Reticle */}
      <View style={styles.reticleContainer}>
        <View style={styles.reticleBox}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
        <Text style={styles.scanPrompt}>Align ticket QR code inside box</Text>
      </View>

      {/* Bottom Floating Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.bottomBtn}
          onPress={() => setManualModalVisible(true)}
        >
          <Keyboard color="#ffffff" size={18} />
          <Text style={styles.bottomBtnText}>Manual ID</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomBtn}
          onPress={() => setHistoryModalVisible(true)}
        >
          <History color="#ffffff" size={18} />
          <Text style={styles.bottomBtnText}>
            History ({scanHistory.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Attendee Ticket Verification Modal */}
      <TicketDetailsModal
        visible={modalVisible}
        record={activeRecord}
        loadingAction={actionLoading}
        onClose={closeModalAndResume}
        onCheckIn={handleCheckIn}
        onSpotPayment={handleSpotPayment}
        onVerifyProof={handleVerifyProof}
        onReject={handleReject}
      />

      {/* Manual Entry Fallback Modal */}
      <Modal visible={manualModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manual Ticket Entry</Text>
              <TouchableOpacity onPress={() => setManualModalVisible(false)}>
                <X color="#94a3b8" size={20} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.manualInput}
              placeholder="Enter Registration UUID / ID"
              placeholderTextColor="#64748b"
              value={manualCode}
              onChangeText={setManualCode}
              autoCapitalize="none"
              autoFocus
            />
            <TouchableOpacity style={styles.manualSubmitBtn} onPress={handleManualSubmit}>
              <Text style={styles.manualSubmitText}>Verify Pass</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Scan History Modal */}
      <Modal visible={historyModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Session History ({scanHistory.length})</Text>
              <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
                <X color="#94a3b8" size={20} />
              </TouchableOpacity>
            </View>
            {scanHistory.length === 0 ? (
              <Text style={styles.emptyHistory}>No scans recorded in this session yet.</Text>
            ) : (
              <FlatList
                data={scanHistory}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.historyRow}>
                    <View>
                      <Text style={styles.historyName}>{item.name}</Text>
                      <Text style={styles.historyTime}>{item.time}</Text>
                    </View>
                    <Text style={styles.historyStatus}>{item.status}</Text>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#021812',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 12,
  },
  permissionText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  grantBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  grantBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 32,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  coordinatorPill: {
    backgroundColor: 'rgba(2, 24, 18, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.3)',
    maxWidth: '55%',
  },
  coordinatorRole: {
    fontSize: 9,
    fontWeight: '800',
    color: '#34d399',
    letterSpacing: 1,
  },
  coordinatorEmail: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '600',
    marginTop: 1,
  },
  topActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(2, 24, 18, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnActive: {
    backgroundColor: '#059669',
    borderColor: '#34d399',
  },
  reticleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reticleBox: {
    width: 260,
    height: 260,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: '#34d399',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  scanPrompt: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 34,
    left: 24,
    right: 24,
    flexDirection: 'row',
    gap: 12,
  },
  bottomBtn: {
    flex: 1,
    backgroundColor: 'rgba(6, 40, 30, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.4)',
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bottomBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#06281e',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#059669',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  manualInput: {
    backgroundColor: '#021812',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    color: '#ffffff',
    fontFamily: 'monospace',
    fontSize: 13,
  },
  manualSubmitBtn: {
    backgroundColor: '#059669',
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  manualSubmitText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  emptyHistory: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginVertical: 20,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  historyName: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  historyTime: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
  },
  historyStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34d399',
  },
});
