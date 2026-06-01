'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Icon } from '@/components/ui/Icon';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['USER', 'FACILITY_OWNER']).default('USER'),
  agreedTerms: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
});

// Drop a 1400x1600 portrait image at public/hero/register-hero.jpg (see public/hero/README.md)
const HERO_IMAGE = '/hero/register-hero.jpg';

function passwordStrength(pw) {
  if (!pw) return { score: 0, label: '' };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  return { score: Math.min(score, 5), label: labels[Math.min(score, 5)] };
}

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, clearError } = useAuth();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      role: 'USER',
      agreedTerms: false,
    },
  });

  const selectedRole = watch('role');
  const password = watch('password');
  const strength = passwordStrength(password);

  const onSubmit = async (data) => {
    clearError();
    setGlobalError('');
    setIsSubmitting(true);
    try {
      const result = await registerUser({
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: data.password,
        confirmPassword: data.password,
        role: data.role,
      });
      if (!result.success) {
        setGlobalError(result.error || 'Registration failed. Please try again.');
        setIsSubmitting(false);
        return;
      }
      const otpParam = result.otpCode ? `&otp=${result.otpCode}` : '';
      router.push(`/auth/verify-otp?email=${encodeURIComponent(data.email)}${otpParam}`);
    } catch (err) {
      setGlobalError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen grid lg:grid-cols-2 page-enter">
      {/* Left form */}
      <div className="w-full flex items-center justify-center px-8 py-12 sm:px-12 lg:px-20 overflow-y-auto">
        <div className="w-full max-w-md space-y-7">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary font-display text-xl font-semibold">Q</span>
            <span className="font-display text-xl font-semibold tracking-tight text-on-surface">QuickCourt</span>
          </Link>

          <div className="space-y-3">
            <div className="eyebrow">Join QuickCourt</div>
            <h1 className="font-display text-4xl sm:text-5xl tracking-tight text-on-surface leading-[1.05]">Get on a court today.</h1>
            <p className="text-muted text-sm">Free to join. Pay only when you play.</p>
          </div>

          {globalError && (
            <div className="bg-error-container/40 border border-error/30 rounded-xl p-4 flex items-start gap-3 text-on-error-container">
              <Icon name="error" size={20} />
              <div className="text-sm font-medium">{globalError}</div>
            </div>
          )}

          {/* Role toggle */}
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-on-surface-variant mb-2">I am a</div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setValue('role', 'USER')}
                className={`text-left p-4 rounded-xl border transition-all ${
                  selectedRole === 'USER'
                    ? 'border-primary bg-primary-container'
                    : 'border-outline-variant bg-transparent hover:bg-surface-container'
                }`}
              >
                <Icon name="sports_tennis" size={20} className="text-primary" />
                <div className="font-semibold text-sm mt-1.5 text-on-surface">Player</div>
                <div className="text-[11px] text-on-surface-variant mt-0.5">I want to book courts</div>
              </button>
              <button
                type="button"
                onClick={() => setValue('role', 'FACILITY_OWNER')}
                className={`text-left p-4 rounded-xl border transition-all ${
                  selectedRole === 'FACILITY_OWNER'
                    ? 'border-primary bg-primary-container'
                    : 'border-outline-variant bg-transparent hover:bg-surface-container'
                }`}
              >
                <Icon name="storefront" size={20} className="text-primary" />
                <div className="font-semibold text-sm mt-1.5 text-on-surface">Owner</div>
                <div className="text-[11px] text-on-surface-variant mt-0.5">I run a venue</div>
              </button>
            </div>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {/* Name */}
            <Field
              label="Full Name"
              icon="badge"
              error={errors.name?.message}
              inputProps={{
                ...register('name'),
                type: 'text',
                placeholder: 'Alex Morgan',
                autoComplete: 'name',
              }}
            />

            {/* Email */}
            <Field
              label="Email Address"
              icon="mail"
              error={errors.email?.message}
              inputProps={{
                ...register('email'),
                type: 'email',
                placeholder: 'alex@example.com',
                autoComplete: 'email',
              }}
            />

            {/* Phone */}
            <Field
              label="Phone Number"
              icon="phone_iphone"
              error={errors.phone?.message}
              inputProps={{
                ...register('phone'),
                type: 'tel',
                placeholder: '(555) 123-4567',
                autoComplete: 'tel',
              }}
            />

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block font-mono text-[11px] uppercase tracking-[0.12em] text-on-surface-variant">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <Icon name="lock" className="text-on-surface-variant" size={18} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className="input pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-primary transition-colors"
                >
                  <Icon name={showPassword ? 'visibility' : 'visibility_off'} />
                </button>
              </div>
              {/* Strength meter */}
              {password && (
                <div className="pt-2">
                  <div className="flex gap-2 mb-1 h-1.5">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-full ${
                          i < strength.score
                            ? strength.score <= 2
                              ? 'bg-error'
                              : strength.score <= 3
                                ? 'bg-secondary'
                                : 'bg-primary'
                            : 'bg-surface-variant'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`font-mono text-xs ${strength.score <= 2 ? 'text-error' : strength.score <= 3 ? 'text-secondary' : 'text-primary'}`}>
                    {strength.label}
                  </p>
                </div>
              )}
              {errors.password && <p className="text-xs text-error">{errors.password.message}</p>}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3 pt-2">
              <input
                id="terms"
                type="checkbox"
                {...register('agreedTerms')}
                className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary bg-surface transition-colors cursor-pointer mt-0.5"
              />
              <label htmlFor="terms" className="text-sm text-on-surface-variant cursor-pointer">
                I agree to the <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
              </label>
            </div>
            {errors.agreedTerms && <p className="text-xs text-error">{errors.agreedTerms.message}</p>}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-lg w-full mt-2 group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-on-primary/30 border-t-on-primary animate-spin" />
                  Creating account…
                </>
              ) : (
                <>
                  Create account
                  <Icon name="arrow_forward" size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-on-surface-variant pt-4 border-t border-outline-variant/30">
            Already on QuickCourt?{' '}
            <Link href="/auth/login" className="text-primary font-semibold hover:text-primary-container transition-colors ml-1">Log in</Link>
          </p>
        </div>
      </div>

      {/* Right brand panel */}
      <div
        className="hidden lg:flex relative overflow-hidden bg-on-surface"
        style={{ backgroundImage: `url(${HERO_IMAGE})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(15,20,16,0.85)] via-[rgba(15,20,16,0.45)] to-[rgba(15,20,16,0.3)]" />
        <div className="relative z-10 flex flex-col justify-end p-12 lg:p-16 h-full w-full text-white">
          <div className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7ffc97] mb-4">
            <span className="live-dot" style={{ background: '#7ffc97' }} /> Premier sports community
          </div>
          <h2 className="font-display text-3xl lg:text-4xl font-semibold leading-tight max-w-md mb-4">
            Elevate your game.
          </h2>
          <p className="text-sm text-white/75 max-w-md leading-relaxed">
            Book courts instantly, manage leagues effortlessly, and connect with your local sports community.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon, error, inputProps }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputProps.name || inputProps.id} className="block font-mono text-[11px] uppercase tracking-[0.12em] text-on-surface-variant">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
          <Icon name={icon} className="text-on-surface-variant" size={18} />
        </div>
        <input
          {...inputProps}
          className="input pl-10 pr-3"
        />
      </div>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
