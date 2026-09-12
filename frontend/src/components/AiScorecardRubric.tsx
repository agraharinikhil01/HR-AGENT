import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Award,
  Sparkles,
  TrendingUp,
  Target,
  FileText,
} from 'lucide-react';

export interface EvaluationData {
  overallScore: number;
  technicalScore: number;
  clarityScore: number;
  problemSolvingScore: number;
  confidenceScore: number;
  recommendation: 'Strong Hire' | 'Hire' | 'Leaning Hire' | 'Needs Improvement';
  grade: string;
  strengths: string[];
  improvements: string[];
  rubricBreakdown: {
    starStructure: boolean;
    technicalDepth: string;
    fillerWordsRatio: string;
    paceAndFlow: string;
  };
  idealAnswerKey: string[];
}

interface AiScorecardRubricProps {
  data: EvaluationData;
  questionText: string;
}

export const AiScorecardRubric: React.FC<AiScorecardRubricProps> = ({
  data,
  questionText,
}) => {
  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case 'Strong Hire':
        return 'bg-emerald-600 text-white';
      case 'Hire':
        return 'bg-[#84b81b] text-white';
      case 'Leaning Hire':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-rose-500 text-white';
    }
  };

  return (
    <div className="rounded-3xl border border-[#edf2f7] bg-white p-6 shadow-sm space-y-6">
      {/* Header with Score & Recommendation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#edf2f7]">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf7d2] text-[#84b81b]">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-[#0e1017]">AI Interview Scorecard</h3>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${getRecommendationColor(data.recommendation)}`}>
                {data.recommendation}
              </span>
            </div>
            <p className="text-xs text-[#5e6b7c] mt-0.5 line-clamp-1">
              Evaluated Question: &quot;{questionText}&quot;
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-[#f8fafc] px-4 py-2 rounded-2xl border border-[#edf2f7] self-start sm:self-auto">
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase text-[#8b98a9] block">Overall Score</span>
            <span className="text-xl font-black text-[#567715]">{data.overallScore}%</span>
          </div>
          <span className="rounded-xl bg-[#567715] text-white px-2.5 py-1 text-xs font-black">
            {data.grade}
          </span>
        </div>
      </div>

      {/* 4 Core Rubric Dimensions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Technical Depth', score: data.technicalScore, icon: '🎯', desc: data.rubricBreakdown.technicalDepth },
          { label: 'Clarity & Flow', score: data.clarityScore, icon: '🗣️', desc: data.rubricBreakdown.paceAndFlow },
          { label: 'Problem Solving', score: data.problemSolvingScore, icon: '🧠', desc: data.rubricBreakdown.starStructure ? 'STAR Used' : 'Direct' },
          { label: 'Confidence', score: data.confidenceScore, icon: '⚡', desc: `Fillers: ${data.rubricBreakdown.fillerWordsRatio}` },
        ].map((rub, i) => (
          <div key={i} className="rounded-2xl border border-[#edf2f7] bg-[#fcfdfd] p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#5e6b7c] flex items-center gap-1 font-semibold">
                <span>{rub.icon}</span>
                <span className="truncate">{rub.label}</span>
              </span>
              <span className="font-extrabold text-[#0e1017]">{rub.score}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#84b81b] h-1.5 rounded-full transition-all duration-700"
                style={{ width: `${rub.score}%` }}
              />
            </div>
            <span className="text-[9px] text-[#8b98a9] block truncate">{rub.desc}</span>
          </div>
        ))}
      </div>

      {/* Strengths & Improvement Opportunities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Strengths */}
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Key Strengths Observed</span>
          </div>
          <ul className="space-y-1.5">
            {data.strengths.map((str, idx) => (
              <li key={idx} className="flex items-start gap-2 text-[11px] text-emerald-800 leading-snug">
                <span className="text-emerald-600 font-bold">•</span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Improvements */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
            <Lightbulb className="h-4 w-4 text-amber-600" />
            <span>Coaching Tips for 95%+ Rating</span>
          </div>
          <ul className="space-y-1.5">
            {data.improvements.map((imp, idx) => (
              <li key={idx} className="flex items-start gap-2 text-[11px] text-amber-800 leading-snug">
                <span className="text-amber-600 font-bold">•</span>
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Ideal Answer Key Points */}
      {data.idealAnswerKey && data.idealAnswerKey.length > 0 && (
        <div className="rounded-2xl border border-[#edf2f7] bg-[#f8fafc] p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0e1017]">
            <FileText className="h-4 w-4 text-[#84b81b]" />
            <span>Interviewer Rubric Expectations (Ideal Answer Architecture)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {data.idealAnswerKey.map((pt, idx) => (
              <div key={idx} className="flex items-start gap-2 text-[11px] text-[#5e6b7c] bg-white p-2 rounded-xl border border-[#edf2f7]">
                <span className="font-black text-[#84b81b] text-[10px]">#{idx + 1}</span>
                <span>{pt}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
