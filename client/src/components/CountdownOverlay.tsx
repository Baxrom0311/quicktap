import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface CountdownOverlayProps {
    active: boolean;
    onComplete?: () => void;
}

export function CountdownOverlay({ active, onComplete }: CountdownOverlayProps) {
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        if (!active) {
            setCount(null);
            return;
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
    }, [active, onComplete]);

    if (count === null) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 pointer-events-none">
            <AnimatePresence mode="wait">
                <motion.div
                    key={count}
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
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
