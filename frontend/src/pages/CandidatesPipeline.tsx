import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { client } from '../lib/api/client.js';
import { useAuth } from '../auth/AuthProvider.js';
import {
  Users,
  Search,
  Plus,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  X,
  Building2,
  Briefcase,
  MapPin,
  Clock,
  IndianRupee,
  CheckCircle2,
  FileText,
  Star,
  ExternalLink,
} from 'lucide-react';

const KANBAN_STAGES = [
  'Applied',
  'AI Reviewed',
  'Shortlisted',
  'Interview',
  'Offer Approval',
  'Offer Sent',
  'Offer Accepted',
];

export const CandidatesPipeline: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialJobId = searchParams.get('jobId') || '';

  const [applications, setApplications] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState(initialJobId);
  const [search, setSearch] = useState('');
  const [minScore, setMinScore] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Quick candidate creation modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    fullName: '',
    email: '',
    phone: '',
    currentCompany: '',
    currentDesignation: '',
    totalExperienceYears: 3,
    expectedSalary: 1800000,
    noticePeriodDays: 30,
    skillsText: '',
    jobId: '',
  });

  // Comparison modal state (up to 5)
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [comparisonData, setComparisonData] = useState<any[] | null>(null);

  const fetchData = async () => {
    try {
      const [appsRes, jobsRes] = await Promise.all([
        client.get('/candidates/applications', {
          params: {
            jobId: selectedJobId || undefined,
            minScore: minScore > 0 ? minScore : undefined,
            search: search || undefined,
          },
        }),
        client.get('/jobs'),
      ]);

      setApplications(appsRes.data.data);
      setJobs(jobsRes.data.data);
      if (!newCandidate.jobId && jobsRes.data.data.length > 0) {
        setNewCandidate((prev) => ({ ...prev, jobId: jobsRes.data.data[0]._id }));
      }
    } catch (err) {
      console.error('Failed to fetch pipeline data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedJobId, minScore, search]);

  const handleStageChange = async (applicationId: string, newStage: string) => {
    try {
      await client.patch(`/candidates/applications/${applicationId}/stage`, {
        stage: newStage,
      });
      setApplications((prev) =>
        prev.map((app) => (app._id === applicationId ? { ...app, stage: newStage } : app))
      );
    } catch (err) {
      console.error('Failed to update stage:', err);
    }
  };

  const handlePickBest = async (applicationId: string) => {
    try {
      await client.post(`/candidates/applications/${applicationId}/pick-best`);
      await fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to shortlist candidate');
    }
  };

  const handleDownloadResume = async (candidateId: string) => {
    try {
      const res = await client.get(`/candidates/${candidateId}/resume`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err: any) {
      alert('Could not view resume. Please verify a PDF has been uploaded.');
    }
  };

  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.post('/candidates', {
        ...newCandidate,
        totalExperienceYears: Number(newCandidate.totalExperienceYears),
        expectedSalary: Number(newCandidate.expectedSalary),
        noticePeriodDays: Number(newCandidate.noticePeriodDays),
        skills: newCandidate.skillsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      });

      setShowAddModal(false);
      setNewCandidate({
        fullName: '',
        email: '',
        phone: '',
        currentCompany: '',
        currentDesignation: '',
        totalExperienceYears: 3,
        expectedSalary: 1800000,
        noticePeriodDays: 30,
        skillsText: '',
        jobId: jobs[0]?._id || '',
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error creating candidate');
    }
  };

  const toggleCompare = (appId: string) => {
    if (selectedForCompare.includes(appId)) {
      setSelectedForCompare((prev) => prev.filter((id) => id !== appId));
    } else {
      if (selectedForCompare.length >= 5) {
        alert('You can compare a maximum of 5 candidates at a time.');
        return;
      }
      setSelectedForCompare((prev) => [...prev, appId]);
    }
  };

  const runCompare = async () => {
    if (selectedForCompare.length < 2) {
      alert('Select at least 2 candidates to compare.');
      return;
    }
    try {
      const res = await client.get(`/candidates/compare?ids=${selectedForCompare.join(',')}`);
      setComparisonData(res.data.data);
    } catch (err) {
      console.error('Failed to run comparison:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-[#0e1017]">
            Candidates Pipeline & Kanban
          </h1>
          <p className="text-xs text-[#5e6b7c]">
            Track candidate progression across recruitment stages with explainable AI fit scores
          </p>
        </div>

        <div className="flex items-center gap-3">
          {selectedForCompare.length > 0 && (
            <button
              onClick={runCompare}
              className="flex items-center gap-1.5 rounded-full bg-[#edf7d2] px-4 py-2 text-xs font-bold text-[#567715] shadow-xs hover:bg-[#dff0b8] transition-colors"
            >
              Compare Selected ({selectedForCompare.length})
            </button>
          )}

          <Link
            to="/ats-screener"
            className="flex items-center gap-1.5 rounded-full bg-[#0e1017] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#84b81b]" />
            <span>Batch ATS Screener</span>
            <span className="rounded-full bg-[#84b81b] px-1.5 py-0.2 text-[9px] font-black text-white">NEW</span>
          </Link>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-full bg-[#84b81b] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#729e18] transition-colors"
          >
            <Plus className="h-3.5 w-3.5 stroke-[3]" />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>

      {/* Modern Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-[#edf2f7] bg-white p-4 shadow-sm">
        {/* Job opening selector */}
        <div className="min-w-[220px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b98a9] block mb-1">
            Requisition Filter
          </span>
          <select
            value={selectedJobId}
            onChange={(e) => {
              setSelectedJobId(e.target.value);
              setSearchParams(e.target.value ? { jobId: e.target.value } : {});
            }}
            className="w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] px-3 py-1.5 text-xs font-medium text-[#0e1017] focus:border-[#84b81b] focus:outline-none"
          >
            <option value="">All Job Openings ({jobs.length})</option>
            {jobs.map((j) => (
              <option key={j._id} value={j._id}>
                {j.title} ({j.department})
              </option>
            ))}
          </select>
        </div>

        {/* Fit Score Slider */}
        <div className="min-w-[180px]">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[#8b98a9] mb-1">
            <span>Min AI Fit Score</span>
            <span className="text-[#567715] font-black">{minScore}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={90}
            step={5}
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="w-full accent-[#84b81b]"
          />
        </div>

        {/* Search Field */}
        <div className="flex-1 min-w-[220px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b98a9] block mb-1">
            Search Candidate
          </span>
          <div className="relative">
            <Search className="pointer-events-none absolute inset-y-0 left-0 h-3.5 w-3.5 text-[#8b98a9] pl-2.5 my-auto" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, designation or skill..."
              className="w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] py-1.5 pl-8 pr-3 text-xs focus:border-[#84b81b] focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ⭐ Top AI ATS Match / Recommendation Banner */}
      {(() => {
        const topCandidateApp =
          applications && applications.length > 0
            ? [...applications].sort((a, b) => b.fitScore - a.fitScore)[0]
            : null;

        if (!topCandidateApp) return null;

        return (
          <div className="relative overflow-hidden rounded-3xl bg-[#0e1017] p-6 text-white shadow-md border border-slate-800">
            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#84b81b]/15 blur-2xl pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 shrink-0 rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shadow-inner">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${topCandidateApp.candidateId?.fullName || 'Candidate'}`}
                    alt={topCandidateApp.candidateId?.fullName}
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#84b81b] text-white text-[9px] font-black">
                    ★
                  </span>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#84b81b] px-2.5 py-0.5 text-[10px] font-black text-white uppercase tracking-wide">
                      TOP AI ATS MATCH ({topCandidateApp.fitScore}%)
                    </span>
                    <span className="text-xs text-slate-400">
                      Target: <strong>{topCandidateApp.jobId?.title || 'Open Role'}</strong>
                    </span>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                      Stage: {topCandidateApp.stage}
                    </span>
                  </div>

                  <h3 className="text-lg font-black text-white mt-1">
                    {topCandidateApp.candidateId?.fullName || 'Top Candidate'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {topCandidateApp.candidateId?.currentDesignation || 'Candidate'} • {topCandidateApp.candidateId?.totalExperienceYears || 0} yrs exp • Notice: {topCandidateApp.candidateId?.noticePeriodDays || 30} days
                  </p>

                  {topCandidateApp.candidateId?.skills && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {topCandidateApp.candidateId.skills.slice(0, 5).map((sk: string) => (
                        <span key={sk} className="rounded-md bg-slate-800 border border-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-200">
                          {sk}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                {topCandidateApp.candidateId?.resumeBase64 && (
                  <button
                    onClick={() => handleDownloadResume(topCandidateApp.candidateId._id)}
                    className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 transition-all shadow-xs"
                  >
                    <FileText className="h-3.5 w-3.5 text-[#84b81b]" />
                    <span>View PDF Resume</span>
                  </button>
                )}

                {topCandidateApp.stage !== 'Shortlisted' && topCandidateApp.stage !== 'Offer Accepted' && (
                  <button
                    onClick={() => handlePickBest(topCandidateApp._id)}
                    className="flex items-center gap-2 rounded-full bg-[#84b81b] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#729e18] transition-all"
                  >
                    <Star className="h-4 w-4 fill-white" />
                    <span>Pick / Shortlist Best Candidate</span>
                  </button>
                )}

                <Link
                  to={`/candidates/${topCandidateApp._id}`}
                  className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800 transition-all"
                >
                  <span>Full Profile</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Kanban Board Columns */}
      <div className="flex gap-4 overflow-x-auto pb-6">
        {KANBAN_STAGES.map((stage) => {
          const stageApps = applications.filter((app) => app.stage === stage);

          return (
            <div
              key={stage}
              className="w-80 shrink-0 rounded-3xl bg-white border border-[#edf2f7] p-4 shadow-sm flex flex-col"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#edf2f7]">
                <span className="text-xs font-bold text-[#0e1017]">{stage}</span>
                <span className="rounded-full bg-[#edf7d2] px-2.5 py-0.5 text-[11px] font-extrabold text-[#567715]">
                  {stageApps.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="mt-3 space-y-3 flex-1 min-h-[450px]">
                {stageApps.length === 0 ? (
                  <div className="flex h-36 items-center justify-center rounded-2xl border border-dashed border-slate-200 text-center p-4">
                    <p className="text-[11px] text-[#8b98a9]">No candidates in {stage}</p>
                  </div>
                ) : (
                  stageApps.map((app) => {
                    const candidate = app.candidateId;
                    const isSelected = selectedForCompare.includes(app._id);

                    return (
                      <div
                        key={app._id}
                        className={`group relative rounded-2xl border bg-white p-3.5 shadow-xs transition-all hover:shadow-md ${
                          isSelected
                            ? 'border-[#84b81b] ring-2 ring-[#edf7d2]'
                            : 'border-[#edf2f7] hover:border-slate-300'
                        }`}
                      >
                        {/* Top: Score pill & Compare checkbox */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <div className="flex items-center gap-1 rounded-full bg-[#edf7d2] px-2.5 py-0.5 text-[10px] font-black text-[#567715]">
                              <Sparkles className="h-3 w-3 text-[#84b81b]" />
                              <span>{candidate?.atsScore || app.fitScore}% ATS</span>
                            </div>

                            <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[9px] font-black text-slate-700">
                              Grade {candidate?.atsGrade || (app.fitScore >= 85 ? 'A+' : app.fitScore >= 70 ? 'A' : 'B')}
                            </span>

                            {candidate?.resumeBase64 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadResume(candidate._id);
                                }}
                                title="View PDF Resume"
                                className="flex items-center gap-1 rounded-full bg-slate-100 hover:bg-[#84b81b] hover:text-white px-2 py-0.5 text-[9px] font-bold text-slate-700 transition-colors shadow-2xs"
                              >
                                <FileText className="h-3 w-3" />
                                <span>PDF</span>
                              </button>
                            )}
                          </div>

                          <label className="flex items-center gap-1 text-[10px] font-semibold text-[#8b98a9] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleCompare(app._id)}
                              className="rounded border-[#edf2f7] text-[#84b81b] focus:ring-[#84b81b]"
                            />
                            <span>Compare</span>
                          </label>
                        </div>

                        {/* Candidate Identity */}
                        <div className="mt-3 flex items-center gap-2.5">
                          <div className="h-9 w-9 shrink-0 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-xs font-bold text-slate-700">
                            <img
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate?.fullName || 'Candidate'}`}
                              alt={candidate?.fullName}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="truncate">
                            <Link
                              to={`/candidates/${app._id}`}
                              className="font-bold text-xs text-[#0e1017] hover:text-[#84b81b] transition-colors truncate block"
                            >
                              {candidate?.fullName || 'Applicant'}
                            </Link>
                            <p className="text-[11px] text-[#5e6b7c] truncate">
                              {candidate?.currentDesignation || 'Candidate'}
                            </p>
                          </div>
                        </div>

                        {/* Metadata Tag Row */}
                        <div className="mt-2.5 flex items-center gap-2 text-[10px] font-medium text-[#8b98a9]">
                          <span>{candidate?.totalExperienceYears} yrs</span>
                          <span>•</span>
                          <span>{candidate?.noticePeriodDays}d notice</span>
                          <span>•</span>
                          <span>₹{((candidate?.expectedSalary || 0) / 100000).toFixed(1)}L</span>
                        </div>

                        {/* Skills preview in soft lime pills */}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {candidate?.skills?.slice(0, 3).map((s: string) => (
                            <span
                              key={s}
                              className="rounded-lg bg-[#edf7d2] px-2 py-0.5 text-[9px] font-bold text-[#567715]"
                            >
                              {s}
                            </span>
                          ))}
                        </div>

                        {/* Stage Mover & Pick Best */}
                        <div className="mt-3 flex items-center justify-between border-t border-[#edf2f7] pt-2 text-[11px] gap-1.5">
                          {app.stage !== 'Shortlisted' && app.stage !== 'Offer Accepted' ? (
                            <button
                              type="button"
                              onClick={() => handlePickBest(app._id)}
                              title="Shortlist this candidate as top match"
                              className="flex items-center gap-1 rounded-md bg-[#edf7d2] hover:bg-[#84b81b] hover:text-white px-2 py-1 text-[10px] font-bold text-[#567715] transition-all"
                            >
                              <Star className="h-3 w-3 fill-current" />
                              <span>Pick Best</span>
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-[#8b98a9] uppercase">Move:</span>
                          )}

                          <select
                            value={app.stage}
                            onChange={(e) => handleStageChange(app._id, e.target.value)}
                            className="rounded-lg border border-[#edf2f7] bg-[#f8fafc] px-2 py-1 text-[11px] font-medium text-[#0e1017] focus:border-[#84b81b] focus:outline-none"
                          >
                            {KANBAN_STAGES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Candidate Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-[#edf2f7]">
            <div className="flex items-center justify-between pb-3 border-b border-[#edf2f7]">
              <div>
                <h3 className="font-bold text-sm text-[#0e1017]">Add New Candidate</h3>
                <p className="text-[11px] text-[#5e6b7c]">
                  Applicant will be screened automatically with algorithmic fit scoring
                </p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-[#8b98a9] hover:text-[#0e1017]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCandidate} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-[#5e6b7c] uppercase">Job Requisition</label>
                <select
                  required
                  value={newCandidate.jobId}
                  onChange={(e) => setNewCandidate({ ...newCandidate, jobId: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2 text-xs"
                >
                  {jobs.map((j) => (
                    <option key={j._id} value={j._id}>
                      {j.title} ({j.department})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#5e6b7c] uppercase">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newCandidate.fullName}
                    onChange={(e) => setNewCandidate({ ...newCandidate, fullName: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#5e6b7c] uppercase">Email</label>
                  <input
                    type="email"
                    required
                    value={newCandidate.email}
                    onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                    className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#5e6b7c] uppercase">Experience (Yrs)</label>
                  <input
                    type="number"
                    value={newCandidate.totalExperienceYears}
                    onChange={(e) => setNewCandidate({ ...newCandidate, totalExperienceYears: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#5e6b7c] uppercase">Notice (Days)</label>
                  <input
                    type="number"
                    value={newCandidate.noticePeriodDays}
                    onChange={(e) => setNewCandidate({ ...newCandidate, noticePeriodDays: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#5e6b7c] uppercase">Exp Salary (₹)</label>
                  <input
                    type="number"
                    value={newCandidate.expectedSalary}
                    onChange={(e) => setNewCandidate({ ...newCandidate, expectedSalary: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5e6b7c] uppercase">Skills (Comma-separated)</label>
                <input
                  type="text"
                  value={newCandidate.skillsText}
                  onChange={(e) => setNewCandidate({ ...newCandidate, skillsText: e.target.value })}
                  placeholder="React, TypeScript, Node.js, Next.js"
                  className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-[#5e6b7c] hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#84b81b] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#729e18] transition-colors"
                >
                  Create & Run AI Scoring
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Candidate Comparison Modal */}
      {comparisonData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-5xl rounded-3xl bg-white p-6 shadow-2xl border border-[#edf2f7] my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#edf2f7]">
              <div>
                <h2 className="text-base font-black text-[#0e1017]">Candidate Comparison View</h2>
                <p className="text-xs text-[#5e6b7c]">Evaluate candidate qualifications and fit criteria side by side</p>
              </div>
              <button onClick={() => setComparisonData(null)} className="text-[#8b98a9] hover:text-[#0e1017]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#edf2f7] bg-[#f8fafc]">
                    <th className="p-3 font-bold text-[#5e6b7c]">Criteria</th>
                    {comparisonData.map((app) => (
                      <th key={app._id} className="p-3 font-black text-[#0e1017]">
                        {app.candidateId?.fullName}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf2f7]">
                  <tr>
                    <td className="p-3 font-semibold text-[#5e6b7c]">AI Fit Score</td>
                    {comparisonData.map((app) => (
                      <td key={app._id} className="p-3">
                        <span className="rounded-full bg-[#edf7d2] px-2.5 py-1 text-xs font-black text-[#567715]">
                          {app.fitScore}% Fit
                        </span>
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-[#5e6b7c]">Experience</td>
                    {comparisonData.map((app) => (
                      <td key={app._id} className="p-3 font-bold text-[#0e1017]">
                        {app.candidateId?.totalExperienceYears} Years
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-[#5e6b7c]">Notice Period</td>
                    {comparisonData.map((app) => (
                      <td key={app._id} className="p-3 font-medium text-[#0e1017]">
                        {app.candidateId?.noticePeriodDays} Days
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-[#5e6b7c]">Expected Salary</td>
                    {comparisonData.map((app) => (
                      <td key={app._id} className="p-3 font-medium text-[#0e1017]">
                        ₹{(app.candidateId?.expectedSalary || 0).toLocaleString('en-IN')}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-[#5e6b7c]">Skills Match</td>
                    {comparisonData.map((app) => (
                      <td key={app._id} className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {app.candidateId?.skills?.map((s: string) => (
                            <span key={s} className="rounded-lg bg-[#edf7d2] px-2 py-0.5 text-[10px] font-bold text-[#567715]">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
