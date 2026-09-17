import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/health', (_request, response) => {
  response.json({
    status: 'ok',
    service: 'crv5',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});
