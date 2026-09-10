import { z } from 'zod';

const frontendEnvSchema = z.object({
  VITE_API_BASE_URL: z.string().default('http://localhost:5000'),
  VITE_ENABLE_REAL_TIME: z.string().default('true'),
});

const parsed = frontendEnvSchema.safeParse({
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_ENABLE_REAL_TIME: import.meta.env.VITE_ENABLE_REAL_TIME,
});

if (!parsed.success) {
  console.error('❌ Invalid frontend environment variables:', parsed.error.flatten().fieldErrors);
}

export const frontendEnv = parsed.success
  ? parsed.data
  : {
      VITE_API_BASE_URL: 'http://localhost:5000',
      VITE_ENABLE_REAL_TIME: 'true',
    };
