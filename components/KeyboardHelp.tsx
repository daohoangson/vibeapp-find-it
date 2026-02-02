"use client";

import { useEffect, useState } from "react";
import { X, Keyboard } from "lucide-react";

export function KeyboardHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle on '?' (Shift + /)
      if (e.key === "?" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        // Prevent typing '?' into inputs if any
        if (
          document.activeElement?.tagName === "INPUT" ||
          document.activeElement?.tagName === "TEXTAREA"
        ) {
          return;
        }
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm duration-200">
      <div className="animate-in zoom-in-95 relative w-full max-w-md overflow-hidden rounded-3xl bg-white p-6 shadow-2xl duration-200">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="mb-6 flex items-center gap-3 text-slate-800">
          <div className="rounded-xl bg-sky-100 p-3 text-sky-600">
            <Keyboard className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold">Shortcuts</h2>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4">
            <span className="mb-1 font-medium text-slate-600">
              Select Option
            </span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                Number
              </span>
              <div className="flex gap-2">
                <Kbd>1</Kbd>
                <Kbd>2</Kbd>
                <Kbd>3</Kbd>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                WASD
              </span>
              <div className="flex gap-2">
                <Kbd>A</Kbd>
                <Kbd>S</Kbd>
                <Kbd>D</Kbd>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                ABC
              </span>
              <div className="flex gap-2">
                <Kbd>A</Kbd>
                <Kbd>B</Kbd>
                <Kbd>C</Kbd>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
            <span className="font-medium text-slate-600">Go Back</span>
            <Kbd>Esc</Kbd>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
            <span className="font-medium text-slate-600">This Menu</span>
            <Kbd>?</Kbd>
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-slate-400">
          Press <span className="font-bold text-slate-500">?</span> to close
        </div>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="flex h-8 min-w-8 items-center justify-center rounded-lg border-b-2 border-slate-300 bg-white px-2 font-mono text-sm font-bold text-slate-700 shadow-sm">
      {children}
    </kbd>
  );
}
