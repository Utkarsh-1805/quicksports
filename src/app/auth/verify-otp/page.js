'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { OtpInput } from '@/components/ui/OtpInput';
import { Icon } from '@/components/ui/Icon';

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');
  const devOtp = searchParams.get('otp');

  const { verifyOtp, resendOtp, user } = useAuth();

  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [currentOtpCode, setCurrentOtpCode] = useState(devOtp);

  useEffect(() => {
    if (!email) router.push('/auth/login');
  }, [email, router]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((p) => p - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerify = async (codeToVerify = otp) => {
    if (codeToVerify.length !== 6) return;
    setError('');
    setIsVerifying(true);
    try {
      const result = await verifyOtp(email, codeToVerify);
      if (result.success) {
        const role = result.user?.role || user?.role;
        router.push(role === 'FACILITY_OWNER' ? '/owner/dashboard' : '/dashboard');
      } else {
        setError(result.error || 'Invalid verification code. Please try again.');
      }
    } catch {
      setError('An error occurred during verification.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError('');
    setSuccessMsg('');
    setIsResending(true);
    try {
      const result = await resendOtp(email);
      if (result.success) {
        setSuccessMsg('A new verification code has been sent to your email.');
        setCountdown(60);
        setOtp('');
        if (result.otpCode) setCurrentOtpCode(result.otpCode);
      } else {
        setError(result.error || 'Failed to resend code. Please try again later.');
      }
    } catch {
      setError('An error occurred while resending the code.');
    } finally {
      setIsResending(false);
    }
  };

  if (!email) return null;

  return (
    <div className="bg-surface text-on-surface min-h-screen flex items-center justify-center p-8 page-enter">
      <div className="card w-full max-w-md p-9 text-center relative">
        <Link href="/auth/login" className="absolute top-4 right-4 text-on-surface-variant hover:text-primary text-xs flex items-center gap-1">
          <Icon name="arrow_back" size={16} /> Back
        </Link>

        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center">
            <Icon name="mark_email_unread" filled size={28} />
          </div>
        </div>

        <div className="mb-7">
          <h1 className="font-display text-3xl font-semibold text-on-surface mb-2">Check your email</h1>
          <p className="text-sm text-on-surface-variant">
            We sent a 6-digit code to <span className="font-mono font-semibold text-on-surface">{email}</span>
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-1 mt-3 text-sm text-on-surface hover:text-primary transition-colors"
          >
            <Icon name="arrow_back" size={14} /> Wrong email?
          </Link>
        </div>

        {currentOtpCode && (
          <div className="mb-6 bg-secondary-fixed/40 border border-secondary-fixed-dim rounded-xl p-4 text-left">
            <p className="font-mono text-[11px] font-medium text-on-secondary-fixed-variant uppercase tracking-[0.12em] mb-1">Development Mode</p>
            <p className="text-sm text-on-secondary-fixed">Your OTP code is: <span className="font-mono font-bold text-lg tracking-widest">{currentOtpCode}</span></p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-error-container/40 border border-error/30 rounded-xl p-4 flex items-start gap-3 text-on-error-container text-left">
            <Icon name="error" size={20} />
            <div className="text-sm font-medium">{error}</div>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 bg-primary-container/30 border border-primary/30 rounded-xl p-4 flex items-start gap-3 text-on-primary-container text-left">
            <Icon name="check_circle" size={20} />
            <div className="text-sm font-medium">{successMsg}</div>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex justify-center">
            <OtpInput
              length={6}
              value={otp}
              onChange={(val) => { setOtp(val); setError(''); }}
              onComplete={(val) => handleVerify(val)}
              disabled={isVerifying}
            />
          </div>

          <button
            type="button"
            onClick={() => handleVerify(otp)}
            disabled={isVerifying || otp.length !== 6}
            className="btn btn-primary btn-lg w-full disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isVerifying ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-on-primary/30 border-t-on-primary animate-spin" />
                Verifying…
              </>
            ) : (
              <>
                Verify
                <Icon name="arrow_forward" size={20} />
              </>
            )}
          </button>

          <div className="text-center text-sm text-on-surface-variant flex items-center justify-center gap-1">
            Didn&apos;t receive the code?
            <button
              type="button"
              onClick={handleResend}
              disabled={countdown > 0 || isResending}
              className={`font-semibold ml-1 ${countdown > 0 || isResending ? 'text-on-surface-variant opacity-50 cursor-not-allowed' : 'text-primary hover:underline'}`}
            >
              {isResending ? 'Sending…' : countdown > 0 ? <>Resend in <span className="font-mono">0:{String(countdown).padStart(2, '0')}</span></> : 'Click to resend'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-4 border-outline-variant border-t-primary animate-spin" />
        </div>
      }
    >
      <VerifyOtpForm />
    </Suspense>
  );
}
