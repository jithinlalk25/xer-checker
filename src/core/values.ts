const ID_PATTERN = /^\d+$/;
const NUMBER_PATTERN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?: (\d{2}):(\d{2}))?$/;

/** P6 IDs are whole numbers. */
export function isId(value: string): boolean {
  return ID_PATTERN.test(value);
}

/** Returns the number, or null if the text isn't a plain decimal number. */
export function parseNumber(value: string): number | null {
  if (!NUMBER_PATTERN.test(value)) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** P6 dates are YYYY-MM-DD HH:MM. The date must exist on the calendar. */
export function isValidDate(value: string): boolean {
  const m = DATE_PATTERN.exec(value);
  if (!m) return false;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1) return false;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day > daysInMonth) return false;
  if (m[4] !== undefined && (Number(m[4]) > 23 || Number(m[5]) > 59)) return false;
  return true;
}

/** Short quoted form of a value for use in a reason. */
export function quote(value: string): string {
  return value.length > 40 ? `"${value.slice(0, 40)}…"` : `"${value}"`;
}
