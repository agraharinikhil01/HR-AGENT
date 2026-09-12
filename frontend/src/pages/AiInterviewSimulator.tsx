import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { client } from '../lib/api/client.js';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RotateCcw,
  UserCheck,
  Briefcase,
  HelpCircle,
  FileCheck,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { AudioWaveformVisualizer } from '../components/AudioWaveformVisualizer.js';
import { AiScorecardRubric, EvaluationData } from '../components/AiScorecardRubric.js';

interface QuestionItem {
  id: number;
  category: 'TECHNICAL' | 'SYSTEM_DESIGN' | 'BEHAVIORAL';
  question: string;
  hint: string;
}

const DEFAULT_QUESTIONS: Record<string, QuestionItem[]> = {
  fullstack: [
    {
      id: 1,
      category: 'TECHNICAL',
      question: 'How do you optimize state management and rendering performance in a large-scale React application with hundreds of re-renders?',
      hint: 'Mention memoization (useMemo, useCallback), React.memo, virtualized lists, state colocation, and avoiding unnecessary context triggers.',
    },
    {
      id: 2,
      category: 'SYSTEM_DESIGN',
      question: 'Design a high-throughput, low-latency caching layer using Redis for a Node.js microservice handling 50,000 requests per second.',
      hint: 'Discuss Redis clusters, cache-aside pattern, TTL policies, handling cache thundering herds, and circuit breakers.',
    },
    {
      id: 3,
      category: 'TECHNICAL',
      question: 'Explain how Node.js event loop handles asynchronous I/O and what happens when the event loop is blocked by CPU-bound tasks.',
      hint: 'Mention libuv, thread pool, microtasks vs macrotasks, setImmediate vs process.nextTick, and offloading to worker threads.',
    },
    {
      id: 4,
      category: 'BEHAVIORAL',
      question: 'Tell me about a time when you experienced a critical production outage or bug. How did you diagnose, resolve, and prevent it from recurring?',
      hint: 'Structure using STAR: Situation ➔ Root cause diagnosis ➔ Mitigation steps ➔ Post-mortem & automated alerting.',
    },
    {
      id: 5,
      category: 'SYSTEM_DESIGN',
      question: 'How do you secure REST APIs and WebSocket connections against unauthorized access, replay attacks, and rate abuse?',
      hint: 'Cover JWT rotation, OAuth2 tokens, Redis-based token bucket rate limiting, HTTPS/WSS encryption, and CORS controls.',
    },
  ],
  devops: [
    {
      id: 1,
      category: 'TECHNICAL',
      question: 'How do you structure a zero-downtime Blue/Green or Canary deployment pipeline in Kubernetes?',
      hint: 'Discuss ingress traffic routing, health checks, rollback triggers, and automated telemetry monitoring.',
    },
    {
      id: 2,
      category: 'SYSTEM_DESIGN',
      question: 'Explain how you design a multi-region disaster recovery strategy for mission-critical databases with strict RPO and RTO requirements.',
      hint: 'Cover replication latency, cross-region failover, backup snapshots, and RPO/RTO metrics.',
    },
  ],
  behavioral: [
    {
      id: 1,
      category: 'BEHAVIORAL',
      question: 'Describe a situation where you had a strong disagreement with a technical lead or product manager regarding architecture. How did you resolve it?',
      hint: 'Highlight data-driven compromise, active listening, proof-of-concept testing, and commitment to the final team decision.',
    },
    {
      id: 2,
      category: 'BEHAVIORAL',
      question: 'Tell me about a complex project where you faced tight deadlines and scope creep. How did you prioritize deliverables?',
      hint: 'Use the STAR format: Explain trade-offs, stakeholder communication, MVP slicing, and post-launch roadmap.',
    },
  ],
};

export const AiInterviewSimulator: React.FC = () => {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role') || 'fullstack';

  const [selectedRole, setSelectedRole] = useState(roleParam);
  const [currentQIndex, setCurrentQIndex] = useState(0);

  // Audio & Speech recognition state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedStream, setRecordedStream] = useState<MediaStream | null>(null);
  const [speechText, setSpeechText] = useState('');
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Evaluation state
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [allEvaluations, setAllEvaluations] = useState<Record<number, EvaluationData>>({});

  const timerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);

  const questions = DEFAULT_QUESTIONS[selectedRole] || DEFAULT_QUESTIONS.fullstack;
  const activeQuestion = questions[currentQIndex] || questions[0];

  // Speech Recognition setup (Web Speech API)
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' ';
        }
        setSpeechText(transcript.trim());
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition warning:', err);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Timer while recording
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Start Mic & Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setRecordedStream(stream);
      setIsRecording(true);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          // already started
        }
      }
    } catch (err) {
      console.warn('Microphone access not granted, continuing with text-only mode:', err);
      setIsRecording(true);
    }
  };

  // Stop Mic & Recording
  const stopRecording = () => {
    setIsRecording(false);
    if (recordedStream) {
      recordedStream.getTracks().forEach((track) => track.stop());
      setRecordedStream(null);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // already stopped
      }
    }
  };

  // Text-to-speech for AI question
  const speakQuestion = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech not supported on this browser.');
      return;
    }

    if (isSpeakingQuestion) {
      window.speechSynthesis.cancel();
      setIsSpeakingQuestion(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(activeQuestion.question);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeakingQuestion(false);
    utterance.onerror = () => setIsSpeakingQuestion(false);

    setIsSpeakingQuestion(true);
    window.speechSynthesis.speak(utterance);
  };

  // Submit Answer for AI Evaluation
  const submitAnswer = async () => {
    if (!speechText.trim()) {
      alert('Please provide your answer by speaking into the microphone or typing in the text area.');
      return;
    }

    if (isRecording) {
      stopRecording();
    }

    setIsEvaluating(true);
    try {
      const res = await client.post('/interviews/mock-evaluate', {
        question: activeQuestion.question,
        answer: speechText,
        category: activeQuestion.category,
        role: selectedRole,
      });

      const evalData = res.data.data;
      setEvaluation(evalData);
      setAllEvaluations((prev) => ({
        ...prev,
        [activeQuestion.id]: evalData,
      }));
    } catch (err: any) {
      console.error('Failed to evaluate mock answer:', err);
      alert('Evaluation server momentarily busy. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Move to next question
  const nextQuestion = () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
      setSpeechText('');
      setEvaluation(null);
      setIsRecording(false);
      setRecordingSeconds(0);
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      setIsSpeakingQuestion(false);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-[#edf2f7] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#84b81b] ring-4 ring-[#edf7d2]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#567715]">
              HireFlow Intelligent Assessment Suite
            </span>
          </div>
          <h1 className="text-xl font-black text-[#0e1017] mt-1 flex items-center gap-2">
            <span>AI Technical & Behavioral Mock Interview Simulator</span>
            <span className="rounded-full bg-[#edf7d2] px-2.5 py-0.5 text-[10px] font-black text-[#567715]">
              PRO
            </span>
          </h1>
          <p className="text-xs text-[#5e6b7c]">
            Real-time audio speech transcription, live sound waveform analysis, and 4-pillar algorithmic rubric evaluation.
          </p>
        </div>

        {/* Role Track Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-[#5e6b7c] uppercase">Track:</label>
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setCurrentQIndex(0);
              setSpeechText('');
              setEvaluation(null);
            }}
            className="rounded-xl border border-[#edf2f7] bg-[#f8fafc] px-3 py-2 text-xs font-bold text-[#0e1017] focus:border-[#84b81b] focus:outline-none"
          >
            <option value="fullstack">Full Stack & System Design (React / Node)</option>
            <option value="devops">Cloud & DevOps (K8s / AWS)</option>
            <option value="behavioral">Behavioral & Leadership (STAR Method)</option>
          </select>
        </div>
      </div>

      {/* Main Simulation Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: AI Interviewer & Question (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl border border-[#edf2f7] bg-white p-6 shadow-sm space-y-4">
            {/* AI Avatar Card */}
            <div className="flex items-center justify-between pb-4 border-b border-[#edf2f7]">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0e1017] text-white font-black text-sm shadow-md">
                    AI
                  </div>
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white text-[9px] text-white">
                    ✓
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#0e1017]">Sarah</h3>
                  <p className="text-[11px] text-[#5e6b7c]">Principal AI Technical Interviewer</p>
                </div>
              </div>

              {/* Text to Speech Button */}
              <button
                type="button"
                onClick={speakQuestion}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  isSpeakingQuestion
                    ? 'bg-rose-100 text-rose-700 animate-pulse'
                    : 'bg-[#edf7d2] text-[#567715] hover:bg-[#84b81b] hover:text-white'
                }`}
              >
                {isSpeakingQuestion ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                <span>{isSpeakingQuestion ? 'Mute Question' : 'Listen Aloud'}</span>
              </button>
            </div>

            {/* Question Progress Pill */}
            <div className="flex items-center justify-between text-xs">
              <span className="rounded-full bg-[#f8fafc] border border-[#edf2f7] px-2.5 py-1 text-[10px] font-bold text-[#5e6b7c]">
                Question {currentQIndex + 1} of {questions.length}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-extrabold uppercase text-slate-700">
                {activeQuestion.category}
              </span>
            </div>

            {/* The Question Prompt */}
            <div className="rounded-2xl bg-[#fcfdfd] border border-slate-200 p-4">
              <p className="text-sm font-bold text-[#0e1017] leading-relaxed">
                &quot;{activeQuestion.question}&quot;
              </p>
            </div>

            {/* Preparation Tip */}
            <div className="flex items-start gap-2.5 rounded-2xl bg-[#edf7d2]/30 border border-[#edf7d2] p-3 text-[11px] text-[#567715]">
              <HelpCircle className="h-4 w-4 shrink-0 mt-0.5 text-[#84b81b]" />
              <div>
                <span className="font-black uppercase text-[10px] block mb-0.5">Evaluation Hint</span>
                <span>{activeQuestion.hint}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Audio Waveform & Speech Transcription (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-3xl border border-[#edf2f7] bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#edf2f7]">
              <div>
                <h3 className="text-sm font-black text-[#0e1017]">Your Spoken Response</h3>
                <p className="text-xs text-[#5e6b7c]">
                  Speak naturally into your microphone or type your response below.
                </p>
              </div>

              {/* Timer */}
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#0e1017] bg-[#f8fafc] px-3 py-1.5 rounded-xl border border-[#edf2f7]">
                <span className={`h-2 w-2 rounded-full ${isRecording ? 'bg-rose-500 animate-ping' : 'bg-slate-400'}`} />
                <span>{formatSeconds(recordingSeconds)}</span>
              </div>
            </div>

            {/* Real-Time Sound Waveform Component */}
            <AudioWaveformVisualizer isRecording={isRecording} audioStream={recordedStream} />

            {/* Live Speech Transcription Box */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold uppercase text-[#5e6b7c]">
                  Live Transcription & Text Editor
                </label>
                <span className="text-[10px] text-[#8b98a9]">
                  {speechText.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <textarea
                rows={4}
                value={speechText}
                onChange={(e) => setSpeechText(e.target.value)}
                placeholder="Click 'Start Speaking' and begin speaking, or type your answer here directly..."
                className="w-full rounded-2xl border border-[#edf2f7] bg-[#fbfcfd] p-3.5 text-xs text-[#0e1017] leading-relaxed focus:border-[#84b81b] focus:outline-none"
              />
            </div>

            {/* Controls Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {!isRecording ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="flex items-center gap-2 rounded-full bg-[#0e1017] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-all"
                >
                  <Mic className="h-4 w-4 text-[#84b81b]" />
                  <span>Start Speaking (Record)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex items-center gap-2 rounded-full bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 transition-all animate-pulse"
                >
                  <MicOff className="h-4 w-4" />
                  <span>Stop Recording</span>
                </button>
              )}

              <button
                type="button"
                disabled={isEvaluating || !speechText.trim()}
                onClick={submitAnswer}
                className="flex items-center gap-2 rounded-full bg-[#84b81b] px-6 py-2.5 text-xs font-black text-white shadow-sm hover:bg-[#729e18] transition-colors disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isEvaluating ? 'Evaluating with AI...' : 'Submit for AI Rubric Score'}</span>
              </button>

              {evaluation && currentQIndex < questions.length - 1 && (
                <button
                  type="button"
                  onClick={nextQuestion}
                  className="ml-auto flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-[#0e1017] hover:bg-slate-100 transition-colors shadow-xs"
                >
                  <span>Next Question</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#84b81b]" />
                </button>
              )}
            </div>
          </div>

          {/* AI Scorecard Rubric Display */}
          {evaluation && (
            <div className="mt-4">
              <AiScorecardRubric
                data={evaluation}
                questionText={activeQuestion.question}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
