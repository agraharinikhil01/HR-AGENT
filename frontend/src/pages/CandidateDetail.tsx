import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { client } from '../lib/api/client.js';
import { useAuth } from '../auth/AuthProvider.js';
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  FileCheck,
  Send,
  MapPin,
  Briefcase,
  Mail,
  Phone,
  Building2,
  UserCheck,
  Award,
} from 'lucide-react';

export const CandidateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [overrideModal, setOverrideModal] = useState(false);
  const [overrideScore, setOverrideScore] = useState(85);
  const [overrideReason, setOverrideReason] = useState('');
  const [newNote, setNewNote] = useState('');
  const [isPrivateNote, setIsPrivateNote] = useState(false);

  const fetchApplication = async () => {
    try {
      const res = await client.get(`/candidates/applications/${id}`);
      setApplication(res.data.data);
      setOverrideScore(res.data.data.fitScore);
    } catch (err) {
      console.error('Failed to load application:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const handleScoreOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.patch(`/candidates/applications/${id}/override-score`, {
        overrideScore: Number(overrideScore),
        reason: overrideReason,
      });
      setOverrideModal(false);
      setOverrideReason('');
      fetchApplication();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to override score');
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      await client.post(`/candidates/applications/${id}/notes`, {
        text: newNote,
        isPrivate: isPrivateNote,
      });
      setNewNote('');
      fetchApplication();
    } catch (err) {
      console.error('Failed to add note:', err);
    }
  };

  const handleStageAdvance = async (nextStage: string) => {
    try {
      await client.patch(`/candidates/applications/${id}/stage`, { stage: nextStage });
      fetchApplication();
    } catch (err) {
      console.error('Failed to update stage:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#84b81b] border-t-transparent"></div>
      </div>
    );
  }

  if (!application) {
    return <div className="p-8 text-center text-[#5e6b7c]">Candidate application not found.</div>;
  }

  const candidate = application.candidateId;
  const job = application.jobId;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Back navigation & Stage bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-[#5e6b7c] border border-[#edf2f7] hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Pipeline</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#5e6b7c]">Current Stage:</span>
          <span className="rounded-full bg-[#edf7d2] px-3 py-1 text-xs font-bold text-[#567715]">
            {application.stage}
          </span>
        </div>
      </div>

      {/* Candidate Hero Card (Reference Image 2 style) */}
      <div className="relative rounded-3xl border border-[#edf2f7] bg-white p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          {/* Avatar with Lime Online Dot */}
          <div className="relative h-24 w-24 rounded-full bg-slate-100 ring-4 ring-slate-50 overflow-hidden shadow-inner flex items-center justify-center">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate?.fullName || 'Candidate'}`}
              alt={candidate?.fullName}
              className="h-full w-full object-cover"
            />
            <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-[#84b81b] ring-2 ring-white" />
          </div>

          {/* Name & Title */}
          <h2 className="mt-4 text-2xl font-black text-[#0e1017]">
            {candidate?.fullName}
          </h2>
          <p className="text-xs font-semibold text-[#5e6b7c] mt-1">
            {candidate?.currentDesignation || 'Candidate'} • {candidate?.currentCompany || 'Freelance'}
          </p>

          <div className="mt-2 flex items-center gap-2 text-xs text-[#8b98a9]">
            <MapPin className="h-3.5 w-3.5" />
            <span>{candidate?.currentCity || 'Bengaluru, India'}</span>
            <span>•</span>
            <Building2 className="h-3.5 w-3.5" />
            <span>Applied for <strong className="text-[#0e1017]">{job?.title}</strong></span>
          </div>

          {/* Action CTAs: Solid Lime Button matching Image 2 */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => handleStageAdvance('Shortlisted')}
              className="flex items-center gap-2 rounded-full bg-[#84b81b] px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#729e18] transition-colors"
            >
              <UserCheck className="h-4 w-4 stroke-[2.5]" />
              <span>Shortlist Candidate</span>
            </button>

            <Link
              to={`/interviews?applicationId=${application._id}`}
              className="flex items-center gap-2 rounded-full border border-[#edf2f7] bg-[#f8fafc] px-5 py-2.5 text-xs font-bold text-[#0e1017] hover:bg-slate-100 transition-colors"
            >
              <Calendar className="h-4 w-4 text-[#729e18]" />
              <span>Schedule Interview</span>
            </Link>

            <Link
              to={`/offers/create?applicationId=${application._id}`}
              className="flex items-center gap-2 rounded-full border border-[#edf2f7] bg-[#f8fafc] px-5 py-2.5 text-xs font-bold text-[#0e1017] hover:bg-slate-100 transition-colors"
            >
              <FileCheck className="h-4 w-4 text-[#5e6b7c]" />
              <span>Prepare Offer</span>
            </Link>
          </div>

          {/* Key Metric Highlights Grid */}
          <div className="mt-8 grid w-full grid-cols-2 gap-3 sm:grid-cols-4 border-t border-[#edf2f7] pt-6 text-left">
            <div className="rounded-2xl bg-[#f8fafc] p-3.5 border border-[#edf2f7]">
              <span className="text-[10px] font-bold uppercase text-[#8b98a9] tracking-wider">AI Fit Score</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-xl font-black text-[#567715]">{application.fitScore}%</span>
                <span className="text-[10px] font-bold text-[#84b81b] bg-[#edf7d2] px-1.5 py-0.5 rounded">
                  {application.eligibilityStatus}
                </span>
              </div>
            </div>

            <div className="rounded-2xl bg-[#f8fafc] p-3.5 border border-[#edf2f7]">
              <span className="text-[10px] font-bold uppercase text-[#8b98a9] tracking-wider">Experience</span>
              <p className="mt-1 text-base font-bold text-[#0e1017]">
                {candidate?.totalExperienceYears} Years
              </p>
            </div>

            <div className="rounded-2xl bg-[#f8fafc] p-3.5 border border-[#edf2f7]">
              <span className="text-[10px] font-bold uppercase text-[#8b98a9] tracking-wider">Notice Period</span>
              <p className="mt-1 text-base font-bold text-[#0e1017]">
                {candidate?.noticePeriodDays} Days
              </p>
            </div>

            <div className="rounded-2xl bg-[#f8fafc] p-3.5 border border-[#edf2f7]">
              <span className="text-[10px] font-bold uppercase text-[#8b98a9] tracking-wider">Expected Salary</span>
              <p className="mt-1 text-base font-bold text-[#0e1017]">
                ₹{(candidate?.expectedSalary || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Sections Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Cols: Experience Timeline, Skills, Notes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Skills & Proficiencies (Image 2 style: light lime tint pills) */}
          <div className="rounded-3xl border border-[#edf2f7] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#edf2f7]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0e1017] flex items-center gap-2">
                <Award className="h-4 w-4 text-[#84b81b]" />
                <span>Skills & Proficiencies</span>
              </h3>
              <span className="text-xs text-[#8b98a9]">{candidate?.skills?.length || 0} skills</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {candidate?.skills?.map((skill: string) => (
                <span
                  key={skill}
                  className="rounded-xl bg-[#edf7d2] px-3.5 py-1.5 text-xs font-bold text-[#567715] shadow-xs"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Work Experience Timeline (Image 2 style with colorful company icon badges) */}
          <div className="rounded-3xl border border-[#edf2f7] bg-white p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0e1017] flex items-center gap-2 pb-3 border-b border-[#edf2f7]">
              <Briefcase className="h-4 w-4 text-[#84b81b]" />
              <span>Work Experience</span>
            </h3>

            <div className="mt-5 space-y-6">
              {/* Experience Item 1 */}
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-500 text-white font-black text-sm shadow-sm">
                  {candidate?.currentCompany?.[0]?.toUpperCase() || 'C'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#0e1017]">
                      {candidate?.currentDesignation || 'Senior Role'}
                    </h4>
                    <span className="rounded-full bg-[#f8fafc] px-2.5 py-0.5 text-[11px] font-semibold text-[#5e6b7c] border border-[#edf2f7]">
                      Present
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[#5e6b7c]">
                    {candidate?.currentCompany || 'Current Tech Org'}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-[#5e6b7c]">
                    Led core engineering workflows, managed sprint cycles, optimized candidate application architectures, and partnered with cross-functional talent leaders.
                  </p>
                </div>
              </div>

              {/* Experience Item 2 */}
              <div className="flex gap-4 border-t border-[#edf2f7] pt-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-500 text-white font-black text-sm shadow-sm">
                  T
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#0e1017]">Software Specialist</h4>
                    <span className="rounded-full bg-[#f8fafc] px-2.5 py-0.5 text-[11px] font-semibold text-[#5e6b7c] border border-[#edf2f7]">
                      2021 – 2023
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[#5e6b7c]">Tech Innovators Inc.</p>
                  <p className="mt-2 text-xs leading-relaxed text-[#5e6b7c]">
                    Engineered robust frontend components, collaborated with UI/UX designers, improved page load speeds by 42%, and maintained modular API microservices.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Internal Notes & Team Discussion */}
          <div className="rounded-3xl border border-[#edf2f7] bg-white p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0e1017] pb-3 border-b border-[#edf2f7]">
              Internal Notes & Hiring Collaboration
            </h3>

            <form onSubmit={handleAddNote} className="mt-4 space-y-3">
              <textarea
                rows={2}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Share candidate evaluation notes with the hiring team..."
                className="w-full rounded-2xl border border-[#edf2f7] bg-[#f8fafc] p-3 text-xs focus:border-[#84b81b] focus:outline-none focus:bg-white"
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs text-[#5e6b7c] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPrivateNote}
                    onChange={(e) => setIsPrivateNote(e.target.checked)}
                    className="rounded border-[#edf2f7] text-[#84b81b] focus:ring-[#84b81b]"
                  />
                  <span>Private note (Interviewers only)</span>
                </label>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-full bg-[#0e1017] px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors"
                >
                  <Send className="h-3 w-3" />
                  <span>Post Note</span>
                </button>
              </div>
            </form>

            <div className="mt-5 space-y-3">
              {application.notes?.length === 0 ? (
                <p className="text-xs text-[#8b98a9] italic">No team notes yet.</p>
              ) : (
                application.notes?.map((n: any) => (
                  <div key={n._id} className="rounded-2xl bg-[#f8fafc] p-3.5 border border-[#edf2f7] text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0e1017]">{n.authorName}</span>
                      <span className="text-[10px] text-[#8b98a9]">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[#5e6b7c] leading-relaxed">{n.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Col: AI Fit Score & Overrides */}
        <div className="space-y-6">
          {/* AI Fit Score Card with Green Progress Bars */}
          <div className="rounded-3xl border border-[#edf2f7] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-[#edf2f7]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0e1017]">
                AI Fit Score Analysis
              </span>
              <button
                onClick={() => setOverrideModal(true)}
                className="text-[11px] font-bold text-[#84b81b] hover:underline"
              >
                Override
              </button>
            </div>

            {/* Score Big Display */}
            <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#edf7d2]/50 p-4 border border-[#edf7d2]">
              <div>
                <p className="text-xs font-semibold text-[#567715]">Fit Calculation</p>
                <p className="text-3xl font-black text-[#567715]">{application.fitScore}%</p>
              </div>
              <div className="text-right">
                <span className="rounded-full bg-[#84b81b] px-3 py-1 text-[11px] font-bold text-white shadow-xs">
                  {application.eligibilityStatus}
                </span>
                {application.humanOverride?.isOverridden && (
                  <p className="mt-1 text-[10px] font-semibold text-purple-700">Human Adjusted</p>
                )}
              </div>
            </div>

            {/* Category Scores */}
            <div className="mt-6 space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold text-[#0e1017]">
                  <span>Mandatory Skills</span>
                  <span>{application.categoryScores?.mandatorySkills}/30</span>
                </div>
                <div className="mt-1.5 h-2 w-full rounded-full bg-[#edf2f7] overflow-hidden">
                  <div
                    className="h-full bg-[#84b81b] rounded-full"
                    style={{
                      width: `${((application.categoryScores?.mandatorySkills || 0) / 30) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-[#0e1017]">
                  <span>Experience Alignment</span>
                  <span>{application.categoryScores?.relevantExperience}/25</span>
                </div>
                <div className="mt-1.5 h-2 w-full rounded-full bg-[#edf2f7] overflow-hidden">
                  <div
                    className="h-full bg-[#84b81b] rounded-full"
                    style={{
                      width: `${((application.categoryScores?.relevantExperience || 0) / 25) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold text-[#0e1017]">
                  <span>Preferred Tech Stack</span>
                  <span>{application.categoryScores?.preferredSkills}/10</span>
                </div>
                <div className="mt-1.5 h-2 w-full rounded-full bg-[#edf2f7] overflow-hidden">
                  <div
                    className="h-full bg-[#84b81b] rounded-full"
                    style={{
                      width: `${((application.categoryScores?.preferredSkills || 0) / 10) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Strengths & Concerns */}
            <div className="mt-6 border-t border-[#edf2f7] pt-4 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0e1017]">
                Key Strengths
              </span>
              <ul className="space-y-2 text-xs text-[#5e6b7c]">
                {application.strengths?.map((s: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-[#84b81b] shrink-0 mt-0.5" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>

              {application.concerns?.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#0e1017]">
                    Potential Gaps
                  </span>
                  <ul className="mt-2 space-y-2 text-xs text-[#5e6b7c]">
                    {application.concerns?.map((c: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Contact Details Card */}
          <div className="rounded-3xl border border-[#edf2f7] bg-white p-6 shadow-sm space-y-3 text-xs">
            <h4 className="font-bold text-[#0e1017] uppercase tracking-wider text-[11px]">
              Direct Contact
            </h4>
            <div className="flex items-center gap-2.5 text-[#5e6b7c]">
              <Mail className="h-4 w-4 text-[#8b98a9]" />
              <span className="font-medium text-[#0e1017]">{candidate?.email}</span>
            </div>
            <div className="flex items-center gap-2.5 text-[#5e6b7c]">
              <Phone className="h-4 w-4 text-[#8b98a9]" />
              <span className="font-medium text-[#0e1017]">{candidate?.phone || 'Not shared'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Human Score Override Modal */}
      {overrideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-[#edf2f7]">
            <h3 className="text-base font-bold text-[#0e1017]">Human Score Override</h3>
            <p className="mt-1 text-xs text-[#5e6b7c]">
              All human score overrides are recorded with actor and timestamp in the audit log.
            </p>

            <form onSubmit={handleScoreOverride} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[#5e6b7c]">
                  New Score (0-100)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  required
                  value={overrideScore}
                  onChange={(e) => setOverrideScore(Number(e.target.value))}
                  className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 text-xs font-bold focus:border-[#84b81b] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[#5e6b7c]">
                  Override Justification *
                </label>
                <textarea
                  required
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Explain why the algorithmic score was modified..."
                  className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 text-xs focus:border-[#84b81b] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOverrideModal(false)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-[#5e6b7c] hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#84b81b] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#729e18] transition-colors"
                >
                  Confirm Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
