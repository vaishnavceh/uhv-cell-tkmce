import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '../../api/client';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useToast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useMutation } from '@tanstack/react-query';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  CreditCard,
  Shield,
  QrCode,
  Scan,
  UserCheck,
  History,
  Calendar,
  MapPin,
  Users,
  Banknote,
  Printer,
  Copy,
  X,
} from 'lucide-react';
import { TicketPassModal } from '../../components/common/TicketPassModal';

export const TicketScanner: React.FC = () => {
  usePageTitle('Event Ticket Scanner');
  const { showToast } = useToast();

  const [isScanning, setIsScanning] = useState(true);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [manualId, setManualId] = useState('');
  const [regDetails, setRegDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showSpotUpiModal, setShowSpotUpiModal] = useState(false);
  const [spotUtr, setSpotUtr] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  const [scanHistory, setScanHistory] = useState<
    Array<{
      time: Date;
      name: string;
      status: string;
    }>
  >([]);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const playBeep = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch {}
  }, []);

  const fetchRegistration = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/events/registrations/verify/${id}`);
      const data = response.data;
      setRegDetails(data);
      if (data) {
        const ticketFee = Number(data.event?.ticketPrice) || 0;
        const regAmount = Number(data.totalAmount) || 0;
        const isPaid = Boolean(
          data.event?.isPaid === true ||
          data.event?.isPaid === 'true' ||
          ticketFee > 0 ||
          regAmount > 0 ||
          (data.paymentStatus && data.paymentStatus !== 'FREE')
        );
        const isVerified = data.paymentStatus === 'VERIFIED' || data.paymentStatus === 'PAID';

        let statusTag = '✅ verified pass';
        if (data.checkedIn) {
          statusTag = '⚠️ already in';
        } else if (isPaid && !isVerified) {
          statusTag = '⚠️ payment not done';
        } else if (!isPaid) {
          statusTag = '🎟️ free pass';
        }

        setScanHistory((prev) => [
          {
            time: new Date(),
            name: data.fullName || 'Unknown Attendee',
            status: statusTag,
          },
          ...prev,
        ]);
      }
    } catch (error: any) {
      showToast(error?.response?.data?.message || 'Registration not found or invalid ticket', 'error');
      setRegDetails({ error: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleScan = useCallback(
    (decodedText: string) => {
      playBeep();
      setScannedData(decodedText);
      setIsScanning(false);

      let clean = decodedText.trim();
      if (clean.startsWith('UHVPASS::')) {
        clean = clean.replace(/^UHVPASS::/, '');
      } else {
        const uuidMatch = clean.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i);
        if (uuidMatch) {
          clean = uuidMatch[0];
        }
      }

      fetchRegistration(clean);
    },
    [playBeep]
  );

  useEffect(() => {
    if (!isScanning || scannedData) return;

    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      {
        fps: 10,
        qrbox: { width: 280, height: 280 },
        aspectRatio: 1,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        rememberLastUsedCamera: true,
      },
      false
    );

    scanner.render(
      (decodedText) => {
        handleScan(decodedText);
        scanner.clear().catch(() => {});
      },
      () => {
        // Ignore per-frame scan reading attempts
      }
    );

    scannerRef.current = scanner;

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [isScanning, scannedData, handleScan]);

  const resetScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
      scannerRef.current = null;
    }
    setScannedData(null);
    setRegDetails(null);
    setIsScanning(true);
    setManualId('');
  };

  const verifyPaymentMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/events/registrations/${id}/verify-payment`, { status: 'VERIFIED' }),
    onSuccess: (data) => {
      showToast('Payment verified successfully!', 'success');
      setRegDetails((prev: any) => ({
        ...prev,
        ...data.data,
        event: data.data.event || prev?.event,
      }));
    },
    onError: () => {
      showToast('Failed to verify payment', 'error');
    },
  });

  const checkInMutation = useMutation({
    mutationFn: (params: { id: string; memberIndex?: number; memberName?: string; admitAll?: boolean } | string) => {
      const id = typeof params === 'string' ? params : params.id;
      const body = typeof params === 'string' ? {} : { memberIndex: params.memberIndex, memberName: params.memberName, admitAll: params.admitAll };
      return apiClient.patch(`/events/registrations/${id}/check-in`, body);
    },
    onSuccess: (data) => {
      showToast('Check-in recorded! Entry permitted.', 'success');
      setRegDetails((prev: any) => ({
        ...prev,
        ...data.data,
        event: data.data.event || prev?.event,
      }));
      setScanHistory((prev) => {
        const newHistory = [...prev];
        if (newHistory.length > 0) {
          newHistory[0].status = '✅ checked in';
        }
        return newHistory;
      });
    },
    onError: () => {
      showToast('Failed to check in attendee', 'error');
    },
  });

  const spotPaymentMutation = useMutation({
    mutationFn: ({ id, paymentMethod, reference, admitAll, memberIndex }: { id: string; paymentMethod: 'CASH' | 'UPI'; reference?: string; admitAll?: boolean; memberIndex?: number }) =>
      apiClient.patch(`/events/registrations/${id}/spot-payment`, { paymentMethod, reference, admitAll, memberIndex }),
    onSuccess: (data, variables) => {
      showToast(
        variables.paymentMethod === 'UPI'
          ? 'Spot UPI payment confirmed & attendee checked in!'
          : 'Spot cash collected & attendee checked in!',
        'success'
      );
      setRegDetails((prev: any) => ({
        ...prev,
        ...data.data,
        event: data.data.event || prev?.event,
      }));
      setScanHistory((prev) => {
        const newHistory = [...prev];
        if (newHistory.length > 0) {
          newHistory[0].status = variables.paymentMethod === 'UPI' ? '📱 spot upi & in' : '💵 spot cash & in';
        }
        return newHistory;
      });
      setShowSpotUpiModal(false);
      setSpotUtr('');
    },
    onError: () => {
      showToast('Failed to record spot payment', 'error');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/events/registrations/${id}`, { status: 'REJECTED' }),
    onSuccess: (data) => {
      showToast('Pass rejected. Entry denied.', 'info');
      setRegDetails((prev: any) => ({
        ...prev,
        ...data.data,
        event: data.data.event || prev?.event,
      }));
      setScanHistory((prev) => {
        const newHistory = [...prev];
        if (newHistory.length > 0) {
          newHistory[0].status = '❌ rejected';
        }
        return newHistory;
      });
    },
    onError: () => {
      showToast('Failed to reject registration', 'error');
    },
  });

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
    }
    handleScan(manualId);
  };

  // ROBUST PAID EVENT DETECTION:
  // An event/ticket is PAID if:
  // 1. event.isPaid is true
  // 2. ticketPrice > 0
  // 3. registration totalAmount > 0
  // 4. paymentStatus is not 'FREE' (e.g. 'PENDING', 'VERIFIED', 'PAID')
  const ticketFee = Number(regDetails?.event?.ticketPrice) || 0;
  const regAmount = Number(regDetails?.totalAmount) || 0;
  const isPaidEvent = Boolean(
    regDetails?.event?.isPaid === true ||
    regDetails?.event?.isPaid === 'true' ||
    ticketFee > 0 ||
    regAmount > 0 ||
    (regDetails?.paymentStatus && regDetails?.paymentStatus !== 'FREE')
  );

  const finalDueAmount = regAmount > 0 ? regAmount : (ticketFee * (regDetails?.groupSize || 1));

  // Payment is verified ONLY if:
  // - Event is purely free (!isPaidEvent)
  // - OR if paid, paymentStatus is explicitly 'VERIFIED' or 'PAID'
  const isPaymentVerified = isPaidEvent
    ? (regDetails?.paymentStatus === 'VERIFIED' || regDetails?.paymentStatus === 'PAID')
    : true;

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-emerald-900/10 shadow-subtle p-6">
        <div className="flex items-center gap-3 mb-2">
          <Scan className="w-8 h-8 text-emerald-700" />
          <h1 className="text-2xl font-bold text-slate-900">Event Ticket Scanner</h1>
        </div>
        <p className="text-slate-500 text-sm">
          Scan attendee ticket QR codes at the gate. If payment was pre-verified by Admin, entry is authorized immediately. Otherwise, collect spot payment or reject the pass.
        </p>
      </div>

      {!scannedData ? (
        <div className="space-y-6">
          {/* Live Camera Scanner Box */}
          <div className="bg-white rounded-2xl border border-emerald-900/10 shadow-subtle p-6 overflow-hidden">
            <div id="qr-reader" className="w-full"></div>
          </div>

          {/* Manual Entry Fallback */}
          <div className="bg-white rounded-2xl border border-emerald-900/10 shadow-subtle p-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-emerald-600" /> Manual Ticket Verification
            </h3>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder="Enter Ticket Code (e.g. UHV-ABCD1234), UUID, Phone, or Email"
                className="flex-1 px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-mono"
              />
              <Button type="submit" disabled={!manualId.trim()} className="bg-emerald-700 hover:bg-emerald-800 text-white">
                Verify
              </Button>
            </form>
          </div>
        </div>
      ) : (
        /* Scanned Ticket Result Card */
        <div className="bg-white rounded-2xl border border-emerald-900/10 shadow-subtle p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mb-4" />
              <p className="text-slate-500 text-sm">Verifying ticket in database...</p>
            </div>
          ) : regDetails?.error ? (
            <div className="text-center py-8">
              <XCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">Invalid Ticket</h2>
              <p className="text-slate-500 text-sm mb-6">The scanned QR code is not registered or not found in the system.</p>
              <Button onClick={resetScanner} className="bg-slate-800 hover:bg-slate-900 text-white">
                <RefreshCw className="w-4 h-4 mr-2" /> Scan Next Ticket
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* PRIMARY PAYMENT STATUS BANNER */}
              {isPaidEvent ? (
                isPaymentVerified ? (
                  /* Case 1: Paid Event - Payment Verified */
                  <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-950 p-4 rounded-2xl flex items-start gap-3 shadow-sm">
                    <CheckCircle className="w-8 h-8 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-emerald-900">
                          ✅ PAYMENT SUCCEEDED &amp; VERIFIED
                        </h3>
                        <Badge variant="success" size="sm">Pre-Verified by Admin</Badge>
                      </div>
                      <p className="text-xs text-emerald-700 font-medium mt-0.5">
                        Total fee of <strong className="text-emerald-950">₹{finalDueAmount}</strong> was cross-checked and verified by Admin before the event. Guest is authorized for admission!
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Case 2: Paid Event - Payment NOT Verified / Pending */
                  <div className="bg-rose-50 border-2 border-rose-500 text-rose-950 p-4 rounded-2xl flex items-start gap-3 shadow-sm">
                    <AlertTriangle className="w-8 h-8 text-rose-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-rose-900">
                          ⚠️ PAYMENT NOT DONE / UNVERIFIED!
                        </h3>
                        <Badge variant="danger" size="sm">Payment Due: ₹{finalDueAmount}</Badge>
                      </div>
                      <p className="text-xs text-rose-700 font-medium mt-0.5">
                        Amount Due: <strong className="text-sm font-black text-rose-950">₹{finalDueAmount}</strong>. This attendee has NOT been confirmed for payment by Admin.
                      </p>
                      {regDetails.paymentReference ? (
                        <p className="text-[11px] font-mono text-rose-800 mt-1 bg-rose-100/70 p-1.5 rounded inline-block">
                          Claimed UTR/Ref: <strong>{regDetails.paymentReference}</strong> (Unverified)
                        </p>
                      ) : (
                        <p className="text-[11px] text-rose-800 mt-1 italic">
                          No payment transaction reference was provided during registration.
                        </p>
                      )}
                    </div>
                  </div>
                )
              ) : (
                /* Case 3: Free Event */
                <div className="bg-emerald-50 border-2 border-emerald-500 text-emerald-950 p-4 rounded-2xl flex items-start gap-3 shadow-sm">
                  <CheckCircle className="w-8 h-8 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-emerald-900">
                        🎟️ FREE ADMISSION PASS
                      </h3>
                      <Badge variant="success" size="sm">Free Admission</Badge>
                    </div>
                    <p className="text-xs text-emerald-700 font-medium mt-0.5">
                      Free admission event. No registration fee required. Entry authorized!
                    </p>
                  </div>
                </div>
              )}

              {/* Status Header */}
              <div className="text-center pb-4 border-b border-slate-100">
                <h2 className="text-2xl font-bold text-slate-900 mb-1">
                  {regDetails.fullName || 'Attendee'}
                </h2>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  <Badge variant={regDetails.checkedIn ? 'warning' : 'success'}>
                    {regDetails.checkedIn ? 'Already Checked In' : 'Ready for Check-In'}
                  </Badge>

                  <Badge variant={isPaidEvent ? (isPaymentVerified ? 'success' : 'danger') : 'success'}>
                    {isPaidEvent
                      ? isPaymentVerified
                        ? 'Payment Verified'
                        : 'Payment Unverified'
                      : 'Free Entry'}
                  </Badge>

                  <Badge
                    variant={
                      regDetails.status === 'APPROVED'
                        ? 'success'
                        : regDetails.status === 'REJECTED'
                        ? 'danger'
                        : 'warning'
                    }
                  >
                    Pass {regDetails.status}
                  </Badge>
                </div>

                {regDetails.checkedIn && regDetails.checkedInAt && (
                  <div className="mt-4 bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs sm:text-sm font-medium">
                    ⚠️ Already checked in at: {new Date(regDetails.checkedInAt).toLocaleString('en-IN')}
                  </div>
                )}
              </div>

              {/* Attendee and Event Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Attendee Info */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5 pb-1 border-b border-slate-200">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Participant Info
                  </h3>
                  <div className="text-xs space-y-1.5 text-slate-600">
                    <p><span className="font-semibold text-slate-700">Full Name:</span> {regDetails.fullName}</p>
                    <p><span className="font-semibold text-slate-700">Email:</span> {regDetails.email}</p>
                    <p><span className="font-semibold text-slate-700">Phone:</span> {regDetails.phone}</p>
                    {regDetails.institution && (
                      <p><span className="font-semibold text-slate-700">Institution:</span> {regDetails.institution}</p>
                    )}
                    {regDetails.designation && (
                      <p><span className="font-semibold text-slate-700">Designation:</span> {regDetails.designation}</p>
                    )}
                  </div>
                </div>

                {/* Event Details */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5 pb-1 border-b border-slate-200">
                    <Shield className="w-3.5 h-3.5 text-emerald-600" /> Event Information
                  </h3>
                  <div className="text-xs space-y-1.5 text-slate-600">
                    <p className="font-bold text-slate-800">{regDetails.event?.title || 'Event'}</p>
                    {regDetails.event?.eventDate && (
                      <p className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {new Date(regDetails.event.eventDate).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                    {regDetails.event?.venue && (
                      <p className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {regDetails.event.venue}
                      </p>
                    )}
                    <p>
                      <span className="font-semibold text-slate-700">Ticket Type:</span>{' '}
                      {regDetails.ticketType || 'INDIVIDUAL'} ({regDetails.groupSize || 1} Attendee
                      {(regDetails.groupSize || 1) > 1 ? 's' : ''})
                    </p>
                    <p>
                      <span className="font-semibold text-slate-700">Admission Type:</span>{' '}
                      <span className={`font-bold ${isPaidEvent ? 'text-amber-800' : 'text-emerald-800'}`}>
                        {isPaidEvent ? `Paid Event (₹${ticketFee}/pass)` : 'Free Event'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Group Details & Interactive Partner Roster */}
                {(regDetails.isGroup || regDetails.ticketType === 'GROUP' || (regDetails.groupSize && regDetails.groupSize > 1)) && (
                  <div className="bg-blue-50/80 p-4 rounded-xl border border-blue-200 md:col-span-2 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-blue-200/80">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-700" />
                        <h3 className="font-bold text-xs uppercase tracking-wider text-blue-950">
                          Team Pass: {regDetails.groupName || 'Group Registration'}
                        </h3>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                        {regDetails.checkedInCount ?? (regDetails.checkedIn ? regDetails.groupSize : 0)} / {regDetails.totalMembers || regDetails.groupSize || 2} Admitted
                      </span>
                    </div>

                    {/* Spotlight Scanned Partner Banner (if an individual partner pass was scanned) */}
                    {regDetails.targetMemberName && (
                      <div className="bg-emerald-900 text-white p-3 rounded-xl flex flex-wrap items-center justify-between gap-2 shadow-sm">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300 block">
                            🎯 Scanned Partner Pass:
                          </span>
                          <span className="text-sm font-black text-white">
                            {regDetails.targetMemberName}
                          </span>
                        </div>
                        <div>
                          {regDetails.alreadyCheckedIn ? (
                            <span className="text-xs font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-500/40 inline-flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> Already Admitted
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() =>
                                checkInMutation.mutate({
                                  id: regDetails.id,
                                  memberIndex: regDetails.targetMemberIndex ?? undefined,
                                  memberName: regDetails.targetMemberName,
                                })
                              }
                              disabled={checkInMutation.isPending || (isPaidEvent && !isPaymentVerified)}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow"
                            >
                              <UserCheck className="w-4 h-4 mr-1" /> Admit {regDetails.targetMemberName}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Interactive Team Partner Roster */}
                    <div className="space-y-2 pt-1">
                      <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                        Team Member Attendance Roster:
                      </span>

                      {(regDetails.partnerRoster && regDetails.partnerRoster.length > 0
                        ? regDetails.partnerRoster
                        : [
                            { index: 0, name: regDetails.fullName, isLead: true, checkedIn: regDetails.checkedIn },
                            ...(Array.isArray(regDetails.groupMembers)
                              ? regDetails.groupMembers.map((m: string, i: number) => ({
                                  index: i + 1,
                                  name: m,
                                  isLead: false,
                                  checkedIn: regDetails.checkedIn,
                                }))
                              : []),
                          ]
                      ).map((member: any) => (
                        <div
                          key={member.index}
                          className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 ${
                            member.isScannedTarget
                              ? 'bg-emerald-50 border-emerald-400 ring-1 ring-emerald-300'
                              : member.checkedIn
                              ? 'bg-slate-100/70 border-slate-200'
                              : 'bg-white border-blue-100'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                member.checkedIn ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {member.index + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-900 truncate">{member.name}</span>
                                {member.isLead && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-200">
                                    Lead
                                  </span>
                                )}
                                {member.isScannedTarget && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    Scanned Pass
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 block">
                                {member.checkedIn
                                  ? `Entered ${member.checkedInAt ? new Date(member.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'earlier today'}`
                                  : 'Awaiting venue gate entry'}
                              </span>
                            </div>
                          </div>

                          <div>
                            {member.checkedIn ? (
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-1 rounded border border-emerald-200 inline-flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Admitted
                              </span>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() =>
                                  checkInMutation.mutate({
                                    id: regDetails.id,
                                    memberIndex: member.index,
                                    memberName: member.name,
                                  })
                                }
                                disabled={checkInMutation.isPending || (isPaidEvent && !isPaymentVerified)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1 px-3"
                              >
                                Admit
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Bulk Group Check-In Button */}
                    {!regDetails.isAllCheckedIn && (
                      <div className="pt-1 flex flex-wrap items-center justify-between gap-2 border-t border-blue-200/60">
                        <span className="text-[11px] text-blue-900">
                          {regDetails.totalMembers - (regDetails.checkedInCount || 0)} partners still outside.
                        </span>
                        <Button
                          size="sm"
                          onClick={() => checkInMutation.mutate({ id: regDetails.id, admitAll: true })}
                          disabled={checkInMutation.isPending || (isPaidEvent && !isPaymentVerified)}
                          className="bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center gap-1.5"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          Admit All Remaining Partners ({regDetails.totalMembers - (regDetails.checkedInCount || 0)})
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Payment Information */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 md:col-span-2 space-y-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5 pb-1 border-b border-slate-200">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" /> Payment &amp; Financial Verification
                  </h3>
                  <div className="text-xs grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-700">
                    <div>
                      <span className="block text-slate-400 font-medium">Total Amount Due</span>
                      <span className="font-bold text-sm text-slate-900">
                        {isPaidEvent ? `₹${finalDueAmount}` : 'FREE'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-400 font-medium">Verification State</span>
                      <span className="font-bold uppercase text-slate-900">
                        {isPaidEvent
                          ? isPaymentVerified
                            ? '✅ Verified by Admin'
                            : '⚠️ Not Verified'
                          : 'Free Entry'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-400 font-medium">Payment Reference / UTR</span>
                      <span className="font-mono font-semibold text-slate-800 truncate block" title={regDetails.paymentReference || regDetails.uploadReference}>
                        {regDetails.paymentReference || regDetails.uploadReference || 'None Provided'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* GATE ACTIONS */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                {isPaidEvent ? (
                  isPaymentVerified ? (
                    /* Case 1: Paid Event - Already Verified */
                    <div className="space-y-2">
                      {!(regDetails.isGroup || regDetails.ticketType === 'GROUP' || (regDetails.groupSize && regDetails.groupSize > 1)) && (
                        !regDetails.checkedIn ? (
                          <Button
                            onClick={() => checkInMutation.mutate(regDetails.id)}
                            disabled={checkInMutation.isPending}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 text-sm shadow-md flex items-center justify-center gap-2"
                          >
                            <UserCheck className="w-5 h-5" /> Confirm &amp; Check In Attendee
                          </Button>
                        ) : (
                          <div className="text-center text-xs text-amber-700 font-semibold bg-amber-50 py-2 rounded-lg border border-amber-200">
                            Attendee has already entered.
                          </div>
                        )
                      )}

                      <div className="flex gap-2">
                        {regDetails.status !== 'REJECTED' && (
                          <Button
                            onClick={() => rejectMutation.mutate(regDetails.id)}
                            disabled={rejectMutation.isPending}
                            variant="outline"
                            size="sm"
                            className="flex-1 border-rose-300 text-rose-600 hover:bg-rose-50 text-xs"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Revoke / Reject Pass
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Case 2: Paid Event - NOT Verified / Unpaid */
                    <div className="space-y-3">
                      <div className="bg-amber-50/80 p-3.5 rounded-xl border border-amber-200 space-y-2">
                        <p className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                          <Banknote className="w-4 h-4 text-amber-700" /> Choose Gate Action for Unpaid Pass:
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {/* Option 1: Collect Spot Cash & Check In */}
                          <Button
                            onClick={() => {
                              if (confirm(`Confirm cash collection of ₹${finalDueAmount} from ${regDetails.fullName}${regDetails.isGroup ? ' (Full Team)' : ''}?`)) {
                                spotPaymentMutation.mutate({ id: regDetails.id, paymentMethod: 'CASH', admitAll: true });
                              }
                            }}
                            disabled={spotPaymentMutation.isPending}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 shadow-sm flex items-center justify-center gap-1.5"
                          >
                            <Banknote className="w-4 h-4" /> Spot Cash ₹{finalDueAmount}
                          </Button>

                          {/* Option 2: Spot UPI Dynamic QR Code */}
                          <Button
                            onClick={() => setShowSpotUpiModal(true)}
                            disabled={spotPaymentMutation.isPending}
                            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 shadow-sm flex items-center justify-center gap-1.5"
                          >
                            <QrCode className="w-4 h-4" /> Spot UPI QR ₹{finalDueAmount}
                          </Button>

                          {/* Option 3: Verify Pre-Claimed Ref (if attendee already transferred before gate) */}
                          <Button
                            onClick={() => {
                              verifyPaymentMutation.mutate(regDetails.id);
                              checkInMutation.mutate({ id: regDetails.id, admitAll: true });
                            }}
                            disabled={verifyPaymentMutation.isPending || checkInMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 shadow-sm flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle className="w-4 h-4" /> Verify UTR &amp; In
                          </Button>
                        </div>
                      </div>

                      {/* Option 4: Reject Pass / Deny Entry */}
                      {regDetails.status !== 'REJECTED' && (
                        <Button
                          onClick={() => rejectMutation.mutate(regDetails.id)}
                          disabled={rejectMutation.isPending}
                          variant="outline"
                          className="w-full border-rose-300 text-rose-600 hover:bg-rose-50 font-bold text-xs py-2"
                        >
                          <XCircle className="w-4 h-4 mr-1.5" /> Reject Pass / Deny Entry
                        </Button>
                      )}
                    </div>
                  )
                ) : (
                  /* Case 3: Free Event */
                  <div className="space-y-2">
                    {!(regDetails.isGroup || regDetails.ticketType === 'GROUP' || (regDetails.groupSize && regDetails.groupSize > 1)) && (
                      !regDetails.checkedIn ? (
                        <Button
                          onClick={() => checkInMutation.mutate(regDetails.id)}
                          disabled={checkInMutation.isPending}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 text-sm shadow-md flex items-center justify-center gap-2"
                        >
                          <UserCheck className="w-5 h-5" /> Confirm &amp; Check In Attendee
                        </Button>
                      ) : (
                        <div className="text-center text-xs text-amber-700 font-semibold bg-amber-50 py-2 rounded-lg border border-amber-200">
                          Attendee has already entered.
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* Print Ticket Option for Scanned Attendee */}
                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPrintModal(true)}
                    className="w-full border-slate-300 text-slate-700 hover:bg-slate-50 text-xs flex items-center justify-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" /> View &amp; Print Ticket Pass
                  </Button>
                </div>
              </div>

              <Button onClick={resetScanner} className="w-full bg-slate-900 hover:bg-black text-white mt-2">
                <RefreshCw className="w-4 h-4 mr-2" /> Scan Next Ticket
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Session Scan History */}
      {scanHistory.length > 0 && (
        <div className="bg-white rounded-2xl border border-emerald-900/10 shadow-subtle p-6">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-emerald-600" /> Session Scan History ({scanHistory.length})
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {scanHistory.map((scan, index) => (
              <div
                key={index}
                className="flex justify-between items-center text-xs p-3 bg-slate-50 rounded-xl border border-slate-100"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800">{scan.name}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {scan.time.toLocaleTimeString()}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    scan.status.includes('❌')
                      ? 'bg-red-100 text-red-800'
                      : scan.status.includes('⚠️')
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {scan.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Official Ticket Pass Viewer & Printer Modal */}
      <TicketPassModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        registration={regDetails}
        event={regDetails?.event}
      />

      {/* Spot UPI Dynamic QR Modal */}
      {showSpotUpiModal && regDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-emerald-900/10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Spot UPI Payment</h3>
                  <p className="text-[11px] text-slate-500">Scan via GPay, PhonePe, Paytm, or BHIM</p>
                </div>
              </div>
              <button
                onClick={() => setShowSpotUpiModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {(() => {
              const ticketFee = Number(regDetails.event?.ticketPrice) || 0;
              const regAmount = Number(regDetails.totalAmount) || 0;
              const dueAmount = regAmount > 0 ? regAmount : ticketFee * (regDetails.groupSize || 1);
              const eventUpiId = regDetails.event?.upiId || 'uhvcell@okaxis';
              const eventTitle = regDetails.event?.title || 'UHV Cell Event';
              const upiUri = `upi://pay?pa=${encodeURIComponent(eventUpiId)}&pn=${encodeURIComponent(eventTitle)}&am=${dueAmount}&cu=INR&tn=${encodeURIComponent('Pass ' + (regDetails.id || '').slice(0, 8))}`;
              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(upiUri)}`;

              return (
                <div className="space-y-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex flex-col items-center">
                    <img
                      src={qrUrl}
                      alt="Spot UPI QR"
                      className="w-48 h-48 rounded-lg shadow-sm bg-white p-2 border border-slate-200"
                    />
                    <div className="mt-2 text-center">
                      <span className="text-xs text-slate-500 font-medium">Amount to Pay</span>
                      <p className="text-xl font-extrabold text-emerald-700">₹{dueAmount}</p>
                    </div>
                  </div>

                  <div className="bg-emerald-50/70 p-2.5 rounded-lg border border-emerald-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-emerald-800 font-bold block">EVENT UPI ID</span>
                      <span className="font-mono font-bold text-emerald-950">{eventUpiId}</span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(eventUpiId);
                        setCopiedUpi(true);
                        setTimeout(() => setCopiedUpi(false), 2000);
                      }}
                      className="text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 text-[11px]"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copiedUpi ? 'Copied!' : 'Copy'}
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-700 block">
                      Transaction UTR / Reference No. (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 427819284912"
                      value={spotUtr}
                      onChange={(e) => setSpotUtr(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                    />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSpotUpiModal(false)}
                      className="flex-1 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={spotPaymentMutation.isPending}
                      onClick={() =>
                        spotPaymentMutation.mutate({
                          id: regDetails.id,
                          paymentMethod: 'UPI',
                          reference: spotUtr || undefined,
                        })
                      }
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                    >
                      {spotPaymentMutation.isPending ? 'Confirming...' : 'Confirm & Check In'}
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
