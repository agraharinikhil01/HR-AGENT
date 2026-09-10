import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { client } from '../lib/api/client.js';
import { useAuth } from '../auth/AuthProvider.js';
import {
  Briefcase,
  Users,
  Calendar,
  FileCheck,
  TrendingUp,
  MapPin,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  Clock,
  Globe,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [insightTab, setInsightTab] = useState<'month' | 'year'>('month');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [metricsRes, jobsRes, appsRes] = await Promise.all([
          client.get('/dashboard/metrics'),
          client.get('/jobs', { params: { limit: 6 } }),
          client.get('/candidates/applications', { params: { limit: 5 } }),
        ]);

        setMetrics(metricsRes.data.data);
        setJobs(jobsRes.data.data);
        setApplications(appsRes.data.data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const featuredApp = applications[0];

  const brandIcons = [
    { bg: 'bg-[#0052cc]', text: 'text-white', letter: 'W', label: 'Webflow' },
    { bg: 'bg-[#ff6154]', text: 'text-white', letter: 'P', label: 'Product' },
    { bg: 'bg-[#000000]', text: 'text-white', letter: 'N', label: 'Notion' },
    { bg: 'bg-[#00c58e]', text: 'text-white', letter: 'S', label: 'SaaS' },
    { bg: 'bg-[#eab308]', text: 'text-white', letter: 'F', label: 'Frontend' },
    { bg: 'bg-[#6366f1]', text: 'text-white', letter: 'D', label: 'DevOps' },
  ];

  return (
    <div className="space-y-6 max-w-[1550px] mx-auto">
      {/* 1. Top Featured Candidate Card (Matching Image 1 & 4 Banner) */}
      <div className="rounded-2xl border border-[#e8ecf2] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-[#f1f3f7]">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-lime-500"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0e1017]">
              Trending Candidate
            </span>
          </div>
          <span className="text-xs font-medium text-[#5e6b7c]">
            {applications.length} Candidates Screened Today
          </span>
        </div>

        {featuredApp ? (
          <div className="mt-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative h-14 w-14 shrink-0 rounded-full border-2 border-lime-500/30 overflow-hidden bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${featuredApp.candidateId?.fullName || 'Amelia'}`}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#0e1017]">
                    {featuredApp.candidateId?.fullName || 'Amelia Vance'}
                  </h3>
                  <span className="flex items-center gap-1 rounded-full bg-lime-100 px-2 py-0.5 text-[11px] font-bold text-lime-800">
                    <Sparkles className="h-3 w-3" />
                    {featuredApp.fitScore}% Fit
                  </span>
                </div>
                <p className="text-xs text-[#5e6b7c]">
                  {featuredApp.candidateId?.currentDesignation || 'Lead UX Designer'} • {featuredApp.candidateId?.currentCompany || 'Digital Labs'}
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-6 text-xs border-y lg:border-y-0 lg:border-x border-[#f1f3f7] py-2 lg:py-0 lg:px-6">
              <div>
                <span className="text-[#8b98a9] text-[11px]">Expected CTC</span>
                <p className="font-bold text-[#0e1017]">
                  ₹{(featuredApp.candidateId?.expectedSalary || 2400000).toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <span className="text-[#8b98a9] text-[11px]">Experience</span>
                <p className="font-bold text-[#0e1017]">
                  {featuredApp.candidateId?.totalExperienceYears || 5} Years
                </p>
              </div>
              <div>
                <span className="text-[#8b98a9] text-[11px]">Notice Period</span>
                <p className="font-bold text-lime-700">
                  {featuredApp.candidateId?.noticePeriodDays || 15} Days (Immediate)
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5 shrink-0">
              <Link
                to={`/candidates/${featuredApp._id}`}
                className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-2 text-xs font-bold text-[#0e1017] hover:bg-slate-50 transition-colors"
              >
                View Profile
              </Link>
              <Link
                to={`/interviews?applicationId=${featuredApp._id}&schedule=true`}
                className="rounded-xl bg-[#84b81b] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#729e18] transition-colors"
              >
                Schedule Round
              </Link>
            </div>
          </div>
        ) : (
          <div className="py-4 text-xs text-slate-400">No applicants submitted yet.</div>
        )}
      </div>

      {/* 2. Middle Row: Current Openings (Left) & Acquisition Insight (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Current Openings Grid */}
        <div className="lg:col-span-2 rounded-2xl border border-[#e8ecf2] bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#f1f3f7]">
              <div>
                <h2 className="text-sm font-bold text-[#0e1017]">Current Openings</h2>
                <p className="text-xs text-[#5e6b7c]">Active requisitions matching current hiring campaigns</p>
              </div>
              <Link
                to="/jobs"
                className="text-xs font-bold text-lime-700 hover:text-lime-800 flex items-center gap-1"
              >
                View All ({jobs.length}) <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Jobs Cards 2x2 Grid */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs.slice(0, 4).map((job, idx) => {
                const icon = brandIcons[idx % brandIcons.length];
                return (
                  <div
                    key={job._id}
                    className="flex items-start justify-between rounded-xl border border-[#edf2f7] bg-[#fcfdfe] p-4 hover:border-lime-300 transition-all hover:shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`h-10 w-10 shrink-0 rounded-xl ${icon.bg} ${icon.text} flex items-center justify-center font-black text-sm shadow-sm`}
                      >
                        {job.title.charAt(0)}
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-[#0e1017] leading-snug">{job.title}</h4>
                        <p className="text-[11px] text-[#5e6b7c] mt-0.5">
                          {job.department || 'Engineering'} • {job.workplaceType}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-[10px] font-semibold text-slate-500">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-lime-600" />
                            {job.vacancies || 1} Vacanc{job.vacancies === 1 ? 'y' : 'ies'}
                          </span>
                          <span>•</span>
                          <span>{job.minExperienceYears}+ yrs</span>
                        </div>
                      </div>
                    </div>

                    <span className="rounded-full bg-lime-100/80 px-2 py-0.5 text-[10px] font-bold text-lime-800">
                      {job.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-[#f1f3f7] flex items-center justify-between text-xs text-[#5e6b7c]">
            <span>Showing top requisitions</span>
            <Link to="/jobs/create" className="font-bold text-lime-700 hover:underline">
              + Post Another Opening
            </Link>
          </div>
        </div>

        {/* Right 1 Col: Acquisition Insight (Matching Reference Chart) */}
        <div className="rounded-2xl border border-[#e8ecf2] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-[#f1f3f7]">
            <h2 className="text-sm font-bold text-[#0e1017]">Acquisition Insight</h2>
            {/* Tab Pill */}
            <div className="flex rounded-lg bg-[#f1f4f8] p-0.5 text-[11px] font-semibold">
              <button
                onClick={() => setInsightTab('month')}
                className={`rounded-md px-2.5 py-1 ${
                  insightTab === 'month' ? 'bg-white text-[#0e1017] shadow-sm' : 'text-[#8b98a9]'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setInsightTab('year')}
                className={`rounded-md px-2.5 py-1 ${
                  insightTab === 'year' ? 'bg-white text-[#0e1017] shadow-sm' : 'text-[#8b98a9]'
                }`}
              >
                This Year
              </button>
            </div>
          </div>

          {/* Progress Bars with Lime Green Fills */}
          <div className="mt-5 space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-[#0e1017]">
                <span>Overall Sourcing Efficiency</span>
                <span className="text-lime-700 font-bold">78%</span>
              </div>
              <div className="mt-1.5 h-2 w-full rounded-full bg-[#edf2f7] overflow-hidden">
                <div className="h-full rounded-full bg-lime-500" style={{ width: '78%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-[#0e1017]">
                <span>Interview Completion</span>
                <span className="text-lime-700 font-bold">64%</span>
              </div>
              <div className="mt-1.5 h-2 w-full rounded-full bg-[#edf2f7] overflow-hidden">
                <div className="h-full rounded-full bg-lime-500" style={{ width: '64%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-[#0e1017]">
                <span>Offer Acceptance Rate</span>
                <span className="text-lime-700 font-bold">{metrics?.acceptanceRate || 88}%</span>
              </div>
              <div className="mt-1.5 h-2 w-full rounded-full bg-[#edf2f7] overflow-hidden">
                <div
                  className="h-full rounded-full bg-lime-500"
                  style={{ width: `${metrics?.acceptanceRate || 88}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between font-semibold text-[#0e1017]">
                <span>Compliance & Audit Score</span>
                <span className="text-lime-700 font-bold">95%</span>
              </div>
              <div className="mt-1.5 h-2 w-full rounded-full bg-[#edf2f7] overflow-hidden">
                <div className="h-full rounded-full bg-lime-500" style={{ width: '95%' }} />
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-lime-50/80 p-3 border border-lime-200/60 text-xs text-lime-900">
            <span className="font-bold">Average Time to Hire: 18 Days</span>
            <p className="mt-0.5 text-[11px] text-lime-800">
              4.2 days faster than industry benchmark for India-based technology teams.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: Potential Candidates (Left) & Talent Reach / Demographics (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Potential Candidates Table */}
        <div className="lg:col-span-2 rounded-2xl border border-[#e8ecf2] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-[#f1f3f7]">
            <div>
              <h2 className="text-sm font-bold text-[#0e1017]">Potential Candidates</h2>
              <p className="text-xs text-[#5e6b7c]">Recently evaluated profiles with explainable fit scores</p>
            </div>
            <Link
              to="/candidates"
              className="text-xs font-bold text-lime-700 hover:underline flex items-center gap-1"
            >
              Open Pipeline <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#edf2f7] text-[#8b98a9] text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-2">Candidate</th>
                  <th className="py-3 px-2">Applied Role</th>
                  <th className="py-3 px-2">Experience</th>
                  <th className="py-3 px-2">Fit Score</th>
                  <th className="py-3 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f3f7]">
                {applications.map((app) => (
                  <tr key={app._id} className="hover:bg-[#fcfdfe]">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 shrink-0 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center font-bold text-slate-700 text-xs">
                          <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${app.candidateId?.fullName || 'Candidate'}`}
                            alt="Avatar"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-[#0e1017] leading-tight">
                            {app.candidateId?.fullName}
                          </p>
                          <p className="text-[11px] text-[#5e6b7c]">{app.candidateId?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 font-medium text-[#0e1017]">
                      {app.jobId?.title || 'Senior Role'}
                    </td>
                    <td className="py-3 px-2 text-[#5e6b7c]">
                      {app.candidateId?.totalExperienceYears} Yrs
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`rounded-full px-2 py-0.5 font-bold text-[10px] ${
                          app.fitScore >= 80
                            ? 'bg-lime-100 text-lime-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {app.fitScore}% Fit
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <Link
                        to={`/candidates/${app._id}`}
                        className="rounded-lg border border-[#e2e8f0] px-3 py-1 font-bold text-[#0e1017] hover:bg-slate-50 transition-colors"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Talent Hub Distribution */}
        <div className="rounded-2xl border border-[#e8ecf2] bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#f1f3f7]">
              <div>
                <h2 className="text-sm font-bold text-[#0e1017]">Talent Distribution</h2>
                <p className="text-xs text-[#5e6b7c]">Geographic candidate density across key hubs</p>
              </div>
              <Globe className="h-4 w-4 text-lime-600" />
            </div>

            <div className="mt-5 space-y-3.5 text-xs">
              <div>
                <div className="flex justify-between font-semibold">
                  <span className="text-[#0e1017]">Bengaluru & NCR</span>
                  <span className="text-lime-700 font-bold">54%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-[#edf2f7] overflow-hidden">
                  <div className="h-full rounded-full bg-lime-500" style={{ width: '54%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold">
                  <span className="text-[#0e1017]">Pune & Mumbai</span>
                  <span className="text-lime-700 font-bold">28%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-[#edf2f7] overflow-hidden">
                  <div className="h-full rounded-full bg-lime-500" style={{ width: '28%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold">
                  <span className="text-[#0e1017]">Hyderabad & Chennai</span>
                  <span className="text-lime-700 font-bold">18%</span>
                </div>
                <div className="mt-1 h-2 w-full rounded-full bg-[#edf2f7] overflow-hidden">
                  <div className="h-full rounded-full bg-lime-500" style={{ width: '18%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-[#f8fafc] p-3 text-xs border border-[#edf2f7] text-[#5e6b7c]">
            <p className="font-semibold text-[#0e1017]">Hybrid Workplace Policy Active</p>
            <p className="mt-0.5 text-[11px]">
              Candidates with remote readiness score an additional 5% in availability weighting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
