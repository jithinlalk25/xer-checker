import type { DataDate, Verdict } from '@/core';

const MINUS = '−';

/** One decimal place, with a true minus sign. */
export function fixed1(n: number): string {
  const s = n.toFixed(1);
  return s.startsWith('-') ? MINUS + s.slice(1) : s;
}

export function formatPct(pct: number | null): string {
  return pct === null ? '—' : `${fixed1(pct)}%`;
}

export function formatDays(days: number | null): string {
  return days === null ? '—' : fixed1(days);
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n.toLocaleString('en-US')} bytes`;
  const kb = n / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function formatCount(n: number): string {
  return n.toLocaleString('en-US');
}

const STATUS_LABELS: Record<string, string> = {
  TK_NotStart: 'Not started',
  TK_Active: 'In progress',
  TK_Complete: 'Finished',
};

const TYPE_LABELS: Record<string, string> = {
  TT_Task: 'Task',
  TT_Rsrc: 'Resource dependent',
  TT_Mile: 'Start milestone',
  TT_FinMile: 'Finish milestone',
  TT_LOE: 'Level of effort',
  TT_WBS: 'WBS summary',
};

export function statusLabel(code: string): string {
  return STATUS_LABELS[code] ?? (code || '—');
}

export function typeLabel(code: string): string {
  return TYPE_LABELS[code] ?? (code || '—');
}

export function dataDateLabel(date: DataDate): string {
  switch (date.state) {
    case 'ok':
      return date.value.endsWith(' 00:00') ? date.value.slice(0, 10) : date.value;
    case 'unreadable':
      return `Unreadable ("${date.raw}")`;
    case 'empty':
      return 'Not set';
  }
}

export function verdictLabel(verdict: Verdict): string {
  return verdict === 'n/a' ? 'n/a' : verdict === 'pass' ? 'Pass' : 'Fail';
}

/** Shows tabs in a raw XER line as a visible arrow. */
export function showTabs(text: string): string {
  return text.replaceAll('\t', ' → ');
}
