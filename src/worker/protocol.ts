import type { FileResult } from '@/core';

/** Page → worker. The bytes are transferred, not copied. */
export interface CheckRequest {
  id: string;
  name: string;
  bytes: ArrayBuffer;
}

export type CheckStage = 'reading' | 'checking';

/** Worker → page: progress events, then exactly one result or error. */
export type CheckResponse =
  | { id: string; stage: CheckStage }
  | { id: string; result: FileResult; sha256: string | null }
  | { id: string; error: string; refused: boolean };
