/**
 * The tallest a table or list gets before it scrolls inside its card, so a file with hundreds of flagged
 * activities, broken rows or warnings doesn't stretch the page. Focusable, so it can be scrolled with the keyboard.
 */
export const SCROLL_AREA =
  'max-h-[min(32rem,70svh)] overflow-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset';

/** A table header that stays in view while its table scrolls inside a SCROLL_AREA. */
export const STICKY_HEADER = 'sticky top-0 z-10 bg-card shadow-[inset_0_-1px_0_var(--color-border)]';
