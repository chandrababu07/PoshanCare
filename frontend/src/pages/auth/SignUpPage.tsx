import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button, Input, Card, Badge } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';

export const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [viewState, setViewState] = useState<'default' | 'errors' | 'success'>('default');
  const [errorMessage, setErrorMessage] = useState('');

  // Password strength score 0 to 4
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password || password !== confirmPassword || !agreeTerms) {
      setViewState('errors');
      return;
    }
    setErrorMessage('');
    try {
      await register({ full_name: fullName, email, password });
      setViewState('success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please check your credentials.';
      setErrorMessage(message);
      setViewState('errors');
    }
  };

  return (
    <div className="space-y-6">
      {/* Interactive View State Bar (Clinical Prototype Simulator matching Stitch HTML) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-low px-4 py-2.5 rounded-xl border border-surface-container-high shadow-sm">
        <div className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-semibold text-primary">Interactive State Simulator:</span>
        </div>
        <div className="inline-flex p-1 bg-surface-container-lowest rounded-lg shadow-sm gap-1">
          <button
            type="button"
            onClick={() => setViewState('default')}
            className={`px-3 py-1.5 rounded-md font-label-md text-label-md transition-all ${
              viewState === 'default'
                ? 'bg-primary text-on-primary font-medium shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Default View
          </button>
          <button
            type="button"
            onClick={() => setViewState('errors')}
            className={`px-3 py-1.5 rounded-md font-label-md text-label-md transition-all ${
              viewState === 'errors'
                ? 'bg-error text-on-error font-medium shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Validation Errors
          </button>
          <button
            type="button"
            onClick={() => setViewState('success')}
            className={`px-3 py-1.5 rounded-md font-label-md text-label-md transition-all ${
              viewState === 'success'
                ? 'bg-tertiary-container text-on-tertiary font-medium shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Success State
          </button>
        </div>
      </div>

      {/* Main Centered Authentication Shell */}
      <Card className="w-full bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden flex flex-col lg:flex-row border border-surface-container-low min-h-[640px]">
        {/* Left Column: Form & Interaction (60% width) */}
        <div className="w-full lg:w-[60%] p-6 sm:p-10 flex flex-col justify-between">
          {viewState === 'success' ? (
            /* Success State view */
            <div className="py-12 flex flex-col items-center text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">
                  Account Created Successfully!
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-md mx-auto">
                  Your PoshanCare clinical profile has been initialized. Let's start your personalized intake onboarding.
                </p>
              </div>
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate('/onboarding')}
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                Proceed to Intake Onboarding
              </Button>
            </div>
          ) : (
            /* Registration Form View */
            <div className="space-y-6">
              {/* Header */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary font-bold shadow-sm">
                    <Sparkles className="w-5 h-5 text-primary-fixed" />
                  </div>
                  <span className="font-headline-md text-headline-md tracking-tight text-primary font-bold">
                    PoshanCare
                  </span>
                </div>
                <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight pt-1">
                  Create your PoshanCare account
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Start your personalized, evidence-based nutrition journey with clinical oversight.
                </p>
              </div>

              {/* Error Banner */}
              {viewState === 'errors' && errorMessage && (
                <div className="p-3 bg-error-container text-on-error-container rounded-xl text-label-md font-label-md flex items-center gap-2 border border-error/20">
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Form */}
              <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                <Input
                  label="Full Name"
                  placeholder="e.g. Dr. Ananya Iyer / Priya Patel"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  leftIcon={<User className="w-4 h-4 text-outline" />}
                  error={viewState === 'errors' && !fullName ? 'Please provide your full legal or clinical name' : undefined}
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4 text-outline" />}
                  error={viewState === 'errors' && !email ? 'Please enter a valid medical or personal email' : undefined}
                />

                <div>
                  <Input
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    leftIcon={<Lock className="w-4 h-4 text-outline" />}
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-on-surface-variant hover:text-on-surface focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                    error={viewState === 'errors' && password.length < 8 ? 'Password must be at least 8 characters' : undefined}
                  />

                  {/* Password Strength Meter */}
                  {password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1 h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`h-full flex-1 rounded-full transition-colors ${
                              strength >= level
                                ? strength <= 2
                                  ? 'bg-secondary'
                                  : 'bg-primary'
                                : 'bg-surface-container-high'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Strength: {strength <= 1 ? 'Weak' : strength === 2 ? 'Fair' : strength === 3 ? 'Good' : 'Strong'}
                      </span>
                    </div>
                  )}
                </div>

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4 text-outline" />}
                  error={
                    viewState === 'errors' && password !== confirmPassword
                      ? 'Passwords do not match'
                      : undefined
                  }
                />

                {/* Consent Checkbox */}
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-1 rounded border-outline-variant text-primary focus:ring-primary"
                    />
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      I agree to PoshanCare's <span className="text-primary font-semibold hover:underline">Clinical Terms of Service</span> and <span className="text-primary font-semibold hover:underline">Privacy Policy</span>.
                    </span>
                  </label>
                  {viewState === 'errors' && !agreeTerms && (
                    <p className="font-body-sm text-body-sm text-error mt-1">
                      You must agree to the clinical terms before proceeding.
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <Button variant="primary" size="lg" className="w-full" type="submit" rightIcon={<ArrowRight className="w-5 h-5" />}>
                    Create Clinical Account
                  </Button>
                </div>
              </form>

              <div className="pt-4 border-t border-surface-container-low text-center font-label-md text-label-md text-on-surface-variant">
                Already have an account?{' '}
                <Link to="/signin" className="text-primary font-semibold hover:underline">
                  Sign In
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Hero Visual Panel (40% width) */}
        <div className="w-full lg:w-[40%] bg-primary-container p-8 lg:p-12 text-on-primary flex flex-col justify-between hidden lg:flex">
          <div className="space-y-4">
            <Badge variant="tertiary" size="md" icon={<ShieldCheck className="w-4 h-4" />}>
              Encrypted Medical Intake
            </Badge>
            <h2 className="font-headline-lg text-headline-lg text-on-primary font-bold tracking-tight">
              Start your precision journey.
            </h2>
            <p className="font-body-md text-body-md text-on-primary-container leading-relaxed">
              PoshanCare adapts to your metabolic baseline, dietary preferences, and energy requirements over time.
            </p>
          </div>

          <div className="p-4 bg-primary/40 backdrop-blur-md rounded-xl border border-primary-fixed-dim/20 space-y-2">
            <p className="font-label-sm text-label-sm text-primary-fixed uppercase tracking-wider font-semibold">
              ICMR-NIN 2024 Ready
            </p>
            <p className="font-body-sm text-body-sm text-on-primary-container">
              Verified food profiles, Indian macro standards, and personalized meal distribution logs.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SignUpPage;
