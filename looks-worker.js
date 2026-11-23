// Slow outfit checks off the main thread, so taps never freeze (on the phone: Rules took 7s, Never picked 25s).
// Gets the closet without photos plus your taste; sends back piece ids. The page also imports `jobs` to run them itself
// when a browser can't start a module worker.
import { setTaste, today, madeWith, lookPool, lookRules, compareBuys, nextBasics } from './match.js';
const flatBuy = r => ({ ...r, twins: r.twins.map(p => p.id), kin: r.kin.map(p => p.id), examples: r.examples.map(o => ({ score: o.score, ids: o.items.map(p => p.ghost ? null : p.id) })) }); // ids only across the worker line

export const jobs = {
  // Inspo › Rules: the wide pool of looks, each with the rules it follows
  pool: d => ({ looks: lookPool(d.items).map(o => ({ key: o.key, ids: o.items.map(p => p.id), mode: o.mode, score: o.score, note: o.note, why: lookRules(o) })) }),
  // Never picked: what 8 fresh sets of Today pick, the typical score per category, and each other piece's best look
  rare: d => {
    const byId = new Map(d.items.map(p => [p.id, p])), hits = {}, picked = {}; let seed = 5; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let r = 0; r < 8; r++) for (const o of today(d.items, { ...d.opts, n: 12, rand })) for (const p of o.items) { hits[p.id] = (hits[p.id] ?? 0) + 1; (picked[p.cat] ??= []).push(o.score - 0.25); } // Today adds about 0.25 of randomness (0 to 0.5 since v5.73)
    const med = Object.fromEntries(Object.entries(picked).map(([c, v]) => [c, v.sort((a, b) => a - b)[v.length >> 1]]));
    const ok = d.okIds.map(id => byId.get(id)).filter(Boolean);
    // ponytail: 800 random tries per piece, not 1500 (about 2x faster); the verdict allows for the lower best
    const made = Object.fromEntries(d.check.filter(id => !hits[id]).map(id => { const m = madeWith(ok, byId.get(id), 4, { tries: 800 }); return [id, [m.length, m[0]?.score ?? null]]; }));
    return { hits, med, made };
  },
  // Wishlist › Which one: each candidate tested against every piece it has to go with (about 30ms a color on a Mac)
  buy: d => ({ list: compareBuys(d.items, d.cands, d.opts).map(flatBuy) }),
  // Wishlist › Suggested: every basic you don't own yet, ranked (a few seconds on a phone)
  basics: d => ({ list: nextBasics(d.items, d.opts).map(flatBuy) }),
};

if (typeof WorkerGlobalScope !== 'undefined') onmessage = ({ data }) => { setTaste(data.taste); postMessage({ id: data.id, ...jobs[data.job](data) }); };
