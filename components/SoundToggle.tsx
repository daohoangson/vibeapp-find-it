"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useSoundSettings } from "@/lib/hooks";
import { playPopSound } from "@/lib/audio";

export function SoundToggle() {
  const { soundEnabled, toggleSound, mounted } = useSoundSettings();

  if (!mounted) return null; // Avoid hydration mismatch

  const handleToggle = () => {
    toggleSound();
    if (!soundEnabled) {
      playPopSound(); // Play sound when enabling
    }
  };

  return (
    <button
      onClick={handleToggle}
      className="cursor-pointer touch-manipulation rounded-full bg-white/50 p-3 text-slate-600 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:text-sky-600 hover:shadow-md focus:ring-2 focus:ring-sky-500 active:scale-95"
      aria-label={soundEnabled ? "Mute sound" : "Enable sound"}
    >
      {soundEnabled ? (
        <Volume2 className="h-6 w-6" />
      ) : (
        <VolumeX className="h-6 w-6" />
      )}
    </button>
  );
}
