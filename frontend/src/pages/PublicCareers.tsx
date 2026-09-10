import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { client } from '../lib/api/client.js';
import { useAuth } from '../auth/AuthProvider.js';
import {
  Briefcase,
  MapPin,
  Clock,
  Search,
  Sparkles,
  Building2,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  User,
  Mail,
  Phone,
  Lock,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';

export const PublicCareers: React.FC = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

  // Modal States
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState<any | null>(null);

  // Application Form State
  const [formData, setFormData] = useState({
    fullName: user?.name || '',
    email: user?.email || '',
    phone: '',
    currentCity: 'Bengaluru, India',
    currentCompany: '',
    currentDesignation: '',
    totalExperienceYears: 2,
    expectedSalary: 1800000,
    noticePeriodDays: 30,
    skillsText: 'React, Node.js, TypeScript, MongoDB',
    educationText: 'B.Tech / Bachelor Degree',
    resumeText: 'Passionate software developer with experience in full-stack web applications and agile development.',
    portfolioUrl: '',
    githubUrl: '',
    linkedinUrl: '',
    password: '',
  });

  const fetchJobs = async () => {
    try {
      const res = await client.get('/jobs/public');
      setJobs(res.data.data || []);
    } catch (err) {
      console.error('Failed to load public jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const departments = ['All', ...Array.from(new Set(jobs.map((j) => j.department).filter(Boolean)))];

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      !searchTerm ||
      job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.mandatorySkills?.some((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesDept = selectedDept === 'All' || job.department === selectedDept;
    const matchesType = selectedType === 'All' || job.employmentType === selectedType;

    return matchesSearch && matchesDept && matchesType;
  });

  const handleApplyClick = (job: any) => {
    setSelectedJob(job);
    setIsApplyModalOpen(true);
    setApplyError(null);
    setApplySuccess(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    setSubmitting(true);
    setApplyError(null);

    try {
      const skills = formData.skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        jobId: selectedJob._id,
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        currentCity: formData.currentCity.trim(),
        currentCompany: formData.currentCompany.trim(),
        currentDesignation: formData.currentDesignation.trim(),
        totalExperienceYears: Number(formData.totalExperienceYears),
        expectedSalary: Number(formData.expectedSalary),
        noticePeriodDays: Number(formData.noticePeriodDays),
        skills,
        education: [formData.educationText],
        resumeText: formData.resumeText,
        portfolioUrl: formData.portfolioUrl || undefined,
        githubUrl: formData.githubUrl || undefined,
        linkedInUrl: formData.linkedinUrl || undefined,
        password: formData.password || undefined,
      };

      const res = await client.post('/candidates/public-apply', payload);
      const { accessToken, user: newUser, organization } = res.data.data;

      // If account was created and token returned, auto log in
      if (accessToken && newUser) {
        login(accessToken, newUser, organization);
      }

      setApplySuccess(res.data.data);
    } catch (err: any) {
      setApplyError(err.response?.data?.error?.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0e1017]">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-[#edf2f7] bg-white/90 backdrop-blur-md px-6 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#84b81b] text-white font-black text-lg shadow-xs">
              H
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight text-[#0e1017]">HireFlow</span>
                <span className="rounded bg-[#edf7d2] px-1.5 py-0.5 text-[10px] font-bold text-[#567715]">
                  CAREERS
                </span>
              </div>
              <p className="text-[10px] text-[#5e6b7c] font-medium">Opportunities & Internships</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-1.5 rounded-full bg-[#84b81b] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#729e18] transition-all"
              >
                <span>My Portal Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <Link
                to="/login"
                className="rounded-full border border-[#edf2f7] bg-white px-4 py-2 text-xs font-bold text-[#0e1017] hover:bg-slate-50 transition-all shadow-xs"
              >
                Sign In to Portal
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-[#0e1017] py-16 px-6 text-white text-center">
        <div className="absolute inset-0 bg-[radial-gradient(#84b81b_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
        <div className="relative mx-auto max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-[#edf7d2] backdrop-blur-xs border border-white/10">
            <Sparkles className="h-3.5 w-3.5 text-[#84b81b]" />
            <span>We're Hiring High-Impact Builders</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            Find Your Next Career Milestone
          </h1>
          <p className="text-sm text-[#94a3b8] max-w-xl mx-auto leading-relaxed">
            Explore active openings, full-time engineering roles, and high-growth internships. Apply with your profile and track your interview rounds in real time.
          </p>

          {/* Search Bar */}
          <div className="pt-4 max-w-xl mx-auto flex items-center gap-2 rounded-2xl bg-white p-2 shadow-xl border border-white/20 text-[#0e1017]">
            <Search className="h-5 w-5 text-[#8b98a9] ml-2 shrink-0" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by job title, skill (e.g. React, Node.js), or department..."
              className="w-full bg-transparent px-2 py-1.5 text-xs text-[#0e1017] placeholder-[#8b98a9] focus:outline-none"
            />
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-6 py-10 space-y-8">
        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#edf2f7] pb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-[#5e6b7c] mr-2 flex items-center gap-1">
              <Filter className="h-3.5 w-3.5" /> Department:
            </span>
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                  selectedDept === dept
                    ? 'bg-[#84b81b] text-white shadow-xs'
                    : 'bg-white border border-[#edf2f7] text-[#5e6b7c] hover:bg-slate-50'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#5e6b7c]">Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="rounded-xl border border-[#edf2f7] bg-white px-3 py-1.5 text-xs font-bold text-[#0e1017] focus:outline-none"
            >
              <option value="All">All Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Internship">Internship</option>
              <option value="Contract">Contract</option>
            </select>
          </div>
        </div>

        {/* Jobs Grid */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#84b81b] border-t-transparent" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <Briefcase className="mx-auto h-12 w-12 text-[#8b98a9]" />
            <h3 className="mt-3 text-sm font-bold text-[#0e1017]">No open requisitions matching your filter</h3>
            <p className="mt-1 text-xs text-[#5e6b7c]">Try adjusting your search terms or department filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredJobs.map((job) => (
              <div
                key={job._id}
                className="group flex flex-col justify-between rounded-3xl border border-[#edf2f7] bg-white p-6 shadow-sm hover:shadow-md hover:border-[#84b81b]/50 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-[#edf7d2] px-3 py-1 text-[11px] font-bold text-[#567715]">
                      {job.department}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-[#5e6b7c]">
                      {job.employmentType || 'Full-time'}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-[#0e1017] group-hover:text-[#84b81b] transition-colors line-clamp-1">
                    {job.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#5e6b7c]">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-[#8b98a9]" />
                      <span>{job.location || 'India (Hybrid)'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-[#8b98a9]" />
                      <span>{job.minExperienceYears || 0}+ Years Exp</span>
                    </div>
                  </div>

                  {job.salaryMin && job.salaryMax && (
                    <div className="text-xs font-bold text-[#567715] bg-[#edf7d2]/40 rounded-xl px-2.5 py-1.5 border border-[#edf7d2]">
                      ₹{(job.salaryMin / 100000).toFixed(1)}L – ₹{(job.salaryMax / 100000).toFixed(1)}L PA
                    </div>
                  )}

                  {/* Skills Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {job.mandatorySkills?.slice(0, 4).map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="rounded-lg bg-[#f8fafc] px-2 py-0.5 text-[10px] font-semibold text-[#5e6b7c] border border-[#edf2f7]"
                      >
                        {skill}
                      </span>
                    ))}
                    {job.mandatorySkills?.length > 4 && (
                      <span className="text-[10px] font-bold text-[#8b98a9] self-center">
                        +{job.mandatorySkills.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-5 mt-4 border-t border-[#edf2f7] flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#8b98a9]">
                    {job.orgId?.name || 'HireFlow Partner'}
                  </span>
                  <button
                    onClick={() => handleApplyClick(job)}
                    className="flex items-center gap-1.5 rounded-full bg-[#84b81b] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#729e18] transition-colors"
                  >
                    <span>Apply Now</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Apply Modal */}
      {isApplyModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#edf2f7] my-8 max-h-[90vh] overflow-y-auto">
            {applySuccess ? (
              <div className="text-center py-8 space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#edf7d2] text-[#84b81b]">
                  <CheckCircle2 className="h-8 w-8 stroke-[2.5]" />
                </div>
                <h3 className="text-xl font-black text-[#0e1017]">Application Submitted Successfully!</h3>
                <p className="text-xs text-[#5e6b7c] max-w-md mx-auto leading-relaxed">
                  Thank you, <strong>{formData.fullName}</strong>. Your profile has been sent to the recruiting team for <strong>{selectedJob.title}</strong>. An email confirmation has been dispatched.
                </p>
                <div className="pt-4 flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setIsApplyModalOpen(false);
                      navigate('/');
                    }}
                    className="flex items-center gap-2 rounded-full bg-[#84b81b] px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#729e18] transition-all"
                  >
                    <span>Go to My Candidate Portal</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between pb-4 border-b border-[#edf2f7]">
                  <div>
                    <span className="rounded-full bg-[#edf7d2] px-2.5 py-0.5 text-[10px] font-bold text-[#567715]">
                      {selectedJob.department}
                    </span>
                    <h2 className="mt-1 text-lg font-black text-[#0e1017]">
                      Apply for {selectedJob.title}
                    </h2>
                    <p className="text-xs text-[#5e6b7c]">
                      {selectedJob.orgId?.name || 'HireFlow Workspace'} • {selectedJob.location || 'India'}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsApplyModalOpen(false)}
                    className="p-1 text-[#8b98a9] hover:text-[#0e1017] rounded-lg hover:bg-slate-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {applyError && (
                  <div className="mt-4 flex items-center gap-2 rounded-2xl bg-red-50 p-3 text-xs text-red-700 border border-red-100">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{applyError}</span>
                  </div>
                )}

                <form onSubmit={handleFormSubmit} className="mt-5 space-y-4 text-xs">
                  {/* Personal Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-[#5e6b7c] uppercase text-[10px]">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="e.g. Rahul Sharma"
                        className="mt-1 w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 font-medium focus:border-[#84b81b] focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#5e6b7c] uppercase text-[10px]">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g. rahul@example.com"
                        className="mt-1 w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 font-medium focus:border-[#84b81b] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-[#5e6b7c] uppercase text-[10px]">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="mt-1 w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 font-medium focus:border-[#84b81b] focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#5e6b7c] uppercase text-[10px]">Current Location / City *</label>
                      <input
                        type="text"
                        required
                        value={formData.currentCity}
                        onChange={(e) => setFormData({ ...formData, currentCity: e.target.value })}
                        placeholder="Bengaluru, Pune, Mumbai, Remote"
                        className="mt-1 w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 font-medium focus:border-[#84b81b] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Professional Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-[#5e6b7c] uppercase text-[10px]">Total Experience (Years) *</label>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        required
                        value={formData.totalExperienceYears}
                        onChange={(e) => setFormData({ ...formData, totalExperienceYears: Number(e.target.value) })}
                        className="mt-1 w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 font-medium focus:border-[#84b81b] focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#5e6b7c] uppercase text-[10px]">Current Company / College</label>
                      <input
                        type="text"
                        value={formData.currentCompany}
                        onChange={(e) => setFormData({ ...formData, currentCompany: e.target.value })}
                        placeholder="e.g. Infosys / IIT Bombay / Freelancer"
                        className="mt-1 w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 font-medium focus:border-[#84b81b] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-[#5e6b7c] uppercase text-[10px]">Key Skills (comma separated) *</label>
                    <input
                      type="text"
                      required
                      value={formData.skillsText}
                      onChange={(e) => setFormData({ ...formData, skillsText: e.target.value })}
                      placeholder="React, TypeScript, Node.js, Next.js, PostgreSQL"
                      className="mt-1 w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 font-medium focus:border-[#84b81b] focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* Online Profiles */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-[#5e6b7c] uppercase text-[10px]">LinkedIn Profile URL</label>
                      <input
                        type="url"
                        value={formData.linkedinUrl}
                        onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                        placeholder="https://linkedin.com/in/username"
                        className="mt-1 w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 font-medium focus:border-[#84b81b] focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#5e6b7c] uppercase text-[10px]">GitHub / Portfolio URL</label>
                      <input
                        type="url"
                        value={formData.githubUrl}
                        onChange={(e) => setFormData({ ...formData, githubUrl: e.target.value })}
                        placeholder="https://github.com/username"
                        className="mt-1 w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 font-medium focus:border-[#84b81b] focus:bg-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Resume / Cover Text */}
                  <div>
                    <label className="block font-bold text-[#5e6b7c] uppercase text-[10px]">Resume Summary / Bio *</label>
                    <textarea
                      rows={3}
                      required
                      value={formData.resumeText}
                      onChange={(e) => setFormData({ ...formData, resumeText: e.target.value })}
                      placeholder="Summarize your professional accomplishments, core tech stack, and key projects..."
                      className="mt-1 w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 font-medium focus:border-[#84b81b] focus:bg-white focus:outline-none"
                    />
                  </div>

                  {/* Password creation for Candidate Portal account */}
                  {!user && (
                    <div className="rounded-2xl bg-[#edf7d2]/60 p-3.5 border border-[#edf7d2]">
                      <div className="flex items-center gap-1.5 font-bold text-[#567715] text-[11px]">
                        <Lock className="h-3.5 w-3.5 text-[#84b81b]" />
                        <span>Create Candidate Portal Password</span>
                      </div>
                      <p className="text-[10px] text-[#5e6b7c] mt-0.5 mb-2">
                        Set a password to log into your Candidate Dashboard, track interview rounds, and view offer letters.
                      </p>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Choose a password (min 6 chars)"
                        className="w-full rounded-xl border border-[#edf2f7] bg-white p-2 text-xs font-medium focus:border-[#84b81b] focus:outline-none"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#edf2f7]">
                    <button
                      type="button"
                      onClick={() => setIsApplyModalOpen(false)}
                      className="rounded-full px-5 py-2.5 font-semibold text-[#5e6b7c] hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center gap-2 rounded-full bg-[#84b81b] px-6 py-2.5 font-bold text-white shadow-sm hover:bg-[#729e18] disabled:opacity-50 transition-all"
                    >
                      {submitting ? (
                        <>
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          <span>Submitting Application...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Application</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};