/*
 * DESIGN: Brutalist Speed Machine
 * - Diagonal stripe pattern divider
 * - Sharp, minimal footer
 * - Share and leaderboard CTAs
 */

import { Share2, Trophy, Twitter, Link2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useUser } from "@/contexts/UserContext";
import { LeaderboardRow } from "./LeaderboardRow";
import type { Difficulty } from "@/hooks/useGameState";

interface FooterProps {
  bestTime: number | null;
  averageTime: number | null;
}

export function Footer({ bestTime, averageTime }: FooterProps) {
  const { user } = useUser();
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('normal');
  const { leaderboard, loading, error, userRank } = useLeaderboard(selectedDifficulty);

  const handleShare = async () => {
    const text = bestTime
      ? `⚡ QuickTap'da eng yaxshi vaqtim: ${bestTime}ms! Mag'lub eta olasizmi?`
      : `⚡ QuickTap bilan reaktsiya tezligingizni sinab ko'ring!`;

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
      toast.success("Nusxalandi!");
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Havola nusxalandi!");
  };

  const handleTwitterShare = () => {
    const text = bestTime
      ? `⚡ QuickTap'da eng yaxshi vaqtim: ${bestTime}ms! Mag'lub eta olasizmi?`
      : `⚡ QuickTap bilan reaktsiya tezligingizni sinab ko'ring!`;
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
                NATIJANI ULASHING
              </button>
            </DialogTrigger>
            <DialogContent className="bg-card border-2 border-border">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl text-white tracking-wider">
                  NATIJANGIZNI ULASHING
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {bestTime && (
                  <div className="text-center p-6 bg-background border-2 border-border">
                    <div className="text-muted-foreground text-sm mb-2">ENG YAXSHI VAQTINGIZ</div>
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
                  ULASHISH
                </button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Leaderboard button */}
          <Dialog>
            <DialogTrigger asChild>
              <button className="flex items-center gap-3 px-6 py-3 bg-transparent border-2 border-white/30 text-white/60 font-display text-lg tracking-wider hover:border-white hover:text-white transition-colors">
                <Trophy className="w-5 h-5" />
                REYTING
              </button>
            </DialogTrigger>
            <DialogContent className="bg-card border-2 border-border max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl text-white tracking-wider">
                  GLOBAL REYTING
                </DialogTitle>
              </DialogHeader>

              <Tabs
                value={selectedDifficulty}
                onValueChange={(v) => setSelectedDifficulty(v as Difficulty)}
                className="flex-1 flex flex-col overflow-hidden"
              >
                <TabsList className="grid w-full grid-cols-3 bg-background">
                  <TabsTrigger value="easy" className="font-display">EASY</TabsTrigger>
                  <TabsTrigger value="normal" className="font-display">NORMAL</TabsTrigger>
                  <TabsTrigger value="hard" className="font-display">HARD</TabsTrigger>
                </TabsList>

                <TabsContent value={selectedDifficulty} className="flex-1 overflow-hidden flex flex-col mt-4">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin text-4xl">⚡</div>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8 text-destructive">
                      <p>{error}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Backend API ishlamayapti
                      </p>
                    </div>
                  ) : leaderboard.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Hali natija yo'q</p>
                      <p className="text-sm mt-2">Birinchi bo'lib o'ynang!</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 overflow-y-auto flex-1 pr-2">
                        {leaderboard.map((entry, index) => (
                          <LeaderboardRow
                            key={entry.id}
                            rank={index + 1}
                            entry={entry}
                            isCurrentUser={user?.userId === entry.user_id}
                          />
                        ))}
                      </div>

                      {/* User rank if not in top visible */}
                      {user && userRank && userRank > 10 && (
                        <div className="mt-4 pt-4 border-t-2 border-border">
                          <div className="flex justify-between items-center px-3 py-2 bg-background">
                            <span className="text-muted-foreground">Sizning o'rningiz:</span>
                            <span className="font-display text-2xl text-primary">#{userRank}</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-4 border-t border-border/50 text-center">
          <p className="text-muted-foreground text-sm">
            QuickTap — Reaktsiya tezligingizni sinab ko'ring
          </p>
        </div>
      </div>
    </footer>
  );
}
