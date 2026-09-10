import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { client } from '../lib/api/client.js';
import { useAuth } from '../auth/AuthProvider.js';
import {
  Calendar,
  Clock,
  Video,
  Sparkles,
  X,
  Star,
  CheckCircle2,
  Plus,
  Mail,
  Link as LinkIcon,
  User,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

const getDefaultScheduleTime = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(11, 0, 0, 0);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const yyyy = tomorrow.getFullYear();
  const mm = pad(tomorrow.getMonth() + 1);
  const dd = pad(tomorrow.getDate());
  const hh = pad(tomorrow.getHours());
  const min = pad(tomorrow.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

const generateGoogleMeetLink = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const rand = (len: number) =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `https://meet.google.com/${rand(3)}-${rand(4)}-${rand(3)}`;
};

export const InterviewsList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialAppId = searchParams.get('applicationId') || '';
  const initialOpenSchedule = searchParams.get('schedule') === 'true' || Boolean(initialAppId);

  const { user } = useAuth();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Schedule Modal State
  const [isScheduleOpen, setIsScheduleOpen] = useState(initialOpenSchedule);
  const [schedulingLoading, setSchedulingLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleSuccessMsg, setScheduleSuccessMsg] = useState<string | null>(null);

  const [scheduleForm, setScheduleForm] = useState({
    applicationId: initialAppId,
    interviewType: 'Technical Interview',
    scheduledAt: getDefaultScheduleTime(),
    durationMinutes: 45,
    meetingLink: generateGoogleMeetLink(),
    location: 'Google Meet (Online)',
    instructions: 'Please ensure a quiet environment, working camera and microphone, and access to your code repository.',
  });

  // Scorecard modal state
  const [activeInterview, setActiveInterview] = useState<any | null>(null);
  const [scorecardForm, setScorecardForm] = useState({
    competency1Name: 'Technical Architecture & Problem Solving',
    competency1Rating: 4,
    competency2Name: 'Communication & Culture Fit',
    competency2Rating: 4,
    overallRating: 4,
    comments: '',
    recommendation: 'Hire' as const,
  });

  // AI Summary modal
  const [summaryData, setSummaryData] = useState<any | null>(null);

  const fetchInterviews = async () => {
    try {
      const res = await client.get('/interviews', {
        params: { applicationId: initialAppId || undefined },
      });
      setInterviews(res.data.data);
    } catch (err) {
      console.error('Failed to load interviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await client.get('/candidates/applications');
      const apps = res.data.data || [];
      setApplications(apps);
      if (!scheduleForm.applicationId && apps.length > 0) {
        setScheduleForm((prev) => ({ ...prev, applicationId: apps[0]._id }));
      }
    } catch (err) {
      console.error('Failed to load applications for schedule selector:', err);
    }
  };

  useEffect(() => {
    fetchInterviews();
    fetchApplications();
  }, [initialAppId]);

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.applicationId) {
      setScheduleError('Please select a candidate to schedule.');
      return;
    }

    setSchedulingLoading(true);
    setScheduleError(null);

    try {
      const payload = {
        applicationId: scheduleForm.applicationId,
        interviewType: scheduleForm.interviewType,
        interviewerIds: user?._id ? [user._id] : [],
        scheduledAt: new Date(scheduleForm.scheduledAt).toISOString(),
        durationMinutes: Number(scheduleForm.durationMinutes),
        meetingLink: scheduleForm.meetingLink?.trim() || undefined,
        location: scheduleForm.location?.trim() || 'Online Video Conference',
        instructions: scheduleForm.instructions?.trim() || undefined,
      };

      const res = await client.post('/interviews/schedule', payload);
      const { emailNotification } = res.data.data || {};

      setIsScheduleOpen(false);
      setScheduleSuccessMsg(
        emailNotification?.sent
          ? `Interview scheduled! Invitation email sent to candidate (${emailNotification.candidateEmail}).`
          : 'Interview scheduled successfully in ATS pipeline.'
      );

      // Refresh list
      fetchInterviews();
    } catch (err: any) {
      setScheduleError(err.response?.data?.error?.message || 'Failed to schedule interview round.');
    } finally {
      setSchedulingLoading(false);
    }
  };

  const handleSubmitScorecard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeInterview) return;

    try {
      await client.post(`/interviews/${activeInterview._id}/scorecards`, {
        competencyRatings: [
          { competency: scorecardForm.competency1Name, rating: Number(scorecardForm.competency1Rating) },
          { competency: scorecardForm.competency2Name, rating: Number(scorecardForm.competency2Rating) },
        ],
        overallRating: Number(scorecardForm.overallRating),
        comments: scorecardForm.comments,
        recommendation: scorecardForm.recommendation,
      });

      setActiveInterview(null);
      setScorecardForm({
        competency1Name: 'Technical Architecture & Problem Solving',
        competency1Rating: 4,
        competency2Name: 'Communication & Culture Fit',
        competency2Rating: 4,
        overallRating: 4,
        comments: '',
        recommendation: 'Hire',
      });
      fetchInterviews();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Error submitting scorecard');
    }
  };

  const handleViewAiSummary = async (interviewId: string) => {
    try {
      const res = await client.get(`/interviews/${interviewId}/summary`);
      setSummaryData(res.data.data);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-[#0e1017]">
            Interviews & Blind Scorecards
          </h1>
          <p className="text-xs text-[#5e6b7c]">
            Structured competency evaluations, candidate email invitations, and AI summary aggregation
          </p>
        </div>

        <button
          onClick={() => {
            setScheduleError(null);
            setIsScheduleOpen(true);
          }}
          className="flex items-center gap-2 rounded-full bg-[#84b81b] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#729e18] transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>Schedule New Round</span>
        </button>
      </div>

      {scheduleSuccessMsg && (
        <div className="flex items-center justify-between rounded-2xl bg-emerald-50 p-4 border border-emerald-200 text-xs font-semibold text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{scheduleSuccessMsg}</span>
          </div>
          <button
            onClick={() => setScheduleSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#84b81b] border-t-transparent"></div>
        </div>
      ) : interviews.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-[#8b98a9]" />
          <h3 className="mt-3 text-sm font-bold text-[#0e1017]">No scheduled interview rounds</h3>
          <p className="mt-1 text-xs text-[#5e6b7c]">
            Schedule an interview round directly and notify the candidate automatically via email.
          </p>
          <button
            onClick={() => setIsScheduleOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#84b81b] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#729e18] transition-colors"
          >
            <Plus className="h-3.5 w-3.5 stroke-[3]" />
            <span>Schedule Round Now</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {interviews.map((interview) => {
            const hasSubmitted = interview.scorecards?.some(
              (sc: any) => sc.interviewerId === user?._id || sc.interviewerName === user?.name
            );

            return (
              <div
                key={interview._id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 rounded-3xl border border-[#edf2f7] bg-white p-6 shadow-sm hover:shadow-md transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#edf7d2] px-3 py-0.5 text-xs font-bold text-[#567715]">
                      {interview.interviewType}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        interview.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {interview.status}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#0e1017]">
                    {interview.candidateId?.fullName} — {interview.jobId?.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#5e6b7c]">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-[#8b98a9]" />
                      <span>{new Date(interview.scheduledAt).toLocaleString()} ({interview.durationMinutes} mins)</span>
                    </div>

                    {interview.meetingLink && (
                      <a
                        href={interview.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 font-semibold text-[#84b81b] hover:underline"
                      >
                        <Video className="h-3.5 w-3.5" /> Meeting Link
                      </a>
                    )}
                  </div>

                  <div className="text-xs text-[#8b98a9]">
                    Interviewers:{' '}
                    <strong className="text-[#0e1017]">
                      {interview.interviewerIds?.map((i: any) => i.name).join(', ') || 'Assigned Team'}
                    </strong>{' '}
                    • Submitted Scorecards: <strong>{interview.scorecards?.length || 0}</strong>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => setActiveInterview(interview)}
                    className="rounded-full bg-[#84b81b] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#729e18] transition-colors"
                  >
                    {hasSubmitted ? 'Update Scorecard' : 'Submit Scorecard'}
                  </button>

                  <button
                    onClick={() => handleViewAiSummary(interview._id)}
                    className="flex items-center gap-1.5 rounded-full border border-[#edf2f7] bg-[#f8fafc] px-4 py-2 text-xs font-bold text-[#0e1017] hover:bg-slate-100 transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#84b81b]" />
                    <span>AI Synthesis</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Scorecard Modal */}
      {activeInterview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-[#edf2f7]">
            <div className="flex items-center justify-between pb-3 border-b border-[#edf2f7]">
              <div>
                <h3 className="font-bold text-sm text-[#0e1017]">Submit Interview Scorecard</h3>
                <p className="text-[11px] text-[#5e6b7c]">
                  Candidate: {activeInterview.candidateId?.fullName} ({activeInterview.interviewType})
                </p>
              </div>
              <button onClick={() => setActiveInterview(null)} className="text-[#8b98a9] hover:text-[#0e1017]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitScorecard} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-[#5e6b7c] uppercase">
                  Technical Architecture & Problem Solving (1-5)
                </label>
                <div className="mt-1 flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setScorecardForm({ ...scorecardForm, competency1Rating: val })}
                      className={`h-8 w-8 rounded-xl text-xs font-bold transition-all ${
                        scorecardForm.competency1Rating === val
                          ? 'bg-[#84b81b] text-white'
                          : 'bg-[#f8fafc] border border-[#edf2f7] text-[#0e1017]'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5e6b7c] uppercase">
                  Communication & Culture Alignment (1-5)
                </label>
                <div className="mt-1 flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setScorecardForm({ ...scorecardForm, competency2Rating: val })}
                      className={`h-8 w-8 rounded-xl text-xs font-bold transition-all ${
                        scorecardForm.competency2Rating === val
                          ? 'bg-[#84b81b] text-white'
                          : 'bg-[#f8fafc] border border-[#edf2f7] text-[#0e1017]'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5e6b7c] uppercase">
                  Final Hiring Recommendation *
                </label>
                <select
                  value={scorecardForm.recommendation}
                  onChange={(e) => setScorecardForm({ ...scorecardForm, recommendation: e.target.value as any })}
                  className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2 text-xs font-semibold"
                >
                  <option value="Strong Hire">Strong Hire</option>
                  <option value="Hire">Hire</option>
                  <option value="Neutral">Neutral</option>
                  <option value="Do Not Hire">Do Not Hire</option>
                  <option value="Strong Do Not Hire">Strong Do Not Hire</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5e6b7c] uppercase">
                  Detailed Feedback Comments *
                </label>
                <textarea
                  required
                  rows={3}
                  value={scorecardForm.comments}
                  onChange={(e) => setScorecardForm({ ...scorecardForm, comments: e.target.value })}
                  placeholder="Summarize candidate competency, problem-solving, and culture fit..."
                  className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 text-xs focus:border-[#84b81b] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveInterview(null)}
                  className="rounded-full px-4 py-2 text-xs font-semibold text-[#5e6b7c] hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-[#84b81b] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#729e18]"
                >
                  Submit Scorecard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Summary Modal */}
      {summaryData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-[#edf2f7]">
            <div className="flex items-center justify-between pb-3 border-b border-[#edf2f7]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#84b81b]" />
                <h3 className="font-bold text-sm text-[#0e1017]">AI Feedback Synthesis</h3>
              </div>
              <button onClick={() => setSummaryData(null)} className="text-[#8b98a9] hover:text-[#0e1017]">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="rounded-2xl bg-[#edf7d2]/60 p-4 border border-[#edf7d2]">
                <span className="font-bold text-[#567715] uppercase tracking-wider text-[10px]">
                  Consensus Recommendation
                </span>
                <p className="mt-1 text-base font-black text-[#567715]">
                  {summaryData.consensusRecommendation} (Avg: {summaryData.averageRating}/5)
                </p>
                <p className="mt-2 text-[#567715] leading-relaxed">{summaryData.summary}</p>
              </div>

              <div>
                <span className="font-bold text-[#0e1017] uppercase tracking-wider text-[10px]">
                  Interviewer Highlights
                </span>
                <ul className="mt-2 space-y-2">
                  {summaryData.keyHighlights?.map((hl: string, idx: number) => (
                    <li key={idx} className="rounded-xl bg-[#f8fafc] p-3 text-[#5e6b7c] border border-[#edf2f7]">
                      {hl}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSummaryData(null)}
                className="rounded-full bg-[#0e1017] px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Close Synthesis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Interview Round Modal */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#edf2f7] my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#edf2f7]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf7d2] text-[#84b81b]">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#0e1017]">Schedule Interview Round</h3>
                  <p className="text-xs text-[#5e6b7c]">
                    Invites candidate and sends meeting link + instructions via email
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsScheduleOpen(false)}
                className="text-[#8b98a9] hover:text-[#0e1017] p-1 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {scheduleError && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-red-50 p-3 text-xs text-red-700 border border-red-100">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{scheduleError}</span>
              </div>
            )}

            <form onSubmit={handleScheduleSubmit} className="mt-5 space-y-4">
              {/* Candidate selection */}
              <div>
                <label className="block text-[11px] font-bold text-[#5e6b7c] uppercase tracking-wider">
                  Select Candidate & Role *
                </label>
                <select
                  required
                  value={scheduleForm.applicationId}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, applicationId: e.target.value })}
                  className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 text-xs font-semibold text-[#0e1017] focus:border-[#84b81b] focus:bg-white focus:outline-none"
                >
                  <option value="" disabled>-- Choose Candidate --</option>
                  {applications.map((app) => (
                    <option key={app._id} value={app._id}>
                      {app.candidateId?.fullName || 'Candidate'} — {app.jobId?.title || 'Position'} (Fit: {app.fitScore}%)
                    </option>
                  ))}
                </select>
              </div>

              {/* Round Type & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#5e6b7c] uppercase tracking-wider">
                    Interview Round Type *
                  </label>
                  <select
                    value={scheduleForm.interviewType}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, interviewType: e.target.value as any })}
                    className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 text-xs font-semibold text-[#0e1017] focus:border-[#84b81b] focus:bg-white focus:outline-none"
                  >
                    <option value="Technical Interview">Technical Interview</option>
                    <option value="HR Screening">HR Screening</option>
                    <option value="Assignment Review">Assignment Review</option>
                    <option value="Managerial Interview">Managerial Interview</option>
                    <option value="Cultural Interview">Cultural Interview</option>
                    <option value="Final Interview">Final Interview</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#5e6b7c] uppercase tracking-wider">
                    Duration *
                  </label>
                  <select
                    value={scheduleForm.durationMinutes}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, durationMinutes: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 text-xs font-semibold text-[#0e1017] focus:border-[#84b81b] focus:bg-white focus:outline-none"
                  >
                    <option value={30}>30 Minutes</option>
                    <option value={45}>45 Minutes (Standard)</option>
                    <option value={60}>60 Minutes (Deep Dive)</option>
                    <option value={90}>90 Minutes (Panel)</option>
                  </select>
                </div>
              </div>

              {/* Date and Time */}
              <div>
                <label className="block text-[11px] font-bold text-[#5e6b7c] uppercase tracking-wider">
                  Date & Time (IST) *
                </label>
                <div className="relative mt-1">
                  <input
                    type="datetime-local"
                    required
                    value={scheduleForm.scheduledAt}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, scheduledAt: e.target.value })}
                    className="block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 text-xs font-medium text-[#0e1017] focus:border-[#84b81b] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Meeting Link & Generate Button */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-[#5e6b7c] uppercase tracking-wider">
                    Online Meeting URL
                  </label>
                  <button
                    type="button"
                    onClick={() => setScheduleForm({ ...scheduleForm, meetingLink: generateGoogleMeetLink() })}
                    className="text-[11px] font-bold text-[#84b81b] hover:text-[#729e18] flex items-center gap-1"
                  >
                    <Video className="h-3 w-3" /> Auto-Generate Meet Link
                  </button>
                </div>
                <input
                  type="url"
                  value={scheduleForm.meetingLink}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, meetingLink: e.target.value })}
                  placeholder="https://meet.google.com/xyz-abcd-efg"
                  className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 text-xs font-medium text-[#0e1017] focus:border-[#84b81b] focus:bg-white focus:outline-none"
                />
              </div>

              {/* Special Instructions / Agenda */}
              <div>
                <label className="block text-[11px] font-bold text-[#5e6b7c] uppercase tracking-wider">
                  Candidate Agenda & Preparation Instructions
                </label>
                <textarea
                  rows={3}
                  value={scheduleForm.instructions}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, instructions: e.target.value })}
                  placeholder="e.g. Please be ready with your code repository, test suite, and camera enabled."
                  className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 text-xs font-medium text-[#0e1017] focus:border-[#84b81b] focus:bg-white focus:outline-none"
                />
              </div>

              {/* Email dispatch notice card */}
              <div className="rounded-2xl bg-[#edf7d2]/70 p-3.5 border border-[#edf7d2] text-xs flex items-start gap-2.5">
                <Mail className="h-4 w-4 text-[#84b81b] shrink-0 mt-0.5" />
                <div className="text-[11px] text-[#567715] leading-relaxed">
                  <strong>Automated Email Dispatch:</strong> When you click "Confirm & Send Invite", a calendar invitation with the meeting link and agenda will be sent directly to the candidate's email address.
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#edf2f7]">
                <button
                  type="button"
                  onClick={() => setIsScheduleOpen(false)}
                  className="rounded-full px-5 py-2.5 text-xs font-semibold text-[#5e6b7c] hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={schedulingLoading}
                  className="flex items-center gap-2 rounded-full bg-[#84b81b] px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#729e18] transition-colors disabled:opacity-50"
                >
                  {schedulingLoading ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Scheduling & Sending Email...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="h-3.5 w-3.5" />
                      <span>Confirm & Send Invite</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
