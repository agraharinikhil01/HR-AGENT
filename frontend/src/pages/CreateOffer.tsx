import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { client } from '../lib/api/client.js';
import { ArrowLeft, Calculator, AlertCircle } from 'lucide-react';

export const CreateOffer: React.FC = () => {
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get('applicationId') || '';
  const navigate = useNavigate();

  const [applications, setApplications] = useState<any[]>([]);
  const [selectedAppId, setSelectedAppId] = useState(applicationId);
  const [templateType, setTemplateType] = useState('Full-time');
  const [reportingManager, setReportingManager] = useState('Anand K (VP Engineering)');
  const [workLocation, setWorkLocation] = useState('Bengaluru, India');
  const [joiningDate, setJoiningDate] = useState('2026-10-15');
  const [validUntil, setValidUntil] = useState('2026-09-30');

  // CTC Calculator inputs
  const [annualCtc, setAnnualCtc] = useState<number>(2400000);
  const [basicPct, setBasicPct] = useState<number>(50);
  const [hraPct, setHraPct] = useState<number>(40);
  const [variableAnnual, setVariableAnnual] = useState<number>(200000);
  const [includePf, setIncludePf] = useState<boolean>(true);
  const [includeGratuity, setIncludeGratuity] = useState<boolean>(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time calculation state
  const basePool = Math.max(0, annualCtc - variableAnnual);
  const annualBasic = Math.round(basePool * (basicPct / 100));
  const monthlyBasic = Math.round(annualBasic / 12);

  const annualHra = Math.round(annualBasic * (hraPct / 100));
  const monthlyHra = Math.round(annualHra / 12);

  const monthlyPf = includePf ? Math.round(monthlyBasic * 0.12) : 0;
  const annualPf = monthlyPf * 12;

  const annualGratuity = includeGratuity ? Math.round((15 / 26) * monthlyBasic) : 0;
  const monthlyGratuity = Math.round(annualGratuity / 12);

  const annualRetirals = annualPf + annualGratuity;
  const accounted = annualBasic + annualHra + annualRetirals + variableAnnual;
  const annualSpecial = Math.max(0, annualCtc - accounted);
  const monthlySpecial = Math.round(annualSpecial / 12);

  const monthlyGross = monthlyBasic + monthlyHra + monthlySpecial;

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const res = await client.get('/candidates/applications');
        setApplications(res.data.data);
        if (!selectedAppId && res.data.data.length > 0) {
          setSelectedAppId(res.data.data[0]._id);
        }
      } catch (err) {
        console.error('Failed to load applications:', err);
      }
    };
    fetchApplications();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAppId) {
      setError('Please select a candidate application.');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      await client.post('/offers', {
        applicationId: selectedAppId,
        templateType,
        joiningDate,
        validUntil,
        reportingManager,
        workLocation,
        annualCtc: Number(annualCtc),
        basicPercentage: Number(basicPct),
        hraPercentage: Number(hraPct),
        variableAnnual: Number(variableAnnual),
        includePf,
        includeGratuity,
      });

      navigate('/offers');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create offer letter.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 rounded-xl border border-[#edf2f7] bg-white px-3 py-1.5 text-xs font-semibold text-[#5e6b7c] hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
        <div>
          <h1 className="text-xl font-black tracking-tight text-[#0e1017]">
            Indian CTC Offer Letter Builder
          </h1>
          <p className="text-xs text-[#5e6b7c]">
            Automated statutory calculations for Basic, HRA, PF, Gratuity, and Special Allowance
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-3.5 text-xs font-semibold text-red-700 border border-red-100">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Parameters */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl border border-[#edf2f7] bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0e1017] border-b border-[#edf2f7] pb-3">
              Candidate & Requisition Setup
            </h2>

            <div>
              <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">Candidate *</label>
              <select
                required
                value={selectedAppId}
                onChange={(e) => setSelectedAppId(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 text-xs font-medium text-[#0e1017]"
              >
                {applications.map((app) => (
                  <option key={app._id} value={app._id}>
                    {app.candidateId?.fullName} — {app.jobId?.title} (Fit: {app.fitScore}%)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">Template</label>
                <select
                  value={templateType}
                  onChange={(e) => setTemplateType(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 text-xs font-medium text-[#0e1017]"
                >
                  <option value="Full-time">Full-time Regular</option>
                  <option value="Leadership">Leadership & Executive</option>
                  <option value="Consultant">Fixed-Term Consultant</option>
                  <option value="Intern">Graduate Intern</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">Work Location</label>
                <input
                  type="text"
                  value={workLocation}
                  onChange={(e) => setWorkLocation(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 text-xs font-medium text-[#0e1017]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">Reporting Manager</label>
                <input
                  type="text"
                  required
                  value={reportingManager}
                  onChange={(e) => setReportingManager(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 text-xs font-medium text-[#0e1017]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">Joining Date</label>
                <input
                  type="date"
                  required
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 text-xs font-medium text-[#0e1017]"
                />
              </div>
            </div>
          </div>

          {/* Salary Architecture */}
          <div className="rounded-3xl border border-[#edf2f7] bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0e1017] border-b border-[#edf2f7] pb-3">
              Compensation Breakdown
            </h2>

            <div>
              <div className="flex justify-between text-xs font-bold uppercase text-[#5e6b7c]">
                <span>Total Annual CTC (INR) *</span>
                <span className="text-[#567715] font-black">₹{annualCtc.toLocaleString('en-IN')}</span>
              </div>
              <input
                type="number"
                step={50000}
                required
                value={annualCtc}
                onChange={(e) => setAnnualCtc(Number(e.target.value))}
                className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 text-sm font-bold text-[#0e1017] focus:border-[#84b81b] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-[11px] font-semibold text-[#5e6b7c]">
                  <span>Basic Salary %</span>
                  <span>{basicPct}%</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={60}
                  step={5}
                  value={basicPct}
                  onChange={(e) => setBasicPct(Number(e.target.value))}
                  className="mt-1 w-full accent-[#84b81b]"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-semibold text-[#5e6b7c]">
                  <span>HRA (% of Basic)</span>
                  <span>{hraPct}%</span>
                </div>
                <input
                  type="range"
                  min={30}
                  max={50}
                  step={5}
                  value={hraPct}
                  onChange={(e) => setHraPct(Number(e.target.value))}
                  className="mt-1 w-full accent-[#84b81b]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">
                Annual Performance Bonus / Variable (₹)
              </label>
              <input
                type="number"
                step={25000}
                value={variableAnnual}
                onChange={(e) => setVariableAnnual(Number(e.target.value))}
                className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-5 pt-2">
              <label className="flex items-center gap-2 text-xs font-medium text-[#5e6b7c] cursor-pointer">
                <input
                  type="checkbox"
                  checked={includePf}
                  onChange={(e) => setIncludePf(e.target.checked)}
                  className="rounded border-[#edf2f7] text-[#84b81b] focus:ring-[#84b81b]"
                />
                <span>Include Employer PF (12% of Basic)</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-[#5e6b7c] cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeGratuity}
                  onChange={(e) => setIncludeGratuity(e.target.checked)}
                  className="rounded border-[#edf2f7] text-[#84b81b] focus:ring-[#84b81b]"
                />
                <span>Include Gratuity (~4.81% of Basic)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Col: Annexure Preview */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#edf2f7] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-[#edf2f7] pb-3">
              <Calculator className="h-4 w-4 text-[#84b81b]" />
              <h3 className="font-bold text-[#0e1017] text-xs uppercase tracking-wider">
                Salary Annexure Preview
              </h3>
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-[#edf2f7]">
                <span className="text-[#5e6b7c]">Basic Salary</span>
                <span className="font-bold text-[#0e1017]">₹{annualBasic.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#edf2f7]">
                <span className="text-[#5e6b7c]">House Rent Allowance (HRA)</span>
                <span className="font-bold text-[#0e1017]">₹{annualHra.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#edf2f7]">
                <span className="text-[#5e6b7c]">Special Allowance (Balancing)</span>
                <span className="font-bold text-[#0e1017]">₹{annualSpecial.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#edf2f7]">
                <span className="text-[#5e6b7c]">Employer PF (Annual)</span>
                <span className="font-bold text-[#0e1017]">₹{annualPf.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#edf2f7]">
                <span className="text-[#5e6b7c]">Gratuity Provision</span>
                <span className="font-bold text-[#0e1017]">₹{annualGratuity.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#edf2f7]">
                <span className="text-[#5e6b7c]">Annual Variable Pay</span>
                <span className="font-bold text-[#0e1017]">₹{variableAnnual.toLocaleString('en-IN')}</span>
              </div>

              <div className="mt-4 rounded-2xl bg-[#edf7d2]/60 p-3.5 border border-[#edf7d2] text-xs space-y-1.5">
                <div className="flex justify-between text-[#567715] font-semibold">
                  <span>Monthly Gross Salary:</span>
                  <span>₹{monthlyGross.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[#567715] font-black text-sm pt-1 border-t border-[#edf7d2]">
                  <span>Total Annual CTC:</span>
                  <span>₹{annualCtc.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 w-full rounded-full bg-[#84b81b] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#729e18] transition-colors disabled:opacity-50"
            >
              {submitting ? 'Generating Offer...' : 'Send for Internal Approvals'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
