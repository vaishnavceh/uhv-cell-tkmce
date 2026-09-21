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
} from 'lucide-react';

export const TicketScanner: React.FC = () => {
  usePageTitle('Event Ticket Scanner');
  const { showToast } = useToast();

  const [isScanning, setIsScanning] = useState(true);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [manualId, setManualId] = useState('');
  const [regDetails, setRegDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      setRegDetails(response.data);
      if (response.data) {
        setScanHistory((prev) => [
          {
            time: new Date(),
            name: response.data.fullName || 'Unknown Attendee',
            status: response.data.checkedIn ? '⚠️ already in' : '✅ scanned',
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

      let regId = decodedText.trim();
      if (regId.startsWith('UHVPASS::')) {
        regId = regId.split('::')[1];
      } else {
        const uuidMatch = regId.match(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i);
        if (uuidMatch) {
          regId = uuidMatch[0];
        }
      }

      fetchRegistration(regId);
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
    mutationFn: (id: string) => apiClient.patch(`/events/registrations/${id}/verify-payment`),
    onSuccess: (data) => {
      showToast('Payment verified successfully', 'success');
      setRegDetails(data.data);
    },
    onError: () => {
      showToast('Failed to verify payment', 'error');
    },
  });

  const checkInMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/events/registrations/${id}/check-in`),
    onSuccess: (data) => {
      showToast('Checked in successfully', 'success');
      setRegDetails(data.data);
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

  const rejectMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/events/registrations/${id}`, { status: 'REJECTED' }),
    onSuccess: (data) => {
      showToast('Registration marked as rejected', 'info');
      setRegDetails(data.data);
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

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-emerald-900/10 shadow-subtle p-6">
        <div className="flex items-center gap-3 mb-2">
          <Scan className="w-8 h-8 text-emerald-700" />
          <h1 className="text-2xl font-bold text-slate-900">Event Ticket Scanner</h1>
        </div>
        <p className="text-slate-500 text-sm">
          Scan attendee ticket QR codes to instantly verify payment status and check-in guests at the event venue.
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
                placeholder="Enter Registration ID / UUID"
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
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-900 mb-2">Invalid Ticket</h2>
              <p className="text-slate-500 text-sm mb-6">The scanned QR code is not registered or not found in the system.</p>
              <Button onClick={resetScanner} className="bg-slate-800 hover:bg-slate-900 text-white">
                <RefreshCw className="w-4 h-4 mr-2" /> Scan Next Ticket
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Status Header */}
              <div className="text-center pb-4 border-b border-slate-100">
                {regDetails.checkedIn ? (
                  <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-3" />
                ) : (
                  <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-3" />
                )}
                <h2 className="text-2xl font-bold text-slate-900 mb-1">
                  {regDetails.fullName || 'Attendee'}
                </h2>
                <div className="flex flex-wrap justify-center gap-2 mt-2">
                  <Badge variant={regDetails.checkedIn ? 'warning' : 'success'}>
                    {regDetails.checkedIn ? 'Already Checked In' : 'Valid Pass'}
                  </Badge>

                  {regDetails.paymentStatus === 'VERIFIED' ? (
                    <Badge variant="success">Payment Verified</Badge>
                  ) : regDetails.paymentStatus === 'FREE' ? (
                    <Badge variant="success">Free Pass</Badge>
                  ) : regDetails.paymentStatus === 'PENDING' ? (
                    <Badge variant="warning">Payment Pending</Badge>
                  ) : (
                    <Badge variant="danger">Payment: {regDetails.paymentStatus}</Badge>
                  )}

                  <Badge variant={regDetails.status === 'APPROVED' ? 'success' : regDetails.status === 'REJECTED' ? 'danger' : 'warning'}>
                    {regDetails.status}
                  </Badge>
                </div>

                {regDetails.checkedIn && regDetails.checkedInAt && (
                  <div className="mt-4 bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-xl text-xs sm:text-sm font-medium">
                    ⚠️ Checked in at: {new Date(regDetails.checkedInAt).toLocaleString('en-IN')}
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
                  </div>
                </div>

                {/* Group Details if applicable */}
                {regDetails.ticketType === 'GROUP' && (
                  <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-100 md:col-span-2 space-y-2">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-blue-900 flex items-center gap-1.5 pb-1 border-b border-blue-200">
                      <Users className="w-3.5 h-3.5 text-blue-600" /> Group Pass Details
                    </h3>
                    <div className="text-xs text-blue-900 space-y-1">
                      {regDetails.groupName && (
                        <p><span className="font-semibold">Team Name:</span> {regDetails.groupName}</p>
                      )}
                      <p><span className="font-semibold">Team Lead:</span> {regDetails.fullName}</p>
                      {Array.isArray(regDetails.groupMembers) && regDetails.groupMembers.length > 0 && (
                        <div>
                          <span className="font-semibold">Members:</span>
                          <ul className="list-disc list-inside ml-2 mt-0.5 space-y-0.5 text-slate-700">
                            {regDetails.groupMembers.map((m: string, i: number) => (
                              <li key={i}>{m}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment Information */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 md:col-span-2 space-y-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5 pb-1 border-b border-slate-200">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" /> Payment &amp; Financial Verification
                  </h3>
                  <div className="text-xs grid grid-cols-1 sm:grid-cols-3 gap-2 text-slate-700">
                    <div>
                      <span className="block text-slate-400 font-medium">Total Amount</span>
                      <span className="font-bold text-sm text-slate-900">
                        {regDetails.event?.isPaid ? `₹${regDetails.totalAmount || 0}` : 'FREE'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-400 font-medium">Payment Status</span>
                      <span className="font-bold uppercase text-slate-900">{regDetails.paymentStatus || 'FREE'}</span>
                    </div>
                    <div>
                      <span className="block text-slate-400 font-medium">Transaction / UTR Reference</span>
                      <span className="font-mono font-semibold text-slate-800 truncate block" title={regDetails.paymentReference || regDetails.uploadReference}>
                        {regDetails.paymentReference || regDetails.uploadReference || 'None Provided'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
                {regDetails.event?.isPaid && regDetails.paymentStatus !== 'VERIFIED' && (
                  <Button
                    onClick={() => verifyPaymentMutation.mutate(regDetails.id)}
                    disabled={verifyPaymentMutation.isPending}
                    className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" /> Verify Payment
                  </Button>
                )}

                {!regDetails.checkedIn && (
                  <Button
                    onClick={() => checkInMutation.mutate(regDetails.id)}
                    disabled={checkInMutation.isPending}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
                  >
                    <UserCheck className="w-4 h-4 mr-2" /> Check In Attendee
                  </Button>
                )}

                {regDetails.status !== 'REJECTED' && (
                  <Button
                    onClick={() => rejectMutation.mutate(regDetails.id)}
                    disabled={rejectMutation.isPending}
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Reject Pass
                  </Button>
                )}
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
    </div>
  );
};
