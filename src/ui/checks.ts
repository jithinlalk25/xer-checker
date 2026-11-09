import { Hourglass, Link2, TrendingDown, type LucideIcon } from 'lucide-react';
import {
  HIGH_FLOAT_DAYS,
  HIGH_FLOAT_MAX_PCT,
  MISSING_LINKS_MAX_PCT,
  NEGATIVE_FLOAT_MAX_COUNT,
} from '@/core';

export type CheckKey = 'missingLinks' | 'negativeFloat' | 'highFloat';

export interface CheckInfo {
  key: CheckKey;
  title: string;
  icon: LucideIcon;
  /** What gets flagged, in one short line (used on the intro screen). */
  summary: string;
  /** Pass mark in short form, e.g. "≤ 5%". */
  passMark: string;
  /** Where the pass mark sits on a % scale. */
  passMarkPct: number;
  /** One-line explanation for the check card. */
  explanation: string;
  /** What the % is worked out on. */
  baseLabel: string;
}

export const CHECKS: CheckInfo[] = [
  {
    key: 'missingLinks',
    title: 'Missing links',
    icon: Link2,
    summary: 'Unfinished activities with no predecessor or no successor. Start and finish milestones are exempt.',
    passMark: `≤ ${MISSING_LINKS_MAX_PCT}%`,
    passMarkPct: MISSING_LINKS_MAX_PCT,
    explanation: `Unfinished activities with no predecessor or no successor (start and finish milestones exempt). DCMA: at most ${MISSING_LINKS_MAX_PCT}%.`,
    baseLabel: 'checked activities',
  },
  {
    key: 'negativeFloat',
    title: 'Negative float',
    icon: TrendingDown,
    summary: 'Unfinished activities with total float below 0 working days.',
    passMark: NEGATIVE_FLOAT_MAX_COUNT === 0 ? 'none allowed' : `≤ ${NEGATIVE_FLOAT_MAX_COUNT}`,
    passMarkPct: 0,
    explanation: 'Unfinished activities with total float below 0 working days. DCMA: none allowed.',
    baseLabel: 'checked activities with float',
  },
  {
    key: 'highFloat',
    title: 'High float',
    icon: Hourglass,
    summary: `Unfinished activities with total float above ${HIGH_FLOAT_DAYS} working days.`,
    passMark: `≤ ${HIGH_FLOAT_MAX_PCT}%`,
    passMarkPct: HIGH_FLOAT_MAX_PCT,
    explanation: `Unfinished activities with total float above ${HIGH_FLOAT_DAYS} working days. DCMA: at most ${HIGH_FLOAT_MAX_PCT}%.`,
    baseLabel: 'checked activities with float',
  },
];
