import { useState, useEffect } from "react";
import {
  Zap,
  Users,
  Trophy,
  BookOpen,
  ArrowRight,
  Crown,
  Check,
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
import { GallerySection } from "@/components/GallerySection";
import { supabase } from "@/integrations/supabase/client";
import IguanaLogo from "@/assets/iguana-logo.svg";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@radix-ui/react-select";
import { Badge } from "@/components/ui/badge";
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
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [isLoaded, setIsLoaded] = useState(false);
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [absChallengesImage, setAbsChallengesImage] = useState<string | null>(null);
  const [showAbsChallenges, setShowAbsChallenges] = useState(false);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [allDataLoaded, setAllDataLoaded] = useState(false);
  useEffect(() => {
    loadHeroImage();
    loadAbsChallengesImage();
    loadPricingPlans();
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Check if all data is loaded
  useEffect(() => {
    // Hero image can be null (fallback image will be used)
    // Abs challenges can be null if section is disabled
    // Only require pricing plans to be loaded
    if (heroImage !== undefined && absChallengesImage !== undefined && pricingPlans.length > 0) {
      setAllDataLoaded(true);
    }
  }, [heroImage, absChallengesImage, pricingPlans]);
  const loadHeroImage = async () => {
    try {
      const { data: heroSection } = await supabase
        .from("landing_page_sections")
        .select("image_url")
        .eq("section_key", "hero")
        .single();
      if (heroSection?.image_url) {
        setHeroImage(heroSection.image_url);
      }
    } catch (error) {
      console.error("Error loading hero image:", error);
    }
  };

  const loadAbsChallengesImage = async () => {
    try {
      const { data: absChallengesSection } = await supabase
        .from("landing_page_sections")
        .select("image_url, is_active")
        .eq("section_key", "abs_challenges")
        .single();
      
      if (absChallengesSection?.is_active) {
        setShowAbsChallenges(true);
        setAbsChallengesImage(absChallengesSection.image_url || null);
      } else {
        setShowAbsChallenges(false);
        setAbsChallengesImage(null);
      }
    } catch (error) {
      console.error("Error loading abs challenges image:", error);
      setShowAbsChallenges(false);
      setAbsChallengesImage(null);
    }
  };
  const loadPricingPlans = async () => {
    try {
      const { data: plansData } = await supabase
        .from("pricing_plans")
        .select(
          `
          *,
          pricing_plan_features (
            feature_key,
            is_included,
            display_order
          )
        `
        )
        .order("display_order");
      if (plansData) {
        const plansWithFeatures = plansData.map((plan) => ({
          ...plan,
          features: plan.pricing_plan_features
            .map((feature: any) => ({
              ...feature,
              feature_text: getFeatureText(feature.feature_key),
            }))
            .sort((a, b) => a.display_order - b.display_order),
        }));
        setPricingPlans(plansWithFeatures);
      }
    } catch (error) {
      console.error("Error loading pricing plans:", error);
    }
  };
  const getFeatureText = (featureKey: string) => {
    const featureTexts: Record<string, string> = {
      basic_progress_tracking: "Basic progress tracking",
      advanced_progress_tracking: "Advanced progress tracking",
      library_access: "Library access",
      full_library_access: "Full library access",
      community_access: "Community access",
      posts_sharing: "Posts sharing",
      challenges_access: "Challenges access",
      unlimited_challenges: "Unlimited challenges",
      training_sessions: "Training sessions",
      custom_training_sessions: "Custom training sessions",
      exclusive_content: "Exclusive content",
      priority_support: "Priority support",
    };
    return featureTexts[featureKey] || featureKey;
  };
  const features = [
    {
      icon: Users,
      title: "Connect & Share",
      description:
        "Follow other aerial athletes, share your progress, and get inspired by the community.",
      accent: "tropical",
    },
    {
      icon: BookOpen,
      title: "Comprehensive Library",
      description:
        "Access hundreds of aerial figures with detailed instructions and progressions.",
      accent: "primary",
    },
    {
      icon: Trophy,
      title: "Take on Challenges",
      description:
        "Join structured training programs and track your improvement over time.",
      accent: "tropical",
    },
    {
      icon: Zap,
      title: "Track Progress",
      description:
        "Log your training sessions and see your aerial journey unfold.",
      accent: "primary",
    },
  ];
  const stats = [
    // {
    //   value: "10K+",
    //   label: "Active Athletes",
    // },
    // {
    //   value: "500+",
    //   label: "Aerial Figures",
    // },
    // {
    //   value: "50+",
    //   label: "Awesome Challenges",
    // },
    // {
    //   value: "95%",
    //   label: "Success Rate",
    // },
    {
      value: "99+",
      label: "signups ready to fly",
    },
    {
      value: "∞",
      label: "possibilities to explore",
    },
    {
      value: "100%",
      label: "unlocked potential",
    },
    {
      value: "0",
      label: "excuses left",
    },
  ];
  const freeFeatures = [
    "Post updates to your feed",
    "Invite and follow friends",
    "View community posts",
    "Basic profile customization",
  ];
  const premiumFeatures = [
    "All Free features",
    "Access to figure library",
    "Create training sessions",
    "Join challenges",
    "Track your progress",
    "Advanced analytics",
    "Priority support",
  ];
  const openAuth = (mode: "login" | "register" = "login") => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };
  if (!allDataLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin animation-delay-200 mx-auto"></div>
          </div>
          <div className="flex items-center space-x-2">
            <img
              src={IguanaLogo}
              alt="IguanaFlow Logo"
              className="w-8 h-8 animate-pulse"
            />
            <span className="font-bold text-2xl">
              <span className="text-white">Iguana</span>
              <span className="bg-gradient-to-r from-purple-500 via-violet-500 to-purple-700 bg-clip-text text-transparent">
                Flow
              </span>
            </span>
          </div>
          <p className="text-gray-400 animate-pulse">
            Loading your aerial journey...
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen relative overflow-hidden parallax-bg">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="hero-particle"></div>
        <div className="hero-particle-tropical"></div>
        <div className="hero-particle"></div>
        <div className="hero-particle-tropical"></div>
      </div>

      {/* Dynamic Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 animate-fade-in"></div>

      {/* Additional dynamic background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-gradient-to-br from-purple-600/20 to-pink-600/15 rounded-full blur-3xl animate-pulse animation-delay-0"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-gradient-to-bl from-emerald-500/15 to-teal-500/10 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-gradient-to-tr from-violet-500/20 to-purple-500/15 rounded-full blur-2xl animate-pulse animation-delay-600"></div>
        <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-gradient-to-tl from-pink-500/15 to-purple-600/10 rounded-full blur-3xl animate-pulse animation-delay-800"></div>

        {/* Floating geometric shapes */}
        <div className="absolute top-1/4 left-1/6 w-3 h-3 bg-purple-400/60 rounded-full animate-pulse animation-delay-200"></div>
        <div className="absolute top-3/4 right-1/5 w-2 h-2 bg-pink-400/70 rounded-full animate-pulse animation-delay-400"></div>
        <div className="absolute bottom-1/3 left-1/2 w-4 h-4 bg-emerald-400/50 rounded-full animate-pulse animation-delay-1200"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 sm:px-6 py-4">
        <nav
          className={`max-w-7xl mx-auto flex items-center justify-between transition-all duration-1000 ${
            isLoaded ? "animate-fade-in-up" : "opacity-0"
          }`}
        >
          <div className="flex items-center space-x-2 sm:space-x-3">
            <img
              src={IguanaLogo}
              alt="IguanaFlow Logo"
              className="w-6 h-6 sm:w-8 sm:h-8"
            />
            <span className="font-bold text-xl sm:text-2xl">
              <span className="text-white">Iguana</span>
              <span className="bg-gradient-to-r from-purple-500 via-violet-500 to-purple-700 bg-clip-text text-transparent">
                Flow
              </span>
            </span>
          </div>

          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
            <Button
              variant="ghost"
              onClick={() => openAuth("login")}
              className="text-white hover:text-purple-300 text-xs sm:text-sm md:text-base px-2 sm:px-4 transition-all duration-300 border-0"
            >
              <span>Sign In</span>
            </Button>
            <Button
              variant="default"
              onClick={() => openAuth("register")}
              className="text-xs sm:text-sm md:text-base px-2 sm:px-3 md:px-4"
            >
              <span>Sign up</span>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 pt-5 sm:pt-20 pb-16 sm:pb-32 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
              <div className="space-y-4 sm:space-y-6">
                <h1
                  className={`text-3xl sm:text-5xl lg:text-7xl font-bold leading-tight transition-all duration-1000 ${
                    isLoaded ? "animate-fade-in-up" : "opacity-0 translate-y-10"
                  }`}
                >
                  Master Your{" "}
                  <span className="bg-gradient-to-r from-purple-500 via-violet-500 to-purple-700 bg-clip-text text-transparent">
                    Aerial
                  </span>{" "}
                  Journey
                </h1>
                <p
                  className={`text-base sm:text-xl text-gray-400 leading-relaxed transition-all duration-1000 animation-delay-400 ${
                    isLoaded ? "animate-fade-in-up" : "opacity-0 translate-y-10"
                  }`}
                >
                  Connect with aerial athletes worldwide, track your progress,
                  and push your limits with structured challenges and a
                  comprehensive pose library.
                </p>
              </div>

              <div
                className={`flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md mx-auto lg:mx-0 transition-all duration-1000 animation-delay-600 ${
                  isLoaded ? "animate-bounce-in" : "opacity-0 scale-75"
                }`}
              >
                <Button
                  variant="default"
                  size="lg"
                  onClick={() => openAuth("register")}
                  className="text-base sm:text-lg px-6 sm:px-8"
                >
                  Start Training Free
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>

              <div
                className={`grid grid-cols-2 sm:flex sm:items-center sm:space-x-8 gap-4 sm:gap-0 pt-6 sm:pt-8 max-w-sm mx-auto lg:mx-0 transition-all duration-1000 animation-delay-800 ${
                  isLoaded ? "animate-scale-in" : "opacity-0 scale-90"
                }`}
              >
                {stats.map((stat, index) => (
                  <div key={index} className="text-center card-hover-effect">
                    <div className="bg-gradient-to-r from-purple-500 via-violet-500 to-purple-700 bg-clip-text text-transparent text-2xl sm:text-3xl font-bold">
                      {stat.value}
                    </div>
                    <div className="text-gray-400 text-xs sm:text-sm">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              className={`relative order-first lg:order-last transition-all duration-1000 animation-delay-1000 ${
                isLoaded ? "animate-scale-in floating" : "opacity-0 scale-75"
              }`}
            >
              <div className="relative z-10">
                <img
                  src={
                    heroImage ||
                    "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=800&fit=crop"
                  }
                  alt="Aerial athlete performing on silks"
                  className="rounded-2xl shadow-2xl hover-lift mx-auto w-[400px] h-[600px] sm:w-[450px] sm:h-[650px] lg:w-[500px] lg:h-[700px] object-cover glass-effect-intense  "
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/25 via-violet-500/20 to-indigo-500/25 rounded-2xl blur-3xl floating-delayed"></div>

              {/* Floating decorative elements */}
              <div className="absolute -top-6 -right-6 w-12 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full blur-lg animate-pulse pulse-glow-tropical"></div>
              <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full blur-md animate-pulse animation-delay-400"></div>
              <div className="absolute top-1/3 -left-8 w-6 h-6 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full blur-sm animate-pulse animation-delay-800"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 animate-fade-in-up">
              Elevate Your{" "}
              <span className="bg-gradient-to-r from-purple-500 via-violet-500 to-purple-700 bg-clip-text text-transparent">
                Aerial Practice
              </span>
            </h2>
            <p className="text-base sm:text-xl text-gray-400 max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
              Everything you need to excel in aerial arts, from
              beginner-friendly tutorials to advanced training programs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className={`glass-effect border-white/10 transition-all duration-300 animation-delay-${
                  (index + 1) * 200
                } animate-scale-in`}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center">
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600/50 to-teal-700/50 
                     flex items-center justify-center mb-6 `}
                  >
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 text-center">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-base leading-relaxed text-center">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Abs Challenges Section */}
      {showAbsChallenges && (
        <section className="px-4 sm:px-6 py-12 sm:py-20 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
                <div className="space-y-4 sm:space-y-6">
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight animate-fade-in-up">
                    Build Your{" "}
                    <span className="bg-gradient-to-r from-purple-500 via-violet-500 to-purple-700 bg-clip-text text-transparent">
                      Core Strength
                    </span>{" "}
                    with Challenges
                  </h2>
                  <p className="text-base sm:text-xl text-gray-400 leading-relaxed animate-fade-in-up animation-delay-200">
                    Transform your core with our specialized abs challenges. Structured programs designed to build strength, 
                    improve stability, and enhance your aerial performance through progressive training.
                  </p>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md mx-auto lg:mx-0 animate-bounce-in animation-delay-400">
                  <Button
                    variant="default"
                    size="lg"
                    onClick={() => openAuth("register")}
                    className="text-base sm:text-lg px-6 sm:px-8"
                  >
                    Start Core Training
                    <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-6 sm:pt-8 max-w-md mx-auto lg:mx-0 animate-scale-in animation-delay-600">
                  <div className="text-center">
                    <div className="bg-gradient-to-r from-purple-500 via-violet-500 to-purple-700 bg-clip-text text-transparent text-xl sm:text-2xl font-bold">
                      30+
                    </div>
                    <div className="text-gray-400 text-xs sm:text-sm">
                      Core Exercises
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="bg-gradient-to-r from-purple-500 via-violet-500 to-purple-700 bg-clip-text text-transparent text-xl sm:text-2xl font-bold">
                      28
                    </div>
                    <div className="text-gray-400 text-xs sm:text-sm">
                      Day Programs
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="bg-gradient-to-r from-purple-500 via-violet-500 to-purple-700 bg-clip-text text-transparent text-xl sm:text-2xl font-bold">
                      100%
                    </div>
                    <div className="text-gray-400 text-xs sm:text-sm">
                      Core Focus
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative order-first lg:order-last animate-scale-in animation-delay-800 floating">
                <div className="relative z-10">
                  <img
                    src={
                      absChallengesImage ||
                      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=800&fit=crop"
                    }
                    alt="Core strength training for aerial athletes"
                    className="rounded-2xl shadow-2xl hover-lift mx-auto w-[400px] h-[500px] sm:w-[450px] sm:h-[550px] lg:w-[500px] lg:h-[600px] object-cover glass-effect-intense"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/25 via-violet-500/20 to-indigo-500/25 rounded-2xl blur-3xl floating-delayed"></div>

                {/* Floating decorative elements */}
                <div className="absolute -top-6 -left-6 w-12 h-12 bg-gradient-to-r from-purple-600 to-violet-600 rounded-full blur-lg animate-pulse"></div>
                <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-md animate-pulse animation-delay-400"></div>
                <div className="absolute top-1/3 -right-8 w-6 h-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full blur-sm animate-pulse animation-delay-800"></div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Media Gallery Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 relative z-10" id="gallery">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 animate-fade-in-up">
              See IguanaFlow in{" "}
              <span className="bg-gradient-to-r from-purple-500 via-violet-500 to-purple-700 bg-clip-text text-transparent">
                Action
              </span>
            </h2>
            <p className="text-base sm:text-xl text-gray-400 max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
              Discover how our platform helps aerial athletes achieve their goals through structured training and expert guidance.
            </p>
          </div>
          
          <GallerySection />
        </div>
      </section>

      {/* Pricing Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 animate-fade-in-up">
              Choose Your{" "}
              <span className="bg-gradient-to-r from-purple-500 via-violet-500 to-purple-700 bg-clip-text text-transparent">
                Journey
              </span>
            </h2>
            <p className="text-base sm:text-xl text-gray-400 max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
              Start free and upgrade when you're ready to unlock premium
              features and advanced training programs.
            </p>
          </div>

          <div className="relative">
            {/* Background decorative circle */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-purple-500/10 to-pink-500/5 rounded-full blur-3xl"></div>

            <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto relative z-10">
              {/* Left Decorative Card */}
              <Card className="relative overflow-hidden lg:row-span-1 glass-effect">
                <CardContent className="relative z-10 px-8 py-12 h-full flex flex-col justify-center items-center text-center">
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-10 leading-tight">
                    Choose what's right for you
                  </h3>
                  <div className="w-24 h-24 mx-auto mb-10">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-600/50 to-teal-700/50 flex items-center justify-center">
                      <Trophy className="w-12 h-12 text-white" />
                    </div>
                  </div>
                  <p className="text-white font-medium">
                    Find the perfect plan for your aerial journey
                  </p>

                  <Button
                    variant="default"
                    size="lg"
                    className="w-full font-bold lg:mt-auto mt-10"
                    onClick={() => openAuth("register")}
                  >
                    GET STARTED
                  </Button>
                </CardContent>
              </Card>

              {/* Pricing Plans */}
              <Card className="relative overflow-hidden lg:row-span-1 glass-effect">
                <CardHeader className="text-center p-4 sm:p-6">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
                  </div>
                  <CardTitle className="text-white text-xl sm:text-2xl">
                    Free
                  </CardTitle>
                  <CardDescription className="text-white/70 text-sm sm:text-base">
                    Perfect for getting started
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-2xl sm:text-3xl font-bold text-white">
                      $0
                    </span>
                    <span className="text-white/70 text-sm sm:text-base">
                      /month
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-6 mx-auto w-fit">
                  <ul className="space-y-3">
                    {freeFeatures.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center text-white/80 text-sm sm:text-base"
                      >
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Premium Plan */}
              <Card className="glass-effect border-purple-500/50 relative">
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-br from-purple-600/50 to-teal-700/50 text-white text-xs">
                  Most Popular
                </Badge>
                <CardHeader className="text-center p-6">
                  <div className="flex items-center justify-center mb-2">
                    <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />
                  </div>
                  <CardTitle className="text-white text-xl sm:text-2xl">
                    Premium
                  </CardTitle>
                  <CardDescription className="text-white/70 text-sm sm:text-base">
                    Unlock your full potential
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-2xl sm:text-3xl font-bold text-white">
                      $10
                    </span>
                    <span className="text-white/70 text-sm sm:text-base">
                      /month
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 p-6 mx-auto w-fit">
                  <ul className="space-y-3">
                    {premiumFeatures.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center text-white/80 text-sm sm:text-base"
                      >
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Decorative arrow - only show on larger screens */}
            <div className="hidden lg:block absolute top-1/2 left-1/3 transform -translate-y-1/2 translate-x-8">
              <div className="w-12 h-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full relative">
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-1 w-0 h-0 border-l-4 border-l-orange-400 border-y-2 border-y-transparent"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="glass-effect border-white/10 overflow-hidden">
            <CardContent className="p-8 sm:p-12 relative">
              <div className="absolute inset-0"></div>
              <div className="relative z-10 space-y-6">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                  Ready to{" "}
                  <span className="bg-gradient-to-r from-purple-500 via-violet-500 to-purple-700 bg-clip-text text-transparent">
                    Soar Higher
                  </span>
                  ?
                </h2>
                <p className="text-base sm:text-xl text-gray-400 max-w-2xl mx-auto">
                  Join thousands of aerial athletes who trust IguanaFlow to
                  elevate their practice. Start your journey today.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button
                    variant="default"
                    size="lg"
                    onClick={() => openAuth("register")}
                    className="text-lg px-8 animate-bounce-in"
                  >
                    Start Free Today
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        mode={authMode}
        onModeChange={setAuthMode}
      />

      {/* Cookies Banner */}
      <CookiesBanner />

      {/* Footer */}
      <footer className="relative z-10 mt-16">
        <div className="glass-effect border-t border-white/10 py-12 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <img
                    src={IguanaLogo}
                    alt="IguanaFlow Logo"
                    className="w-8 h-8"
                  />
                  <span className="font-bold text-xl">
                    <span className="text-white">Iguana</span>
                    <span className="bg-gradient-to-r from-purple-500 via-violet-500 to-purple-700 bg-clip-text text-transparent">
                      Flow
                    </span>
                  </span>
                </div>
                <p className="text-gray-300 text-base leading-relaxed">
                  Elevate your aerial practice with our comprehensive platform
                  designed for aerial athletes of all levels.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-6 text-lg">
                  Quick Links
                </h4>
                <div className="space-y-3">
                  <Link
                    to="/about-us"
                    className="text-gray-300 hover:text-purple-400 transition-colors text-base block hover:translate-x-1 transition-transform duration-200"
                  >
                    About Us
                  </Link>
                  <Link
                    to="/privacy-policy"
                    className="text-gray-300 hover:text-purple-400 transition-colors text-base block hover:translate-x-1 transition-transform duration-200"
                  >
                    Privacy Policy
                  </Link>
                  <Link
                    to="/terms-of-use"
                    className="text-gray-300 hover:text-purple-400 transition-colors text-base block hover:translate-x-1 transition-transform duration-200"
                  >
                    Terms of Use
                  </Link>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-6 text-lg">
                  Contact
                </h4>
                <div className="space-y-3">
                  <p className="text-gray-300 text-base">
                    hello@iguanaflow.com
                  </p>
                  <p className="text-gray-300 text-base">Support Center</p>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-8 text-center">
              <p className="text-gray-400 text-base">
                © 2025 IguanaFlow. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default Landing;
