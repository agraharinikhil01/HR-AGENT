import crypto from 'crypto';
import mongoose from 'mongoose';
import { Offer, IOffer } from './offer.model.js';
import { Application } from '../candidates/application.model.js';
import { Candidate } from '../candidates/candidate.model.js';
import { Job } from '../jobs/job.model.js';
import { Organization } from '../organizations/organization.model.js';
import { calculateIndianCtc } from '../../utils/salaryCalculator.js';
import { assertOwnership, NotFoundError } from '../../utils/ownershipCheck.js';
import { logAudit } from '../audit/audit.service.js';
import { emitToOrg } from '../../sockets/index.js';
import { sendEmail } from '../../services/email.service.js';
import { env } from '../../config/env.js';

export class OfferService {
  static async createOffer(
    orgId: string,
    data: any,
    actor: { id: string; name: string; ip?: string }
  ) {
    const application = await Application.findOne({
      _id: new mongoose.Types.ObjectId(data.applicationId),
      orgId: new mongoose.Types.ObjectId(orgId),
      isDeleted: false,
    });

    if (!application) {
      throw new NotFoundError('Application not found');
    }

    // Calculate Indian CTC components
    const salary = calculateIndianCtc({
      annualCtc: data.annualCtc,
      basicPercentage: data.basicPercentage,
      hraPercentage: data.hraPercentage,
      variableAnnual: data.variableAnnual,
      includePf: data.includePf,
      includeGratuity: data.includeGratuity,
    });

    const candidatePortalToken = crypto.randomBytes(32).toString('hex');

    // Default 3-tier approval chain per PRD §11.46
    const approvalChain = [
      {
        level: 1,
        role: 'HIRING_MANAGER' as const,
        status: 'PENDING' as const,
      },
      {
        level: 2,
        role: 'FINANCE_APPROVER' as const,
        status: 'PENDING' as const,
      },
      {
        level: 3,
        role: 'ORG_ADMIN' as const,
        status: 'PENDING' as const,
      },
    ];

    const offer = await Offer.create({
      orgId: new mongoose.Types.ObjectId(orgId),
      applicationId: application._id,
      candidateId: application.candidateId,
      jobId: application.jobId,
      version: 1,
      templateType: data.templateType,
      joiningDate: new Date(data.joiningDate),
      validUntil: new Date(data.validUntil),
      reportingManager: data.reportingManager,
      workLocation: data.workLocation,
      probationPeriodMonths: data.probationPeriodMonths,
      noticePeriodDays: data.noticePeriodDays,
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
      additionalBenefits: data.additionalBenefits,
      termsAndConditions: data.termsAndConditions,
      approvalChain,
      status: 'Pending Approval',
      candidatePortalToken,
    });

    // Update application stage to Offer Approval
    application.stage = 'Offer Approval';
    application.stageHistory.push({
      stage: 'Offer Approval',
      changedBy: new mongoose.Types.ObjectId(actor.id),
      note: `Offer drafted with Annual CTC of ₹${data.annualCtc.toLocaleString('en-IN')}`,
      changedAt: new Date(),
    });
    await application.save();

    emitToOrg(orgId, 'offer:created', {
      offerId: offer._id,
      applicationId: application._id,
      annualCtc: offer.annualCtc,
      status: offer.status,
    });

    await logAudit({
      orgId,
      userId: actor.id,
      userName: actor.name,
      action: 'OFFER_CREATED',
      entityType: 'Offer',
      entityId: offer._id.toString(),
      newValue: { annualCtc: offer.annualCtc, templateType: offer.templateType },
      ipAddress: actor.ip,
    });

    return offer;
  }

  static async processApproval(
    orgId: string,
    offerId: string,
    decisionData: { decision: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED'; comments?: string },
    actor: { id: string; name: string; role: string; ip?: string }
  ) {
    const offer = await Offer.findOne({
      _id: new mongoose.Types.ObjectId(offerId),
      orgId: new mongoose.Types.ObjectId(orgId),
      isDeleted: false,
    });

    if (!offer) throw new NotFoundError('Offer not found');

    // Find the relevant step for the actor's role
    const step = offer.approvalChain.find((s) => s.role === actor.role || (actor.role === 'ORG_ADMIN' && s.status === 'PENDING'));
    if (!step) {
      const err: any = new Error('No pending approval step matches your role');
      err.statusCode = 403;
      err.code = 'FORBIDDEN';
      throw err;
    }

    step.status = decisionData.decision;
    step.approverId = new mongoose.Types.ObjectId(actor.id);
    step.approverName = actor.name;
    step.comments = decisionData.comments;
    step.decisionAt = new Date();

    if (decisionData.decision === 'REJECTED') {
      offer.status = 'Rejected';
    } else if (decisionData.decision === 'CHANGES_REQUESTED') {
      offer.status = 'Changes Requested';
    } else {
      // Check if all steps approved
      const allApproved = offer.approvalChain.every((s) => s.status === 'APPROVED');
      if (allApproved) {
        offer.status = 'Approved';
      }
    }

    await offer.save();

    emitToOrg(orgId, 'offer:approval_updated', {
      offerId: offer._id,
      status: offer.status,
      approver: actor.name,
      decision: decisionData.decision,
    });

    await logAudit({
      orgId,
      userId: actor.id,
      userName: actor.name,
      action: `OFFER_${decisionData.decision}`,
      entityType: 'Offer',
      entityId: offerId,
      newValue: { status: offer.status, comments: decisionData.comments },
      ipAddress: actor.ip,
    });

    return offer;
  }

  static async sendOffer(
    orgId: string,
    offerId: string,
    actor: { id: string; name: string; ip?: string }
  ) {
    const offer = await Offer.findOne({
      _id: new mongoose.Types.ObjectId(offerId),
      orgId: new mongoose.Types.ObjectId(orgId),
      isDeleted: false,
    })
      .populate('candidateId', 'fullName email')
      .populate('jobId', 'title');

    if (!offer) throw new NotFoundError('Offer not found');

    if (offer.status !== 'Approved') {
      const err: any = new Error('Offer must be fully approved before releasing to the candidate');
      err.statusCode = 400;
      err.code = 'INVALID_REQUEST';
      throw err;
    }

    offer.status = 'Sent';
    offer.sentAt = new Date();
    await offer.save();

    // Update Application stage to Offer Sent
    const application = await Application.findById(offer.applicationId);
    if (application) {
      application.stage = 'Offer Sent';
      application.stageHistory.push({
        stage: 'Offer Sent',
        changedBy: new mongoose.Types.ObjectId(actor.id),
        note: 'Offer sent to candidate',
        changedAt: new Date(),
      });
      await application.save();
    }

    const candidate = offer.candidateId as any;
    const job = offer.jobId as any;
    const offerUrl = `${env.CLIENT_URL}/offers/view/${offer.candidatePortalToken}`;

    sendEmail({
      to: candidate.email,
      subject: `Job Offer: ${job.title}`,
      text: `Dear ${candidate.fullName},\n\nWe are delighted to extend an offer for the position of ${job.title}.\n\nPlease review and sign your offer letter at: ${offerUrl}\n\nThis offer is valid until ${offer.validUntil.toDateString()}.`,
      html: `<h3>Congratulations ${candidate.fullName}!</h3><p>We are delighted to extend an offer of employment for the position of <b>${job.title}</b>.</p><p><a href="${offerUrl}" style="display:inline-block;background:#10B981;color:#fff;padding:10px 18px;text-decoration:none;border-radius:6px;font-weight:bold;">View & Sign Offer Letter</a></p><p>Validity: Valid until ${offer.validUntil.toDateString()}</p>`,
    }).catch((e) => console.error('Error sending offer email:', e));

    emitToOrg(orgId, 'offer:sent', {
      offerId: offer._id,
      candidateEmail: candidate.email,
      sentAt: offer.sentAt,
    });

    await logAudit({
      orgId,
      userId: actor.id,
      userName: actor.name,
      action: 'OFFER_RELEASED_TO_CANDIDATE',
      entityType: 'Offer',
      entityId: offerId,
      ipAddress: actor.ip,
    });

    return { offer, offerUrl };
  }

  static async getPublicOffer(token: string) {
    const offer = await Offer.findOne({ candidatePortalToken: token, isDeleted: false })
      .populate('candidateId', 'fullName email phone')
      .populate('jobId', 'title department')
      .populate('orgId', 'name logo website');

    if (!offer) {
      throw new NotFoundError('Offer letter not found or link has expired');
    }

    // PRD §11.51 Track first viewed and last viewed date
    const now = new Date();
    if (!offer.firstViewedAt) {
      offer.firstViewedAt = now;
    }
    offer.lastViewedAt = now;

    if (offer.status === 'Sent') {
      offer.status = 'Viewed';
      emitToOrg(offer.orgId.toString(), 'offer:viewed', {
        offerId: offer._id,
        firstViewedAt: offer.firstViewedAt,
      });
    }

    await offer.save();
    return offer;
  }

  static async candidateRespond(
    token: string,
    action: 'ACCEPT' | 'REJECT' | 'CLARIFICATION',
    signature?: string,
    comments?: string
  ) {
    const offer = await Offer.findOne({ candidatePortalToken: token, isDeleted: false });
    if (!offer) throw new NotFoundError('Offer letter not found');

    if (['Accepted', 'Withdrawn', 'Expired'].includes(offer.status)) {
      const err: any = new Error(`Offer has already reached final status: ${offer.status}`);
      err.statusCode = 400;
      err.code = 'INVALID_REQUEST';
      throw err;
    }

    const application = await Application.findById(offer.applicationId);

    if (action === 'ACCEPT') {
      if (!signature) {
        const err: any = new Error('Digital signature is required to accept the offer');
        err.statusCode = 400;
        err.code = 'VALIDATION_ERROR';
        throw err;
      }

      offer.status = 'Accepted';
      offer.acceptedAt = new Date();
      offer.candidateSignature = signature;
      offer.candidateNotes = comments;
      await offer.save();

      if (application) {
        application.stage = 'Offer Accepted';
        application.stageHistory.push({
          stage: 'Offer Accepted',
          note: `Offer accepted by candidate with digital signature`,
          changedAt: new Date(),
        });
        await application.save();
      }

      emitToOrg(offer.orgId.toString(), 'offer:accepted', {
        offerId: offer._id,
        acceptedAt: offer.acceptedAt,
      });
    } else if (action === 'REJECT') {
      offer.status = 'Rejected';
      offer.rejectedAt = new Date();
      offer.candidateNotes = comments;
      await offer.save();

      if (application) {
        application.stage = 'Offer Declined';
        application.stageHistory.push({
          stage: 'Offer Declined',
          note: `Candidate declined offer: ${comments || 'No reason provided'}`,
          changedAt: new Date(),
        });
        await application.save();
      }

      emitToOrg(offer.orgId.toString(), 'offer:declined', {
        offerId: offer._id,
        rejectedAt: offer.rejectedAt,
      });
    } else {
      // Clarification requested
      offer.candidateNotes = comments;
      await offer.save();
      emitToOrg(offer.orgId.toString(), 'offer:clarification_requested', {
        offerId: offer._id,
        comments,
      });
    }

    return offer;
  }

  static async listOffers(orgId: string, status?: string) {
    const query: Record<string, any> = {
      orgId: new mongoose.Types.ObjectId(orgId),
      isDeleted: false,
    };
    if (status && status !== 'All') {
      query.status = status;
    }

    return Offer.find(query)
      .populate('candidateId', 'fullName email')
      .populate('jobId', 'title department')
      .sort({ createdAt: -1 });
  }

  static async getOfferById(orgId: string, offerId: string) {
    return assertOwnership(Offer, offerId, orgId);
  }
}
