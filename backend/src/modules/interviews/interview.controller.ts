import { Request, Response, NextFunction } from 'express';
import { InterviewService } from './interview.service.js';
import { evaluateMockInterviewAnswer } from '../../utils/aiInterviewEvaluator.js';

export class InterviewController {
  static async scheduleInterview(req: Request, res: Response, next: NextFunction) {
    try {
      const interview = await InterviewService.scheduleInterview(
        req.user!.orgId,
        req.body,
        {
          id: req.user!._id,
          name: req.user!.name,
          ip: req.ip,
        }
      );
      res.status(201).json({ success: true, data: interview });
    } catch (error) {
      next(error);
    }
  }

  static async listInterviews(req: Request, res: Response, next: NextFunction) {
    try {
      const interviews = await InterviewService.listInterviews(req.user!.orgId, {
        applicationId: req.query.applicationId as string,
        interviewerId: req.query.interviewerId as string,
        status: req.query.status as string,
      });
      res.json({ success: true, data: interviews });
    } catch (error) {
      next(error);
    }
  }

  static async getInterviewById(req: Request, res: Response, next: NextFunction) {
    try {
      const interviewId = String(req.params.id);
      const interview = await InterviewService.getInterviewById(
        req.user!.orgId,
        interviewId,
        { id: req.user!._id, role: req.user!.role }
      );
      res.json({ success: true, data: interview });
    } catch (error) {
      next(error);
    }
  }

  static async submitScorecard(req: Request, res: Response, next: NextFunction) {
    try {
      const interviewId = String(req.params.id);
      const interview = await InterviewService.submitScorecard(
        req.user!.orgId,
        interviewId,
        req.body,
        {
          id: req.user!._id,
          name: req.user!.name,
          ip: req.ip,
        }
      );
      res.json({ success: true, data: interview });
    } catch (error) {
      next(error);
    }
  }

  static async getFeedbackSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const interviewId = String(req.params.id);
      const interview = await InterviewService.getInterviewById(
        req.user!.orgId,
        interviewId,
        { id: req.user!._id, role: req.user!.role }
      );
      const summary = InterviewService.generateFeedbackSummary(interview.scorecards);
      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }

  static async evaluateMockAnswer(req: Request, res: Response, next: NextFunction) {
    try {
      const { question, answer, category, role } = req.body;
      const evaluation = evaluateMockInterviewAnswer({
        question: question || 'Technical Interview Question',
        answer: answer || '',
        category: category || 'TECHNICAL',
        role: role || 'Software Engineer',
      });
      res.json({ success: true, data: evaluation });
    } catch (error) {
      next(error);
    }
  }
}
