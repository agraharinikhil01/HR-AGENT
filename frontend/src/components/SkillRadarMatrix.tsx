import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Layers,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export interface RadarDimension {
  axis: string;
  label: string;
  candidateValue: number; // 0 - 100
  jobValue: number; // 0 - 100 benchmark
  description: string;
  matchedSkills: string[];
  missingSkills: string[];
}

interface SkillRadarMatrixProps {
  candidateSkills: string[];
  jobMandatorySkills?: string[];
  jobPreferredSkills?: string[];
  jobTitle?: string;
  candidateName?: string;
}

const CATEGORY_MAP: Record<string, { axis: string; label: string; keywords: string[] }> = {
  frontend: {
    axis: 'Frontend',
    label: 'Frontend & UI/UX',
    keywords: [
      'react', 'react.js', 'react native', 'typescript', 'javascript', 'vue', 'vue.js',
      'angular', 'svelte', 'next.js', 'nuxt.js', 'tailwind', 'tailwind css', 'bootstrap',
      'html', 'html5', 'css', 'css3', 'redux', 'zustand', 'figma', 'ui/ux', 'webpack', 'vite',
    ],
  },
  backend: {
    axis: 'Backend',
    label: 'Backend & APIs',
    keywords: [
      'node', 'node.js', 'express', 'express.js', 'nestjs', 'python', 'django', 'flask',
      'fastapi', 'java', 'spring', 'spring boot', 'c++', 'c#', '.net', 'go', 'golang',
      'ruby', 'ruby on rails', 'php', 'laravel', 'rest', 'rest api', 'graphql', 'microservices',
      'kafka', 'rabbitmq', 'socket.io',
    ],
  },
  database: {
    axis: 'Database',
    label: 'Database & Caching',
    keywords: [
      'mongodb', 'postgresql', 'postgres', 'mysql', 'sql', 'redis', 'elasticsearch',
      'dynamodb', 'cassandra', 'sqlite', 'orm', 'prisma', 'mongoose', 'hibernate',
    ],
  },
  devops: {
    axis: 'DevOps',
    label: 'Cloud & DevOps',
    keywords: [
      'docker', 'kubernetes', 'aws', 'amazon web services', 'azure', 'gcp', 'google cloud',
      'git', 'github', 'gitlab', 'ci/cd', 'jenkins', 'terraform', 'ansible', 'linux',
      'serverless', 'nginx',
    ],
  },
  architecture: {
    axis: 'System Design',
    label: 'Architecture & Testing',
    keywords: [
      'system design', 'scalability', 'unit testing', 'jest', 'cypress', 'playwright',
      'selenium', 'security', 'oauth', 'jwt', 'penetration testing', 'compliance',
      'data structures', 'algorithms',
    ],
  },
  execution: {
    axis: 'Agile',
    label: 'Agile & Leadership',
    keywords: [
      'agile', 'scrum', 'kanban', 'jira', 'confluence', 'trello', 'project management',
      'mentorship', 'code reviews', 'collaboration', 'communication',
    ],
  },
};

export const SkillRadarMatrix: React.FC<SkillRadarMatrixProps> = ({
  candidateSkills = [],
  jobMandatorySkills = [],
  jobPreferredSkills = [],
  jobTitle = 'Role Requisition',
  candidateName = 'Candidate',
}) => {
  const [activeTab, setActiveTab] = useState<'RADAR' | 'HEATMAP'>('RADAR');
  const [hoveredAxis, setHoveredAxis] = useState<string | null>(null);

  const lowerCandidateSkills = candidateSkills.map((s) => s.toLowerCase());
  const allJobSkills = Array.from(new Set([...jobMandatorySkills, ...jobPreferredSkills]));
  const lowerJobSkills = allJobSkills.map((s) => s.toLowerCase());

  // Compute 6 Radar Dimensions
  const dimensions: RadarDimension[] = Object.values(CATEGORY_MAP).map((cat) => {
    const matchedInCat = candidateSkills.filter((sk) =>
      cat.keywords.some((kw) => sk.toLowerCase().includes(kw))
    );

    const requiredInCat = allJobSkills.filter((sk) =>
      cat.keywords.some((kw) => sk.toLowerCase().includes(kw))
    );

    const matchedAgainstJob = requiredInCat.filter((sk) =>
      lowerCandidateSkills.some((csk) => csk.includes(sk.toLowerCase()))
    );

    const missingAgainstJob = requiredInCat.filter(
      (sk) => !lowerCandidateSkills.some((csk) => csk.includes(sk.toLowerCase()))
    );

    // Candidate score in this category: based on verified skills and role requirements
    let candidateScore = 20;
    if (candidateSkills.length === 0) {
      candidateScore = 10;
    } else if (requiredInCat.length > 0) {
      const matchRatio = matchedAgainstJob.length / requiredInCat.length;
      candidateScore = Math.min(100, Math.round(25 + matchRatio * 65 + (matchedInCat.length > requiredInCat.length ? 10 : 0)));
    } else {
      candidateScore = Math.min(100, Math.max(20, 30 + matchedInCat.length * 15));
    }

    const jobBenchmarkScore = requiredInCat.length > 0 ? 85 : 70;

    return {
      axis: cat.axis,
      label: cat.label,
      candidateValue: candidateScore,
      jobValue: jobBenchmarkScore,
      description: `${matchedInCat.length} skill(s) detected (${matchedAgainstJob.length} matched role requirement)`,
      matchedSkills: matchedInCat,
      missingSkills: missingAgainstJob,
    };
  });

  // Calculate matched vs gap breakdown
  const exactMatchedSkills = allJobSkills.filter((js) =>
    lowerCandidateSkills.some((cs) => cs.includes(js.toLowerCase()) || js.toLowerCase().includes(cs))
  );

  const missingCriticalSkills = jobMandatorySkills.filter(
    (js) => !lowerCandidateSkills.some((cs) => cs.includes(js.toLowerCase()) || js.toLowerCase().includes(cs))
  );

  const candidateBonusSkills = candidateSkills.filter(
    (cs) => !lowerJobSkills.some((js) => js.includes(cs.toLowerCase()) || cs.toLowerCase().includes(js))
  );

  // SVG Radar Geometry Calculations
  const size = 320;
  const center = size / 2;
  const radius = center - 42;
  const totalAxes = dimensions.length;
  const angleStep = (Math.PI * 2) / totalAxes;

  // Function to get (x, y) coordinates for a given axis index and normalized value (0-100)
  const getCoordinates = (index: number, value: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (value / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Build polygon points string for Candidate & Job Benchmark
  const candidatePoints = dimensions
    .map((d, i) => {
      const { x, y } = getCoordinates(i, d.candidateValue);
      return `${x},${y}`;
    })
    .join(' ');

  const jobPoints = dimensions
    .map((d, i) => {
      const { x, y } = getCoordinates(i, d.jobValue);
      return `${x},${y}`;
    })
    .join(' ');

  // Web rings (20%, 40%, 60%, 80%, 100%)
  const webRings = [0.2, 0.4, 0.6, 0.8, 1.0];

  return (
    <div className="rounded-3xl border border-[#edf2f7] bg-white p-6 shadow-sm space-y-6">
      {/* Header with Title & View Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#edf2f7]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#edf7d2] text-[#84b81b] shadow-2xs">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-[#0e1017]">
                360° Candidate Skill Match Matrix & Gap Heatmap
              </h3>
              <span className="rounded-full bg-[#84b81b] text-white px-2 py-0.5 text-[9px] font-black uppercase">
                AI Powered
              </span>
            </div>
            <p className="text-xs text-[#5e6b7c]">
              Multi-dimensional evaluation against <strong>{jobTitle}</strong> requisitions
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center gap-1 p-1 bg-[#f8fafc] rounded-2xl border border-[#edf2f7] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('RADAR')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'RADAR'
                ? 'bg-white text-[#0e1017] shadow-xs'
                : 'text-[#5e6b7c] hover:text-[#0e1017]'
            }`}
          >
            360° Spider Radar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('HEATMAP')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'HEATMAP'
                ? 'bg-white text-[#0e1017] shadow-xs'
                : 'text-[#5e6b7c] hover:text-[#0e1017]'
            }`}
          >
            Skill Gap Heatmap
          </button>
        </div>
      </div>

      {activeTab === 'RADAR' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left: SVG Radar Canvas */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center relative p-2">
            <div className="relative w-[320px] h-[320px]">
              <svg className="w-full h-full" viewBox={`0 0 ${size} ${size}`}>
                <defs>
                  <linearGradient id="candidateGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#84b81b" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#567715" stopOpacity="0.15" />
                  </linearGradient>
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Concentric Background Grid Webs */}
                {webRings.map((factor, rIdx) => {
                  const ringPoints = dimensions
                    .map((_, i) => {
                      const { x, y } = getCoordinates(i, factor * 100);
                      return `${x},${y}`;
                    })
                    .join(' ');
                  return (
                    <polygon
                      key={rIdx}
                      points={ringPoints}
                      fill={rIdx === webRings.length - 1 ? '#fcfdfd' : 'none'}
                      stroke="#e2e8f0"
                      strokeWidth={rIdx === webRings.length - 1 ? '1.5' : '1'}
                      strokeDasharray={rIdx < webRings.length - 1 ? '3 3' : undefined}
                    />
                  );
                })}

                {/* Spokes / Axis Lines */}
                {dimensions.map((_, i) => {
                  const { x, y } = getCoordinates(i, 100);
                  return (
                    <line
                      key={i}
                      x1={center}
                      y1={center}
                      x2={x}
                      y2={y}
                      stroke="#cbd5e1"
                      strokeWidth="1"
                    />
                  );
                })}

                {/* Job Benchmark Target Polygon */}
                <polygon
                  points={jobPoints}
                  fill="rgba(148, 163, 184, 0.12)"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />

                {/* Candidate Actual Skills Polygon */}
                <polygon
                  points={candidatePoints}
                  fill="url(#candidateGradient)"
                  stroke="#84b81b"
                  strokeWidth="2.5"
                  filter="url(#glow)"
                  className="transition-all duration-700 ease-out"
                />

                {/* Nodes & Hover Vertices */}
                {dimensions.map((d, i) => {
                  const { x, y } = getCoordinates(i, d.candidateValue);
                  const isHovered = hoveredAxis === d.axis;
                  return (
                    <g
                      key={i}
                      onMouseEnter={() => setHoveredAxis(d.axis)}
                      onMouseLeave={() => setHoveredAxis(null)}
                      className="cursor-pointer"
                    >
                      <circle
                        cx={x}
                        cy={y}
                        r={isHovered ? 6 : 4}
                        fill="#ffffff"
                        stroke="#84b81b"
                        strokeWidth={isHovered ? 3 : 2}
                        className="transition-all duration-200"
                      />
                    </g>
                  );
                })}

                {/* Axis Labels */}
                {dimensions.map((d, i) => {
                  const angle = i * angleStep - Math.PI / 2;
                  const labelRadius = radius + 24;
                  const x = center + labelRadius * Math.cos(angle);
                  const y = center + labelRadius * Math.sin(angle);
                  const isHovered = hoveredAxis === d.axis;

                  return (
                    <text
                      key={i}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      onMouseEnter={() => setHoveredAxis(d.axis)}
                      onMouseLeave={() => setHoveredAxis(null)}
                      className={`text-[10px] font-bold select-none cursor-pointer transition-colors ${
                        isHovered ? 'fill-[#567715] font-black' : 'fill-[#5e6b7c]'
                      }`}
                    >
                      {d.axis} ({d.candidateValue}%)
                    </text>
                  );
                })}
              </svg>
            </div>

            {/* Visual Legend */}
            <div className="flex items-center gap-5 mt-3 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full bg-[#84b81b] ring-2 ring-[#edf7d2]" />
                <span className="text-[#0e1017]">{candidateName} (Score)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full border border-dashed border-slate-400 bg-slate-200" />
                <span className="text-[#5e6b7c]">Role Target Benchmark</span>
              </div>
            </div>
          </div>

          {/* Right: Dimension Breakdown Detail Cards */}
          <div className="lg:col-span-6 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#8b98a9]">
              Competency Breakdown vs Requisition Targets
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {dimensions.map((dim) => {
                const isHovered = hoveredAxis === dim.axis;
                const isBeatingBenchmark = dim.candidateValue >= dim.jobValue;

                return (
                  <div
                    key={dim.axis}
                    onMouseEnter={() => setHoveredAxis(dim.axis)}
                    onMouseLeave={() => setHoveredAxis(null)}
                    className={`rounded-2xl border p-3 transition-all ${
                      isHovered
                        ? 'border-[#84b81b] bg-[#edf7d2]/20 shadow-xs'
                        : 'border-[#edf2f7] bg-[#fcfdfd]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-black text-[#0e1017] truncate">{dim.label}</span>
                      <div className="flex items-center gap-1">
                        <span className="font-extrabold text-[#567715]">{dim.candidateValue}%</span>
                        <span className="text-[10px] text-[#8b98a9]">/ {dim.jobValue}%</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div
                        className="bg-[#84b81b] h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${dim.candidateValue}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-[#5e6b7c] mt-2">
                      <span className="truncate">{dim.matchedSkills.length} verified skill(s)</span>
                      {isBeatingBenchmark ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-0.5">
                          ✓ Exceeds
                        </span>
                      ) : (
                        <span className="text-amber-700 font-bold flex items-center gap-0.5">
                          ▲ Potential
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Skill Gap Heatmap View */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Matched Superpowers */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Matched Superpowers ({exactMatchedSkills.length})
                </span>
                <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[9px] font-black">
                  100% Fit
                </span>
              </div>
              <p className="text-[11px] text-emerald-800">
                Skills found in both candidate resume and role requirements.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {exactMatchedSkills.length > 0 ? (
                  exactMatchedSkills.map((sk) => (
                    <span
                      key={sk}
                      className="rounded-lg bg-white border border-emerald-200 px-2.5 py-1 text-[11px] font-semibold text-emerald-900 shadow-2xs"
                    >
                      ✓ {sk}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-emerald-700 italic">No exact mandatory overlaps</span>
                )}
              </div>
            </div>

            {/* 2. Value-Add Candidate Strengths */}
            <div className="rounded-2xl border border-[#edf7d2] bg-[#fcfef9] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#567715] flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-[#84b81b]" />
                  Value-Add Strengths ({candidateBonusSkills.length})
                </span>
                <span className="rounded-full bg-[#edf7d2] text-[#567715] px-2 py-0.5 text-[9px] font-black">
                  Bonus
                </span>
              </div>
              <p className="text-[11px] text-[#5e6b7c]">
                Additional expertise candidate brings that enhance cross-functional output.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {candidateBonusSkills.slice(0, 10).map((sk) => (
                  <span
                    key={sk}
                    className="rounded-lg bg-white border border-[#edf2f7] px-2.5 py-1 text-[11px] font-semibold text-[#0e1017] shadow-2xs"
                  >
                    ★ {sk}
                  </span>
                ))}
              </div>
            </div>

            {/* 3. Missing Critical Must-Haves */}
            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-rose-600" />
                  Missing Critical Must-Haves ({missingCriticalSkills.length})
                </span>
                <span className="rounded-full bg-rose-100 text-rose-800 px-2 py-0.5 text-[9px] font-black">
                  Gap
                </span>
              </div>
              <p className="text-[11px] text-rose-800">
                Skills required by role description not explicitly found in parsed resume.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {missingCriticalSkills.length > 0 ? (
                  missingCriticalSkills.map((sk) => (
                    <span
                      key={sk}
                      className="rounded-lg bg-white border border-rose-200 px-2.5 py-1 text-[11px] font-semibold text-rose-900 shadow-2xs"
                    >
                      ✕ {sk}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-rose-700 italic">Zero critical skill gaps detected!</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
