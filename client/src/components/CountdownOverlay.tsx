import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface CountdownOverlayProps {
  active: boolean;
  targetTime?: number | null;
  onComplete?: () => void;
}

function getCountdownValue(targetTime: number): number | null {
  const remainingMs = targetTime - Date.now();

  if (remainingMs > 0) {
    return Math.max(1, Math.ceil(remainingMs / 1000));
  }

  // Keep GO visible briefly after the synchronized start moment.
  if (remainingMs > -600) return 0;

  return null;
}

export function CountdownOverlay({
  active,
  targetTime,
  onComplete,
}: CountdownOverlayProps) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!active) {
      setCount(null);
      return;
    }

    if (targetTime) {
      let completed = false;

      const tick = () => {
        const nextCount = getCountdownValue(targetTime);
        setCount(nextCount);

        if (!completed && nextCount === 0) {
          completed = true;
          onComplete?.();
        }
      };

      tick();
      const interval = window.setInterval(tick, 100);
      return () => window.clearInterval(interval);
    }

    setCount(3);
    const t2 = setTimeout(() => setCount(2), 1000);
    const t1 = setTimeout(() => setCount(1), 2000);
    const go = setTimeout(() => {
      setCount(0); // 0 = "GO!"
      onComplete?.();
    }, 3000);
    const hide = setTimeout(() => setCount(null), 3600);

    return () => {
      clearTimeout(t2);
      clearTimeout(t1);
      clearTimeout(go);
      clearTimeout(hide);
    };
  }, [active, targetTime, onComplete]);

  if (count === null) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={count}
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="text-center"
        >
          {count > 0 ? (
            <span className="font-display text-[clamp(8rem,30vw,20rem)] text-white leading-none">
              {count}
            </span>
          ) : (
            <span className="font-display text-[clamp(6rem,25vw,16rem)] text-primary neon-glow leading-none">
              GO!
            </span>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
