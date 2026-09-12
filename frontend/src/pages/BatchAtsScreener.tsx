import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { client } from '../lib/api/client.js';
import {
  UploadCloud,
  Sparkles,
  Target,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Download,
  Users,
  Briefcase,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Lightbulb,
  ArrowUpDown,
  Filter,
  Check,
} from 'lucide-react';

interface ScreenedCandidate {
  tempId: string;
  rank: number;
  fileName: string;
  fileSizeBytes: number;
  candidateName: string;
  email: string;
  phone: string;
  totalExperienceYears: number;
  skills: string[];
  skillsCount: number;
  atsScore: number;
  grade: string;
  category: 'BEST' | 'AVERAGE' | 'POOR';
  categoryLabel: string;
  breakdown: {
    skillsScore: number;
    experienceScore: number;
    contactScore: number;
    formattingScore: number;
  };
  strengths: string[];
  improvements: string[];
  jobFit?: {
    jobTitle: string;
    matchedSkills: string[];
    missingSkills: string[];
  };
  resumeBase64: string;
}

export const BatchAtsScreener: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [screenedData, setScreenedData] = useState<{
    totalScreened: number;
    bestCount: number;
    averageCount: number;
    poorCount: number;
    job?: any;
    results: ScreenedCandidate[];
  } | null>(null);

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'BEST' | 'AVERAGE' | 'POOR'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [targetStage, setTargetStage] = useState<'Shortlisted' | 'AI Reviewed' | 'Applied'>('Shortlisted');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await client.get('/jobs');
      setJobs(res.data.data?.jobs || []);
    } catch (err) {
      console.error('Failed to fetch job openings:', err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).filter((f) =>
        f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
      );
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      const filesArray = Array.from(e.dataTransfer.files).filter((f) =>
        f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
      );
      setSelectedFiles((prev) => [...prev, ...filesArray]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
  };

  const handleRunBatchScreen = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one PDF resume to evaluate.');
      return;
    }

    setLoading(true);
    setProgressMsg(`Uploading & analyzing ${selectedFiles.length} resumes with AI ATS engine...`);
    setImportSuccess(null);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('resumes', file);
      });

      if (selectedJobId) {
        formData.append('jobId', selectedJobId);
      }

      const res = await client.post('/candidates/batch-ats-screen', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setScreenedData(res.data.data);
      // Automatically pre-select top best candidates for one-click import
      const bestIds = res.data.data.results
        .filter((c: ScreenedCandidate) => c.category === 'BEST')
        .map((c: ScreenedCandidate) => c.tempId);
      setSelectedCandidateIds(bestIds);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to screen resumes. Please verify all files are valid PDFs.');
    } finally {
      setLoading(false);
      setProgressMsg('');
    }
  };

  const toggleSelectCandidate = (tempId: string) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(tempId) ? prev.filter((id) => id !== tempId) : [...prev, tempId]
    );
  };

  const toggleSelectAllVisible = (visibleIds: string[]) => {
    const allSelected = visibleIds.every((id) => selectedCandidateIds.includes(id));
    if (allSelected) {
      setSelectedCandidateIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedCandidateIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleBatchImport = async () => {
    if (!screenedData || selectedCandidateIds.length === 0) {
      alert('Please select at least one candidate to import into the pipeline.');
      return;
    }

    setImporting(true);
    try {
      const candidatesToImport = screenedData.results.filter((c) =>
        selectedCandidateIds.includes(c.tempId)
      );

      await client.post('/candidates/batch-import', {
        candidates: candidatesToImport,
        jobId: selectedJobId || undefined,
        stage: targetStage,
      });

      setImportSuccess(
        `Successfully imported ${candidatesToImport.length} candidate(s) into the pipeline under "${targetStage}" stage!`
      );
      setSelectedCandidateIds([]);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to import candidates.');
    } finally {
      setImporting(false);
    }
  };

  const handleOpenPdf = (base64Data: string, candidateName: string) => {
    try {
      const arr = base64Data.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/pdf';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e) {
      alert('Unable to preview PDF directly.');
    }
  };

  // Filter & search logic
  const filteredCandidates = (screenedData?.results || []).filter((cand) => {
    if (activeFilter !== 'ALL' && cand.category !== activeFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = cand.candidateName.toLowerCase().includes(q);
      const matchSkills = cand.skills.some((s) => s.toLowerCase().includes(q));
      const matchEmail = cand.email.toLowerCase().includes(q);
      if (!matchName && !matchSkills && !matchEmail) return false;
    }
    return true;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-[#0e1017] p-8 text-white shadow-sm border border-slate-800">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#84b81b]/20 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#84b81b] text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="rounded-full bg-[#edf7d2] px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-[#567715]">
                Recruiter Intelligence Tool
              </span>
            </div>
            <h1 className="text-2xl font-black text-white">
              AI Batch ATS Resume Screener & Leaderboard
            </h1>
            <p className="text-xs text-[#94a3b8] max-w-2xl">
              Upload multiple candidate PDF resumes simultaneously. The deterministic ATS engine analyzes
              keyword density, experience progression, contact formatting, and parser compatibility to identify
              the highest-scoring talent and eliminate low-fit applications.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/candidates"
              className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 transition-all shadow-xs"
            >
              <Users className="h-3.5 w-3.5 text-[#84b81b]" />
              <span>Back to Pipeline Board</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Upload & Configuration Form */}
      <div className="rounded-3xl border border-[#edf2f7] bg-white p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6 border-b border-[#edf2f7]">
          <div className="md:col-span-2 space-y-1">
            <label className="text-xs font-bold text-[#0e1017] uppercase tracking-wider block">
              1. Benchmark Against a Specific Requisition (Optional)
            </label>
            <p className="text-xs text-[#5e6b7c]">
              Select a job opening to evaluate mandatory skills and experience requirements, or leave empty for general ATS diagnostics.
            </p>
          </div>
          <div>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="w-full rounded-2xl border border-[#edf2f7] bg-[#f8fafc] px-4 py-2.5 text-xs font-bold text-[#0e1017] focus:border-[#84b81b] focus:outline-none"
            >
              <option value="">-- General ATS Evaluation (All Roles) --</option>
              {jobs.map((job) => (
                <option key={job._id} value={job._id}>
                  {job.title} ({job.department || 'Engineering'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Drag & Drop Multi-file Uploader */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`relative rounded-3xl border-2 border-dashed p-8 text-center transition-all ${
            isDragging
              ? 'border-[#84b81b] bg-[#edf7d2]/30'
              : 'border-slate-300 bg-[#f8fafc] hover:bg-[#f3f6f9]'
          }`}
        >
          <input
            type="file"
            multiple
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            id="batch-resume-input"
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-xs text-[#84b81b]">
              <UploadCloud className="h-7 w-7" />
            </div>
            <div>
              <label
                htmlFor="batch-resume-input"
                className="cursor-pointer text-sm font-black text-[#84b81b] hover:underline"
              >
                Click to browse multiple PDF resumes
              </label>{' '}
              <span className="text-xs text-[#5e6b7c]">or drag and drop them here</span>
              <p className="text-[11px] text-[#8b98a9] mt-1">
                Supports batch uploads up to 25 PDF resumes at once (Max 10MB per file)
              </p>
            </div>
          </div>
        </div>

        {/* Selected Files List Preview */}
        {selectedFiles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8b98a9]">
                Selected Resumes ({selectedFiles.length})
              </span>
              <button
                type="button"
                onClick={clearAllFiles}
                className="text-xs font-bold text-rose-600 hover:underline"
              >
                Clear All
              </button>
            </div>

            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 rounded-2xl bg-[#f8fafc] border border-[#edf2f7]">
              {selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-xl bg-white border border-[#edf2f7] px-3 py-1.5 shadow-2xs text-xs"
                >
                  <FileText className="h-3.5 w-3.5 text-[#84b81b] shrink-0" />
                  <span className="font-bold text-[#0e1017] max-w-[200px] truncate">{file.name}</span>
                  <span className="text-[10px] text-[#8b98a9]">
                    ({(file.size / 1024).toFixed(0)} KB)
                  </span>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={handleRunBatchScreen}
                className="flex items-center gap-2 rounded-full bg-[#84b81b] px-6 py-3 text-xs font-black text-white shadow-sm hover:bg-[#729e18] transition-all disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                <span>
                  {loading
                    ? progressMsg || 'Screening Resumes...'
                    : `Analyze & Rank ${selectedFiles.length} Resumes with AI ATS`}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Screened Results Dashboard */}
      {screenedData && (
        <div className="space-y-6">
          {/* Status Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-[#edf2f7] bg-white p-4 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-[#8b98a9] tracking-wider">Total Resumes</span>
              <p className="mt-1 text-2xl font-black text-[#0e1017]">{screenedData.totalScreened}</p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider">🟢 Top ATS Picks</span>
                <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[9px] font-black">
                  Score ≥ 80%
                </span>
              </div>
              <p className="mt-1 text-2xl font-black text-emerald-700">{screenedData.bestCount}</p>
              <span className="text-[10px] text-emerald-700 font-medium">Best Resumes for Shortlisting</span>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wider">🟡 Moderate Match</span>
                <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[9px] font-black">
                  60% - 79%
                </span>
              </div>
              <p className="mt-1 text-2xl font-black text-amber-700">{screenedData.averageCount}</p>
              <span className="text-[10px] text-amber-700 font-medium">Secondary Review Candidates</span>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-rose-800 tracking-wider">🔴 Low ATS Score</span>
                <span className="rounded-full bg-rose-100 text-rose-800 px-2 py-0.5 text-[9px] font-black">
                  Score &lt; 60%
                </span>
              </div>
              <p className="mt-1 text-2xl font-black text-rose-700">{screenedData.poorCount}</p>
              <span className="text-[10px] text-rose-700 font-medium">Kharab / Needs Major Optimization</span>
            </div>
          </div>

          {importSuccess && (
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-xs font-bold text-emerald-900 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{importSuccess}</span>
              <Link to="/candidates" className="ml-auto text-[#84b81b] hover:underline">
                View in Pipeline Board &rarr;
              </Link>
            </div>
          )}

          {/* Results Action Bar: Filters, Search, Batch Actions */}
          <div className="rounded-3xl border border-[#edf2f7] bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-[#f8fafc] rounded-2xl border border-[#edf2f7] overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeFilter === 'ALL'
                      ? 'bg-white text-[#0e1017] shadow-xs'
                      : 'text-[#5e6b7c] hover:text-[#0e1017]'
                  }`}
                >
                  All ({screenedData.totalScreened})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('BEST')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeFilter === 'BEST'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  <span>🟢 Top ATS Picks</span>
                  <span>({screenedData.bestCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('AVERAGE')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeFilter === 'AVERAGE'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-amber-700 hover:bg-amber-50'
                  }`}
                >
                  <span>🟡 Moderate</span>
                  <span>({screenedData.averageCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFilter('POOR')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeFilter === 'POOR'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-rose-700 hover:bg-rose-50'
                  }`}
                >
                  <span>🔴 Low Score (Kharab)</span>
                  <span>({screenedData.poorCount})</span>
                </button>
              </div>

              {/* Search Box */}
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Filter by name, skill, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-full border border-[#edf2f7] bg-[#f8fafc] px-4 py-2 text-xs font-medium text-[#0e1017] focus:border-[#84b81b] focus:outline-none w-56"
                />
              </div>
            </div>

            {/* Batch Action Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-[#edf2f7]">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-[#0e1017]">
                  <input
                    type="checkbox"
                    checked={
                      filteredCandidates.length > 0 &&
                      filteredCandidates.every((c) => selectedCandidateIds.includes(c.tempId))
                    }
                    onChange={() =>
                      toggleSelectAllVisible(filteredCandidates.map((c) => c.tempId))
                    }
                    className="rounded border-[#edf2f7] text-[#84b81b] focus:ring-[#84b81b]"
                  />
                  <span>Select All Visible ({filteredCandidates.length})</span>
                </label>
                <span className="text-xs text-[#8b98a9]">
                  {selectedCandidateIds.length} candidate(s) selected
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#5e6b7c]">Target Stage:</span>
                <select
                  value={targetStage}
                  onChange={(e: any) => setTargetStage(e.target.value)}
                  className="rounded-xl border border-[#edf2f7] bg-[#f8fafc] px-2.5 py-1.5 text-xs font-bold text-[#0e1017] focus:outline-none"
                >
                  <option value="Shortlisted">Shortlisted</option>
                  <option value="AI Reviewed">AI Reviewed</option>
                  <option value="Applied">Applied</option>
                </select>

                <button
                  type="button"
                  disabled={importing || selectedCandidateIds.length === 0}
                  onClick={handleBatchImport}
                  className="flex items-center gap-1.5 rounded-full bg-[#84b81b] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#729e18] transition-all disabled:opacity-40"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>
                    {importing
                      ? 'Importing...'
                      : `Import ${selectedCandidateIds.length} Selected into Pipeline`}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* 4. Candidate Ranking Leaderboard */}
          <div className="space-y-4">
            {filteredCandidates.length === 0 ? (
              <div className="rounded-3xl border border-[#edf2f7] bg-white p-12 text-center text-xs text-[#8b98a9]">
                No resumes match the selected filter or search query.
              </div>
            ) : (
              filteredCandidates.map((cand) => {
                const isSelected = selectedCandidateIds.includes(cand.tempId);
                const isTopPick = cand.category === 'BEST';
                const isPoor = cand.category === 'POOR';

                const scoreColorClass = isTopPick
                  ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800'
                  : isPoor
                  ? 'border-rose-300 bg-rose-50/50 text-rose-800'
                  : 'border-amber-400 bg-amber-50/50 text-amber-800';

                return (
                  <div
                    key={cand.tempId}
                    className={`rounded-3xl border bg-white p-5 shadow-xs transition-all ${
                      isSelected
                        ? 'border-[#84b81b] ring-2 ring-[#edf7d2]'
                        : isTopPick
                        ? 'border-emerald-200 hover:border-emerald-400'
                        : 'border-[#edf2f7] hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Left: Checkbox, Rank, Name, Contact */}
                      <div className="flex items-start gap-4">
                        <div className="pt-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectCandidate(cand.tempId)}
                            className="h-4 w-4 rounded border-[#edf2f7] text-[#84b81b] focus:ring-[#84b81b]"
                          />
                        </div>

                        {/* Rank Badge */}
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl font-black text-sm ${
                            cand.rank === 1
                              ? 'bg-amber-400 text-amber-950 ring-4 ring-amber-100 shadow-xs'
                              : cand.rank === 2
                              ? 'bg-slate-200 text-slate-800'
                              : cand.rank === 3
                              ? 'bg-amber-700 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          #{cand.rank}
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-black text-[#0e1017]">
                              {cand.candidateName}
                            </h3>
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide border ${scoreColorClass}`}
                            >
                              {cand.categoryLabel} (Grade {cand.grade})
                            </span>
                            {cand.rank === 1 && (
                              <span className="rounded-full bg-[#84b81b] px-2 py-0.5 text-[9px] font-black text-white">
                                ★ #1 TOP RECOMMENDATION
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-[#5e6b7c]">
                            <span>{cand.email}</span>
                            <span>•</span>
                            <span>{cand.phone}</span>
                            <span>•</span>
                            <span>{cand.totalExperienceYears} Years Exp</span>
                            <span>•</span>
                            <span className="text-[#8b98a9]">{cand.fileName}</span>
                          </div>

                          {/* Extracted Skills Badges */}
                          {cand.skills && cand.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {cand.skills.slice(0, 8).map((sk) => (
                                <span
                                  key={sk}
                                  className="rounded-md bg-[#f8fafc] border border-[#edf2f7] px-2 py-0.5 text-[10px] font-semibold text-[#0e1017]"
                                >
                                  {sk}
                                </span>
                              ))}
                              {cand.skills.length > 8 && (
                                <span className="text-[10px] text-[#8b98a9] font-bold">
                                  +{cand.skills.length - 8} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: ATS Score Gauge & Dimension Bars */}
                      <div className="flex flex-wrap items-center gap-6 lg:shrink-0 self-end lg:self-center">
                        {/* 4 Pillars Breakdown Preview */}
                        <div className="hidden sm:grid grid-cols-2 gap-2 text-[10px] w-48 bg-[#f8fafc] p-2.5 rounded-2xl border border-[#edf2f7]">
                          <div>
                            <span className="text-[#8b98a9] block">Keywords</span>
                            <span className="font-bold text-[#0e1017]">
                              {cand.breakdown.skillsScore}%
                            </span>
                          </div>
                          <div>
                            <span className="text-[#8b98a9] block">Experience</span>
                            <span className="font-bold text-[#0e1017]">
                              {cand.breakdown.experienceScore}%
                            </span>
                          </div>
                          <div>
                            <span className="text-[#8b98a9] block">Contact</span>
                            <span className="font-bold text-[#0e1017]">
                              {cand.breakdown.contactScore}%
                            </span>
                          </div>
                          <div>
                            <span className="text-[#8b98a9] block">Readability</span>
                            <span className="font-bold text-[#0e1017]">
                              {cand.breakdown.formattingScore}%
                            </span>
                          </div>
                        </div>

                        {/* Radial ATS Score Meter */}
                        <div className="flex items-center gap-2.5 bg-[#f8fafc] px-4 py-2 rounded-2xl border border-[#edf2f7]">
                          <div className="relative flex items-center justify-center">
                            <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                              <path
                                className="text-slate-200"
                                strokeWidth="3.5"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                              <path
                                className={`transition-all duration-1000 ease-out ${
                                  isTopPick
                                    ? 'text-emerald-500'
                                    : isPoor
                                    ? 'text-rose-500'
                                    : 'text-amber-500'
                                }`}
                                strokeDasharray={`${cand.atsScore}, 100`}
                                strokeWidth="3.5"
                                strokeLinecap="round"
                                stroke="currentColor"
                                fill="none"
                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                              />
                            </svg>
                            <span className="absolute text-xs font-black text-[#0e1017]">
                              {cand.atsScore}%
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b98a9] block">
                              ATS Score
                            </span>
                            <span
                              className={`text-xs font-black ${
                                isTopPick
                                  ? 'text-emerald-700'
                                  : isPoor
                                  ? 'text-rose-700'
                                  : 'text-amber-700'
                              }`}
                            >
                              Grade {cand.grade}
                            </span>
                          </div>
                        </div>

                        {/* PDF View Action */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenPdf(cand.resumeBase64, cand.candidateName)}
                            className="flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-[#0e1017] hover:bg-slate-50 transition-all shadow-xs"
                          >
                            <FileText className="h-3.5 w-3.5 text-[#84b81b]" />
                            <span>View PDF</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Diagnostics: Strengths & Weaknesses (Why it's Good vs Kharab) */}
                    <div className="mt-4 pt-3 border-t border-[#edf2f7] grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="flex items-start gap-1.5 text-emerald-800">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                          <strong>ATS Strengths:</strong>{' '}
                          {cand.strengths.slice(0, 2).join(' • ') || 'Standard resume structure'}
                        </span>
                      </div>

                      <div className="flex items-start gap-1.5 text-amber-900">
                        <Lightbulb className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                        <span>
                          <strong>Optimization Gaps:</strong>{' '}
                          {cand.improvements.slice(0, 2).join(' • ') || 'No critical parsing blockers'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
