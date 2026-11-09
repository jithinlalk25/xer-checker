import { checkStage, NotXerError, readStage } from '@/core';
import type { CheckRequest, CheckResponse } from './protocol';

function post(message: CheckResponse) {
  self.postMessage(message);
}

/** SHA-256 of the file, used to recognise the bundled sample files. Null where unavailable. */
async function sha256(bytes: Uint8Array<ArrayBuffer>): Promise<string | null> {
  if (!globalThis.crypto?.subtle) return null;
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

self.onmessage = async (event: MessageEvent<CheckRequest>) => {
  const { id, name, bytes } = event.data;
  try {
    post({ id, stage: 'reading' });
    const data = new Uint8Array(bytes);
    const read = readStage(name, data);
    post({ id, stage: 'checking' });
    const result = checkStage(read);
    post({ id, result, sha256: await sha256(data) });
  } catch (err) {
    const refused = err instanceof NotXerError;
    const detail = err instanceof Error ? err.message : String(err);
    post({ id, error: refused ? detail : `This file couldn't be read: ${detail}`, refused });
  }
};
