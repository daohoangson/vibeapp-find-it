"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { playPopSound } from "@/lib/audio";
import { SoundToggle } from "./SoundToggle";

interface PageHeaderProps {
  /** URL for the back button. If not provided, no back button is shown. */
  backHref?: string;
  /** Accessible label for the back button. */
  backLabel?: string;
  /** Title displayed in the center. If not provided, center space is empty. */
  title?: string;
  /** Custom content for the center area. Overrides title if provided. */
  centerContent?: React.ReactNode;
  /** Custom content for the right area. Overrides SoundToggle if provided. */
  rightContent?: React.ReactNode;
  /** Whether to show the SoundToggle. Default: true. Ignored if rightContent is provided. */
  showSoundToggle?: boolean;
  /** Whether the header is sticky. Default: true. */
  sticky?: boolean;
  /** Whether to show the background styling. Default: true. */
  showBackground?: boolean;
  /** Additional class names for the header element. */
  className?: string;
}

export function PageHeader({
  backHref,
  backLabel = "Go back",
  title,
  centerContent,
  rightContent,
  showSoundToggle = true,
  sticky = true,
  showBackground = true,
  className = "",
}: PageHeaderProps) {
  const stickyClass = sticky ? "sticky top-0" : "";
  const backgroundClass = showBackground
    ? "bg-white/80 shadow-sm backdrop-blur-md"
    : "";

  return (
    <header
      className={`z-20 px-4 py-4 sm:px-6 ${stickyClass} ${backgroundClass} ${className}`}
    >
      <div className="flex w-full items-center justify-between">
        {/* Left: Back button or spacer */}
        {backHref ? (
          <Link
            href={backHref}
            prefetch={true}
            onClick={() => playPopSound()}
            aria-label={backLabel}
            className="rounded-full bg-white/80 p-3 text-slate-400 shadow-sm transition-all hover:scale-105 hover:bg-white hover:text-sky-600 hover:shadow-md focus:ring-2 focus:ring-sky-500 focus:outline-none active:scale-95"
          >
            <ArrowLeft className="h-6 w-6 stroke-[3px]" />
          </Link>
        ) : (
          <div className="w-12" />
        )}

        {/* Center: Title or custom content */}
        {centerContent ??
          (title ? (
            <h1 className="text-2xl font-black tracking-tight text-slate-800 sm:text-3xl">
              {title}
            </h1>
          ) : null)}

        {/* Right: Custom content, SoundToggle, or spacer */}
        {rightContent ??
          (showSoundToggle ? <SoundToggle /> : <div className="w-12" />)}
      </div>
    </header>
  );
}

interface PageHeaderSkeletonProps {
  /** Whether to show a title skeleton in the center. Default: false. */
  showTitle?: boolean;
  /** Whether the header is sticky. Default: true. */
  sticky?: boolean;
  /** Whether to show the background styling. Default: true. */
  showBackground?: boolean;
  /** Additional class names for the header element. */
  className?: string;
}

export function PageHeaderSkeleton({
  showTitle = false,
  sticky = true,
  showBackground = true,
  className = "",
}: PageHeaderSkeletonProps) {
  const stickyClass = sticky ? "sticky top-0" : "";
  const backgroundClass = showBackground
    ? "bg-white/80 shadow-sm backdrop-blur-md"
    : "";

  return (
    <header
      className={`z-20 px-4 py-4 sm:px-6 ${stickyClass} ${backgroundClass} ${className}`}
    >
      <div className="flex w-full items-center justify-between">
        {/* Left: Back button skeleton */}
        <div className="h-12 w-12 animate-pulse rounded-full bg-slate-200" />

        {/* Center: Title skeleton */}
        {showTitle && (
          <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        )}

        {/* Right: Spacer to maintain layout */}
        <div className="w-12" />
      </div>
    </header>
  );
}
