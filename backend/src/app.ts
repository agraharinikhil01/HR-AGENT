import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { env } from './config/env.js';
import { isDBConnected } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';

// Domain route modules
import { authRoutes } from './modules/auth/auth.routes.js';
import { organizationRoutes } from './modules/organizations/organization.routes.js';
import { jobRoutes } from './modules/jobs/job.routes.js';
import { candidateRoutes } from './modules/candidates/candidate.routes.js';
import { interviewRoutes } from './modules/interviews/interview.routes.js';
import { offerRoutes } from './modules/offers/offer.routes.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';

const app = express();

// 1. Health & readiness routes (unauthenticated, lightweight)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/ready', (req, res) => {
  if (isDBConnected()) {
    res.status(200).json({ status: 'ready', db: 'connected' });
  } else {
    res.status(503).json({ status: 'not_ready', db: 'disconnected' });
  }
});

// 2. Security headers
app.use(helmet());

// 3. Resilient CORS allowlist
const configuredOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like health checks, server-to-server, curl)
      if (!origin) return callback(null, true);

      // Allow configured origins
      if (configuredOrigins.includes(origin)) return callback(null, true);

      // Allow all Vercel deployments (*.vercel.app)
      if (origin.endsWith('.vercel.app')) return callback(null, true);

      // Allow Render services (*.onrender.com)
      if (origin.endsWith('.onrender.com')) return callback(null, true);

      // Allow local development
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token', 'cf-turnstile-response'],
  })
);

// 4. Request parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 5. NoSQL injection prevention (Express 5 compatible)
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  next();
});

// 6. Request logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 7. Rate limiting & Bot Protection
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many failed login attempts. Please wait 1 minute.',
    },
  },
});
app.use('/api/v1/auth/login', authLimiter);

// Strict rate limit for bot-targeted forms (max 5 submissions per 15 minutes per IP)
const publicSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many submissions from this IP address. Please wait 15 minutes before trying again.',
    },
  },
});
app.use('/api/v1/candidates/public-apply', publicSubmissionLimiter);
app.use('/api/v1/auth/register', publicSubmissionLimiter);
app.use('/api/v1/auth/register-user', publicSubmissionLimiter);

// Optional Turnstile Anti-Bot Verification
app.use(async (req, res, next) => {
  const turnstileToken = req.body?.turnstileToken || req.headers['cf-turnstile-response'];
  if (!turnstileToken || !env.CLOUDFLARE_TURNSTILE_SECRET) {
    return next();
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', env.CLOUDFLARE_TURNSTILE_SECRET);
    formData.append('response', turnstileToken as string);
    formData.append('remoteip', req.ip || '');

    const cfRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });
    const cfData: any = await cfRes.json();
    if (!cfData.success) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'CAPTCHA_VERIFICATION_FAILED',
          message: 'Security challenge failed. Please try again.',
        },
      });
    }
    next();
  } catch {
    next();
  }
});

// 8. API v1 Mounts
const apiV1 = express.Router();
apiV1.use('/auth', authRoutes);
apiV1.use('/organizations', organizationRoutes);
apiV1.use('/jobs', jobRoutes);
apiV1.use('/candidates', candidateRoutes);
apiV1.use('/interviews', interviewRoutes);
apiV1.use('/offers', offerRoutes);
apiV1.use('/dashboard', dashboardRoutes);

app.use('/api/v1', apiV1);

// 9. 404 Fallback
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Endpoint ${req.method} ${req.originalUrl} not found`,
    },
  });
});

// 10. Central Error Handler
app.use(errorHandler);

export { app };
