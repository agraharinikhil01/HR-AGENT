import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { client } from '../lib/api/client.js';
import { useAuth } from '../auth/AuthProvider.js';
import { Sparkles, ArrowLeft, X, AlertCircle } from 'lucide-react';

export const CreateJob: React.FC = () => {
  const navigate = useNavigate();
  const { organization } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    department: 'Engineering',
    employmentType: 'Full-time' as const,
    workplaceType: 'Hybrid' as const,
    location: 'Bengaluru, India',
    vacancies: 1,
    minExperienceYears: 3,
    maxExperienceYears: 6,
    minSalary: 1500000,
    maxSalary: 2800000,
    noticePeriodPreferenceDays: 30,
    description: '',
    responsibilitiesText: '',
    mandatorySkillsText: 'React, Node.js, TypeScript',
    preferredSkillsText: 'AWS, Docker, Next.js',
  });

  const [aiLoading, setAiLoading] = useState(false);
  const [aiGeneratedBadge, setAiGeneratedBadge] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI JD Generator Assistant
  const handleAiDraft = async () => {
    if (!formData.title) {
      setError('Please enter a Job Title first so AI can draft the description.');
      return;
    }
    setError(null);
    setAiLoading(true);

    try {
      const skillsArray = formData.mandatorySkillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await client.post('/jobs/ai-generate-jd', {
        title: formData.title,
        industry: organization?.industry || 'Technology',
        experienceLevel: `${formData.minExperienceYears}-${formData.maxExperienceYears} years`,
        requiredSkills: skillsArray,
        workplaceType: formData.workplaceType,
      });

      const draft = res.data.data;
      setFormData((prev) => ({
        ...prev,
        description: draft.summary,
        responsibilitiesText: draft.responsibilities.join('\n'),
        mandatorySkillsText: draft.mandatorySkills.join(', '),
        preferredSkillsText: draft.preferredSkills.join(', '),
      }));
      setAiGeneratedBadge(true);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to generate AI JD draft.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const payload = {
        title: formData.title,
        department: formData.department,
        employmentType: formData.employmentType,
        workplaceType: formData.workplaceType,
        location: formData.location,
        vacancies: Number(formData.vacancies),
        minExperienceYears: Number(formData.minExperienceYears),
        maxExperienceYears: Number(formData.maxExperienceYears),
        minSalary: Number(formData.minSalary),
        maxSalary: Number(formData.maxSalary),
        currency: 'INR',
        noticePeriodPreferenceDays: Number(formData.noticePeriodPreferenceDays),
        description: formData.description,
        responsibilities: formData.responsibilitiesText
          .split('\n')
          .map((r) => r.trim())
          .filter(Boolean),
        mandatorySkills: formData.mandatorySkillsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        preferredSkills: formData.preferredSkillsText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      };

      await client.post('/jobs', payload);
      navigate('/jobs');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create job opening.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 rounded-xl border border-[#edf2f7] bg-white px-3 py-1.5 text-xs font-semibold text-[#5e6b7c] hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
        <div>
          <h1 className="text-xl font-black tracking-tight text-[#0e1017]">Create Job Opening</h1>
          <p className="text-xs text-[#5e6b7c]">
            Define requirements, salary benchmarks, and AI screening parameters
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-3.5 text-xs font-semibold text-red-700 border border-red-100">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {aiGeneratedBadge && (
        <div className="flex items-center justify-between rounded-2xl bg-[#edf7d2] p-4 border border-[#edf7d2] text-xs text-[#567715]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#84b81b] shrink-0" />
            <span>
              <strong>AI draft populated:</strong> You can edit any field before publishing.
            </span>
          </div>
          <button
            onClick={() => setAiGeneratedBadge(false)}
            className="text-[#567715] hover:opacity-70"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-[#edf2f7] bg-white p-6 sm:p-8 shadow-sm">
        {/* Title & AI Assistant Trigger */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">
              Job Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Lead Backend Engineer"
              className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] px-3.5 py-2 text-xs font-semibold text-[#0e1017] focus:border-[#84b81b] focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleAiDraft}
              disabled={aiLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#edf7d2] px-4 py-2.5 text-xs font-bold text-[#567715] hover:bg-[#dff0b8] transition-colors border border-[#edf7d2] disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4 text-[#84b81b]" />
              {aiLoading ? 'Drafting with AI...' : 'AI JD Assistant'}
            </button>
          </div>
        </div>

        {/* Department, Employment Type, Workplace */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">
              Department
            </label>
            <input
              type="text"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="Engineering"
              className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] px-3.5 py-2 text-xs text-[#0e1017] focus:border-[#84b81b] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">
              Employment Type
            </label>
            <select
              value={formData.employmentType}
              onChange={(e) => setFormData({ ...formData, employmentType: e.target.value as any })}
              className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] px-3.5 py-2 text-xs text-[#0e1017] focus:border-[#84b81b] focus:outline-none"
            >
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Intern">Intern</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">
              Workplace Type
            </label>
            <select
              value={formData.workplaceType}
              onChange={(e) => setFormData({ ...formData, workplaceType: e.target.value as any })}
              className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] px-3.5 py-2 text-xs text-[#0e1017] focus:border-[#84b81b] focus:outline-none"
            >
              <option value="Hybrid">Hybrid</option>
              <option value="On-site">On-site</option>
              <option value="Remote">Remote</option>
            </select>
          </div>
        </div>

        {/* Experience & Notice Period */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">
              Min Experience (Yrs)
            </label>
            <input
              type="number"
              min={0}
              value={formData.minExperienceYears}
              onChange={(e) => setFormData({ ...formData, minExperienceYears: Number(e.target.value) })}
              className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] px-3.5 py-2 text-xs text-[#0e1017] focus:border-[#84b81b] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">
              Max Experience (Yrs)
            </label>
            <input
              type="number"
              min={0}
              value={formData.maxExperienceYears}
              onChange={(e) => setFormData({ ...formData, maxExperienceYears: Number(e.target.value) })}
              className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] px-3.5 py-2 text-xs text-[#0e1017] focus:border-[#84b81b] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">
              Max Notice Period (Days)
            </label>
            <input
              type="number"
              min={0}
              value={formData.noticePeriodPreferenceDays}
              onChange={(e) => setFormData({ ...formData, noticePeriodPreferenceDays: Number(e.target.value) })}
              className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] px-3.5 py-2 text-xs text-[#0e1017] focus:border-[#84b81b] focus:outline-none"
            />
          </div>
        </div>

        {/* Salary Range (INR) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">
              Min Annual Salary (₹)
            </label>
            <input
              type="number"
              step={50000}
              value={formData.minSalary}
              onChange={(e) => setFormData({ ...formData, minSalary: Number(e.target.value) })}
              className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] px-3.5 py-2 text-xs text-[#0e1017] focus:border-[#84b81b] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">
              Max Annual Salary (₹)
            </label>
            <input
              type="number"
              step={50000}
              value={formData.maxSalary}
              onChange={(e) => setFormData({ ...formData, maxSalary: Number(e.target.value) })}
              className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] px-3.5 py-2 text-xs text-[#0e1017] focus:border-[#84b81b] focus:outline-none"
            />
          </div>
        </div>

        {/* Skills Evaluation Criteria */}
        <div className="space-y-4 rounded-2xl bg-[#edf7d2]/30 p-4 border border-[#edf7d2]">
          <div>
            <label className="block text-[11px] font-bold uppercase text-[#567715]">
              Mandatory Skills * (Weighted 30% in AI Fit Score)
            </label>
            <p className="text-[10px] text-[#5e6b7c]">Comma-separated list of non-negotiable skills.</p>
            <input
              type="text"
              required
              value={formData.mandatorySkillsText}
              onChange={(e) => setFormData({ ...formData, mandatorySkillsText: e.target.value })}
              placeholder="e.g. React, Node.js, TypeScript"
              className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-white px-3.5 py-2 text-xs text-[#0e1017] focus:border-[#84b81b] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-[#567715]">
              Preferred Skills (Weighted 10% in AI Fit Score)
            </label>
            <p className="text-[10px] text-[#5e6b7c]">Good-to-have skills or tools.</p>
            <input
              type="text"
              value={formData.preferredSkillsText}
              onChange={(e) => setFormData({ ...formData, preferredSkillsText: e.target.value })}
              placeholder="e.g. AWS, Redis, GraphQL, Docker"
              className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-white px-3.5 py-2 text-xs text-[#0e1017] focus:border-[#84b81b] focus:outline-none"
            />
          </div>
        </div>

        {/* Description & Responsibilities */}
        <div>
          <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">
            Job Overview / Description *
          </label>
          <textarea
            required
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Overview of the company, team and what this role aims to achieve..."
            className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-3 text-xs text-[#0e1017] focus:border-[#84b81b] focus:bg-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-[#5e6b7c]">
            Key Responsibilities (One per line)
          </label>
          <textarea
            rows={4}
            value={formData.responsibilitiesText}
            onChange={(e) => setFormData({ ...formData, responsibilitiesText: e.target.value })}
            placeholder="Build responsive user interfaces&#10;Design scalable microservices&#10;Conduct architectural reviews"
            className="mt-1 block w-full rounded-xl border border-[#edf2f7] bg-[#f8fafc] p-3 text-xs text-[#0e1017] focus:border-[#84b81b] focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#edf2f7]">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-full px-4 py-2 text-xs font-semibold text-[#5e6b7c] hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-[#84b81b] px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#729e18] transition-colors disabled:opacity-50"
          >
            {submitting ? 'Publishing...' : 'Publish Job Opening'}
          </button>
        </div>
      </form>
    </div>
  );
};
