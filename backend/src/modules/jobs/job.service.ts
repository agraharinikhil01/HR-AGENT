import mongoose from 'mongoose';
import { Job, IJob } from './job.model.js';
import { Organization } from '../organizations/organization.model.js';
import { assertOwnership, NotFoundError } from '../../utils/ownershipCheck.js';
import { logAudit } from '../audit/audit.service.js';

export class JobService {
  static async createJob(orgId: string, recruiterId: string, data: any, actor: { id: string; name: string; ip?: string }) {
    const slugBase = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const slug = `${slugBase}-${Date.now().toString().slice(-4)}`;

    const job = await Job.create({
      ...data,
      orgId: new mongoose.Types.ObjectId(orgId),
      recruiterId: new mongoose.Types.ObjectId(recruiterId),
      slug,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
    });

    await logAudit({
      orgId,
      userId: actor.id,
      userName: actor.name,
      action: 'JOB_CREATED',
      entityType: 'Job',
      entityId: job._id.toString(),
      newValue: { title: job.title, status: job.status },
      ipAddress: actor.ip,
    });

    return job;
  }

  static async listJobs(
    orgId: string,
    filters: {
      status?: string;
      department?: string;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {
      orgId: new mongoose.Types.ObjectId(orgId),
      isDeleted: false,
    };

    if (filters.status && filters.status !== 'All') {
      query.status = filters.status;
    }

    if (filters.department) {
      query.department = filters.department;
    }

    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    const [total, jobs] = await Promise.all([
      Job.countDocuments(query),
      Job.find(query)
        .populate('hiringManagerId', 'name email')
        .populate('recruiterId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    return {
      jobs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getJobById(orgId: string, jobId: string) {
    return assertOwnership(Job, jobId, orgId);
  }

  static async updateJob(orgId: string, jobId: string, data: any, actor: { id: string; name: string; ip?: string }) {
    const job = await assertOwnership(Job, jobId, orgId);
    const previous = job.toObject();

    Object.assign(job, data);
    if (data.deadline) {
      job.deadline = new Date(data.deadline);
    }
    await job.save();

    await logAudit({
      orgId,
      userId: actor.id,
      userName: actor.name,
      action: 'JOB_UPDATED',
      entityType: 'Job',
      entityId: jobId,
      previousValue: previous,
      newValue: job.toObject(),
      ipAddress: actor.ip,
    });

    return job;
  }

  static async deleteJob(orgId: string, jobId: string, actor: { id: string; name: string; ip?: string }) {
    const job = await assertOwnership(Job, jobId, orgId);
    job.isDeleted = true;
    await job.save();

    await logAudit({
      orgId,
      userId: actor.id,
      userName: actor.name,
      action: 'JOB_DELETED',
      entityType: 'Job',
      entityId: jobId,
      ipAddress: actor.ip,
    });

    return { message: 'Job deleted successfully' };
  }

  static async getPublicJob(orgSlug: string, jobSlug: string) {
    const org = await Organization.findOne({ slug: orgSlug.toLowerCase() });
    if (!org) {
      throw new NotFoundError('Organization not found');
    }

    const job = await Job.findOne({
      orgId: org._id,
      slug: jobSlug.toLowerCase(),
      status: 'Open',
      isDeleted: false,
    }).select('-hiringManagerId -recruiterId -isDeleted');

    if (!job) {
      throw new NotFoundError('Job opening not found or currently closed');
    }

    return {
      organization: {
        name: org.name,
        slug: org.slug,
        logo: org.logo,
        industry: org.industry,
        website: org.website,
      },
      job,
    };
  }

  static generateAiJobDescriptionDraft(data: {
    title: string;
    industry: string;
    experienceLevel: string;
    requiredSkills: string[];
    workplaceType: string;
  }) {
    const skillsList = data.requiredSkills.length > 0 ? data.requiredSkills : ['Communication', 'Problem Solving', 'Collaboration'];

    return {
      isAiGenerated: true,
      title: data.title,
      summary: `We are looking for an experienced ${data.title} to join our growing team in the ${data.industry} industry. In this role, you will design, develop, and scale impactful solutions while working in a ${data.workplaceType} environment.`,
      responsibilities: [
        `Lead the architectural direction and execution of core ${data.title} initiatives.`,
        `Collaborate cross-functionally with Product, Engineering, and Business stakeholders.`,
        `Ensure high code quality, automated test coverage, and documentation standards.`,
        `Mentor junior team members and participate in peer reviews.`,
        `Troubleshoot and optimize production performance and reliability.`,
      ],
      mandatorySkills: skillsList,
      preferredSkills: [
        `Experience in fast-paced ${data.industry} startups.`,
        `Familiarity with Agile development workflows and CI/CD pipelines.`,
        `Strong presentation and technical communication skills.`,
      ],
      educationRequirements: [
        `Bachelor's degree in Computer Science, Engineering, or equivalent practical experience.`,
      ],
    };
  }

  static async listAllPublicJobs(filters?: { department?: string; search?: string }) {
    const query: any = { status: 'Open', isDeleted: false };
    if (filters?.department && filters.department !== 'All') {
      query.department = filters.department;
    }
    if (filters?.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { department: { $regex: filters.search, $options: 'i' } },
        { mandatorySkills: { $regex: filters.search, $options: 'i' } },
      ];
    }
    const jobs = await Job.find(query)
      .populate('orgId', 'name slug industry website')
      .sort({ createdAt: -1 });

    return jobs;
  }
}
