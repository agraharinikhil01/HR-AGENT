import mongoose from 'mongoose';
import { Interview, IInterview } from './interview.model.js';
import { Application } from '../candidates/application.model.js';
import { Candidate } from '../candidates/candidate.model.js';
import { Job } from '../jobs/job.model.js';
import { assertOwnership, NotFoundError } from '../../utils/ownershipCheck.js';
import { logAudit } from '../audit/audit.service.js';
import { emitToOrg } from '../../sockets/index.js';

export class InterviewService {
  static async scheduleInterview(
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

    const interview = await Interview.create({
      orgId: new mongoose.Types.ObjectId(orgId),
      applicationId: application._id,
      candidateId: application.candidateId,
      jobId: application.jobId,
      interviewType: data.interviewType,
      interviewerIds: data.interviewerIds.map((id: string) => new mongoose.Types.ObjectId(id)),
      scheduledAt: new Date(data.scheduledAt),
      durationMinutes: data.durationMinutes || 45,
      meetingLink: data.meetingLink,
      location: data.location,
      instructions: data.instructions,
      status: 'Scheduled',
    });

    // Optionally auto-advance to Interview stage if still in earlier stage
    if (['Applied', 'AI Reviewed', 'Recruiter Review', 'Shortlisted'].includes(application.stage)) {
      application.stage = 'Interview';
      application.stageHistory.push({
        stage: 'Interview',
        changedBy: new mongoose.Types.ObjectId(actor.id),
        note: `Interview scheduled (${data.interviewType})`,
        changedAt: new Date(),
      });
      await application.save();
    }

    emitToOrg(orgId, 'interview:scheduled', {
      interviewId: interview._id,
      applicationId: application._id,
      interviewType: interview.interviewType,
      scheduledAt: interview.scheduledAt,
    });

    await logAudit({
      orgId,
      userId: actor.id,
      userName: actor.name,
      action: 'INTERVIEW_SCHEDULED',
      entityType: 'Interview',
      entityId: interview._id.toString(),
      newValue: { scheduledAt: interview.scheduledAt, type: interview.interviewType },
      ipAddress: actor.ip,
    });

    return interview;
  }

  static async listInterviews(
    orgId: string,
    filters: {
      applicationId?: string;
      interviewerId?: string;
      status?: string;
    }
  ) {
    const query: Record<string, any> = {
      orgId: new mongoose.Types.ObjectId(orgId),
      isDeleted: false,
    };

    if (filters.applicationId) {
      query.applicationId = new mongoose.Types.ObjectId(filters.applicationId);
    }
    if (filters.interviewerId) {
      query.interviewerIds = new mongoose.Types.ObjectId(filters.interviewerId);
    }
    if (filters.status && filters.status !== 'All') {
      query.status = filters.status;
    }

    return Interview.find(query)
      .populate('candidateId', 'fullName email currentDesignation')
      .populate('jobId', 'title department')
      .populate('interviewerIds', 'name email role')
      .sort({ scheduledAt: 1 });
  }

  static async getInterviewById(orgId: string, interviewId: string, viewer: { id: string; role: string }) {
    const interview = await Interview.findOne({
      _id: new mongoose.Types.ObjectId(interviewId),
      orgId: new mongoose.Types.ObjectId(orgId),
      isDeleted: false,
    })
      .populate('candidateId', 'fullName email')
      .populate('jobId', 'title department')
      .populate('interviewerIds', 'name email role');

    if (!interview) {
      throw new NotFoundError('Interview not found');
    }

    const obj = interview.toObject();

    // PRD §11.39: Feedback Privacy (Blind feedback)
    // If the viewer is an Interviewer, only show other feedback IF they have submitted their own scorecard
    if (viewer.role === 'INTERVIEWER') {
      const hasViewerSubmitted = obj.scorecards.some(
        (sc: any) => sc.interviewerId.toString() === viewer.id
      );

      if (!hasViewerSubmitted) {
        // Redact peer scorecards until viewer submits their own
        obj.scorecards = obj.scorecards.filter(
          (sc: any) => sc.interviewerId.toString() === viewer.id
        );
      }
    }

    return obj;
  }

  static async submitScorecard(
    orgId: string,
    interviewId: string,
    data: any,
    actor: { id: string; name: string; ip?: string }
  ) {
    const interview = await Interview.findOne({
      _id: new mongoose.Types.ObjectId(interviewId),
      orgId: new mongoose.Types.ObjectId(orgId),
      isDeleted: false,
    });

    if (!interview) {
      throw new NotFoundError('Interview not found');
    }

    // Check if user already submitted scorecard
    const existingIndex = interview.scorecards.findIndex(
      (sc) => sc.interviewerId.toString() === actor.id
    );

    const scorecardData = {
      interviewerId: new mongoose.Types.ObjectId(actor.id),
      interviewerName: actor.name,
      competencyRatings: data.competencyRatings,
      overallRating: data.overallRating,
      comments: data.comments,
      recommendation: data.recommendation,
      submittedAt: new Date(),
    };

    if (existingIndex >= 0) {
      interview.scorecards[existingIndex] = scorecardData as any;
    } else {
      interview.scorecards.push(scorecardData as any);
    }

    // If all assigned interviewers have submitted, mark status as Completed
    if (interview.scorecards.length >= interview.interviewerIds.length) {
      interview.status = 'Completed';
    }

    await interview.save();

    await logAudit({
      orgId,
      userId: actor.id,
      userName: actor.name,
      action: 'INTERVIEW_SCORECARD_SUBMITTED',
      entityType: 'Interview',
      entityId: interviewId,
      newValue: { recommendation: data.recommendation, rating: data.overallRating },
      ipAddress: actor.ip,
    });

    return interview;
  }

  static generateFeedbackSummary(scorecards: any[]) {
    if (!scorecards || scorecards.length === 0) {
      return {
        isAiGenerated: true,
        summary: 'No scorecards have been submitted yet.',
        consensusRecommendation: 'Pending',
        averageRating: 0,
      };
    }

    const avgRating = (
      scorecards.reduce((acc, sc) => acc + sc.overallRating, 0) / scorecards.length
    ).toFixed(1);

    const positiveRecs = scorecards.filter((sc) =>
      ['Strong Hire', 'Hire'].includes(sc.recommendation)
    ).length;

    let consensus = 'Neutral';
    if (positiveRecs === scorecards.length) {
      consensus = 'Unanimous Hire';
    } else if (positiveRecs >= Math.ceil(scorecards.length / 2)) {
      consensus = 'Majority Hire';
    } else {
      consensus = 'Concerns Raised / Do Not Hire';
    }

    const keyHighlights = scorecards.map(
      (sc) => `${sc.interviewerName} (${sc.recommendation}, ${sc.overallRating}/5): "${sc.comments}"`
    );

    return {
      isAiGenerated: true,
      summary: `Evaluated by ${scorecards.length} interviewer(s) with an average score of ${avgRating}/5. Overall consensus: ${consensus}.`,
      consensusRecommendation: consensus,
      averageRating: Number(avgRating),
      keyHighlights,
    };
  }
}
