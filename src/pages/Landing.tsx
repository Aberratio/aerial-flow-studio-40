import React, { useState, useEffect } from 'react';
import { ChevronRight, Zap, Users, Trophy, BookOpen, ArrowRight, Sparkles, Star, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AuthModal from '@/components/Auth/AuthModal';
import CookiesBanner from '@/components/CookiesBanner';
import { supabase } from '@/integrations/supabase/client';
import IguanaLogo from '@/assets/iguana-logo.svg';
interface LandingPageContent {
  [key: string]: string;
}
interface Language {
  id: string;
  name: string;
  native_name: string;
  is_default: boolean;
}
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
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [languages, setLanguages] = useState<Language[]>([]);
  const [content, setContent] = useState<LandingPageContent>({});
  const [isContentLoaded, setIsContentLoaded] = useState(false);
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [allDataLoaded, setAllDataLoaded] = useState(false);
  const [uiStrings, setUiStrings] = useState<{[key: string]: string}>({});

  // Detect browser language
  useEffect(() => {
    const browserLang = navigator.language.toLowerCase();
    const detectedLanguage = browserLang.startsWith('pl') ? 'pl' : 'en';
    setCurrentLanguage(detectedLanguage);
  }, []);

  // Load languages and content
  useEffect(() => {
    loadLanguagesAndContent();
    loadHeroImage();
    loadPricingPlans();
    loadUiStrings();
  }, []);

  // Load content when language changes
  useEffect(() => {
    if (languages.length > 0 && currentLanguage) {
      loadContent(currentLanguage);
      loadPricingPlans();
      loadUiStrings();
    }
  }, [currentLanguage, languages]);
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Check if all data is loaded
  useEffect(() => {
    if (isContentLoaded && heroImage !== null && pricingPlans.length > 0 && languages.length > 0) {
      setAllDataLoaded(true);
    }
  }, [isContentLoaded, heroImage, pricingPlans, languages]);
  const loadLanguagesAndContent = async () => {
    try {
      const {
        data: languagesData
      } = await supabase.from('languages').select('*').order('is_default', {
        ascending: false
      });
      if (languagesData) {
        setLanguages(languagesData);
      }
    } catch (error) {
      console.error('Error loading languages:', error);
    }
  };
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
  const loadContent = async (languageId: string) => {
    try {
      const {
        data: contentData
      } = await supabase.from('landing_page_content').select('content_key, content_value').eq('language_id', languageId);
      if (contentData) {
        const contentMap: LandingPageContent = {};
        contentData.forEach(item => {
          contentMap[item.content_key] = item.content_value;
        });
        setContent(contentMap);
        setIsContentLoaded(true);
      }
    } catch (error) {
      console.error('Error loading content:', error);
      setIsContentLoaded(true); // Still show fallback content
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
        const plansWithFeatures = await Promise.all(plansData.map(async plan => {
          // Get plan translation
          const {
            data: planTranslation
          } = await supabase.from('pricing_plan_translations').select('name, description').eq('plan_id', plan.id).eq('language_id', currentLanguage).single();

          // Get feature translations
          const featuresWithTranslations = await Promise.all(plan.pricing_plan_features.map(async (feature: any) => {
            const {
              data: featureTranslation
            } = await supabase.from('pricing_feature_translations').select('feature_text').eq('feature_key', feature.feature_key).eq('language_id', currentLanguage).single();
            return {
              ...feature,
              feature_text: featureTranslation?.feature_text || feature.feature_key
            };
          }));
          return {
            ...plan,
            name: planTranslation?.name || plan.name,
            description: planTranslation?.description || plan.description,
            features: featuresWithTranslations.sort((a, b) => a.display_order - b.display_order)
          };
        }));
        setPricingPlans(plansWithFeatures);
      }
    } catch (error) {
      console.error('Error loading pricing plans:', error);
    }
  };
  
  const loadUiStrings = async () => {
    try {
      const { data } = await supabase
        .from('ui_strings')
        .select('string_key, value')
        .eq('language_id', currentLanguage)
        .eq('category', 'footer');
      
      if (data) {
        const stringsMap: {[key: string]: string} = {};
        data.forEach(item => {
          stringsMap[item.string_key] = item.value;
        });
        setUiStrings(stringsMap);
      }
    } catch (error) {
      console.error('Error loading UI strings:', error);
    }
  };

  // Fallback content for when database content is not available
  const getContent = (key: string, fallback: string) => {
    return content[key] || fallback;
  };
  
  // Get UI strings with fallback
  const getUiString = (key: string, fallback: string) => {
    return uiStrings[key] || fallback;
  };

  // Helper function to render text with gradient spans
  const renderTextWithGradient = (text: string) => {
    if (!text) return text;

    // Look for text wrapped in [gradient]...[/gradient] tags
    const parts = text.split(/(\[gradient\].*?\[\/gradient\])/g);
    return parts.map((part, index) => {
      if (part.startsWith('[gradient]') && part.endsWith('[/gradient]')) {
        const gradientText = part.replace(/\[gradient\]|\[\/gradient\]/g, '');
        return <span key={index} className="gradient-text-mega">
            {gradientText}
          </span>;
      }
      return part;
    });
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
              <span className="text-white">Iguana</span><span className="bg-gradient-to-r from-purple-500 via-violet-500 to-purple-700 bg-clip-text text-transparent">Flow</span>
            </span>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
            {languages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentLanguage(currentLanguage === 'pl' ? 'en' : 'pl')}
                className="w-[40px] h-[40px] p-2 bg-white/10 border border-white/20 text-white hover:bg-white/20 rounded-lg"
              >
                {currentLanguage === 'pl' ? (
                  <span className="text-sm font-bold font-sans">🇵🇱</span>
                ) : (
                  <span className="text-sm font-bold font-sans">EN</span>
                )}
              </Button>
            )}
            <Button variant="ghost" onClick={() => openAuth('login')} className="text-white hover:text-purple-300 text-xs sm:text-sm md:text-base px-2 sm:px-4 transition-all duration-300 border-0">
              <span className="hidden sm:inline">{getContent('nav_sign_in', 'Sign In')}</span>
              <span className="sm:hidden">Log In</span>
            </Button>
            <Button variant="primary" onClick={() => openAuth('register')} className="text-xs sm:text-sm md:text-base px-2 sm:px-3 md:px-4">
              <span className="hidden sm:inline">
                <Sparkles className="mr-1 w-3 h-3 sm:w-4 sm:h-4" />
              </span>
              <span className="hidden md:inline">{getContent('nav_get_started', 'Get Started')}</span>
              <span className="hidden sm:inline md:hidden">{getContent('nav_start', 'Start')}</span>
              <span className="sm:hidden">Start</span>
              <span className="hidden sm:inline">
                <ChevronRight className="ml-1 w-3 h-3 sm:w-4 sm:h-4" />
              </span>
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
                  {renderTextWithGradient(getContent('title', 'Master Your [gradient]Aerial[/gradient] Journey'))}
                </h1>
                <p className={`text-base sm:text-xl text-muted-foreground leading-relaxed transition-all duration-1000 animation-delay-400 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0 translate-y-10'}`}>
                  {getContent('subtitle', 'Connect with aerial athletes worldwide, track your progress, and push your limits with structured challenges and a comprehensive pose library.')}
                </p>
              </div>
              
              <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md mx-auto lg:mx-0 transition-all duration-1000 animation-delay-600 ${isLoaded ? 'animate-bounce-in' : 'opacity-0 scale-75'}`}>
                <Button variant="primary" size="lg" onClick={() => openAuth('register')} className="text-base sm:text-lg px-6 sm:px-8">
                  <Star className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                  {getContent('button_text', 'Start Training Free')}
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>

              <div className={`grid grid-cols-2 sm:flex sm:items-center sm:space-x-8 gap-4 sm:gap-0 pt-6 sm:pt-8 max-w-sm mx-auto lg:mx-0 transition-all duration-1000 animation-delay-800 ${isLoaded ? 'animate-scale-in' : 'opacity-0 scale-90'}`}>
                <div className="text-center card-hover-effect">
                  <div className="gradient-text-mega text-2xl sm:text-3xl font-bold">{getContent('stat_1_value', '10K+')}</div>
                  <div className="text-muted-foreground text-xs sm:text-sm">{getContent('stat_1_label', 'Active Athletes')}</div>
                </div>
                <div className="text-center card-hover-effect">
                  <div className="gradient-text-mega text-2xl sm:text-3xl font-bold">{getContent('stat_2_value', '500+')}</div>
                  <div className="text-muted-foreground text-xs sm:text-sm">{getContent('stat_2_label', 'Aerial Figures')}</div>
                </div>
                <div className="text-center card-hover-effect">
                  <div className="gradient-text-mega text-2xl sm:text-3xl font-bold">{getContent('stat_3_value', '50+')}</div>
                  <div className="text-muted-foreground text-xs sm:text-sm">{getContent('stat_3_label', 'Challenges')}</div>
                </div>
                <div className="text-center card-hover-effect">
                  <div className="gradient-text-mega text-2xl sm:text-3xl font-bold">{getContent('stat_4_value', '95%')}</div>
                  <div className="text-muted-foreground text-xs sm:text-sm">{getContent('stat_4_label', 'Success Rate')}</div>
                </div>
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
              {renderTextWithGradient(getContent('features_title', 'Everything You Need to [gradient]Excel[/gradient]'))}
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto px-4 animate-fade-in-up animation-delay-200">
              {getContent('features_subtitle', 'From beginner-friendly tutorials to advanced challenge programs, we\'ve got you covered at every stage of your aerial journey.')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => {
            const Icon = feature.icon;
            const isEven = index % 2 === 0;
            const accentColor = feature.accent === 'tropical' ? 'from-emerald-600 via-teal-600 to-cyan-600' : 'from-purple-500 via-violet-500 to-indigo-500';
            const glowClass = feature.accent === 'tropical' ? 'pulse-glow-tropical' : 'pulse-glow';
            return <Card key={index} className={`glass-effect-intense border-white/20 card-hover-effect group animate-fade-in-up animation-delay-${(index + 1) * 200}`}>
                  <CardContent className="p-6 sm:p-8 text-center">
                    <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r ${accentColor} rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-all duration-500 ${glowClass} floating`}>
                      <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <h3 className={`text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-white ${feature.accent === 'tropical' ? 'gradient-text-tropical' : 'gradient-text'}`}>
                      {getContent(`feature_${index + 1}_title`, feature.title)}
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {getContent(`feature_${index + 1}_description`, feature.description)}
                    </p>
                  </CardContent>
                </Card>;
          })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 animate-fade-in-up">
              {renderTextWithGradient(getContent('pricing_title', 'Choose Your [gradient]Training[/gradient] Plan'))}
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto px-4 animate-fade-in-up animation-delay-200">
              {getContent('pricing_subtitle', 'Start free or unlock the full potential of your aerial journey with our premium features.')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {pricingPlans.map((plan, index) => <Card key={plan.id} className={`glass-effect-intense border-white/20 p-6 sm:p-8 relative card-hover-effect animate-fade-in-up animation-delay-${(index + 1) * 200} ${plan.is_popular ? 'pulse-glow' : ''}`}>
                {plan.is_popular && <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-semibold pulse-glow-tropical floating">
                      <Heart className="inline-block w-3 h-3 mr-1" />
                      Most Popular
                    </div>
                  </div>}
                <CardContent className="space-y-4 sm:space-y-6">
                  <div className="text-center">
                    <h3 className={`text-xl sm:text-2xl font-bold text-white mb-2 ${plan.is_popular ? 'gradient-text-mega' : 'gradient-text'}`}>
                      {plan.name}
                    </h3>
                    <div className="text-3xl sm:text-4xl font-bold gradient-text-mega mb-3 sm:mb-4">
                      {plan.price}
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      {plan.description}
                    </p>
                  </div>
                  
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => <li key={feature.feature_key} className="flex items-center text-white">
                        <div className={`w-5 h-5 ${feature.is_included ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-500'} rounded-full flex items-center justify-center mr-3`}>
                          <span className="text-xs">{feature.is_included ? '✓' : '✕'}</span>
                        </div>
                        <span className={feature.is_included ? 'text-white' : 'text-gray-400'}>
                          {feature.feature_text}
                        </span>
                      </li>)}
                  </ul>

                  <Button variant="primary" size="lg" onClick={() => openAuth('register')} className="w-full">
                    {plan.plan_key === 'free' ? 'Get Started Free' : 'Start Premium Trial'}
                  </Button>
                </CardContent>
              </Card>)}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="glass-effect-intense border-white/20 p-8 sm:p-12 card-hover-effect animate-fade-in-up pulse-glow">
            <CardContent className="space-y-6 sm:space-y-8">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold floating">
                {renderTextWithGradient(getContent('cta_title', 'Ready to [gradient]Transform[/gradient] Your Training?'))}
              </h2>
              <p className="text-base sm:text-xl text-muted-foreground px-4 animate-fade-in-up animation-delay-200">
                {getContent('cta_subtitle', 'Join thousands of aerial athletes who are already using IguanaFlow to reach new heights in their practice.')}
              </p>
              <Button variant="primary" size="lg" onClick={() => openAuth('register')} className="text-base sm:text-lg px-8 sm:px-12 animate-bounce-in animation-delay-400 w-full sm:w-auto mx-auto">
                <Sparkles className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                {getContent('cta_button', 'Get Started Today')}
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} mode={authMode} onModeChange={setAuthMode} />
      
      {/* Cookies Banner */}
      <CookiesBanner />
      
      {/* Footer */}
      <footer className="relative z-10 bg-slate-900/80 backdrop-blur-sm border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Logo and Description */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center space-x-3">
                <img src={IguanaLogo} alt="IguanaFlow Logo" className="w-8 h-8" />
                <span className="font-bold text-xl">
                  <span className="text-white">Iguana</span>
                  <span className="bg-gradient-to-r from-purple-500 via-violet-500 to-purple-700 bg-clip-text text-transparent">Flow</span>
                </span>
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                {getUiString('footer_description', 'The ultimate platform for aerial athletes to connect, learn, and grow together. Master your aerial journey with expert guidance and community support.')}
              </p>
              {/* Social Links - Instagram only */}
              <div className="flex space-x-4">
                <a href="https://instagram.com/iguana.flow" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-purple-400 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="font-semibold text-white">{getUiString('footer_quick_links', 'Quick Links')}</h3>
              <div className="space-y-2">
                <Link to="/privacy-policy" className="block text-sm text-muted-foreground hover:text-purple-400 transition-colors">
                  {getUiString('footer_privacy', 'Privacy Policy')}
                </Link>
                <Link to="/terms-of-use" className="block text-sm text-muted-foreground hover:text-purple-400 transition-colors">
                  {getUiString('footer_terms', 'Terms of Use')}
                </Link>
                <Link to="/about-us" className="block text-sm text-muted-foreground hover:text-purple-400 transition-colors">
                  {getUiString('footer_about', 'About Us')}
                </Link>
              </div>
            </div>
            
            {/* Contact */}
            <div className="space-y-4">
              <h3 className="font-semibold text-white">{getUiString('footer_contact', 'Contact')}</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>support@iguanaflow.com</p>
                <p>{getUiString('footer_community', 'Join our community')}</p>
              </div>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="border-t border-white/10 mt-8 pt-8 text-center">
            <p className="text-sm text-muted-foreground">
              © 2025 IguanaFlow. {getUiString('footer_rights', 'All rights reserved.')}
            </p>
          </div>
        </div>
      </footer>
    </div>;
};
export default Landing;