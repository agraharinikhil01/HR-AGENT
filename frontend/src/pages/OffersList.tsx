import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { client } from '../lib/api/client.js';
import { useAuth } from '../auth/AuthProvider.js';
import {
  FileCheck,
  Send,
  Plus,
  Copy,
  Check,
  IndianRupee,
  X,
  Building2,
  Calendar,
  CheckCircle2,
} from 'lucide-react';

export const OffersList: React.FC = () => {
  const { user } = useAuth();
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Approval modal state
  const [approvalModal, setApprovalModal] = useState<any | null>(null);
  const [approvalDecision, setApprovalDecision] = useState<'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED'>('APPROVED');
  const [approvalComments, setApprovalComments] = useState('');

  const fetchOffers = async () => {
    try {
      const res = await client.get('/offers');
      setOffers(res.data.data);
    } catch (err) {
      console.error('Failed to load offers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleApprovalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvalModal) return;

    try {
      await client.post(`/offers/${approvalModal._id}/approve`, {
        decision: approvalDecision,
        comments: approvalComments,
      });

      setApprovalModal(null);
      setApprovalComments('');
      fetchOffers();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error processing approval');
    }
  };

  const handleSendOffer = async (offerId: string) => {
    if (!confirm('Are you sure you want to release this offer letter to the candidate?')) return;

    try {
      await client.post(`/offers/${offerId}/send`);
      fetchOffers();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to send offer');
    }
  };

  const copyPortalLink = (token: string) => {
    const url = `${window.location.origin}/offers/view/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-[#0e1017]">
            Offers & Indian CTC Management
          </h1>
          <p className="text-xs text-[#5e6b7c]">
            Statutory Indian salary computation, 3-tier approval workflows, and digital offer release
          </p>
        </div>

        <Link
          to="/offers/create"
          className="flex items-center gap-1.5 rounded-full bg-[#84b81b] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#729e18] transition-colors"
        >
          <Plus className="h-3.5 w-3.5 stroke-[3]" />
          <span>Draft Offer Letter</span>
        </Link>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#84b81b] border-t-transparent"></div>
        </div>
      ) : offers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <FileCheck className="mx-auto h-12 w-12 text-[#8b98a9]" />
          <h3 className="mt-3 text-sm font-bold text-[#0e1017]">No offer letters generated</h3>
          <p className="mt-1 text-xs text-[#5e6b7c]">
            Generate an offer letter with Indian CTC breakdown for any shortlisted candidate.
          </p>
          <div className="mt-5">
            <Link
              to="/offers/create"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#84b81b] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#729e18]"
            >
              <Plus className="h-3.5 w-3.5 stroke-[3]" /> Draft Offer
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => {
            const isApproved = offer.status === 'Approved' || offer.status === 'Accepted';

            return (
              <div
                key={offer._id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 rounded-3xl border border-[#edf2f7] bg-white p-6 shadow-sm hover:shadow-md transition-all"
              >
                <div className="space-y-2.5">
                  {/* Status Badges */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-0.5 text-xs font-bold ${
                        offer.status === 'Accepted'
                          ? 'bg-[#edf7d2] text-[#567715]'
                          : offer.status === 'Approved'
                          ? 'bg-blue-50 text-blue-700'
                          : offer.status === 'Sent' || offer.status === 'Viewed'
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {offer.status}
                    </span>
                    <span className="text-xs text-[#8b98a9]">Template: {offer.templateType}</span>
                  </div>

                  {/* Candidate & Job Title */}
                  <h3 className="text-base font-black text-[#0e1017]">
                    {offer.candidateId?.fullName} — {offer.jobId?.title}
                  </h3>

                  {/* CTC Metadata */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#5e6b7c]">
                    <span>
                      Annual CTC:{' '}
                      <strong className="text-[#0e1017] font-bold">
                        ₹{(offer.annualCtc || 0).toLocaleString('en-IN')}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>Monthly Gross: ₹{(offer.monthlyGross || 0).toLocaleString('en-IN')}</span>
                    <span>•</span>
                    <span>Joining: {new Date(offer.joiningDate).toLocaleDateString()}</span>
                  </div>

                  {/* Multi-tier Approval Tracker */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-[#8b98a9]">
                    <span className="font-semibold text-[#5e6b7c]">3-Tier Approvals:</span>
                    {offer.approvalChain?.map((step: any) => (
                      <span
                        key={step.level}
                        className={`rounded-full px-2.5 py-0.5 font-bold text-[10px] ${
                          step.status === 'APPROVED'
                            ? 'bg-[#edf7d2] text-[#567715]'
                            : step.status === 'REJECTED'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {step.role.replace('_', ' ')}: {step.status}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {offer.status === 'Pending Approval' && (
                    <button
                      onClick={() => setApprovalModal(offer)}
                      className="rounded-full bg-amber-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-600 transition-colors"
                    >
                      Review & Approve
                    </button>
                  )}

                  {offer.status === 'Approved' && (
                    <button
                      onClick={() => handleSendOffer(offer._id)}
                      className="flex items-center gap-1.5 rounded-full bg-[#84b81b] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#729e18] transition-colors"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>Release Offer</span>
                    </button>
                  )}

                  {['Sent', 'Viewed', 'Accepted'].includes(offer.status) && (
                    <button
                      onClick={() => copyPortalLink(offer.candidatePortalToken)}
                      className="flex items-center gap-1.5 rounded-full border border-[#edf2f7] bg-[#f8fafc] px-4 py-2 text-xs font-bold text-[#0e1017] hover:bg-slate-100 transition-colors"
                    >
                      {copiedToken === offer.candidatePortalToken ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-[#84b81b]" />
                          <span className="text-[#84b81b]">Copied Portal Link</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-[#8b98a9]" />
                          <span>Candidate Portal Link</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Approval Modal */}
      {approvalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-[#edf2f7]">
            <div className="flex items-center justify-between pb-3 border-b border-[#edf2f7]">
              <div>
                <h3 className="font-bold text-sm text-[#0e1017]">Review & Approve Offer</h3>
                <p className="text-[11px] text-[#5e6b7c]">
                  {approvalModal.candidateId?.fullName} • ₹{approvalModal.annualCtc?.toLocaleString('en-IN')} CTC
                </p>
              </div>
              <button onClick={() => setApprovalModal(null)} className="text-[#8b98a9] hover:text-[#0e1017]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleApprovalSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#5e6b7c] uppercase">Decision</label>
                <select
                  value={approvalDecision}
                  onChange={(e) => setApprovalDecision(e.target.value as any)}
                  className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2 text-xs"
                >
                  <option value="APPROVED">Approve Offer Terms</option>
                  <option value="CHANGES_REQUESTED">Request Revisions</option>
                  <option value="REJECTED">Reject Offer</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5e6b7c] uppercase">
                  Approval Notes / Justification
                </label>
                <textarea
                  rows={3}
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  placeholder="Notes on budget compliance, designation, or statutory guidelines..."
                  className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setApprovalModal(null)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-[#5e6b7c] hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#84b81b] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#729e18] transition-colors"
                >
                  Submit Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
