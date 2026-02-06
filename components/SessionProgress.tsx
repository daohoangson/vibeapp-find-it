"use client";

interface SessionProgressProps {
  currentRound: number;
  totalRounds: number;
  topicIcon?: string;
}

export function SessionProgress({
  currentRound,
  totalRounds,
  topicIcon,
}: SessionProgressProps) {
  return (
    <>
      {/* Counter badge */}
      <div className="absolute top-0 right-0 z-30 m-4 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-md backdrop-blur-md">
        {topicIcon && <span className="text-2xl">{topicIcon}</span>}
        <span className="font-bold text-slate-700">
          {currentRound + 1}/{totalRounds}
        </span>
      </div>

      {/* Progress dots */}
      <div
        className="absolute bottom-0 left-1/2 z-30 mb-4 flex -translate-x-1/2 gap-2"
        role="progressbar"
        aria-valuenow={currentRound + 1}
        aria-valuemin={1}
        aria-valuemax={totalRounds}
        aria-label={`Round ${currentRound + 1} of ${totalRounds}`}
      >
        {Array.from({ length: totalRounds }).map((_, index) => (
          <div
            key={index}
            className={`h-2 w-2 rounded-full transition-all ${
              index < currentRound
                ? "bg-green-500"
                : index === currentRound
                  ? "h-3 w-3 bg-sky-500"
                  : "bg-slate-300"
            }`}
            aria-hidden="true"
          />
        ))}
      </div>
    </>
  );
}
