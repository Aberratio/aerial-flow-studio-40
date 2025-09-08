import React, { useState, useEffect } from 'react';
import { Trophy, BookOpen, Users, Star, Target } from 'lucide-react';

interface InstantContentLoaderProps {
  children: React.ReactNode;
  fallbackDelay?: number;
}

export const InstantContentLoader: React.FC<InstantContentLoaderProps> = ({
  children,
  fallbackDelay = 1500
}) => {
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFallback(true);
    }, fallbackDelay);

    return () => clearTimeout(timer);
  }, [fallbackDelay]);

  return (
    <div className="relative">
      {children}
      
      {/* Instant engaging content overlay */}
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-md">
          <div className="flex justify-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center animate-pulse">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center animate-pulse animation-delay-200">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center animate-pulse animation-delay-400">
              <Star className="w-6 h-6 text-white" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-white animate-fade-in">
              Join 10K+ Aerial Athletes
            </h3>
            <p className="text-white/80 text-sm animate-fade-in animation-delay-200">
              Master new moves, connect with the community, and track your progress
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 animate-fade-in-up animation-delay-400">
              <div className="text-lg font-bold text-white">500+</div>
              <div className="text-xs text-white/70">Exercises</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 animate-fade-in-up animation-delay-600">
              <div className="text-lg font-bold text-white">50+</div>
              <div className="text-xs text-white/70">Challenges</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};