import { motion } from 'framer-motion';

interface MultiplayerMenuProps {
    onCreate: () => void;
    onJoin: () => void;
    onCancel: () => void;
}

export function MultiplayerMenu({ onCreate, onJoin, onCancel }: MultiplayerMenuProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-4 w-full max-w-md mx-auto"
        >
            <h2 className="font-display text-4xl text-white tracking-widest mb-8 text-center text-stroke">
                MULTIPLAYER
            </h2>

            <button
                onClick={onCreate}
                className="w-full py-6 bg-primary text-black font-display text-2xl tracking-widest hover:bg-primary/90 transition-all transform hover:scale-105"
            >
                CREATE GAME
            </button>

            <button
                onClick={onJoin}
                className="w-full py-6 bg-white/10 border-2 border-white/20 text-white font-display text-2xl tracking-widest hover:bg-white/20 hover:border-white transition-all transform hover:scale-105"
            >
                JOIN GAME
            </button>

            <button
                onClick={onCancel}
                className="mt-4 text-white/50 hover:text-white font-display text-xl tracking-wider transition-colors"
            >
                BACK
            </button>
        </motion.div>
    );
}
