// Clean up a background-removal mask in place. Pure, tested by match.test.mjs.
// The model leaves a see-through haze on flat tables and keeps rulers, tags, bags and specks.
//  1. haze goes (alpha below `cut`)
//  2. only the `pieces` biggest blobs survive, and only if at least `keep` × the biggest (a pair of shoes = 2, a tee = 1)
//  3. small enclosed holes (a light logo the model read as table) are filled — not on open pieces like chains
//  4. thin strips glued to the piece (a ruler touching a sneaker) are trimmed by a round opening;
//     skipped when it would eat a lot of the piece, because then the piece itself is thin (a chain) or lacy.
//  5. edges get a 1px inward feather so they don't stair-step
// Returns the fraction of pixels kept.
export function cleanAlpha(d, w, h, { cut = 128, keep = 0.25, trim = 0.025, pieces = Infinity, fill = true } = {}) {
  const n = w * h, m = new Uint8Array(n);
  for (let p = 0; p < n; p++) m[p] = d[p * 4 + 3] >= cut;
  let mask = bigBlobs(m, w, h, keep, pieces);
  if (fill) fillHoles(mask, w, h, 0.05); // first: an unsure model leaves lace (a cap brim) that the trim would chew up
  const r = Math.round(trim * Math.max(w, h));
  if (r > 0) {
    const core = bigBlobs(dist(mask, w, h, true).map(v => v > r), w, h, keep, pieces);
    const opened = dist(core, w, h, false).map((v, p) => v <= r && mask[p]);
    if (sum(opened) >= 0.8 * sum(mask)) mask = opened; // a ruler strip is a sliver; losing >20% means the piece itself was hit
  }
  for (let p = 0; p < n; p++) {
    if (!mask[p]) { d[p * 4 + 3] = 0; continue; }
    const x = p % w, y = (p - x) / w; let on = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx, yy = y + dy;
      on += xx >= 0 && yy >= 0 && xx < w && yy < h && mask[yy * w + xx];
    }
    d[p * 4 + 3] = Math.round(255 * Math.min(1, on / 8)); // interior (8+ neighbours on) stays solid
  }
  return sum(mask) / n;
}

const sum = a => a.reduce((t, v) => t + v, 0);

// Connected blobs (4-neighbour): labels + areas.
function blobs(m, w, h, want = 1) {
  const n = w * h, lab = new Int32Array(n), areas = [0], stack = [];
  for (let p = 0; p < n; p++) {
    if (lab[p] || m[p] !== want) continue;
    const id = areas.length; let c = 0;
    lab[p] = id; stack.push(p);
    while (stack.length) {
      const q = stack.pop(), x = q % w; c++;
      for (const s of [x > 0 ? q - 1 : -1, x < w - 1 ? q + 1 : -1, q - w, q + w])
        if (s >= 0 && s < n && !lab[s] && m[s] === want) { lab[s] = id; stack.push(s); }
    }
    areas.push(c);
  }
  return { lab, areas };
}

// Keep the `pieces` biggest blobs that are at least `keep` × the biggest one.
function bigBlobs(m, w, h, keep, pieces) {
  const { lab, areas } = blobs(Uint8Array.from(m), w, h), max = Math.max(0, ...areas);
  const ok = new Set(areas.map((a, i) => [a, i]).filter(([a, i]) => i && a >= max * keep).sort((a, b) => b[0] - a[0]).slice(0, pieces).map(([, i]) => i));
  return Uint8Array.from(lab, l => ok.has(l));
}

// Background pockets that don't touch the frame and are smaller than `max` × the piece become piece.
function fillHoles(mask, w, h, max) {
  const { lab, areas } = blobs(mask, w, h, 0), edge = new Set(), area = sum(mask);
  for (let x = 0; x < w; x++) edge.add(lab[x]).add(lab[(h - 1) * w + x]);
  for (let y = 0; y < h; y++) edge.add(lab[y * w]).add(lab[y * w + w - 1]);
  for (let p = 0; p < w * h; p++) if (lab[p] && !edge.has(lab[p]) && areas[lab[p]] < area * max) mask[p] = 1;
}

// Chamfer (3-4) distance, in pixels, to the nearest pixel that is `toOff` ? off : on. Near-round, unlike a square window.
// Off-frame counts as off, so a piece cut by the frame edge erodes from there too.
function dist(m, w, h, toOff) {
  const INF = 1e9, D = new Float64Array(w * h), at = (x, y) => x < 0 || y < 0 || x >= w || y >= h ? (toOff ? 0 : INF) : D[y * w + x];
  for (let p = 0; p < w * h; p++) D[p] = (toOff ? m[p] : !m[p]) ? INF : 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = y * w + x; if (!D[p]) continue;
    D[p] = Math.min(D[p], at(x - 1, y) + 3, at(x, y - 1) + 3, at(x - 1, y - 1) + 4, at(x + 1, y - 1) + 4);
  }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
    const p = y * w + x; if (!D[p]) continue;
    D[p] = Math.min(D[p], at(x + 1, y) + 3, at(x, y + 1) + 3, at(x + 1, y + 1) + 4, at(x - 1, y + 1) + 4);
  }
  return D.map(v => v / 3);
}

// Erase background by color: flood out from `seeds` through pixels that change smoothly (step) and stay near the seed color (far).
// For when the model keeps the whole photo (a white tee on a grey mat), and for Touch up's tap-to-erase. Sets alpha to 0 on what it reaches.
export function floodOut(d, w, h, seeds, { step = 18, far = 90 } = {}) {
  const n = w * h, seen = new Uint8Array(n), q = [];
  const diff = (a, b) => Math.abs(d[a * 4] - d[b * 4]) + Math.abs(d[a * 4 + 1] - d[b * 4 + 1]) + Math.abs(d[a * 4 + 2] - d[b * 4 + 2]);
  for (const s of seeds) {
    if (seen[s] || !d[s * 4 + 3]) continue;
    seen[s] = 1; q.push(s);
    while (q.length) {
      const p = q.pop(), x = p % w; d[p * 4 + 3] = 0;
      for (const m of [x > 0 ? p - 1 : -1, x < w - 1 ? p + 1 : -1, p - w, p + w])
        if (m >= 0 && m < n && !seen[m] && d[m * 4 + 3] && diff(m, p) < step && diff(m, s) < far) { seen[m] = 1; q.push(m); }
    }
  }
}
// Every pixel on the frame edge, as flood seeds.
export const edge = (w, h) => { const s = []; for (let x = 0; x < w; x++) s.push(x, (h - 1) * w + x); for (let y = 1; y < h - 1; y++) s.push(y * w, y * w + w - 1); return s; };
// Key the background out from the frame edges in. If that only peels off a thin frame (white padding from an earlier cutout),
// go again from just inside it. Only then: in a normal photo the first pass already took the background, and a second would eat the piece.
export function keyOut(d, w, h) {
  const n = w * h, gone = () => { let c = 0; for (let p = 0; p < n; p++) c += !d[p * 4 + 3]; return c / n; };
  floodOut(d, w, h, edge(w, h));
  if (gone() > 0.15) return;
  const rim = [];
  for (let p = 0; p < n; p++) { if (!d[p * 4 + 3]) continue; const x = p % w;
    if ((x > 0 && !d[(p - 1) * 4 + 3]) || (x < w - 1 && !d[(p + 1) * 4 + 3]) || (p >= w && !d[(p - w) * 4 + 3]) || (p < n - w && !d[(p + w) * 4 + 3])) rim.push(p); }
  floodOut(d, w, h, rim);
}

// Which way is up, from the cutout's shape (alpha). Returns quarter turns clockwise to stand it upright: 0, 1, 2 or 3. 0 when unsure.
// Only sideways (0, 1 or 3): a tee lies wider than tall with the shoulders the heavy end; pants are tall with a solid waist end and a gap
// between the legs at the other. ponytail: shape heuristics with safe margins; anything borderline stays as shot. Upside down: not detected.
export function orient(d, w, h, cat) {
  let x0 = w, x1 = -1, y0 = h, y1 = -1;
  const on = (x, y) => d[(y * w + x) * 4 + 3] > 128;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (on(x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  if (x1 < 0) return 0;
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
  const col = x => { let c = 0, a = -1, b = -1; for (let y = y0; y <= y1; y++) if (on(x, y)) { c++; if (a < 0) a = y; b = y; } return [c, a < 0 ? 0 : b - a + 1]; };
  const row = y => { let c = 0, a = -1, b = -1; for (let x = x0; x <= x1; x++) if (on(x, y)) { c++; if (a < 0) a = x; b = x; } return [c, a < 0 ? 0 : b - a + 1]; };
  const band = (f, from, to) => { let m = 0, fill = 0, n = 0; for (let i = from; i <= to; i++) { const [c, span] = f(i); m += c; if (span) { fill += c / span; n++; } } return { m, fill: n ? fill / n : 0 }; };
  const q = 0.25, ends = (f, a, b) => { const k = Math.max(1, Math.round((b - a + 1) * q)); return [band(f, a, a + k - 1), band(f, b - k + 1, b)]; };
  if (cat === 'Tops' || cat === 'Layers') {
    if (bh > bw * 1.25) { const [l, r] = ends(col, x0, x1); return l.m > r.m * 1.35 ? 1 : r.m > l.m * 1.35 ? 3 : 0; } // shoulders left → turn clockwise
    return 0; // upside down isn't readable from shape: a hood or a vest's narrow top fools it (tested on a real closet)
  }
  if (cat === 'Bottoms') {
    if (bw > bh * 1.2) { const [l, r] = ends(col, x0, x1); return l.fill > r.fill + 0.15 ? 1 : r.fill > l.fill + 0.15 ? 3 : 0; } // waist left → turn clockwise
    return 0;
  }
  return 0;
}

// Soften a ragged edge (after a color-keyed cut): average the alpha over 3×3, edge pixels only, `passes` times.
// Interior and empty pixels stay exactly as they are, so the piece never goes see-through.
export function smoothEdges(d, w, h, passes = 2) {
  for (let k = 0; k < passes; k++) {
    const a = new Uint8ClampedArray(w * h); for (let p = 0; p < w * h; p++) a[p] = d[p * 4 + 3];
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const p = y * w + x; let s = 0, lo = 255, hi = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const v = a[p + dy * w + dx]; s += v; lo = Math.min(lo, v); hi = Math.max(hi, v); }
      if (hi - lo > 64) d[p * 4 + 3] = Math.round(s / 9);
    }
  }
}

// One photo of a pile laid out flat (a bed of tees, a row of shoes) → a box per piece, in the mask's pixels, reading order.
// Blobs under `min` of the frame are specks. Blobs closer than `gap` × the long side merge: a pair of shoes is one piece.
// ponytail: pieces that touch come out as one box; the add sheet asks for a hand's width between them.
export function pileBoxes(alpha, w, h, { cut = 128, min = 0.012, gap = 0.025 } = {}) {
  const m = new Uint8Array(w * h); for (let p = 0; p < w * h; p++) m[p] = alpha[p] >= cut;
  const { lab, areas } = blobs(m, w, h), box = areas.map(() => [w, h, -1, -1]);
  for (let p = 0; p < w * h; p++) { const l = lab[p]; if (!l) continue; const x = p % w, y = (p - x) / w, b = box[l];
    if (x < b[0]) b[0] = x; if (y < b[1]) b[1] = y; if (x > b[2]) b[2] = x; if (y > b[3]) b[3] = y; }
  let out = box.filter((b, i) => i && areas[i] >= min * w * h).map(([x0, y0, x1, y1]) => ({ x0, y0, x1, y1 }));
  const g = gap * Math.max(w, h), near = (a, b) => a.x0 - g <= b.x1 && b.x0 - g <= a.x1 && a.y0 - g <= b.y1 && b.y0 - g <= a.y1;
  for (let merged = true; merged;) { merged = false;
    for (let i = 0; i < out.length && !merged; i++) for (let j = i + 1; j < out.length; j++) if (near(out[i], out[j])) {
      const a = out[i], b = out[j]; out[i] = { x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) }; out.splice(j, 1); merged = true; break; } }
  const row = Math.max(1, h / 6); // top row first, left to right, like you'd read the pile
  return out.sort((a, b) => Math.floor(a.y0 / row) - Math.floor(b.y0 / row) || a.x0 - b.x0).map(b => ({ x: b.x0, y: b.y0, w: b.x1 - b.x0 + 1, h: b.y1 - b.y0 + 1 }));
}
