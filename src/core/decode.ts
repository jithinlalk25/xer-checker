import type { Encoding } from './types.ts';

const ERMHDR = [0x45, 0x52, 0x4d, 0x48, 0x44, 0x52];
const UTF8_BOM = [0xef, 0xbb, 0xbf];

/** True if the bytes start with ERMHDR (after an optional UTF-8 byte order mark). */
export function startsWithErmhdr(bytes: Uint8Array): boolean {
  const offset = UTF8_BOM.every((b, i) => bytes[i] === b) ? UTF8_BOM.length : 0;
  return ERMHDR.every((b, i) => bytes[offset + i] === b);
}

/** Decode as strict UTF-8, falling back to Windows-1252. P6 doesn't declare an encoding. */
export function decodeXer(bytes: Uint8Array): { text: string; encoding: Encoding } {
  try {
    return { text: new TextDecoder('utf-8', { fatal: true }).decode(bytes), encoding: 'UTF-8' };
  } catch {
    return { text: new TextDecoder('windows-1252').decode(bytes), encoding: 'Windows-1252' };
  }
}
