/**
 * Helpers for the settings page's date and time picker (no DOM, so they can be tested).
 *
 * The target date is stored as an ISO (UTC) string of a LOCAL date and time.
 * A `datetime-local` input wants and gives local text like "2026-12-31T23:59".
 */
import { getNextNewYear } from './config';

const two = (n) => String(n).padStart(2, '0');

/** ISO string -> "YYYY-MM-DDTHH:mm" in the viewer's local time ('' if it isn't a date). */
export function toDateTimeLocal(iso) {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${two(date.getMonth() + 1)}-${two(date.getDate())}T${two(date.getHours())}:${two(date.getMinutes())}`;
}

/** "YYYY-MM-DDTHH:mm" (local) -> ISO string, or null if it isn't a date. */
export function fromDateTimeLocal(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value ?? '');
  if (!match) return null;
  const [year, month, day, hours, minutes] = match.slice(1).map(Number);
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);
  // `new Date` rolls impossible values over (month 13 becomes January): refuse those.
  const same =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date.getHours() === hours &&
    date.getMinutes() === minutes;
  return same ? date.toISOString() : null;
}

/** Quick picks for the target date. */
export function datePresets(now = new Date()) {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  return [
    { label: 'Next hour', iso: new Date(y, m, d, now.getHours() + 1, 0, 0, 0).toISOString() },
    { label: 'Tomorrow midnight', iso: new Date(y, m, d + 1, 0, 0, 0, 0).toISOString() },
    { label: 'Next New Year', iso: getNextNewYear(now) },
  ];
}
