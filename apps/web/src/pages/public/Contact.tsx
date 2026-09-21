import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Button } from '../../components/ui/Button';

export const Contact: React.FC = () => {
  usePageTitle('Contact UHV Cell');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const submitMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiClient.post('/contact', data);
      return res.data;
    },
    onSuccess: () => {
      setSubmitted(true);
      setErrorMessage('');
      setFormData({ name: '', email: '', subject: '', message: '' });
    },
    onError: (err: any) => {
      setErrorMessage(
        err.response?.data?.message || 'Failed to transmit message. Please try again or reach us via email.'
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    submitMutation.mutate(formData);
  };

  return (
    <div className="py-12 bg-institutional-warm min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="text-left border-b border-emerald-900/10 pb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/70 border border-emerald-300 text-emerald-900 text-xs font-bold tracking-wide uppercase">
            Communication Gateway
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-institutional-950 tracking-tight">
            Connect with the UHV Cell
          </h1>
          <p className="text-base text-slate-600 max-w-3xl">
            Have questions regarding upcoming AICTE FDPs, student SIP modules, curricular integration,
            or collaborative value workshops? Reach out to our collegiate committee.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Institutional Office Card */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-institutional-900 text-white rounded-2xl p-8 shadow-xl border border-institutional-800 space-y-8 relative overflow-hidden">
              <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
              
              <div className="space-y-3">
                <span className="text-[11px] font-bold tracking-widest text-emerald-300 uppercase">
                  Official Secretariat
                </span>
                <h2 className="text-xl font-bold leading-snug">
                  Universal Human Values (UHV) Cell
                </h2>
                <p className="text-xs text-slate-300">
                  TKM College of Engineering (Govt. Aided Autonomous)
                </p>
              </div>

              <div className="space-y-5 text-xs text-slate-200">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-white font-semibold mb-0.5">Address</strong>
                    <span>Karicode, Perumpuzha P.O, Kollam, Kerala – 691005, India</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-white font-semibold mb-0.5">Email Inquiries</strong>
                    <a href="mailto:uhv@tkmce.ac.in" className="hover:text-emerald-300 transition underline underline-offset-2">
                      uhv@tkmce.ac.in
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-white font-semibold mb-0.5">Telephone</strong>
                    <span>+91 474 2712020 / +91 474 2712022</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-white font-semibold mb-0.5">Working Hours</strong>
                    <span>Monday – Friday: 9:00 AM – 4:30 PM (IST)</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-institutional-800 text-[11px] text-slate-400">
                AICTE Mandatory Cell • KTU Regulated Activities • Value Education Cell
              </div>
            </div>

            {/* Campus Context Map Card */}
            <div className="bg-white rounded-2xl p-6 border border-emerald-900/10 shadow-subtle space-y-3">
              <h3 className="text-sm font-bold text-institutional-950">Campus Location</h3>
              <p className="text-xs text-slate-600">
                The UHV Cell office and resource center is located inside the main administrative / academic quadrangle of TKMCE campus, Karicode.
              </p>
              <div className="rounded-xl overflow-hidden border border-slate-200 h-44 bg-slate-100 flex items-center justify-center text-center p-4">
                <div className="space-y-1">
                  <MapPin className="w-6 h-6 text-emerald-700 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">TKM College of Engineering</p>
                  <p className="text-[10px] text-slate-500">Kollam, Kerala • Lat: 8.9039° N, Lon: 76.6347° E</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Inquiry Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl p-8 sm:p-10 border border-emerald-900/10 shadow-subtle space-y-6">
              <div>
                <h2 className="text-xl font-bold text-institutional-950">Send an Official Message</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Please provide your contact information and details of your inquiry. Our cell coordinators will get back to you promptly.
                </p>
              </div>

              {submitted ? (
                <div className="p-8 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-4">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h3 className="text-base font-bold text-emerald-950">Inquiry Transmitted Successfully</h3>
                  <p className="text-xs text-emerald-800 max-w-md mx-auto">
                    Thank you for contacting the UHV Cell. Your message has been logged in our secure institutional inbox and routed to the cell coordinator.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSubmitted(false)}
                    className="mt-2 border-emerald-300 text-emerald-900 hover:bg-emerald-100"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMessage && (
                    <div className="p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2.5 text-xs text-red-700">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Your Name *"
                      placeholder="e.g. Dr. Ramesh Kumar / Ananya S."
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                    <Input
                      label="Email Address *"
                      type="email"
                      placeholder="e.g. yourname@domain.edu"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <Input
                    label="Subject / Topic *"
                    placeholder="e.g. FDP Participation Query / Student Workshop Collaboration"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                  />

                  <Textarea
                    label="Detailed Message *"
                    rows={5}
                    placeholder="Please state the purpose of your communication in detail..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    required
                  />

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={submitMutation.isPending}
                      className="w-full sm:w-auto px-8"
                    >
                      {submitMutation.isPending ? (
                        'Transmitting...'
                      ) : (
                        <span className="flex items-center gap-2">
                          <Send className="w-4 h-4" /> Send Inquiry
                        </span>
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
