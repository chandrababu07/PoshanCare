import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Activity,
  Brain,
  PieChart,
  TrendingUp,
  CheckCircle2,
  Database,
} from 'lucide-react';
import { Button, Card, Badge, Progress } from '../../components/ui';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-surface flex flex-col font-body-md text-on-surface antialiased selection:bg-primary-fixed selection:text-on-primary-fixed">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-surface-container-low shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary font-bold shadow-sm">
              <Sparkles className="w-4 h-4 text-primary-fixed" />
            </div>
            <span className="font-title-md text-title-md text-primary tracking-tight font-bold">
              PoshanCare
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 font-body-md text-body-md">
            <a href="#hero" className="text-primary font-semibold transition-colors">
              Home
            </a>
            <a href="#features" className="text-on-surface-variant hover:text-on-surface transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-on-surface-variant hover:text-on-surface transition-colors">
              How It Works
            </a>
            <a href="#food-intelligence" className="text-on-surface-variant hover:text-on-surface transition-colors">
              Indian Food Intelligence
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/signin">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="w-full pt-16 bg-surface flex-1">
        {/* 1. HERO SECTION */}
        <section id="hero" className="w-full py-12 lg:py-20 bg-surface">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Headline & Action */}
              <div className="lg:col-span-6 flex flex-col gap-6">
                {/* Tagline Pill */}
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container rounded-full w-fit">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider font-semibold">
                    Personalized • Evidence-informed • Indian food focused
                  </span>
                </div>

                {/* Headline */}
                <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight leading-tight">
                  Nutrition intelligence built around <span className="text-primary font-bold">you</span>.
                </h1>

                {/* Body Copy */}
                <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed max-w-xl">
                  Understand what you eat, track your progress, and build a personalized nutrition routine with evidence-informed insights designed for real life.
                </p>

                {/* Action CTAs */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link to="/signup">
                    <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                      Get Started
                    </Button>
                  </Link>
                  <a href="#features">
                    <Button variant="outline" size="lg">
                      Explore PoshanCare
                    </Button>
                  </a>
                </div>

                {/* Micro Assurance Notes */}
                <div className="flex items-center gap-6 pt-4 text-on-surface-variant">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-body-sm text-body-sm">4,500+ IFCT Validated Foods</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-body-sm text-body-sm">Mifflin-St Jeor Engine</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Nutrition Intelligence Preview Card */}
              <div className="lg:col-span-6 relative">
                <div className="absolute -inset-4 bg-surface-container-highest/60 rounded-xl filter blur-xl -z-10" />
                <Card className="p-6 sm:p-8 shadow-xl flex flex-col gap-6">
                  {/* Header Target */}
                  <div className="flex items-center justify-between border-b border-surface-container-low pb-4">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-medium">
                        Daily Caloric Target
                      </span>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="font-numeric-metric text-numeric-metric text-on-surface font-semibold">
                          2,140
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          / 2,600 kcal
                        </span>
                      </div>
                    </div>
                    <Badge variant="success" icon={<TrendingUp className="w-3.5 h-3.5" />}>
                      +120 kcal pacing
                    </Badge>
                  </div>

                  {/* Macro Progress Grid */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-surface-container-low rounded-xl">
                    <Progress
                      label="Protein"
                      value={98}
                      max={135}
                      sublabel="98g / 135g"
                      variant="primary"
                      size="sm"
                    />
                    <Progress
                      label="Carbs"
                      value={265}
                      max={330}
                      sublabel="265g / 330g"
                      variant="secondary"
                      size="sm"
                    />
                    <Progress
                      label="Fat"
                      value={52}
                      max={65}
                      sublabel="52g / 65g"
                      variant="tertiary"
                      size="sm"
                    />
                  </div>

                  {/* Micro Tip Banner */}
                  <div className="p-3 bg-surface-container rounded-lg flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-body-sm text-body-sm text-on-surface">
                        Protein pacing is optimal for your evening strength workout.
                      </span>
                    </div>
                    <Link to="/app" className="font-label-sm text-label-sm text-primary hover:underline font-semibold shrink-0">
                      View App
                    </Link>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* 2. FEATURES GRID SECTION */}
        <section id="features" className="w-full py-16 bg-surface-container-lowest border-y border-surface-container-low">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
              <Badge variant="primary" size="md">
                Clinical Precision Tools
              </Badge>
              <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                Designed for accuracy, built for everyday life.
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                PoshanCare replaces generic calorie counters with evidence-backed algorithms tailored for Indian diets.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="p-6 space-y-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary">
                  <Brain className="w-6 h-6" />
                </div>
                <h3 className="font-title-md text-title-md text-on-surface">Metabolic Engine</h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Utilizes Mifflin-St Jeor &amp; Harris-Benedict formulas to calculate your Basal Metabolic Rate (BMR) and Total Daily Energy Expenditure (TDEE).
                </p>
              </Card>

              <Card className="p-6 space-y-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="font-title-md text-title-md text-on-surface">ICMR-NIN Food Database</h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Over 4,500 validated regional Indian dishes, lentils, roti varieties, curries, and ingredients with precise micronutrient breakdowns.
                </p>
              </Card>

              <Card className="p-6 space-y-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-tertiary-fixed flex items-center justify-center text-tertiary">
                  <PieChart className="w-6 h-6" />
                </div>
                <h3 className="font-title-md text-title-md text-on-surface">Nutrient Intelligence</h3>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Track protein quality, fiber intake, glycemic impact, and micronutrient balances with real-time feedback.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* 3. HOW IT WORKS SECTION */}
        <section id="how-it-works" className="w-full py-16 bg-surface">
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
              <Badge variant="tertiary" size="md">
                Simple 4-Step Process
              </Badge>
              <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                How PoshanCare transforms your health.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { step: '01', title: 'Clinical Intake', desc: 'Share your age, height, weight, activity frequency, and primary health targets.' },
                { step: '02', title: 'Metabolic Calculation', desc: 'PoshanCare computes your precise caloric baseline and optimal macronutrient split.' },
                { step: '03', title: 'Daily Food Logging', desc: 'Search regional Indian foods or scan meals to log calories and protein effortlessly.' },
                { step: '04', title: 'Biomarker Intelligence', desc: 'Review weekly progress reports, weight trend analysis, and personalized suggestions.' },
              ].map((s) => (
                <Card key={s.step} className="p-6 flex flex-col justify-between space-y-4">
                  <div className="font-display-lg text-display-lg text-primary-fixed-dim font-bold">
                    {s.step}
                  </div>
                  <div>
                    <h4 className="font-title-md text-title-md text-on-surface mb-2">{s.title}</h4>
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{s.desc}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* 4. INDIAN FOOD INTELLIGENCE HIGHLIGHT */}
        <section id="food-intelligence" className="w-full py-16 bg-primary-container text-on-primary">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-6">
              <Badge variant="tertiary" size="md">
                Built For Indian Diets
              </Badge>
              <h2 className="font-headline-lg text-headline-lg text-on-primary tracking-tight">
                No more guessing standard Western food database equivalents.
              </h2>
              <p className="font-body-lg text-body-lg text-on-primary-container leading-relaxed">
                Whether it's Sona Masoori rice, Dal Tadka with ghee, Paneer Bhurji, or regional Roti varieties, PoshanCare accurately measures authentic Indian home cooking.
              </p>
              <div className="space-y-3 pt-2">
                {[
                  'ICMR-NIN Indian Food Composition Tables (IFCT 2024)',
                  'Regional portion size presets (katori, roti count, ml)',
                  'Cooking oil & ghee absorption estimation',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary-fixed shrink-0" />
                    <span className="font-body-md text-body-md text-on-primary-container">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <Card className="p-6 bg-surface-container-lowest text-on-surface w-full max-w-md shadow-2xl">
                <div className="flex items-center justify-between border-b border-surface-container-low pb-4 mb-4">
                  <span className="font-title-md text-title-md text-primary">Dal Tadka (Toor Dal)</span>
                  <Badge variant="primary">IFCT Verified</Badge>
                </div>
                <div className="space-y-3 text-body-sm font-body-sm">
                  <div className="flex justify-between py-1 border-b border-surface-container-low">
                    <span className="text-on-surface-variant">Serving Size</span>
                    <span className="font-medium text-on-surface">1 Katori (150g)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-surface-container-low">
                    <span className="text-on-surface-variant">Energy</span>
                    <span className="font-semibold text-primary">215 kcal</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-surface-container-low">
                    <span className="text-on-surface-variant">Protein</span>
                    <span className="font-medium text-on-surface">10.4g</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-on-surface-variant">Carbohydrates</span>
                    <span className="font-medium text-on-surface">24.2g</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* 5. CTA BANNER */}
        <section className="w-full py-16 bg-surface">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
            <h2 className="font-display-lg text-display-lg text-on-surface tracking-tight">
              Ready to master your nutrition?
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mx-auto">
              Join thousands of users using PoshanCare for metabolic precision and evidence-based health tracking.
            </p>
            <div className="pt-4 flex justify-center gap-4">
              <Link to="/signup">
                <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Create Free Account
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-container-low bg-surface-container-lowest py-12 text-on-surface-variant font-body-sm text-body-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-on-primary">
              <Sparkles className="w-3.5 h-3.5 text-primary-fixed" />
            </div>
            <span className="font-title-md text-title-md text-primary font-bold">PoshanCare</span>
            <span className="text-outline">• Clinical Nutrition Intelligence</span>
          </div>

          <div className="flex items-center gap-6 font-label-md text-label-md">
            <Link to="/signin" className="hover:text-primary transition-colors">
              Sign In
            </Link>
            <Link to="/signup" className="hover:text-primary transition-colors">
              Sign Up
            </Link>
            <Link to="/onboarding" className="hover:text-primary transition-colors">
              Onboarding
            </Link>
            <Link to="/app" className="hover:text-primary transition-colors">
              App Workspace
            </Link>
          </div>

          <p className="text-outline">
            &copy; {new Date().getFullYear()} PoshanCare. Visual source of truth: <code className="text-primary font-mono">frontend/UI_UX/</code>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
