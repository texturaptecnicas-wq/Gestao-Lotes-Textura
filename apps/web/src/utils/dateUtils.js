import { COMPANY_TIME_ZONE } from '@/utils/paintedPending';

/**
 * Returns today's date in the company timezone as YYYY-MM-DD.
 * Uses Intl.DateTimeFormat so the result never depends on the device zone.
 */
export function todayISO() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: COMPANY_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Shifts a YYYY-MM-DD date by N days. All arithmetic is done in UTC so the
 * result never drifts when the device timezone differs from the company zone.
 */
export function shiftDate(iso, days) {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  const yy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

/**
 * Formats a YYYY-MM-DD date for display (e.g. "qua., 21/10").
 * Built from the date parts directly so it is immune to timezone shifts —
 * a pure calendar date is never converted through an instant.
 */
export function formatDisplay(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(Date.UTC(y, m - 1, d));
  const weekday = date.toLocaleDateString('pt-BR', { weekday: 'short', timeZone: 'UTC' });
  return `${weekday}, ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}

/**
 * Returns the first day (YYYY-MM-01) of the month containing the given date,
 * defaulting to today. Used to scope monthly cleanup of old programações.
 */
export function firstDayOfMonthISO(iso = todayISO()) {
  const [y, m] = iso.split('-').map(Number);
  return `${y}-${String(m).padStart(2, '0')}-01`;
}
