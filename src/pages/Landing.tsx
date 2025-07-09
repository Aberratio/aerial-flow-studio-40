
import React, { useState } from 'react';
import { ChevronRight, Zap, Users, Trophy, BookOpen, ArrowRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import AuthModal from '@/components/Auth/AuthModal';

const Landing = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');

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

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="gradient-text font-bold text-2xl">AerialFit</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => openAuth('login')}
              className="text-white hover:text-purple-300"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => openAuth('register')}
              className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600"
            >
              Get Started
              <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                  Master Your{' '}
                  <span className="gradient-text">Aerial</span>{' '}
                  Journey
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Connect with aerial athletes worldwide, track your progress, and push your limits with structured challenges and a comprehensive pose library.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg"
                  onClick={() => openAuth('register')}
                  className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-lg px-8"
                >
                  Start Training Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 text-lg px-8"
                >
                  <Play className="mr-2 w-5 h-5" />
                  Watch Demo
                </Button>
              </div>

              <div className="flex items-center space-x-8 pt-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="gradient-text text-3xl font-bold">{stat.value}</div>
                    <div className="text-muted-foreground text-sm">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10">
                <img
                  src="https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=800&fit=crop"
                  alt="Aerial athlete performing on silks"
                  className="rounded-2xl shadow-2xl hover-lift"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 rounded-2xl blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Everything You Need to{' '}
              <span className="gradient-text">Excel</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From beginner-friendly tutorials to advanced challenge programs, we've got you covered at every stage of your aerial journey.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index} 
                  className="glass-effect border-white/10 hover-lift group"
                >
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4 text-white">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
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
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Choose Your{' '}
              <span className="gradient-text">Training</span>{' '}
              Plan
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Start free or unlock the full potential of your aerial journey with our premium features.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="glass-effect border-white/10 p-8 relative">
              <CardContent className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
                  <div className="text-4xl font-bold gradient-text mb-4">$0</div>
                  <p className="text-muted-foreground">Perfect for getting started</p>
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
                  onClick={() => openAuth('register')}
                  className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
                >
                  Get Started Free
                </Button>
              </CardContent>
            </Card>

            {/* Premium Plan */}
            <Card className="glass-effect border-white/10 p-8 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
              </div>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-white mb-2">Premium</h3>
                  <div className="text-4xl font-bold gradient-text mb-4">$10<span className="text-lg text-muted-foreground">/month</span></div>
                  <p className="text-muted-foreground">For serious aerial athletes</p>
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
                  onClick={() => openAuth('register')}
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
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="glass-effect border-white/10 p-12">
            <CardContent className="space-y-8">
              <h2 className="text-4xl lg:text-5xl font-bold">
                Ready to{' '}
                <span className="gradient-text">Transform</span>{' '}
                Your Training?
              </h2>
              <p className="text-xl text-muted-foreground">
                Join thousands of aerial athletes who are already using AerialFit to reach new heights in their practice.
              </p>
              <Button 
                size="lg"
                onClick={() => openAuth('register')}
                className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-lg px-12"
              >
                Get Started Today
                <ArrowRight className="ml-2 w-5 h-5" />
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
