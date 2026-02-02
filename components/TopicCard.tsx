"use client";

import Link from "next/link";
import { playPopSound } from "@/lib/audio";
import type { Topic } from "@/lib/topics";

type TopicCardVariant = "compact" | "full";

interface TopicCardProps {
  topic: Topic;
  variant?: TopicCardVariant;
}

export function TopicCard({ topic, variant = "full" }: TopicCardProps) {
  if (variant === "compact") {
    return (
      <Link
        href={`/topics/${topic.id}`}
        prefetch={true}
        onClick={() => playPopSound()}
        className="group flex w-full flex-col items-center gap-2 touch-manipulation rounded-2xl border-b-4 border-slate-200 bg-white p-3 shadow-md transition-all hover:-translate-y-1 hover:rotate-2 hover:border-sky-300 hover:shadow-lg focus:ring-2 focus:ring-sky-500 focus:outline-none active:translate-y-0 active:rotate-0 sm:p-4"
      >
        <div className="text-3xl transition-transform group-hover:scale-110 sm:text-4xl">
          {topic.icon}
        </div>
        <h3 className="text-center text-xs font-bold text-slate-800 group-hover:text-sky-600 sm:text-sm">
          {topic.name}
        </h3>
      </Link>
    );
  }

  return (
    <Link
      href={`/topics/${topic.id}`}
      prefetch={true}
      onClick={() => playPopSound()}
      className="group flex w-full flex-col touch-manipulation rounded-2xl border-b-4 border-slate-200 bg-white p-4 shadow-md transition-all hover:-translate-y-1 hover:rotate-1 hover:border-sky-300 hover:shadow-lg focus:ring-2 focus:ring-sky-500 focus:outline-none active:translate-y-0 active:rotate-0 sm:p-6"
    >
      <div className="mb-3 text-4xl transition-transform group-hover:scale-110 sm:text-5xl">
        {topic.icon}
      </div>
      <h3 className="mb-1 font-bold text-slate-800 group-hover:text-sky-600 sm:text-lg">
        {topic.name}
      </h3>
      <p className="line-clamp-2 text-xs leading-relaxed text-slate-500 sm:text-sm">
        {topic.description}
      </p>
    </Link>
  );
}
