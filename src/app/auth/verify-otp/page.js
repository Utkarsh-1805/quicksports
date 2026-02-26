'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui';
import { OtpInput } from '@/components/ui/OtpInput';
import { Zap, AlertCircle, ArrowLeft, MailCheck } from 'lucide-react';

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  const { verifyOtp, resendOtp, user } = useAuth();

  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [countdown, setCountdown] = useState(60);

  // Redirect if no email is provided
  useEffect(() => {
    if (!email) {
      router.push('/auth/login');
    }
  }, [email, router]);

  // Handle countdown timer for resend
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
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
        // Successful verification will update the user state 
        // We handle routing dynamically based on user role 
        // (usually the AuthContext returns the updated user inside result.user)
        const role = result.user?.role || user?.role;
        router.push(role === 'FACILITY_OWNER' ? '/owner/dashboard' : '/dashboard');
      } else {
        setError(result.error || 'Invalid verification code. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during verification.');
    } finally {
      setIsVerifying(false);
      // Reset OTP input if error occurred
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
        setOtp(''); // Clear current input
      } else {
        setError(result.error || 'Failed to resend code. Please try again later.');
      }
    } catch (err) {
      setError('An error occurred while resending the code.');
    } finally {
      setIsResending(false);
    }
  };

  if (!email) return null;

  return (
    <div className="bg-white py-10 px-4 shadow-xl shadow-slate-200/50 sm:rounded-2xl sm:px-10 border border-slate-100">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MailCheck className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Check your email</h3>
        <p className="text-sm text-slate-500">
          We&apos;ve sent a 6-digit verification code to<br />
          <span className="font-semibold text-slate-900">{email}</span>
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-500" />
          <div className="text-sm font-medium">{error}</div>
        </div>
      )}

      {successMsg && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3 text-green-700">
          <MailCheck className="w-5 h-5 shrink-0 mt-0.5 text-green-600" />
          <div className="text-sm font-medium">{successMsg}</div>
        </div>
      )}

      <div className="space-y-8">
        <div className="flex flex-col items-center">
          <OtpInput
            length={6}
            value={otp}
            onChange={(val) => {
              setOtp(val);
              setError('');
            }}
            onComplete={(val) => {
              handleVerify(val);
            }}
            disabled={isVerifying}
          />
        </div>

        <Button
          type="button"
          fullWidth
          size="lg"
          className="font-bold shadow-lg shadow-green-500/30 group"
          onClick={() => handleVerify(otp)}
          loading={isVerifying}
          disabled={otp.length !== 6}
        >
          Verify OTP
        </Button>

        <div className="text-center mt-6">
          <p className="text-sm text-slate-600 mb-2">Didn&apos;t receive the code?</p>
          <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0 || isResending}
            className={`text-sm font-medium transition-colors ${countdown > 0 || isResending
              ? 'text-slate-400 cursor-not-allowed'
              : 'text-green-600 hover:text-green-700'
              }`}
          >
            {isResending ? (
              'Sending...'
            ) : countdown > 0 ? (
              `Resend code in ${countdown}s`
            ) : (
              'Click to resend'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Fallback loader for Suspense
function FormSkeleton() {
  return (
    <div className="bg-white py-10 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-slate-100 flex flex-col items-center justify-center min-h-[400px]">
      <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
      <p className="text-slate-500 font-medium">Loading verification...</p>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-green-500 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-between items-center mb-8">
          <Link href="/auth/login" className="flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors group">
            <ArrowLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Back to login
          </Link>

          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Quick<span className="text-green-600">Court</span>
            </span>
          </Link>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Suspense fallback={<FormSkeleton />}>
          <VerifyOtpForm />
        </Suspense>
      </div>
    </div>
  );
}
