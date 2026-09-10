export interface RequirementCriterion {
  name: string;
  type: 'mandatory' | 'preferred' | 'optional' | 'disqualifying';
  category: 'skill' | 'experience' | 'education' | 'notice_period' | 'location' | 'other';
  expectedValue?: string | number;
}

export interface CandidateEvaluationInput {
  skills: string[];
  totalExperienceYears: number;
  noticePeriodDays: number;
  education: string[];
  currentRole?: string;
  industry?: string;
  projects?: string[];
  job: {
    title: string;
    department?: string;
    minExperienceYears: number;
    maxExperienceYears?: number;
    preferredNoticePeriodDays?: number;
    mandatorySkills: string[];
    preferredSkills: string[];
    educationRequirements?: string[];
  };
}

export interface FitScoreResult {
  overallScore: number; // 0 - 100
  eligibilityStatus: 'PASSED' | 'FAILED' | 'REVIEW_REQUIRED';
  categoryScores: {
    mandatorySkills: number; // Max 30
    relevantExperience: number; // Max 25
    roleIndustryMatch: number; // Max 15
    preferredSkills: number; // Max 10
    educationCertifications: number; // Max 10
    projectRelevance: number; // Max 5
    availabilityNoticePeriod: number; // Max 5
  };
  breakdown: {
    matchedMandatorySkills: string[];
    missingMandatorySkills: string[];
    matchedPreferredSkills: string[];
    missingPreferredSkills: string[];
  };
  strengths: string[];
  concerns: string[];
  missingInformation: string[];
}

export function calculateCandidateFitScore(input: CandidateEvaluationInput): FitScoreResult {
  const candidateSkillsNorm = input.skills.map((s) => s.trim().toLowerCase());
  const jobMandatoryNorm = input.job.mandatorySkills.map((s) => s.trim().toLowerCase());
  const jobPreferredNorm = input.job.preferredSkills.map((s) => s.trim().toLowerCase());

  // 1. Mandatory Skills (Max 30 pts)
  const matchedMandatory: string[] = [];
  const missingMandatory: string[] = [];
  for (const skill of input.job.mandatorySkills) {
    const norm = skill.trim().toLowerCase();
    if (candidateSkillsNorm.some((cs) => cs.includes(norm) || norm.includes(cs))) {
      matchedMandatory.push(skill);
    } else {
      missingMandatory.push(skill);
    }
  }

  const mandatoryRatio =
    jobMandatoryNorm.length > 0 ? matchedMandatory.length / jobMandatoryNorm.length : 1;
  const mandatorySkillsScore = Math.round(mandatoryRatio * 30);

  // 2. Relevant Experience (Max 25 pts)
  let experienceScore = 0;
  const minExp = input.job.minExperienceYears || 0;
  const candExp = input.totalExperienceYears || 0;
  if (candExp >= minExp) {
    experienceScore = 25;
  } else if (candExp > 0 && minExp > 0) {
    experienceScore = Math.round((candExp / minExp) * 20);
  } else {
    experienceScore = 10;
  }

  // 3. Role & Industry Match (Max 15 pts)
  let roleIndustryScore = 10; // baseline
  if (input.currentRole && input.job.title) {
    const jobTokens = input.job.title.toLowerCase().split(/\s+/);
    const candTokens = input.currentRole.toLowerCase().split(/\s+/);
    const hasOverlap = jobTokens.some((t) => t.length > 2 && candTokens.includes(t));
    if (hasOverlap) roleIndustryScore = 15;
  }

  // 4. Preferred Skills (Max 10 pts)
  const matchedPreferred: string[] = [];
  const missingPreferred: string[] = [];
  for (const skill of input.job.preferredSkills) {
    const norm = skill.trim().toLowerCase();
    if (candidateSkillsNorm.some((cs) => cs.includes(norm) || norm.includes(cs))) {
      matchedPreferred.push(skill);
    } else {
      missingPreferred.push(skill);
    }
  }

  const preferredRatio =
    jobPreferredNorm.length > 0 ? matchedPreferred.length / jobPreferredNorm.length : 1;
  const preferredSkillsScore = Math.round(preferredRatio * 10);

  // 5. Education & Certifications (Max 10 pts)
  let educationScore = 8;
  if (input.education && input.education.length > 0) {
    educationScore = 10;
  }

  // 6. Project Relevance (Max 5 pts)
  let projectScore = 3;
  if (input.projects && input.projects.length > 0) {
    projectScore = 5;
  }

  // 7. Availability & Notice Period (Max 5 pts)
  let noticeScore = 3;
  const prefNotice = input.job.preferredNoticePeriodDays ?? 30;
  if (input.noticePeriodDays <= prefNotice) {
    noticeScore = 5;
  } else if (input.noticePeriodDays <= prefNotice + 30) {
    noticeScore = 3;
  } else {
    noticeScore = 1;
  }

  // Overall Score (0-100)
  const overallScore = Math.min(
    100,
    mandatorySkillsScore +
      experienceScore +
      roleIndustryScore +
      preferredSkillsScore +
      educationScore +
      projectScore +
      noticeScore
  );

  // Eligibility Status: Mandatory checks
  let eligibilityStatus: 'PASSED' | 'FAILED' | 'REVIEW_REQUIRED' = 'PASSED';
  if (missingMandatory.length > 0 || (minExp > 0 && candExp < minExp * 0.7)) {
    eligibilityStatus = missingMandatory.length > 1 ? 'FAILED' : 'REVIEW_REQUIRED';
  }

  // Generate Explainable Insights
  const strengths: string[] = [];
  const concerns: string[] = [];
  const missingInformation: string[] = [];

  if (matchedMandatory.length > 0) {
    strengths.push(`Matches mandatory skill requirements: ${matchedMandatory.join(', ')}`);
  }
  if (candExp >= minExp) {
    strengths.push(`Has ${candExp} years of relevant experience (exceeds required ${minExp} years)`);
  }
  if (input.noticePeriodDays <= 30) {
    strengths.push(`Quick availability with notice period of ${input.noticePeriodDays} days`);
  }
  if (matchedPreferred.length > 0) {
    strengths.push(`Possesses preferred skills: ${matchedPreferred.join(', ')}`);
  }

  if (missingMandatory.length > 0) {
    concerns.push(`Missing mandatory skill(s): ${missingMandatory.join(', ')}`);
  }
  if (candExp < minExp) {
    concerns.push(`Experience (${candExp} yrs) is lower than requested minimum (${minExp} yrs)`);
  }
  if (input.noticePeriodDays > 60) {
    concerns.push(`Long notice period of ${input.noticePeriodDays} days`);
  }

  if (!input.education || input.education.length === 0) {
    missingInformation.push('Education details not specified');
  }
  if (input.skills.length === 0) {
    missingInformation.push('Candidate skills list is empty');
  }

  return {
    overallScore,
    eligibilityStatus,
    categoryScores: {
      mandatorySkills: mandatorySkillsScore,
      relevantExperience: experienceScore,
      roleIndustryMatch: roleIndustryScore,
      preferredSkills: preferredSkillsScore,
      educationCertifications: educationScore,
      projectRelevance: projectScore,
      availabilityNoticePeriod: noticeScore,
    },
    breakdown: {
      matchedMandatorySkills: matchedMandatory,
      missingMandatorySkills: missingMandatory,
      matchedPreferredSkills: matchedPreferred,
      missingPreferredSkills: missingPreferred,
    },
    strengths,
    concerns,
    missingInformation,
  };
}
