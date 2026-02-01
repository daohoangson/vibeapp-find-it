"use client";

import { useState } from "react";
import Link from "next/link";
import { RefreshCw, Home, PartyPopper } from "lucide-react";
import { GameScreen } from "@/components";
import { Confetti } from "@/components/Confetti";
import { playSuccessSound, playErrorSound } from "@/lib/audio";
import type { RoundData } from "./page";

type ItemStatus = "normal" | "correct" | "wrong";
type Screen = "game" | "summary";

interface ItemWithStatus {
  id: string;
  value: string;
  isCorrect: boolean;
  status: ItemStatus;
}

interface TopicSessionProps {
  topicId: string;
  topicName: string;
  topicIcon: string;
  rounds: RoundData[];
}

export default function TopicSession({
  topicId,
  topicName,
  topicIcon,
  rounds,
}: TopicSessionProps) {
  const [screen, setScreen] = useState<Screen>("game");
  const [currentRound, setCurrentRound] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [items, setItems] = useState<ItemWithStatus[]>(() =>
    rounds[0].items.map((item) => ({
      ...item,
      status: "normal" as ItemStatus,
    })),
  );

  const round = rounds[currentRound];
  const totalRounds = rounds.length;

  const handleItemClick = (id: string) => {
    const hasCorrectAnswer = items.some((item) => item.status === "correct");
    if (hasCorrectAnswer) return;

    const clickedItem = items.find((item) => item.id === id);
    if (!clickedItem || clickedItem.status === "wrong") return;

    if (clickedItem.isCorrect) {
      playSuccessSound();
      setCorrectCount((prev) => prev + 1);
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "correct" } : item,
        ),
      );

      // After delay, advance to next round or show summary
      setTimeout(() => {
        if (currentRound + 1 < totalRounds) {
          setCurrentRound((prev) => prev + 1);
          setItems(
            rounds[currentRound + 1].items.map((item) => ({
              ...item,
              status: "normal" as ItemStatus,
            })),
          );
        } else {
          setScreen("summary");
        }
      }, 1500);
    } else {
      playErrorSound();
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "wrong" } : item,
        ),
      );
    }
  };

  if (screen === "summary") {
    return (
      <SessionSummary
        topicId={topicId}
        topicName={topicName}
        topicIcon={topicIcon}
        correctCount={correctCount}
        totalRounds={totalRounds}
      />
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden text-slate-900 select-none">
      {/* Progress indicator */}
      <div className="absolute top-0 right-0 z-30 m-4 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 shadow-md backdrop-blur-md">
        <span className="text-2xl">{topicIcon}</span>
        <span className="font-bold text-slate-700">
          {currentRound + 1}/{totalRounds}
        </span>
      </div>

      {/* Progress dots */}
      <div className="absolute bottom-0 left-1/2 z-30 mb-4 flex -translate-x-1/2 gap-2">
        {rounds.map((_, index) => (
          <div
            key={index}
            className={`h-2 w-2 rounded-full transition-all ${
              index < currentRound
                ? "bg-green-500"
                : index === currentRound
                  ? "h-3 w-3 bg-sky-500"
                  : "bg-slate-300"
            }`}
          />
        ))}
      </div>

      <GameScreen
        inputWord={round.word}
        items={items}
        type={round.type}
        onItemClick={handleItemClick}
      />
    </div>
  );
}

interface SessionSummaryProps {
  topicId: string;
  topicName: string;
  topicIcon: string;
  correctCount: number;
  totalRounds: number;
}

function SessionSummary({
  topicId,
  topicName,
  topicIcon,
  correctCount,
  totalRounds,
}: SessionSummaryProps) {
  const percentage = Math.round((correctCount / totalRounds) * 100);
  const isPerfect = correctCount === totalRounds;

  return (
    <main className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-sky-100 via-blue-50 to-emerald-50 p-6">
      <Confetti />

      {/* Background decoration */}
      <div className="pointer-events-none absolute top-0 left-0 h-full w-full overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-64 w-64 animate-pulse rounded-full bg-yellow-300 opacity-20 blur-3xl" />
        <div
          className="absolute right-1/4 bottom-1/4 h-64 w-64 animate-pulse rounded-full bg-sky-300 opacity-20 blur-3xl"
          style={{ animationDelay: "1s" }}
        />
      </div>

      <section className="z-10 flex max-h-full w-full max-w-lg flex-col items-center overflow-y-auto pb-12">
        <div className="mb-2 flex items-center gap-2 rounded-full bg-white/50 px-4 py-1 backdrop-blur-sm">
          <PartyPopper className="h-5 w-5 text-amber-500" />
          <span className="text-sm font-bold tracking-widest text-slate-500 uppercase">
            Session Complete!
          </span>
        </div>

        <h1 className="animate-bounce-gentle mb-2 shrink-0 bg-gradient-to-r from-sky-600 via-blue-500 to-emerald-500 bg-clip-text text-center text-5xl font-black text-transparent drop-shadow-sm sm:mb-4 sm:text-6xl">
          {isPerfect ? "Perfect!" : "Great Job!"}
        </h1>

        {/* Topic info */}
        <div className="mb-6 flex items-center gap-2 text-slate-600">
          <span className="text-3xl">{topicIcon}</span>
          <span className="text-xl font-bold">{topicName}</span>
        </div>

        {/* Score display */}
        <div className="mb-8 rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mb-2 text-6xl font-black text-sky-600 sm:text-7xl">
            {correctCount}/{totalRounds}
          </div>
          <div className="text-lg font-bold text-slate-500">
            {percentage}% correct
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href={`/topics/${topicId}/play`}
            prefetch={true}
            className="group flex items-center gap-3 rounded-full bg-gradient-to-r from-sky-500 to-blue-500 px-8 py-4 text-lg font-black text-white shadow-xl shadow-sky-500/30 transition-all hover:-translate-y-1 hover:scale-105 hover:shadow-2xl hover:shadow-sky-500/40 focus:ring-4 focus:ring-sky-500/30 focus:outline-none active:translate-y-1 active:scale-95"
          >
            <RefreshCw className="h-6 w-6 transition-transform group-hover:rotate-180" />
            Play Again
          </Link>

          <Link
            href="/topics"
            prefetch={true}
            className="group flex items-center gap-3 rounded-full bg-white px-8 py-4 text-lg font-black text-slate-700 shadow-lg ring-1 ring-slate-200 transition-all hover:-translate-y-1 hover:scale-105 hover:shadow-xl focus:ring-4 focus:ring-slate-500/30 focus:outline-none active:translate-y-1 active:scale-95"
          >
            <Home className="h-6 w-6" />
            All Topics
          </Link>
        </div>
      </section>
    </main>
  );
}
