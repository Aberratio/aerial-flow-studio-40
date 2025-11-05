import { useState, lazy, Suspense } from "react";
import { Zap, Users, Trophy, BookOpen, ArrowRight, Crown, Check, Download, Target, TrendingUp, Award, Calendar, Sparkles, Instagram } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
const GallerySection = lazy(() => import("@/components/GallerySection").then(module => ({
  default: module.GallerySection
})));
const InstagramFeedSection = lazy(() => import("@/components/InstagramFeedSection").then(module => ({
  default: module.InstagramFeedSection
})));
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
  const {
    data: sections,
    isLoading: sectionsLoading
  } = useLandingSections();
  const {
    data: landingData,
    isLoading: dataLoading
  } = useLandingData();
  const {
    data: stats
  } = useLandingStats();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const {
    isInstallable,
    isInstalled,
    isIOSDevice,
    installPWA
  } = usePWAInstall();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const getFeatureText = (featureKey: string): string => {
    const featureTextMap: Record<string, string> = {
      unlimited_library: "Naucz się 200+ figur z instrukcjami krok po kroku",
      progress_tracking: "Śledź postępy z wizualną analityką",
      "28_day_challenges": "Dołącz do 28-dniowych wyzwań i zachowaj motywację",
      community_access: "Połącz się z innymi sportowcami",
      all_free_features: "Wszystkie darmowe funkcje",
      unlimited_challenges: "Nieograniczony dostęp do wszystkich wyzwań",
      expert_coaching: "Coaching ekspertów i opinie",
      advanced_analytics: "Zaawansowana analityka wydajności",
      priority_support: "Priorytetowe wsparcie klienta",
      posts_sharing: "Udostępnianie postów",
      basic_progress_tracking: "Podstawowe śledzenie postępów",
      advanced_progress_tracking: "Zaawansowane śledzenie postępów",
      full_library_access: "Pełny dostęp do biblioteki",
      library_access: "Dostęp do biblioteki",
      custom_training_sessions: "Personalizowane sesje treningowe",
      training_sessions: "Sesje treningowe",
      challenges_access: "Dostęp do wyzwań",
      exclusive_content: "Ekskluzywne treści"
    };
    return featureTextMap[featureKey] || featureKey.replace(/_/g, " ");
  };
  const getFeatureIcon = (featureKey: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      unlimited_library: <BookOpen className="w-5 h-5" />,
      progress_tracking: <TrendingUp className="w-5 h-5" />,
      "28_day_challenges": <Calendar className="w-5 h-5" />,
      community_access: <Users className="w-5 h-5" />,
      all_free_features: <Check className="w-5 h-5" />,
      unlimited_challenges: <Zap className="w-5 h-5" />,
      expert_coaching: <Target className="w-5 h-5" />,
      advanced_analytics: <Award className="w-5 h-5" />,
      priority_support: <Sparkles className="w-5 h-5" />
    };
    return iconMap[featureKey] || <Check className="w-5 h-5" />;
  };

  // Updated features with benefit-focused copy
  const features = [{
    icon: <BookOpen className="w-12 h-12 text-primary" />,
    title: "Biblioteka 200+ Figur",
    description: "Naucz się 200+ figur z wideo instrukcjami krok po kroku i szczegółowymi wskazówkami"
  }, {
    icon: <Target className="w-12 h-12 text-primary" />,
    title: "Wizualne Śledzenie Postępów",
    description: "Śledź swoje postępy z wizualną analityką i obserwuj swoją poprawę w czasie"
  }, {
    icon: <Trophy className="w-12 h-12 text-primary" />,
    title: "28-dniowe Wyzwania",
    description: "Dołącz do strukturalnych 28-dniowych wyzwań, zachowaj motywację i osiągnij cele"
  }, {
    icon: <Users className="w-12 h-12 text-primary" />,
    title: "Globalna Społeczność",
    description: "Łącz się z innymi sportowcami, dziel się postępami i inspiruj"
  }];
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
  return <div className="min-h-screen relative overflow-hidden">
      {/* Loading Progress Bar */}
      <LoadingProgressBar isLoading={isLoading} />

      {/* Animated Background - Reduced particles */}
      <div className="fixed inset-0 -z-10 parallax-bg">
        <div className="hero-particle" style={{
        width: "100px",
        height: "100px",
        top: "15%",
        left: "10%"
      }}></div>
        <div className="hero-particle-tropical" style={{
        width: "120px",
        height: "120px",
        top: "65%",
        right: "15%"
      }}></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 glass-effect border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <img src={IguanaLogo} alt="IguanaFlow Logo" className="w-6 h-6 sm:w-8 sm:h-8" />
            <span className="text-lg sm:text-xl font-bold gradient-text">
              IguanaFlow
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button variant="ghost" onClick={() => openAuth("login")} className="text-xs sm:text-sm">
              Zaloguj się
            </Button>
            <Button onClick={() => openAuth("register")} className="text-xs sm:text-sm">
              Rozpocznij
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section - Always visible, no skeleton */}
      <section className="relative px-4 sm:px-6 pt-20 sm:pt-24 lg:pt-28 pb-16 sm:pb-32 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
              <div className="space-y-4 sm:space-y-6">
                <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-tight">
                  <span className="gradient-text-subtle block">
                    Kiedy ostatnio coś było dla Ciebie?
                  </span>
                </h1>
                <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">Trenujesz aerial? A może po prostu lubisz wyzwania sportowe? Rozpisane treningi? Wspierającą i motywującą społeczność? Wszystko w Twoim rytmie, ze świetnymi trenerkami i jasnymi instrukcjami czeka na Ciebie w Iguanie!</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
                <Button onClick={() => openAuth("register")} size="lg" className="text-sm sm:text-base group">
                  Wchodzę w to
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                {(isInstallable || isIOSDevice) && !isInstalled && <Button onClick={handleInstallClick} size="lg" variant="outline" className="text-sm sm:text-base border-primary/50 hover:bg-primary/10">
                    <Download className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    {isIOSDevice ? "Pobierz aplikację" : "Pobierz aplikację"}
                  </Button>}
              </div>

              {/* Social Proof */}
              <SocialProof />

              {/* Static Stats */}
              <div className="grid grid-cols-2 sm:flex sm:items-center sm:space-x-8 gap-2 sm:gap-2 pt-6 sm:pt-8 max-w-sm mx-auto lg:mx-0">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-primary">
                    100%
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Postępów, które widać
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-primary">
                    ∞ razy
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Możesz zacząć od nowa
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-primary">
                    10/10
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    Poleca Twoje ciało
                  </div>
                </div>
              </div>
            </div>

            {/* Hero Image */}
            <div className="relative order-first lg:order-last">
              {heroImage ? <LazyImage src={heroImage} alt="Aerial athlete performing" className="rounded-2xl w-[400px] h-[600px] sm:w-[450px] sm:h-[650px] lg:w-[500px] lg:h-[700px] object-cover mx-auto shadow-2xl" skeletonClassName="rounded-2xl w-[400px] h-[600px] sm:w-[450px] sm:h-[650px] lg:w-[500px] lg:h-[700px] mx-auto" /> : <div className="rounded-2xl w-[400px] h-[600px] sm:w-[450px] sm:h-[650px] lg:w-[500px] lg:h-[700px] bg-white/10 mx-auto animate-pulse" />}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Conditionally rendered */}
      {sections?.features?.is_active && <LazySection threshold={0.1} rootMargin="300px" fallback={<FeaturesSkeleton />}>
          <section className="px-4 sm:px-6 py-12 sm:py-20 relative z-10">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12 sm:mb-16">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
                  <span className="gradient-text">
                    Wszystko czego potrzebujesz
                  </span>
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
                  Od początkującego do eksperta, nasza platforma zapewnia
                  narzędzia i wsparcie społeczności potrzebne do sukcesu w
                  Twojej aerialowej podróży.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                {features.map((feature, index) => <Card key={index} className="glass-effect border-white/10 card-hover-effect">
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
                  </Card>)}
              </div>
            </div>
          </section>
        </LazySection>}

      {/* Abs Challenges Section */}
      {showAbsChallenges && absChallengesImage && <LazySection threshold={0.1} rootMargin="300px">
          <section className="px-4 sm:px-6 py-12 sm:py-20 relative z-10">
            <div className="max-w-7xl mx-auto">
              <Card className="glass-effect-intense overflow-hidden">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                  <div className="p-6 sm:p-8 lg:p-12 flex flex-col justify-center">
                    <Badge className="w-fit mb-4 bg-primary/20 text-primary border-primary/30">
                      Wyróżnione Wyzwanie
                    </Badge>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
                      <span className="gradient-text-tropical">
                        28-dniowe wyzwanie na brzuch
                      </span>
                    </h2>
                    <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8">
                      Zbuduj siłę core i opanuj podstawowe pozycje powietrzne z
                      naszym kompleksowym 28-dniowym programem.
                    </p>
                    <Button asChild size="lg" className="w-full sm:w-auto">
                      <Link to="/challenges">
                        Zobacz Wyzwanie
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </div>
                  <div className="relative h-64 sm:h-80 lg:h-auto">
                    <LazyImage src={absChallengesImage} alt="28-Day Abs Challenge" className="w-full h-full object-cover" skeletonClassName="w-full h-full" />
                  </div>
                </div>
              </Card>
            </div>
          </section>
        </LazySection>}

      {/* Gallery Section - Conditionally rendered */}
      {sections?.gallery?.is_active && <LazySection threshold={0.1} rootMargin="300px">
          <section className="px-4 sm:px-6 py-12 sm:py-20 relative z-10">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12 sm:mb-16">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
                  <span className="gradient-text">Jak to wygląda?</span>
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
                  Poniżej mały spojler. Zobacz jak Kasia (jedna z naszych
                  trenerek) wymiata na kole!
                </p>
              </div>
              <Suspense fallback={<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {[...Array(12)].map((_, i) => <div key={i} className="aspect-[4/5] bg-white/10 rounded-2xl animate-pulse"></div>)}
                  </div>}>
                <GallerySection />
              </Suspense>
            </div>
          </section>
        </LazySection>}

      {/* Instagram Feed Section - Conditionally rendered */}
      {sections?.instagram_feed?.is_active && <LazySection threshold={0.1} rootMargin="300px">
          <Suspense fallback={<div className="h-96 w-full bg-white/5 rounded-2xl animate-pulse" />}>
            <InstagramFeedSection />
          </Suspense>
        </LazySection>}

      {/* Pricing Section - Conditionally rendered */}
      {sections?.pricing?.is_active && <LazySection threshold={0.1} rootMargin="300px" fallback={<PricingSkeleton />}>
          <section className="px-4 sm:px-6 py-12 sm:py-20 relative z-10">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12 sm:mb-16">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
                  <span className="gradient-text">
                    Proste, przejrzyste ceny
                  </span>
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto">
                  Wybierz plan dopasowany do Twojej podróży. Zacznij za darmo,
                  ulepsz kiedykolwiek.
                </p>
              </div>

              {/* Decorative elements */}
              <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10" />
              <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl -z-10" />

              <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
                {pricingPlans.map(plan => <Card key={plan.id} className={`relative overflow-hidden transition-all duration-300 ${plan.is_popular ? "border-primary/50 shadow-lg shadow-primary/20 scale-105" : "border-white/10 hover:border-primary/30"} glass-effect hover:shadow-2xl`}>
                    {/* Popular Badge - Animated */}
                    {plan.is_popular && <div className="absolute top-0 right-0 bg-gradient-to-r from-primary via-purple-500 to-primary text-white px-6 py-1.5 text-sm font-semibold animate-pulse">
                        <Sparkles className="inline w-4 h-4 mr-1" />
                        Najpopularniejszy
                      </div>}

                    {/* Decorative gradient orb */}
                    {plan.is_popular && <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />}

                    <CardHeader className="pt-8 sm:pt-12 relative z-10">
                      <CardTitle className="text-2xl sm:text-3xl flex items-center gap-2">
                        {plan.is_popular && <Crown className="w-6 h-6 text-primary" />}
                        {plan.name}
                      </CardTitle>
                      <CardDescription className="text-sm sm:text-base mt-2">
                        {plan.description}
                      </CardDescription>

                      {/* Price Display - Enhanced */}
                      <div className="mt-6 flex items-baseline gap-2">
                        <span className={`text-5xl sm:text-6xl font-extrabold ${plan.is_popular ? "gradient-text-subtle" : "text-foreground"}`}>
                          {plan.price.split("/")[0]}
                        </span>
                        {plan.price.includes("/") && <span className="text-lg text-muted-foreground">
                            /{plan.price.split("/")[1]}
                          </span>}
                      </div>
                    </CardHeader>

                    <CardContent className="relative z-10">
                      {/* Features List - With Icons */}
                      <ul className="space-y-4 mb-8">
                        {plan.pricing_plan_features?.map((feature, idx) => <li key={idx} className="flex items-start gap-3 text-sm sm:text-base group">
                            <div className={`flex-shrink-0 mt-0.5 ${plan.is_popular ? "text-primary" : "text-muted-foreground"} group-hover:text-primary transition-colors`}>
                              {getFeatureIcon(feature.feature_key)}
                            </div>
                            <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                              {getFeatureText(feature.feature_key)}
                            </span>
                          </li>)}
                      </ul>

                      {/* CTA Button - Enhanced */}
                      <Button onClick={() => openAuth("register")} className={`w-full text-sm sm:text-base group relative overflow-hidden ${plan.is_popular ? "bg-gradient-to-r from-primary to-purple-600 hover:shadow-lg hover:shadow-primary/50" : ""}`} variant={plan.is_popular ? "default" : "outline"} size="lg">
                        {plan.plan_key === "free" ? "Zacznij za darmo" : "Zdobądź Premium"}
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </Button>

                      {/* Subtle note for premium plan */}
                      {plan.is_popular && <p className="text-xs text-center text-muted-foreground mt-3">
                          Anuluj kiedykolwiek • Bez karty kredytowej
                        </p>}
                    </CardContent>
                  </Card>)}
              </div>
            </div>
          </section>
        </LazySection>}

      {/* CTA Section */}
      {sections?.cta?.is_active && <section className="px-4 sm:px-6 py-16 sm:py-24 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Card className="glass-effect-intense border-primary/20">
              <CardContent className="p-8 sm:p-12">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6">
                  <span className="gradient-text-mega">
                    Gotowy wnieść swoje treningi na wyższy poziom?
                  </span>
                </h2>
                <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto">
                  Dołącz do sportowców, którzy już doskonalą swoje umiejętności
                  z IguanaFlow.
                </p>
                <Button onClick={() => openAuth("register")} size="lg" className="text-sm sm:text-base group">
                  Zacznij za darmo
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>}

      {/* Footer */}
      <footer className="border-t border-white/10 bg-background/50 backdrop-blur-lg relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src={IguanaLogo} alt="IguanaFlow Logo" className="w-6 h-6" />
                <span className="text-lg font-bold gradient-text">
                  IguanaFlow
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Zmień swoje treningi dzięki kompleksowej platformie treningowej.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Firma</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/about-us" className="hover:text-foreground transition-colors">
                    O nas
                  </Link>
                </li>
                <li>
                  <Link to="/privacy-policy" className="hover:text-foreground transition-colors">
                    Polityka prywatności
                  </Link>
                </li>
                <li>
                  <Link to="/terms-of-use" className="hover:text-foreground transition-colors">
                    Regulamin
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Obserwuj nas</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="https://instagram.com/iguana.flow" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors flex items-center gap-2 group">
                    <Instagram className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    @iguana.flow
                  </a>
                </li>
              </ul>
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Kontakt</h3>
                <a href="mailto:contact@iguanaflow.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  contact@iguanaflow.com
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} IguanaFlow. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} mode={authMode} onModeChange={setAuthMode} />
      <CookiesBanner />
      <PWAInstallInstructions open={showIOSInstructions} onOpenChange={setShowIOSInstructions} isIOSDevice={isIOSDevice} />
    </div>;
};
export default Landing;