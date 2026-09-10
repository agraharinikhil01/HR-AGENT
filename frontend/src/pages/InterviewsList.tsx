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
} from 'lucide-react';

export const InterviewsList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get('applicationId') || '';

  const { user } = useAuth();
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
        params: { applicationId: applicationId || undefined },
      });
      setInterviews(res.data.data);
    } catch (err) {
      console.error('Failed to load interviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterviews();
  }, [applicationId]);

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
            Structured competency evaluations, blind feedback enforcement, and AI summary aggregation
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#84b81b] border-t-transparent"></div>
        </div>
      ) : interviews.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-[#8b98a9]" />
          <h3 className="mt-3 text-sm font-bold text-[#0e1017]">No scheduled interview rounds</h3>
          <p className="mt-1 text-xs text-[#5e6b7c]">
            Schedule an interview round directly from any candidate profile.
          </p>
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
    </div>
  );
};
