// Color + outfit matching. Pure functions, no DOM — tested by match.test.mjs.
import { ALIAS, COMBOS, JEANS, TROUSERS, CAMO, METAL } from './style.js';
export const CATS = ['Tops', 'Layers', 'Bottoms', 'Shoes', 'Accessories'];

export function hexToHsl(hex) {
  if (!/^#[0-9a-f]{6}$/i.test(hex ?? '')) return { h: 0, s: 0, l: 0.5 }; // a missing color reads as grey instead of crashing the screen
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  if (!d) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: h * 60, s, l };
}

// ponytail: hand-tuned "fashion neutral" ranges (navy, denim, khaki, olive count as neutral). Tweak here if items misread.
export function isNeutral(hex) { const m = isNeutral.memo ??= new Map(); let v = m.get(hex); if (v === undefined) m.set(hex, v = neutralRaw(hex)); return v; } // called thousands of times per Today
function neutralRaw(hex) {
  const { h, s, l } = hexToHsl(hex);
  return s < 0.18 || l < 0.13 || l > 0.9 || (l < 0.25 && s < 0.25) // last one: near-black, named black by colorName
    || (h >= 15 && h <= 50 && s < 0.5 && l < 0.85)      // tan, beige, brown, khaki
    || (h >= 190 && h <= 250 && (l < 0.3 || s < 0.45))  // navy, denim
    || (h >= 50 && h <= 100 && s < 0.35 && l < 0.45)    // olive
    || NEUTRAL_NAMES.has(colorName(hex));               // anything named beige, brown, camel, olive, navy, denim, grey, black or white is neutral, full stop
}
const NEUTRAL_NAMES = new Set(['black', 'grey', 'light grey', 'white', 'navy', 'denim', 'beige', 'camel', 'brown', 'olive']); // a pale beige zip or red-brown loafers were "colors" before

// Hue bands as people name clothes: a blue-ish green jacket is green, not cyan.
const HUES = [[15, 'red'], [40, 'orange'], [65, 'yellow'], [85, 'lime'], [172, 'green'], [195, 'teal'], [250, 'blue'], [290, 'purple'], [325, 'magenta'], [345, 'pink'], [361, 'red']];
// What you can pick in the item sheet. Each one reads back as its own name (match.test.mjs checks).
export const SWATCHES = { black: '#1b1a19', grey: '#7d7b78', 'light grey': '#b9b7b3', white: '#f6f5f1', navy: '#1e2a45', denim: '#4d6a8c', 'light blue': '#9cc3e6', blue: '#2f5fb5', teal: '#2a8085', green: '#3f7a52', forest: '#22402c', olive: '#5c5b33', sage: '#8aa877', beige: '#d8c7a6', camel: '#b2874e', brown: '#5b3e2a', rust: '#a8522b', orange: '#e2782c', yellow: '#e9c548', red: '#c0392b', burgundy: '#6b1e2a', pink: '#e9a2b9', purple: '#6c4a90' };
export function colorName(hex) {
  const { h, s, l } = hexToHsl(hex);
  if (l < 0.13) return h >= 200 && h <= 250 && s >= 0.4 && l >= 0.09 ? 'navy' : 'black'; // a very dark but clearly blue polo is navy
  if (l < 0.25 && s < 0.25) { // dark and muted: a washed black tee is black (s ≈ 0.02), but dark olive or brown trousers keep their color
    if (s >= 0.1 && h >= 5 && h < 100) return h >= 45 ? "olive" : s >= 0.15 || l >= 0.2 ? "brown" : "black"; // a black hoodie in warm room light reads #322b28: barely warm is still black
    if (s >= 0.12 && h >= 100 && h < 170) return 'forest';
    return 'black';
  }
  if (l > 0.9) return 'white';
  // warm, barely-colored: olive cargos and cream pants photograph almost grey, but they're olive and cream (true greys sit near s 0.02)
  if (s >= 0.07 && s < 0.18 && h >= 30 && h <= 65 && l > 0.2 && l < 0.85) return l >= 0.55 ? 'beige' : h >= 40 ? 'olive' : 'brown';
  if (s >= 0.09 && s < 0.18 && h >= 10 && h < 30 && l > 0.2 && l < 0.85) return l >= 0.55 ? 'beige' : 'brown'; // a muted brown (mocha hoodie, suede) photographs nearly grey; true greys sit under s 0.05
  if (s < 0.1 && l > 0.75) return 'white'; // white clothes shot on the floor come out l 0.77-0.83: 9 of 11 whites in the haul read light grey before
  if (s < 0.18) return l > 0.6 ? 'light grey' : 'grey';
  if (h >= 190 && h <= 250 && l < 0.3) return s >= 0.28 ? 'navy' : 'black'; // a black tee shot in cool light reads blue-ish, not navy
  if (h >= 190 && h <= 250 && s < 0.45) return 'denim';
  if (h >= 15 && h <= 50 && s < 0.5) return l > 0.6 ? 'beige' : l > 0.42 ? 'camel' : 'brown';
  if (h >= 50 && h <= 100 && s < 0.35 && l < 0.45) return 'olive';
  if ((h < 15 || h >= 345) && s < 0.45 && l < 0.42) return 'brown'; // dull dark red-brown (tan shoes in shadow) isn't burgundy
  if ((h < 15 || h >= 340) && l < 0.35) return 'burgundy';
  if (h >= 15 && h < 30 && l < 0.5 && s < 0.75) return 'rust'; // a bright orange cap (s 0.87) is orange, not rust
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

const colored = ps => ps.filter(p => !isNeutral(p.color) && !isDenim(p)); // jeans in any wash, even light blue, go with everything
const hues = ps => colored(ps).map(p => hexToHsl(p.color).h);
// Prints that compete: a big graphic or an all-over pattern. A small chest logo doesn't count, and neither does a plain piece.
// p.pattern: 'solid' | 'logo' | 'graphic' | 'allover'; older pieces only have p.patterned (true = graphic).
// Your tag wins. Untagged: the name says it ("Camo sweats", "Aztec jacket", "Flannel shirt"); side stripes on joggers aren't an all-over pattern.
const ALLOVER = /camo|plaid|flannel|tartan|striped|stripes\b|check(ed)?\b|gingham|houndstooth|paisley|floral|leopard|cheetah|zebra|snake|tie.?dye|polka|argyle|fair ?isle|aztec|ikat/i;
export const patternOf = p => p.pattern ?? (ALLOVER.test(`${p.name ?? ''} ${p.kind ?? ''}`) ? 'allover' : p.patterned ? 'graphic' : 'solid');
// Prints are a clothes thing: a swoosh on a sneaker or a logo strap on a bag is detail, not a second print fighting the tee.
export const PRINTABLE = ['Tops', 'Layers', 'Bottoms'];
const printed = ps => ps.filter(p => PRINTABLE.includes(p.cat) && (patternOf(p) === 'graphic' || patternOf(p) === 'allover'));
// Two prints can work (2026-11-18 pattern reels): one has to read as a quiet, "neutral" print (camo, stripes, check, plaid, animal,
// polka dot) so the eye knows which to look at first, and the two share a color. Never three. It still scores a bit lower, so it's rare.
const QUIET_PRINT = /camo|stripe|check|gingham|houndstooth|plaid|flannel|leopard|cheetah|animal|polka|\bdots?\b/i;
const swatchesOf = p => [p.color, ...(p.accents ?? [])].filter(Boolean);
// Graphics layered on graphics are fine (a graphic tee under a graphic hoodie): only all-over patterns worn together are limited.
const patterns = ps => ps.filter(p => PRINTABLE.includes(p.cat) && patternOf(p) === 'allover');
const quietPrint = p => { const t = `${p.kind ?? ''} ${p.name ?? ''} ${[].concat(p.tags ?? []).join(' ')}`; // a red buffalo plaid is loud, a grey one is quiet
  return QUIET_PRINT.test(t) && !(/plaid|flannel|check|gingham|tartan/i.test(t) && !isNeutral(p.color) && hexToHsl(p.color).s > 0.45); };
const BW = ['black', 'white'];
export const printPair = ps => { const pr = patterns(ps); if (pr.length !== 2 || !pr.some(quietPrint)) return false;
  const bwPair = pr.every(p => BW.includes(colorName(p.color))); // nearly every print has some black or white in it: that only ties two black-and-white pieces
  return swatchesOf(pr[0]).some(a => swatchesOf(pr[1]).some(b => (colorDist(a, b) < 28 || colorName(a) === colorName(b)) && (bwPair || !BW.includes(colorName(a))))); };
// How many loud things the style rules see: all your graphics count as one, a pattern pair that works counts as one, two loud patterns count as two.
const prints = ps => { const pats = patterns(ps).length; return Math.max(ps.some(p => PRINTABLE.includes(p.cat) && patternOf(p) === 'graphic') ? 1 : 0, pats === 2 && printPair(ps) ? 1 : pats); };
const vibe = (ps, v) => ps.filter(p => [].concat(p.vibe).includes(v)).length; // an item can carry several vibes
const mainVibe = (ps, v) => ps.filter(p => [].concat(p.vibe ?? [])[0] === v).length; // only the main vibe can rule a look out: "also works as" tags only add
const pairs = a => a.flatMap((x, i) => a.slice(i + 1).map(y => [x, y]));

// Best complementary pair: how far (degrees) it is from a perfect 180° split. Infinity if none.
const compOff = hs => Math.min(Infinity, ...pairs(hs).map(([a, b]) => Math.abs(hueDist(a, b) - 180)));

// ---------- proportions ----------
// fit: 0 slim / 1 regular / 2 baggy, named per category. Missing = regular. 3 = cropped (tops and layers): regular width, short length.
// Index = stored fit value. 0/1/2 drive the proportion rules (slim/regular/wide); 3 and 4 are named variants that score like 1.
export const FITS = { Tops: ['Fitted', 'Regular', 'Oversized', 'Cropped', 'Boxy', 'Relaxed'], Layers: ['Fitted', 'Regular', 'Oversized', 'Cropped', 'Boxy', 'Relaxed'], Bottoms: ['Slim', 'Straight', 'Wide / baggy', 'Relaxed (loose straight)', 'Flared'],
  Shoes: ['Sleek (low profile)', 'Regular', 'Chunky (thick sole)'], default: ['Slim', 'Regular', 'Baggy'] };
export const FIT_ORDER = { Bottoms: [0, 1, 3, 2, 4], Tops: [0, 1, 5, 2, 4, 3], Layers: [0, 1, 5, 2, 4, 3] }; // how the picker lists them: slim → wide, then the special cuts
// Rule value: cropped / relaxed / flared score like regular; boxy tops score like oversized (wide).
const fit = p => { const f = p?.fit ?? 1; return f === 3 || f === 5 ? 1 : f === 4 ? (p.cat === 'Tops' || p.cat === 'Layers' ? 2 : 1) : f; };
const cropped = p => p?.fit === 3 && (p.cat === 'Tops' || p.cat === 'Layers');

// Layering ladder (style notes): tank < tee/polo/shirt < knit/hoodie < jacket/overshirt < coat. Order matters: "flannel overshirt" is a jacket, not a shirt.
const LEVELS = [[/coat|puffer|parka|trench/i, 4], [/jacket|blazer|overshirt|flannel|vest|bomber|windbreaker|cardigan/i, 3], [/sweater|hoodie|knit|crewneck|sweatshirt|zip/i, 2], [/tank/i, 0]];
export const level = p => LEVELS.find(([re]) => re.test(`${p.kind ?? ''} ${p.name ?? ''}`))?.[1] ?? (p.cat === 'Layers' ? 3 : 1);

// Silhouette rules: volume should balance top vs bottom, and shoes should carry the weight of the pants.
// Works on half-built outfits too (the builder ranks picks before you have all three): a rule only fires when its pieces are there.
export function proportion(ps) {
  const get = c => ps.find(p => p.cat === c);
  const top = get('Tops'), layer = get('Layers'), bottom = get('Bottoms'), shoes = get('Shoes');
  const legs = !!bottom && !/short/i.test(bottom.kind || bottom.name); // shorts show the leg, so pant-width rules don't apply
  const shoeFit = p => knownFit(p) ?? (/sneaker|trainer|court|superstar|skate/i.test(`${p.kind ?? ''} ${p.name ?? ''}`) ? Math.max(1, fit(p)) : fit(p)); // the AI calls lots of sneakers sleek; Vans and court shoes are regular
  const up = top || layer ? Math.max(top ? fit(top) : 0, layer ? fit(layer) : 0) : null, down = bottom ? fit(bottom) : null, feet = shoes ? shoeFit(shoes) : null;
  const notes = [], add = (s, note) => notes.push([s, note]);
  if (layer && top && level(layer) < level(top)) add(-2, `A ${layer.kind || 'layer'} doesn't go over a ${top.kind || 'heavier top'}`);
  if (layer && top && level(layer) === level(top) && level(top) >= 2) add(-2, level(top) === 2 ? 'Two knits or hoodies stacked is too bulky' : 'Two jackets at once, drop one');
  if (legs && down === 2 && feet === 0) add(-1, 'Sleek shoes can get lost under wide pants'); // a nudge, not a ban: loafers with wide trousers is a real look
  if (legs && down === 0 && feet === 2) add(-1.5, 'Chunky shoes overpower slim pants');
  if (legs && down === 2 && feet === 2) add(1, 'Wide pants anchored by chunky shoes');
  if (down === 0 && feet === 0) add(0.8, 'Slim line carried down to sleek shoes');
  if (up === 2 && down === 0) add(0.8, 'Volume up top, clean and slim below');
  if (up === 0 && down === 2) add(0.8, 'Fitted top balances wide-leg pants');
  if (cropped(top) && !layer && down >= 1) add(0.8, down === 2 ? 'Cropped top shows off wide-leg pants' : 'Cropped top keeps the legs looking long');
  if (up === 2 && down === 2 && feet != null) add(feet === 2 ? 0.3 : -1, feet === 2 ? 'Full oversized fit, grounded by chunky shoes' : 'All-baggy needs a chunky shoe to ground it');
  notes.sort((a, b) => Math.abs(b[0]) - Math.abs(a[0]));
  return { score: notes.reduce((t, [s]) => t + s, 0), veto: notes.some(([s]) => s <= -2), note: notes[0]?.[1] ?? 'Balanced, regular proportions', up, down, list: notes };
}

// ---------- color wheel ----------
export const HARMONIES = {
  complementary: { label: 'Opposites', offsets: [0, 180] },
  formula: { label: 'Color pop', offsets: [0, 180] },
  analogous: { label: 'Tonal', offsets: [-30, 0, 30] },
  split: { label: 'Split', offsets: [0, 150, 210] },
  triadic: { label: 'Bold trio', offsets: [0, 120, 240] },
  square: { label: 'Four-way', offsets: [0, 90, 180, 270] },
  mono: { label: 'One color', offsets: [0, 0, 0] },
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
      if (c > 1 || prints(ps) > 1 || mainVibe(ps.filter(p => ['Tops', 'Layers', 'Bottoms'].includes(p.cat)), 'athletic')) return null; // gym clothes, not a cap or sneakers
      const { up, down } = proportion(ps);
      return (up === 2 && down === 2 ? -1.5 : 0) + 3 - c + vibe(ps, 'formal') * 0.5 + vibe(ps, 'casual') * 0.3 - prints(ps) - vibe(ps, 'streetwear') * 0.5;
    },
  },
  combos: {
    label: 'Combos', blurb: 'Color combos from your style notes.',
    score(ps) {
      const c = combo(ps);
      if (!c || prints(ps) > 1) return null;
      const ok = new Set([...c.slots.flat(), ...ACHRO]);
      if (names(ps).some(n => !ok.has(n))) return null; // every other piece stays black, white or grey
      return 2.2 + c.slots.length * 0.3;
    },
  },
  street: {
    label: 'Streetwear', blurb: 'Sneakers, layers, one statement piece.',
    score(ps) {
      const shoes = ps.find(p => p.cat === 'Shoes');
      if (mainVibe(ps, 'formal') || shoes && !/sneaker|boot|trainer|dunk|jordan/i.test(`${shoes.name} ${shoes.kind}`)) return null;
      if (colored(ps.filter(p => p.cat !== 'Accessories')).length >= 3) return null; // three bold colors in the clothes is a costume, not a statement (a red cap is fine)
      const pr = prints(ps);
      const { up, down } = proportion(ps);
      return (up === 2 || down === 2 ? 0.5 : 0) + vibe(ps, 'streetwear') * 1.5 + vibe(ps, 'athletic') * 0.4 + (ps.some(p => p.cat === 'Layers') ? 0.5 : 0)
        + (ps.some(p => p.cat === 'Accessories') ? 0.4 : 0) + (pr === 1 ? 0.6 : pr > 1 ? -1.5 : 0) - Math.max(0, colored(ps).length - 2);
    },
  },
  formula: {
    label: 'Color pop', blurb: 'Two neutral basics, one color, plus its opposite.',
    score(ps) {
      const hs = hues(ps), off = compOff(hs);
      if (hs.length !== 2 || off > 35 || ps.length - 2 < 2) return null;
      return 3 - off / 35 - prints(ps) * 0.5;
    },
  },
  complementary: {
    label: 'Opposites', blurb: 'Two colors from opposite sides of the color wheel.',
    score(ps) {
      const hs = hues(ps), off = compOff(hs);
      if (hs.length < 2 || off > 30) return null;
      return 2.5 - off / 30 - Math.max(0, hs.length - 3) - (prints(ps) > 1 ? 1.5 : 0);
    },
  },
  analogous: {
    label: 'Tonal', blurb: 'Colors that sit next to each other. Smooth and easy.',
    score(ps) {
      const hs = hues(ps), spread = Math.max(0, ...pairs(hs).map(([a, b]) => hueDist(a, b)));
      if (hs.length < 2 || spread > 50) return null;
      return 2 + hs.length * 0.3 - spread / 50 - (prints(ps) > 1 ? 1.5 : 0);
    },
  },
  triadic: {
    label: 'Bold trio', blurb: 'Three colors spread evenly around the wheel. Loud.',
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

// ---------- your style notes (style.js) ----------
const alt = w => (ALIAS[w.trim()] ?? w.trim()).split('|');
const BOOK = COMBOS.map(c => { const [cs, label] = c.split(':'); return { text: cs.trim(), label: label.trim(), slots: cs.split('+').map(alt) }; });
const CLOTHES = ['Tops', 'Layers', 'Bottoms', 'Shoes'], ACHRO = ['black', 'white', 'grey', 'light grey'];
const names = ps => ps.filter(p => CLOTHES.includes(p.cat)).map(p => colorName(p.color));
// Each slot needs its own piece (navy + navy combo can't be met by one navy tee).
const fits = (slots, ns, used = []) => !slots.length || ns.some((n, i) => !used.includes(i) && slots[0].includes(n) && fits(slots.slice(1), ns, [...used, i]));
// Biggest combo from the book this outfit wears. One-color combos = top, bottoms (and layer) all that color; shoes don't count.
export function combo(ps) {
  const ns = names(ps), body = ps.filter(p => CLOTHES.includes(p.cat) && p.cat !== 'Shoes').map(p => colorName(p.color));
  const loud = colored(ps.filter(p => CLOTHES.includes(p.cat))).map(p => colorName(p.color)); // a combo has to explain every real color you wear
  let best = null, top = 0;
  for (const c of BOOK) {
    if (!loud.every(n => c.slots.some(sl => sl.includes(n)))) continue;
    if (!(c.slots.length === 1 ? body.length >= 2 && body.every(n => c.slots[0].includes(n)) : fits(c.slots, ns))) continue;
    // head-to-toe one color is the whole statement; ties go to the combo worn on the body, then to exact color words (grey over "taupe")
    const r = (c.slots.length === 1 ? 2.6 : c.slots.length + (fits(c.slots, body) ? 0.5 : 0)) - c.slots.flat().length * 0.01 + c.slots.filter(sl => ns.includes(sl[0])).length * 0.005; // ties go to the combo worn on the body, not the one leaning on white sneakers
    if (r > top) { best = c; top = r; }
  }
  return best;
}
export const isDenim = p => /jean|denim|jort/i.test(`${p.kind ?? ''} ${p.name ?? ''}`);
const WASH = ({ s, l }) => l > 0.85 ? 0 : l > 0.6 ? 1 : l > 0.4 ? 2 : l > 0.22 ? 3 : s < 0.15 ? 5 : 4; // white, light, mid, dark, raw, black
const cap = s => s[0].toUpperCase() + s.slice(1);
// ---------- dressiness: 0 sporty/lounge, 1 everyday, 2 dressy. From the type and name; p.dress overrides. ----------
const DRESS = [[/blazer|suit|dress shirt|oxford|derby|loafer|slacks|trouser|pleated|chelsea|trench|overcoat|button|polo|sweater|knit|cardigan|chino|turtleneck|\bcoat\b/i, 2],
  [/hoodie|sweat|jogger|track|tank|jersey|basketball|gym|slide|slipper|sandal|flip|foam|runner|athletic|compression/i, 0]];
export const dress = p => p.dress ?? DRESS.find(([re]) => re.test(`${p.kind ?? ''} ${p.name ?? ''}`))?.[1] ?? ({ formal: 2, athletic: 0 }[[].concat(p.vibe ?? [])[0]] ?? 1);
export const MATERIALS = ['cotton', 'denim', 'leather', 'suede', 'knit', 'wool', 'linen', 'nylon', 'fleece', 'corduroy', 'silk'];
const TEXTURED = ['denim', 'leather', 'suede', 'knit', 'wool', 'corduroy', 'linen'];
const material = p => p.material ?? (isDenim(p) ? 'denim' : null);
// Rough share of the outfit each piece covers, for the 60/30/10 color rule. A top under a layer mostly hides.
const AREA = { Layers: 0.35, Tops: 0.3, Bottoms: 0.35, Shoes: 0.1, Accessories: 0.05 };

// Small nudges from the notes: [score, note] list, strongest first.
export function style(ps) {
  const out = [], c = combo(ps), b = ps.find(p => p.cat === 'Bottoms');
  const cl = ps.filter(p => CLOTHES.includes(p.cat)), top = ps.find(p => p.cat === 'Tops'), layer = ps.find(p => p.cat === 'Layers'), shoes = ps.find(p => p.cat === 'Shoes');
  // dressy vs sporty: one odd piece is tension (button-up with track pants); several on each side just clash
  const lv = cl.map(dress), hi = lv.filter(v => v === 2).length, lo = lv.filter(v => v === 0).length;
  if (cl.length >= 3 && hi && lo) out.push(hi === 1 || lo === 1 ? [0.3, hi === 1 ? 'One dressy piece makes it interesting' : 'One sporty piece keeps it relaxed'] : [-1, 'Too many dressy and sporty pieces fighting']);
  if (top && dress(top) === 2 && shoes && dress(shoes) === 2) out.push([0.5, `${cap(top.kind || 'dressy top')} with ${shoes.kind || 'dress shoes'}, same polish`]);
  if (top && dress(top) === 2 && layer && dress(layer) === 2) out.push([0.4, `A sharp ${layer.kind || 'layer'} over a dressy top`]);
  // textures: two different materials add depth; leather on leather is a lot
  const mats = [...new Set(cl.map(material).filter(Boolean))];
  const PAIRS = [[['suede', 'denim'], 'Suede and denim, casual sophistication'], [['corduroy', 'wool'], 'Corduroy and wool, relaxed heritage'], [['nylon', 'cotton'], 'Nylon and cotton, technical ease'],
    [['leather', 'cotton'], 'Leather against matte cotton, bold restraint'], [['leather', 'knit'], 'Leather against a matte knit, bold restraint'], [['leather', 'wool'], 'Leather against matte wool, bold restraint']]; // @erikxei textures
  const pair = PAIRS.find(([[a, b]]) => mats.includes(a) && mats.includes(b));
  if (pair) out.push([0.4, pair[1]]); else if (mats.length >= 2 && mats.some(m => TEXTURED.includes(m))) out.push([0.3, `${cap(mats[0])} with ${mats[1]}, texture mix`]);
  if (cl.filter(p => material(p) === 'leather').length >= 2) out.push([-0.4, 'Leather on leather is a lot']);
  // 60/30/10: one color leads; two loud colors at the same size fight
  if (cl.length >= 3) {
    const share = {}, tot = ps.reduce((t, p) => t + (p.cat === 'Tops' && layer ? 0.12 : AREA[p.cat] ?? 0), 0);
    for (const p of colored(ps)) { const n = colorName(p.color); share[n] = (share[n] ?? 0) + (p.cat === 'Tops' && layer ? 0.12 : AREA[p.cat] ?? 0) / tot; }
    const big = Object.values(share).filter(v => v >= 0.25).length, fam = Object.entries(share);
    if (big >= 2) out.push([-0.4, 'Two loud colors the same size, let one lead']);
    else if (fam.length === 1 && fam[0][1] <= 0.15) out.push([0.3, `${cap(fam[0][0])} as the small pop, the 10 in 60/30/10`]);
  }
  if (patterns(ps).length >= 2) out.push(printPair(ps) ? [-0.5, 'Two patterns, one color ties them'] : [-0.8, 'Two loud patterns fight for attention']);
  // jewelry and necklines: a chain shows on a tee, tank or open collar; it disappears under a hood or turtleneck
  const chain = ps.find(p => p.cat === 'Accessories' && /chain|necklace|pendant/i.test(`${p.kind} ${p.name}`)), neck = layer && /hoodie|turtleneck|zip/i.test(`${layer.kind} ${layer.name}`) ? layer : top;
  if (chain && neck) /turtleneck|hoodie/i.test(`${neck.kind} ${neck.name}`) ? out.push([-0.2, 'A chain gets lost under a high neck']) : /tee|t-shirt|tank|button|polo|jersey/i.test(`${neck.kind} ${neck.name}`) && out.push([0.2, `Chain over ${/button|polo/i.test(neck.kind) ? 'an open collar' : 'a crewneck'}`]);
  // belts: blend in, or repeat a color from the fit (shoes, bag, cap)
  const belt = ps.find(p => p.cat === 'Accessories' && /belt/i.test(`${p.kind} ${p.name}`));
  if (belt) { const n = colorName(belt.color), rep = ps.find(p => p !== belt && p.cat !== 'Bottoms' && colorName(p.color) === n); if (rep) out.push([0.3, `Belt repeats the ${n} in the ${rep.kind || rep.cat.toLowerCase()}`]); }
  // layering: short over long (a cropped jacket over a regular top)
  if (layer && top && layer.fit === 3 && top.fit !== 3) out.push([0.3, 'Short over long, the layering rule']);
  // shorts: boots are a hard look, clean sneakers or loafers work
  if (b && /short/i.test(`${b.kind} ${b.name}`) && shoes) /boot/i.test(`${shoes.kind} ${shoes.name}`) ? out.push([-0.6, 'Boots with shorts is a hard look']) : /sneaker|loafer|sandal|slide/i.test(`${shoes.kind} ${shoes.name}`) && out.push([0.2, `Shorts with ${shoes.kind || 'clean shoes'}`]);
  // your hair (Me): match it or contrast it near the face
  const HAIR = { blonde: ['purple', 'black', 'navy'], red: ['forest', 'green', 'olive', 'blue', 'navy'], brown: ['blue', 'light blue', 'navy', 'denim', 'teal'], black: ['white', 'light grey', 'beige', 'light blue', 'pink', 'yellow'], grey: ['navy', 'burgundy', 'black'] };
  const faceCol = ps.filter(p => p.cat === 'Tops' || p.cat === 'Layers' || isHat(p)).map(p => colorName(p.color));
  if (TASTE.hair && faceCol.some(n => HAIR[TASTE.hair]?.includes(n))) out.push([0.25, `Plays off your ${TASTE.hair} hair`]);
  // your palette (Me): colors that suit you near the face, colors you avoid
  const face = ps.filter(p => p.cat === 'Tops' || p.cat === 'Layers' || isHat(p)).map(p => colorName(p.color));
  if (face.some(n => TASTE.avoid.includes(n))) out.push([-0.6, "A color you said doesn't suit you, near your face"]);
  else if (face.some(n => TASTE.good.includes(n))) out.push([0.3, 'A color that suits you, up top']);
  if (c) out.push([0.4, `${cap(c.text)} · ${c.label}`]);
  const row = b && (/camo/i.test(`${b.kind ?? ''} ${b.name ?? ''}`) ? CAMO : (isDenim(b) ? JEANS : TROUSERS)[colorName(b.color)]);
  const hit = row && ps.find(p => (p.cat === 'Tops' || p.cat === 'Layers') && row[1].split('+').some(w => alt(w).includes(colorName(p.color))));
  if (hit) out.push([0.4, `${row[0]} with ${colorName(hit.color)}, a go-to pairing`]);
  // camo up top works like camo pants: the same colors go with it (only when the pants didn't already say so)
  const camoUp = !hit && ps.find(p => (p.cat === 'Layers' || p.cat === 'Tops') && /camo/i.test(`${p.kind ?? ''} ${p.name ?? ''}`));
  const camoHit = camoUp && ps.find(p => p !== camoUp && CLOTHES.includes(p.cat) && p.cat !== 'Shoes' && CAMO[1].split('+').some(w => alt(w).includes(colorName(p.color))));
  if (camoHit) out.push([0.3, `Camo with ${colorName(camoHit.color)}`]);
  // smart streetwear (@biancatomash): real tailoring (blazer, vest, trousers, loafers, a tie) kept casual by a tee, cap or jeans. Not a sweater over a tee.
  const tl = re => ps.filter(p => re.test(`${p.kind ?? ''} ${p.name ?? ''}`)).length; // a blazer, vest or tie alone is tailoring; trousers alone with a tee is just a fit
  const tailored = tl(/blazer|\bvest\b|waistcoat|\bsuit\b|\btie\b/i) || tl(/trouser|pleated|slacks|loafer|derby/i) >= 2;
  const polish = out.some(([, n]) => /same polish|over a dressy top/.test(n));
  if (tailored && !polish && !lo && cl.length >= 3 && ps.some(p => /\btees?\b|t-?shirt|baseball cap|\bcap\b|\bjeans?\b/i.test(`${p.kind ?? ''} ${p.name ?? ''}`))) out.push([0.3, 'Smart streetwear: dressy pieces kept casual']);
  // jeans and the top: dark jeans want a light top, light jeans a dark one, mid wash a neutral (reel DYnTEJWvKxK). Only when the jeans list above didn't already match.
  const up = layer ?? top;
  if (!hit && b && isDenim(b) && up) { const jl = hexToHsl(b.color).l, tl = hexToHsl(up.color).l;
    if (jl < 0.3 && tl > 0.65) out.push([0.3, 'Dark jeans, light top']); else if (jl > 0.55 && tl < 0.35) out.push([0.3, 'Light jeans, dark top']); else if (jl >= 0.3 && jl <= 0.55 && isNeutral(up.color)) out.push([0.2, 'Mid wash jeans, neutral top']); }
  // metal tone: silver near cool and dark colors, gold near warm ones, judged on the piece it sits on. A bonus only: gold on a black tee is a staple.
  const metal = ps.find(p => p.cat === 'Accessories' && /silver|gold/i.test(`${p.name} ${p.kind}`)), mt = metal && (/silver/i.test(`${metal.name} ${metal.kind}`) ? 'silver' : 'gold');
  const near = metal && (/chain|necklace|pendant/i.test(`${metal.name} ${metal.kind}`) ? neck ?? up : up);
  if (near && METAL[mt].includes(colorName(near.color))) out.push([0.2, `${cap(mt)} with ${colorName(near.color)}, the right metal`]);
  const d = ps.filter(p => (p.cat === 'Bottoms' || p.cat === 'Layers' || p.cat === 'Tops') && isDenim(p));
  if (d.length >= 2) { // double denim: far apart or an exact match. One shade off reads as a miss.
    const gap = Math.abs(WASH(hexToHsl(d[0].color)) - WASH(hexToHsl(d[1].color)));
    out.push(gap >= 2 ? [0.6, 'Denim washes far apart, clearly on purpose'] : colorDist(d[0].color, d[1].color) < 30 ? [0.6, 'Same denim head to toe, a matching set']
      : [-1.5, gap ? 'Denim washes one shade apart look like a near miss' : 'Almost-matching denim looks like a mistake']);
  }
  return out.sort((x, y) => Math.abs(y[0]) - Math.abs(x[0]));
}

// One fix for a fit that feels off (builder hint). null = nothing to add.
export function fixTip(ps) {
  const warn = style(ps).find(([v]) => v < 0); if (warn) return warn[1]; // a rule the look breaks (two prints, leather on leather)
  const hs = new Set(colored(ps).map(p => colorName(p.color)));
  if (hs.size >= 3) return 'Busy? Keep one main color, let the rest go neutral';
  if (!hs.size && !prints(ps) && !ps.some(p => p.cat === 'Accessories')) return 'Plain? Add a cap, a chain or one pop of color';
  if (!ps.some(p => p.cat === 'Accessories')) return 'Details make the fit: add a hat, chain or bag';
  return null;
}

// ---------- your taste: learned from favorites, wears and "not for me" ----------
// Pairs of pieces you keep putting together score higher; pairs from looks you rejected score lower; a rejected look never comes back.
// ponytail: module-level state set by the app (setTaste) so every scorer sees it without threading opts through. Fine for one user.
let TASTE = { pair: new Map(), nope: new Set(), good: [], avoid: [], hair: null, cpair: new Map(), never: new Set(), colorNo: new Set(), dressBias: 0 };
// liked/worn/nope: lists of piece-id arrays. good/avoid: color names. hair: black|brown|blonde|red|grey. likedColors: color-name lists of looks you saved or wore.
export function setTaste({ liked = [], worn = [], nope = [], good = [], avoid = [], hair = null, likedColors = [], never = [], colorNo = [], dressBias = 0 } = {}) {
  const pair = new Map(), bump = (ids, w) => { for (const [a, b] of pairs([...ids].sort())) pair.set(a + '|' + b, (pair.get(a + '|' + b) ?? 0) + w); };
  liked.forEach(ids => bump(ids, 1)); worn.forEach(ids => bump(ids, 0.5)); nope.forEach(ids => bump(ids, -1));
  const cpair = new Map(); // color pairs you keep choosing (black + olive), not just piece pairs
  for (const ns of likedColors) for (const [a, b] of pairs([...new Set(ns)].sort())) cpair.set(a + '|' + b, (cpair.get(a + '|' + b) ?? 0) + 1);
  TASTE = { pair, nope: new Set(nope.map(ids => [...ids].sort().join())), good, avoid, hair, cpair, never: new Set(never.map(p => [...p].sort().join('|'))), colorNo: new Set(colorNo.map(p => [...p].sort().join('|'))), dressBias };
}
const taste = ps => {
  const ids = ps.map(p => p.id).sort(); if (TASTE.nope.has(ids.join())) return null;
  if (pairs(ids).some(([a, b]) => TASTE.never.has(a + '|' + b))) return null; // you said these two don't go
  const cn = [...new Set(ps.filter(p => p.cat !== 'Accessories').map(p => colorName(p.color)))].sort();
  const colorPen = pairs(cn).some(([a, b]) => TASTE.colorNo.has(a + '|' + b)) ? -2 : 0; // you said these colors don't work together
  const cl = ps.filter(p => CLOTHES.includes(p.cat)), dressPen = TASTE.dressBias && cl.length ? -Math.abs(cl.reduce((t, p) => t + dress(p), 0) / cl.length - (1 + TASTE.dressBias)) * 0.8 : 0; // too dressy / too sporty
  const t = pairs(ids).reduce((s, [a, b]) => s + (TASTE.pair.get(a + '|' + b) ?? 0), 0);
  const cs = pairs([...new Set(ps.filter(p => p.cat !== 'Accessories').map(p => colorName(p.color)))].sort()).reduce((s, [a, b]) => s + (TASTE.cpair.get(a + '|' + b) ?? 0), 0);
  return Math.max(-1.5, Math.min(1.5, t * 0.25 + Math.min(0.6, cs * 0.1))) + colorPen + dressPen;
};

// Known sneakers have a known shape: the AI's fit guess shouldn't call Air Force 1s sleek. null = not a model we know.
const SHOE_FITS = [[/yeezy ?(500|700)|foam|bapesta|triple ?s|platform|chunky|runner/i, 2], [/air ?force|af1|dunk|jordan ?1|aj1|350|vans|converse|chuck/i, 1], [/loafer|oxford|derby|chelsea|samba|gazelle|spezial|ballet/i, 0]];
const BRAND_FITS = [[/essentials|fear of god|\bfog\b|gallery dept|balenciaga|vetements|represent|cole buxton|entire studios/i, 2]]; // tops these brands cut oversized
export const knownFit = p => p.cat === 'Shoes' ? SHOE_FITS.find(([re]) => re.test(`${p.name ?? ''}`))?.[1] ?? null
  : (p.cat === 'Tops' || p.cat === 'Layers') && p.fit !== 3 ? BRAND_FITS.find(([re]) => re.test(`${p.brand ?? ''} ${p.name ?? ''}`))?.[1] ?? null : null;

// Suggest it less / more (piece page): rate -1 = special occasion only (boots for a wedding), +1 = pieces you're trying to wear.
const pull = ps => ps.reduce((t, p) => t + (p.rate > 0 ? 0.6 : p.rate < 0 ? -2.5 : 0), 0);
// Returns { score, note } or null. Color mode decides if it's allowed; proportions can veto or boost.
export function scoreOutfit(ps, mode, opts = {}) {
  // A cap or shoes repeating a color from the print up top belongs to that print's palette, so the color rule judges the fit without them.
  const ech = echoes(ps), base = MODES[mode].score(ps, opts) ?? (ech.length ? MODES[mode].score(ps.filter(p => !ech.some(e => e.p === p)), opts) : null);
  if (base == null) return null;
  const tb = taste(ps); if (tb == null) return null; // you said "not for me" to this exact look
  const pr = proportion(ps);
  if (pr.veto) return null; // one deal-breaker outweighs any number of good points
  const finish = Math.min(2, ps.filter(p => p.cat === 'Accessories').length) * 0.3; // a hat / chain finishes the look
  // style bonuses top out at +1.6 so one idea counted three ways can't run away; warnings always count in full
  const st = style(ps), e = ech[0], good = st.find(([v]) => v > 0); // the caption says what works; warnings go to the builder's tip (fixTip)
  const note = e ? `${e.p.name} picks up the ${colorName(e.p.color)} in the ${e.from.name}` : good ? good[1] : pr.note; // never pitches a look with its flaw
  return { score: base + pr.score + finish + pull(ps) + Math.min(2, ech.length) * 0.7 + Math.min(1.6, st.reduce((t, [x]) => t + Math.max(0, x), 0)) + st.reduce((t, [x]) => t + Math.min(0, x), 0) + tb, warn: pr.score < 0, note: tb >= 1 && !e ? `${note} · like looks you've saved` : note };
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
// A darker or lighter version of the main color (the shadowed side of a green jacket) is not a second color.
export const isShade = (a, b) => { const x = hexToHsl(a), y = hexToHsl(b); return x.s >= 0.2 && y.s >= 0.2 && hueDist(x.h, y.h) <= 25; };
export function accentsOf(palette, base, min = 0.03) {
  const out = [];
  for (const c of palette) if (c.share >= min && colorDist(c.hex, base) > 90 && !isShade(c.hex, base) && out.every(a => colorDist(a, c.hex) > 70)) out.push(c.hex);
  return out.slice(0, 3);
}

// Accessories split into two slots so a fit can carry a hat AND a chain or bag.
export const isHat = p => p.cat === 'Accessories' && /cap|hat|beanie|fitted|bucket/i.test(`${p.name} ${p.kind}`);
export const SLOTS = {
  Tops: p => p.cat === 'Tops', Layers: p => p.cat === 'Layers', Bottoms: p => p.cat === 'Bottoms', Shoes: p => p.cat === 'Shoes',
  Hat: isHat, Accessory: p => p.cat === 'Accessories' && !isHat(p),
};
export const slotOf = p => Object.keys(SLOTS).find(k => SLOTS[k](p));

// Flat-lay boxes for a 100 × 125 card: { slot: [left%, top%, width%, height%] }, never overlapping.
// Stacked the way it's worn: hat on top, layer + top, chain or bag beside the torso, pants, shoes at the bottom.
// Pieces get as much room as the card allows (big and even beats true-to-scale), but a cap still stays smaller than a tee.
export function flatLayout(slots) {
  const has = x => slots.includes(x), hat = has('Hat'), acc = has('Accessory'), layer = has('Layers'), outer = layer && has('Outer');
  const y0 = hat ? 20 : 3, th = hat ? 38 : 50, side = acc ? 22 : 0, tw = 100 - side - 4, box = {};
  if (hat) box.Hat = [38, 1, 24, 18];
  if (outer) { box.Outer = [2, y0, tw * 0.36, th]; box.Layers = [2 + tw * 0.34, y0 + 1, tw * 0.34, th - 2]; box.Tops = [2 + tw * 0.68, y0 + 2, tw * 0.32, th - 4]; } // jacket, flannel, tee: outermost on the left
  else if (layer) { box.Layers = [2, y0, tw * 0.52, th]; box.Tops = [2 + tw * 0.52, y0 + 2, tw * 0.48, th - 4]; }
  else box.Tops = [2 + tw * 0.1, y0, tw * 0.8, th];
  if (acc) box.Accessory = [100 - side, y0 + 6, side - 2, 24];
  const by = y0 + th + 2; box.Bottoms = [26, by, 48, 100 - by]; box.Shoes = [24, 101, 52, 21]; // shoes big enough to read
  return Object.fromEntries(Object.entries(box).filter(([k]) => slots.includes(k)).map(([k, [x, y, w, h]]) => [k, [x, y / 1.25, w, h / 1.25].map(v => +v.toFixed(2))]));
}

// A look's pieces by slot. Two layers (tee + flannel + jacket): the lighter one is Layers, the heavier one Outer.
// A button-up worn open over a tee is a layer: tee + denim shirt + jacket = Tops, Layers, Outer.
export const openShirt = p => p.cat === 'Tops' && /button|denim shirt|chambray|oxford|camp shirt|bowling|work shirt|western|overshirt|flannel/i.test(`${p.kind ?? ''} ${p.name ?? ''}`);
export function bySlot(ps, outerId = null) {
  const tops = ps.filter(p => p.cat === 'Tops').sort((a, b) => openShirt(a) - openShirt(b) || level(a) - level(b)); // the tee goes under
  const by = {}, ls = [...tops.slice(1), ...ps.filter(p => p.cat === 'Layers')];
  for (const p of ps) { const sl = slotOf(p); if (sl && sl !== 'Layers' && !(sl === 'Tops' && p !== tops[0])) by[sl] ??= p; }
  const out = ls.length > 1 ? ls.find(p => p.id === outerId) ?? [...ls].sort((a, b) => level(b) - level(a))[0] : null;
  if (ls.length) by.Layers = ls.find(p => p !== out); if (out) by.Outer = out;
  if (!by.Tops && by.Layers && !by.Outer && level(by.Layers) <= 2) { by.Tops = by.Layers; delete by.Layers; } // a hoodie on its own is the top
  return by;
}
// A wearable look: something on top, bottoms, shoes. Hoodies, sweaters and quarter zips live in Layers but still count as the top
// of a look you saved without a tee (Today pairs them with one).
export const isTopish = p => p.cat === 'Tops' || p.cat === 'Layers' && level(p) <= 2;
export const complete = ps => ps.some(isTopish) && ps.some(p => p.cat === 'Bottoms') && ps.some(p => p.cat === 'Shoes');
// Builder: try every piece that fits `slot` in the current outfit, best first. score null = breaks every style rule.
export function rankSwaps(items, outfit, slot, modes = Object.keys(MODES).filter(k => !MODES[k].hidden), { rest = outfit.filter(p => !SLOTS[slot](p)), fits = SLOTS[slot] } = {}) {
  return items.filter(fits).map(item => {
    const ps = [...rest, item];
    let best = null;
    for (const m of modes) { /* half-built outfits score too: only the rules whose pieces are there count */ const r = scoreOutfit(ps, m); if (r && (!best || r.score > best.score)) best = { ...r, mode: m }; }
    if (!best && !rest.length) return { item, score: -9, mode: null, note: null }; // nothing else picked: nothing to clash with (it just ranks last)
    return { item, score: best?.score ?? null, mode: best?.mode, note: best?.note ?? (proportion(ps).veto ? proportion(ps).note : null) }; // a clash says why when it's the shape
  }).sort((a, b) => (b.score ?? -99) - (a.score ?? -99));
}

// Best style for a whole outfit (builder header). null = no style rule accepts it.
export function bestMode(ps, modes = Object.keys(MODES).filter(k => !MODES[k].hidden)) {
  if (!complete(ps)) return null;
  let best = null;
  for (const m of modes) { const r = scoreOutfit(ps, m); if (r && (!best || r.score > best.score)) best = { ...r, mode: m }; }
  return best ?? { score: null, note: whyNot(ps).note };
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
export function generate(items, mode, { anchor, fixed = [], palette, inspo, n = 12, tries = 1500, rand = Math.random, layerOdds = 0.5, maxUse = null, alone = false } = {}) {
  const by = Object.fromEntries(Object.keys(SLOTS).map(s => [s, items.filter(SLOTS[s])]));
  if (alone) by.Tops = items.filter(isTopish); // "wear hoodies alone": a hoodie or sweater can be the top
  const pinned = [anchor, ...fixed].filter(Boolean), forced = new Set(pinned.map(slotOf));
  for (const p of pinned) by[slotOf(p)] = [p];
  if (!by.Tops.length || !by.Bottoms.length || !by.Shoes.length) return [];
  const pick = a => a[Math.floor(rand() * a.length)], opts = { palette, inspo };
  const seen = new Map(), blocked = new Map();
  for (let t = 0; t < tries; t++) {
    const ps = [pick(by.Tops), pick(by.Bottoms), pick(by.Shoes)];
    const add = (slot, odds) => { const left = by[slot].filter(p => !ps.includes(p)); if (left.length && (forced.has(slot) || rand() < odds)) ps.push(pick(left)); }; // never the same piece twice
    add('Layers', layerOdds); add('Hat', 0.8); add('Accessory', 0.5); // hats + chains/bags in most fits, not all
    const key = ps.map(p => p.id).sort().join();
    if (seen.has(key)) continue;
    const r = scoreOutfit(ps, mode, opts);
    if (r) seen.set(key, { key, items: ps, note: r.note, warn: r.warn, score: r.score + rand() * 0.3 });
    else if (MODES[mode].score(ps, opts) != null) { // color rule passed, so the shape is what blocked it
      const pr = proportion(ps); if (pr.veto) blocked.set(pr.note, (blocked.get(pr.note) ?? 0) + 1);
    }
  }
  // Greedy pick with a reuse penalty, so one great pair of cargos doesn't star in every idea.
  const left = [...seen.values()], used = new Map(), out = [];
  const cap = maxUse ?? Math.max(2, Math.ceil(n / 4)); // no piece in more than ~a quarter of the ideas (the same cap + chain in every fit)
  const reuse = o => o.items.reduce((t, p) => { const u = used.get(p.id) ?? 0; return t + u + (u >= (p.rate < 0 ? 1 : cap) ? 5 : 0); }, 0); // "less" pieces: one idea at most
  while (out.length < n && left.length) {
    let bi = 0;
    for (let i = 1; i < left.length; i++) if (left[i].score - 0.45 * reuse(left[i]) > left[bi].score - 0.45 * reuse(left[bi])) bi = i;
    const o = left.splice(bi, 1)[0]; out.push(o);
    for (const p of o.items) used.set(p.id, (used.get(p.id) ?? 0) + 1);
  }
  out.blocked = [...blocked].sort((a, b) => b[1] - a[1])[0]?.[0]; // most common deal-breaker, to explain empty results
  return out;
}

// ---------- "see what you can make" + today's picks ----------
const VISIBLE = () => Object.keys(MODES).filter(k => !MODES[k].hidden);
// Best outfits across every style, varied: caps how often one piece (other than the anchor) can show up, so a deck isn't
// twelve looks around the same pants and cap. A second, looser pass fills up if the closet is too small for the caps.
function varied(list, n, base = { Tops: 2, Layers: 2, Bottoms: 2, Shoes: 2, Accessories: 2 }, closet = null) {
  const used = new Map(), out = [], sorted = list.sort((a, b) => b.score - a.score);
  // scarce kinds may repeat more (3 layers on a cold day can't cover 12 cards once each); plentiful ones stay at the base cap
  // need = how many of that kind n outfits use (a hat and a chain each = 2 accessories per card), own = how many different ones exist
  const of = (o, cat) => o.items.filter(p => p.cat === cat && p !== o.anchor);
  // own: what you actually have (closet), not what the candidates happen to show; candidates lean on a few strong pieces and made the cap balloon
  const own = cat => (closet ? closet.filter(p => p.cat === cat).length : new Set(list.flatMap(o => of(o, cat).map(p => p.id))).size) || 1, need = cat => n * list.reduce((t, o) => t + of(o, cat).length, 0) / (list.length || 1);
  const caps = Object.fromEntries(Object.entries(base).map(([c, v]) => [c, Math.max(v, Math.ceil(need(c) / own(c)))]));
  const loose = Object.fromEntries(Object.entries(caps).map(([c, v]) => [c, c === 'Layers' ? v : v + 1])); // second pass: one more top/pants/shoes each; a layer stays at its cap (it's what you notice)
  for (const pass of [0, 1, 2]) { const cap = pass === 0 ? caps : pass === 1 ? loose : out.length < n / 2 ? null : undefined; if (cap === undefined) break; for (const o of sorted) { // last pass (no caps) only when the closet is too small for half a set
    if (out.length === n) return out;
    if (out.includes(o)) continue;
    const main = o.items.filter(p => p !== o.anchor);
    if (cap && main.some(p => (used.get(p.id) ?? 0) >= (p.rate < 0 ? 1 : cap[p.cat] ?? 2))) continue; // "less" pieces: one card at most
    if (cap === caps && out.some(x => main.filter(p => p.cat !== 'Accessories' && x.items.includes(p)).length >= 2)) continue; // same jacket AND same shoes as an earlier card: too close
    out.push(o); main.forEach(p => used.set(p.id, (used.get(p.id) ?? 0) + 1));
  } } // the uncapped pass only runs when the closet is too small for half a set
  return out;
}
const collect = (items, opts, modes = VISIBLE(), per = 10) => {
  const best = new Map();
  for (const m of modes) for (const o of generate(items, m, { n: per, ...opts })) if ((best.get(o.key)?.score ?? -99) < o.score) best.set(o.key, { ...o, mode: m, anchor: opts.anchor });
  return [...best.values()];
};
export const madeWith = (items, anchor, n = 5) => varied(collect(items, { anchor }), n);
// Rules library (Inspo › Rules): a wide pool of looks from your closet, plus looks built around each all-over pattern
// (pattern pairs score lower, so they'd hardly show up otherwise). Then every rule a look follows, as its reason lines.
export const lookPool = items => { const out = new Map(); for (const o of collect(items, { rand: seeded() }, VISIBLE(), 60)) out.set(o.key, o);
  for (const p of items.filter(p => PRINTABLE.includes(p.cat) && patternOf(p) === 'allover')) for (const o of collect(items, { anchor: p, rand: seeded() }, VISIBLE(), 12)) out.set(o.key, o);
  return [...out.values()]; };
export const lookRules = o => [o.note, ...proportion(o.items).list.map(n => n[1]), ...style(o.items).map(n => n[1])].filter(Boolean);
// The highest-scoring outfits you can make from these pieces (Favorites › Best). Same score as Build's match ring, kept varied
// so one great pair of pants can't fill the whole list. Fixed seed: the list only changes when your pieces do.
// Combos library (Inspo › Combos): the combo book, and looks that wear one combo exactly: each of its colors on its own piece,
// every other piece black, white or grey (or an accessory). One-color combos: top, bottoms and layer all in that color.
export const comboBook = () => BOOK;
export function comboLooks(items, text, n = 6) {
  const c = BOOK.find(b => b.text === text); if (!c) return [];
  const want = new Set(c.slots.flat()), body = ps => ps.filter(p => CLOTHES.includes(p.cat) && p.cat !== 'Shoes').map(p => colorName(p.color));
  const pool = items.filter(p => p.cat === 'Accessories' || want.has(colorName(p.color)) || ACHRO.includes(colorName(p.color)));
  const wears = o => (c.slots.length === 1 ? body(o.items).length >= 2 && body(o.items).every(x => c.slots[0].includes(x)) : fits(c.slots, names(o.items)))
    && o.items.filter(p => CLOTHES.includes(p.cat) && !ACHRO.includes(colorName(p.color))).every(p => want.has(colorName(p.color)));
  return varied(collect(pool, { rand: seeded() }, VISIBLE(), 40).filter(wears), n, { Tops: 2, Layers: 2, Bottoms: 2, Shoes: 3, Accessories: 3 }, pool).sort((a, b) => b.score - a.score);
}
export const topLooks = (items, n = 20) => { let pp = 0; return varied(collect(items, { rand: seeded() }, VISIBLE(), 40), n + 4, { Tops: 2, Layers: 3, Bottoms: 3, Shoes: 4, Accessories: 4 }, items)
  .sort((a, b) => b.score - a.score).filter(o => patterns(o.items).length < 2 || !pp++).slice(0, n); }; // one pattern-on-pattern look at most
// Builder's "see outfit possibilities": complete looks that keep every piece you've already picked.
export const possibilities = (items, picked, n = 6) => varied(collect(items, { fixed: picked }).map(o => ({ ...o, anchor: null })), n, { Tops: 2, Layers: 2, Bottoms: 2, Shoes: 2, Accessories: 2 });

// What the weather rules out. t = feels-like °C, null = unknown (nothing ruled out). rain: no suede.
// season: 'cold' (Nov-Mar) keeps shorts, tanks and sandals out unless it's really hot today; 'warm' (May-Sep) keeps heavy coats out unless it's really cold.
export function forWeather(items, t, rain = false, season = null) {
  if (rain) items = items.filter(p => p.material !== 'suede' && !/suede/i.test(p.name ?? ''));
  const k = p => `${p.kind ?? ''} ${p.name ?? ''}`;
  if (season === 'cold' && !(t >= 24)) items = items.filter(p => !/\bshorts\b|\bjorts\b|tank|sandal|slipper|flip/i.test(k(p)));
  if (season === 'warm' && !(t != null && t < 12)) items = items.filter(p => !/\bcoat\b|overcoat|puffer|parka|down jacket/i.test(k(p)));
  if (t == null) return items;
  if (t >= 24) return items.filter(p => !/coat|puffer|parka|sweater|hoodie|knit|beanie|\bboots?\b/i.test(k(p)) && (p.cat !== 'Layers' || /overshirt|flannel|shirt/i.test(k(p))));
  if (t < 12) return items.filter(p => !/\bshorts\b|\bjorts\b|tank|sandal|slipper|flip/i.test(k(p)));
  return items.filter(p => !/puffer|parka/i.test(k(p)));
}
// Pieces that suit rain: a hood or shell up top, boots below. Rainy days lean toward looks that have them.
export const rainy = p => /hood|rain|shell|parka|windbreaker|anorak|puffer|trench/i.test(`${p.kind ?? ''} ${p.name ?? ''}`) || p.cat === 'Shoes' && /boot/i.test(`${p.kind ?? ''} ${p.name ?? ''}`);
// Today: n varied outfits from every style, a little random so each visit (or Shuffle) is different. Cold days want a layer.
// Occasions: how dressed up (0-2) and which vibe fits. A look scores by how close it lands.
export const OCCASIONS = { work: { label: 'Work', dress: 2 }, date: { label: 'Date', dress: 1.5 }, club: { label: 'Club', dress: 1, vibe: 'streetwear' }, errands: { label: 'Errands', dress: 0.8 }, gym: { label: 'Gym', dress: 0, vibe: 'athletic' }, event: { label: 'Event', dress: 2 } };
export const occasionFit = (ps, occ) => { const o = OCCASIONS[occ]; if (!o) return 0; const cl = ps.filter(p => CLOTHES.includes(p.cat)), avg = cl.reduce((t, p) => t + dress(p), 0) / cl.length;
  return -Math.abs(avg - o.dress) * 1.5 + (o.vibe ? vibe(ps, o.vibe) * 0.3 : 0); };
const likeness = (ps, like) => { if (!like?.length) return 0; const cn = p => colorName(p.color), lc = new Set(like.filter(p => p.cat !== 'Accessories').map(cn)), lk = new Set(like.map(p => p.kind));
  return Math.min(1.2, ps.filter(p => p.cat !== 'Accessories' && lc.has(cn(p))).length * 0.25 + ps.filter(p => lk.has(p.kind)).length * 0.15); };
export function today(items, { t = null, rain = false, season = null, twoShirts = false, patternDay = null, occasion = null, n = 5, rand = Math.random, skip = [], like = null, alone = false } = {}) {
  // skip: what you wore yesterday. Tops and layers rest a day; pants and shoes can repeat.
  if (OCCASIONS[occasion]?.dress >= 1.5) items = items.map(p => p.rate < 0 ? { ...p, rate: 0 } : p); // dressing up: pieces saved for special occasions come back
  const pool = forWeather(items, t, rain, season).filter(p => !(skip.includes(p.id) && (p.cat === 'Tops' || p.cat === 'Layers'))), cold = t != null && t < 12 && pool.some(p => p.cat === 'Layers');
  const list = collect(pool, { rand, maxUse: 3, alone, layerOdds: cold ? 1 : t != null && t >= 24 ? 0.15 : 0.5 }, VISIBLE(), 30).filter(o => !cold || o.items.some(p => p.cat === 'Layers'));
  // a new top every card; pants, shoes, a layer, the same cap or chain at most twice each.
  let twoPrints = (patternDay ?? rand() < 0.35) ? 0 : 1; const res = varied(list.map(o => ({ ...o, score: o.score + occasionFit(o.items, occasion) + likeness(o.items, like) + (rain ? Math.min(1, o.items.filter(rainy).length * 0.5) : 0) + rand() * 1.5 })), n, { Tops: 1, Layers: 2, Bottoms: 2, Shoes: 2, Accessories: 2 }, pool); // a layer on at most 2 cards: one favorite jacket can't crowd out the rest (varied() lifts it when you own few)
  // Two shirts: now and then a button-up goes open over the tee (tee + denim shirt + jacket). Never on hot days, each shirt once.
  if (twoShirts && !(t >= 22)) { const used = new Set(); // only if you turned it on: at most one card per deck gets a button-up open over the tee
    for (const o of res) { if (used.size || rand() > 0.3 || o.items.some(openShirt) || o.items.filter(p => p.cat === 'Layers').length > 1 || !o.items.some(p => p.cat === 'Tops')) continue;
      const best = pool.filter(p => openShirt(p) && !used.has(p.id)).map(p => ({ p, r: scoreOutfit([...o.items, p], o.mode) })).filter(x => x.r && x.r.score >= o.score - 1.5).sort((a, b) => b.r.score - a.r.score)[0];
      if (best) { used.add(best.p.id); o.items = [...o.items, best.p]; o.key = o.items.map(p => p.id).sort().join(); } } }
  for (let k = res.length - 1; k >= 0; k--) if (patterns(res[k].items).length >= 2 && twoPrints++) res.splice(k, 1); // pattern on pattern: about one day in three, one look that day
  return res;
}

// Why no style rule takes a look, and which piece to change: the one whose removal lets a rule pass. The builder shows this instead
// of a blanket "colors clash" (loafers in a streetwear look, a cap tagged athletic, two prints). { note, piece?, fix: 'swap' | 'tag' }
export function whyNot(ps) {
  const pr = proportion(ps); if (pr.veto) return { note: pr.note, fix: 'swap' };
  const ok = qs => VISIBLE().some(m => scoreOutfit(qs, m) != null);
  const order = [...ps].sort((a, b) => (isNeutral(a.color) - isNeutral(b.color)) || ((a.cat === 'Accessories') - (b.cat === 'Accessories')));
  for (const p of order) {
    if (!ok(ps.filter(q => q !== p))) continue;
    const v = [].concat(p.vibe ?? []), swap = (q, x) => ps.map(o => o === p ? { ...o, ...x } : o);
    if (v[0] === 'athletic' && ok(swap(p, { vibe: 'casual' }))) return { note: `${p.name} is tagged sporty, which rules out the dressier looks. Tagged wrong?`, piece: p, fix: 'tag' };
    if (prints(ps) > 1 && patternOf(p) === 'allover') return { note: `Two loud patterns compete. Swap the ${p.name.toLowerCase()} for something plain`, piece: p, fix: 'swap' };
    if (p.cat === 'Shoes' && !/sneaker|boot|trainer|dunk|jordan/i.test(`${p.name} ${p.kind}`)) return { note: `${p.name} work in classic looks, but not with these colors. Try sneakers or a neutral pair`, piece: p, fix: 'swap' };
    if (!isNeutral(p.color) && !isDenim(p)) return { note: `The ${colorName(p.color)} ${p.name.toLowerCase()} doesn't go with the other colors`, piece: p, fix: 'swap' };
    return { note: `${p.name} is the piece that doesn't fit`, piece: p, fix: 'swap' };
  }
  return { note: 'Too many colors at once. Swap one for black, white, grey or denim', fix: 'swap' };
}

// Every rule that scored a look, biggest first: the builder's "Why?". null = no style rule takes it.
export function explain(ps) {
  const b = bestMode(ps); if (b?.score == null) return null;
  const ech = echoes(ps), base = MODES[b.mode].score(ps, {}) ?? MODES[b.mode].score(ps.filter(p => !ech.some(e => e.p === p)), {}) ?? 0, tb = taste(ps) ?? 0;
  const rows = [[`Color rule: ${MODES[b.mode].label}`, base], ...[...proportion(ps).list, ...style(ps)].map(([v, l]) => [l, v]),
    ...ech.slice(0, 2).map(e => [`${e.p.name} picks up the ${colorName(e.p.color)} in the ${e.from.name}`, 0.7]),
    [`Finished with ${ps.filter(p => p.cat === 'Accessories').length} accessor${ps.filter(p => p.cat === 'Accessories').length === 1 ? 'y' : 'ies'}`, Math.min(2, ps.filter(p => p.cat === 'Accessories').length) * 0.3],
    [tb > 0 ? 'You wear these together' : 'Close to looks you passed on', tb], [pull(ps) > 0 ? 'Pieces you want to wear more' : 'Has a piece you set to suggest less', pull(ps)]];
  return { mode: b.mode, total: b.score, rows: rows.filter(([, v]) => Math.abs(v) >= 0.05).sort((x, y) => y[1] - x[1]) };
}

// ---------- wardrobe gaps ----------
// Try a "ghost" piece for every category × color × fit and count the outfits it would unlock.
const GAP_KIND = { Tops: 'tee', Layers: 'jacket', Bottoms: 'pants', Shoes: 'sneakers', Accessories: 'cap' };
const GAP_FIT = { Tops: ['Fitted', '', 'Oversized'], Layers: ['Fitted', '', 'Oversized'], Bottoms: ['Slim', 'Straight', 'Wide'], Shoes: ['Sleek', '', 'Chunky'], Accessories: ['', '', ''] };
// Wearable palette — neutrals plus the muted "statement" colors people actually buy. No neon cyan pants.
// black, white, grey, navy, beige, camel, brown, olive, slate · burgundy, rust, forest, sage
const GAP_COLORS = ['#151515', '#f4f4f4', '#8c8c8c', '#1c2541', '#d8c3a0', '#b08a5a', '#4a3426', '#5b5f3a', '#4a5d78', '#6d2232', '#9a4a2a', '#2f4a36', '#889f6e'];
const GAP_MODES = ['classic', 'combos', 'street', 'formula', 'complementary', 'analogous']; // combos: buys that complete your style-note color combos

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
    if (items.some(i => i.cat === cat && colorName(i.color) === cname)) continue; // you own one in that color (any cut): a black jacket is a black jacket
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
  // Same color family only: a brown cap is not "your grey beanie" just because both are dull.
  const fam = c => colorName(c) === colorName(ghost.color) || sameHue(c, ghost.color) || (isNeutral(c) && isNeutral(ghost.color) && colorDist(c, ghost.color) < 25);
  return items.filter(SLOTS[slot]).filter(p => fam(p.color)).map(p => [p, colorDist(p.color, ghost.color) - (ghost.fit != null && p.fit === ghost.fit ? 10 : 0)])
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
