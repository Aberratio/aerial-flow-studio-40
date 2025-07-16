import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  BookOpen, 
  Target, 
  Users, 
  Trophy, 
  Calendar, 
  TrendingUp, 
  ArrowRight, 
  X 
} from 'lucide-react';

interface IntroductionModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const IntroductionModal: React.FC<IntroductionModalProps> = ({ 
  open, 
  onClose, 
  onComplete 
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      icon: BookOpen,
      title: "Welcome to IguanaFlow",
      content: (
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">🪂</div>
          <h3 className="text-xl font-bold text-white mb-2">Your Aerial Journey Starts Here</h3>
          <p className="text-white/80 mb-4">
            IguanaFlow is your comprehensive platform for aerial arts training. 
            Whether you're a beginner or advanced aerialist, we've got you covered.
          </p>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <p className="text-white/90 text-sm">
              Join thousands of aerial artists who are mastering their craft with our structured approach to training.
            </p>
          </div>
        </div>
      )
    },
    {
      icon: Target,
      title: "Exercise Library",
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-center mb-4">
            <Target className="w-12 h-12 text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Master Every Move</h3>
          <p className="text-white/80 mb-4">
            Access our extensive library of aerial exercises, from basic moves to advanced sequences.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="text-green-400 text-sm font-semibold">Beginner</div>
              <div className="text-white/80 text-xs">Start your journey</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="text-yellow-400 text-sm font-semibold">Intermediate</div>
              <div className="text-white/80 text-xs">Build your skills</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="text-red-400 text-sm font-semibold">Advanced</div>
              <div className="text-white/80 text-xs">Push your limits</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="text-purple-400 text-sm font-semibold">Expert</div>
              <div className="text-white/80 text-xs">Master level</div>
            </div>
          </div>
        </div>
      )
    },
    {
      icon: TrendingUp,
      title: "Track Your Progress",
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-center mb-4">
            <TrendingUp className="w-12 h-12 text-teal-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Monitor Your Growth</h3>
          <p className="text-white/80 mb-4">
            Keep track of your aerial progress with our comprehensive tracking system.
          </p>
          <div className="space-y-3">
            <div className="flex items-center bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-3"></div>
              <div className="text-white/90 text-sm">Mark exercises as completed</div>
            </div>
            <div className="flex items-center bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="w-3 h-3 bg-blue-400 rounded-full mr-3"></div>
              <div className="text-white/90 text-sm">Save exercises for later</div>
            </div>
            <div className="flex items-center bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="w-3 h-3 bg-yellow-400 rounded-full mr-3"></div>
              <div className="text-white/90 text-sm">Track your journey over time</div>
            </div>
          </div>
        </div>
      )
    },
    {
      icon: Users,
      title: "Connect with Community",
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-center mb-4">
            <Users className="w-12 h-12 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Join the Community</h3>
          <p className="text-white/80 mb-4">
            Connect with fellow aerial artists, share your progress, and learn from others.
          </p>
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="text-white font-semibold text-sm">👥 Find Friends</div>
              <div className="text-white/80 text-xs">Connect with other aerialists</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="text-white font-semibold text-sm">📱 Share Progress</div>
              <div className="text-white/80 text-xs">Post videos and photos</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="text-white font-semibold text-sm">🎯 Join Challenges</div>
              <div className="text-white/80 text-xs">Participate in community events</div>
            </div>
          </div>
        </div>
      )
    },
    {
      icon: Trophy,
      title: "Ready to Fly?",
      content: (
        <div className="text-center space-y-4">
          <div className="text-6xl mb-4">🚀</div>
          <h3 className="text-xl font-bold text-white mb-2">You're All Set!</h3>
          <p className="text-white/80 mb-4">
            Your aerial journey begins now. Start exploring exercises, tracking your progress, and connecting with the community.
          </p>
          <div className="bg-gradient-to-br from-purple-600/20 to-teal-700/20 rounded-lg p-4 border border-purple-400/30">
            <p className="text-white/90 text-sm font-semibold">
              💡 Pro Tip: Start with beginner exercises and gradually work your way up!
            </p>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg bg-slate-900/95 border-white/30 shadow-2xl backdrop-blur-sm">
        <DialogHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute -right-2 -top-2 text-white/60 hover:text-white h-8 w-8 p-0 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </Button>
          <DialogTitle className="text-white text-center flex items-center justify-center gap-2">
            <Icon className="w-5 h-5 text-purple-400" />
            {currentStepData.title}
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          {currentStepData.content}
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center mb-4">
          <div className="flex space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-purple-400'
                    : index < currentStep
                    ? 'bg-teal-400'
                    : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-white/60 hover:text-white"
          >
            Skip Tour
          </Button>
          
          <div className="flex space-x-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Previous
              </Button>
            )}
            <Button
              variant="primary"
              onClick={handleNext}
              className="flex items-center gap-2"
            >
              {currentStep < steps.length - 1 ? (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                'Get Started'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IntroductionModal;