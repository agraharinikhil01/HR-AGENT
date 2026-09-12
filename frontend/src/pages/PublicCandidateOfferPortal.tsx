import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { client } from '../lib/api/client.js';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  Calendar,
  IndianRupee,
  FileCheck,
  Printer,
  Download,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { CtcDonutChart } from '../components/CtcDonutChart.js';
import { DigitalSignaturePad } from '../components/DigitalSignaturePad.js';
import { ConfettiCelebration } from '../components/ConfettiCelebration.js';

export const PublicCandidateOfferPortal: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const [offer, setOffer] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [signature, setSignature] = useState('');
  const [comments, setComments] = useState('');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [actionDone, setActionDone] = useState<'ACCEPTED' | 'REJECTED' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchOffer = async () => {
      try {
        const res = await client.get(`/offers/public/${token}`);
        setOffer(res.data.data);
        if (res.data.data.status === 'Accepted') setActionDone('ACCEPTED');
        if (res.data.data.status === 'Rejected') setActionDone('REJECTED');
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Offer letter not found or link expired.');
      } finally {
        setLoading(false);
      }
    };
    fetchOffer();
  }, [token]);

  const handleRespond = async (action: 'ACCEPT' | 'REJECT') => {
    if (action === 'ACCEPT') {
      if (!signature.trim()) {
        alert('Please draw or type your digital signature before accepting.');
        return;
      }
      if (!termsAgreed) {
        alert('Please check the confirmation box agreeing to the appointment terms.');
        return;
      }
    }

    if (!confirm(`Are you sure you want to ${action === 'ACCEPT' ? 'ACCEPT' : 'DECLINE'} this offer?`)) {
      return;
    }

    setSubmitting(true);
    try {
      await client.post(`/offers/public/${token}/respond`, {
        action,
        signature: action === 'ACCEPT' ? signature : undefined,
        comments,
      });

      setActionDone(action === 'ACCEPT' ? 'ACCEPTED' : 'REJECTED');
      if (action === 'ACCEPT') {
        setShowConfetti(true);
      }
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to submit response.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f6f8fa]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#84b81b] border-t-transparent"></div>
      </div>
    );
  }

  if (error || !offer) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f6f8fa] p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="mt-3 text-lg font-bold text-[#0e1017]">Offer Letter Unavailable</h2>
        <p className="mt-1 text-xs text-[#5e6b7c]">{error}</p>
      </div>
    );
  }

  const { candidateId, jobId, orgId, components } = offer;

  return (
    <div className="min-h-screen bg-[#f6f8fa] py-12 px-4 sm:px-6 relative">
      <ConfettiCelebration active={showConfetti} />

      <div className="mx-auto max-w-4xl space-y-6">
        {/* Banner */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-[#edf2f7]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#edf2f7] pb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#84b81b] text-white font-black text-xs">
                  H
                </div>
                <span className="text-xs font-black text-[#0e1017]">{orgId?.name}</span>
                <span className="rounded-full bg-[#edf7d2] px-2 py-0.5 text-[10px] font-bold text-[#567715]">
                  Official Offer Letter
                </span>
              </div>
              <h1 className="mt-3 text-2xl sm:text-3xl font-black text-[#0e1017]">Employment Offer</h1>
              <p className="text-xs text-[#5e6b7c] mt-1">
                Prepared for <strong>{candidateId?.fullName}</strong> for the position of{' '}
                <strong>{jobId?.title}</strong>
              </p>
            </div>

            <div className="sm:text-right">
              <span className="text-[11px] font-bold uppercase text-[#8b98a9]">Offer Valid Until</span>
              <p className="font-bold text-[#0e1017] text-sm mt-0.5">
                {new Date(offer.validUntil).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Core Terms */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
            <div className="rounded-2xl bg-[#f8fafc] p-3.5 border border-[#edf2f7]">
              <span className="text-[10px] font-bold uppercase text-[#8b98a9]">Work Location</span>
              <p className="font-bold text-[#0e1017] mt-0.5">{offer.workLocation}</p>
            </div>
            <div className="rounded-2xl bg-[#f8fafc] p-3.5 border border-[#edf2f7]">
              <span className="text-[10px] font-bold uppercase text-[#8b98a9]">Expected Joining</span>
              <p className="font-bold text-[#0e1017] mt-0.5">
                {new Date(offer.joiningDate).toLocaleDateString()}
              </p>
            </div>
            <div className="rounded-2xl bg-[#f8fafc] p-3.5 border border-[#edf2f7]">
              <span className="text-[10px] font-bold uppercase text-[#8b98a9]">Reporting Manager</span>
              <p className="font-bold text-[#0e1017] mt-0.5">{offer.reportingManager}</p>
            </div>
            <div className="rounded-2xl bg-[#f8fafc] p-3.5 border border-[#edf2f7]">
              <span className="text-[10px] font-bold uppercase text-[#8b98a9]">Notice Period</span>
              <p className="font-bold text-[#0e1017] mt-0.5">{offer.noticePeriodDays} Days</p>
            </div>
          </div>

          {/* Indian CTC Breakdown Annexure */}
          <div className="mt-8 border-t border-[#edf2f7] pt-6 space-y-4">
            <div>
              <h2 className="text-base font-black text-[#0e1017]">Salary & Compensation Annexure</h2>
              <p className="text-xs text-[#5e6b7c]">Statutory and component breakdown in Indian Rupees (INR)</p>
            </div>

            {/* Visual Donut Chart */}
            <CtcDonutChart
              annualCtc={offer.annualCtc}
              basicAnnual={components?.basicAnnual || 0}
              hraAnnual={components?.hraAnnual || 0}
              specialAllowanceAnnual={components?.specialAllowanceAnnual || 0}
              variableAnnual={components?.variableAnnual || 0}
              retiralsAnnual={(components?.employerPfAnnual || 0) + (components?.gratuityAnnual || 0)}
            />

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#edf2f7] bg-[#f8fafc]">
                    <th className="p-3 font-bold text-[#5e6b7c]">Salary Component</th>
                    <th className="p-3 font-bold text-[#5e6b7c] text-right">Monthly (INR)</th>
                    <th className="p-3 font-bold text-[#5e6b7c] text-right">Annual (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf2f7]">
                  <tr>
                    <td className="p-3 font-medium text-[#0e1017]">Basic Salary</td>
                    <td className="p-3 text-right font-semibold">₹{components?.basicMonthly?.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-semibold">₹{components?.basicAnnual?.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-[#0e1017]">House Rent Allowance (HRA)</td>
                    <td className="p-3 text-right font-semibold">₹{components?.hraMonthly?.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-semibold">₹{components?.hraAnnual?.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-[#0e1017]">Special Allowance</td>
                    <td className="p-3 text-right font-semibold">₹{components?.specialAllowanceMonthly?.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right font-semibold">₹{components?.specialAllowanceAnnual?.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr className="bg-[#f8fafc] font-bold text-[#0e1017]">
                    <td className="p-3">Monthly Gross Pay</td>
                    <td className="p-3 text-right">₹{offer.monthlyGross?.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right">₹{offer.annualGross?.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-[#5e6b7c]">Employer Provident Fund (PF)</td>
                    <td className="p-3 text-right text-[#5e6b7c]">₹{components?.employerPfMonthly?.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right text-[#5e6b7c]">₹{components?.employerPfAnnual?.toLocaleString('en-IN')}</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-[#5e6b7c]">Gratuity Provision</td>
                    <td className="p-3 text-right text-[#5e6b7c]">₹{components?.gratuityMonthly?.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-right text-[#5e6b7c]">₹{components?.gratuityAnnual?.toLocaleString('en-IN')}</td>
                  </tr>
                  {components?.variableAnnual > 0 && (
                    <tr>
                      <td className="p-3 text-[#5e6b7c]">Annual Performance Bonus</td>
                      <td className="p-3 text-right text-[#5e6b7c]">—</td>
                      <td className="p-3 text-right text-[#5e6b7c]">₹{components?.variableAnnual?.toLocaleString('en-IN')}</td>
                    </tr>
                  )}
                  <tr className="bg-[#edf7d2] text-[#567715] font-black text-sm">
                    <td className="p-3.5">Total Cost to Company (CTC)</td>
                    <td className="p-3.5 text-right">₹{offer.monthlyCtc?.toLocaleString('en-IN')}</td>
                    <td className="p-3.5 text-right">₹{offer.annualCtc?.toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Acceptance / Signature Area */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-[#edf2f7]">
          <h2 className="text-base font-black text-[#0e1017]">Offer Acceptance & Electronic Signature</h2>

          {actionDone === 'ACCEPTED' ? (
            <div className="mt-4 rounded-3xl bg-[#fcfef9] p-8 text-center border-2 border-[#84b81b] space-y-5 shadow-xs">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-[#edf7d2] text-[#84b81b] ring-8 ring-[#edf7d2]/50">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <div>
                <span className="rounded-full bg-[#84b81b] px-3 py-1 text-xs font-black text-white uppercase tracking-wider">
                  Official Appointment Accepted
                </span>
                <h3 className="mt-3 text-2xl font-black text-[#0e1017]">
                  Congratulations, {candidateId?.fullName}!
                </h3>
                <p className="mt-1 text-xs text-[#5e6b7c] max-w-md mx-auto">
                  You have electronically signed and ratified this employment agreement. An official confirmation has been dispatched to your email and the HR operations team.
                </p>
              </div>

              {/* Digital Signature Certificate Stamp */}
              <div className="max-w-md mx-auto rounded-2xl border border-[#edf2f7] bg-white p-4 text-left space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b98a9] block">
                  Electronic Signature Certificate
                </span>
                <div className="h-16 flex items-center justify-center bg-[#f8fafc] rounded-xl border border-dashed border-slate-200">
                  {offer.candidateSignature?.startsWith('data:image/') || signature?.startsWith('data:image/') ? (
                    <img
                      src={offer.candidateSignature || signature}
                      alt="Candidate Digital Signature"
                      className="h-12 max-w-[240px] object-contain"
                    />
                  ) : (
                    <span className="font-serif italic text-xl font-bold text-slate-800">
                      {offer.candidateSignature || signature || candidateId?.fullName}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#5e6b7c] pt-1">
                  <span>Signed on {new Date(offer.acceptedAt || Date.now()).toLocaleString()}</span>
                  <span className="font-mono text-[#567715] font-bold">SECURE-VERIFIED</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-2 rounded-full bg-[#0e1017] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-all"
                >
                  <Printer className="h-4 w-4 text-[#84b81b]" />
                  <span>Print / Save Signed Offer PDF</span>
                </button>
              </div>
            </div>
          ) : actionDone === 'REJECTED' ? (
            <div className="mt-4 rounded-2xl bg-red-50 p-6 text-center border border-red-200">
              <XCircle className="mx-auto h-12 w-12 text-red-600" />
              <h3 className="mt-2 text-lg font-black text-red-900">Offer Declined</h3>
              <p className="mt-1 text-xs text-red-700">
                You have declined this offer. Thank you for your time.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-5">
              {/* Interactive Digital Signature Pad */}
              <div>
                <label className="block text-xs font-bold uppercase text-[#0e1017] mb-1.5">
                  1. Affix Your Digital Signature (Draw or Type) *
                </label>
                <DigitalSignaturePad
                  candidateName={candidateId?.fullName || ''}
                  onSignatureChange={(sig) => setSignature(sig)}
                />
              </div>

              {/* Optional Comments */}
              <div>
                <label className="block text-xs font-bold uppercase text-[#5e6b7c] mb-1">
                  2. Comments / Joining Preferences (Optional)
                </label>
                <textarea
                  rows={2}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="e.g. Excited to join! Laptop preference, relocation notes, or dietary requirements..."
                  className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 text-xs focus:border-[#84b81b] focus:outline-none"
                />
              </div>

              {/* Legal Confirmation Checkbox */}
              <label className="flex items-start gap-2.5 rounded-2xl bg-[#f8fafc] border border-[#edf2f7] p-3.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  className="h-4 w-4 mt-0.5 rounded border-[#edf2f7] text-[#84b81b] focus:ring-[#84b81b]"
                />
                <span className="text-[#0e1017] leading-relaxed">
                  I solemnly declare that I have reviewed the appointment terms, CTC schedule, and probation clauses, and I hereby voluntarily execute this digital acceptance.
                </span>
              </label>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  disabled={submitting || !termsAgreed || !signature}
                  onClick={() => handleRespond('ACCEPT')}
                  className="flex-1 flex items-center justify-center gap-2 rounded-full bg-[#84b81b] py-3.5 text-xs font-black text-white shadow-sm hover:bg-[#729e18] transition-colors disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{submitting ? 'Authenticating & Submitting...' : 'Sign & Formally Accept Offer'}</span>
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleRespond('REJECT')}
                  className="rounded-full border border-[#edf2f7] px-6 py-3.5 text-xs font-bold text-[#5e6b7c] hover:bg-slate-100 disabled:opacity-50"
                >
                  Decline Offer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
