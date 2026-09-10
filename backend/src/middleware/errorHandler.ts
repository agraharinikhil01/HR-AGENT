import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { NotFoundError } from '../utils/ownershipCheck.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const fields: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const path = issue.path.join('.') || 'body';
      if (!fields[path]) fields[path] = [];
      fields[path].push(issue.message);
    }

    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        fields,
      },
    });
    return;
  }

  // Handle NotFoundError (ownership check or document lookup)
  if (err instanceof NotFoundError || err.statusCode === 404 || err.code === 'NOT_FOUND') {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: err.message || 'Resource not found',
      },
    });
    return;
  }

  // Handle explicit HTTP errors
  if (err.statusCode && err.statusCode < 500) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code || 'INVALID_REQUEST',
        message: err.message,
        fields: err.fields,
      },
    });
    return;
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    res.status(409).json({
      success: false,
      error: {
        code: 'CONFLICT',
        message: `A record with this ${field} already exists`,
      },
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Access token expired',
      },
    });
    return;
  }

  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_INVALID',
        message: 'Invalid access token',
      },
    });
    return;
  }

  console.error('Unhandled server error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected internal server error occurred',
    },
  });
}
