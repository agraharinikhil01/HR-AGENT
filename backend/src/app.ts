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

// 3. CORS allowlist
const configuredOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);

      // Allow configured origins
      if (configuredOrigins.includes(origin)) return callback(null, true);

      // Allow any Vercel deployment (*.vercel.app) and local development
      if (origin.endsWith('.vercel.app') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  })
);

// 4. Request parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 5. NoSQL injection prevention
app.use(mongoSanitize());

// 6. Request logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 7. Rate limiting
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many login or registration attempts. Please wait 1 minute.',
    },
  },
});
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);

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
