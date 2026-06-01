/**
 * Centralised structured logger.
 *
 * Use this instead of `console.log` for anything that should ship to a log
 * aggregator. In dev, pino prints pretty JSON to stdout. In production, set
 * LOG_LEVEL=info and pipe stdout to your log shipper.
 *
 *   import logger from '@/lib/logger';
 *   logger.info({ userId }, 'Booking confirmed');
 *   logger.error({ err }, 'Refund failed');
 */
import pino from 'pino';

const isProd = process.env.NODE_ENV === 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  base: { app: 'quickcourt', env: process.env.NODE_ENV || 'development' },
  redact: {
    paths: [
      'password',
      '*.password',
      'authorization',
      '*.authorization',
      'token',
      '*.token',
      'JWT_SECRET',
      'RAZORPAY_KEY_SECRET',
      'CLOUDINARY_API_SECRET',
      'SMTP_PASS',
    ],
    censor: '[REDACTED]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;
