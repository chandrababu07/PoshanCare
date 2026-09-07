import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sliders,
  ShieldCheck,
  Check,
  Loader2,
  Clock,
  Send,
  UserCheck,
} from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const [simState, setSimState] = useState<'form' | 'success' | 'expired'>('form');

  // Password fields state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation rules calculation
  const ruleLen = newPassword.length >= 8;
  const ruleUpper = /[A-Z]/.test(newPassword);
  const ruleSymbol = /[\d!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const ruleDiff = newPassword.length > 0 && !newPassword.toLowerCase().includes('poshan');

  const passwordsMatch =
    confirmPassword.length > 0 && newPassword === confirmPassword;

  // Strength score
  let strengthScore = 0;
  if (newPassword.length > 0) strengthScore++;
  if (ruleLen && (ruleUpper || ruleSymbol)) strengthScore++;
  if (ruleLen && ruleUpper && ruleSymbol && ruleDiff && newPassword.length >= 10)
    strengthScore++;

  const getStrengthBadge = () => {
    if (newPassword.length === 0) {
      return {
        label: 'Pending',
        classes: 'bg-surface-container text-on-surface-variant',
      };
    }
    if (strengthScore === 1) {
      return { label: 'Weak', classes: 'bg-error-container text-error font-semibold' };
    }
    if (strengthScore === 2) {
      return {
        label: 'Fair',
        classes: 'bg-secondary-fixed text-on-secondary-fixed-variant font-semibold',
      };
    }
    return {
      label: 'Strong',
      classes: 'bg-primary-fixed text-primary font-semibold',
    };
  };

  const strengthBadge = getStrengthBadge();

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleLen || !ruleUpper || !ruleSymbol) return;
    if (newPassword !== confirmPassword) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSimState('success');
    }, 1100);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto py-4">
      {/* Subtle Clinical Ambient Glow */}
      <div className="relative w-full">
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-primary-fixed/30 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-secondary-fixed/20 rounded-full blur-3xl pointer-events-none -z-10" />

        {/* Prototype State Switcher Toolbar */}
        <div className="flex items-center justify-between bg-surface-container-low px-4 py-2 rounded-xl mb-6 shadow-xs border border-surface-container-high">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-primary" />
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
              Preview State:
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSimState('form')}
              className={`px-2.5 py-1 rounded-lg font-label-sm text-label-sm transition-all ${
                simState === 'form'
                  ? 'bg-primary text-on-primary font-semibold shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Form
            </button>
            <button
              type="button"
              onClick={() => setSimState('success')}
              className={`px-2.5 py-1 rounded-lg font-label-sm text-label-sm transition-all ${
                simState === 'success'
                  ? 'bg-primary text-on-primary font-semibold shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Success
            </button>
            <button
              type="button"
              onClick={() => setSimState('expired')}
              className={`px-2.5 py-1 rounded-lg font-label-sm text-label-sm transition-all ${
                simState === 'expired'
                  ? 'bg-primary text-on-primary font-semibold shadow-xs'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Expired
            </button>
          </div>
        </div>

        {/* Main Authentication Card */}
        <div className="w-full bg-surface-container-lowest rounded-2xl shadow-xl p-6 sm:p-10 relative overflow-hidden transition-all duration-300 border border-surface-container-low">
          {/* Top Clinical Accreditation Accent Strip */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-tertiary to-secondary-container" />

          {/* ========================================== */}
          {/* STATE 1: FORM STATE (Create new password)  */}
          {/* ========================================== */}
          {simState === 'form' && (
            <div className="flex flex-col">
              {/* Header Badge & Intro */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary-fixed/40 flex items-center justify-center text-primary mb-3.5 shadow-xs">
                  <Lock className="w-6 h-6" />
                </div>
                <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest font-semibold mb-1">
                  Account Security Protocol
                </span>
                <h1 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                  Create a new password
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                  Choose a new password for your PoshanCare clinical portal.
                </p>

                {/* Identity Chip Indicator */}
                <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-surface-container-low text-on-surface-variant border border-surface-container">
                  <UserCheck className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-label-md text-label-md">
                    Resetting password for:{' '}
                    <strong className="text-on-surface font-semibold tracking-normal">
                      p•••••@example.com
                    </strong>
                  </span>
                </div>
              </div>

              <form onSubmit={handleFormSubmit} className="flex flex-col gap-5" noValidate>
                {/* Field 1: New Password */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="new-password"
                      className="font-label-lg text-label-lg font-medium text-on-surface flex items-center gap-1.5"
                    >
                      <span>New Password</span>
                      <span className="text-error">*</span>
                    </label>
                    <span
                      className={`font-label-sm text-label-sm uppercase font-semibold px-2 py-0.5 rounded-full transition-colors ${strengthBadge.classes}`}
                    >
                      {strengthBadge.label}
                    </span>
                  </div>

                  <div className="relative flex items-center">
                    <input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter 8+ characters with uppercase & symbols"
                      className="w-full h-12 px-3.5 pr-11 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline font-body-md text-body-md focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary transition-all border border-surface-container-high"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 p-1 rounded-md text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center cursor-pointer"
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Password Strength 3-Tier Meter Bar */}
                  <div className="mt-1 flex flex-col gap-1.5">
                    <div className="grid grid-cols-3 gap-1.5 h-1.5 w-full bg-surface-container rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          strengthScore >= 1
                            ? strengthScore === 1
                              ? 'bg-error'
                              : strengthScore === 2
                              ? 'bg-secondary-container'
                              : 'bg-primary'
                            : 'bg-transparent'
                        }`}
                      />
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          strengthScore >= 2
                            ? strengthScore === 2
                              ? 'bg-secondary-container'
                              : 'bg-primary'
                            : 'bg-transparent'
                        }`}
                      />
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          strengthScore >= 3 ? 'bg-primary' : 'bg-transparent'
                        }`}
                      />
                    </div>

                    {/* Real-time Validation Checklist */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 pt-2">
                      <div
                        className={`flex items-center gap-2 transition-colors ${
                          ruleLen ? 'text-primary font-medium' : 'text-on-surface-variant'
                        }`}
                      >
                        {ruleLen ? (
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-outline-variant shrink-0" />
                        )}
                        <span className="font-label-sm text-label-sm">At least 8 characters</span>
                      </div>

                      <div
                        className={`flex items-center gap-2 transition-colors ${
                          ruleUpper ? 'text-primary font-medium' : 'text-on-surface-variant'
                        }`}
                      >
                        {ruleUpper ? (
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-outline-variant shrink-0" />
                        )}
                        <span className="font-label-sm text-label-sm">
                          Contains an uppercase letter
                        </span>
                      </div>

                      <div
                        className={`flex items-center gap-2 transition-colors ${
                          ruleSymbol ? 'text-primary font-medium' : 'text-on-surface-variant'
                        }`}
                      >
                        {ruleSymbol ? (
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-outline-variant shrink-0" />
                        )}
                        <span className="font-label-sm text-label-sm">
                          Contains number or symbol
                        </span>
                      </div>

                      <div
                        className={`flex items-center gap-2 transition-colors ${
                          ruleDiff ? 'text-primary font-medium' : 'text-on-surface-variant'
                        }`}
                      >
                        {ruleDiff ? (
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-outline-variant shrink-0" />
                        )}
                        <span className="font-label-sm text-label-sm">Not previously used</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Field 2: Confirm Password */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="confirm-password"
                      className="font-label-lg text-label-lg font-medium text-on-surface flex items-center gap-1.5"
                    >
                      <span>Confirm New Password</span>
                      <span className="text-error">*</span>
                    </label>
                    {confirmPassword.length > 0 && (
                      <div
                        className={`flex items-center gap-1 font-label-sm text-label-sm font-medium ${
                          passwordsMatch ? 'text-primary' : 'text-error'
                        }`}
                      >
                        {passwordsMatch ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Passwords match</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Passwords do not match</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="relative flex items-center">
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      className={`w-full h-12 px-3.5 pr-11 rounded-lg bg-surface-container-low text-on-surface placeholder:text-outline font-body-md text-body-md focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary transition-all border border-surface-container-high ${
                        confirmPassword.length > 0 && !passwordsMatch
                          ? 'ring-2 ring-error bg-error-container/20'
                          : ''
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 p-1 rounded-md text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Clinical Security Disclaimer Box */}
                <div className="rounded-xl bg-surface-container-low p-3.5 flex items-start gap-3 text-on-surface-variant border border-surface-container">
                  <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="font-body-sm text-body-sm leading-relaxed">
                    <strong className="font-semibold text-on-surface">Security assurance:</strong>{' '}
                    Updating your password will immediately sign you out of all other active
                    PoshanCare clinical dashboard sessions.
                  </p>
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !ruleLen || !ruleUpper || !ruleSymbol || !passwordsMatch}
                  className="w-full h-12 mt-2 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-semibold hover:bg-primary-container active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <span>Updating Password...</span>
                      <Loader2 className="w-5 h-5 animate-spin" />
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </button>
              </form>

              <div className="text-center mt-6 pt-5 border-t border-surface-container-high">
                <Link
                  to="/signin"
                  className="inline-flex items-center gap-1.5 font-label-md text-label-md text-primary font-medium hover:underline"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to PoshanCare sign-in</span>
                </Link>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* STATE 2: SUCCESS STATE (Password updated)  */}
          {/* ========================================== */}
          {simState === 'success' && (
            <div className="flex flex-col items-center text-center py-4">
              {/* Success Emblem Animation Ring */}
              <div className="relative w-20 h-20 flex items-center justify-center mb-5">
                <div className="absolute inset-0 rounded-full bg-primary-fixed/40 animate-ping opacity-30" />
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/25 text-on-primary">
                  <ShieldCheck className="w-8 h-8" />
                </div>
              </div>

              <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest font-semibold mb-1">
                Credential Synchronization Complete
              </span>
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                Password updated
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mt-2 leading-relaxed">
                Your PoshanCare credentials have been securely updated. All previous active browser
                tokens have been revoked.
              </p>

              {/* Summary Clinical Badge */}
              <div className="w-full max-w-md bg-surface-container-low rounded-xl p-4 my-6 flex flex-col gap-2.5 text-left border border-surface-container">
                <div className="flex items-center justify-between text-on-surface">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Authentication Status
                  </span>
                  <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary font-semibold bg-primary-fixed/40 px-2 py-0.5 rounded-md">
                    <Check className="w-3.5 h-3.5" /> Validated & Synced
                  </span>
                </div>
                <div className="flex items-center justify-between text-on-surface">
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Revocation Policy
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface font-medium">
                    All previous sessions cleared
                  </span>
                </div>
              </div>

              {/* Success CTA */}
              <Link
                to="/signin"
                className="w-full max-w-md h-12 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-semibold hover:bg-primary-container active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20"
              >
                <span>Continue to Sign In</span>
                <ArrowRight className="w-5 h-5" />
              </Link>

              <p className="font-body-sm text-body-sm text-outline mt-4">
                Need clinical assistance?{' '}
                <a href="mailto:support@poshancare.com" className="text-primary hover:underline font-medium">
                  Contact Dietary Security Desk
                </a>
              </p>
            </div>
          )}

          {/* ========================================== */}
          {/* STATE 3: EXPIRED TOKEN STATE               */}
          {/* ========================================== */}
          {simState === 'expired' && (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-16 h-16 rounded-full bg-error-container/60 flex items-center justify-center text-error mb-4 shadow-xs">
                <Clock className="w-8 h-8" />
              </div>

              <span className="font-label-sm text-label-sm text-error uppercase tracking-widest font-semibold mb-1">
                Time Window Elapsed
              </span>
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight">
                Security token expired
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mt-2 leading-relaxed">
                For your clinical data privacy, PoshanCare recovery links automatically expire after
                15 minutes. This link can no longer be used.
              </p>

              <div className="w-full max-w-md bg-error-container/20 rounded-xl p-4 my-6 flex items-start gap-3 text-left border border-error-container/30">
                <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                <p className="font-body-sm text-body-sm text-on-surface">
                  Please request a fresh reset link sent to your registered healthcare contact
                  address.
                </p>
              </div>

              <div className="w-full max-w-md flex flex-col gap-3">
                <Link
                  to="/forgot-password"
                  className="w-full h-12 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg font-semibold hover:bg-primary-container active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20"
                >
                  <Send className="w-4 h-4" />
                  <span>Request New Reset Link</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setSimState('form')}
                  className="w-full h-11 rounded-xl bg-surface-container-low text-on-surface font-label-md text-label-md font-medium hover:bg-surface-container transition-colors cursor-pointer"
                >
                  Back to Password Form
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security Micro-Trust Footer Badge */}
        <div className="mt-6 py-3 flex items-center justify-center gap-4 text-on-surface-variant/80 text-center">
          <div className="flex items-center gap-1.5 font-label-sm text-label-sm">
            <Lock className="w-3.5 h-3.5 text-primary" />
            <span>256-Bit SHA Encrypted</span>
          </div>
          <span className="text-outline-variant font-body-sm">•</span>
          <div className="flex items-center gap-1.5 font-label-sm text-label-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>HIPAA / DISHA Compliant</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
