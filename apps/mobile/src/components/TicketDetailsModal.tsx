import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { RegistrationRecord } from '../types';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  UserCheck,
  CreditCard,
  Calendar,
  MapPin,
  Users,
  Banknote,
  X,
} from 'lucide-react-native';

interface TicketDetailsModalProps {
  visible: boolean;
  record: RegistrationRecord | null;
  loadingAction: boolean;
  onClose: () => void;
  onCheckIn: () => void;
  onSpotPayment: () => void;
  onVerifyProof: () => void;
  onReject: () => void;
}

export const TicketDetailsModal: React.FC<TicketDetailsModalProps> = ({
  visible,
  record,
  loadingAction,
  onClose,
  onCheckIn,
  onSpotPayment,
  onVerifyProof,
  onReject,
}) => {
  if (!record) return null;

  const ticketFee = Number(record.event?.ticketPrice) || 0;
  const regAmount = Number(record.totalAmount) || 0;
  const isPaidEvent = Boolean(
    record.event?.isPaid === true ||
    ticketFee > 0 ||
    regAmount > 0 ||
    (record.paymentStatus && record.paymentStatus !== 'FREE')
  );

  const finalDueAmount = regAmount > 0 ? regAmount : ticketFee * (record.groupSize || 1);
  const isPaymentVerified = isPaidEvent
    ? record.paymentStatus === 'VERIFIED' || record.paymentStatus === 'PAID'
    : true;

  const isGroup = record.ticketType === 'GROUP' || (record.groupSize && record.groupSize > 1);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header Bar */}
          <View style={styles.header}>
            <View>
              <Text style={styles.ticketId}>
                PASS #{(record.id || '').slice(0, 8).toUpperCase()}
              </Text>
              <Text style={styles.attendeeName} numberOfLines={1}>
                {record.fullName}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X color="#94a3b8" size={20} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* PRIMARY PAYMENT STATUS BANNER */}
            {isPaidEvent ? (
              isPaymentVerified ? (
                /* Case 1: Paid Event - Pre-Verified */
                <View style={styles.successBanner}>
                  <CheckCircle color="#059669" size={26} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.successBannerTitle}>
                      PAYMENT SUCCEEDED &amp; VERIFIED
                    </Text>
                    <Text style={styles.successBannerSub}>
                      Total ₹{finalDueAmount} was pre-verified by Admin before event. Authorized for entry!
                    </Text>
                  </View>
                </View>
              ) : (
                /* Case 2: Paid Event - Unpaid / Not Verified */
                <View style={styles.dangerBanner}>
                  <AlertTriangle color="#dc2626" size={26} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.dangerBannerTitle}>
                      PAYMENT NOT DONE / UNVERIFIED!
                    </Text>
                    <Text style={styles.dangerBannerSub}>
                      Fee Due: <Text style={{ fontWeight: '900', color: '#7f1d1d' }}>₹{finalDueAmount}</Text>. This participant has NOT been confirmed by Admin.
                    </Text>
                    {record.paymentReference && (
                      <Text style={styles.refBadge}>
                        Claimed UTR: {record.paymentReference}
                      </Text>
                    )}
                  </View>
                </View>
              )
            ) : (
              /* Case 3: Free Event */
              <View style={styles.successBanner}>
                <CheckCircle color="#059669" size={26} style={{ marginTop: 2 }} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.successBannerTitle}>FREE ENTRY PASS</Text>
                  <Text style={styles.successBannerSub}>
                    Free admission event. No registration fee required.
                  </Text>
                </View>
              </View>
            )}

            {/* Check-In Status Pill */}
            {record.checkedIn && (
              <View style={styles.alreadyInAlert}>
                <Text style={styles.alreadyInText}>
                  ⚠️ Already checked in at:{' '}
                  {record.checkedInAt ? new Date(record.checkedInAt).toLocaleTimeString() : 'Earlier'}
                </Text>
              </View>
            )}

            {/* Attendee Info Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>PARTICIPANT DETAILS</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoVal}>{record.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Phone:</Text>
                <Text style={styles.infoVal}>{record.phone}</Text>
              </View>
              {record.institution && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Institution:</Text>
                  <Text style={styles.infoVal}>{record.institution}</Text>
                </View>
              )}
              {record.designation && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Role/Designation:</Text>
                  <Text style={styles.infoVal}>{record.designation}</Text>
                </View>
              )}
            </View>

            {/* Event & Pass Details */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>EVENT &amp; PASS INFO</Text>
              <Text style={styles.eventTitle}>{record.event?.title || 'UHV Event'}</Text>
              <View style={styles.infoRow}>
                <Calendar color="#059669" size={14} />
                <Text style={[styles.infoVal, { marginLeft: 6 }]}>
                  {record.event?.eventDate ? new Date(record.event.eventDate).toLocaleDateString() : 'Event Date'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <MapPin color="#059669" size={14} />
                <Text style={[styles.infoVal, { marginLeft: 6 }]}>{record.event?.venue || 'Campus Venue'}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Pass Type:</Text>
                <Text style={[styles.infoVal, { fontWeight: '700' }]}>
                  {isGroup ? `Group Pass (${record.groupSize || 2} Attendees)` : 'Individual Pass'}
                </Text>
              </View>

              {isGroup && Array.isArray(record.groupMembers) && record.groupMembers.length > 0 && (
                <View style={styles.groupMembersBox}>
                  <Text style={styles.groupMembersTitle}>Team Members:</Text>
                  {record.groupMembers.map((member, i) => (
                    <Text key={i} style={styles.memberItem}>• {member}</Text>
                  ))}
                </View>
              )}
            </View>

            {/* Financial Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>FINANCIAL STATUS</Text>
              <View style={styles.financialGrid}>
                <View style={styles.finCol}>
                  <Text style={styles.finLabel}>Total Due</Text>
                  <Text style={styles.finVal}>{isPaidEvent ? `₹${finalDueAmount}` : 'FREE'}</Text>
                </View>
                <View style={styles.finCol}>
                  <Text style={styles.finLabel}>Payment State</Text>
                  <Text style={[styles.finVal, { color: isPaymentVerified ? '#059669' : '#dc2626' }]}>
                    {isPaidEvent ? (isPaymentVerified ? 'VERIFIED' : 'UNPAID') : 'FREE'}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* GATE ACTION BUTTONS */}
          <View style={styles.footer}>
            {loadingAction ? (
              <ActivityIndicator color="#059669" size="large" style={{ marginVertical: 12 }} />
            ) : isPaidEvent ? (
              isPaymentVerified ? (
                /* Case 1: Verified Payment -> Confirm & Check-In */
                <TouchableOpacity
                  style={[styles.primaryBtn, record.checkedIn && { backgroundColor: '#64748b' }]}
                  onPress={onCheckIn}
                  disabled={record.checkedIn}
                >
                  <UserCheck color="#ffffff" size={20} />
                  <Text style={styles.primaryBtnText}>
                    {record.checkedIn ? 'Already Checked In' : 'Confirm & Check In'}
                  </Text>
                </TouchableOpacity>
              ) : (
                /* Case 2: Unverified Payment -> Spot Payment / Verify / Reject */
                <View style={{ gap: 8 }}>
                  <TouchableOpacity style={styles.spotPayBtn} onPress={onSpotPayment}>
                    <Banknote color="#ffffff" size={20} />
                    <Text style={styles.spotPayBtnText}>
                      Collect Spot ₹{finalDueAmount} &amp; Check In
                    </Text>
                  </TouchableOpacity>

                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity style={styles.verifyProofBtn} onPress={onVerifyProof}>
                      <CheckCircle color="#ffffff" size={16} />
                      <Text style={styles.verifyProofText}>Verify Proof &amp; In</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.rejectBtn} onPress={onReject}>
                      <XCircle color="#dc2626" size={16} />
                      <Text style={styles.rejectBtnText}>Deny Entry</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            ) : (
              /* Case 3: Free Event -> Check In */
              <TouchableOpacity
                style={[styles.primaryBtn, record.checkedIn && { backgroundColor: '#64748b' }]}
                onPress={onCheckIn}
                disabled={record.checkedIn}
              >
                <UserCheck color="#ffffff" size={20} />
                <Text style={styles.primaryBtnText}>
                  {record.checkedIn ? 'Already Checked In' : 'Confirm & Check In'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#0a1512',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#064e3b',
    maxHeight: '90%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  ticketId: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34d399',
    letterSpacing: 1.5,
  },
  attendeeName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  successBanner: {
    flexDirection: 'row',
    backgroundColor: '#ecfdf5',
    borderWidth: 1.5,
    borderColor: '#059669',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  successBannerTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#065f46',
  },
  successBannerSub: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
    lineHeight: 16,
  },
  dangerBanner: {
    flexDirection: 'row',
    backgroundColor: '#fff1f2',
    borderWidth: 1.5,
    borderColor: '#e11d48',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
  },
  dangerBannerTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#9f1239',
  },
  dangerBannerSub: {
    fontSize: 11,
    color: '#be123c',
    marginTop: 2,
    lineHeight: 16,
  },
  refBadge: {
    fontSize: 10,
    fontFamily: 'monospace',
    backgroundColor: 'rgba(225, 29, 72, 0.1)',
    color: '#881337',
    padding: 4,
    borderRadius: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  alreadyInAlert: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  alreadyInText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#0f241d',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6ee7b7',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  infoLabel: {
    fontSize: 12,
    color: '#94a3b8',
    width: 110,
  },
  infoVal: {
    fontSize: 12,
    color: '#e2e8f0',
    flex: 1,
  },
  groupMembersBox: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  groupMembersTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a7f3d0',
    marginBottom: 4,
  },
  memberItem: {
    fontSize: 11,
    color: '#cbd5e1',
    lineHeight: 16,
  },
  financialGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  finCol: {
    flex: 1,
  },
  finLabel: {
    fontSize: 10,
    color: '#94a3b8',
  },
  finVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  primaryBtn: {
    backgroundColor: '#059669',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  spotPayBtn: {
    backgroundColor: '#047857',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  spotPayBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  verifyProofBtn: {
    flex: 1,
    backgroundColor: '#2563eb',
    height: 42,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  verifyProofText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    borderWidth: 1,
    borderColor: '#dc2626',
    height: 42,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  rejectBtnText: {
    color: '#f87171',
    fontSize: 11,
    fontWeight: '800',
  },
});
