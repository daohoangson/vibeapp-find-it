/**
 * Check if speech synthesis is available in the browser
 */
export function isSpeechAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Speak a word using the Web Speech API
 */
export function speakWord(word: string): void {
  if (!isSpeechAvailable()) return;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(word);
  utterance.rate = 0.8; // Slightly slower for kids
  utterance.pitch = 1.1; // Slightly higher pitch
  utterance.volume = 1;

  // Try to use a child-friendly voice if available
  const voices = window.speechSynthesis.getVoices();
  const englishVoice = voices.find(
    (voice) => voice.lang.startsWith("en") && voice.name.includes("Female"),
  );
  if (englishVoice) {
    utterance.voice = englishVoice;
  }

  window.speechSynthesis.speak(utterance);
}
