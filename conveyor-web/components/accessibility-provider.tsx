"use client";

import { useEffect } from "react";
import { initializeA11y } from "@/lib/accessibility";

/**
 * Client component that initializes accessibility features
 * Should be rendered once in the root layout
 */
export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initializeA11y();
  }, []);

  return <>{children}</>;
}
