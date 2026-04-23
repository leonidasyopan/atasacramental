/**
 * Date helpers for the attendance module.
 *
 * Attendance is always tracked per Sunday. When the counter opens the screen
 * on a weekday we default to the most recent past Sunday so a forgotten
 * count can still be entered on Monday/Tuesday.
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function toIsoDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function currentSundayIso(now = new Date()) {
  const day = now.getDay();
  if (day === 0) return toIsoDate(now);
  const lastSunday = new Date(now.getTime() - day * MS_PER_DAY);
  return toIsoDate(lastSunday);
}

export function formatPtBrDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
