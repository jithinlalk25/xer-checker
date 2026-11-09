import type { ReactNode } from 'react';

/** A button that reads as a link inside running text. */
export function InlineLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-medium text-foreground underline underline-offset-2 hover:decoration-2 focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {children}
    </button>
  );
}
