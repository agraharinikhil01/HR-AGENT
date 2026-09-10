import mongoose from 'mongoose';
import { Job } from '../jobs/job.model.js';
import { Application } from '../candidates/application.model.js';
import { Interview } from '../interviews/interview.model.js';
import { Offer } from '../offers/offer.model.js';

export class DashboardService {
  static async getRecruitmentMetrics(orgId: string) {
    const objectOrgId = new mongoose.Types.ObjectId(orgId);

    const [
      totalOpenJobs,
      totalApplications,
      interviewsScheduled,
      offersPendingApproval,
      offersSent,
      offersAccepted,
      stageCounts,
    ] = await Promise.all([
      Job.countDocuments({ orgId: objectOrgId, status: 'Open', isDeleted: false }),
      Application.countDocuments({ orgId: objectOrgId, isDeleted: false }),
      Interview.countDocuments({ orgId: objectOrgId, status: 'Scheduled', isDeleted: false }),
      Offer.countDocuments({ orgId: objectOrgId, status: 'Pending Approval', isDeleted: false }),
      Offer.countDocuments({ orgId: objectOrgId, status: 'Sent', isDeleted: false }),
      Offer.countDocuments({ orgId: objectOrgId, status: 'Accepted', isDeleted: false }),
      Application.aggregate([
        { $match: { orgId: objectOrgId, isDeleted: false } },
        { $group: { _id: '$stage', count: { $sum: 1 } } },
      ]),
    ]);

    const stageBreakdown: Record<string, number> = {};
    for (const item of stageCounts) {
      stageBreakdown[item._id] = item.count;
    }

    const totalOffersDecided = offersAccepted + (await Offer.countDocuments({ orgId: objectOrgId, status: 'Rejected', isDeleted: false }));
    const acceptanceRate = totalOffersDecided > 0 ? Math.round((offersAccepted / totalOffersDecided) * 100) : 0;

    return {
      totalOpenJobs,
      totalApplications,
      interviewsScheduled,
      offersPendingApproval,
      offersSent,
      offersAccepted,
      acceptanceRate,
      stageBreakdown,
    };
  }
}
