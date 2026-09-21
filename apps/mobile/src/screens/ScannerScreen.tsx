import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Platform,
  KeyboardAvoidingView,
  Image,
  Modal,
  Linking,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { api, clearStoredAuth } from '../services/api';
import { RegistrationRecord, ScanHistoryItem } from '../types';
import {
  Zap,
  ZapOff,
  SwitchCamera,
  LogOut,
  History,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  XCircle,
  Camera,
  Search,
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  Calendar,
  Clock,
  MapPin,
  Users,
  CreditCard,
  Banknote,
  ShieldCheck,
  X,
  ChevronRight,
  RotateCcw,
  Check,
  QrCode,
  ExternalLink,
  UserCheck,
} from 'lucide-react-native';

interface ScannerScreenProps {
  user: any;
  onLogout: () => void;
}

export const ScannerScreen: React.FC<ScannerScreenProps> = ({ user, onLogout }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [viewMode, setViewMode] = useState<'lookup' | 'camera' | 'history'>('lookup');

  // Camera settings
  const [torch, setTorch] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');

  // Search & Record State
  const [searchId, setSearchId] = useState('');
  const [searching, setSearching] = useState(false);
  const [activeRecord, setActiveRecord] = useState<RegistrationRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Spot UPI Modal State
  const [upiModalVisible, setUpiModalVisible] = useState(false);
  const [spotUtr, setSpotUtr] = useState('');

  // History State
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);

  // Throttle scanner ref
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

  const recordScanInHistory = (name: string, status: string, amount: number) => {
    const newItem: ScanHistoryItem = {
      id: Date.now().toString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      name,
      status,
      amount,
    };
    setScanHistory((prev) => [newItem, ...prev]);
  };

  const cleanInputId = (raw: string): string => {
    let clean = raw.trim();
    if (clean.startsWith('UHVPASS::')) {
      clean = clean.replace(/^UHVPASS::/, '');
    } else {
      const uuidMatch = clean.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i);
      if (uuidMatch && !clean.includes('::')) {
        clean = uuidMatch[0];
      }
    }
    return clean.trim();
  };

  const handleLookup = async (idToLookUp?: string) => {
    const targetId = cleanInputId(idToLookUp || searchId);
    if (!targetId) {
      Alert.alert('Registration ID Required', 'Please enter or paste an attendee registration ID.');
      return;
    }

    setSearching(true);
    try {
      const record = await api.verifyTicket(targetId);
      setActiveRecord(record);
      setViewMode('lookup'); // Switch to details view

      const ticketFee = Number(record.event?.ticketPrice) || 0;
      const regAmount = Number(record.totalAmount) || 0;
      const isPaid = Boolean(
        record.event?.isPaid === true ||
        ticketFee > 0 ||
        regAmount > 0 ||
        (record.paymentStatus && record.paymentStatus !== 'FREE')
      );
      const isVerified = record.paymentStatus === 'VERIFIED' || record.paymentStatus === 'PAID';

      if (record.isAllCheckedIn || record.checkedIn) {
        triggerHaptic('warning');
      } else if (isPaid && !isVerified) {
        triggerHaptic('error');
      } else {
        triggerHaptic('success');
      }
    } catch (err: any) {
      triggerHaptic('error');
      const msg = err?.response?.data?.message || err?.message || 'Registration not found with that ID.';
      Alert.alert('Applicant Not Found', Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSearching(false);
    }
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    triggerHaptic('success');
    const targetId = cleanInputId(data);
    setSearchId(targetId);

    // Switch back to details view and fetch
    setViewMode('lookup');
    await handleLookup(targetId);

    setTimeout(() => {
      isProcessingRef.current = false;
    }, 1200);
  };

  // 1. Regular Check-In (Supports Individual or Partner Member)
  const handleCheckIn = async (options?: { memberIndex?: number; memberName?: string; admitAll?: boolean }) => {
    if (!activeRecord) return;
    setActionLoading(true);
    try {
      const updated = await api.checkIn(activeRecord.id, options);
      setActiveRecord((prev) => (prev ? { ...prev, ...updated } : null));
      triggerHaptic('success');
      const who = options?.memberName || (options?.admitAll ? 'All Remaining Partners' : activeRecord.fullName);
      recordScanInHistory(who, '✅ Checked In', activeRecord.totalAmount);
      Alert.alert('Entry Granted', `Welcome ${who}! Check-in recorded.`);
    } catch (err: any) {
      triggerHaptic('error');
      Alert.alert('Check-In Failed', err?.response?.data?.message || 'Could not check in attendee.');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Spot Cash Payment & Check In
  const handleSpotCash = async () => {
    if (!activeRecord) return;
    const dueAmount = activeRecord.totalAmount || Number(activeRecord.event?.ticketPrice) || 0;
    Alert.alert(
      'Confirm Spot Cash',
      `Did you collect ₹${dueAmount} in cash from ${activeRecord.fullName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Cash & Check In',
          style: 'default',
          onPress: async () => {
            setActionLoading(true);
            try {
              const updated = await api.spotPayment(activeRecord.id, 'CASH', undefined, { admitAll: true });
              setActiveRecord((prev) => (prev ? { ...prev, ...updated, paymentStatus: 'VERIFIED' } : null));
              triggerHaptic('success');
              recordScanInHistory(activeRecord.fullName, '💵 Spot Cash & In', dueAmount);
              Alert.alert('Cash Confirmed', `Spot cash recorded for ${activeRecord.fullName}. Entry authorized.`);
            } catch (err: any) {
              triggerHaptic('error');
              Alert.alert('Error', err?.response?.data?.message || 'Could not record cash payment.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // 3. Confirm Spot UPI Payment & Check In
  const handleConfirmSpotUpi = async () => {
    if (!activeRecord) return;
    const dueAmount = activeRecord.totalAmount || Number(activeRecord.event?.ticketPrice) || 0;
    setActionLoading(true);
    try {
      const updated = await api.spotPayment(activeRecord.id, 'UPI', spotUtr ? spotUtr.trim() : undefined, { admitAll: true });
      setActiveRecord((prev) => (prev ? { ...prev, ...updated, paymentStatus: 'VERIFIED' } : null));
      triggerHaptic('success');
      recordScanInHistory(activeRecord.fullName, '📱 Spot UPI & In', dueAmount);
      setUpiModalVisible(false);
      setSpotUtr('');
      Alert.alert('UPI Confirmed', `Spot UPI payment confirmed for ${activeRecord.fullName}. Entry authorized.`);
    } catch (err: any) {
      triggerHaptic('error');
      Alert.alert('Error', err?.response?.data?.message || 'Could not record UPI payment.');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Verify Existing Pre-Payment Proof
  const handleVerifyProof = async () => {
    if (!activeRecord) return;
    setActionLoading(true);
    try {
      const updated = await api.verifyPayment(activeRecord.id);
      setActiveRecord((prev) => (prev ? { ...prev, ...updated, paymentStatus: 'VERIFIED' } : null));
      triggerHaptic('success');
      recordScanInHistory(activeRecord.fullName, '✅ Payment Verified', activeRecord.totalAmount);
      Alert.alert('Payment Verified', `Payment status updated to VERIFIED for ${activeRecord.fullName}.`);
    } catch (err: any) {
      triggerHaptic('error');
      Alert.alert('Error', err?.response?.data?.message || 'Could not verify payment.');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Reject / Deny Pass
  const handleReject = async () => {
    if (!activeRecord) return;
    Alert.alert(
      'Confirm Rejection',
      `Are you sure you want to deny entry for ${activeRecord.fullName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject Pass',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await api.rejectRegistration(activeRecord.id);
              setActiveRecord((prev) => (prev ? { ...prev, status: 'REJECTED' } : null));
              triggerHaptic('warning');
              recordScanInHistory(activeRecord.fullName, '❌ Pass Rejected', activeRecord.totalAmount);
              Alert.alert('Pass Rejected', 'Entry has been denied for this pass.');
            } catch (err: any) {
              Alert.alert('Error', err?.response?.data?.message || 'Could not reject pass.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleClearRecord = () => {
    setActiveRecord(null);
    setSearchId('');
  };

  const handleLogoutPress = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
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

  const startCamera = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert('Camera Permission Required', 'Camera permission is needed to scan ticket QR codes.');
        return;
      }
    }
    setViewMode('camera');
  };

  // Compute payment values
  const ticketFee = Number(activeRecord?.event?.ticketPrice) || 0;
  const regAmount = Number(activeRecord?.totalAmount) || 0;
  const isPaidEvent = Boolean(
    activeRecord?.event?.isPaid === true ||
    ticketFee > 0 ||
    regAmount > 0 ||
    (activeRecord?.paymentStatus && activeRecord?.paymentStatus !== 'FREE')
  );
  const isPaymentVerified = isPaidEvent
    ? activeRecord?.paymentStatus === 'VERIFIED' || activeRecord?.paymentStatus === 'PAID'
    : true;
  const isGroup = activeRecord?.ticketType === 'GROUP' || (activeRecord?.groupSize && activeRecord.groupSize > 1);

  // Parse group members safely
  let membersList: any[] = [];
  if (activeRecord?.groupMembers) {
    if (Array.isArray(activeRecord.groupMembers)) {
      membersList = activeRecord.groupMembers;
    } else if (typeof activeRecord.groupMembers === 'string') {
      try {
        membersList = JSON.parse(activeRecord.groupMembers);
      } catch {
        membersList = [activeRecord.groupMembers];
      }
    }
  }

  // --- CAMERA VIEW ---
  if (viewMode === 'camera') {
    return (
      <View style={styles.container}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing={facing}
          enableTorch={torch}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={handleBarcodeScanned}
        />

        {/* Camera Overlay Controls */}
        <View style={styles.cameraHeader}>
          <TouchableOpacity
            style={styles.cameraCloseBtn}
            onPress={() => setViewMode('lookup')}
          >
            <X color="#ffffff" size={20} />
            <Text style={styles.cameraCloseBtnText}>Exit Camera</Text>
          </TouchableOpacity>

          <View style={styles.cameraActions}>
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
          </View>
        </View>

        {/* Reticle Targeting */}
        <View style={styles.reticleContainer}>
          <View style={styles.reticleBox}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <Text style={styles.scanPrompt}>Align ticket QR code inside box</Text>
        </View>
      </View>
    );
  }

  // --- MAIN DASHBOARD VIEW ---
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.logoBadge}>
            <ShieldCheck color="#10b981" size={22} />
          </View>
          <View>
            <Text style={styles.appTitle}>UHV GATE DESK</Text>
            <Text style={styles.appSubtitle} numberOfLines={1}>
              {user?.email || 'admin@tkmce.ac.in'}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogoutPress}>
          <LogOut color="#f87171" size={18} />
          <Text style={styles.logoutBtnText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Mode Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, viewMode === 'lookup' && styles.tabBtnActive]}
          onPress={() => setViewMode('lookup')}
        >
          <Search color={viewMode === 'lookup' ? '#10b981' : '#94a3b8'} size={16} />
          <Text style={[styles.tabBtnText, viewMode === 'lookup' && styles.tabBtnTextActive]}>
            Applicant Lookup
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabBtn}
          onPress={startCamera}
        >
          <Camera color="#94a3b8" size={16} />
          <Text style={styles.tabBtnText}>Scan QR</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, viewMode === 'history' && styles.tabBtnActive]}
          onPress={() => setViewMode('history')}
        >
          <History color={viewMode === 'history' ? '#10b981' : '#94a3b8'} size={16} />
          <Text style={[styles.tabBtnText, viewMode === 'history' && styles.tabBtnTextActive]}>
            History ({scanHistory.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* CONTENT: HISTORY VIEW */}
      {viewMode === 'history' ? (
        <View style={styles.historyContainer}>
          <View style={styles.historyHeader}>
            <Text style={styles.sectionHeading}>GATE SCAN LOG ({scanHistory.length})</Text>
            {scanHistory.length > 0 && (
              <TouchableOpacity onPress={() => setScanHistory([])}>
                <Text style={styles.clearHistoryText}>Clear Log</Text>
              </TouchableOpacity>
            )}
          </View>

          {scanHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <History color="#334155" size={48} />
              <Text style={styles.emptyTitle}>No scans recorded yet</Text>
              <Text style={styles.emptySubtitle}>
                Verified and checked-in attendees will appear here.
              </Text>
            </View>
          ) : (
            <FlatList
              data={scanHistory}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.historyCard}>
                  <View style={styles.historyCardLeft}>
                    <Text style={styles.historyName}>{item.name}</Text>
                    <Text style={styles.historyTime}>{item.time}</Text>
                  </View>
                  <View style={styles.historyCardRight}>
                    <Text style={styles.historyStatus}>{item.status}</Text>
                    {item.amount > 0 && (
                      <Text style={styles.historyAmount}>₹{item.amount}</Text>
                    )}
                  </View>
                </View>
              )}
            />
          )}
        </View>
      ) : (
        /* CONTENT: LOOKUP & APPLICANT DETAILS VIEW */
        <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
          {/* SEARCH / INPUT BAR */}
          <View style={styles.searchCard}>
            <Text style={styles.searchLabel}>ENTER REGISTRATION ID / TICKET PASS</Text>
            <View style={styles.searchRow}>
              <View style={styles.searchInputWrap}>
                <Search color="#64748b" size={18} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Paste UUID or Pass code..."
                  placeholderTextColor="#64748b"
                  value={searchId}
                  onChangeText={setSearchId}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  onSubmitEditing={() => handleLookup()}
                />
                {searchId.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchId('')} style={styles.clearInputBtn}>
                    <X color="#94a3b8" size={16} />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={[styles.verifySearchBtn, searching && styles.btnDisabled]}
                onPress={() => handleLookup()}
                disabled={searching}
              >
                {searching ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.verifySearchBtnText}>Look Up</Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.scanLauncherBtn} onPress={startCamera}>
              <Camera color="#10b981" size={18} />
              <Text style={styles.scanLauncherBtnText}>Or Tap Here to Scan Ticket QR Code</Text>
            </TouchableOpacity>
          </View>

          {/* ACTIVE APPLICANT FULL DETAILS */}
          {activeRecord ? (
            <View style={styles.applicantDetailsCard}>
              {/* Header Badge */}
              <View style={styles.detailsHeader}>
                <View style={styles.passPill}>
                  <Text style={styles.passPillText}>
                    PASS #{(activeRecord.id || '').slice(0, 8).toUpperCase()}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleClearRecord} style={styles.closeRecordBtn}>
                  <RotateCcw color="#94a3b8" size={16} />
                  <Text style={styles.closeRecordBtnText}>Look Up Next</Text>
                </TouchableOpacity>
              </View>

              {/* PAYMENT STATUS BANNER */}
              {isPaidEvent ? (
                isPaymentVerified ? (
                  <View style={styles.successBanner}>
                    <CheckCircle color="#059669" size={24} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.successBannerTitle}>PAYMENT SUCCEEDED &amp; VERIFIED</Text>
                      <Text style={styles.successBannerSub}>
                        Total ₹{activeRecord.totalAmount || ticketFee} confirmed. Authorized for venue entry.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.dangerBanner}>
                    <AlertTriangle color="#dc2626" size={24} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.dangerBannerTitle}>PAYMENT NOT VERIFIED / UNPAID</Text>
                      <Text style={styles.dangerBannerSub}>
                        Fee Due: ₹{activeRecord.totalAmount || ticketFee}. Choose Spot Cash or Spot UPI below.
                      </Text>
                      {activeRecord.paymentReference && (
                        <Text style={styles.dangerRefText}>
                          Claimed UTR: {activeRecord.paymentReference}
                        </Text>
                      )}
                    </View>
                  </View>
                )
              ) : (
                <View style={styles.freeBanner}>
                  <CheckCircle color="#059669" size={24} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.successBannerTitle}>FREE EVENT PASS</Text>
                    <Text style={styles.successBannerSub}>No fee required for this institutional session.</Text>
                  </View>
                </View>
              )}

              {/* CHECK-IN STATUS BANNER */}
              {isGroup ? (
                activeRecord.isAllCheckedIn || activeRecord.checkedIn ? (
                  <View style={styles.alreadyCheckedInBanner}>
                    <CheckCircle color="#10b981" size={22} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.alreadyCheckedInTitle}>ALL TEAM MEMBERS CHECKED IN</Text>
                      <Text style={styles.alreadyCheckedInSub}>
                        All {activeRecord.totalMembers || activeRecord.groupSize || (activeRecord.partnerRoster ? activeRecord.partnerRoster.length : 1)} team members have entered the venue.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.groupProgressBanner}>
                    <Users color="#38bdf8" size={22} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.groupProgressTitle}>
                        TEAM ADMISSION: {activeRecord.checkedInCount || 0} OF {activeRecord.totalMembers || activeRecord.groupSize || (activeRecord.partnerRoster ? activeRecord.partnerRoster.length : 1)} ADMITTED
                      </Text>
                      <Text style={styles.groupProgressSub}>
                        {(activeRecord.totalMembers || activeRecord.groupSize || (activeRecord.partnerRoster ? activeRecord.partnerRoster.length : 1)) - (activeRecord.checkedInCount || 0)} partner(s) remaining outside.
                      </Text>
                    </View>
                  </View>
                )
              ) : activeRecord.checkedIn ? (
                <View style={styles.alreadyCheckedInBanner}>
                  <AlertCircle color="#d97706" size={22} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.alreadyCheckedInTitle}>ALREADY CHECKED IN AT VENUE</Text>
                    <Text style={styles.alreadyCheckedInSub}>
                      Attendee was checked in on{' '}
                      {activeRecord.checkedInAt
                        ? new Date(activeRecord.checkedInAt).toLocaleString()
                        : 'earlier today'}
                      .
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={styles.readyCheckInBanner}>
                  <Check color="#10b981" size={20} />
                  <Text style={styles.readyCheckInText}>Ready for Gate Entry Check-In</Text>
                </View>
              )}

              {/* TARGET SCANNED PARTNER SPOTLIGHT */}
              {Boolean(activeRecord.targetMemberName) && (
                <View style={styles.scannedPartnerCard}>
                  <View style={styles.scannedPartnerHeader}>
                    <QrCode color="#38bdf8" size={18} />
                    <Text style={styles.scannedPartnerBadge}>SCANNED PARTNER PASS</Text>
                  </View>
                  <Text style={styles.scannedPartnerName}>{activeRecord.targetMemberName}</Text>
                  <Text style={styles.scannedPartnerSub}>
                    Partner #{((activeRecord.targetMemberIndex ?? 0) + 1)} of Team Pass
                  </Text>
                  {activeRecord.alreadyCheckedIn ? (
                    <View style={styles.partnerCheckedInBadge}>
                      <CheckCircle color="#10b981" size={16} />
                      <Text style={styles.partnerCheckedInText}>This partner is already checked in</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[styles.admitTargetBtn, actionLoading && styles.btnDisabled]}
                      onPress={() => handleCheckIn({ memberIndex: activeRecord.targetMemberIndex ?? undefined, memberName: activeRecord.targetMemberName ?? undefined })}
                      disabled={actionLoading}
                    >
                      <UserCheck color="#ffffff" size={18} />
                      <Text style={styles.admitTargetBtnText}>Admit {activeRecord.targetMemberName}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* SECTION: ATTENDEE IDENTITY */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionLabel}>APPLICANT IDENTITY</Text>

                <View style={styles.infoRow}>
                  <User color="#10b981" size={18} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoSub}>Full Name</Text>
                    <Text style={styles.infoMainBold}>{activeRecord.fullName}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Mail color="#94a3b8" size={18} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoSub}>Email Address</Text>
                    <Text style={styles.infoMain}>{activeRecord.email}</Text>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <Phone color="#94a3b8" size={18} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoSub}>Phone Number</Text>
                    <Text style={styles.infoMain}>{activeRecord.phone}</Text>
                  </View>
                </View>

                {activeRecord.institution && (
                  <View style={styles.infoRow}>
                    <Building color="#94a3b8" size={18} />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoSub}>College / Institution</Text>
                      <Text style={styles.infoMain}>{activeRecord.institution}</Text>
                    </View>
                  </View>
                )}

                {activeRecord.designation && (
                  <View style={styles.infoRow}>
                    <Briefcase color="#94a3b8" size={18} />
                    <View style={styles.infoContent}>
                      <Text style={styles.infoSub}>Designation / Department</Text>
                      <Text style={styles.infoMain}>{activeRecord.designation}</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* SECTION: EVENT DETAILS */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionLabel}>EVENT DETAILS</Text>

                <Text style={styles.eventTitleText}>
                  {activeRecord.event?.title || 'UHV Cell Event'}
                </Text>

                <View style={styles.detailGrid}>
                  <View style={styles.detailGridItem}>
                    <Calendar color="#10b981" size={16} />
                    <Text style={styles.detailGridText}>
                      {activeRecord.event?.eventDate
                        ? new Date(activeRecord.event.eventDate).toLocaleDateString()
                        : 'Scheduled Date'}
                    </Text>
                  </View>

                  <View style={styles.detailGridItem}>
                    <Clock color="#10b981" size={16} />
                    <Text style={styles.detailGridText}>
                      {activeRecord.event?.startTime || '10:00 AM'}
                    </Text>
                  </View>

                  <View style={[styles.detailGridItem, { width: '100%' }]}>
                    <MapPin color="#10b981" size={16} />
                    <Text style={styles.detailGridText} numberOfLines={1}>
                      {activeRecord.event?.venue || 'TKMCE Campus'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* SECTION: TICKET & GROUP TYPE */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionLabel}>PASS &amp; ADMISSION TYPE</Text>

                <View style={styles.passTypeRow}>
                  <View style={styles.badgePill}>
                    <Text style={styles.badgePillText}>{activeRecord.ticketType || 'INDIVIDUAL'}</Text>
                  </View>

                  <Text style={styles.groupSizeText}>
                    {isGroup
                      ? `Group Pass • ${activeRecord.groupSize || membersList.length} Attendees`
                      : 'Single Person Admission'}
                  </Text>
                </View>

                {activeRecord.groupName && (
                  <Text style={styles.groupNameText}>Group Name: {activeRecord.groupName}</Text>
                )}

                {/* INTERACTIVE TEAM PARTNER ROSTER */}
                {activeRecord.partnerRoster && activeRecord.partnerRoster.length > 0 ? (
                  <View style={styles.groupMembersList}>
                    <View style={styles.rosterHeaderRow}>
                      <Text style={styles.membersHeading}>TEAM PARTNER ROSTER:</Text>
                      <Text style={styles.rosterProgressBadge}>
                        {activeRecord.checkedInCount || 0}/{activeRecord.totalMembers || activeRecord.partnerRoster.length} Inside
                      </Text>
                    </View>
                    {activeRecord.partnerRoster.map((m) => (
                      <View
                        key={m.index}
                        style={[
                          styles.rosterItemCard,
                          m.isScannedTarget && styles.rosterItemHighlighted,
                        ]}
                      >
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                            <Text style={styles.memberNumber}>{m.index + 1}.</Text>
                            <Text style={styles.memberName}>{m.name}</Text>
                            {m.isLead && (
                              <View style={styles.leadBadge}>
                                <Text style={styles.leadBadgeText}>Lead</Text>
                              </View>
                            )}
                            {m.isScannedTarget && (
                              <View style={styles.scannedBadge}>
                                <Text style={styles.scannedBadgeText}>Scanned</Text>
                              </View>
                            )}
                          </View>
                          {m.checkedInAt && (
                            <Text style={styles.memberSub}>
                              Entered {new Date(m.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                          )}
                        </View>

                        {m.checkedIn ? (
                          <View style={styles.admittedBadge}>
                            <Check color="#10b981" size={14} />
                            <Text style={styles.admittedBadgeText}>Inside</Text>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={[styles.admitSingleBtn, actionLoading && styles.btnDisabled]}
                            onPress={() => handleCheckIn({ memberIndex: m.index, memberName: m.name })}
                            disabled={actionLoading}
                          >
                            <UserCheck color="#ffffff" size={14} />
                            <Text style={styles.admitSingleBtnText}>Admit</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}

                    {!activeRecord.isAllCheckedIn && (
                      <TouchableOpacity
                        style={[styles.admitAllBtn, actionLoading && styles.btnDisabled]}
                        onPress={() => handleCheckIn({ admitAll: true })}
                        disabled={actionLoading}
                      >
                        <Users color="#ffffff" size={16} />
                        <Text style={styles.admitAllBtnText}>Admit All Remaining Partners</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : membersList.length > 0 ? (
                  <View style={styles.groupMembersList}>
                    <Text style={styles.membersHeading}>REGISTERED GROUP MEMBERS:</Text>
                    {membersList.map((m: any, idx: number) => {
                      const mName = typeof m === 'string' ? m : m.name || m.fullName || `Member #${idx + 1}`;
                      const mEmail = typeof m === 'object' ? m.email : '';
                      const mPhone = typeof m === 'object' ? m.phone : '';
                      return (
                        <View key={idx} style={styles.memberItem}>
                          <Text style={styles.memberNumber}>{idx + 1}.</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.memberName}>{mName}</Text>
                            {mEmail ? <Text style={styles.memberSub}>{mEmail}</Text> : null}
                            {mPhone ? <Text style={styles.memberSub}>{mPhone}</Text> : null}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : null}
              </View>

              {/* ACTION BUTTON CONTROLS */}
              <View style={styles.actionsContainer}>
                {/* 1. Normal Check-in (if already verified or free) */}
                {(!activeRecord.checkedIn || (isGroup && !activeRecord.isAllCheckedIn)) && (isPaymentVerified || !isPaidEvent) && (
                  <TouchableOpacity
                    style={[styles.primaryActionBtn, actionLoading && styles.btnDisabled]}
                    onPress={() => handleCheckIn(isGroup ? { admitAll: true } : undefined)}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <>
                        <CheckCircle color="#ffffff" size={20} />
                        <Text style={styles.primaryActionBtnText}>
                          {isGroup ? 'Admit All Team Members' : 'Check In Attendee'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}

                {/* 2. SPOT PAYMENT OPTIONS CARD (if paid event and not verified) */}
                {isPaidEvent && !isPaymentVerified && (
                  <View style={styles.spotPaymentCard}>
                    <Text style={styles.spotCardHeading}>
                      CHOOSE SPOT PAYMENT (₹{activeRecord.totalAmount || ticketFee} DUE)
                    </Text>

                    <View style={styles.spotButtonsRow}>
                      {/* Option A: Spot Cash */}
                      <TouchableOpacity
                        style={[styles.spotCashBtn, actionLoading && styles.btnDisabled]}
                        onPress={handleSpotCash}
                        disabled={actionLoading}
                      >
                        <Banknote color="#000000" size={18} />
                        <Text style={styles.spotCashBtnText}>
                          💵 Spot Cash (₹{activeRecord.totalAmount || ticketFee})
                        </Text>
                      </TouchableOpacity>

                      {/* Option B: Spot UPI (Dynamic QR) */}
                      <TouchableOpacity
                        style={[styles.spotUpiBtn, actionLoading && styles.btnDisabled]}
                        onPress={() => setUpiModalVisible(true)}
                        disabled={actionLoading}
                      >
                        <QrCode color="#ffffff" size={18} />
                        <Text style={styles.spotUpiBtnText}>
                          📱 Spot UPI QR (₹{activeRecord.totalAmount || ticketFee})
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Option C: Verify Pre-Claimed Proof */}
                    <TouchableOpacity
                      style={[styles.secondaryActionBtn, actionLoading && styles.btnDisabled]}
                      onPress={handleVerifyProof}
                      disabled={actionLoading}
                    >
                      <CreditCard color="#10b981" size={16} />
                      <Text style={styles.secondaryActionBtnText}>Verify Pre-Claimed UTR</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* 3. Reject Pass */}
                {activeRecord.status !== 'REJECTED' && (
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={handleReject}
                    disabled={actionLoading}
                  >
                    <XCircle color="#ef4444" size={18} />
                    <Text style={styles.rejectBtnText}>Deny Pass / Reject</Text>
                  </TouchableOpacity>
                )}

                {/* 4. Clear / Next */}
                <TouchableOpacity style={styles.nextBtn} onPress={handleClearRecord}>
                  <RotateCcw color="#94a3b8" size={16} />
                  <Text style={styles.nextBtnText}>Look Up Next Applicant</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* EMPTY STATE INSTRUCTIONS */
            <View style={styles.welcomeCard}>
              <View style={styles.welcomeIconCircle}>
                <Search color="#10b981" size={36} />
              </View>
              <Text style={styles.welcomeTitle}>Gate Operations Ready</Text>
              <Text style={styles.welcomeSubtitle}>
                Type or paste an attendee's Registration ID above, or launch the camera scanner to verify tickets.
              </Text>

              <View style={styles.quickTipsCard}>
                <Text style={styles.quickTipsTitle}>GATE PROCEDURE:</Text>
                <Text style={styles.quickTipItem}>• Scan ticket QR or paste registration ID</Text>
                <Text style={styles.quickTipItem}>• For unpaid passes, choose Spot Cash or Spot UPI QR</Text>
                <Text style={styles.quickTipItem}>• Dynamic UPI QR auto-embeds event UPI ID &amp; exact amount</Text>
                <Text style={styles.quickTipItem}>• Tap 'Check In' to authorize gate entry</Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* SPOT UPI DYNAMIC QR MODAL */}
      {upiModalVisible && activeRecord && (
        <Modal
          visible={upiModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setUpiModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.upiModalContent}>
              <View style={styles.upiModalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={styles.upiIconWrap}>
                    <QrCode color="#10b981" size={20} />
                  </View>
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.upiModalTitle}>Spot UPI Payment</Text>
                    <Text style={styles.upiModalSub}>GPay • PhonePe • Paytm • BHIM</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setUpiModalVisible(false)}
                  style={styles.modalCloseBtn}
                >
                  <X color="#94a3b8" size={20} />
                </TouchableOpacity>
              </View>

              {(() => {
                const dueAmount = activeRecord.totalAmount || ticketFee;
                const eventUpiId = activeRecord.event?.upiId || 'uhvcell@okaxis';
                const eventTitle = activeRecord.event?.title || 'UHV Cell Event';
                const upiUri = `upi://pay?pa=${encodeURIComponent(eventUpiId)}&pn=${encodeURIComponent(eventTitle)}&am=${dueAmount}&cu=INR&tn=${encodeURIComponent('Pass ' + (activeRecord.id || '').slice(0, 8))}`;
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data=${encodeURIComponent(upiUri)}`;

                return (
                  <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
                    <View style={styles.upiQrBox}>
                      <Image
                        source={{ uri: qrUrl }}
                        style={styles.qrImage}
                        resizeMode="contain"
                      />
                      <Text style={styles.upiAmountLabel}>Payable Amount</Text>
                      <Text style={styles.upiAmountText}>₹{dueAmount}</Text>
                    </View>

                    <View style={styles.upiIdRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.upiIdSub}>EVENT UPI ID</Text>
                        <Text style={styles.upiIdMain}>{eventUpiId}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.copyBtn}
                        onPress={() => {
                          Linking.openURL(upiUri).catch(() => {
                            Alert.alert('UPI Address', eventUpiId);
                          });
                        }}
                      >
                        <ExternalLink color="#10b981" size={14} />
                        <Text style={styles.copyBtnText}>Open App</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.utrInputWrap}>
                      <Text style={styles.utrLabel}>TRANSACTION UTR / REF NO. (OPTIONAL):</Text>
                      <TextInput
                        style={styles.utrInput}
                        placeholder="e.g. 427819284912"
                        placeholderTextColor="#64748b"
                        value={spotUtr}
                        onChangeText={setSpotUtr}
                        keyboardType="numeric"
                      />
                    </View>

                    <TouchableOpacity
                      style={[styles.confirmUpiBtn, actionLoading && styles.btnDisabled]}
                      onPress={handleConfirmSpotUpi}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <>
                          <CheckCircle color="#ffffff" size={18} />
                          <Text style={styles.confirmUpiBtnText}>
                            Confirm Payment &amp; Check In
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.cancelUpiBtn}
                      onPress={() => setUpiModalVisible(false)}
                    >
                      <Text style={styles.cancelUpiBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </ScrollView>
                );
              })()}
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#021812',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#064e3b',
    backgroundColor: '#03241b',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#064e3b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  appTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    maxWidth: 180,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutBtnText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#042f24',
    padding: 6,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#064e3b',
  },
  tabBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  tabBtnTextActive: {
    color: '#10b981',
    fontWeight: '800',
  },
  scrollBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchCard: {
    backgroundColor: '#03241b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#064e3b',
    marginBottom: 16,
  },
  searchLabel: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#021812',
    borderWidth: 1,
    borderColor: '#064e3b',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 48,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 13,
  },
  clearInputBtn: {
    padding: 4,
  },
  verifySearchBtn: {
    backgroundColor: '#059669',
    height: 48,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifySearchBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  scanLauncherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  scanLauncherBtnText: {
    color: '#10b981',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
  },
  applicantDetailsCard: {
    backgroundColor: '#03241b',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#064e3b',
    marginBottom: 30,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  passPill: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  passPillText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  closeRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  closeRecordBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  successBanner: {
    flexDirection: 'row',
    backgroundColor: '#064e3b',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  successBannerTitle: {
    color: '#a7f3d0',
    fontSize: 13,
    fontWeight: '800',
  },
  successBannerSub: {
    color: '#d1fae5',
    fontSize: 12,
    marginTop: 2,
  },
  freeBanner: {
    flexDirection: 'row',
    backgroundColor: '#064e3b',
    borderWidth: 1,
    borderColor: '#059669',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  dangerBanner: {
    flexDirection: 'row',
    backgroundColor: '#450a0a',
    borderWidth: 1,
    borderColor: '#dc2626',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  dangerBannerTitle: {
    color: '#fca5a5',
    fontSize: 13,
    fontWeight: '800',
  },
  dangerBannerSub: {
    color: '#fee2e2',
    fontSize: 12,
    marginTop: 2,
  },
  dangerRefText: {
    color: '#fecaca',
    fontSize: 11,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  alreadyCheckedInBanner: {
    flexDirection: 'row',
    backgroundColor: '#451a03',
    borderWidth: 1,
    borderColor: '#d97706',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  alreadyCheckedInTitle: {
    color: '#fde68a',
    fontSize: 13,
    fontWeight: '800',
  },
  alreadyCheckedInSub: {
    color: '#fef3c7',
    fontSize: 12,
    marginTop: 2,
  },
  readyCheckInBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  readyCheckInText: {
    color: '#6ee7b7',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 8,
  },
  groupProgressBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(14, 165, 233, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  groupProgressTitle: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '800',
  },
  groupProgressSub: {
    color: '#bae6fd',
    fontSize: 12,
    marginTop: 2,
  },
  scannedPartnerCard: {
    backgroundColor: '#042f24',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#38bdf8',
    marginBottom: 16,
  },
  scannedPartnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  scannedPartnerBadge: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginLeft: 6,
  },
  scannedPartnerName: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 2,
  },
  scannedPartnerSub: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 10,
  },
  partnerCheckedInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  partnerCheckedInText: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  admitTargetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284c7',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  admitTargetBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
  },
  infoSection: {
    backgroundColor: '#021812',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#064e3b',
    marginBottom: 14,
  },
  sectionLabel: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoSub: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  infoMain: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '500',
  },
  infoMainBold: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
  },
  eventTitleText: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#03241b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#064e3b',
  },
  detailGridText: {
    color: '#94a3b8',
    fontSize: 12,
    marginLeft: 6,
  },
  passTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgePill: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgePillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  groupSizeText: {
    color: '#cbd5e1',
    fontSize: 13,
    marginLeft: 10,
  },
  groupNameText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 6,
  },
  groupMembersList: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#064e3b',
  },
  membersHeading: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  memberNumber: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '800',
    width: 20,
  },
  memberName: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },
  memberSub: {
    color: '#64748b',
    fontSize: 11,
  },
  rosterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  rosterProgressBadge: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '800',
    backgroundColor: '#064e3b',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  rosterItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#03241b',
    borderWidth: 1,
    borderColor: '#064e3b',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  rosterItemHighlighted: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  leadBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  leadBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  scannedBadge: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  scannedBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  admittedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  admittedBadgeText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  admitSingleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  admitSingleBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 4,
  },
  admitAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#064e3b',
    borderWidth: 1,
    borderColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 6,
  },
  admitAllBtnText: {
    color: '#a7f3d0',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 6,
  },
  actionsContainer: {
    marginTop: 6,
    gap: 10,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginLeft: 8,
  },
  spotPaymentCard: {
    backgroundColor: '#042f24',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#059669',
    gap: 10,
  },
  spotCardHeading: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  spotButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  spotCashBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    borderRadius: 10,
  },
  spotCashBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 6,
  },
  spotUpiBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 12,
    borderRadius: 10,
  },
  spotUpiBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 6,
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingVertical: 10,
    borderRadius: 10,
  },
  secondaryActionBtnText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingVertical: 10,
    borderRadius: 12,
  },
  rejectBtnText: {
    color: '#f87171',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  nextBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  welcomeCard: {
    backgroundColor: '#03241b',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#064e3b',
    marginTop: 10,
  },
  welcomeIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#064e3b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  quickTipsCard: {
    width: '100%',
    backgroundColor: '#021812',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#064e3b',
  },
  quickTipsTitle: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  quickTipItem: {
    color: '#cbd5e1',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  historyContainer: {
    flex: 1,
    padding: 16,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeading: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  clearHistoryText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#03241b',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#064e3b',
  },
  historyCardLeft: {
    flex: 1,
  },
  historyName: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
  },
  historyTime: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  historyCardRight: {
    alignItems: 'flex-end',
  },
  historyStatus: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '700',
  },
  historyAmount: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  cameraHeader: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  cameraCloseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cameraCloseBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  cameraActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconBtnActive: {
    backgroundColor: '#059669',
    borderColor: '#10b981',
  },
  reticleContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderColor: '#10b981',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 12 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 12 },
  scanPrompt: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  upiModalContent: {
    backgroundColor: '#03241b',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#064e3b',
    maxHeight: '85%',
  },
  upiModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#064e3b',
    marginBottom: 14,
  },
  upiIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#064e3b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  upiModalTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
  },
  upiModalSub: {
    color: '#94a3b8',
    fontSize: 11,
  },
  modalCloseBtn: {
    padding: 6,
  },
  upiQrBox: {
    backgroundColor: '#021812',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#064e3b',
    marginBottom: 12,
  },
  qrImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  upiAmountLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
  },
  upiAmountText: {
    color: '#34d399',
    fontSize: 24,
    fontWeight: '900',
  },
  upiIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#042f24',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#064e3b',
    marginBottom: 12,
  },
  upiIdSub: {
    color: '#6ee7b7',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  upiIdMain: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  copyBtnText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  utrInputWrap: {
    marginBottom: 14,
  },
  utrLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
  },
  utrInput: {
    backgroundColor: '#021812',
    borderWidth: 1,
    borderColor: '#064e3b',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  confirmUpiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  confirmUpiBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 6,
  },
  cancelUpiBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelUpiBtnText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
});
