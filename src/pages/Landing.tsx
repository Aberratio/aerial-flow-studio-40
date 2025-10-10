import { useState, lazy, Suspense } from "react";
import {
  Zap,
  Users,
  Trophy,
  BookOpen,
  ArrowRight,
  Crown,
  Check,
  Download,
  Target,
  TrendingUp,
  Award,
  Calendar,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import AuthModal from "@/components/Auth/AuthModal";
import CookiesBanner from "@/components/CookiesBanner";
import { LazyImage } from "@/components/LazyImage";
import { LazySection } from "@/components/LazySection";
import { HeroSkeleton } from "@/components/skeletons/HeroSkeleton";
import { FeaturesSkeleton } from "@/components/skeletons/FeaturesSkeleton";
import { PricingSkeleton } from "@/components/skeletons/PricingSkeleton";
import IguanaLogo from "@/assets/iguana-logo.svg";
import { Badge } from "@/components/ui/badge";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import PWAInstallInstructions from "@/components/PWAInstallInstructions";
import { useLandingSections } from "@/hooks/useLandingSections";
import { useLandingData } from "@/hooks/useLandingData";
import { useLandingStats } from "@/hooks/useLandingStats";
import { LoadingProgressBar } from "@/components/LoadingProgressBar";
import { SocialProof } from "@/components/SocialProof";

// Lazy load heavy components
const GallerySection = lazy(() => import("@/components/GallerySection").then(module => ({ default: module.GallerySection })));
const InstagramFeedSection = lazy(() => import("@/components/InstagramFeedSection").then(module => ({ default: module.InstagramFeedSection })));

interface PricingPlan {
  id: string;
  plan_key: string;
  name: string;
  price: string;
  description: string;
  is_popular: boolean;
  features: PricingFeature[];
}

interface PricingFeature {
  feature_key: string;
  is_included: boolean;
  feature_text: string;
}

const Landing = () => {
  const { data: sections, isLoading: sectionsLoading } = useLandingSections();
  const { data: landingData, isLoading: dataLoading } = useLandingData();
  const { data: stats } = useLandingStats();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const { isInstallable, isInstalled, isIOSDevice, installPWA } = usePWAInstall();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  const getFeatureText = (featureKey: string): string => {
    const featureTextMap: Record<string, string> = {
      'unlimited_library': 'Learn 200+ figures with step-by-step tutorials',
      'progress_tracking': 'Track your progress with visual analytics',
      '28_day_challenges': 'Join 28-Day challenges to stay motivated',
      'community_access': 'Connect with 500+ athletes worldwide',
      'all_free_features': 'All free features included',
      'unlimited_challenges': 'Unlimited access to all challenges',
      'expert_coaching': 'Expert coaching and feedback',
      'advanced_analytics': 'Advanced performance analytics',
      'priority_support': 'Priority customer support'
    };
    return featureTextMap[featureKey] || featureKey.replace(/_/g, ' ');
  };

  // Updated features with benefit-focused copy
  const features = [
    {
      icon: <BookOpen className="w-12 h-12 text-primary" />,
      title: "200+ Figures Library",
      description: "Learn 200+ figures with step-by-step video tutorials and detailed instructions"
    },
    {
      icon: <Target className="w-12 h-12 text-primary" />,
      title: "Visual Progress Tracking",
      description: "Track your progress with visual analytics and see your improvement over time"
    },
    {
      icon: <Trophy className="w-12 h-12 text-primary" />,
      title: "28-Day Challenges",
      description: "Join structured 28-day challenges to stay motivated and reach your goals"
    },
    {
      icon: <Users className="w-12 h-12 text-primary" />,
      title: "Global Community",
      description: "Connect with 500+ aerial athletes worldwide, share progress, and get inspired"
    }
  ];

  const openAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleInstallClick = () => {
    if (isIOSDevice) {
      setShowIOSInstructions(true);
    } else {
      installPWA();
    }
  };

  const heroImage = landingData?.sections?.hero?.image_url || "";
  const absChallengesImage = landingData?.sections?.abs_challenges?.image_url || "";
  const showAbsChallenges = landingData?.sections?.abs_challenges?.is_active || false;
  const pricingPlans = landingData?.pricing || [];

  const isLoading = sectionsLoading || dataLoading;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Loading Progress Bar */}
      <LoadingProgressBar isLoading={isLoading} />

      {/* Animated Background - Reduced particles */}
      <div className="fixed inset-0 -z-10 parallax-bg">
        <div className="hero-particle" style={{ width: '100px', height: '100px', top: '15%', left: '10%' }}></div>
        <div className="hero-particle-tropical" style={{ width: '120px', height: '120px', top: '65%', right: '15%' }}></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 glass-effect border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <img
              src={IguanaLogo}
              alt="IguanaFlow Logo"
              className="w-6 h-6 sm:w-8 sm:h-8"
            />
            <span className="text-lg sm:text-xl font-bold gradient-text">
              IguanaFlow
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              onClick={() => openAuth("login")}
              className="text-xs sm:text-sm"
            >
              Log In
            </Button>
            <Button
              onClick={() => openAuth("register")}
              className="text-xs sm:text-sm"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Always visible, no skeleton */}
      <section className="relative px-4 sm:px-6 pt-5 sm:pt-20 pb-16 sm:pb-32 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
              <div className="space-y-4 sm:space-y-6">
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-tight">
                  <span className="gradient-text-mega block">
                    Transform Your
                  </span>
                  <span className="gradient-text-tropical block">
                    Aerial Skills in 28 Days
                  </span>
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                  Join structured challenges, master 200+ figures, and track your progress with our comprehensive aerial training platform.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                <Button
                  onClick={() => openAuth("register")}
                  size="lg"
                  className="text-sm sm:text-base group"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                {(isInstallable || isIOSDevice) && !isInstalled && (
                  <Button
                    onClick={handleInstallClick}
                    size="lg"
                    variant="outline"
                    className="text-sm sm:text-base border-primary/50 hover:bg-primary/10"
                  >
                    <Download className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    {isIOSDevice ? 'Install App' : 'Get Desktop App'}
                  </Button>
                )}
              </div>

              {/* Social Proof */}
              <SocialProof />

              {/* Stats Grid - With real data */}
              <div className="grid grid-cols-2 sm:flex sm:items-center sm:space-x-8 gap-4 sm:gap-0 pt-6 sm:pt-8 max-w-sm mx-auto lg:mx-0">
                {stats && (
                  <>
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-primary">
                        {stats.athletes}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Athletes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-primary">
                        {stats.figures}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Figures</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-primary">
                        {stats.challenges}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Challenges</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-primary">
                        {stats.successRate}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground">Success Rate</div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative order-first lg:order-last">
              {heroImage ? (
                <LazyImage
                  src={heroImage}
                  alt="Aerial athlete performing"
                  className="rounded-2xl w-[400px] h-[600px] sm:w-[450px] sm:h-[650px] lg:w-[500px] lg:h-[700px] object-cover mx-auto shadow-2xl pulse-glow"
                  skeletonClassName="rounded-2xl w-[400px] h-[600px] sm:w-[450px] sm:h-[650px] lg:w-[500px] lg:h-[700px] mx-auto"
                />
              ) : (
                <div className="rounded-2xl w-[400px] h-[600px] sm:w-[450px] sm:h-[650px] lg:w-[500px] lg:h-[700px] bg-white/10 mx-auto animate-pulse" />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Conditionally rendered */}
      {sections?.features?.is_active && (
        <LazySection
          threshold={0.1}
          rootMargin="300px"
          fallback={<FeaturesSkeleton />}
        >
          <section className="px-4 sm:px-6 py-12 sm:py-20 relative z-10">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12 sm:mb-16">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
                  <span className="gradient-text">Everything You Need</span>
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
                  From beginner to expert, our platform provides all the tools and community support you need to excel in your aerial journey.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                {features.map((feature, index) => (
                  <Card
                    key={index}
                    className="glass-effect border-white/10 card-hover-effect"
                  >
                    <CardContent className="p-6 flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                        {feature.icon}
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold text-center mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-sm sm:text-base text-muted-foreground text-center">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        </LazySection>
      )}

      {/* Abs Challenges Section */}
      {showAbsChallenges && absChallengesImage && (
        <LazySection threshold={0.1} rootMargin="300px">
          <section className="px-4 sm:px-6 py-12 sm:py-20 relative z-10">
            <div className="max-w-7xl mx-auto">
              <Card className="glass-effect-intense overflow-hidden">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                  <div className="p-6 sm:p-8 lg:p-12 flex flex-col justify-center">
                    <Badge className="w-fit mb-4 bg-primary/20 text-primary border-primary/30">
                      Featured Challenge
                    </Badge>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
                      <span className="gradient-text-tropical">
                        28-Day Abs Challenge
                      </span>
                    </h2>
                    <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8">
                      Build core strength and master fundamental aerial positions with our comprehensive 28-day program.
                    </p>
                    <Button asChild size="lg" className="w-full sm:w-auto">
                      <Link to="/challenges">
                        View Challenge
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </div>
                  <div className="relative h-64 sm:h-80 lg:h-auto">
                    <LazyImage
                      src={absChallengesImage}
                      alt="28-Day Abs Challenge"
                      className="w-full h-full object-cover"
                      skeletonClassName="w-full h-full"
                    />
                  </div>
                </div>
              </Card>
            </div>
          </section>
        </LazySection>
      )}

      {/* Gallery Section - Conditionally rendered */}
      {sections?.gallery?.is_active && (
        <LazySection threshold={0.1} rootMargin="300px">
          <section className="px-4 sm:px-6 py-12 sm:py-20 relative z-10">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12 sm:mb-16">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
                  <span className="gradient-text">Community Highlights</span>
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
                  See what our community has achieved
                </p>
              </div>
              <Suspense fallback={
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="aspect-[4/5] bg-white/10 rounded-2xl animate-pulse"></div>
                  ))}
                </div>
              }>
                <GallerySection />
              </Suspense>
            </div>
          </section>
        </LazySection>
      )}

      {/* Instagram Feed Section - Conditionally rendered */}
      {sections?.instagram_feed?.is_active && (
        <LazySection threshold={0.1} rootMargin="300px">
          <Suspense fallback={<div className="h-96 w-full bg-white/5 rounded-2xl animate-pulse" />}>
            <InstagramFeedSection />
          </Suspense>
        </LazySection>
      )}

      {/* Pricing Section - Conditionally rendered */}
      {sections?.pricing?.is_active && (
        <LazySection
          threshold={0.1}
          rootMargin="300px"
          fallback={<PricingSkeleton />}
        >
          <section className="px-4 sm:px-6 py-12 sm:py-20 relative z-10">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12 sm:mb-16">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
                  <span className="gradient-text">Simple, Transparent Pricing</span>
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
                  Choose the plan that fits your journey. Start free, upgrade anytime.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
                {pricingPlans.map((plan) => (
                  <Card
                    key={plan.id}
                    className={`glass-effect ${
                      plan.is_popular
                        ? "border-primary/50 relative overflow-hidden"
                        : "border-white/10"
                    } card-hover-effect`}
                  >
                    {plan.is_popular && (
                      <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-primary-glow text-white px-6 py-1 text-sm font-semibold">
                        Most Popular
                      </div>
                    )}
                    <CardHeader className="pt-8 sm:pt-12">
                      <CardTitle className="text-2xl sm:text-3xl">
                        {plan.name}
                      </CardTitle>
                      <CardDescription className="text-sm sm:text-base">
                        {plan.description}
                      </CardDescription>
                      <div className="mt-4 sm:mt-6">
                        <span className="text-4xl sm:text-5xl font-bold gradient-text">
                          {plan.price}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                        {plan.pricing_plan_features?.map((feature, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-3 text-sm sm:text-base"
                          >
                            <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">
                              {getFeatureText(feature.feature_key)}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <Button
                        onClick={() => openAuth("register")}
                        className="w-full text-sm sm:text-base"
                        variant={plan.is_popular ? "default" : "outline"}
                      >
                        {plan.plan_key === "free" ? "Start Free" : "Get Premium"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        </LazySection>
      )}

      {/* CTA Section */}
      {sections?.cta?.is_active && (
        <section className="px-4 sm:px-6 py-16 sm:py-24 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Card className="glass-effect-intense border-primary/20">
              <CardContent className="p-8 sm:p-12">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
                  <span className="gradient-text-mega">
                    Ready to Transform Your Aerial Skills?
                  </span>
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
                  Join thousands of athletes already mastering their craft with IguanaFlow.
                </p>
                <Button
                  onClick={() => openAuth("register")}
                  size="lg"
                  className="text-sm sm:text-base group"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-white/10 bg-background/50 backdrop-blur-lg relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img
                  src={IguanaLogo}
                  alt="IguanaFlow Logo"
                  className="w-6 h-6"
                />
                <span className="text-lg font-bold gradient-text">
                  IguanaFlow
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Transform your aerial skills with our comprehensive training platform.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/about" className="hover:text-foreground transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-foreground transition-colors">
                    Terms of Use
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/library" className="hover:text-foreground transition-colors">
                    Figure Library
                  </Link>
                </li>
                <li>
                  <Link to="/challenges" className="hover:text-foreground transition-colors">
                    Challenges
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-foreground transition-colors">
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <p className="text-sm text-muted-foreground">
                Email: contact@iguanaflow.com
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} IguanaFlow. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        mode={authMode}
        onModeChange={setAuthMode}
      />
      <CookiesBanner />
      <PWAInstallInstructions
        open={showIOSInstructions}
        onOpenChange={setShowIOSInstructions}
        isIOSDevice={isIOSDevice}
      />
    </div>
  );
};

export default Landing;
