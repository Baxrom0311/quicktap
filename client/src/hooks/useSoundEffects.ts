/*
 * Sound Effects Hook using Web Audio API
 * Generates synthesized sounds for instant, responsive audio feedback
 * No external audio files needed - all sounds are procedurally generated
 */

import { useCallback, useRef, useEffect, useState } from "react";

export function useSoundEffects() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isMuted, setIsMuted] = useState(() => {
    // Persist mute preference in localStorage
    const stored = localStorage.getItem("quicktap-muted");
    return stored === "true";
  });

  // Initialize AudioContext on first user interaction
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Resume if suspended (browser autoplay policy)
    if (audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  // Toggle mute state
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newValue = !prev;
      localStorage.setItem("quicktap-muted", String(newValue));
      return newValue;
    });
  }, []);

  // Success sound - bright, satisfying "ding" with harmonics
  const playSuccess = useCallback(() => {
    if (isMuted) return;
    const ctx = initAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Main tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now); // A5
    osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.05); // A6
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Harmonic overtone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1320, now); // E6
    osc2.frequency.exponentialRampToValueAtTime(2640, now + 0.05);
    gain2.gain.setValueAtTime(0.15, now);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.1);

    // High sparkle
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = "sine";
    osc3.frequency.setValueAtTime(2200, now + 0.02);
    gain3.gain.setValueAtTime(0.1, now + 0.02);
    gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.02);
    osc3.stop(now + 0.08);
  }, [isMuted, initAudioContext]);

  // Early/Error sound - low, buzzy warning tone
  const playError = useCallback(() => {
    if (isMuted) return;
    const ctx = initAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Low buzz
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sawtooth";
    osc1.frequency.setValueAtTime(150, now);
    osc1.frequency.exponentialRampToValueAtTime(80, now + 0.2);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Second buzz (slightly delayed)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sawtooth";
    osc2.frequency.setValueAtTime(120, now + 0.1);
    osc2.frequency.exponentialRampToValueAtTime(60, now + 0.3);
    gain2.gain.setValueAtTime(0.15, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.35);
  }, [isMuted, initAudioContext]);

  // Target appear sound - quick electronic "blip"
  const playTargetAppear = useCallback(() => {
    if (isMuted) return;
    const ctx = initAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Quick rising blip
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }, [isMuted, initAudioContext]);

  // Excellent result sound - triumphant fanfare
  const playExcellent = useCallback(() => {
    if (isMuted) return;
    const ctx = initAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // First note
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(523.25, now); // C5
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    // Second note
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(659.25, now + 0.08); // E5
    gain2.gain.setValueAtTime(0.25, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.2);

    // Third note (higher)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = "sine";
    osc3.frequency.setValueAtTime(783.99, now + 0.16); // G5
    gain3.gain.setValueAtTime(0.3, now + 0.16);
    gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc3.connect(gain3);
    gain3.connect(ctx.destination);
    osc3.start(now + 0.16);
    osc3.stop(now + 0.35);

    // Final high note
    const osc4 = ctx.createOscillator();
    const gain4 = ctx.createGain();
    osc4.type = "sine";
    osc4.frequency.setValueAtTime(1046.5, now + 0.24); // C6
    gain4.gain.setValueAtTime(0.35, now + 0.24);
    gain4.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc4.connect(gain4);
    gain4.connect(ctx.destination);
    osc4.start(now + 0.24);
    osc4.stop(now + 0.5);
  }, [isMuted, initAudioContext]);

  // Click/tap feedback - subtle click
  const playClick = useCallback(() => {
    if (isMuted) return;
    const ctx = initAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, now);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.03);
  }, [isMuted, initAudioContext]);

  // Countdown tick sound - ascending pitch for 3-2-1-GO
  const playCountdownTick = useCallback((step: number) => {
    if (isMuted) return;
    const ctx = initAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // step: 3=low, 2=mid, 1=high, 0=GO (highest)
    const freqs = [440, 554, 659, 880];
    const freq = freqs[Math.min(3 - step, 3)] || 880;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = step === 0 ? "square" : "sine";
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(step === 0 ? 0.3 : 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + (step === 0 ? 0.2 : 0.12));
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + (step === 0 ? 0.2 : 0.12));
  }, [isMuted, initAudioContext]);

  // Win sound - triumphant rising chord
  const playWin = useCallback(() => {
    if (isMuted) return;
    const ctx = initAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [
      { freq: 523.25, time: 0, dur: 0.15 },    // C5
      { freq: 659.25, time: 0.1, dur: 0.15 },   // E5
      { freq: 783.99, time: 0.2, dur: 0.15 },   // G5
      { freq: 1046.5, time: 0.3, dur: 0.3 },    // C6
      { freq: 1318.5, time: 0.35, dur: 0.4 },   // E6 (harmony)
    ];

    notes.forEach(({ freq, time, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + time);
      gain.gain.setValueAtTime(0.2, now + time);
      gain.gain.exponentialRampToValueAtTime(0.01, now + time + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + time);
      osc.stop(now + time + dur);
    });
  }, [isMuted, initAudioContext]);

  // Lose sound - descending sad tone
  const playLose = useCallback(() => {
    if (isMuted) return;
    const ctx = initAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(440, now);      // A4
    osc1.frequency.exponentialRampToValueAtTime(220, now + 0.3); // A3 (drop)
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.4);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(349, now + 0.15); // F4
    osc2.frequency.exponentialRampToValueAtTime(175, now + 0.45);
    gain2.gain.setValueAtTime(0.15, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.5);
  }, [isMuted, initAudioContext]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    playSuccess,
    playError,
    playTargetAppear,
    playExcellent,
    playClick,
    playCountdownTick,
    playWin,
    playLose,
    isMuted,
    toggleMute,
    initAudioContext,
  };
}
