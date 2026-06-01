'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Icon } from '@/components/ui/Icon';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().default(false),
});

// Drop a 1400x1600 portrait image at public/hero/login-hero.jpg (see public/hero/README.md)
const HERO_IMAGE = '/hero/login-hero.jpg';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, user, error: authError, clearError } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false }
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      const callbackUrl = searchParams.get('callbackUrl');
      if (callbackUrl && callbackUrl.startsWith('/')) {
        router.push(callbackUrl);
      } else {
        router.push(user.role === 'FACILITY_OWNER' ? '/owner/dashboard' : '/dashboard');
      }
    }
  }, [isAuthenticated, user, router, searchParams]);

  const onSubmit = async (data) => {
    clearError();
    setGlobalError('');
    setIsSubmitting(true);
    try {
      const result = await login(data.email, data.password, data.rememberMe);
      if (!result.success) {
        setGlobalError(result.error || 'Failed to sign in. Please check your credentials.');
      }
    } catch (err) {
      setGlobalError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthenticated) return null;

  return (
    <div className="bg-surface text-on-surface antialiased page-enter">
      <main className="grid min-h-screen w-full lg:grid-cols-2">
        {/* Left form */}
        <section className="w-full flex flex-col items-center justify-center px-8 py-12 sm:px-12 lg:px-20 bg-surface">
          <div className="w-full max-w-md">
            <Link href="/" className="inline-flex items-center gap-2 mb-10">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary font-display text-xl font-semibold">Q</span>
              <span className="font-display text-xl font-semibold tracking-tight text-on-surface">QuickCourt</span>
            </Link>

            <header className="mb-8">
              <div className="eyebrow mb-3">Welcome back</div>
              <h1 className="font-display text-4xl sm:text-5xl tracking-tight text-on-surface leading-[1.05] mb-3">
                Log in to your court.
              </h1>
              <p className="text-muted text-sm">
                Pick up where you left off — your bookings, favorites, and open matches.
              </p>
            </header>

            {(globalError || authError) && (
              <div className="mb-5 bg-error-container/40 border border-error/30 rounded-xl p-4 flex items-start gap-3 text-on-error-container">
                <Icon name="error" size={20} />
                <div className="text-sm font-medium">{globalError || authError}</div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="font-mono text-[11px] uppercase tracking-[0.12em] text-on-surface-variant block">Email</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@email.com"
                  {...register('email')}
                  className="input"
                />
                {errors.email && <p className="text-xs text-error">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="font-mono text-[11px] uppercase tracking-[0.12em] text-on-surface-variant block">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    {...register('password')}
                    className="input pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary p-1 focus:outline-none"
                  >
                    <Icon name={showPassword ? 'visibility' : 'visibility_off'} />
                  </button>
                </div>
                {errors.password && <p className="text-xs text-error">{errors.password.message}</p>}
              </div>

              <div className="flex items-center justify-between pt-1 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('rememberMe')}
                    className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary bg-surface-container-lowest cursor-pointer"
                  />
                  <span className="text-on-surface-variant">Remember me</span>
                </label>
                <Link href="/auth/forgot-password" className="text-primary font-semibold hover:text-primary-container transition-colors">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary btn-lg w-full mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-on-primary/30 border-t-on-primary animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Log in
                    <Icon name="arrow_forward" size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 flex items-center gap-4">
              <div className="flex-1 h-px bg-outline-variant" />
              <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-on-surface-variant">Or continue with</span>
              <div className="flex-1 h-px bg-outline-variant" />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <button
                type="button"
                className="btn btn-outline"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </button>
              <button
                type="button"
                className="btn btn-outline"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-1.736 6.01-5.12 5.91-1.36-.03-1.77-.88-3.32-.88-1.51 0-2.01.86-3.3.88-3.41.06-4.96-5.81-5.28-7.59-.89-5.12 2.65-7.53 5.46-7.53 1.83 0 3.05.91 3.92.91.85 0 2.45-1.15 4.34-1.15 1.62 0 3.84.66 5.1 3.12-4.22 2.08-3.52 7.15.2 8.33z" />
                </svg>
                Apple
              </button>
            </div>

            <div className="mt-10 text-center text-sm text-on-surface-variant">
              New here?{' '}
              <Link href="/auth/register" className="text-primary font-semibold hover:text-primary-container transition-colors">
                Create an account
              </Link>
            </div>
          </div>
        </section>

        {/* Right brand panel */}
        <section
          className="hidden lg:flex relative overflow-hidden bg-on-surface"
          style={{ backgroundImage: `url(${HERO_IMAGE})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(15,20,16,0.85)] via-[rgba(15,20,16,0.45)] to-[rgba(15,20,16,0.3)]" />
          <div className="relative z-10 flex flex-col justify-end p-12 lg:p-16 h-full w-full text-white">
            <div className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7ffc97] mb-4">
              <span className="live-dot" style={{ background: '#7ffc97' }} /> 18,420 players this month
            </div>
            <h2 className="font-display text-3xl lg:text-4xl font-semibold leading-tight max-w-md mb-4">
              “Booked a court Friday morning, found my Sunday doubles partner the same week.”
            </h2>
            <p className="text-sm text-white/75">
              <span className="font-semibold">Priya K.</span> · Player since 2024 · 47 matches
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-outline-variant border-t-primary animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
