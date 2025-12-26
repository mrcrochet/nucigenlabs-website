import { useState, useRef, useEffect } from 'react';
import { Mail, ArrowRight, RotateCcw } from 'lucide-react';
import { verifyEmailCode, createVerificationCode, incrementVerificationAttempts } from '../lib/supabase';
import { sendVerificationCodeEmail } from '../lib/email';
import { useToast } from '../hooks/useToast';

interface EmailVerificationCodeProps {
  email: string;
  name?: string;
  onVerified: () => void;
  onResend?: () => void;
}

export default function EmailVerificationCode({ email, name, onVerified, onResend }: EmailVerificationCodeProps) {
  const [code, setCode] = useState(['', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 4 digits are entered
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 4) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{4}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setCode(digits);
      inputRefs.current[3]?.focus();
      // Auto-verify
      setTimeout(() => handleVerify(pastedData), 100);
    }
  };

  const handleVerify = async (codeToVerify?: string) => {
    const codeString = codeToVerify || code.join('');
    
    if (codeString.length !== 4 || !/^\d{4}$/.test(codeString)) {
      showToast('Please enter a valid 4-digit code', 'error');
      return;
    }

    setIsVerifying(true);

    try {
      const isValid = await verifyEmailCode(email, codeString);
      
      if (isValid) {
        showToast('Email verified successfully!', 'success');
        onVerified();
      } else {
        // Increment attempts for tracking
        await incrementVerificationAttempts(email, codeString);
        showToast('Invalid or expired code. Please try again.', 'error');
        setCode(['', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to verify code';
      showToast(message, 'error');
      setCode(['', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);

    try {
      const newCode = await createVerificationCode(email);
      const emailSent = await sendVerificationCodeEmail({
        to: email,
        code: newCode,
        name,
      });
      
      if (!emailSent) {
        showToast('Failed to resend email. Please check the console for details.', 'error');
        console.error('Email resend failed. Check console for details.');
        return;
      }
      
      showToast('Verification code sent! Check your email.', 'success');
      setCode(['', '', '', '']);
      inputRefs.current[0]?.focus();
      
      if (onResend) {
        onResend();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to resend code';
      console.error('Error in handleResend:', error);
      showToast(message, 'error');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#E1463E]/20 border border-[#E1463E]/30 mb-4">
          <Mail size={32} className="text-[#E1463E]" />
        </div>
        <h3 className="text-2xl font-light text-white mb-2">Verify your email</h3>
        <p className="text-sm text-slate-400 font-light">
          We sent a 4-digit code to <span className="text-white font-normal">{email}</span>
        </p>
        <p className="text-xs text-slate-500 font-light mt-2">
          Enter the code below to confirm your email address
        </p>
      </div>

      <div className="flex justify-center gap-3">
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={index === 0 ? handlePaste : undefined}
            disabled={isVerifying}
            className="w-16 h-16 text-center text-2xl font-semibold bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#E1463E] focus:ring-2 focus:ring-[#E1463E]/20 transition-all disabled:opacity-50"
            aria-label={`Digit ${index + 1} of verification code`}
          />
        ))}
      </div>

      <div className="flex flex-col items-center gap-4">
        <button
          onClick={() => handleVerify()}
          disabled={isVerifying || code.join('').length !== 4}
          className="w-full sm:w-auto px-8 py-3 bg-[#E1463E] hover:bg-[#E1463E]/90 text-white font-normal rounded-lg transition-all duration-150 hover:scale-105 hover:shadow-[0_0_25px_rgba(225,70,62,0.35)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
        >
          {isVerifying ? 'Verifying...' : 'Verify Email'}
          {!isVerifying && <ArrowRight size={18} />}
        </button>

        <button
          onClick={handleResend}
          disabled={isResending}
          className="text-sm text-slate-400 hover:text-slate-300 font-light transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <RotateCcw size={16} className={isResending ? 'animate-spin' : ''} />
          {isResending ? 'Sending...' : "Didn't receive the code? Resend"}
        </button>
      </div>

      <p className="text-xs text-slate-600 font-light text-center">
        The code will expire in 15 minutes
      </p>
    </div>
  );
}

