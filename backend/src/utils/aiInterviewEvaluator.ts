export interface MockEvaluationInput {
  question: string;
  answer: string;
  role?: string;
  category?: 'TECHNICAL' | 'BEHAVIORAL' | 'SYSTEM_DESIGN';
}

export interface MockEvaluationResult {
  overallScore: number; // 0 - 100
  technicalScore: number; // 0 - 100
  clarityScore: number; // 0 - 100
  problemSolvingScore: number; // 0 - 100
  confidenceScore: number; // 0 - 100
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

export function evaluateMockInterviewAnswer(input: MockEvaluationInput): MockEvaluationResult {
  const { question, answer, category = 'TECHNICAL' } = input;
  const cleanAnswer = (answer || '').trim();
  const lowerAnswer = cleanAnswer.toLowerCase();
  const wordCount = cleanAnswer.split(/\s+/).filter(Boolean).length;

  if (wordCount < 5) {
    return {
      overallScore: 25,
      technicalScore: 20,
      clarityScore: 30,
      problemSolvingScore: 20,
      confidenceScore: 30,
      recommendation: 'Needs Improvement',
      grade: 'D',
      strengths: ['Initial verbal engagement'],
      improvements: [
        'Response is too brief. Provide a structured explanation with concrete technical examples.',
        'Elaborate on real-world constraints, trade-offs, and metrics.',
      ],
      rubricBreakdown: {
        starStructure: false,
        technicalDepth: 'Insufficient Detail',
        fillerWordsRatio: 'Low',
        paceAndFlow: 'Too Short',
      },
      idealAnswerKey: [
        'Define the core concept clearly in 1-2 opening sentences.',
        'Walk through your practical step-by-step implementation approach.',
        'Address edge cases, failure recovery, and architectural trade-offs.',
      ],
    };
  }

  // Common technical terminology dictionaries
  const TECHNICAL_KEYWORDS = [
    'redis', 'cache', 'caching', 'ttl', 'latency', 'cluster', 'database', 'sql', 'nosql',
    'mongodb', 'postgres', 'index', 'microservice', 'api', 'rest', 'graphql', 'docker',
    'kubernetes', 'aws', 'scalable', 'concurrency', 'async', 'promise', 'memory', 'cpu',
    'security', 'jwt', 'auth', 'event', 'kafka', 'queue', 'circuit breaker', 'throughput',
    'load balancer', 'state', 'redux', 'hook', 'component', 'props', 'dom', 'rendering',
    'algorithm', 'complexity', 'o(1)', 'o(n)', 'sharding', 'replication', 'consistency',
    'typescript', 'react', 'node', 'express', 'css', 'html', 'next.js', 'virtual dom',
    'hydration', 'bundle', 'webpack', 'vite', 'apollo', 'grpc', 'websocket', 'ci/cd',
    'pipeline', 'github actions', 'jenkins', 'helm', 'ingress', 'istio', 'serverless',
    'lambda', 's3', 'dynamo', 'iam', 'sqs', 'sns', 'distributed', 'horizontal scaling',
    'reverse proxy', 'nginx', 'cdn', 'cloudflare', 'failover', 'idempotency', 'acid',
    'cap theorem', 'deadlock', 'mutex', 'worker threads', 'profiling', 'benchmark',
  ];

  const STAR_KEYWORDS = [
    'situation', 'task', 'action', 'result', 'when', 'challenge', 'team', 'resolved',
    'delivered', 'impact', 'metric', 'reduced', 'improved', 'increased', 'led', 'designed',
    'implemented', 'collaborated', 'feedback', 'learned',
  ];

  // Matched concepts
  const matchedTech = TECHNICAL_KEYWORDS.filter((kw) => lowerAnswer.includes(kw));
  const matchedStar = STAR_KEYWORDS.filter((kw) => lowerAnswer.includes(kw));

  // Detect filler words
  const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'sort of', 'kind of'];
  let fillerCount = 0;
  FILLER_WORDS.forEach((fw) => {
    const matches = lowerAnswer.match(new RegExp(`\\b${fw}\\b`, 'g'));
    if (matches) fillerCount += matches.length;
  });
  const fillerRatio = wordCount > 0 ? (fillerCount / wordCount) * 100 : 0;

  // 1. Technical Accuracy & Depth Score (0 - 100)
  let technicalScore = 65;
  if (category === 'TECHNICAL' || category === 'SYSTEM_DESIGN') {
    technicalScore = Math.min(98, 50 + Math.min(35, matchedTech.length * 7) + (wordCount >= 40 ? 12 : 5));
  } else {
    technicalScore = Math.min(95, 60 + Math.min(25, matchedTech.length * 6) + (wordCount >= 35 ? 10 : 5));
  }

  // 2. Communication Clarity & Structure Score (0 - 100)
  let clarityScore = 70;
  if (category === 'BEHAVIORAL') {
    clarityScore = Math.min(96, 50 + Math.min(36, matchedStar.length * 6) + (wordCount >= 50 ? 10 : 5));
  } else {
    clarityScore = Math.min(95, 60 + (wordCount >= 30 ? 20 : 10) - (fillerRatio > 5 ? 10 : 0));
  }

  // 3. Problem Solving & Depth Score (0 - 100)
  const hasTradeoffs = /trade-off|tradeoff|however|alternative|instead|because|versus|pros and cons/i.test(lowerAnswer);
  let problemSolvingScore = Math.min(98, 60 + (hasTradeoffs ? 20 : 5) + Math.min(15, matchedTech.length * 3));

  // 4. Confidence & Fluency Score (0 - 100)
  let confidenceScore = Math.min(96, Math.max(50, 85 - Math.round(fillerRatio * 3) + (wordCount >= 40 ? 10 : 0)));

  // Overall Weighted Score
  const overallScore = Math.round(
    technicalScore * 0.40 +
    clarityScore * 0.25 +
    problemSolvingScore * 0.20 +
    confidenceScore * 0.15
  );

  // Recommendation & Grade
  let recommendation: 'Strong Hire' | 'Hire' | 'Leaning Hire' | 'Needs Improvement';
  let grade = 'B';
  if (overallScore >= 90) {
    recommendation = 'Strong Hire';
    grade = 'A+';
  } else if (overallScore >= 80) {
    recommendation = 'Hire';
    grade = 'A';
  } else if (overallScore >= 70) {
    recommendation = 'Leaning Hire';
    grade = 'B+';
  } else {
    recommendation = 'Needs Improvement';
    grade = 'C';
  }

  // Strengths
  const strengths: string[] = [];
  if (matchedTech.length >= 3) {
    strengths.push(`Strong command of domain vocabulary: ${matchedTech.slice(0, 4).join(', ')}.`);
  }
  if (wordCount >= 50) {
    strengths.push('Thorough and articulate verbal explanation with healthy depth.');
  }
  if (hasTradeoffs) {
    strengths.push('Demonstrated mature engineering judgement by addressing trade-offs and alternatives.');
  }
  if (fillerRatio < 3) {
    strengths.push('Crisp, professional verbal delivery with minimal filler phrasing.');
  }
  if (strengths.length === 0) {
    strengths.push('Addressed the question promptly and maintained clear topic relevance.');
  }

  // Improvements
  const improvements: string[] = [];
  if (!hasTradeoffs) {
    improvements.push('Highlight architectural trade-offs: explain why you chose this design over other alternatives.');
  }
  if (wordCount < 40) {
    improvements.push('Expand your answer with a concrete past production scenario or real-world benchmark.');
  }
  if (fillerRatio >= 3) {
    improvements.push('Reduce filler pauses ("um", "like", "basically") to sound more authoritative.');
  }
  if (category === 'BEHAVIORAL' && matchedStar.length < 3) {
    improvements.push('Frame answers strictly using the STAR methodology (Situation ➔ Task ➔ Action ➔ Quantifiable Result).');
  }
  if (improvements.length === 0) {
    improvements.push('Maintain this high standard; consider citing specific system metrics (e.g., p99 latency, 99.99% SLA).');
  }

  return {
    overallScore,
    technicalScore,
    clarityScore,
    problemSolvingScore,
    confidenceScore,
    recommendation,
    grade,
    strengths,
    improvements,
    rubricBreakdown: {
      starStructure: matchedStar.length >= 2,
      technicalDepth: matchedTech.length >= 4 ? 'Advanced' : matchedTech.length >= 2 ? 'Intermediate' : 'Foundational',
      fillerWordsRatio: `${fillerRatio.toFixed(1)}% (${fillerCount} detected)`,
      paceAndFlow: wordCount >= 60 ? 'Optimal (Fluent)' : wordCount >= 30 ? 'Good' : 'Needs Expansion',
    },
    idealAnswerKey: [
      '1. State the direct solution and core architectural premise in 1 sentence.',
      '2. Highlight the technical mechanics (components, data flow, protocols).',
      '3. Discuss failure modes, scaling bottlenecks, and security considerations.',
      '4. Conclude with verifiable impact or production metrics.',
    ],
  };
}
