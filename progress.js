// Streaks + badges. Pure, no DOM — tested by match.test.mjs.
// log entry: { day: 'YYYY-MM-DD' (or 'YYYY-MM-DD#2' for a second outfit that day), key, ids, mode }.
import { isNeutral, colorName } from './match.js';

const pad = n => String(n).padStart(2, '0');
export const dayKey = (t = new Date()) => { const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
export const prevDay = k => { const d = new Date(k + 'T12:00'); d.setDate(d.getDate() - 1); return dayKey(d); };

// cur stays alive until the end of today even if today isn't logged yet.
export function streaks(log, today = dayKey()) {
  const days = new Set(log.map(l => l.day.slice(0, 10))); // a second outfit (2026-11-16#2) is the same day
  let cur = 0;
  for (let k = days.has(today) ? today : prevDay(today); days.has(k); k = prevDay(k)) cur++;
  let best = 0, run = 0, last;
  for (const k of [...days].sort()) { run = last && prevDay(k) === last ? run + 1 : 1; best = Math.max(best, run); last = k; }
  return { cur, best, today: days.has(today), days };
}

const COLOR_MODES = ['formula', 'complementary', 'analogous', 'triadic', 'palette'];
export const BADGES = [
  { id: 'first', name: 'First Fit', desc: 'Log your first outfit', icon: 'spark', goal: 1, val: c => c.log.length },
  { id: 'streak3', name: 'Hat Trick', desc: '3-day streak', icon: 'flame', goal: 3, val: c => c.best },
  { id: 'streak7', name: 'Week Strong', desc: '7-day streak', icon: 'cal', goal: 7, val: c => c.best },
  { id: 'streak30', name: 'Locked In', desc: '30-day streak', icon: 'shield', goal: 30, val: c => c.best },
  { id: 'fresh7', name: 'No Repeats', desc: 'Wear 7 different outfits', icon: 'shuffle', goal: 7, val: c => new Set(c.log.map(l => l.key)).size },
  { id: 'theory', name: 'Color Theory', desc: 'Wear a color-wheel fit', icon: 'wheel', goal: 1, val: c => c.log.filter(l => COLOR_MODES.includes(l.mode)).length },
  { id: 'street5', name: 'Street Certified', desc: 'Wear 5 streetwear fits', icon: 'shoe', goal: 5, val: c => c.log.filter(l => l.mode === 'street').length },
  { id: 'pieces10', name: 'Curator', desc: '10 pieces in your closet', icon: 'hanger', goal: 10, val: c => c.items.length },
  { id: 'pieces50', name: 'Archive', desc: '50 pieces in your closet', icon: 'box', goal: 50, val: c => c.items.length },
  // ponytail: badges are derived, not stored — Full Rotation can relock when new pieces arrive. Persist unlocks if that annoys.
  { id: 'rotation', name: 'Full Rotation', desc: 'Wear every piece once', icon: 'loop', goal: 100, unit: '%', val: c => c.items.length < 5 ? 0 : Math.round(100 * c.items.filter(i => i.wears).length / c.items.length) },
  { id: 'saved5', name: 'Collector', desc: 'Favorite 5 outfits', icon: 'heart', goal: 5, val: c => c.saved.length },
  { id: 'spectrum', name: 'Full Spectrum', desc: 'Own 6 different colors', icon: 'prism', goal: 6, val: c => new Set(c.items.filter(i => !isNeutral(i.color)).map(i => colorName(i.color))).size },
];

export function badges({ items, log, saved }, today) {
  const c = { items, log, saved, best: streaks(log, today).best };
  return BADGES.map(b => { const v = b.val(c); return { ...b, v: Math.min(v, b.goal), done: v >= b.goal }; });
}
