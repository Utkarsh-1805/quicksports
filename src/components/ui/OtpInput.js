'use client';

import { useRef, useState, useEffect } from 'react';

export function OtpInput({
  length = 6,
  value = '',
  onChange,
  onComplete,
  disabled = false,
  error = ''
}) {
  const [otp, setOtp] = useState(new Array(length).fill(''));
  const inputRefs = useRef([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const [prevValue, setPrevValue] = useState(value);

  // Sync with external value
  if (value !== prevValue) {
    setPrevValue(value);
    if (value && value !== otp.join('')) {
      const otpArray = value.split('').slice(0, length);
      setOtp([...otpArray, ...new Array(length - otpArray.length).fill('')]);
    } else if (!value && otp.some(digit => digit !== '')) {
      setOtp(new Array(length).fill(''));
    }
  }

  const handleChange = (e, index) => {
    const val = e.target.value;

    // Only allow digits
    if (!/^\d*$/.test(val)) return;

    // Handle paste of full OTP
    if (val.length > 1) {
      const otpArray = val.slice(0, length).split('');
      const newOtp = [...new Array(length).fill('')];
      otpArray.forEach((digit, i) => {
        newOtp[i] = digit;
      });
      setOtp(newOtp);
      onChange?.(newOtp.join(''));

      // Focus last filled or last input
      const lastIndex = Math.min(otpArray.length, length) - 1;
      inputRefs.current[lastIndex]?.focus();

      // Check if complete
      if (otpArray.length >= length) {
        onComplete?.(newOtp.join(''));
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
    onChange?.(newOtp.join(''));

    // Move to next input
    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if complete
    const otpValue = newOtp.join('');
    if (otpValue.length === length && !otpValue.includes('')) {
      onComplete?.(otpValue);
    }
  };

  const handleKeyDown = (e, index) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      onChange?.(newOtp.join(''));
    }

    // Handle left arrow
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Handle right arrow
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    if (pastedData) {
      const otpArray = pastedData.slice(0, length).split('');
      const newOtp = [...new Array(length).fill('')];
      otpArray.forEach((digit, i) => {
        newOtp[i] = digit;
      });
      setOtp(newOtp);
      onChange?.(newOtp.join(''));

      const lastIndex = Math.min(otpArray.length, length) - 1;
      inputRefs.current[lastIndex]?.focus();

      if (otpArray.length >= length) {
        onComplete?.(newOtp.join(''));
      }
    }
  };

  return (
    <div className="w-full">
      <div className="flex gap-2 sm:gap-3 justify-center">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={length}
            value={digit}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            disabled={disabled}
            className={`
              w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold
              rounded-lg border-2 transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${error
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
            aria-label={`OTP digit ${index + 1}`}
          />
        ))}
      </div>
      {error && (
        <p className="mt-2 text-center text-red-500 text-sm">{error}</p>
      )}
    </div>
  );
}

export default OtpInput;
