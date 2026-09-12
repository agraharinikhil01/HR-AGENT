import { PDFParse } from 'pdf-parse';

const KNOWN_SKILLS = [
  'React', 'React.js', 'React Native', 'Node.js', 'Node', 'TypeScript', 'JavaScript', 'Python',
  'Java', 'C++', 'C#', '.NET', 'Go', 'Golang', 'Rust', 'Ruby', 'Ruby on Rails', 'PHP', 'Laravel',
  'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'DynamoDB', 'Cassandra',
  'Docker', 'Kubernetes', 'AWS', 'Amazon Web Services', 'Azure', 'GCP', 'Google Cloud',
  'Git', 'GitHub', 'GitLab', 'CI/CD', 'Jenkins', 'Terraform', 'Ansible', 'Linux',
  'GraphQL', 'REST API', 'RESTful APIs', 'Microservices', 'System Design', 'Serverless',
  'Next.js', 'Nuxt.js', 'Vue', 'Vue.js', 'Angular', 'Svelte', 'Tailwind CSS', 'Tailwind',
  'Bootstrap', 'HTML5', 'CSS3', 'Sass', 'Webpack', 'Vite',
  'Redux', 'Zustand', 'MobX', 'RxJS', 'Express', 'Express.js', 'NestJS', 'FastAPI', 'Django', 'Flask',
  'Spring Boot', 'Hibernate', 'Kafka', 'RabbitMQ', 'Socket.io', 'WebSockets',
  'Figma', 'Adobe XD', 'UI/UX', 'Product Design', 'Wireframing', 'Prototyping',
  'Machine Learning', 'Deep Learning', 'Data Science', 'PyTorch', 'TensorFlow', 'NLP', 'Computer Vision',
  'Pandas', 'NumPy', 'Scikit-learn', 'Tableau', 'Power BI', 'ETL', 'Apache Spark',
  'Agile', 'Scrum', 'Kanban', 'Jira', 'Confluence', 'Trello', 'Project Management',
  'Quality Assurance', 'Unit Testing', 'Jest', 'Mocha', 'Cypress', 'Playwright', 'Selenium',
  'Cybersecurity', 'OAuth', 'JWT', 'Penetration Testing', 'SOC2', 'GDPR', 'Compliance'
];

export interface AtsEvaluation {
  overallScore: number;
  grade: string;
  gradeLabel: string;
  categoryScores: {
    skillsScore: number;
    experienceScore: number;
    contactScore: number;
    formattingScore: number;
  };
  strengths: string[];
  improvements: string[];
}

export interface ParsedResumeResult {
  text: string;
  extractedName?: string;
  extractedSkills: string[];
  estimatedExperienceYears: number;
  extractedEmail?: string;
  extractedPhone?: string;
  atsEvaluation: AtsEvaluation;
}

export function evaluateResumeAts(params: {
  text: string;
  skills: string[];
  experienceYears: number;
  email?: string;
  phone?: string;
}): AtsEvaluation {
  const { text, skills, experienceYears, email, phone } = params;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const lower = text.toLowerCase();

  // 1. Technical Skills & Keyword Density (40% weight)
  let skillsScore = 60;
  if (skills.length >= 20) skillsScore = 96;
  else if (skills.length >= 14) skillsScore = 90;
  else if (skills.length >= 9) skillsScore = 84;
  else if (skills.length >= 5) skillsScore = 76;
  else if (skills.length >= 2) skillsScore = 68;
  else skillsScore = 55;

  // 2. Experience & Impact (25% weight)
  let experienceScore = 70;
  if (experienceYears >= 6) experienceScore = 95;
  else if (experienceYears >= 4) experienceScore = 90;
  else if (experienceYears >= 2) experienceScore = 84;
  else if (experienceYears >= 1) experienceScore = 78;
  else experienceScore = 70;

  // Bonus for quantifiable metrics (e.g. 20%, $100k, 5x, 50+)
  const hasMetrics = /\b\d+%\b|\b\d+\s*(?:k|m|users|requests|ms|times|team)\b|\b\$\d+/i.test(text);
  if (hasMetrics) experienceScore = Math.min(100, experienceScore + 5);

  // 3. Contact & Recruiter Reachability (15% weight)
  let contactScore = 50;
  const hasEmail = Boolean(email);
  const hasPhone = Boolean(phone);
  const hasLinkedIn = /linkedin\.com|github\.com/i.test(lower);
  if (hasEmail && hasPhone && hasLinkedIn) contactScore = 100;
  else if (hasEmail && hasPhone) contactScore = 92;
  else if (hasEmail || hasPhone) contactScore = 75;

  // 4. Structure, Section Headers & Parsing Quality (20% weight)
  let formattingScore = 70;
  const sections = ['experience', 'education', 'skills', 'projects', 'summary'];
  const matchedSections = sections.filter((s) => lower.includes(s));
  if (matchedSections.length >= 4) formattingScore += 18;
  else if (matchedSections.length >= 2) formattingScore += 12;

  if (wordCount >= 250 && wordCount <= 1200) formattingScore += 10;
  else if (wordCount > 100) formattingScore += 5;
  formattingScore = Math.min(100, formattingScore);

  // Weighted Overall ATS Score (0 - 100)
  const overallScore = Math.round(
    skillsScore * 0.40 +
    experienceScore * 0.25 +
    contactScore * 0.15 +
    formattingScore * 0.20
  );

  let grade = 'A';
  let gradeLabel = 'High ATS Compatibility';
  if (overallScore >= 90) {
    grade = 'A+';
    gradeLabel = 'Exceptional — Top 5% ATS Compatibility';
  } else if (overallScore >= 80) {
    grade = 'A';
    gradeLabel = 'Strong ATS Compatibility — Recruiter Recommended';
  } else if (overallScore >= 70) {
    grade = 'B+';
    gradeLabel = 'Good — Meets Standard Screening Criteria';
  } else if (overallScore >= 60) {
    grade = 'B';
    gradeLabel = 'Moderate — Keyword Optimization Recommended';
  } else {
    grade = 'C';
    gradeLabel = 'Needs Revision for Modern ATS Systems';
  }

  const strengths: string[] = [];
  if (skills.length >= 10) {
    strengths.push(`Rich technical keyword density: ${skills.length} industry-recognized skills detected`);
  } else if (skills.length > 0) {
    strengths.push(`${skills.length} core technical skills successfully extracted`);
  }
  if (hasEmail && hasPhone) {
    strengths.push('Verified candidate contact channels (Email & Phone detected)');
  }
  if (experienceYears > 0) {
    strengths.push(`${experienceYears}+ years proven industry work experience detected`);
  }
  if (matchedSections.length >= 3) {
    strengths.push('Clean standard resume structure with clear section demarcations');
  }

  const improvements: string[] = [];
  if (!hasMetrics) {
    improvements.push('Add quantifiable business metrics (e.g. "improved latency by 35%", "scaled to 10k users")');
  }
  if (skills.length < 15) {
    improvements.push('Incorporate additional target role technologies and cloud/DevOps tools');
  }
  if (!hasLinkedIn) {
    improvements.push('Include a direct link to your active GitHub portfolio or LinkedIn profile');
  }
  if (matchedSections.length < 4) {
    improvements.push('Ensure dedicated headers for Experience, Skills, Education, and Projects');
  }

  return {
    overallScore,
    grade,
    gradeLabel,
    categoryScores: {
      skillsScore,
      experienceScore,
      contactScore,
      formattingScore,
    },
    strengths,
    improvements,
  };
}

export function extractCandidateName(text: string, originalFilename?: string): string {
  // 1. Try extracting clean candidate name from original filename
  if (originalFilename) {
    const cleanFn = originalFilename
      .replace(/\.pdf$/i, '')
      .replace(/[_\-\+]/g, ' ')
      .replace(/\s*\(\d+\)\s*/g, '')
      .replace(/\b(?:resume|cv|biodata|profile|fresher|updated|latest|new)\b/gi, '')
      .replace(/[^a-zA-Z\s]/g, '')
      .trim();

    const parts = cleanFn.split(/\s+/).filter(Boolean);
    if (parts.length >= 2 && parts.length <= 4 && parts.every((p) => p.length >= 2)) {
      return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
    }
  }

  // 2. Try extracting from the first clean lines of the resume text
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 5)) {
    // Avoid lines with contact indicators or job titles
    if (/@|http|\.com|\+?\d{5,}|curriculum|resume|skills|experience/i.test(line)) continue;
    const cleanLine = line.replace(/[^a-zA-Z\s]/g, '').trim();
    const words = cleanLine.split(/\s+/).filter(Boolean);
    if (words.length >= 2 && words.length <= 4 && words.every((w) => w.length >= 2)) {
      return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
  }

  return 'Candidate';
}

export async function parsePdfResume(pdfBuffer: Buffer, originalFilename?: string): Promise<ParsedResumeResult> {
  let text = '';
  try {
    const uint8 = new Uint8Array(pdfBuffer);
    const parser = new (PDFParse as any)(uint8);
    const data = await parser.getText();
    text = (data?.text || '').replace(/\s+/g, ' ').trim();
  } catch (parseErr) {
    // Graceful fallback to raw ASCII extraction
    text = pdfBuffer.toString('latin1').replace(/[^\x20-\x7E\n]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  try {
    const lowerText = text.toLowerCase();
    const extractedSkillsSet = new Set<string>();

    for (const skill of KNOWN_SKILLS) {
      const lowerSkill = skill.toLowerCase();
      const escaped = lowerSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:^|[^a-zA-Z0-9#+])${escaped}(?:$|[^a-zA-Z0-9#+])`, 'i');
      if (regex.test(lowerText)) {
        extractedSkillsSet.add(skill);
      }
    }

    let estimatedExperienceYears = 0;
    const expRegexes = [
      /(\d+)\+?\s*(?:years?|yrs?)(?:\s+of)?\s+experience/i,
      /experience\s*:\s*(\d+)\+?\s*(?:years?|yrs?)/i,
      /total\s+experience\s*:\s*(\d+)\+?\s*(?:years?|yrs?)/i,
    ];

    for (const rx of expRegexes) {
      const match = text.match(rx);
      if (match && match[1]) {
        const val = parseInt(match[1], 10);
        if (val > 0 && val < 40) {
          estimatedExperienceYears = Math.max(estimatedExperienceYears, val);
        }
      }
    }

    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const extractedEmail = emailMatch ? emailMatch[0].toLowerCase() : undefined;

    const phoneMatch = text.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?91[-.\s]?[6-9]\d{9}/);
    const extractedPhone = phoneMatch ? phoneMatch[0].trim() : undefined;

    const extractedSkills = Array.from(extractedSkillsSet);
    const extractedName = extractCandidateName(text, originalFilename);

    const atsEvaluation = evaluateResumeAts({
      text,
      skills: extractedSkills,
      experienceYears: estimatedExperienceYears,
      email: extractedEmail,
      phone: extractedPhone,
    });

    return {
      text,
      extractedName,
      extractedSkills,
      estimatedExperienceYears,
      extractedEmail,
      extractedPhone,
      atsEvaluation,
    };
  } catch (error: any) {
    console.error('Failed to parse PDF resume:', error);
    return {
      text: '',
      extractedName: extractCandidateName('', originalFilename),
      extractedSkills: [],
      estimatedExperienceYears: 0,
      atsEvaluation: {
        overallScore: 60,
        grade: 'B',
        gradeLabel: 'Standard Resume',
        categoryScores: {
          skillsScore: 60,
          experienceScore: 60,
          contactScore: 60,
          formattingScore: 60,
        },
        strengths: ['Resume file attached'],
        improvements: ['Ensure PDF contains searchable text stream'],
      },
    };
  }
}