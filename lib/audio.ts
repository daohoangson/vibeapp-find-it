// Singleton AudioContext to prevent browser autoplay policy issues
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const stored = localStorage.getItem("3moji-sound");
    return stored === null ? true : JSON.parse(stored);
  } catch {
    return true;
  }
}

/**
 * Unlocks audio context on user interaction.
 * Must be called from a user gesture (click/tap) to work on iOS/Chrome.
 */
export async function unlockAudio(): Promise<void> {
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
  } catch {
    console.warn("Audio unlock failed");
  }
}

/**
 * Plays success sound: ascending arpeggio C5 → E5 → G5 → C6 (sine wave)
 */
export function playSuccessSound(): void {
  if (!isSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;
    // C5 - E5 - G5 - C6 (C Major Arpeggio)
    const notes = [523.25, 659.25, 783.99, 1046.5];

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = freq;

      const startTime = now + i * 0.08;
      const duration = 0.4;

      // Volume envelope
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05); // Attack
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // Natural decay

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration + 0.1);
    });
  } catch {
    console.error("Audio play failed");
  }
}

/**
 * Plays a short, gentle "pop" sound for UI interactions.
 */
export function playPopSound(): void {
  if (!isSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    // Quick pitch drop for "bubble" effect
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);

    // Short envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  } catch {
    // Ignore errors for UI sounds
  }
}

/**
 * Plays error sound: short descending tone (sawtooth wave)
 */
export function playErrorSound(): void {
  if (!isSoundEnabled()) return;

  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sawtooth";
    // Slide down pitch
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(80, now + 0.3);

    // Volume envelope
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  } catch {
    console.error("Audio error");
  }
}
