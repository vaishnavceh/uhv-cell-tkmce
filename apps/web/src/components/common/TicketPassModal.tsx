import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Printer, Download, X, Ticket, Calendar, MapPin, Shield, Users } from 'lucide-react';
import { Button } from '../ui/Button';

interface TicketPassModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: any;
  event: any;
}

export const TicketPassModal: React.FC<TicketPassModalProps> = ({
  isOpen,
  onClose,
  registration,
  event,
}) => {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !registration || !event) return null;

  const regCode = `UHV-${(registration.id || 'TICKET').slice(0, 8).toUpperCase()}`;
  const isGroup = registration.ticketType === 'GROUP' || (registration.groupSize && registration.groupSize > 1);
  const membersList: string[] = Array.isArray(registration.groupMembers) ? registration.groupMembers : [];
  
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    `UHVPASS::${registration.id}`
  )}`;

  const totalFeeText = event.isPaid
    ? `₹${registration.totalAmount || (event.ticketPrice || 0) * (registration.groupSize || 1)}`
    : 'FREE PASS';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPng = async () => {
    if (!ticketRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(ticketRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#090d16',
      });
      const cleanSlug = (event.slug || 'uhv-event').replace(/[^a-zA-Z0-9_-]/g, '-').toLowerCase();
      const link = document.createElement('a');
      link.download = `${cleanSlug}-pass-${regCode.toLowerCase()}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to generate PNG:', err);
      alert('Could not render PNG. Please use "Print Pass" instead.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #admin-ticket-stub, #admin-ticket-stub * {
            visibility: visible !important;
          }
          #admin-ticket-stub {
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 900px !important;
            max-width: 95vw !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: 1px solid #1e293b !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Toolbar */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2 text-white">
            <Ticket className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm">Official Event Entry Pass — {regCode}</h3>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" /> Print Pass
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleDownloadPng}
              disabled={isDownloading}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1.5 border border-slate-700 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" /> {isDownloading ? 'Exporting...' : 'Save PNG'}
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Ticket Display Area */}
        <div className="p-4 sm:p-6 overflow-x-auto overflow-y-auto flex-1 flex justify-center items-center bg-[#070a10]">
          {/* CONCERT-STYLE TICKET STUB */}
          <div
            id="admin-ticket-stub"
            ref={ticketRef}
            className="relative w-full max-w-4xl min-w-[650px] mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-[#090d16] text-white flex flex-row select-none"
          >
            {/* Left Main Ticket Section */}
            <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#0c1322] via-[#090d16] to-[#05070c]">
              {/* Background texture graphics */}
              <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full border border-slate-700/20 pointer-events-none" />
              <div className="absolute -left-6 -bottom-6 w-36 h-36 rounded-full border border-slate-700/20 pointer-events-none" />

              {/* Event Cover Image Backdrop */}
              {event.coverImage && (
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-[0.06] pointer-events-none mix-blend-luminosity filter blur-[1px]"
                  style={{ backgroundImage: `url(${event.coverImage})` }}
                />
              )}

              <div>
                {/* Header Co-Branded Bar */}
                <div className="space-y-3 mb-4 pb-3.5 border-b border-slate-800">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-9 h-9 rounded-xl bg-white p-1 flex items-center justify-center shadow-md border border-slate-200/20 shrink-0">
                          <img
                            src="/assets/tkm-logo.png"
                            alt="TKMCE"
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 p-1 flex items-center justify-center shadow-md shrink-0">
                          <img
                            src="/assets/uhv_logo_white.png"
                            alt="UHV"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                      <div className="border-l border-slate-700/80 pl-3">
                        <span className="text-xs uppercase font-black tracking-widest text-emerald-400 block leading-tight">
                          UNIVERSAL HUMAN VALUES CELL
                        </span>
                        <span className="text-[9px] uppercase font-bold text-slate-300 block tracking-wide mt-0.5">
                          TKM College of Engineering, Kollam
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 tracking-wider">
                        {isGroup ? `Group Pass (${registration.groupSize || 2})` : 'Entry Pass'}
                      </span>
                    </div>
                  </div>

                  {/* Collaborators if present */}
                  {event.collaborators && (
                    <div className="text-[9px] text-slate-400 flex items-center gap-1.5 pt-0.5">
                      <span className="font-bold text-slate-300">In Collaboration With:</span> {event.collaborators}
                    </div>
                  )}
                </div>

                {/* Event Title & Metadata */}
                <div className="space-y-2 mb-5">
                  <span className="text-[9px] font-extrabold tracking-widest uppercase text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60 inline-block">
                    {event.category || 'Official Event'}
                  </span>
                  <h1 className="text-xl sm:text-2xl font-black text-white leading-tight tracking-tight">
                    {event.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="font-semibold">
                        {new Date(event.eventDate).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    {event.startTime && (
                      <span className="text-slate-400">
                        {event.startTime} {event.endTime ? `– ${event.endTime}` : ''}
                      </span>
                    )}
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{event.venue}</span>
                    </div>
                  </div>
                </div>

                {/* Attendee Info Card inside Ticket */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 space-y-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Lead Attendee</span>
                      <span className="font-bold text-white truncate block">{registration.fullName}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Contact</span>
                      <span className="text-slate-300 truncate block text-[11px]">{registration.phone}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Admission Fee</span>
                      <span className="font-black text-emerald-400 block">{totalFeeText}</span>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Verification</span>
                      <span className="font-bold text-xs block text-slate-200 uppercase">
                        {registration.paymentStatus || 'FREE'}
                      </span>
                    </div>
                  </div>

                  {/* Group Members List */}
                  {isGroup && membersList.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-300">
                      <span className="font-bold text-slate-400 mr-1">Roster:</span>
                      {membersList.join(', ')}
                    </div>
                  )}

                  {registration.institution && (
                    <div className="text-[10px] text-slate-400">
                      <span className="font-semibold text-slate-300">Institution:</span> {registration.institution}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Instructions / Stamp */}
              <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between text-[9px] text-slate-400">
                <span>Please present this pass at the gate for electronic scanning &amp; verification.</span>
                <span className="font-mono text-emerald-400 font-bold">{regCode}</span>
              </div>
            </div>

            {/* Perforated Divider */}
            <div className="relative w-0 border-r-2 border-dashed border-slate-700/80 my-4 flex flex-col justify-between">
              <div className="absolute -top-6 -left-3 w-6 h-6 rounded-full bg-[#070a10] border border-slate-800 shadow-inner" />
              <div className="absolute -bottom-6 -left-3 w-6 h-6 rounded-full bg-[#070a10] border border-slate-800 shadow-inner" />
            </div>

            {/* Right Ticket Stub Section with QR & Barcode */}
            <div className="w-48 sm:w-56 bg-slate-950 p-6 flex flex-col justify-between items-center text-center relative border-l border-slate-800/60">
              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-widest font-black text-emerald-400 block">
                  ADMIT ONE
                </span>
                <span className="text-[8px] uppercase font-bold text-slate-400 block">
                  UHV CELL • TKMCE
                </span>
              </div>

              {/* Ticket QR Code */}
              <div className="bg-white p-2 rounded-xl shadow-lg border border-slate-300 my-2">
                <img
                  src={qrUrl}
                  crossOrigin="anonymous"
                  alt="Ticket Pass QR Code"
                  className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
                />
              </div>

              {/* Barcode Graphic */}
              <div className="w-full space-y-1">
                <div className="h-6 w-full flex items-center justify-center gap-[2px] bg-white p-1 rounded">
                  {[3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2].map((w, i) => (
                    <div key={i} className="h-full bg-black" style={{ width: `${w * 1.5}px` }} />
                  ))}
                </div>
                <span className="text-[9px] font-mono text-slate-400 tracking-widest block uppercase">
                  {regCode}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
