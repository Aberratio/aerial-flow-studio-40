import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Crown, Sparkles, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ChallengeCompletionCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  challengeTitle: string;
  totalDays: number;
  pointsEarned: number;
}

// Firework particle component
const FireworkParticle = ({ delay = 0, color = "#F59E0B" }: { delay?: number; color?: string }) => (
  <motion.div
    className="absolute w-1 h-1 rounded-full"
    style={{ backgroundColor: color }}
    initial={{ scale: 0, opacity: 1 }}
    animate={{
      scale: [0, 1, 0],
      opacity: [1, 1, 0],
      x: [0, Math.random() * 200 - 100],
      y: [0, Math.random() * 200 - 100],
    }}
    transition={{
      duration: 1.5,
      delay,
      ease: "easeOut"
    }}
  />
);

// Firework burst component
const FireworkBurst = ({ x, y, colors }: { x: number; y: number; colors: string[] }) => (
  <div className="absolute pointer-events-none" style={{ left: x, top: y }}>
    {Array.from({ length: 12 }).map((_, i) => (
      <FireworkParticle
        key={i}
        delay={i * 0.05}
        color={colors[i % colors.length]}
      />
    ))}
  </div>
);

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

export const ChallengeCompletionCelebration: React.FC<ChallengeCompletionCelebrationProps> = ({
  isOpen,
  onClose,
  challengeTitle,
  totalDays,
  pointsEarned,
}) => {
  const [fireworks, setFireworks] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [showContent, setShowContent] = useState(false);

  const fireworkColors = [
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#8B5CF6", // Purple
    "#10B981", // Emerald
    "#3B82F6", // Blue
    "#F97316", // Orange
    "#EC4899", // Pink
  ];

  useEffect(() => {
    if (isOpen) {
      // Start fireworks after a brief delay
      const fireworkInterval = setInterval(() => {
        const newFirework = {
          id: Date.now() + Math.random(),
          x: Math.random() * (window.innerWidth - 100) + 50,
          y: Math.random() * (window.innerHeight - 200) + 50,
        };
        setFireworks(prev => [...prev, newFirework]);

        // Remove old fireworks
        setTimeout(() => {
          setFireworks(prev => prev.filter(fw => fw.id !== newFirework.id));
        }, 2000);
      }, 800);

      // Show content after initial animation
      setTimeout(() => setShowContent(true), 500);

      // Clean up after 8 seconds
      setTimeout(() => {
        clearInterval(fireworkInterval);
        setFireworks([]);
      }, 8000);

      return () => clearInterval(fireworkInterval);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border-0 bg-transparent shadow-none p-0 overflow-hidden">
        <div className="relative min-h-[600px] bg-gradient-to-br from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-xl rounded-2xl border border-purple-500/20 overflow-hidden">
          {/* Animated background gradient */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-blue-600/20"
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Fireworks container */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {fireworks.map(firework => (
              <FireworkBurst
                key={firework.id}
                x={firework.x}
                y={firework.y}
                colors={fireworkColors}
              />
            ))}

            {/* Confetti */}
            {Array.from({ length: 30 }).map((_, i) => (
              <Confetti key={i} delay={i * 0.1} />
            ))}
          </div>

          {/* Main content */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full p-6 md:p-8 text-center">
            <AnimatePresence>
              {showContent && (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0, y: 50 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "backOut" }}
                  className="flex flex-col items-center space-y-6"
                >
                  {/* Trophy icon with glow */}
                  <motion.div
                    className="relative"
                    animate={{
                      rotate: [0, 5, -5, 0],
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <div className="absolute inset-0 bg-yellow-400/50 rounded-full blur-xl scale-150" />
                    <Trophy className="w-20 h-20 md:w-24 md:h-24 text-yellow-400 relative z-10" />
                  </motion.div>

                  {/* Congratulations text */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.6 }}
                    className="space-y-2"
                  >
                    <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text text-transparent">
                      Gratulacje! 🎉
                    </h1>
                    <p className="text-lg md:text-xl text-white/90 font-medium">
                      Ukończyłeś challenge!
                    </p>
                  </motion.div>

                  {/* Challenge details */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-4 md:p-6 border border-white/20 space-y-4 w-full max-w-md"
                  >
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
                      {challengeTitle}
                    </h2>
                    
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="space-y-1">
                        <div className="flex items-center justify-center space-x-2">
                          <Calendar className="w-5 h-5 text-blue-400" />
                          <span className="text-2xl font-bold text-white">{totalDays}</span>
                        </div>
                        <p className="text-sm text-white/70">Dni ukończone</p>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center justify-center space-x-2">
                          <Star className="w-5 h-5 text-yellow-400" />
                          <span className="text-2xl font-bold text-white">{pointsEarned}</span>
                        </div>
                        <p className="text-sm text-white/70">Punkty zdobyte</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Achievement badges */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.6 }}
                    className="flex flex-wrap justify-center gap-3"
                  >
                    <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-full px-4 py-2 border border-purple-400/30">
                      <Crown className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-medium text-white">Champion</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-sm rounded-full px-4 py-2 border border-blue-400/30">
                      <Sparkles className="w-4 h-4 text-blue-400" />
                      <span className="text-sm font-medium text-white">Committed</span>
                    </div>
                  </motion.div>

                  {/* Motivational message */}
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9, duration: 0.6 }}
                    className="text-white/80 text-center max-w-md leading-relaxed px-4"
                  >
                    Niesamowite osiągnięcie! Twoja determinacja i wytrwałość przyniosły fantastyczne rezultaty. 
                    Jesteś gotowy na kolejne wyzwania!
                  </motion.p>

                  {/* Close button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1, duration: 0.6 }}
                  >
                    <Button
                      onClick={onClose}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                      size="lg"
                    >
                      Fantastycznie! 🚀
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};