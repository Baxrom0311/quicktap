import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { AVATAR_OPTIONS, type UserProfile } from '@shared/types';

interface ProfileSetupDialogProps {
    open: boolean;
    onComplete: (profile: UserProfile) => void;
    onClose?: () => void;
    /** If provided, dialog opens in edit mode with pre-filled values */
    existingProfile?: UserProfile | null;
}

export function ProfileSetupDialog({ open, onComplete, onClose, existingProfile }: ProfileSetupDialogProps) {
    const isEditMode = !!existingProfile;
    const [username, setUsername] = useState('');
    const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
    const [error, setError] = useState('');

    // Pre-fill values when editing
    useEffect(() => {
        if (open && existingProfile) {
            setUsername(existingProfile.username);
            setSelectedAvatarId(existingProfile.avatar);
            setError('');
        } else if (open && !existingProfile) {
            setUsername('');
            setSelectedAvatarId(null);
            setError('');
        }
    }, [open, existingProfile]);

    const handleSubmit = () => {
        // Validation
        if (!username.trim()) {
            setError('Username kiriting');
            return;
        }

        if (username.length < 3 || username.length > 15) {
            setError('Username 3-15 belgi bo\'lishi kerak');
            return;
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            setError('Faqat harf, raqam va _ ishlatish mumkin');
            return;
        }

        if (!selectedAvatarId) {
            setError('Avatar tanlang');
            return;
        }

        if (isEditMode && existingProfile) {
            // Update existing profile, preserving userId, createdAt, and stats
            const updatedProfile: UserProfile = {
                ...existingProfile,
                username: username.trim(),
                avatar: selectedAvatarId,
            };
            onComplete(updatedProfile);
        } else {
            // Create new profile
            const profile: UserProfile = {
                userId: crypto.randomUUID(),
                username: username.trim(),
                avatar: selectedAvatarId,
                createdAt: new Date().toISOString(),
                stats: {
                    easy: { games: 0, bestScore: null },
                    normal: { games: 0, bestScore: null },
                    hard: { games: 0, bestScore: null },
                },
            };
            onComplete(profile);
        }
    };

    const handleOpenChange = (isOpen: boolean) => {
        if (!isOpen && isEditMode && onClose) {
            onClose();
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange} modal>
            <DialogContent className="bg-card border-2 border-border max-w-md" showCloseButton={isEditMode}>
                <DialogHeader>
                    <DialogTitle className="font-display text-3xl text-white tracking-wider text-center">
                        {isEditMode ? 'PROFILNI TAHRIRLASH' : 'ASSALOMU ALAYKUM!'}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground text-center mt-2">
                        {isEditMode ? 'Username yoki avatarni o\'zgartiring' : 'O\'yinni boshlash uchun profil yarating'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-6">
                    {/* Avatar Selector */}
                    <div>
                        <label className="font-display text-sm text-white/60 tracking-wider mb-3 block">
                            AVATAR TANLANG
                        </label>
                        <div className="grid grid-cols-4 gap-3">
                            {AVATAR_OPTIONS.map((avatar) => (
                                <motion.button
                                    key={avatar.id}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        setSelectedAvatarId(avatar.id);
                                        setError('');
                                    }}
                                    className={`aspect-square rounded-lg border-2 transition-all overflow-hidden bg-white/5 hover:bg-white/10 flex items-center justify-center ${selectedAvatarId === avatar.id
                                        ? 'border-primary ring-2 ring-primary scale-105'
                                        : 'border-border'
                                        }`}
                                >
                                    <span className="text-3xl">{avatar.emoji}</span>
                                </motion.button>
                            ))}
                        </div>
                    </div>

                    {/* Username Input */}
                    <div>
                        <label className="font-display text-sm text-white/60 tracking-wider mb-2 block">
                            USERNAME
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value);
                                setError('');
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                            placeholder="username"
                            maxLength={15}
                            className="w-full px-4 py-3 bg-background border-2 border-border text-white font-display tracking-wider focus:border-primary focus:outline-none transition-colors"
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                            3-15 belgi, faqat harf, raqam va _
                        </div>
                    </div>

                    {/* Error Message */}
                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="text-destructive text-sm text-center"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Submit Button */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSubmit}
                        className="w-full py-4 bg-primary text-primary-foreground font-display text-xl tracking-wider hover:bg-primary/90 transition-colors"
                    >
                        {isEditMode ? 'SAQLASH' : 'O\'YINNI BOSHLASH'}
                    </motion.button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
