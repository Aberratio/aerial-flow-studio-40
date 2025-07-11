
import React, { useState, useEffect } from 'react';
import { ChevronRight, Zap, Users, Trophy, BookOpen, ArrowRight, Sparkles, Star, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AuthModal from '@/components/Auth/AuthModal';

const Landing = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const features = [
    {
      icon: Users,
      title: 'Connect & Share',
      description: 'Follow other aerial athletes, share your progress, and get inspired by the community.',
    },
    {
      icon: BookOpen,
      title: 'Comprehensive Library',
      description: 'Access hundreds of aerial figures with detailed instructions and progressions.',
    },
    {
      icon: Trophy,
      title: 'Take on Challenges',
      description: 'Join structured training programs and track your improvement over time.',
    },
    {
      icon: Zap,
      title: 'Track Progress',
      description: 'Log your training sessions and see your aerial journey unfold.',
    },
  ];

  const stats = [
    { value: '10K+', label: 'Active Athletes' },
    { value: '500+', label: 'Aerial Figures' },
    { value: '50+', label: 'Challenges' },
    { value: '95%', label: 'Success Rate' },
  ];

  const openAuth = () => {
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen relative overflow-hidden parallax-bg">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="hero-particle"></div>
        <div className="hero-particle"></div>
        <div className="hero-particle"></div>
      </div>
      
      {/* Dynamic Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 animate-fade-in"></div>
      {/* Header */}
      <header className="relative z-10 px-4 sm:px-6 py-4">
        <nav className={`max-w-7xl mx-auto flex items-center justify-between transition-all duration-1000 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-xl flex items-center justify-center pulse-glow floating">
              <span className="text-white font-bold text-lg sm:text-xl">I</span>
            </div>
            <span className="gradient-text-mega font-bold text-xl sm:text-2xl">IguanaFlow</span>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button 
              variant="ghost" 
              onClick={openAuth}
              className="text-white hover:text-purple-300 text-sm sm:text-base px-2 sm:px-4 hover-lift glass-effect"
            >
              Sign In
            </Button>
            <Button 
              onClick={openAuth}
              className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-sm sm:text-base px-3 sm:px-4 pulse-glow hover-lift"
            >
              <Sparkles className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Get Started</span>
              <span className="sm:hidden">Start</span>
              <ChevronRight className="ml-1 sm:ml-2 w-3 h-3 sm:w-4 sm:h-4" />
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
                  Master Your{' '}
                  <span className="gradient-text-mega floating">Aerial</span>{' '}
                  Journey
                </h1>
                <p className={`text-base sm:text-xl text-muted-foreground leading-relaxed transition-all duration-1000 animation-delay-400 ${isLoaded ? 'animate-fade-in-up' : 'opacity-0 translate-y-10'}`}>
                  Connect with aerial athletes worldwide, track your progress, and push your limits with structured challenges and a comprehensive pose library.
                </p>
              </div>
              
              <div className={`flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md mx-auto lg:mx-0 transition-all duration-1000 animation-delay-600 ${isLoaded ? 'animate-bounce-in' : 'opacity-0 scale-75'}`}>
                <Button 
                  size="lg"
                  onClick={openAuth}
                  className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-base sm:text-lg px-6 sm:px-8 pulse-glow hover-lift glass-effect-intense"
                >
                  <Star className="mr-2 w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                  Start Training Free
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </div>

              <div className={`grid grid-cols-2 sm:flex sm:items-center sm:space-x-8 gap-4 sm:gap-0 pt-6 sm:pt-8 max-w-sm mx-auto lg:mx-0 transition-all duration-1000 animation-delay-800 ${isLoaded ? 'animate-scale-in' : 'opacity-0 scale-90'}`}>
                {stats.map((stat, index) => (
                  <div key={index} className="text-center card-hover-effect">
                    <div className="gradient-text-mega text-2xl sm:text-3xl font-bold">{stat.value}</div>
                    <div className="text-muted-foreground text-xs sm:text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`relative order-first lg:order-last transition-all duration-1000 animation-delay-1000 ${isLoaded ? 'animate-scale-in floating' : 'opacity-0 scale-75'}`}>
              <div className="relative z-10">
                <img
                  src="https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=800&fit=crop"
                  alt="Aerial athlete performing on silks"
                  className="rounded-2xl shadow-2xl hover-lift mx-auto max-w-xs sm:max-w-md lg:max-w-none glass-effect-intense pulse-glow"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/30 via-pink-500/30 to-blue-500/30 rounded-2xl blur-3xl floating-delayed"></div>
              
              {/* Floating decorative elements */}
              <div className="absolute -top-6 -right-6 w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full blur-lg animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-md animate-pulse animation-delay-400"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 animate-fade-in-up">
              Everything You Need to{' '}
              <span className="gradient-text-mega">Excel</span>
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto px-4 animate-fade-in-up animation-delay-200">
              From beginner-friendly tutorials to advanced challenge programs, we've got you covered at every stage of your aerial journey.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index} 
                  className={`glass-effect-intense border-white/20 card-hover-effect group animate-fade-in-up animation-delay-${(index + 1) * 200}`}
                >
                  <CardContent className="p-6 sm:p-8 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 group-hover:scale-110 transition-all duration-500 pulse-glow floating">
                      <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-white gradient-text">
                      {feature.title}
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 animate-fade-in-up">
              Choose Your{' '}
              <span className="gradient-text-mega floating">Training</span>{' '}
              Plan
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto px-4 animate-fade-in-up animation-delay-200">
              Start free or unlock the full potential of your aerial journey with our premium features.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="glass-effect-intense border-white/20 p-6 sm:p-8 relative card-hover-effect animate-fade-in-up animation-delay-400">
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="text-center">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 gradient-text">Free</h3>
                  <div className="text-3xl sm:text-4xl font-bold gradient-text-mega mb-3 sm:mb-4">$0</div>
                  <p className="text-sm sm:text-base text-muted-foreground">Perfect for getting started</p>
                </div>
                
                <ul className="space-y-3">
                  <li className="flex items-center text-white">
                    <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-xs">✓</span>
                    </div>
                    Post training updates
                  </li>
                  <li className="flex items-center text-white">
                    <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-xs">✓</span>
                    </div>
                    Invite and connect with friends
                  </li>
                  <li className="flex items-center text-white">
                    <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-xs">✓</span>
                    </div>
                    View community feed
                  </li>
                </ul>

                <Button 
                  size="lg"
                  onClick={openAuth}
                  className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
                >
                  Get Started Free
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="glass-effect-intense border-white/20 p-6 sm:p-8 relative card-hover-effect animate-fade-in-up animation-delay-600 pulse-glow">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-semibold pulse-glow floating">
                  <Heart className="inline-block w-3 h-3 mr-1" />
                  Most Popular
                </div>
              </div>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="text-center">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 gradient-text-mega">Premium</h3>
                  <div className="text-3xl sm:text-4xl font-bold gradient-text-mega mb-3 sm:mb-4">$10<span className="text-base sm:text-lg text-muted-foreground">/month</span></div>
                  <p className="text-sm sm:text-base text-muted-foreground">For serious aerial athletes</p>
                </div>
                
                <ul className="space-y-3">
                  <li className="flex items-center text-white">
                    <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-xs">✓</span>
                    </div>
                    Everything in Free plan
                  </li>
                  <li className="flex items-center text-white">
                    <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-xs">✓</span>
                    </div>
                    Complete figure library access
                  </li>
                  <li className="flex items-center text-white">
                    <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-xs">✓</span>
                    </div>
                    Join challenges & competitions
                  </li>
                  <li className="flex items-center text-white">
                    <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-xs">✓</span>
                    </div>
                    Create custom training sessions
                  </li>
                  <li className="flex items-center text-white">
                    <div className="w-5 h-5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-xs">✓</span>
                    </div>
                    Track progress & analytics
                  </li>
                </ul>

                <Button 
                  size="lg"
                  onClick={openAuth}
                  className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600"
                >
                  Start Premium Trial
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 py-12 sm:py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="glass-effect-intense border-white/20 p-8 sm:p-12 card-hover-effect animate-fade-in-up pulse-glow">
            <CardContent className="space-y-6 sm:space-y-8">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold floating">
                Ready to{' '}
                <span className="gradient-text-mega">Transform</span>{' '}
                Your Training?
              </h2>
              <p className="text-base sm:text-xl text-muted-foreground px-4 animate-fade-in-up animation-delay-200">
                Join thousands of aerial athletes who are already using IguanaFlow to reach new heights in their practice.
              </p>
              <Button 
                size="lg"
                onClick={openAuth}
                className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-base sm:text-lg px-8 sm:px-12 pulse-glow hover-lift glass-effect-intense animate-bounce-in animation-delay-400"
              >
                <Sparkles className="mr-2 w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                Get Started Today
                <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      <AuthModal 
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
};

export default Landing;
