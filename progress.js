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
  // wearing what you already own: a piece's first wear counts once it has sat in the closet 2+ weeks
  { id: 'digdeep', name: 'Dig Deep', desc: 'Wear 10 pieces you had never worn', icon: 'loop', goal: 10, val: c => { const first = {}; for (const l of c.log) for (const id of l.ids ?? []) { const d = l.day.slice(0, 10); if (!(first[id] <= d)) first[id] = d; }
    return c.items.filter(i => first[i.id] && i.createdAt && first[i.id] > dayKey(i.createdAt + 14 * 864e5)).length; } },
  { id: 'spectrum', name: 'Full Spectrum', desc: 'Own 6 different colors', icon: 'prism', goal: 6, val: c => new Set(c.items.filter(i => !isNeutral(i.color)).map(i => colorName(i.color))).size },
];

export function badges({ items, log, saved }, today) {
  const c = { items, log, saved, best: streaks(log, today).best };
  return BADGES.map(b => { const v = b.val(c); return { ...b, v: Math.min(v, b.goal), done: v >= b.goal }; });
}

// ---------- style points, levels, unlocks (Me › Streak) ----------
// Points come from what you did (logged days, streaks, first wears, saves, badges), so they sync with your backup and never drift.
export const LEVELS = [[0, 'Fresh'], [150, 'Rookie'], [400, 'Regular'], [900, 'Sharp'], [1800, 'Fly'], [3500, 'Tastemaker'], [7000, 'Icon'], [14000, 'Legend']];
export function points({ items, log, saved }, today = dayKey()) {
  const byDay = {}, add = (d, n) => { byDay[d] = (byDay[d] ?? 0) + n; }, worn = new Set();
  let run = 0, last;
  for (const d of [...new Set(log.map(l => l.day.slice(0, 10)))].sort()) { run = last && prevDay(d) === last ? run + 1 : 1; last = d; add(d, 10 + Math.min(run - 1, 10) * 2); } // a logged day: 10, plus 2 per streak day (up to +20)
  for (const l of [...log].sort((a, b) => a.day.localeCompare(b.day) || (a.at ?? 0) - (b.at ?? 0))) { const d = l.day.slice(0, 10);
    if (l.day.includes('#')) add(d, 5); if (l.src === 'today') add(d, 3); // a second outfit that day, a pick from Today
    for (const id of l.ids ?? []) if (!worn.has(id)) { worn.add(id); add(d, 5); } } // every piece's first wear: wear your whole closet
  for (const s of saved) if (s.savedAt) add(dayKey(s.savedAt), 3);
  const total = Object.values(byDay).reduce((t, n) => t + n, 0) + badges({ items, log, saved }, today).filter(b => b.done).length * 25;
  return { total, byDay };
}
export const levelOf = n => { let i = LEVELS.length - 1; while (i > 0 && n < LEVELS[i][0]) i--; return { i, at: LEVELS[i][0], name: LEVELS[i][1], next: LEVELS[i + 1] ?? null }; };
// Things you unlock and keep (the app remembers them, so a broken streak never takes them back).
export const UNLOCKS = [
  { id: 'bestdressed', name: 'Best Dressed', desc: 'Your best fit of the week, crowned on Me', need: '3-day streak', ok: c => c.best >= 3 },
  { id: 'gold', name: 'Gold and Chrome', desc: 'Two new pop colors in Settings', need: '7-day streak', ok: c => c.best >= 7 },
  { id: 'wrapped', name: 'Month in Review', desc: 'Your month: most worn, top colors, best fit', need: 'Rookie level (150 points)', ok: c => c.level >= 1 }, // was Sharp: too far off to be worth anything
  { id: 'noir', name: 'Noir', desc: 'A true-black theme', need: '14-day streak', ok: c => c.best >= 14 },
];
export const unlocks = (ctx, today = dayKey()) => { const best = streaks(ctx.log, today).best, level = levelOf(points(ctx, today).total).i; return UNLOCKS.map(u => ({ ...u, done: u.ok({ best, level }) })); };
