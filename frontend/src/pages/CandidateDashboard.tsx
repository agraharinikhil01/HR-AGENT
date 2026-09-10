import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { client } from '../lib/api/client.js';
import { useAuth } from '../auth/AuthProvider.js';
import {
  Briefcase,
  Calendar,
  Clock,
  Video,
  FileCheck,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ExternalLink,
  MapPin,
  Building2,
  Phone,
  Mail,
  Edit3,
  X,
  Award,
  ChevronRight,
  Send,
  DollarSign,
} from 'lucide-react';

const PIPELINE_STAGES = [
  'Applied',
  'AI Reviewed',
  'Shortlisted',
  'Interview',
  'Offer Sent',
  'Joined',
];

export const CandidateDashboard: React.FC = () => {
  const { user } = useAuth();

  const [portalData, setPortalData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [openJobs, setOpenJobs] = useState<any[]>([]);

  // Edit Profile Modal
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phone: '',
    currentCity: '',
    currentCompany: '',
    totalExperienceYears: 0,
    skillsText: '',
    parsedText: '',
    linkedInUrl: '',
    githubUrl: '',
    portfolioUrl: '',
  });

  // Offer decision state
  const [respondingOfferId, setRespondingOfferId] = useState<string | null>(null);

  const fetchPortalData = async () => {
    try {
      const res = await client.get('/candidates/me/portal');
      const data = res.data.data;
      setPortalData(data);

      if (data.candidate) {
        setProfileForm({
          fullName: data.candidate.fullName || '',
          phone: data.candidate.phone || '',
          currentCity: data.candidate.currentCity || '',
          currentCompany: data.candidate.currentCompany || '',
          totalExperienceYears: data.candidate.totalExperienceYears || 0,
          skillsText: (data.candidate.skills || []).join(', '),
          parsedText: data.candidate.parsedText || '',
          linkedInUrl: data.candidate.linkedInUrl || '',
          githubUrl: data.candidate.githubUrl || '',
          portfolioUrl: data.candidate.portfolioUrl || '',
        });
      }
    } catch (err) {
      console.error('Failed to load candidate portal:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOpenJobs = async () => {
    try {
      const res = await client.get('/jobs/public');
      setOpenJobs(res.data.data || []);
    } catch (err) {
      console.error('Failed to load open jobs:', err);
    }
  };

  useEffect(() => {
    fetchPortalData();
    fetchOpenJobs();
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(false);

    try {
      const skills = profileForm.skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await client.patch('/candidates/me/profile', {
        fullName: profileForm.fullName.trim(),
        phone: profileForm.phone.trim(),
        currentCity: profileForm.currentCity.trim(),
        currentCompany: profileForm.currentCompany.trim(),
        totalExperienceYears: Number(profileForm.totalExperienceYears),
        skills,
        parsedText: profileForm.parsedText,
        linkedInUrl: profileForm.linkedInUrl || undefined,
        githubUrl: profileForm.githubUrl || undefined,
        portfolioUrl: profileForm.portfolioUrl || undefined,
      });

      setPortalData((prev: any) => ({ ...prev, candidate: res.data.data }));
      setProfileSuccess(true);
      setTimeout(() => {
        setIsEditProfileOpen(false);
        setProfileSuccess(false);
      }, 1200);
    } catch (err) {
      console.error('Failed to update candidate profile:', err);
      alert('Failed to save profile changes.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleOfferRespond = async (offerId: string, decision: 'ACCEPTED' | 'DECLINED') => {
    setRespondingOfferId(offerId);
    try {
      await client.post(`/candidates/me/offers/${offerId}/respond`, { decision });
      await fetchPortalData();
    } catch (err) {
      console.error('Failed to respond to offer:', err);
      alert('Could not update offer decision. Please try again.');
    } finally {
      setRespondingOfferId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#84b81b] border-t-transparent" />
      </div>
    );
  }

  const candidate = portalData?.candidate;
  const applications = portalData?.applications || [];
  const interviews = portalData?.interviews || [];
  const offers = portalData?.offers || [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* 1. Hero Candidate Welcome Banner (Ref Image 1 & 2 Lime Texture) */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0e1017] p-8 text-white shadow-sm border border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(#84b81b_1px,transparent_1px)] [background-size:20px_20px] opacity-15" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 rounded-2xl bg-slate-800 overflow-hidden ring-4 ring-[#84b81b]/30">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate?.fullName || 'Candidate'}`}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full bg-[#84b81b] ring-2 ring-[#0e1017]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white">{candidate?.fullName || user?.name}</h1>
                <span className="rounded-full bg-[#edf7d2] px-2.5 py-0.5 text-[10px] font-bold text-[#567715]">
                  Applicant Portal
                </span>
              </div>
              <p className="text-xs text-[#94a3b8] mt-1 flex items-center gap-2">
                <span>{candidate?.email}</span>
                <span>•</span>
                <span>{candidate?.currentCity || 'India'}</span>
                <span>•</span>
                <span>{candidate?.totalExperienceYears || 0} Years Experience</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsEditProfileOpen(true)}
              className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 transition-all shadow-xs"
            >
              <Edit3 className="h-3.5 w-3.5 text-[#84b81b]" />
              <span>Edit My Profile</span>
            </button>
            <Link
              to="/careers"
              className="flex items-center gap-1.5 rounded-full bg-[#84b81b] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#729e18] transition-all"
            >
              <Briefcase className="h-3.5 w-3.5" />
              <span>Explore More Jobs</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Key Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-[#edf2f7] bg-white p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-[#8b98a9] tracking-wider">Active Applications</span>
          <p className="mt-1 text-2xl font-black text-[#0e1017]">{applications.length}</p>
        </div>

        <div className="rounded-2xl border border-[#edf2f7] bg-white p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-[#8b98a9] tracking-wider">Scheduled Rounds</span>
          <p className="mt-1 text-2xl font-black text-[#567715]">{interviews.length}</p>
        </div>

        <div className="rounded-2xl border border-[#edf2f7] bg-white p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-[#8b98a9] tracking-wider">Received Offers</span>
          <p className="mt-1 text-2xl font-black text-[#84b81b]">{offers.length}</p>
        </div>

        <div className="rounded-2xl border border-[#edf2f7] bg-white p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase text-[#8b98a9] tracking-wider">Profile Match Rating</span>
          <p className="mt-1 text-2xl font-black text-[#0e1017]">
            {applications[0]?.fitScore ? `${applications[0].fitScore}%` : 'Strong'}
          </p>
        </div>
      </div>

      {/* 3. Scheduled Interviews Section (Top Priority for Candidate) */}
      <div className="rounded-3xl border border-[#edf2f7] bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#edf2f7]">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#edf7d2] text-[#84b81b]">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0e1017]">My Scheduled Interview Rounds</h2>
              <p className="text-xs text-[#5e6b7c]">Upcoming video assessments and technical evaluations</p>
            </div>
          </div>
          <span className="rounded-full bg-[#edf7d2] px-2.5 py-0.5 text-xs font-bold text-[#567715]">
            {interviews.length} Scheduled
          </span>
        </div>

        {interviews.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#8b98a9]">
            No interview rounds scheduled yet. Your recruiter will notify you as soon as your profile is reviewed.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {interviews.map((iv: any) => (
              <div
                key={iv._id}
                className="flex flex-col justify-between rounded-2xl border border-[#edf2f7] bg-[#f8fafc] p-5 space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-[#edf7d2] px-2.5 py-0.5 text-[10px] font-bold text-[#567715]">
                      {iv.interviewType}
                    </span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                      {iv.status}
                    </span>
                  </div>

                  <h3 className="mt-2 text-sm font-bold text-[#0e1017]">
                    {iv.jobId?.title || 'Applied Position'} ({iv.jobId?.department || 'Engineering'})
                  </h3>

                  <div className="mt-2 space-y-1.5 text-xs text-[#5e6b7c]">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-[#8b98a9]" />
                      <span>{new Date(iv.scheduledAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-3.5 w-3.5 text-[#8b98a9]" />
                      <span>Duration: {iv.durationMinutes} Minutes</span>
                    </div>
                  </div>

                  {iv.instructions && (
                    <div className="mt-3 rounded-xl bg-white p-2.5 border border-[#edf2f7] text-[11px] text-[#4a5568]">
                      <strong>Instructions:</strong> {iv.instructions}
                    </div>
                  )}
                </div>

                {iv.meetingLink ? (
                  <a
                    href={iv.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 rounded-full bg-[#84b81b] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#729e18] transition-all text-center"
                  >
                    <Video className="h-4 w-4" />
                    <span>Join Video Meeting</span>
                  </a>
                ) : (
                  <div className="text-center text-[11px] text-[#8b98a9] py-1">
                    Meeting link will be activated 15 minutes before round.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Received Offers & CTC Breakdown Section */}
      {offers.length > 0 && (
        <div className="rounded-3xl border border-[#edf2f7] bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#edf2f7]">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <Award className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#0e1017]">Offer Letters & CTC Packages</h2>
                <p className="text-xs text-[#5e6b7c]">Indian statutory offer details, CTC compensation breakdown, and status</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {offers.map((offer: any) => (
              <div
                key={offer._id}
                className="rounded-2xl border border-[#edf2f7] bg-[#f8fafc] p-6 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                      Offer Status: {offer.status}
                    </span>
                    <h3 className="mt-2 text-lg font-black text-[#0e1017]">
                      {offer.designation} — {offer.jobId?.title || 'Role'}
                    </h3>
                    <p className="text-xs text-[#5e6b7c]">
                      Department: {offer.department} • Joining Date: {new Date(offer.joiningDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="text-right sm:text-right">
                    <span className="text-[10px] font-bold uppercase text-[#8b98a9] tracking-wider">Total Annual CTC</span>
                    <p className="text-2xl font-black text-[#567715]">
                      ₹{(offer.annualCtc / 100000).toFixed(2)} Lakhs / Year
                    </p>
                  </div>
                </div>

                {/* Statutory CTC Breakdown Table */}
                <div className="overflow-x-auto rounded-xl border border-[#edf2f7] bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#f8fafc] text-[10px] uppercase font-bold text-[#8b98a9] border-b border-[#edf2f7]">
                      <tr>
                        <th className="p-3">Salary Component</th>
                        <th className="p-3 text-right">Annual (₹)</th>
                        <th className="p-3 text-right">Monthly (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf2f7] text-[#4a5568]">
                      <tr>
                        <td className="p-3 font-semibold text-[#0e1017]">Basic Salary (50% of CTC)</td>
                        <td className="p-3 text-right">₹{offer.fixedBase?.toLocaleString('en-IN') || '—'}</td>
                        <td className="p-3 text-right">₹{Math.round((offer.fixedBase || 0) / 12).toLocaleString('en-IN')}</td>
                      </tr>
                      <tr>
                        <td className="p-3">House Rent Allowance (HRA)</td>
                        <td className="p-3 text-right">₹{offer.hra?.toLocaleString('en-IN') || '—'}</td>
                        <td className="p-3 text-right">₹{Math.round((offer.hra || 0) / 12).toLocaleString('en-IN')}</td>
                      </tr>
                      <tr>
                        <td className="p-3">Employer PF Contribution (Statutory 12%)</td>
                        <td className="p-3 text-right">₹{offer.pfEmployer?.toLocaleString('en-IN') || '—'}</td>
                        <td className="p-3 text-right">₹{Math.round((offer.pfEmployer || 0) / 12).toLocaleString('en-IN')}</td>
                      </tr>
                      <tr>
                        <td className="p-3">Gratuity (Statutory 4.81%)</td>
                        <td className="p-3 text-right">₹{offer.gratuity?.toLocaleString('en-IN') || '—'}</td>
                        <td className="p-3 text-right">₹{Math.round((offer.gratuity || 0) / 12).toLocaleString('en-IN')}</td>
                      </tr>
                      {offer.performanceBonus > 0 && (
                        <tr>
                          <td className="p-3">Annual Performance Bonus</td>
                          <td className="p-3 text-right">₹{offer.performanceBonus?.toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right">—</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Offer Action Buttons if Pending */}
                {offer.status === 'Sent' && (
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => handleOfferRespond(offer._id, 'DECLINED')}
                      disabled={respondingOfferId === offer._id}
                      className="rounded-full border border-red-200 bg-white px-5 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                    >
                      Decline Offer
                    </button>
                    <button
                      onClick={() => handleOfferRespond(offer._id, 'ACCEPTED')}
                      disabled={respondingOfferId === offer._id}
                      className="flex items-center gap-2 rounded-full bg-[#84b81b] px-6 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#729e18]"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Accept Offer Letter</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Applications Pipeline Trackers */}
      <div className="rounded-3xl border border-[#edf2f7] bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#edf2f7]">
          <div>
            <h2 className="text-base font-bold text-[#0e1017]">My Applications Pipeline</h2>
            <p className="text-xs text-[#5e6b7c]">Real-time status updates across your applied requisitions</p>
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#8b98a9]">
            You have not applied to any positions yet. Visit{' '}
            <Link to="/careers" className="text-[#84b81b] font-bold hover:underline">
              Careers
            </Link>{' '}
            to apply for open jobs.
          </div>
        ) : (
          <div className="space-y-6">
            {applications.map((app: any) => {
              const currentStageIdx = PIPELINE_STAGES.indexOf(app.stage);
              const activeIdx = currentStageIdx >= 0 ? currentStageIdx : 0;

              return (
                <div
                  key={app._id}
                  className="rounded-2xl border border-[#edf2f7] bg-[#f8fafc] p-6 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h3 className="text-base font-black text-[#0e1017]">
                        {app.jobId?.title || 'Software Engineer'}
                      </h3>
                      <p className="text-xs text-[#5e6b7c]">
                        {app.jobId?.department || 'Department'} • Applied on {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-[#edf7d2] px-3 py-1 text-xs font-bold text-[#567715]">
                        Current Stage: {app.stage}
                      </span>
                    </div>
                  </div>

                  {/* Visual Stepper Tracker */}
                  <div className="pt-2">
                    <div className="relative flex items-center justify-between">
                      {/* Connecting Line */}
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 w-full bg-slate-200" />
                      <div
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#84b81b] transition-all duration-300"
                        style={{
                          width: `${(activeIdx / (PIPELINE_STAGES.length - 1)) * 100}%`,
                        }}
                      />

                      {PIPELINE_STAGES.map((stg, idx) => {
                        const isDone = idx <= activeIdx;
                        const isCurrent = idx === activeIdx;

                        return (
                          <div key={stg} className="relative z-10 flex flex-col items-center">
                            <div
                              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black transition-all ${
                                isCurrent
                                  ? 'bg-[#84b81b] text-white ring-4 ring-[#edf7d2]'
                                  : isDone
                                  ? 'bg-[#84b81b] text-white'
                                  : 'bg-white border-2 border-slate-300 text-slate-400'
                              }`}
                            >
                              {idx + 1}
                            </div>
                            <span
                              className={`mt-2 text-[10px] font-bold text-center max-w-[60px] leading-tight ${
                                isCurrent
                                  ? 'text-[#567715]'
                                  : isDone
                                  ? 'text-[#0e1017]'
                                  : 'text-slate-400'
                              }`}
                            >
                              {stg}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Candidate Profile Card */}
      <div className="rounded-3xl border border-[#edf2f7] bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#edf2f7]">
          <div>
            <h2 className="text-base font-bold text-[#0e1017]">My Candidate Profile</h2>
            <p className="text-xs text-[#5e6b7c]">Details recruiters view when screening your application</p>
          </div>
          <button
            onClick={() => setIsEditProfileOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-[#edf2f7] bg-[#f8fafc] px-4 py-1.5 text-xs font-bold text-[#0e1017] hover:bg-slate-100 transition-colors"
          >
            <Edit3 className="h-3.5 w-3.5 text-[#84b81b]" />
            <span>Edit Profile</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="rounded-2xl bg-[#f8fafc] p-4 border border-[#edf2f7]">
            <span className="text-[10px] font-bold text-[#8b98a9] uppercase">Contact Details</span>
            <p className="mt-1 font-bold text-[#0e1017]">{candidate?.fullName}</p>
            <p className="text-[#5e6b7c]">{candidate?.email}</p>
            <p className="text-[#5e6b7c]">{candidate?.phone || 'No phone added'}</p>
          </div>

          <div className="rounded-2xl bg-[#f8fafc] p-4 border border-[#edf2f7]">
            <span className="text-[10px] font-bold text-[#8b98a9] uppercase">Experience & Location</span>
            <p className="mt-1 font-bold text-[#0e1017]">{candidate?.totalExperienceYears || 0} Years Exp</p>
            <p className="text-[#5e6b7c]">{candidate?.currentCompany || 'Freelance / Open to Work'}</p>
            <p className="text-[#5e6b7c]">{candidate?.currentCity || 'India'}</p>
          </div>

          <div className="rounded-2xl bg-[#f8fafc] p-4 border border-[#edf2f7]">
            <span className="text-[10px] font-bold text-[#8b98a9] uppercase">Core Skills</span>
            <div className="mt-1 flex flex-wrap gap-1">
              {candidate?.skills?.map((s: string, idx: number) => (
                <span
                  key={idx}
                  className="rounded-md bg-white px-2 py-0.5 text-[10px] font-semibold text-[#5e6b7c] border border-[#edf2f7]"
                >
                  {s}
                </span>
              )) || <span className="text-[#8b98a9]">No skills listed</span>}
            </div>
          </div>
        </div>

        {candidate?.parsedText && (
          <div className="rounded-2xl bg-[#f8fafc] p-4 border border-[#edf2f7] text-xs">
            <span className="text-[10px] font-bold text-[#8b98a9] uppercase">Resume Summary / Bio</span>
            <p className="mt-1 text-[#4a5568] leading-relaxed">{candidate.parsedText}</p>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-[#edf2f7] my-8">
            <div className="flex items-center justify-between pb-4 border-b border-[#edf2f7]">
              <div>
                <h3 className="font-bold text-base text-[#0e1017]">Edit Candidate Profile</h3>
                <p className="text-xs text-[#5e6b7c]">Update your contact info, experience, and skill set</p>
              </div>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="p-1 text-[#8b98a9] hover:text-[#0e1017] rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {profileSuccess && (
              <div className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Profile updated successfully!</span>
              </div>
            )}

            <form onSubmit={handleProfileSave} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#5e6b7c] uppercase text-[10px]">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={profileForm.fullName}
                    onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 font-medium focus:border-[#84b81b] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#5e6b7c] uppercase text-[10px]">Phone Number</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 font-medium focus:border-[#84b81b] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-[#5e6b7c] uppercase text-[10px]">Location / City</label>
                  <input
                    type="text"
                    value={profileForm.currentCity}
                    onChange={(e) => setProfileForm({ ...profileForm, currentCity: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 font-medium focus:border-[#84b81b] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#5e6b7c] uppercase text-[10px]">Experience (Years)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={profileForm.totalExperienceYears}
                    onChange={(e) => setProfileForm({ ...profileForm, totalExperienceYears: Number(e.target.value) })}
                    className="mt-1 w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 font-medium focus:border-[#84b81b] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#5e6b7c] uppercase text-[10px]">Current Company / Role</label>
                <input
                  type="text"
                  value={profileForm.currentCompany}
                  onChange={(e) => setProfileForm({ ...profileForm, currentCompany: e.target.value })}
                  placeholder="e.g. Senior Frontend Engineer at TechScale"
                  className="mt-1 w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 font-medium focus:border-[#84b81b] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#5e6b7c] uppercase text-[10px]">Skills (comma separated)</label>
                <input
                  type="text"
                  value={profileForm.skillsText}
                  onChange={(e) => setProfileForm({ ...profileForm, skillsText: e.target.value })}
                  placeholder="React, TypeScript, Node.js, Next.js"
                  className="mt-1 w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 font-medium focus:border-[#84b81b] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-[#5e6b7c] uppercase text-[10px]">Resume Summary / Bio</label>
                <textarea
                  rows={3}
                  value={profileForm.parsedText}
                  onChange={(e) => setProfileForm({ ...profileForm, parsedText: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-2.5 font-medium focus:border-[#84b81b] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#edf2f7]">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="rounded-full px-5 py-2.5 font-semibold text-[#5e6b7c] hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="rounded-full bg-[#84b81b] px-6 py-2.5 font-bold text-white shadow-xs hover:bg-[#729e18] disabled:opacity-50"
                >
                  {profileSaving ? 'Saving Profile...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};