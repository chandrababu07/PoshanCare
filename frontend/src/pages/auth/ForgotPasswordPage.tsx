import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  KeyRound,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCcw,
  Sliders,
  ShieldCheck,
  HelpCircle,
  MailCheck,
  LifeBuoy,
  Loader2,
  Info,
} from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('priya.patel@example.com');
  const [simState, setSimState] = useState<'form' | 'success' | 'error'>('form');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer states
  const [resendSeconds, setResendSeconds] = useState(60);
  const [resendActive, setResendActive] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(299);

  // Resend timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendActive && resendSeconds > 0) {
      interval = setInterval(() => {
        setResendSeconds((prev) => prev - 1);
      }, 1000);
    } else if (resendSeconds === 0) {
      setResendActive(false);
    }
    return () => clearInterval(interval);
  }, [resendActive, resendSeconds]);

  // Rate limit error cooldown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (simState === 'error' && cooldownSeconds > 0) {
      interval = setInterval(() => {
        setCooldownSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [simState, cooldownSeconds]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@') || !email.includes('.')) {
      setEmailError('Please enter a valid clinical account email address.');
      return;
    }
    setEmailError('');
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setSimState('success');
      setResendSeconds(60);
      setResendActive(true);
    }, 950);
  };

  const triggerResend = () => {
    if (resendActive && resendSeconds > 0) return;
    setResendSeconds(60);
    setResendActive(true);
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto py-4">
      {/* Interactive State Controller & Preview Rail */}
      <div className="w-full mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 bg-surface-container-low px-4 py-2.5 rounded-xl border border-surface-container-high shadow-xs">
        <div className="flex items-center gap-2 text-primary font-label-sm text-label-sm">
          <Sliders className="w-4 h-4" />
          <span className="font-medium">Preview Simulation Mode:</span>
        </div>
        <div className="flex items-center bg-surface-container p-1 rounded-lg gap-1">
          <button
            type="button"
            onClick={() => setSimState('form')}
            className={`px-3 py-1 text-label-sm rounded transition-all font-label-md ${
              simState === 'form'
                ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            1. Request Link
          </button>
          <button
            type="button"
            onClick={() => {
              setSimState('success');
              setResendSeconds(60);
              setResendActive(true);
            }}
            className={`px-3 py-1 text-label-sm rounded transition-all font-label-md ${
              simState === 'success'
                ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            2. Email Sent
          </button>
          <button
            type="button"
            onClick={() => setSimState('error')}
            className={`px-3 py-1 text-label-sm rounded transition-all font-label-md ${
              simState === 'error'
                ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            3. Rate Limited
          </button>
        </div>
      </div>

      {/* Main Authenticated Security Container */}
      <div className="w-full bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden relative border border-surface-container-low">
        {/* Subtle Decorative Accents */}
        <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-primary-fixed/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-56 h-56 rounded-full bg-secondary-fixed/20 blur-3xl pointer-events-none" />

        {/* Clinical Verification Ribbon */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary-container via-primary-fixed-dim to-secondary-container" />

        <div className="p-6 sm:p-10 relative z-10">
          {/* ========================================== */}
          {/* STATE 1: FORM INPUT (REQUEST RESET LINK)    */}
          {/* ========================================== */}
          {simState === 'form' && (
            <div className="transition-all duration-300 flex flex-col">
              {/* Botanical Shield Emblem */}
              <div className="w-14 h-14 rounded-2xl bg-primary-fixed flex items-center justify-center mb-6 text-primary shadow-xs">
                <KeyRound className="w-7 h-7" />
              </div>

              <div className="space-y-1 mb-6">
                <span className="font-label-sm uppercase tracking-wider text-secondary font-semibold">
                  Clinical Account Security
                </span>
                <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
                  Reset your password
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Enter the email address associated with your PoshanCare intelligence profile and
                  we’ll dispatch a secure, encrypted authentication link.
                </p>
              </div>

              {/* Form Submission Area */}
              <form onSubmit={handleFormSubmit} className="space-y-6" noValidate>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="recovery-email"
                      className="font-label-lg text-label-lg text-on-surface font-semibold flex items-center gap-1.5"
                    >
                      <span>Email Address</span>
                      <span className="text-error font-body-sm">*</span>
                    </label>
                    <span className="font-label-sm text-outline text-[11px] flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      256-Bit SSL
                    </span>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
                      <Mail className="w-5 h-5" />
                    </div>
                    <input
                      id="recovery-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError('');
                      }}
                      placeholder="name@clinicaldomain.com"
                      className={`w-full h-12 pl-11 pr-4 bg-surface-container-low text-on-surface rounded-lg placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container font-body-md transition-all ${
                        emailError ? 'ring-2 ring-error bg-error-container/20' : ''
                      }`}
                    />
                  </div>

                  {/* Contextual Field Micro-Guidance */}
                  <div className="flex items-start gap-1.5 pt-1 text-on-surface-variant">
                    <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-tight">
                      We will send a secure, time-limited verification link valid for 15 minutes.
                    </p>
                  </div>

                  {emailError && (
                    <div className="flex items-center gap-1 text-error text-body-sm mt-1">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{emailError}</span>
                    </div>
                  )}
                </div>

                {/* Primary CTA */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] disabled:opacity-70 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span>Sending Verification...</span>
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </>
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                {/* Back to Auth Flow */}
                <div className="pt-2 flex items-center justify-center">
                  <Link
                    to="/signin"
                    className="group inline-flex items-center gap-1.5 font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors py-1"
                  >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    <span>
                      Remember your password? <strong>Back to Sign In</strong>
                    </span>
                  </Link>
                </div>
              </form>

              {/* Zero-Knowledge Clinical Privacy Disclaimer */}
              <div className="mt-8 pt-4 border-t border-outline-variant/30 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="font-body-sm text-body-sm text-on-surface-variant/90 leading-relaxed">
                  <strong>Privacy Safeguard:</strong> In strict accordance with clinical
                  zero-knowledge standards, PoshanCare never exposes registered identities to
                  unverified requests.
                </p>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* STATE 2: SUCCESS VIEW (EMAIL DISPATCHED)   */}
          {/* ========================================== */}
          {simState === 'success' && (
            <div className="transition-all duration-300 flex flex-col text-center">
              {/* Animated Enclosure & Pulsing Badge */}
              <div className="mx-auto mb-6 relative flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-primary-fixed/40 animate-ping absolute" />
                <div className="w-20 h-20 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center relative shadow-md">
                  <MailCheck className="w-10 h-10" />
                </div>
              </div>

              <div className="space-y-1 mb-6">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary-fixed text-primary font-label-sm text-label-sm font-semibold mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Dispatch Confirmed
                </span>
                <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
                  Check your email
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto leading-relaxed">
                  If an account exists for{' '}
                  <span className="font-semibold text-on-surface underline decoration-primary/40 underline-offset-4">
                    {email}
                  </span>
                  , you will receive password recovery instructions within 2 minutes.
                </p>
              </div>

              {/* Interactive Diagnostic Step Callout */}
              <div className="w-full bg-surface-container-low rounded-xl p-4 sm:p-5 text-left mb-6 flex flex-col gap-2 border border-surface-container">
                <div className="flex items-center gap-2 text-primary font-title-md text-title-md font-semibold">
                  <HelpCircle className="w-5 h-5" />
                  <span>Haven't seen the link yet?</span>
                </div>
                <ul className="space-y-2 pt-1 font-body-sm text-body-sm text-on-surface-variant">
                  <li className="flex items-start gap-2">
                    <Mail className="w-4 h-4 text-outline shrink-0 mt-0.5" />
                    <span>Check your hospital or corporate firewall spam/quarantine folders.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-outline shrink-0 mt-0.5" />
                    <span>
                      Reset tokens expire automatically after <strong>15 minutes</strong> for
                      dietary data integrity.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Dual Action Layout */}
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={triggerResend}
                  disabled={resendActive && resendSeconds > 0}
                  className="w-full h-12 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-lg text-label-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>
                    {resendActive && resendSeconds > 0
                      ? 'Resend available in'
                      : 'Resend recovery email'}
                  </span>
                  {resendActive && resendSeconds > 0 && (
                    <span className="font-mono font-semibold text-secondary ml-1">
                      ({resendSeconds}s)
                    </span>
                  )}
                </button>

                <Link
                  to="/signin"
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-sm transition-colors font-semibold"
                >
                  <span>Return to Secure Sign In</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* STATE 3: ERROR / RATE-LIMIT STATE          */}
          {/* ========================================== */}
          {simState === 'error' && (
            <div className="transition-all duration-300 flex flex-col">
              <div className="w-14 h-14 rounded-2xl bg-error-container flex items-center justify-center mb-6 text-error shadow-xs">
                <Clock className="w-7 h-7" />
              </div>

              <div className="space-y-1 mb-6">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-error-container text-error font-label-sm font-semibold mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Rate Limit Safeguard Active
                </div>
                <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
                  Too many reset attempts
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  In adherence to healthcare IT security regulations, password recovery requests
                  for this device address have been temporarily paused to prevent unauthorized
                  brute-force attempts.
                </p>
              </div>

              <div className="bg-surface-container p-4 rounded-xl mb-6 flex items-center gap-4 border border-surface-container-high">
                <div className="w-12 h-12 rounded-lg bg-surface-container-lowest flex items-center justify-center shrink-0 text-error shadow-xs">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-label-sm text-outline uppercase tracking-wider font-semibold">
                    Cooldown remaining
                  </span>
                  <div className="font-headline-md text-headline-md font-mono text-on-surface font-bold">
                    {formatTimer(cooldownSeconds)}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setSimState('form')}
                  className="w-full h-12 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 transition-colors font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Try Another Verification Address</span>
                </button>

                <a
                  href="mailto:support@poshancare.com"
                  className="w-full h-11 rounded-xl bg-transparent hover:bg-surface-container-low text-on-surface-variant hover:text-primary font-label-md text-label-md flex items-center justify-center gap-1.5 transition-colors font-medium"
                >
                  <LifeBuoy className="w-5 h-5" />
                  <span>Contact PoshanCare Clinical Desk</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Security Footprint Meta-Strip */}
        <div className="px-6 py-3.5 bg-surface-container-low/60 border-t border-surface-container-low flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-outline font-label-sm">
            <Lock className="w-3.5 h-3.5" />
            <span>PoshanCare SafePass™ Protocol</span>
          </div>
          <div className="flex items-center gap-3 text-outline font-label-sm">
            <span>TLS 1.3 Certified</span>
            <span>•</span>
            <span>Audit Ref: #PC-9942B</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
