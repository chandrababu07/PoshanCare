import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { Button, Input, Card, Badge } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { fetchUserProfile } from '../../services/profileService';

export const SignInPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [viewState, setViewState] = useState<'default' | 'error' | 'loading'>('default');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setViewState('error');
      setErrorMessage('Please enter a valid clinical or personal email address.');
      return;
    }
    if (!password || password.length < 6) {
      setViewState('error');
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setViewState('loading');
    setErrorMessage('');
    try {
      await login({ email, password });
      setViewState('default');
      const profile = await fetchUserProfile();
      const fromPath = (location.state as { from?: { pathname: string } })?.from?.pathname;
      if (profile?.onboarding_completed) {
        navigate(fromPath || '/app');
      } else {
        navigate('/onboarding');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to authenticate. Please review your email and password credentials.';
      setViewState('error');
      setErrorMessage(message);
    }
  };


  return (
    <div className="space-y-6">
      {/* Interactive State Playground Controller (Design Review Aid matching Stitch HTML) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-container-low px-4 py-2.5 rounded-xl border border-surface-container-high shadow-sm">
        <div className="flex items-center gap-2 text-on-surface-variant font-label-md text-label-md">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-semibold text-primary">UI Evaluation State:</span>
        </div>
        <div className="inline-flex p-1 bg-surface-container rounded-lg gap-1">
          <button
            type="button"
            onClick={() => {
              setViewState('default');
              setErrorMessage('');
            }}
            className={`px-3 py-1 text-label-sm font-label-sm rounded-md transition-all ${
              viewState === 'default'
                ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Default State
          </button>
          <button
            type="button"
            onClick={() => {
              setViewState('error');
              setErrorMessage('Unable to authenticate. Please review your email and password credentials.');
            }}
            className={`px-3 py-1 text-label-sm font-label-sm rounded-md transition-all ${
              viewState === 'error'
                ? 'bg-surface-container-lowest text-error shadow-sm font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Inline Error State
          </button>
          <button
            type="button"
            onClick={() => setViewState('loading')}
            className={`px-3 py-1 text-label-sm font-label-sm rounded-md transition-all ${
              viewState === 'loading'
                ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Loading / Submitting
          </button>
        </div>
      </div>

      {/* Main Double-Sided Sign In Unit */}
      <Card className="w-full bg-surface-container-lowest rounded-xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-surface-container-low min-h-[620px]">
        {/* Left Column: Form & Interaction (60% Desktop) */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
          <div>
            {/* Brand Header */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center text-primary shadow-sm">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-primary leading-none tracking-tight">
                  PoshanCare
                </span>
                <span className="font-label-sm text-label-sm text-outline tracking-wider uppercase mt-1">
                  Metabolic Precision
                </span>
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-1 mb-6">
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
                Welcome back
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Sign in to continue your personalized nutrition and biomarker tracking.
              </p>
            </div>

            {/* Global Alert Banner (Error State) */}
            {viewState === 'error' && (
              <div className="mb-6 p-4 rounded-xl bg-error-container text-on-error-container font-body-sm text-body-sm flex items-start gap-3 shadow-sm border border-error/20">
                <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-label-md text-label-md font-semibold text-error">Unable to authenticate</p>
                  <p className="text-on-error-container mt-0.5">
                    {errorMessage || 'Please review your email and password credentials and try again.'}
                  </p>
                </div>
              </div>
            )}

            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              <Input
                label="Email Address"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4 text-outline" />}
                error={viewState === 'error' && !email ? 'Email address is required' : undefined}
              />

              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4 text-outline" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-on-surface-variant hover:text-on-surface focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                error={viewState === 'error' && !password ? 'Password is required' : undefined}
              />

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 font-label-md text-label-md text-on-surface cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-outline-variant text-primary focus:ring-primary"
                  />
                  <span>Remember this device</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="font-label-md text-label-md text-primary hover:underline font-semibold"
                >
                  Forgot password?
                </Link>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={viewState === 'loading'}
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  Sign In to PoshanCare
                </Button>
              </div>
            </form>
          </div>

          <div className="pt-6 border-t border-surface-container-low mt-8 flex items-center justify-between font-label-md text-label-md text-on-surface-variant">
            <span>Don't have an account?</span>
            <Link to="/signup" className="text-primary font-semibold hover:underline">
              Create an account
            </Link>
          </div>
        </div>

        {/* Right Column: Hero Visual Side (40% Desktop) */}
        <div className="lg:col-span-5 bg-primary-container p-8 sm:p-12 text-on-primary flex flex-col justify-between relative overflow-hidden hidden lg:flex">
          <div className="space-y-4 relative z-10">
            <Badge variant="tertiary" size="md">
              Clinical Protocol v3.2
            </Badge>

            <h2 className="font-headline-lg text-headline-lg text-on-primary tracking-tight leading-tight font-bold">
              Precision Nutrition Engine
            </h2>

            <p className="font-body-md text-body-md text-on-primary-container leading-relaxed">
              Real-time ICMR-NIN 2024 database integration, micro/macro balancing, and automated TDEE adjustment.
            </p>
          </div>

          <div className="relative z-10 p-4 bg-primary/40 backdrop-blur-md rounded-xl border border-primary-fixed-dim/20">
            <p className="font-label-sm text-label-sm text-primary-fixed uppercase tracking-wider font-semibold">
              Did you know?
            </p>
            <p className="font-body-sm text-body-sm text-on-primary-container mt-1">
              Tracking protein distribution across meals improves muscle protein synthesis by up to 28%.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SignInPage;
