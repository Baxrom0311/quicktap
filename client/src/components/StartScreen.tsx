/*
 * DESIGN: Brutalist Speed Machine
 * - Massive display typography with Bebas Neue
 * - Diagonal cuts and aggressive angles
 * - Neon green accents on black
 * - No rounded corners, sharp edges only
 */

import { motion } from "framer-motion";
import { Zap, Target, Clock } from "lucide-react";

interface StartScreenProps {
  onStart: () => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">
      {/* Hero Section with diagonal cut */}
      <div 
        className="relative flex-1 flex flex-col items-center justify-center px-4 py-12"
        style={{
          backgroundImage: "url('/images/hero-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/70" />
        
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative z-10 text-center"
        >
          {/* Logo/Title */}
          <h1 className="font-display text-[clamp(4rem,15vw,12rem)] leading-none tracking-tight text-white">
            QUICK
            <span className="text-primary neon-glow">TAP</span>
          </h1>
          
          <p className="mt-4 text-lg md:text-xl text-white/80 font-medium tracking-wide uppercase">
            Test Your Reaction Speed
          </p>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="relative z-10 mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full px-4"
        >
          <InstructionCard
            icon={<Clock className="w-8 h-8" />}
            step="01"
            title="WAIT"
            description="Watch for the green target to appear"
          />
          <InstructionCard
            icon={<Target className="w-8 h-8" />}
            step="02"
            title="TAP"
            description="Click or tap as fast as you can"
          />
          <InstructionCard
            icon={<Zap className="w-8 h-8" />}
            step="03"
            title="IMPROVE"
            description="Track your times and beat your best"
          />
        </motion.div>

        {/* Start Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStart}
          className="relative z-10 mt-12 px-16 py-6 bg-primary text-primary-foreground font-display text-4xl md:text-5xl tracking-wider neon-box-glow border-4 border-primary hover:bg-transparent hover:text-primary transition-colors"
        >
          START
        </motion.button>
      </div>

      {/* Diagonal stripe divider */}
      <div 
        className="h-8 w-full"
        style={{
          background: "repeating-linear-gradient(135deg, transparent, transparent 10px, oklch(0.85 0.3 142 / 0.3) 10px, oklch(0.85 0.3 142 / 0.3) 20px)",
        }}
      />
    </div>
  );
}

interface InstructionCardProps {
  icon: React.ReactNode;
  step: string;
  title: string;
  description: string;
}

function InstructionCard({ icon, step, title, description }: InstructionCardProps) {
  return (
    <div className="relative bg-black/60 border-2 border-primary/30 p-6 backdrop-blur-sm">
      {/* Step number - positioned at top right */}
      <span className="absolute top-2 right-4 font-display text-6xl text-primary/20">
        {step}
      </span>
      
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="font-display text-2xl text-white mb-2">{title}</h3>
      <p className="text-white/60 text-sm">{description}</p>
    </div>
  );
}
