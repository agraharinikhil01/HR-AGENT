import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { client } from '../lib/api/client.js';
import {
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export const PublicJobApply: React.FC = () => {
  const { orgSlug, jobSlug } = useParams<{ orgSlug: string; jobSlug: string }>();

  const [jobData, setJobData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    currentCity: '',
    currentCompany: '',
    currentDesignation: '',
    totalExperienceYears: 3,
    expectedSalary: 1800000,
    noticePeriodDays: 30,
    skillsText: '',
    educationText: 'B.Tech / Bachelor Degree',
    resumeText: '',
  });

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await client.get(`/jobs/public/${orgSlug}/${jobSlug}`);
        setJobData(res.data.data);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || 'Job opening not found or inactive.');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [orgSlug, jobSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await client.post(`/candidates/public-apply/${orgSlug}/${jobSlug}`, {
        ...formData,
        totalExperienceYears: Number(formData.totalExperienceYears),
        expectedSalary: Number(formData.expectedSalary),
        noticePeriodDays: Number(formData.noticePeriodDays),
        skills: formData.skillsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        education: formData.educationText
          .split(',')
          .map((e) => e.trim())
          .filter(Boolean),
      });

      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to submit application.');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f6f8fa]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#84b81b] border-t-transparent"></div>
      </div>
    );
  }

  if (error && !jobData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f6f8fa] p-6 text-center">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <h2 className="mt-3 text-lg font-bold text-[#0e1017]">Job Opening Not Available</h2>
        <p className="mt-1 text-sm text-[#5e6b7c]">{error}</p>
      </div>
    );
  }

  const { organization, job } = jobData;

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f6f8fa] p-6 text-center">
        <div className="rounded-full bg-[#edf7d2] p-5 text-[#567715] shadow-sm">
          <CheckCircle2 className="h-12 w-12 text-[#84b81b]" />
        </div>
        <h2 className="mt-4 text-2xl font-black text-[#0e1017]">Application Submitted!</h2>
        <p className="mt-2 text-xs text-[#5e6b7c] max-w-md">
          Thank you for applying for the <strong>{job.title}</strong> role at{' '}
          <strong>{organization.name}</strong>. Our recruiting team will review your profile and be in touch soon.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fa] py-12 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Job Header Card */}
        <div className="rounded-3xl border border-[#edf2f7] bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#84b81b] text-white font-black text-sm">
              H
            </div>
            <div>
              <span className="text-xs font-black text-[#0e1017]">{organization.name}</span>
              <span className="ml-1.5 rounded bg-[#edf7d2] px-1.5 py-0.5 text-[10px] font-bold text-[#567715]">
                Careers
              </span>
            </div>
          </div>

          <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-[#0e1017]">
            {job.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#5e6b7c]">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-[#8b98a9]" /> {job.location} ({job.workplaceType})
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-[#8b98a9]" /> {job.employmentType}
            </span>
            <span>Min Experience: <strong>{job.minExperienceYears}+ years</strong></span>
          </div>

          {/* Job Overview */}
          <div className="mt-6 border-t border-[#edf2f7] pt-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0e1017]">About the Role</h2>
            <p className="mt-2 text-xs text-[#5e6b7c] leading-relaxed whitespace-pre-line">
              {job.description}
            </p>
          </div>

          {/* Responsibilities */}
          {job.responsibilities?.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0e1017]">Key Responsibilities</h2>
              <ul className="mt-2 space-y-1.5 text-xs text-[#5e6b7c]">
                {job.responsibilities.map((r: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#84b81b] mt-1.5 shrink-0" />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Mandatory Skills */}
          {job.mandatorySkills?.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#0e1017]">Required Skills</h2>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {job.mandatorySkills.map((s: string) => (
                  <span
                    key={s}
                    className="rounded-xl bg-[#edf7d2] px-3 py-1 text-xs font-bold text-[#567715]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Application Form */}
        <div className="rounded-3xl border border-[#edf2f7] bg-white p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-black text-[#0e1017]">Apply for this Position</h2>
          <p className="mt-0.5 text-xs text-[#5e6b7c]">
            Submit your profile details for instant candidate fit evaluation
          </p>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-red-50 p-3 text-xs text-red-700 border border-red-100">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Aarav Sharma"
                  className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 text-xs focus:border-[#84b81b] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="aarav@example.com"
                  className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 text-xs focus:border-[#84b81b] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 9876543210"
                  className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 text-xs focus:border-[#84b81b] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">Experience (Years)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.totalExperienceYears}
                  onChange={(e) => setFormData({ ...formData, totalExperienceYears: Number(e.target.value) })}
                  className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 text-xs focus:border-[#84b81b] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">Notice Period (Days)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.noticePeriodDays}
                  onChange={(e) => setFormData({ ...formData, noticePeriodDays: Number(e.target.value) })}
                  className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 text-xs focus:border-[#84b81b] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">Current Role</label>
                <input
                  type="text"
                  value={formData.currentDesignation}
                  onChange={(e) => setFormData({ ...formData, currentDesignation: e.target.value })}
                  placeholder="Software Engineer"
                  className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 text-xs focus:border-[#84b81b] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">Current Employer</label>
                <input
                  type="text"
                  value={formData.currentCompany}
                  onChange={(e) => setFormData({ ...formData, currentCompany: e.target.value })}
                  placeholder="Tech Labs Ltd."
                  className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 text-xs focus:border-[#84b81b] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">
                Skills & Tech Stack (Comma-separated) *
              </label>
              <input
                type="text"
                required
                value={formData.skillsText}
                onChange={(e) => setFormData({ ...formData, skillsText: e.target.value })}
                placeholder="React, TypeScript, Node.js, AWS, PostgreSQL"
                className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 text-xs focus:border-[#84b81b] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">
                Summary / Resume Highlights
              </label>
              <textarea
                rows={3}
                value={formData.resumeText}
                onChange={(e) => setFormData({ ...formData, resumeText: e.target.value })}
                placeholder="Key accomplishments, open source projects, or system architecture experience..."
                className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 text-xs focus:border-[#84b81b] focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-full bg-[#84b81b] py-3 text-xs font-bold text-white shadow-sm hover:bg-[#729e18] transition-colors"
              >
                <span>Submit Application</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
