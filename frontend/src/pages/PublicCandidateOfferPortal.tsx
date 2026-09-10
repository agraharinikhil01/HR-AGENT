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
} from 'lucide-react';

export const PublicCandidateOfferPortal: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const [offer, setOffer] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [signature, setSignature] = useState('');
  const [comments, setComments] = useState('');
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
    if (action === 'ACCEPT' && !signature.trim()) {
      alert('Please enter your full legal name as your digital signature.');
      return;
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
    <div className="min-h-screen bg-[#f6f8fa] py-12 px-4 sm:px-6">
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
          <div className="mt-8 border-t border-[#edf2f7] pt-6">
            <h2 className="text-base font-black text-[#0e1017]">Salary & Compensation Annexure</h2>
            <p className="text-xs text-[#5e6b7c]">Statutory and component breakdown in Indian Rupees (INR)</p>

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
            <div className="mt-4 rounded-2xl bg-[#edf7d2] p-6 text-center border border-[#edf7d2]">
              <CheckCircle2 className="mx-auto h-12 w-12 text-[#84b81b]" />
              <h3 className="mt-2 text-lg font-black text-[#567715]">Offer Accepted!</h3>
              <p className="mt-1 text-xs text-[#567715]">
                You have electronically signed and accepted this offer. We look forward to having you onboard!
              </p>
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
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">
                  Digital Signature (Type your full legal name) *
                </label>
                <input
                  type="text"
                  required
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="e.g. Rahul Verma"
                  className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 text-xs font-bold text-[#0e1017] focus:border-[#84b81b] focus:outline-none"
                />
                <p className="mt-1 text-[10px] text-[#8b98a9]">
                  Typing your legal name constitutes a legally binding electronic acceptance under the Information Technology Act.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">
                  Comments / Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Any questions or notes for the HR team..."
                  className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2 text-xs focus:border-[#84b81b] focus:outline-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleRespond('ACCEPT')}
                  className="flex-1 rounded-full bg-[#84b81b] py-3 text-xs font-bold text-white shadow-sm hover:bg-[#729e18] transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Sign & Accept Offer'}
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleRespond('REJECT')}
                  className="rounded-full border border-[#edf2f7] px-6 py-3 text-xs font-bold text-[#5e6b7c] hover:bg-slate-100 disabled:opacity-50"
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
