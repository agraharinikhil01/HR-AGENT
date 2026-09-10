import mongoose from 'mongoose';
import { Interview, IInterview } from './interview.model.js';
import { Application } from '../candidates/application.model.js';
import { Candidate } from '../candidates/candidate.model.js';
import { Job } from '../jobs/job.model.js';
import { Organization } from '../organizations/organization.model.js';
import { sendEmail } from '../../services/email.service.js';
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

    // Trigger candidate email notification
    let emailStatus = { sent: false, candidateEmail: '', error: undefined as string | undefined };
    try {
      const [candidate, job, org] = await Promise.all([
        Candidate.findById(application.candidateId),
        Job.findById(application.jobId),
        Organization.findById(orgId),
      ]);

      if (candidate && candidate.email) {
        emailStatus.candidateEmail = candidate.email;
        const formattedDate = new Date(interview.scheduledAt).toLocaleString('en-IN', {
          dateStyle: 'full',
          timeStyle: 'short',
          timeZone: 'Asia/Kolkata',
        });

        const companyName = org?.name || 'HireFlow AI';
        const jobTitle = job?.title || 'Applied Role';
        const meetingText = interview.meetingLink || interview.location || 'Online Video Conference';

        const subject = `Interview Invitation: ${interview.interviewType} — ${jobTitle} at ${companyName}`;

        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #f6f8fa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0e1017;">
  <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #edf2f7; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
    <!-- Header -->
    <div style="background: #0e1017; padding: 28px 32px; color: #ffffff;">
      <div style="display: inline-block; background: #84b81b; color: #ffffff; font-weight: 900; font-size: 18px; width: 36px; height: 36px; line-height: 36px; text-align: center; border-radius: 10px; margin-bottom: 12px;">H</div>
      <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">Interview Invitation</h1>
      <p style="margin: 4px 0 0 0; font-size: 13px; color: #a0aec0;">${companyName} • Recruitment Team</p>
    </div>

    <!-- Body -->
    <div style="padding: 32px;">
      <p style="margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: #0e1017;">Hello ${candidate.fullName},</p>
      <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #4a5568;">
        We are impressed by your application for the position of <strong>${jobTitle}</strong>. We would love to invite you for your next round: <span style="background: #edf7d2; color: #567715; padding: 3px 10px; border-radius: 12px; font-weight: 700; font-size: 12px;">${interview.interviewType}</span>.
      </p>

      <!-- Round Details Card -->
      <div style="background: #f8fafc; border: 1px solid #edf2f7; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
        <h4 style="margin: 0 0 12px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #718096;">Round Details</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; color: #718096; width: 120px; font-weight: 600;">Date & Time:</td>
            <td style="padding: 6px 0; color: #0e1017; font-weight: 700;">${formattedDate} (IST)</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #718096; font-weight: 600;">Duration:</td>
            <td style="padding: 6px 0; color: #0e1017;">${interview.durationMinutes} Minutes</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #718096; font-weight: 600;">Interview Type:</td>
            <td style="padding: 6px 0; color: #0e1017; font-weight: 600;">${interview.interviewType}</td>
          </tr>
          ${interview.meetingLink ? `
          <tr>
            <td style="padding: 6px 0; color: #718096; font-weight: 600;">Meeting Link:</td>
            <td style="padding: 6px 0;"><a href="${interview.meetingLink}" style="color: #84b81b; font-weight: 700; text-decoration: underline;">Open Video Meeting Link</a></td>
          </tr>
          ` : ''}
          ${interview.location ? `
          <tr>
            <td style="padding: 6px 0; color: #718096; font-weight: 600;">Location:</td>
            <td style="padding: 6px 0; color: #0e1017;">${interview.location}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      ${interview.instructions ? `
      <div style="margin-bottom: 24px;">
        <h4 style="margin: 0 0 8px 0; font-size: 13px; color: #2d3748;">Instructions / Agenda:</h4>
        <div style="background: #ffffff; border-left: 3px solid #84b81b; padding: 10px 14px; font-size: 13px; color: #4a5568; line-height: 1.5;">
          ${interview.instructions}
        </div>
      </div>
      ` : ''}

      ${interview.meetingLink ? `
      <div style="text-align: center; margin: 32px 0 24px 0;">
        <a href="${interview.meetingLink}" style="background: #84b81b; color: #ffffff; padding: 13px 32px; border-radius: 9999px; text-decoration: none; font-weight: 800; font-size: 14px; display: inline-block; box-shadow: 0 2px 8px rgba(132,184,27,0.3);">
          Join Interview Session
        </a>
      </div>
      ` : ''}

      <p style="margin: 24px 0 0 0; font-size: 12px; line-height: 1.6; color: #718096;">
        If you have any questions or need to reschedule, please feel free to reply to this email.<br/>
        Wishing you the best for your interview round!
      </p>

      <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #edf2f7; font-size: 12px; color: #a0aec0;">
        Best regards,<br/>
        <strong style="color: #4a5568;">${actor.name || 'Talent Acquisition Team'}</strong><br/>
        ${companyName} via HireFlow AI
      </div>
    </div>
  </div>
</body>
</html>
        `;

        const mailRes = await sendEmail({
          to: candidate.email,
          subject,
          text: `Interview Invitation: ${interview.interviewType} for ${jobTitle} at ${companyName} on ${formattedDate}. Link: ${meetingText}`,
          html,
        });

        emailStatus.sent = mailRes.sent;
        emailStatus.error = mailRes.error;
      }
    } catch (err: any) {
      console.error('[InterviewService] Candidate email notification error:', err);
      emailStatus.sent = false;
      emailStatus.error = err.message;
    }

    await logAudit({
      orgId,
      userId: actor.id,
      userName: actor.name,
      action: 'INTERVIEW_SCHEDULED',
      entityType: 'Interview',
      entityId: interview._id.toString(),
      newValue: { scheduledAt: interview.scheduledAt, type: interview.interviewType, emailSent: emailStatus.sent },
      ipAddress: actor.ip,
    });

    const populatedInterview = await Interview.findById(interview._id)
      .populate('candidateId', 'fullName email')
      .populate('jobId', 'title department')
      .populate('interviewerIds', 'name email');

    return {
      interview: populatedInterview || interview,
      emailNotification: emailStatus,
    };
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
