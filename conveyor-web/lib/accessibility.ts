/**
 * Accessibility utilities and ARIA helpers
 */

// Generate unique IDs for ARIA relationships
let idCounter = 0;
export function generateId(prefix: string = "id"): string {
  return `${prefix}-${++idCounter}`;
}

// Screen reader announcer
export function announce(message: string, priority: "polite" | "assertive" = "polite") {
  const announcer = document.getElementById("aria-live-announcer");
  if (announcer) {
    announcer.setAttribute("aria-live", priority);
    announcer.textContent = message;

    // Clear after announcement
    setTimeout(() => {
      announcer.textContent = "";
    }, 1000);
  }
}

// Focus trap for modals
export function createFocusTrap(element: HTMLElement) {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key !== "Tab") return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  }

  element.addEventListener("keydown", handleKeyDown);

  // Focus first element
  firstFocusable?.focus();

  // Return cleanup function
  return () => {
    element.removeEventListener("keydown", handleKeyDown);
  };
}

// Keyboard navigation helpers
export const KeyboardKeys = {
  ENTER: "Enter",
  SPACE: " ",
  ESCAPE: "Escape",
  ARROW_UP: "ArrowUp",
  ARROW_DOWN: "ArrowDown",
  ARROW_LEFT: "ArrowLeft",
  ARROW_RIGHT: "ArrowRight",
  HOME: "Home",
  END: "End",
  TAB: "Tab",
} as const;

export function isClickKey(key: string): boolean {
  return key === KeyboardKeys.ENTER || key === KeyboardKeys.SPACE;
}

// ARIA label generators
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: "Status: Active",
    inactive: "Status: Inactive",
    running: "Status: Running",
    completed: "Status: Completed",
    failed: "Status: Failed",
    paused: "Status: Paused",
    draft: "Status: Draft",
    pending: "Status: Pending",
    error: "Status: Error",
  };
  return labels[status] || `Status: ${status}`;
}

export function getActionLabel(action: string, itemName?: string): string {
  const suffix = itemName ? ` ${itemName}` : "";
  const labels: Record<string, string> = {
    edit: `Edit${suffix}`,
    delete: `Delete${suffix}`,
    view: `View${suffix}`,
    run: `Run${suffix}`,
    pause: `Pause${suffix}`,
    resume: `Resume${suffix}`,
    duplicate: `Duplicate${suffix}`,
    download: `Download${suffix}`,
    refresh: `Refresh${suffix}`,
  };
  return labels[action] || `${action}${suffix}`;
}

// Live region announcer component helper
export function createLiveRegion() {
  if (typeof document === "undefined") return null;

  const existing = document.getElementById("aria-live-announcer");
  if (existing) return existing;

  const announcer = document.createElement("div");
  announcer.id = "aria-live-announcer";
  announcer.setAttribute("role", "status");
  announcer.setAttribute("aria-live", "polite");
  announcer.setAttribute("aria-atomic", "true");
  announcer.className = "sr-only";
  announcer.style.cssText = `
    position: absolute;
    left: -10000px;
    width: 1px;
    height: 1px;
    overflow: hidden;
  `;

  document.body.appendChild(announcer);
  return announcer;
}

// Initialize accessibility features
export function initializeA11y() {
  if (typeof window !== "undefined") {
    createLiveRegion();
  }
}

// Skip to main content link
export function skipToMain() {
  const main = document.querySelector("main");
  if (main) {
    main.setAttribute("tabindex", "-1");
    main.focus();
  }
}
