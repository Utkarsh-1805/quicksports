'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Input, Button } from '@/components/ui';
import { Zap, AlertCircle, ArrowLeft, ArrowRight, User, Building } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['USER', 'FACILITY_OWNER']).default('USER'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser, clearError } = useAuth();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    watch,
    setValue
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role: 'USER',
    }
  });

  // eslint-disable-next-line react-hooks/incompatible-library
  const selectedRole = watch('role');

  const handleNextStep = async () => {
    // Validate first step fields before moving on
    const isValid = await trigger(['name', 'email', 'phone', 'password', 'confirmPassword']);
    if (isValid) {
      setStep(2);
      window.scrollTo(0, 0);
    }
  };

  const onSubmit = async (data) => {
    clearError();
    setGlobalError('');
    setIsSubmitting(true);

    try {
      const result = await registerUser(data);

      if (!result.success) {
        setGlobalError(result.error || 'Registration failed. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // If registered successfully, redirect to OTP verification
      // Include OTP in URL for development testing
      const otpParam = result.otpCode ? `&otp=${result.otpCode}` : '';
      router.push(`/auth/verify-otp?email=${encodeURIComponent(data.email)}${otpParam}`);

    } catch (err) {
      setGlobalError('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-green-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center items-center gap-2 group mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:scale-105 transition-transform">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <span className="text-3xl font-bold tracking-tight text-slate-900">
            Quick<span className="text-green-600">Court</span>
          </span>
        </Link>
        <h2 className="mt-2 text-center text-2xl md:text-3xl font-extrabold text-slate-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-green-600 hover:text-green-500 transition-colors">
            Sign in instead
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
                <span className="text-xs font-medium text-slate-500 mt-2">Details</span>
              </div>
              <div className={`flex-1 h-1 mx-4 rounded-full ${step >= 2 ? 'bg-green-600' : 'bg-slate-200'}`}></div>
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
                <span className="text-xs font-medium text-slate-500 mt-2">Role</span>
              </div>
            </div>
          </div>

          {globalError && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
              <div className="text-sm font-medium">{globalError}</div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>

            {/* Step 1: Basic Info */}
            <div className={step === 1 ? 'block' : 'hidden'}>
              <div className="space-y-4">
                <Input
                  label="Full Name"
                  placeholder="John Doe"
                  error={errors.name?.message}
                  {...register('name')}
                />

                <Input
                  label="Email address"
                  type="email"
                  placeholder="john@example.com"
                  error={errors.email?.message}
                  {...register('email')}
                />

                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  error={errors.phone?.message}
                  {...register('phone')}
                />

                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  {...register('password')}
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="••••••••"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword')}
                />
              </div>

              <Button
                type="button"
                fullWidth
                size="lg"
                className="mt-8 font-bold text-lg group"
                onClick={handleNextStep}
              >
                Continue <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* Step 2: Role Selection */}
            <div className={step === 2 ? 'block' : 'hidden'}>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">How will you use QuickCourt?</h3>
                <p className="text-sm text-slate-500 mb-6">Choose your account type to personalize your experience.</p>

                <div className="space-y-4">
                  {/* User Role Card */}
                  <div
                    onClick={() => setValue('role', 'USER')}
                    className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${selectedRole === 'USER'
                      ? 'border-green-600 bg-green-50 shadow-md shadow-green-100'
                      : 'border-slate-200 hover:border-green-300 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex gap-4 items-start">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${selectedRole === 'USER' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className={`font-bold ${selectedRole === 'USER' ? 'text-green-900' : 'text-slate-900'}`}>Player / Enthusiast</h4>
                        <p className="text-sm text-slate-500 mt-1">I want to discover and book sports facilities to play at.</p>
                      </div>
                    </div>
                    {/* Selected check */}
                    {selectedRole === 'USER' && (
                      <div className="absolute top-5 right-5 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Owner Role Card */}
                  <div
                    onClick={() => setValue('role', 'FACILITY_OWNER')}
                    className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${selectedRole === 'FACILITY_OWNER'
                      ? 'border-green-600 bg-green-50 shadow-md shadow-green-100'
                      : 'border-slate-200 hover:border-green-300 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex gap-4 items-start">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${selectedRole === 'FACILITY_OWNER' ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                        <Building className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className={`font-bold ${selectedRole === 'FACILITY_OWNER' ? 'text-green-900' : 'text-slate-900'}`}>Facility Owner</h4>
                        <p className="text-sm text-slate-500 mt-1">I own or manage a sports facility and want to list it.</p>
                      </div>
                    </div>
                    {/* Selected check */}
                    {selectedRole === 'FACILITY_OWNER' && (
                      <div className="absolute top-5 right-5 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="w-1/3"
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  loading={isSubmitting}
                  className="w-2/3 shadow-lg shadow-green-500/30 font-bold"
                >
                  Create Account
                </Button>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
