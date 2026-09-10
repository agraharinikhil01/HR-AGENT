import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { client } from '../lib/api/client.js';
import { useAuth } from '../auth/AuthProvider.js';
import {
  Briefcase,
  Plus,
  Search,
  MapPin,
  Users,
  Copy,
  Check,
  Building2,
  Share2,
} from 'lucide-react';

export const JobsList: React.FC = () => {
  const { organization, user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const brandColors = [
    { bg: 'bg-[#611f69]', text: 'text-white', label: 'SL' }, // Slack-like
    { bg: 'bg-[#1ed760]', text: 'text-black', label: 'SP' }, // Spotify-like
    { bg: 'bg-[#ea4c89]', text: 'text-white', label: 'DR' }, // Dribbble-like
    { bg: 'bg-[#0061ff]', text: 'text-white', label: 'DB' }, // Dropbox-like
    { bg: 'bg-[#ff5a5f]', text: 'text-white', label: 'AB' }, // Airbnb-like
    { bg: 'bg-[#84b81b]', text: 'text-white', label: 'HF' }, // HireFlow
  ];

  const fetchJobs = async () => {
    try {
      const res = await client.get('/jobs', { params: { search } });
      setJobs(res.data.data);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [search]);

  const copyPublicLink = (slug: string) => {
    const url = `${window.location.origin}/careers/${organization?.slug}/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(slug);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-[#0e1017]">Job Openings</h1>
          <p className="text-xs text-[#5e6b7c]">
            Active requisitions, mandatory criteria scoring, and public careers portals
          </p>
        </div>

        {['ORG_ADMIN', 'RECRUITER'].includes(user?.role || '') && (
          <Link
            to="/jobs/create"
            className="flex items-center gap-1.5 rounded-full bg-[#84b81b] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#729e18] transition-colors"
          >
            <Plus className="h-3.5 w-3.5 stroke-[3]" />
            <span>Post New Opening</span>
          </Link>
        )}
      </div>

      {/* Search Toolbar */}
      <div className="flex items-center justify-between gap-4 rounded-3xl border border-[#edf2f7] bg-white p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute inset-y-0 left-0 h-3.5 w-3.5 text-[#8b98a9] pl-3 my-auto" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by role, department or required skill..."
            className="w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] py-2 pl-9 pr-3 text-xs focus:border-[#84b81b] focus:bg-white focus:outline-none"
          />
        </div>

        <span className="text-xs font-semibold text-[#5e6b7c]">
          Showing {jobs.length} requisitions
        </span>
      </div>

      {/* Jobs Grid (Reference Image 1 & 4 "Current Openings" styling) */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#84b81b] border-t-transparent"></div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <Briefcase className="mx-auto h-12 w-12 text-[#8b98a9]" />
          <h3 className="mt-3 text-sm font-bold text-[#0e1017]">No requisitions found</h3>
          <p className="mt-1 text-xs text-[#5e6b7c]">
            Get started by creating a new job opening with AI job description assistance.
          </p>
          <div className="mt-5">
            <Link
              to="/jobs/create"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#84b81b] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#729e18]"
            >
              <Plus className="h-3.5 w-3.5 stroke-[3]" /> Create Opening
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job, idx) => {
            const color = brandColors[idx % brandColors.length];

            return (
              <div
                key={job._id}
                className="flex flex-col justify-between rounded-3xl border border-[#edf2f7] bg-white p-5 shadow-sm hover:shadow-md transition-all group"
              >
                <div>
                  {/* Top: Colorful Icon Square + Status Pill */}
                  <div className="flex items-center justify-between">
                    <div
                      className={`h-10 w-10 rounded-2xl ${color.bg} ${color.text} flex items-center justify-center text-xs font-black shadow-xs`}
                    >
                      {color.label}
                    </div>

                    <span
                      className={`rounded-full px-3 py-0.5 text-[11px] font-bold ${
                        job.status === 'Open'
                          ? 'bg-[#edf7d2] text-[#567715]'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>

                  {/* Title & Department */}
                  <h3 className="mt-4 text-base font-bold text-[#0e1017] leading-snug group-hover:text-[#84b81b] transition-colors">
                    {job.title}
                  </h3>
                  <p className="text-xs font-medium text-[#5e6b7c] mt-0.5">
                    {job.department || 'Engineering'} • {job.employmentType}
                  </p>

                  {/* Location & Compensation */}
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-[#5e6b7c]">
                    <MapPin className="h-3.5 w-3.5 text-[#8b98a9]" />
                    <span>{job.location} ({job.workplaceType})</span>
                  </div>

                  {job.minSalary && job.maxSalary && (
                    <p className="mt-2 text-xs font-bold text-[#0e1017]">
                      ₹{(job.minSalary / 100000).toFixed(1)}L – ₹{(job.maxSalary / 100000).toFixed(1)}L INR / yr
                    </p>
                  )}

                  {/* Mandatory Skills Pills */}
                  <div className="mt-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b98a9] block mb-1.5">
                      Mandatory Criteria
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {job.mandatorySkills?.slice(0, 3).map((skill: string) => (
                        <span
                          key={skill}
                          className="rounded-xl bg-[#edf7d2] px-2.5 py-0.5 text-[10px] font-bold text-[#567715]"
                        >
                          {skill}
                        </span>
                      ))}
                      {job.mandatorySkills?.length > 3 && (
                        <span className="rounded-xl bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-[#5e6b7c]">
                          +{job.mandatorySkills.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="mt-6 flex items-center justify-between border-t border-[#edf2f7] pt-4">
                  <button
                    onClick={() => copyPublicLink(job.slug)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#5e6b7c] hover:text-[#0e1017] transition-colors"
                  >
                    {copiedId === job.slug ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#84b81b]" />
                        <span className="text-[#84b81b] font-bold">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="h-3.5 w-3.5 text-[#8b98a9]" />
                        <span>Public Link</span>
                      </>
                    )}
                  </button>

                  <Link
                    to={`/candidates?jobId=${job._id}`}
                    className="flex items-center gap-1.5 rounded-full bg-[#f8fafc] border border-[#edf2f7] px-3 py-1 text-xs font-bold text-[#0e1017] hover:bg-[#edf7d2] hover:text-[#567715] transition-colors"
                  >
                    <Users className="h-3.5 w-3.5 text-[#84b81b]" />
                    <span>View Candidates</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
