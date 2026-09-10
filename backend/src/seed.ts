import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { connectDB, disconnectDB } from './config/db.js';
import { Organization } from './modules/organizations/organization.model.js';
import { User } from './modules/users/user.model.js';
import { Job } from './modules/jobs/job.model.js';
import { Candidate } from './modules/candidates/candidate.model.js';
import { Application } from './modules/candidates/application.model.js';
import { Interview } from './modules/interviews/interview.model.js';
import { Offer } from './modules/offers/offer.model.js';
import { calculateCandidateFitScore } from './utils/fitScoreCalculator.js';
import { calculateIndianCtc } from './utils/salaryCalculator.js';

async function seed() {
  console.log('🌱 Connecting to database for seeding...');
  await connectDB();

  // Clean existing collections
  await Promise.all([
    Organization.deleteMany({}),
    User.deleteMany({}),
    Job.deleteMany({}),
    Candidate.deleteMany({}),
    Application.deleteMany({}),
    Interview.deleteMany({}),
    Offer.deleteMany({}),
  ]);

  console.log('🧹 Existing data wiped. Creating organization...');

  // 1. Create Organization
  const org = await Organization.create({
    name: 'TechScale Innovations India',
    slug: 'techscale-innovations',
    industry: 'Software & SaaS',
    size: '50-100',
    website: 'https://techscale.example.com',
    country: 'India',
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    departments: [
      { name: 'Engineering' },
      { name: 'Product' },
      { name: 'Human Resources' },
      { name: 'Finance' },
    ],
  });

  // 2. Create Users
  const passwordHash = await bcrypt.hash('P@ssword123!', 10);

  const admin = await User.create({
    orgId: org._id,
    name: 'Pooja Hegde',
    email: 'admin@techscale.io',
    passwordHash,
    role: 'ORG_ADMIN',
    department: 'Human Resources',
    status: 'ACTIVE',
  });

  const recruiter = await User.create({
    orgId: org._id,
    name: 'Arjun Menon',
    email: 'recruiter@techscale.io',
    passwordHash,
    role: 'RECRUITER',
    department: 'Human Resources',
    status: 'ACTIVE',
  });

  const hiringManager = await User.create({
    orgId: org._id,
    name: 'Anand Kulkarni',
    email: 'manager@techscale.io',
    passwordHash,
    role: 'HIRING_MANAGER',
    department: 'Engineering',
    status: 'ACTIVE',
  });

  const finance = await User.create({
    orgId: org._id,
    name: 'Sunita Rao',
    email: 'finance@techscale.io',
    passwordHash,
    role: 'FINANCE_APPROVER',
    department: 'Finance',
    status: 'ACTIVE',
  });

  console.log('👤 Users created.');

  // 3. Create Job
  const job = await Job.create({
    orgId: org._id,
    title: 'Senior Full-Stack Engineer',
    slug: 'senior-full-stack-engineer-tech',
    department: 'Engineering',
    hiringManagerId: hiringManager._id,
    recruiterId: recruiter._id,
    employmentType: 'Full-time',
    workplaceType: 'Hybrid',
    location: 'Bengaluru, India',
    vacancies: 2,
    minExperienceYears: 4,
    maxExperienceYears: 8,
    minSalary: 2000000,
    maxSalary: 3500000,
    currency: 'INR',
    description: 'We are seeking a Senior Full-Stack Engineer to architect and scale our core SaaS platform.',
    responsibilities: [
      'Design clean, resilient REST APIs and Socket services in Node.js and TypeScript.',
      'Build responsive, high-performance UI components in React.',
      'Collaborate with Product and Engineering managers in sprint planning.',
    ],
    mandatorySkills: ['React', 'Node.js', 'TypeScript'],
    preferredSkills: ['MongoDB', 'Docker', 'AWS', 'Next.js'],
    noticePeriodPreferenceDays: 30,
    status: 'Open',
  });

  console.log('💼 Job opening created.');

  // 4. Create Candidates & Applications
  const candidatesData = [
    {
      fullName: 'Rahul Sharma',
      email: 'rahul.sharma@example.com',
      phone: '+91 9876543210',
      currentCity: 'Bengaluru',
      currentCompany: 'FinTech Labs',
      currentDesignation: 'Senior Software Engineer',
      totalExperienceYears: 5.5,
      expectedSalary: 2800000,
      noticePeriodDays: 30,
      skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'Docker'],
      stage: 'Shortlisted' as const,
    },
    {
      fullName: 'Neha Patel',
      email: 'neha.patel@example.com',
      phone: '+91 9123456789',
      currentCity: 'Pune',
      currentCompany: 'CloudNine Systems',
      currentDesignation: 'Full Stack Developer',
      totalExperienceYears: 4,
      expectedSalary: 2400000,
      noticePeriodDays: 15,
      skills: ['React', 'TypeScript', 'Node.js', 'AWS'],
      stage: 'Interview' as const,
    },
    {
      fullName: 'Vikram Singh',
      email: 'vikram.singh@example.com',
      phone: '+91 9988776655',
      currentCity: 'Hyderabad',
      currentCompany: 'WebCrafters',
      currentDesignation: 'Frontend Lead',
      totalExperienceYears: 6,
      expectedSalary: 3000000,
      noticePeriodDays: 60,
      skills: ['React', 'TypeScript', 'CSS', 'Redux'],
      stage: 'Offer Approval' as const,
    },
  ];

  for (const c of candidatesData) {
    const candidate = await Candidate.create({
      orgId: org._id,
      fullName: c.fullName,
      email: c.email,
      phone: c.phone,
      currentCity: c.currentCity,
      currentCompany: c.currentCompany,
      currentDesignation: c.currentDesignation,
      totalExperienceYears: c.totalExperienceYears,
      expectedSalary: c.expectedSalary,
      noticePeriodDays: c.noticePeriodDays,
      skills: c.skills,
      source: 'DIRECT_UPLOAD',
    });

    const fit = calculateCandidateFitScore({
      skills: c.skills,
      totalExperienceYears: c.totalExperienceYears,
      noticePeriodDays: c.noticePeriodDays,
      education: ['B.Tech Computer Science'],
      currentRole: c.currentDesignation,
      job: {
        title: job.title,
        department: job.department,
        minExperienceYears: job.minExperienceYears,
        mandatorySkills: job.mandatorySkills,
        preferredSkills: job.preferredSkills,
        preferredNoticePeriodDays: job.noticePeriodPreferenceDays,
      },
    });

    const application = await Application.create({
      orgId: org._id,
      candidateId: candidate._id,
      jobId: job._id,
      stage: c.stage,
      fitScore: fit.overallScore,
      eligibilityStatus: fit.eligibilityStatus,
      categoryScores: fit.categoryScores,
      strengths: fit.strengths,
      concerns: fit.concerns,
      missingInformation: fit.missingInformation,
    });

    // 5. Add an Interview for Neha
    if (c.stage === 'Interview') {
      await Interview.create({
        orgId: org._id,
        applicationId: application._id,
        candidateId: candidate._id,
        jobId: job._id,
        interviewType: 'Technical Interview',
        interviewerIds: [hiringManager._id],
        scheduledAt: new Date(Date.now() + 2 * 3600 * 1000), // In 2 hours
        durationMinutes: 60,
        meetingLink: 'https://meet.google.com/xyz-abcd-efg',
        status: 'Scheduled',
      });
    }

    // 6. Add an Offer for Vikram
    if (c.stage === 'Offer Approval') {
      const salary = calculateIndianCtc({
        annualCtc: 2800000,
        basicPercentage: 50,
        hraPercentage: 40,
        variableAnnual: 250000,
        includePf: true,
        includeGratuity: true,
      });

      await Offer.create({
        orgId: org._id,
        applicationId: application._id,
        candidateId: candidate._id,
        jobId: job._id,
        version: 1,
        templateType: 'Full-time',
        joiningDate: new Date(Date.now() + 30 * 86400 * 1000),
        validUntil: new Date(Date.now() + 10 * 86400 * 1000),
        reportingManager: 'Anand Kulkarni',
        workLocation: 'Bengaluru, India',
        annualCtc: salary.annualCtc,
        monthlyCtc: salary.monthlyCtc,
        annualGross: salary.annualGross,
        monthlyGross: salary.monthlyGross,
        components: {
          basicAnnual: salary.components.basic.annual,
          basicMonthly: salary.components.basic.monthly,
          hraAnnual: salary.components.hra.annual,
          hraMonthly: salary.components.hra.monthly,
          specialAllowanceAnnual: salary.components.specialAllowance.annual,
          specialAllowanceMonthly: salary.components.specialAllowance.monthly,
          variableAnnual: salary.components.variablePay.annual,
          variableMonthly: salary.components.variablePay.monthly,
          employerPfAnnual: salary.components.employerPf.annual,
          employerPfMonthly: salary.components.employerPf.monthly,
          gratuityAnnual: salary.components.gratuity.annual,
          gratuityMonthly: salary.components.gratuity.monthly,
        },
        approvalChain: [
          { level: 1, role: 'HIRING_MANAGER', status: 'APPROVED', approverId: hiringManager._id, approverName: hiringManager.name },
          { level: 2, role: 'FINANCE_APPROVER', status: 'PENDING' },
          { level: 3, role: 'ORG_ADMIN', status: 'PENDING' },
        ],
        status: 'Pending Approval',
        candidatePortalToken: crypto.randomBytes(32).toString('hex'),
      });
    }
  }

  console.log('✅ Seeding completed successfully!');
  console.log('🔑 Credentials to log in:');
  console.log('   Email: admin@techscale.io');
  console.log('   Password: P@ssword123!');
  await disconnectDB();
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
