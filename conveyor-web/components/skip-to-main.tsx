"use client";

import { skipToMain } from "@/lib/accessibility";

/**
 * Skip to main content link for keyboard navigation
 * Appears on focus for screen reader and keyboard users
 */
export function SkipToMain() {
  return (
    <button
      onClick={skipToMain}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      Skip to main content
    </button>
  );
}
