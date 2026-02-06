"use client";

import { useState } from "react";
import { GameScreen, SessionProgress, SessionSummary } from "@/components";
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

    // Only count as correct if this is the first click (no wrong attempts yet)
    const hasWrongAttempt = items.some((item) => item.status === "wrong");

    if (clickedItem.isCorrect) {
      playSuccessSound();
      if (!hasWrongAttempt) {
        setCorrectCount((prev) => prev + 1);
      }
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
      <SessionProgress
        currentRound={currentRound}
        totalRounds={totalRounds}
        topicIcon={topicIcon}
      />

      <GameScreen
        inputWord={round.word}
        items={items}
        type={round.type}
        onItemClick={handleItemClick}
        backHref={`/topics/${topicId}`}
      />
    </div>
  );
}
