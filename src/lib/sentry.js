/**
 * Sentry error tracking — env-gated.
 *
 * Set SENTRY_DSN in .env to enable. Without a DSN, captureError() is a no-op
 * so dev never depends on a Sentry account.
 *
 * To wire fully, install @sentry/nextjs and replace the dynamic import below
 * with the real SDK. We keep this thin shim so app code can already call
 * `captureError(err)` everywhere it matters.
 *
 *   import { captureError } from '@/lib/sentry';
 *   try { ... } catch (err) { captureError(err, { route: '/api/x' }); }
 */
let initialized = false;
let sdk = null;

async function ensureInit() {
  if (initialized) return sdk;
  initialized = true;
  if (!process.env.SENTRY_DSN) return null;
  try {
    // Optional dependency — only imported when DSN is set.
    sdk = await import('@sentry/nextjs');
    sdk.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1),
    });
  } catch {
    // SDK not installed; stay no-op.
    sdk = null;
  }
  return sdk;
}

export async function captureError(error, context = {}) {
  const client = await ensureInit();
  if (!client) return;
  try {
    client.captureException(error, { extra: context });
  } catch {
    /* never let logging fail the request */
  }
}

export async function captureMessage(message, level = 'info', context = {}) {
  const client = await ensureInit();
  if (!client) return;
  try {
    client.captureMessage(message, { level, extra: context });
  } catch { /* noop */ }
}
