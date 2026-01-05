/**
 * Performance optimization utilities
 */

import { useEffect, useRef } from "react";

/**
 * Hook to detect slow renders (>16ms)
 * Useful for identifying performance bottlenecks in development
 */
export function useRenderPerformance(componentName: string, threshold = 16) {
  const renderStart = useRef<number>(0);

  useEffect(() => {
    renderStart.current = performance.now();
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStart.current;
    if (renderTime > threshold) {
      console.warn(
        `[Performance] ${componentName} rendered in ${renderTime.toFixed(2)}ms (threshold: ${threshold}ms)`
      );
    }
  });
}

/**
 * Debounce function for performance optimization
 * Useful for search inputs, window resize handlers, etc.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for performance optimization
 * Useful for scroll handlers, mousemove events, etc.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Lazy load images with Intersection Observer
 * Improves initial page load performance
 */
export function lazyLoadImage(img: HTMLImageElement) {
  const src = img.dataset.src;
  if (!src) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          img.src = src;
          img.removeAttribute("data-src");
          observer.unobserve(img);
        }
      });
    },
    { rootMargin: "50px" }
  );

  observer.observe(img);
}

/**
 * Measure and log component mount time
 */
export function measureComponentMount(componentName: string) {
  const start = performance.now();

  return () => {
    const duration = performance.now() - start;
    if (process.env.NODE_ENV === "development") {
      console.log(`[Performance] ${componentName} mounted in ${duration.toFixed(2)}ms`);
    }
  };
}

/**
 * Check if device prefers reduced motion
 * Use this to disable animations for accessibility
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
