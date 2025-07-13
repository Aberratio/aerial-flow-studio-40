import React, { useState, useEffect } from 'react';
import { ChevronRight, Zap, Users, Trophy, BookOpen, ArrowRight, Sparkles, Star, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AuthModal from '@/components/Auth/AuthModal';
import CookiesBanner from '@/components/CookiesBanner';
import { supabase } from '@/integrations/supabase/client';
import IguanaLogo from '@/assets/iguana-logo.svg';
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
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isLoaded, setIsLoaded] = useState(false);
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [allDataLoaded, setAllDataLoaded] = useState(false);
  useEffect(() => {
    loadHeroImage();
    loadPricingPlans();
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Check if all data is loaded
  useEffect(() => {
    if (heroImage !== null && pricingPlans.length > 0) {
      setAllDataLoaded(true);
    }
  }, [heroImage, pricingPlans]);
  const loadHeroImage = async () => {
    try {
      const {
        data: heroSection
      } = await supabase.from('landing_page_sections').select('image_url').eq('section_key', 'hero').single();
      if (heroSection?.image_url) {
        setHeroImage(heroSection.image_url);
      }
    } catch (error) {
      console.error('Error loading hero image:', error);
    }
  };
  const loadPricingPlans = async () => {
    try {
      const {
        data: plansData
      } = await supabase.from('pricing_plans').select(`
          *,
          pricing_plan_features (
            feature_key,
            is_included,
            display_order
          )
        `).order('display_order');
      if (plansData) {
        const plansWithFeatures = plansData.map(plan => ({
          ...plan,
          features: plan.pricing_plan_features.map((feature: any) => ({
            ...feature,
            feature_text: getFeatureText(feature.feature_key)
          })).sort((a, b) => a.display_order - b.display_order)
        }));
        setPricingPlans(plansWithFeatures);
      }
    } catch (error) {
      console.error('Error loading pricing plans:', error);
    }
  };
  const getFeatureText = (featureKey: string) => {
    const featureTexts: Record<string, string> = {
      'basic_features': 'Basic features',
      'figure_library': 'Access to figure library',
      'progress_tracking': 'Progress tracking',
      'social_features': 'Social features',
      'premium_challenges': 'Premium challenges',
      'advanced_analytics': 'Advanced analytics',
      'priority_support': 'Priority support',
      'custom_training': 'Custom training plans'
    };
    return featureTexts[featureKey] || featureKey;
  };
  const features = [{
    icon: Users,
    title: 'Connect & Share',
    description: 'Follow other aerial athletes, share your progress, and get inspired by the community.',
    accent: 'tropical'
  }, {
    icon: BookOpen,
    title: 'Comprehensive Library',
    description: 'Access hundreds of aerial figures with detailed instructions and progressions.',
    accent: 'primary'
  }, {
    icon: Trophy,
    title: 'Take on Challenges',
    description: 'Join structured training programs and track your improvement over time.',
    accent: 'tropical'
  }, {
    icon: Zap,
    title: 'Track Progress',
    description: 'Log your training sessions and see your aerial journey unfold.',
    accent: 'primary'
  }];
  const stats = [{
    value: '10K+',
    label: 'Active Athletes'
  }, {
    value: '500+',
    label: 'Aerial Figures'
  }, {
    value: '50+',
    label: 'Challenges'
  }, {
    value: '95%',
    label: 'Success Rate'
  }];
  const openAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };
  if (!allDataLoaded) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin animation-delay-200 mx-auto"></div>
          </div>
          <div className="flex items-center space-x-2">
            <img src={IguanaLogo} alt="IguanaFlow Logo" className="w-8 h-8 animate-pulse" />
            <span className="font-bold text-2xl">
              <span className="text-white">Iguana</span>
              <span className="bg-gradient-to-r from-purple-500 via-violet-500 to-purple-700 bg-clip-text text-transparent">Flow</span>
            </span>
          </div>
          <p className="text-muted-foreground animate-pulse">Loading your aerial journey...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen relative overflow-hidden parallax-bg">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="hero-particle"></div>
        <div className="hero-particle-tropical"></div>
        <div className="hero-particle"></div>
        <div className="hero-particle-tropical"></div>
      </div>
      
      {/* Dynamic Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 animate-fade-in"></div>
      
      {/* Additional tropical accent gradients */}
      <div className="absolute top-20 right-10 w-96 h-96 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
      <div className="absolute bottom-20 left-10 w-80 h-80 bg-gradient-to-tr from-purple-500/15 to-violet-500/8 rounded-full blur-2xl animate-pulse animation-delay-600"></div>

      {/* Header */}
      <header className="relative z-10 px-4 sm:px-6 py-4">
        <nav className={`max-w-7xl mx-auto flex items-center justify-between transition-all duration-1000 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <img src={IguanaLogo} alt="IguanaFlow Logo" className="w-6 h-6 sm:w-8 sm:h-8" />
            <span className="font-bold text-xl sm:text-2xl">
              <span className="text-white">Iguana</span>
              <span className="bg-gradient-to-r from-purple-500 via-violet-500 to-purple-700 bg-clip-text text-transparent">Flow</span>
            </span>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
            <Button variant="ghost" onClick={() => openAuth('login')} className="text-white hover:text-purple-300 text-xs sm:text-sm md:text-base px-2 sm:px-4 transition-all duration-300 border-0">
              <span className="hidden sm:inline">Sign In</span>
              <span className="sm:hidden">Sign In</span>
            </Button>
            <Button variant="primary" onClick={() => openAuth('register')} className="text-xs sm:text-sm md:text-base px-2 sm:px-3 md:px-4">
              <span className="hidden md:inline">Get Started</span>
              <span className="hidden sm:inline md:hidden">Start</span>
              <span className="sm:hidden">Sign up</span>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 pt-12 sm:pt-20 pb-16 sm:pb-32 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-6 sm:space-y-8 text-center lg:text-left">
              <div className="space-y-4 sm:space-y-6">
                <h1 className={`text-3xl sm:text-5xl lg:text-7xl font-bold leading-tight transition-all duration-1000 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0 translate-y-10'}`}>
                  Master Your <span className="gradient-text-mega">Aerial</span> Journey
                </h1>
                <p className={`text-base sm:text-xl text-muted-foreground leading-relaxed transition-all duration-1000 animation-delay-400 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0 translate-y-10'}`}>
                  Connect with aerial athletes worldwide, track your progress, and push your limits with structured challenges and a comprehensive pose library.
                </p>
              </div>
              
              <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md mx-auto lg:mx-0 transition-all duration-1000 animation-delay-600 ${isLoaded ? 'animate-bounce-in' : 'opacity-0 scale-75'}`}>
                <Button variant="primary" size="lg" onClick={() => openAuth('register')} className="text-base sm:text-lg px-6 sm:px-8">
                  <Star className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                  Start Training Free
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>

              <div className={`grid grid-cols-2 sm:flex sm:items-center sm:space-x-8 gap-4 sm:gap-0 pt-6 sm:pt-8 max-w-sm mx-auto lg:mx-0 transition-all duration-1000 animation-delay-800 ${isLoaded ? 'animate-scale-in' : 'opacity-0 scale-90'}`}>
                {stats.map((stat, index) => <div key={index} className="text-center card-hover-effect">
                    <div className="gradient-text-mega text-2xl sm:text-3xl font-bold">{stat.value}</div>
                    <div className="text-muted-foreground text-xs sm:text-sm">{stat.label}</div>
                  </div>)}
              </div>
            </div>

            <div className={`relative order-first lg:order-last transition-all duration-1000 animation-delay-1000 ${isLoaded ? 'animate-scale-in floating' : 'opacity-0 scale-75'}`}>
              <div className="relative z-10">
                <img src={heroImage || "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=800&fit=crop"} alt="Aerial athlete performing on silks" className="rounded-2xl shadow-2xl hover-lift mx-auto w-[400px] h-[600px] sm:w-[450px] sm:h-[650px] lg:w-[500px] lg:h-[700px] object-cover glass-effect-intense pulse-glow" />
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
              Elevate Your <span className="gradient-text-mega">Aerial Practice</span>
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
              Everything you need to excel in aerial arts, from beginner-friendly tutorials to advanced training programs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => <Card key={index} className={`glass-effect border-white/10 hover-lift card-hover-effect transition-all duration-500 animation-delay-${(index + 1) * 200} animate-scale-in`}>
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.accent === 'tropical' ? 'from-emerald-500 to-teal-500' : 'from-purple-500 to-violet-500'} flex items-center justify-center mb-4 pulse-glow${feature.accent === 'tropical' ? '-tropical' : ''}`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 animate-fade-in-up">
              Choose Your <span className="gradient-text-mega">Journey</span>
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto animate-fade-in-up animation-delay-200">
              Start free and upgrade when you're ready to unlock premium features and advanced training programs.
            </p>
          </div>

          <div className="flex justify-center">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => <Card key={plan.id} className={`glass-effect border-white/10 hover-lift relative transition-all duration-500 animation-delay-${(index + 1) * 200} animate-scale-in ${plan.is_popular ? 'ring-2 ring-purple-500/50 scale-105' : ''}`}>
                {plan.is_popular && <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-purple-500 to-violet-500 text-white px-4 py-1 rounded-full text-sm font-medium pulse-glow">
                      Most Popular
                    </span>
                  </div>}
                <CardContent className="p-6 sm:p-8">
                  <div className="text-center mb-6">
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <div className="gradient-text-mega text-3xl sm:text-4xl font-bold mb-2">{plan.price}</div>
                    <p className="text-muted-foreground text-sm">{plan.description}</p>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => <div key={featureIndex} className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${feature.is_included ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gray-600'}`}>
                          {feature.is_included ? <Heart className="w-3 h-3 text-white" /> : <span className="w-1 h-1 bg-gray-400 rounded-full"></span>}
                        </div>
                        <span className={`text-sm ${feature.is_included ? 'text-white' : 'text-gray-400'}`}>
                          {getFeatureText(feature.feature_key)}
                        </span>
                      </div>)}
                  </div>
                  
                  <Button variant={plan.is_popular ? "primary" : "outline"} className="w-full" onClick={() => openAuth('register')}>
                    {plan.plan_key === 'free' ? 'Get Started' : 'Upgrade Now'}
                  </Button>
                </CardContent>
              </Card>)}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="glass-effect-intense border-white/20 pulse-glow-soft overflow-hidden">
            <CardContent className="p-8 sm:p-12 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-violet-500/10 to-emerald-500/10"></div>
              <div className="relative z-10 space-y-6">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                  Ready to <span className="gradient-text-mega">Soar Higher</span>?
                </h2>
                <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                  Join thousands of aerial athletes who trust IguanaFlow to elevate their practice. Start your journey today.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button variant="primary" size="lg" onClick={() => openAuth('register')} className="text-lg px-8 animate-bounce-in">
                    Start Free Today
                  </Button>
                  <Button variant="ghost" onClick={() => openAuth('login')} className="text-white hover:text-purple-300 text-lg px-8">
                    Sign In
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Auth Modal */}
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} mode={authMode} onModeChange={setAuthMode} />

      {/* Cookies Banner */}
      <CookiesBanner />

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <img src={IguanaLogo} alt="IguanaFlow Logo" className="w-6 h-6" />
                <span className="font-bold text-lg">
                  <span className="text-white">Iguana</span>
                  <span className="bg-gradient-to-r from-purple-500 via-violet-500 to-purple-700 bg-clip-text text-transparent">Flow</span>
                </span>
              </div>
              <p className="text-muted-foreground text-sm">
                Elevate your aerial practice with our comprehensive platform designed for aerial athletes of all levels.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Quick Links</h4>
              <div className="space-y-2">
                <Link to="/about-us" className="text-muted-foreground hover:text-purple-400 transition-colors text-sm block">
                  About Us
                </Link>
                <Link to="/privacy-policy" className="text-muted-foreground hover:text-purple-400 transition-colors text-sm block">
                  Privacy Policy
                </Link>
                <Link to="/terms-of-use" className="text-muted-foreground hover:text-purple-400 transition-colors text-sm block">
                  Terms of Use
                </Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Features</h4>
              <div className="space-y-2">
                <span className="text-muted-foreground text-sm block">Figure Library</span>
                <span className="text-muted-foreground text-sm block">Progress Tracking</span>
                <span className="text-muted-foreground text-sm block">Training Challenges</span>
                <span className="text-muted-foreground text-sm block">Social Community</span>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm">hello@iguanaflow.com</p>
                <p className="text-muted-foreground text-sm">Support Center</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-6 text-center">
            <p className="text-muted-foreground text-sm">
              © 2025 IguanaFlow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>;
};
export default Landing;