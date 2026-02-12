import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface JoinGameDialogProps {
    open: boolean;
    initialCode?: string;
    onJoin: (code: string) => Promise<boolean> | boolean;
    onCancel: () => void;
}

export function JoinGameDialog({ open, initialCode, onJoin, onCancel }: JoinGameDialogProps) {
    const [code, setCode] = useState(initialCode || '');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (open && initialCode) {
            setCode(initialCode);
        }
    }, [open, initialCode]);

    const handleSubmit = async () => {
        if (code.length !== 6) {
            setError('Kod 6 talik bo\'lishi kerak');
            return;
        }

        setSubmitting(true);
        try {
            const success = await onJoin(code);
            if (!success) {
                setError('Xona topilmadi yoki allaqachon band');
            }
        } catch (e) {
            setError('Server bilan ulanishda xatolik');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
            <DialogContent className="bg-card border-2 border-border max-w-sm sm:max-w-md" showCloseButton={true}>
                <DialogHeader>
                    <DialogTitle className="font-display text-2xl text-white tracking-wider text-center">
                        O'YINGA QO'SHILISH
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground text-center">
                        Do'stingiz yuborgan 6 xonali kodni kiriting
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col items-center gap-6 mt-4">
                    <InputOTP
                        maxLength={6}
                        value={code}
                        onChange={(value) => {
                            setCode(value);
                            setError('');
                        }}
                    >
                        <InputOTPGroup className="gap-2">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <InputOTPSlot
                                    key={i}
                                    index={i}
                                    className="w-10 h-12 border-2 border-border text-2xl font-display text-white bg-white/5"
                                />
                            ))}
                        </InputOTPGroup>
                    </InputOTP>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="text-destructive text-sm font-display tracking-wider"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        onClick={handleSubmit}
                        disabled={code.length !== 6 || submitting}
                        className="w-full py-3 bg-primary text-black font-display text-xl tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {submitting ? "KUTILMOQDA..." : "QO'SHILISH"}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
