import type { ResolvedTheme } from './themeContext';

/** Chart colours per theme. Pass/fail is blue/red rather than green/red so it stays distinct with colour blindness. */
export const CHART_COLORS = {
  light: {
    pass: '#2a78d6',
    fail: '#d03b3b',
    none: '#c9ccd2',
    ink: '#17191f',
    secondary: '#4b4f57',
    muted: '#6b6f78',
    grid: '#e6e8ec',
    axis: '#c9ccd2',
    hover: 'rgba(23, 25, 31, 0.04)',
  },
  dark: {
    pass: '#3987e5',
    fail: '#e05252',
    none: '#4f5358',
    ink: '#eff0f3',
    secondary: '#c3c6cc',
    muted: '#9b9fa5',
    grid: '#3a3d43',
    axis: '#4f5358',
    hover: 'rgba(255, 255, 255, 0.05)',
  },
} as const;

export type ChartColors = (typeof CHART_COLORS)[ResolvedTheme];
