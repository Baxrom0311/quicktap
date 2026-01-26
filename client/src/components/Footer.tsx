/*
 * DESIGN: Brutalist Speed Machine
 * - Diagonal stripe pattern divider
 * - Sharp, minimal footer
 * - Share and leaderboard CTAs
 */

import { Share2, Trophy, Twitter, Link2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface FooterProps {
  bestTime: number | null;
  averageTime: number | null;
}

export function Footer({ bestTime, averageTime }: FooterProps) {
  const handleShare = async () => {
    const text = bestTime
      ? `⚡ My best reaction time on QuickTap: ${bestTime}ms! Can you beat it?`
      : `⚡ Test your reaction speed with QuickTap!`;
    
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "QuickTap - Reaction Time Game",
          text,
          url,
        });
      } catch (e) {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success("Copied to clipboard!");
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied!");
  };

  const handleTwitterShare = () => {
    const text = bestTime
      ? `⚡ My best reaction time on QuickTap: ${bestTime}ms! Can you beat it?`
      : `⚡ Test your reaction speed with QuickTap!`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.href)}`;
    window.open(url, "_blank");
  };

  return (
    <footer className="bg-card border-t-2 border-border">
      {/* Diagonal stripe divider */}
      <div 
        className="h-2 w-full"
        style={{
          background: "repeating-linear-gradient(135deg, transparent, transparent 8px, oklch(0.85 0.3 142 / 0.2) 8px, oklch(0.85 0.3 142 / 0.2) 16px)",
        }}
      />
      
      <div className="container py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Share button */}
          <Dialog>
            <DialogTrigger asChild>
              <button className="flex items-center gap-3 px-6 py-3 bg-transparent border-2 border-primary text-primary font-display text-lg tracking-wider hover:bg-primary hover:text-primary-foreground transition-colors">
                <Share2 className="w-5 h-5" />
                SHARE SCORE
              </button>
            </DialogTrigger>
            <DialogContent className="bg-card border-2 border-border">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl text-white tracking-wider">
                  SHARE YOUR SCORE
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {bestTime && (
                  <div className="text-center p-6 bg-background border-2 border-border">
                    <div className="text-muted-foreground text-sm mb-2">YOUR BEST TIME</div>
                    <div className="font-display text-5xl text-primary neon-glow">
                      {bestTime}
                      <span className="text-xl text-primary/60 ml-1">MS</span>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleTwitterShare}
                    className="flex items-center justify-center gap-2 p-4 bg-transparent border-2 border-border text-white hover:border-primary hover:text-primary transition-colors"
                  >
                    <Twitter className="w-5 h-5" />
                    <span className="font-display tracking-wider">TWITTER</span>
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center justify-center gap-2 p-4 bg-transparent border-2 border-border text-white hover:border-primary hover:text-primary transition-colors"
                  >
                    <Link2 className="w-5 h-5" />
                    <span className="font-display tracking-wider">COPY LINK</span>
                  </button>
                </div>
                <button
                  onClick={handleShare}
                  className="w-full p-4 bg-primary text-primary-foreground font-display text-lg tracking-wider hover:bg-primary/90 transition-colors"
                >
                  SHARE
                </button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Leaderboard button */}
          <Dialog>
            <DialogTrigger asChild>
              <button className="flex items-center gap-3 px-6 py-3 bg-transparent border-2 border-white/30 text-white/60 font-display text-lg tracking-wider hover:border-white hover:text-white transition-colors">
                <Trophy className="w-5 h-5" />
                LEADERBOARD
              </button>
            </DialogTrigger>
            <DialogContent className="bg-card border-2 border-border">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl text-white tracking-wider">
                  LEADERBOARD
                </DialogTitle>
              </DialogHeader>
              <div className="mt-4 p-8 text-center border-2 border-dashed border-border">
                <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Global leaderboard coming soon!
                </p>
                <p className="text-sm text-muted-foreground/60 mt-2">
                  For now, challenge your friends by sharing your score.
                </p>
              </div>
              {bestTime && (
                <div className="mt-4 p-4 bg-background border-2 border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Your Best</span>
                    <span className="font-display text-2xl text-primary">
                      {bestTime}
                      <span className="text-sm text-primary/60 ml-1">MS</span>
                    </span>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-4 border-t border-border/50 text-center">
          <p className="text-muted-foreground text-sm">
            QuickTap — Test your reaction speed
          </p>
        </div>
      </div>
    </footer>
  );
}
