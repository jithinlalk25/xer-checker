import type { FileResult } from '@/core';
import type { CheckRequest, CheckResponse, CheckStage } from './protocol';

export class CheckError extends Error {
  readonly refused: boolean;

  constructor(message: string, refused: boolean) {
    super(message);
    this.name = 'CheckError';
    this.refused = refused;
  }
}

export interface CheckJob {
  promise: Promise<{ result: FileResult; sha256: string | null }>;
  cancel: () => void;
}

/** Reads and checks one file in its own Web Worker, which is closed when done or cancelled. */
export function checkInWorker(id: string, name: string, bytes: ArrayBuffer, onStage: (stage: CheckStage) => void): CheckJob {
  const worker = new Worker(new URL('./xer.worker.ts', import.meta.url), { type: 'module' });

  const promise = new Promise<{ result: FileResult; sha256: string | null }>((resolve, reject) => {
    worker.onmessage = (event: MessageEvent<CheckResponse>) => {
      const message = event.data;
      if ('stage' in message) {
        onStage(message.stage);
        return;
      }
      worker.terminate();
      if ('result' in message) resolve({ result: message.result, sha256: message.sha256 });
      else reject(new CheckError(message.error, message.refused));
    };
    worker.onerror = (event) => {
      worker.terminate();
      reject(new CheckError(`This file couldn't be read: ${event.message || 'the checker stopped unexpectedly'}`, false));
    };
  });

  const request: CheckRequest = { id, name, bytes };
  worker.postMessage(request, [bytes]);

  return { promise, cancel: () => worker.terminate() };
}
