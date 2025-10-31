import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Star } from 'lucide-react';

interface FigureCompletionCelebrationProps {
  isOpen: boolean;
  figureName: string;
  pointsEarned: number;
}

// Floating confetti component
const Confetti = ({ delay = 0 }: { delay?: number }) => (
  <motion.div
    className="absolute w-2 h-2 rounded-sm bg-gradient-to-r from-purple-400 to-pink-400"
    initial={{ y: -20, opacity: 1, rotate: 0 }}
    animate={{
      y: window.innerHeight + 50,
      rotate: 360,
      opacity: [1, 1, 0],
    }}
    transition={{
      duration: 3,
      delay,
      ease: "linear"
    }}
    style={{
      left: `${Math.random() * 100}%`,
    }}
  />
);

export const FigureCompletionCelebration: React.FC<FigureCompletionCelebrationProps> = ({
  isOpen,
  figureName,
  pointsEarned,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-none">
      {/* Confetti */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <Confetti key={i} delay={i * 0.1} />
        ))}
      </div>

      {/* Main content */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "backOut" }}
        className="relative z-10 bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-8 text-center max-w-md mx-4 shadow-2xl"
      >
        {/* Check icon with glow */}
        <motion.div
          className="relative inline-block mb-4"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="absolute inset-0 bg-green-400/50 rounded-full blur-xl scale-150" />
          <CheckCircle className="w-16 h-16 text-green-400 relative z-10" />
        </motion.div>

        {/* Congratulations text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="space-y-3"
        >
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
            Gratulacje! 🎉
          </h2>
          <p className="text-lg text-white/90 font-medium">
            Ukończyłeś figurę:
          </p>
          <p className="text-xl font-bold text-white">
            {figureName}
          </p>

          {/* Points earned */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20"
          >
            <div className="flex items-center justify-center space-x-2">
              <Star className="w-5 h-5 text-yellow-400" />
              <span className="text-2xl font-bold text-white">+{pointsEarned}</span>
              <span className="text-sm text-white/70">punktów</span>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};
