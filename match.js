// Color + outfit matching. Pure functions, no DOM — tested by match.test.mjs.
import { ALIAS, COMBOS, JEANS, TROUSERS } from './style.js';
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
  return s < 0.18 || l < 0.13 || l > 0.9 || (l < 0.25 && s < 0.25) // last one: near-black, named black by colorName
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
  if (l < 0.13) return h >= 200 && h <= 250 && s >= 0.4 && l >= 0.09 ? 'navy' : 'black'; // a very dark but clearly blue polo is navy
  if (l < 0.25 && s < 0.25) { // dark and muted: a washed black tee is black (s ≈ 0.02), but dark olive or brown trousers keep their color
    if (s >= 0.1 && h >= 5 && h < 100) return h >= 45 ? "olive" : "brown";
    if (s >= 0.12 && h >= 100 && h < 170) return 'forest';
    return 'black';
  }
  if (l > 0.9) return 'white';
  // warm, barely-colored: olive cargos and cream pants photograph almost grey, but they're olive and cream (true greys sit near s 0.02)
  if (s >= 0.07 && s < 0.18 && h >= 30 && h <= 65 && l > 0.2 && l < 0.85) return l >= 0.55 ? 'beige' : h >= 40 ? 'olive' : 'brown';
  if (s < 0.18) return l > 0.6 ? 'light grey' : 'grey';
  if (h >= 190 && h <= 250 && l < 0.3) return s >= 0.28 ? 'navy' : 'black'; // a black tee shot in cool light reads blue-ish, not navy
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
// Prints that compete: a big graphic or an all-over pattern. A small chest logo doesn't count, and neither does a plain piece.
// p.pattern: 'solid' | 'logo' | 'graphic' | 'allover'; older pieces only have p.patterned (true = graphic).
export const patternOf = p => p.pattern ?? (p.patterned ? 'graphic' : 'solid');
const prints = ps => ps.filter(p => patternOf(p) === 'graphic' || patternOf(p) === 'allover').length;
const vibe = (ps, v) => ps.filter(p => [].concat(p.vibe).includes(v)).length; // an item can carry several vibes
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
  const up = top || layer ? Math.max(top ? fit(top) : 0, layer ? fit(layer) : 0) : null, down = bottom ? fit(bottom) : null, feet = shoes ? fit(shoes) : null;
  const notes = [], add = (s, note) => notes.push([s, note]);
  if (layer && top && fit(layer) < fit(top)) add(-2, 'Slim layer over a baggy top bunches up');
  if (layer && top && level(layer) < level(top)) add(-2, `A ${layer.kind || 'layer'} doesn't go over a ${top.kind || 'heavier top'}`);
  if (layer && top && level(layer) === level(top) && level(top) >= 2) add(-2, level(top) === 2 ? 'Two knits or hoodies stacked is too bulky' : 'Two jackets at once, drop one');
  if (legs && down === 2 && feet === 0) add(-2, 'Sleek shoes get swallowed by wide pants');
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
      if (c > 1 || prints(ps) > 1 || vibe(ps, 'athletic')) return null;
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
      if (vibe(ps, 'formal') || shoes && !/sneaker|boot|trainer|dunk|jordan/i.test(`${shoes.name} ${shoes.kind}`)) return null;
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
  if (mats.length >= 2 && mats.some(m => TEXTURED.includes(m))) out.push([0.3, `${cap(mats[0])} with ${mats[1]}, texture mix`]);
  if (cl.filter(p => material(p) === 'leather').length >= 2) out.push([-0.4, 'Leather on leather is a lot']);
  // 60/30/10: one color leads; two loud colors at the same size fight
  if (cl.length >= 3) {
    const share = {}, tot = ps.reduce((t, p) => t + (p.cat === 'Tops' && layer ? 0.12 : AREA[p.cat] ?? 0), 0);
    for (const p of colored(ps)) { const n = colorName(p.color); share[n] = (share[n] ?? 0) + (p.cat === 'Tops' && layer ? 0.12 : AREA[p.cat] ?? 0) / tot; }
    const big = Object.values(share).filter(v => v >= 0.25).length, fam = Object.entries(share);
    if (big >= 2) out.push([-0.4, 'Two loud colors the same size, let one lead']);
    else if (fam.length === 1 && fam[0][1] <= 0.15) out.push([0.3, `${cap(fam[0][0])} as the small pop, the 10 in 60/30/10`]);
  }
  if (prints(ps) >= 2) out.push([-0.6, 'Two prints compete, let one stand out']);
  // jewelry and necklines: a chain shows on a tee, tank or open collar; it disappears under a hood or turtleneck
  const chain = ps.find(p => p.cat === 'Accessories' && /chain|necklace|pendant/i.test(`${p.kind} ${p.name}`)), neck = layer && /hoodie|turtleneck|zip/i.test(`${layer.kind} ${layer.name}`) ? layer : top;
  if (chain && neck) /turtleneck|hoodie/i.test(`${neck.kind} ${neck.name}`) ? out.push([-0.2, 'A chain gets lost under a high neck']) : /tee|t-shirt|tank|button|polo|jersey/i.test(`${neck.kind} ${neck.name}`) && out.push([0.2, `Chain over a ${/button|polo/i.test(neck.kind) ? 'open collar' : 'crewneck'}`]);
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
  const row = b && (isDenim(b) ? JEANS : TROUSERS)[colorName(b.color)];
  const hit = row && ps.find(p => (p.cat === 'Tops' || p.cat === 'Layers') && row[1].split('+').some(w => alt(w).includes(colorName(p.color))));
  if (hit) out.push([0.4, `${row[0]} with ${colorName(hit.color)}, a go-to pairing`]);
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
let TASTE = { pair: new Map(), nope: new Set(), good: [], avoid: [], hair: null, cpair: new Map() };
// liked/worn/nope: lists of piece-id arrays. good/avoid: color names. hair: black|brown|blonde|red|grey. likedColors: color-name lists of looks you saved or wore.
export function setTaste({ liked = [], worn = [], nope = [], good = [], avoid = [], hair = null, likedColors = [] } = {}) {
  const pair = new Map(), bump = (ids, w) => { for (const [a, b] of pairs([...ids].sort())) pair.set(a + '|' + b, (pair.get(a + '|' + b) ?? 0) + w); };
  liked.forEach(ids => bump(ids, 1)); worn.forEach(ids => bump(ids, 0.5)); nope.forEach(ids => bump(ids, -1));
  const cpair = new Map(); // color pairs you keep choosing (black + olive), not just piece pairs
  for (const ns of likedColors) for (const [a, b] of pairs([...new Set(ns)].sort())) cpair.set(a + '|' + b, (cpair.get(a + '|' + b) ?? 0) + 1);
  TASTE = { pair, nope: new Set(nope.map(ids => [...ids].sort().join())), good, avoid, hair, cpair };
}
const taste = ps => {
  const ids = ps.map(p => p.id).sort(); if (TASTE.nope.has(ids.join())) return null;
  const t = pairs(ids).reduce((s, [a, b]) => s + (TASTE.pair.get(a + '|' + b) ?? 0), 0);
  const cs = pairs([...new Set(ps.filter(p => p.cat !== 'Accessories').map(p => colorName(p.color)))].sort()).reduce((s, [a, b]) => s + (TASTE.cpair.get(a + '|' + b) ?? 0), 0);
  return Math.max(-1.5, Math.min(1.5, t * 0.25 + Math.min(0.6, cs * 0.1)));
};

// Known sneakers have a known shape: the AI's fit guess shouldn't call Air Force 1s sleek. null = not a model we know.
const SHOE_FITS = [[/yeezy ?(500|700)|foam|bapesta|triple ?s|platform|chunky|runner/i, 2], [/air ?force|af1|dunk|jordan ?1|aj1|350|vans|converse|chuck/i, 1], [/loafer|oxford|derby|chelsea|samba|gazelle|spezial|ballet/i, 0]];
const BRAND_FITS = [[/essentials|fear of god|\bfog\b|gallery dept|balenciaga|vetements|represent|cole buxton|entire studios/i, 2]]; // tops these brands cut oversized
export const knownFit = p => p.cat === 'Shoes' ? SHOE_FITS.find(([re]) => re.test(`${p.name ?? ''}`))?.[1] ?? null
  : (p.cat === 'Tops' || p.cat === 'Layers') && p.fit !== 3 ? BRAND_FITS.find(([re]) => re.test(`${p.brand ?? ''} ${p.name ?? ''}`))?.[1] ?? null : null;

// Returns { score, note } or null. Color mode decides if it's allowed; proportions can veto or boost.
export function scoreOutfit(ps, mode, opts = {}) {
  // A cap or shoes repeating a color from the print up top belongs to that print's palette, so the color rule judges the fit without them.
  const ech = echoes(ps), base = MODES[mode].score(ps, opts) ?? (ech.length ? MODES[mode].score(ps.filter(p => !ech.some(e => e.p === p)), opts) : null);
  if (base == null) return null;
  const tb = taste(ps); if (tb == null) return null; // you said "not for me" to this exact look
  const pr = proportion(ps);
  if (pr.veto) return null; // one deal-breaker outweighs any number of good points
  const finish = Math.min(2, ps.filter(p => p.cat === 'Accessories').length) * 0.3; // a hat / chain finishes the look
  const st = style(ps), e = ech[0], good = st.find(([v]) => v > 0); // the caption says what works; warnings go to the builder's tip (fixTip)
  const note = e ? `${e.p.name} picks up the ${colorName(e.p.color)} in the ${e.from.name}` : good && pr.score >= 0 ? good[1] : pr.note;
  return { score: base + pr.score + finish + Math.min(2, ech.length) * 0.7 + st.reduce((t, [x]) => t + x, 0) + tb, note: tb >= 1 && !e ? `${note} · you wear these together` : note };
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
  const has = x => slots.includes(x), hat = has('Hat'), acc = has('Accessory'), layer = has('Layers');
  const y0 = hat ? 20 : 3, th = hat ? 38 : 50, side = acc ? 22 : 0, tw = 100 - side - 4, box = {};
  if (hat) box.Hat = [39, 2, 22, 16];
  if (layer) { box.Layers = [2, y0, tw * 0.52, th]; box.Tops = [2 + tw * 0.52, y0 + 2, tw * 0.48, th - 4]; }
  else box.Tops = [2 + tw * 0.1, y0, tw * 0.8, th];
  if (acc) box.Accessory = [100 - side, y0 + 6, side - 2, 24];
  const by = y0 + th + 2; box.Bottoms = [26, by, 48, 102 - by]; box.Shoes = [28, 104, 44, 19];
  return Object.fromEntries(Object.entries(box).filter(([k]) => slots.includes(k)).map(([k, [x, y, w, h]]) => [k, [x, y / 1.25, w, h / 1.25].map(v => +v.toFixed(2))]));
}

// Builder: try every piece that fits `slot` in the current outfit, best first. score null = breaks every style rule.
export function rankSwaps(items, outfit, slot, modes = Object.keys(MODES).filter(k => !MODES[k].hidden)) {
  const rest = outfit.filter(p => !SLOTS[slot](p));
  return items.filter(SLOTS[slot]).map(item => {
    const ps = [...rest, item];
    let best = null;
    for (const m of modes) { /* half-built outfits score too: only the rules whose pieces are there count */ const r = scoreOutfit(ps, m); if (r && (!best || r.score > best.score)) best = { ...r, mode: m }; }
    return { item, score: best?.score ?? null, mode: best?.mode, note: best?.note ?? (proportion(ps).veto ? proportion(ps).note : null) }; // a clash says why when it's the shape
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
export function generate(items, mode, { anchor, fixed = [], palette, inspo, n = 12, tries = 1500, rand = Math.random, layerOdds = 0.5 } = {}) {
  const by = Object.fromEntries(Object.keys(SLOTS).map(s => [s, items.filter(SLOTS[s])]));
  const pinned = [anchor, ...fixed].filter(Boolean), forced = new Set(pinned.map(slotOf));
  for (const p of pinned) by[slotOf(p)] = [p];
  if (!by.Tops.length || !by.Bottoms.length || !by.Shoes.length) return [];
  const pick = a => a[Math.floor(rand() * a.length)], opts = { palette, inspo };
  const seen = new Map(), blocked = new Map();
  for (let t = 0; t < tries; t++) {
    const ps = [pick(by.Tops), pick(by.Bottoms), pick(by.Shoes)];
    const add = (slot, odds) => { if (by[slot].length && (forced.has(slot) || rand() < odds)) ps.push(pick(by[slot])); };
    add('Layers', layerOdds); add('Hat', 0.8); add('Accessory', 0.5); // hats + chains/bags in most fits, not all
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

// ---------- "see what you can make" + today's picks ----------
const VISIBLE = () => Object.keys(MODES).filter(k => !MODES[k].hidden);
// Best outfits across every style, varied: caps how often one piece (other than the anchor) can show up, so a deck isn't
// twelve looks around the same pants and cap. A second, looser pass fills up if the closet is too small for the caps.
function varied(list, n, base = { Tops: 2, Layers: 2, Bottoms: 2, Shoes: 2, Accessories: 2 }) {
  const used = new Map(), out = [], sorted = list.sort((a, b) => b.score - a.score);
  // scarce kinds may repeat more (3 layers on a cold day can't cover 12 cards once each); plentiful ones stay at the base cap
  // need = how many of that kind n outfits use (a hat and a chain each = 2 accessories per card), own = how many different ones exist
  const of = (o, cat) => o.items.filter(p => p.cat === cat && p !== o.anchor);
  const own = cat => new Set(list.flatMap(o => of(o, cat).map(p => p.id))).size || 1, need = cat => n * list.reduce((t, o) => t + of(o, cat).length, 0) / (list.length || 1);
  const caps = Object.fromEntries(Object.entries(base).map(([c, v]) => [c, Math.max(v, Math.ceil(need(c) / own(c)))]));
  for (const cap of [caps, null]) for (const o of sorted) {
    if (out.length === n) return out;
    if (out.includes(o)) continue;
    const main = o.items.filter(p => p !== o.anchor);
    if (cap && main.some(p => (used.get(p.id) ?? 0) >= (cap[p.cat] ?? 2))) continue;
    out.push(o); main.forEach(p => used.set(p.id, (used.get(p.id) ?? 0) + 1));
  }
  return out;
}
const collect = (items, opts, modes = VISIBLE(), per = 10) => {
  const best = new Map();
  for (const m of modes) for (const o of generate(items, m, { n: per, ...opts })) if ((best.get(o.key)?.score ?? -99) < o.score) best.set(o.key, { ...o, mode: m, anchor: opts.anchor });
  return [...best.values()];
};
export const madeWith = (items, anchor, n = 5) => varied(collect(items, { anchor }), n);
// Builder's "see outfit possibilities": complete looks that keep every piece you've already picked.
export const possibilities = (items, picked, n = 6) => varied(collect(items, { fixed: picked }).map(o => ({ ...o, anchor: null })), n, { Tops: 2, Layers: 2, Bottoms: 2, Shoes: 2, Accessories: 2 });

// What the weather rules out. t = feels-like °C, null = unknown (nothing ruled out). rain: no suede.
export function forWeather(items, t, rain = false) {
  if (rain) items = items.filter(p => p.material !== 'suede' && !/suede/i.test(p.name ?? ''));
  if (t == null) return items;
  const k = p => `${p.kind ?? ''} ${p.name ?? ''}`;
  if (t >= 24) return items.filter(p => !/coat|puffer|parka|sweater|hoodie|knit|beanie|boot/i.test(k(p)) && (p.cat !== 'Layers' || /overshirt|flannel|shirt/i.test(k(p))));
  if (t < 12) return items.filter(p => !/short|tank|sandal|slipper|flip/i.test(k(p)));
  return items.filter(p => !/puffer|parka/i.test(k(p)));
}
// Today: n varied outfits from every style, a little random so each visit (or Shuffle) is different. Cold days want a layer.
// Occasions: how dressed up (0-2) and which vibe fits. A look scores by how close it lands.
export const OCCASIONS = { work: { label: 'Work', dress: 2 }, date: { label: 'Date', dress: 1.5 }, club: { label: 'Club', dress: 1, vibe: 'streetwear' }, errands: { label: 'Errands', dress: 0.8 }, gym: { label: 'Gym', dress: 0, vibe: 'athletic' } };
export const occasionFit = (ps, occ) => { const o = OCCASIONS[occ]; if (!o) return 0; const cl = ps.filter(p => CLOTHES.includes(p.cat)), avg = cl.reduce((t, p) => t + dress(p), 0) / cl.length;
  return -Math.abs(avg - o.dress) * 1.5 + (o.vibe ? vibe(ps, o.vibe) * 0.3 : 0); };
const likeness = (ps, like) => { if (!like?.length) return 0; const cn = p => colorName(p.color), lc = new Set(like.filter(p => p.cat !== 'Accessories').map(cn)), lk = new Set(like.map(p => p.kind));
  return Math.min(1.2, ps.filter(p => p.cat !== 'Accessories' && lc.has(cn(p))).length * 0.25 + ps.filter(p => lk.has(p.kind)).length * 0.15); };
export function today(items, { t = null, rain = false, occasion = null, n = 5, rand = Math.random, skip = [], like = null } = {}) {
  // skip: what you wore yesterday. Tops and layers rest a day; pants and shoes can repeat.
  const pool = forWeather(items, t, rain).filter(p => !(skip.includes(p.id) && (p.cat === 'Tops' || p.cat === 'Layers'))), cold = t != null && t < 12 && pool.some(p => p.cat === 'Layers');
  const list = collect(pool, { rand, layerOdds: cold ? 1 : t != null && t >= 24 ? 0.15 : 0.5 }, VISIBLE(), 30).filter(o => !cold || o.items.some(p => p.cat === 'Layers'));
  // a new top every card, pants and shoes at most twice, the same cap or chain at most twice. Jackets may repeat: you wear the same coat all week.
  return varied(list.map(o => ({ ...o, score: o.score + occasionFit(o.items, occasion) + likeness(o.items, like) + rand() * 1.5 })), n, { Tops: 1, Layers: n, Bottoms: 2, Shoes: 2, Accessories: 2 });
}

// Every rule that scored a look, biggest first: the builder's "Why?". null = no style rule takes it.
export function explain(ps) {
  const b = bestMode(ps); if (b?.score == null) return null;
  const ech = echoes(ps), base = MODES[b.mode].score(ps, {}) ?? MODES[b.mode].score(ps.filter(p => !ech.some(e => e.p === p)), {}) ?? 0, tb = taste(ps) ?? 0;
  const rows = [[`Color rule: ${MODES[b.mode].label}`, base], ...[...proportion(ps).list, ...style(ps)].map(([v, l]) => [l, v]),
    ...ech.slice(0, 2).map(e => [`${e.p.name} picks up the ${colorName(e.p.color)} in the ${e.from.name}`, 0.7]),
    [`Finished with ${ps.filter(p => p.cat === 'Accessories').length} accessor${ps.filter(p => p.cat === 'Accessories').length === 1 ? 'y' : 'ies'}`, Math.min(2, ps.filter(p => p.cat === 'Accessories').length) * 0.3],
    [tb > 0 ? 'You wear these together' : 'Close to looks you passed on', tb]];
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
