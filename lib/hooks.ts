import { useState, useEffect } from "react";

export function useSoundSettings() {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!mounted) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
    }
    const stored = localStorage.getItem("3moji-sound");
    if (stored !== null) {
      setSoundEnabled(JSON.parse(stored));
    }
  }, [mounted]);

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    localStorage.setItem("3moji-sound", JSON.stringify(newState));
  };

  return { soundEnabled, toggleSound, mounted };
}
