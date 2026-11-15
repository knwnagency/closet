// Color + outfit matching. Pure functions, no DOM — tested by match.test.mjs.
export const CATS = ['Tops', 'Layers', 'Bottoms', 'Shoes', 'Accessories'];

export function hexToHsl(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  if (!d) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: h * 60, s, l };
}

// ponytail: hand-tuned "fashion neutral" ranges (navy, denim, khaki, olive count as neutral). Tweak here if items misread.
export function isNeutral(hex) {
  const { h, s, l } = hexToHsl(hex);
  return s < 0.18 || l < 0.13 || l > 0.9
    || (h >= 15 && h <= 50 && s < 0.5 && l < 0.85)      // tan, beige, brown, khaki
    || (h >= 190 && h <= 250 && (l < 0.3 || s < 0.45))  // navy, denim
    || (h >= 50 && h <= 100 && s < 0.35 && l < 0.45);   // olive
}

// Hue bands as people name clothes: a blue-ish green jacket is green, not cyan.
const HUES = [[15, 'red'], [40, 'orange'], [65, 'yellow'], [85, 'lime'], [172, 'green'], [195, 'teal'], [250, 'blue'], [290, 'purple'], [325, 'magenta'], [345, 'pink'], [361, 'red']];
// What you can pick in the item sheet. Each one reads back as its own name (match.test.mjs checks).
export const SWATCHES = { black: '#1b1a19', grey: '#7d7b78', 'light grey': '#c9c7c3', white: '#f6f5f1', navy: '#1e2a45', denim: '#4d6a8c', 'light blue': '#9cc3e6', blue: '#2f5fb5', teal: '#2a8085', green: '#3f7a52', forest: '#22402c', olive: '#5c5b33', sage: '#8aa877', beige: '#d8c7a6', camel: '#b2874e', brown: '#5b3e2a', rust: '#a8522b', orange: '#e2782c', yellow: '#e9c548', red: '#c0392b', burgundy: '#6b1e2a', pink: '#e9a2b9', purple: '#6c4a90' };
export function colorName(hex) {
  const { h, s, l } = hexToHsl(hex);
  if (l < 0.13) return 'black';
  if (l > 0.9) return 'white';
  if (s < 0.18) return l > 0.6 ? 'light grey' : 'grey';
  if (h >= 190 && h <= 250 && l < 0.3) return 'navy';
  if (h >= 190 && h <= 250 && s < 0.45) return 'denim';
  if (h >= 15 && h <= 50 && s < 0.5) return l > 0.6 ? 'beige' : l > 0.42 ? 'camel' : 'brown';
  if (h >= 50 && h <= 100 && s < 0.35 && l < 0.45) return 'olive';
  if ((h < 15 || h >= 345) && s < 0.45 && l < 0.42) return 'brown'; // dull dark red-brown (tan shoes in shadow) isn't burgundy
  if ((h < 15 || h >= 340) && l < 0.35) return 'burgundy';
  if (h >= 15 && h < 30 && l < 0.5) return 'rust';
  if (h >= 90 && h < 170 && l < 0.3) return 'forest';
  if (h >= 70 && h < 170 && s < 0.35 && l >= 0.45) return 'sage';
  if (h >= 195 && h < 250 && l > 0.65) return 'light blue';
  return HUES.find(([end]) => h < end)[1];
}

export function hslToHex(h, s, l) {
  const f = n => { const k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l); return Math.round((l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255).toString(16).padStart(2, '0'); };
  return '#' + f(0) + f(8) + f(4);
}

export const hueDist = (a, b) => { const d = Math.abs(a - b) % 360; return Math.min(d, 360 - d); };

const colored = ps => ps.filter(p => !isNeutral(p.color));
const hues = ps => colored(ps).map(p => hexToHsl(p.color).h);
const prints = ps => ps.filter(p => p.patterned).length;
const vibe = (ps, v) => ps.filter(p => [].concat(p.vibe).includes(v)).length; // an item can carry several vibes
const pairs = a => a.flatMap((x, i) => a.slice(i + 1).map(y => [x, y]));

// Best complementary pair: how far (degrees) it is from a perfect 180° split. Infinity if none.
const compOff = hs => Math.min(Infinity, ...pairs(hs).map(([a, b]) => Math.abs(hueDist(a, b) - 180)));

// ---------- proportions ----------
// fit: 0 slim / 1 regular / 2 baggy, named per category. Missing = regular.
export const FITS = { Tops: ['Fitted', 'Regular', 'Oversized'], Layers: ['Fitted', 'Regular', 'Oversized'], Bottoms: ['Slim', 'Straight', 'Baggy'], Shoes: ['Sleek', 'Regular', 'Chunky'], default: ['Slim', 'Regular', 'Baggy'] };
const fit = p => p?.fit ?? 1;

// Silhouette rules: volume should balance top vs bottom, and shoes should carry the weight of the pants.
export function proportion(ps) {
  const get = c => ps.find(p => p.cat === c);
  const top = get('Tops'), layer = get('Layers'), bottom = get('Bottoms'), shoes = get('Shoes');
  const legs = !/short/i.test(bottom.kind || bottom.name); // shorts show the leg, so pant-width rules don't apply
  const up = Math.max(fit(top), layer ? fit(layer) : 0), down = fit(bottom), feet = fit(shoes);
  const notes = [], add = (s, note) => notes.push([s, note]);
  if (layer && fit(layer) < fit(top)) add(-2, 'Slim layer over a baggy top bunches up');
  if (legs && down === 2 && feet === 0) add(-2, 'Sleek shoes get swallowed by wide pants');
  if (legs && down === 0 && feet === 2) add(-1.5, 'Chunky shoes overpower slim pants');
  if (legs && down === 2 && feet === 2) add(1, 'Wide pants anchored by chunky shoes');
  if (down === 0 && feet === 0) add(0.8, 'Slim line carried down to sleek shoes');
  if (up === 2 && down === 0) add(0.8, 'Volume up top, clean and slim below');
  if (up === 0 && down === 2) add(0.8, 'Fitted top balances wide-leg pants');
  if (up === 2 && down === 2) add(feet === 2 ? 0.3 : -1, feet === 2 ? 'Full oversized fit, grounded by chunky shoes' : 'All-baggy needs a chunky shoe to ground it');
  notes.sort((a, b) => Math.abs(b[0]) - Math.abs(a[0]));
  return { score: notes.reduce((t, [s]) => t + s, 0), veto: notes.some(([s]) => s <= -2), note: notes[0]?.[1] ?? 'Balanced, regular proportions', up, down };
}

// ---------- color wheel ----------
export const HARMONIES = {
  complementary: { label: 'Complementary', offsets: [0, 180] },
  formula: { label: '2 + 1 + 1', offsets: [0, 180] },
  analogous: { label: 'Analogous', offsets: [-30, 0, 30] },
  split: { label: 'Split', offsets: [0, 150, 210] },
  triadic: { label: 'Triadic', offsets: [0, 120, 240] },
  square: { label: 'Square', offsets: [0, 90, 180, 270] },
  mono: { label: 'Monochrome', offsets: [0, 0, 0] },
};
export function harmony(h, s, l, key) {
  return HARMONIES[key].offsets.map((o, i) => {
    const ll = key === 'mono' ? Math.min(0.88, Math.max(0.15, l + (i - 1) * 0.22)) : l;
    return { h: (h + o + 360) % 360, s, l: ll, hex: hslToHex((h + o + 360) % 360, s, ll), base: o === 0 && (key !== 'mono' || i === 1) };
  });
}
// Closet pieces that sit on a wheel color (neutrals excluded — they go with everything).
export const nearHue = (items, h, tol = 20) => items.filter(i => !isNeutral(i.color) && hueDist(hexToHsl(i.color).h, h) <= tol);

// Each mode returns a score (higher = better) or null to reject the outfit.
export const MODES = {
  classic: {
    label: 'Classic', blurb: 'Neutral foundation, one accent max, nothing loud.',
    score(ps) {
      const c = colored(ps).length;
      if (c > 1 || prints(ps) > 1 || vibe(ps, 'athletic')) return null;
      const { up, down } = proportion(ps);
      return (up === 2 && down === 2 ? -1.5 : 0) + 3 - c + vibe(ps, 'formal') * 0.5 + vibe(ps, 'casual') * 0.3 - prints(ps) - vibe(ps, 'streetwear') * 0.5;
    },
  },
  street: {
    label: 'Streetwear', blurb: 'Sneakers, layers, one statement piece.',
    score(ps) {
      const shoes = ps.find(p => p.cat === 'Shoes');
      if (vibe(ps, 'formal') || !/sneaker|boot|trainer|dunk|jordan/i.test(`${shoes.name} ${shoes.kind}`)) return null;
      const pr = prints(ps);
      const { up, down } = proportion(ps);
      return (up === 2 || down === 2 ? 0.5 : 0) + vibe(ps, 'streetwear') * 1.5 + vibe(ps, 'athletic') * 0.4 + (ps.some(p => p.cat === 'Layers') ? 0.5 : 0)
        + (ps.some(p => p.cat === 'Accessories') ? 0.4 : 0) + (pr === 1 ? 0.6 : pr > 1 ? -1.5 : 0) - Math.max(0, colored(ps).length - 2);
    },
  },
  formula: {
    label: '2 + 1 + 1', blurb: 'Two neutral bases, one color, plus its complement.',
    score(ps) {
      const hs = hues(ps), off = compOff(hs);
      if (hs.length !== 2 || off > 35 || ps.length - 2 < 2) return null;
      return 3 - off / 35 - prints(ps) * 0.5;
    },
  },
  complementary: {
    label: 'Complementary', blurb: 'Opposites on the color wheel.',
    score(ps) {
      const hs = hues(ps), off = compOff(hs);
      if (hs.length < 2 || off > 30) return null;
      return 2.5 - off / 30 - Math.max(0, hs.length - 3) - (prints(ps) > 1 ? 1.5 : 0);
    },
  },
  analogous: {
    label: 'Analogous', blurb: 'Neighbors on the wheel — smooth and tonal.',
    score(ps) {
      const hs = hues(ps), spread = Math.max(0, ...pairs(hs).map(([a, b]) => hueDist(a, b)));
      if (hs.length < 2 || spread > 50) return null;
      return 2 + hs.length * 0.3 - spread / 50 - (prints(ps) > 1 ? 1.5 : 0);
    },
  },
  triadic: {
    label: 'Triadic', blurb: 'Three colors evenly spaced. Bold.',
    score(ps) {
      const hs = hues(ps);
      if (hs.length < 3) return null;
      const off = Math.min(...pairs(hs).flatMap(([a, b]) => hs.filter(c => c !== a && c !== b)
        .map(c => Math.max(...[[a, b], [b, c], [a, c]].map(([x, y]) => Math.abs(hueDist(x, y) - 120))))));
      if (off > 25) return null;
      return 2.5 - off / 25 - (prints(ps) > 1 ? 1.5 : 0);
    },
  },
  palette: {
    label: 'My palette', blurb: 'Pieces that sit on your color wheel picks.', hidden: true,
    score(ps, { palette = [] }) {
      const hs = hues(ps);
      if (!hs.length || !hs.every(h => palette.some(p => hueDist(h, p) <= 25))) return null;
      return 1 + palette.filter(p => hs.some(h => hueDist(h, p) <= 25)).length - (prints(ps) > 1 ? 1.5 : 0);
    },
  },
  inspo: {
    label: 'Inspo', blurb: 'Your closet in the colors of that pic.', hidden: true,
    // Works for all-neutral inspo too (black/grey/cream fits), which the hue-based palette mode can't.
    score(ps, { inspo = [] }) {
      if (!inspo.length) return null;
      const d = ps.map(p => Math.min(...inspo.map(c => colorDist(p.color, c))));
      if (Math.max(...d) > 110) return null;
      const covered = inspo.filter(c => ps.some(p => colorDist(p.color, c) < 110)).length;
      return 2 + covered * 0.4 - d.reduce((a, b) => a + b, 0) / d.length / 60 - (prints(ps) > 1 ? 1 : 0);
    },
  },
};

// Perceptual-ish RGB distance ("redmean"). 0 = same color, ~765 = black vs white; black vs navy ≈ 80.
export function colorDist(a, b) {
  const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const [r1, g1, b1] = p(a), [r2, g2, b2] = p(b), rm = (r1 + r2) / 2;
  return Math.sqrt((2 + rm / 256) * (r1 - r2) ** 2 + 4 * (g1 - g2) ** 2 + (2 + (255 - rm) / 256) * (b1 - b2) ** 2);
}

// Returns { score, note } or null. Color mode decides if it's allowed; proportions can veto or boost.
export function scoreOutfit(ps, mode, opts = {}) {
  if (vibe(ps, 'formal') && vibe(ps, 'athletic')) return null; // suit + joggers: never
  // A cap or shoes repeating a color from the print up top belongs to that print's palette, so the color rule judges the fit without them.
  const ech = echoes(ps), base = MODES[mode].score(ps, opts) ?? (ech.length ? MODES[mode].score(ps.filter(p => !ech.some(e => e.p === p)), opts) : null);
  if (base == null) return null;
  const pr = proportion(ps);
  if (pr.veto) return null; // one deal-breaker outweighs any number of good points
  const finish = Math.min(2, ps.filter(p => p.cat === 'Accessories').length) * 0.3; // a hat / chain finishes the look
  const e = ech[0], note = e ? `${e.p.name} picks up the ${colorName(e.p.color)} in the ${e.from.name}` : pr.note;
  return { score: base + pr.score + finish + Math.min(2, ech.length) * 0.7, note };
}

// Graphic/print colors: an item's `accents` are the colors in it besides its base color (the red logo on a black tee).
// A hat, bag/chain or shoes in one of those colors (not a neutral — those go with anything) ties the fit together.
export function echoes(ps) {
  const src = ps.filter(p => (p.cat === 'Tops' || p.cat === 'Layers') && p.accents?.length), out = [];
  for (const p of ps) {
    if ((p.cat !== 'Accessories' && p.cat !== 'Shoes') || isNeutral(p.color)) continue;
    const from = src.find(s => s.accents.some(a => !isNeutral(a) && sameHue(a, p.color))); // a grey wash or white text isn't a color to pick up
    if (from) out.push({ p, from });
  }
  return out;
}

// Close in color AND in hue: in dark colors the RGB distance alone calls brown and forest green "the same".
const sameHue = (a, b) => { const x = hexToHsl(a), y = hexToHsl(b); return colorDist(a, b) < 80 && x.s >= 0.25 && y.s >= 0.25 && hueDist(x.h, y.h) <= 25; };

// Base color + up to 3 accents from a piece's colors ([{hex, share}], biggest first): far enough from the base and from each other.
export function accentsOf(palette, base, min = 0.03) {
  const out = [];
  for (const c of palette) if (c.share >= min && colorDist(c.hex, base) > 90 && out.every(a => colorDist(a, c.hex) > 70)) out.push(c.hex);
  return out.slice(0, 3);
}

// Accessories split into two slots so a fit can carry a hat AND a chain or bag.
export const isHat = p => p.cat === 'Accessories' && /cap|hat|beanie|fitted|bucket/i.test(`${p.name} ${p.kind}`);
export const SLOTS = {
  Tops: p => p.cat === 'Tops', Layers: p => p.cat === 'Layers', Bottoms: p => p.cat === 'Bottoms', Shoes: p => p.cat === 'Shoes',
  Hat: isHat, Accessory: p => p.cat === 'Accessories' && !isHat(p),
};
export const slotOf = p => Object.keys(SLOTS).find(k => SLOTS[k](p));

// Flat-lay boxes for a 100 × 125 card: { slot: [left%, top%, width%, height%] }. Boxes never overlap and are sized to
// rough real-world scale (~0.62 units per cm; hat/extras/shoes ×1.25 so they still read), so a cap can't come out tee-sized.
// Clothes stack on the left; hat, extras and shoes share the right column, spaced evenly whatever is missing.
const SIDE = { Hat: [24, 17], Accessory: [26, 26], Shoes: [28, 22] };
export function flatLayout(slots) {
  const layer = slots.includes('Layers'), box = {};
  if (layer) { box.Layers = [4, 4, 43, 46]; box.Tops = [53, 6, 40, 44]; } else box.Tops = [6, 5, 44, 47];
  box.Bottoms = layer ? [8, 56, 36, 65] : [10, 56, 36, 65];
  const side = Object.keys(SIDE).filter(s => slots.includes(s)), col = layer ? [50, 54, 46, 68] : [55, 5, 41, 116];
  const f = Math.min(1, (col[3] - 4 * (side.length - 1)) / side.reduce((t, s) => t + SIDE[s][1], 0)); // shrink only if they can't fit
  const gap = (col[3] - side.reduce((t, s) => t + SIDE[s][1] * f, 0)) / (side.length + 1);
  let y = col[1] + gap;
  for (const s of side) { const [w, h] = SIDE[s].map(v => v * f); box[s] = [col[0] + (col[2] - w) / 2, y, w, h]; y += h + gap; }
  return Object.fromEntries(Object.entries(box).filter(([s]) => slots.includes(s)).map(([s, [x, y, w, h]]) => [s, [x, y / 1.25, w, h / 1.25].map(v => +v.toFixed(2))]));
}

// Builder: try every piece that fits `slot` in the current outfit, best first. score null = breaks every style rule.
export function rankSwaps(items, outfit, slot, modes = Object.keys(MODES).filter(k => !MODES[k].hidden)) {
  const rest = outfit.filter(p => !SLOTS[slot](p));
  return items.filter(SLOTS[slot]).map(item => {
    const ps = [...rest, item];
    let best = null;
    if (['Tops', 'Bottoms', 'Shoes'].every(c => ps.some(p => p.cat === c)))
      for (const m of modes) { const r = scoreOutfit(ps, m); if (r && (!best || r.score > best.score)) best = { ...r, mode: m }; }
    return { item, score: best?.score ?? null, mode: best?.mode, note: best?.note };
  }).sort((a, b) => (b.score ?? -99) - (a.score ?? -99));
}

// Best style for a whole outfit (builder header). null = no style rule accepts it.
export function bestMode(ps, modes = Object.keys(MODES).filter(k => !MODES[k].hidden)) {
  if (!['Tops', 'Bottoms', 'Shoes'].every(c => ps.some(p => p.cat === c))) return null;
  let best = null;
  for (const m of modes) { const r = scoreOutfit(ps, m); if (r && (!best || r.score > best.score)) best = { ...r, mode: m }; }
  return best ?? { score: null, note: proportion(ps).veto ? proportion(ps).note : 'Colors clash under every style rule' };
}

// k-means on [r,g,b] samples → the main colors (share ≥ min), biggest first. Seeds spread by brightness so it's deterministic.
export function extractPalette(px, k = 5, min = 0.06) {
  if (!px.length) return [];
  const sorted = [...px].sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));
  let cs = Array.from({ length: k }, (_, i) => sorted[Math.floor((i + 0.5) * sorted.length / k)]), counts = [];
  for (let it = 0; it < 12; it++) {
    const sum = cs.map(() => [0, 0, 0, 0]);
    for (const p of px) {
      let bi = 0, bd = Infinity;
      cs.forEach((c, i) => { const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2; if (d < bd) { bd = d; bi = i; } });
      const s = sum[bi]; s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; s[3]++;
    }
    cs = sum.map((s, i) => s[3] ? [s[0] / s[3], s[1] / s[3], s[2] / s[3]] : cs[i]);
    counts = sum.map(s => s[3]);
  }
  const hex = c => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
  const out = [];
  cs.map((c, i) => ({ hex: hex(c), share: counts[i] / px.length })).sort((a, b) => b.share - a.share)
    .forEach(c => { const twin = out.find(o => colorDist(o.hex, c.hex) < 45); if (twin) twin.share += c.share; else out.push(c); }); // merge near-duplicates
  return out.filter(c => c.share >= min);
}

// ponytail: random sampling, not exhaustive search. Fine for a few hundred items; enumerate if results get repetitive.
export function generate(items, mode, { anchor, palette, inspo, n = 12, tries = 1500, rand = Math.random } = {}) {
  const by = Object.fromEntries(Object.keys(SLOTS).map(s => [s, items.filter(SLOTS[s])]));
  if (anchor) by[slotOf(anchor)] = [anchor];
  if (!by.Tops.length || !by.Bottoms.length || !by.Shoes.length) return [];
  const pick = a => a[Math.floor(rand() * a.length)], opts = { palette, inspo };
  const seen = new Map(), blocked = new Map();
  for (let t = 0; t < tries; t++) {
    const ps = [pick(by.Tops), pick(by.Bottoms), pick(by.Shoes)];
    const add = (slot, odds) => { if (by[slot].length && (anchor && slotOf(anchor) === slot || rand() < odds)) ps.push(pick(by[slot])); };
    add('Layers', 0.5); add('Hat', 0.8); add('Accessory', 0.5); // hats + chains/bags in most fits, not all
    const key = ps.map(p => p.id).sort().join();
    if (seen.has(key)) continue;
    const r = scoreOutfit(ps, mode, opts);
    if (r) seen.set(key, { key, items: ps, note: r.note, score: r.score + rand() * 0.3 });
    else if (MODES[mode].score(ps, opts) != null) { // color rule passed, so the shape is what blocked it
      const pr = proportion(ps); if (pr.veto) blocked.set(pr.note, (blocked.get(pr.note) ?? 0) + 1);
    }
  }
  // Greedy pick with a reuse penalty, so one great pair of cargos doesn't star in every idea.
  const left = [...seen.values()], used = new Map(), out = [];
  const cap = Math.max(2, Math.ceil(n / 4)); // no piece in more than ~a quarter of the ideas (the same cap + chain in every fit)
  const reuse = o => o.items.reduce((t, p) => { const u = used.get(p.id) ?? 0; return t + u + (u >= cap ? 5 : 0); }, 0);
  while (out.length < n && left.length) {
    let bi = 0;
    for (let i = 1; i < left.length; i++) if (left[i].score - 0.45 * reuse(left[i]) > left[bi].score - 0.45 * reuse(left[bi])) bi = i;
    const o = left.splice(bi, 1)[0]; out.push(o);
    for (const p of o.items) used.set(p.id, (used.get(p.id) ?? 0) + 1);
  }
  out.blocked = [...blocked].sort((a, b) => b[1] - a[1])[0]?.[0]; // most common deal-breaker, to explain empty results
  return out;
}

// ---------- wardrobe gaps ----------
// Try a "ghost" piece for every category × color × fit and count the outfits it would unlock.
const GAP_KIND = { Tops: 'tee', Layers: 'jacket', Bottoms: 'pants', Shoes: 'sneakers', Accessories: 'cap' };
const GAP_FIT = { Tops: ['Fitted', '', 'Oversized'], Layers: ['Fitted', '', 'Oversized'], Bottoms: ['Slim', 'Straight', 'Wide'], Shoes: ['Sleek', '', 'Chunky'], Accessories: ['', '', ''] };
// Wearable palette — neutrals plus the muted "statement" colors people actually buy. No neon cyan pants.
// black, white, grey, navy, beige, camel, brown, olive, slate · burgundy, rust, forest, sage
const GAP_COLORS = ['#151515', '#f4f4f4', '#8c8c8c', '#1c2541', '#d8c3a0', '#b08a5a', '#4a3426', '#5b5f3a', '#4a5d78', '#6d2232', '#9a4a2a', '#2f4a36', '#889f6e'];
const GAP_MODES = ['classic', 'street', 'formula', 'complementary', 'analogous'];

const seeded = () => { let seed = 1; return () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32; };

// How many outfits would this (not-yet-owned) piece make with the closet? rank: an outfit that works in 3 styles counts 3×.
export function tryPiece(items, piece, { tries = 150, rand = seeded() } = {}) {
  const ghost = { kind: GAP_KIND[piece.cat], vibe: 'casual', patterned: false, fit: 1, ...piece, ghost: true };
  const found = new Map(); let rank = 0;
  for (const mode of GAP_MODES) for (const o of generate([...items, ghost], mode, { anchor: ghost, n: 99, tries, rand })) {
    rank += 1 + o.score * 0.05;
    if (!found.has(o.key)) found.set(o.key, { ...o, mode });
  }
  return { ghost, rank, count: found.size, modes: [...new Set([...found.values()].map(o => o.mode))], examples: [...found.values()].sort((a, b) => b.score - a.score).slice(0, 3) };
}

// ponytail: sampled with a fixed seed (stable between renders), so counts are estimates. ~220 ghosts × 5 styles.
export function gaps(items) {
  const rand = seeded(), out = [];
  // Only suggest cuts you already wear in that category (all baggy pants → no slim pants). Nothing owned yet → any cut.
  const fitsFor = cat => { const own = [...new Set(items.filter(i => i.cat === cat).map(fit))]; return cat === 'Accessories' ? [1] : own.length ? own : [0, 1, 2]; };
  for (const cat of CATS) for (const color of GAP_COLORS) for (const f of fitsFor(cat)) {
    const cname = colorName(color);
    if (items.some(i => i.cat === cat && fit(i) === f && colorName(i.color) === cname)) continue; // already own it
    const name = [GAP_FIT[cat][f], cname, GAP_KIND[cat]].filter(Boolean).join(' ');
    const r = tryPiece(items, { id: `ghost:${cat}:${color}:${f}`, cat, color, fit: f, name: name[0].toUpperCase() + name.slice(1) }, { rand });
    if (r.count) out.push(r);
  }
  return out.sort((a, b) => b.rank - a.rank);
}

// ---------- shop the look: your closest piece to one read off an inspo photo ----------
// Same slot, nearest color (a matching fit counts like a slightly closer color). null = you don't own anything close.
export function closestOwned(items, ghost, max = 70) {
  const slot = slotOf(ghost); if (!slot) return null;
  return items.filter(SLOTS[slot]).map(p => [p, colorDist(p.color, ghost.color) - (ghost.fit != null && p.fit === ghost.fit ? 10 : 0)])
    .filter(([, d]) => d < max).sort((a, b) => a[1] - b[1])[0]?.[0] ?? null;
}

// ---------- trip packing: `days` outfits from as few pieces as possible ----------
// Greedy: each day takes the fit that adds the fewest new pieces; a top worn again costs a bit, so tops rotate while pants and shoes repeat.
export function packTrip(items, days, { modes = ['classic', 'street', 'formula', 'analogous'], rand } = {}) {
  const cands = new Map();
  for (const m of modes) for (const o of generate(items, m, { n: 300, tries: 1500, rand })) if ((cands.get(o.key)?.score ?? -99) < o.score) cands.set(o.key, { ...o, mode: m });
  const left = [...cands.values()], fits = [], have = new Set(), worn = new Map();
  const cost = o => o.items.reduce((t, p) => t + (have.has(p.id) ? 0 : 1) + (p.cat === 'Tops' ? (worn.get(p.id) ?? 0) * 0.8 : 0), 0) - o.score * 0.25;
  while (fits.length < days && left.length) {
    let bi = 0; for (let i = 1; i < left.length; i++) if (cost(left[i]) < cost(left[bi])) bi = i;
    const o = left.splice(bi, 1)[0]; fits.push(o);
    for (const p of o.items) { have.add(p.id); if (p.cat === 'Tops') worn.set(p.id, (worn.get(p.id) ?? 0) + 1); }
  }
  for (let i = 0; fits.length && fits.length < days; i++) fits.push(fits[i]); // more days than combos: wear them again
  return { fits, pieces: items.filter(p => have.has(p.id)) };
}
