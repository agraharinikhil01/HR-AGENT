import { Request } from 'express';

export interface AuthUser {
  _id: string;
  orgId: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ORG_ADMIN' | 'RECRUITER' | 'HIRING_MANAGER' | 'INTERVIEWER' | 'FINANCE_APPROVER' | 'CANDIDATE';
  name: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
