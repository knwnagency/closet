// node closet/match.test.mjs
import assert from 'node:assert/strict';
import { streaks, prevDay, badges } from './progress.js';
import { isNeutral, colorName, hueDist, scoreOutfit, generate, proportion, harmony, hslToHex, gaps, tryPiece, isHat, rankSwaps, bestMode, extractPalette, flatLayout, closestOwned, packTrip, echoes, accentsOf } from './match.js';
import { cleanAlpha } from './cutout.js';

assert.equal(isNeutral('#000000'), true);
assert.equal(isNeutral('#1c2541'), true, 'navy is neutral');
assert.equal(isNeutral('#c8b18b'), true, 'khaki is neutral');
assert.equal(isNeutral('#d62828'), false, 'red is a color');
assert.equal(colorName('#d62828'), 'red');
assert.equal(colorName('#1c2541'), 'navy');
assert.equal(hueDist(350, 10), 20);

const it = (id, cat, color, x = {}) => ({ id, cat, color, name: id, ...x });
const white = it('tee', 'Tops', '#f4f4f4');
const black = it('jeans', 'Bottoms', '#151515');
const orange = it('jacket', 'Layers', '#e8731c');
const blue = it('kicks', 'Shoes', '#1c6fe8', { kind: 'sneakers' });
const red = it('cap', 'Accessories', '#d62828');

// 2 neutrals + orange + its complement (blue)
assert.ok(scoreOutfit([white, black, orange, blue], 'formula').score > 0);
assert.equal(scoreOutfit([white, black, orange, red], 'formula'), null, 'orange+red are not complements');
assert.equal(scoreOutfit([white, black, orange, blue], 'classic'), null, 'classic allows one accent max');
assert.ok(scoreOutfit([white, black, blue], 'street') != null);

// proportions
const wide = it('wide', 'Bottoms', '#151515', { fit: 2 }), skinny = it('skinny', 'Bottoms', '#151515', { fit: 0 });
const chunky = it('chunky', 'Shoes', '#eeeeee', { fit: 2, kind: 'sneakers' }), sleek = it('sleek', 'Shoes', '#111111', { fit: 0, kind: 'loafers' });
const boxy = it('boxy', 'Tops', '#f4f4f4', { fit: 2 }), slimJacket = it('sj', 'Layers', '#222222', { fit: 0 });
assert.equal(scoreOutfit([white, wide, sleek], 'classic'), null, 'wide pants + sleek shoes is vetoed');
assert.ok(scoreOutfit([white, wide, chunky], 'classic').score > scoreOutfit([white, skinny, chunky], 'classic').score, 'chunky shoes belong with wide pants');
assert.equal(scoreOutfit([boxy, skinny, sleek, slimJacket], 'classic'), null, 'slim layer over baggy top is vetoed');
assert.match(proportion([boxy, skinny, sleek]).note, /Volume up top|Slim line/);

// color wheel
assert.equal(hslToHex(0, 1, 0.5), '#ff0000');
assert.deepEqual(harmony(30, 1, 0.5, 'complementary').map(c => c.h), [30, 210]);
assert.ok(generate([white, black, orange, blue], 'palette', { palette: [30, 210] }).length, 'palette mode finds orange + blue');

assert.match(generate([white, wide, sleek], 'classic').blocked, /swallowed/, 'empty result explains the deal-breaker');

assert.equal(generate([white, wide, sleek], 'formula').blocked, undefined, 'color failure is not blamed on proportions');

const closet = [white, black, orange, blue, red];
assert.deepEqual(generate([white, black], 'classic'), [], 'no shoes, no outfits');
const ideas = generate(closet, 'formula', { anchor: orange });
assert.ok(ideas.length && ideas.every(o => o.items.includes(orange)));
// wardrobe gaps
assert.equal(gaps([white, black])[0].ghost.cat, 'Shoes', 'no shoes → shoes are the #1 gap');
const g = gaps(closet);
assert.ok(g.length && g.every(x => x.examples.every(o => o.items.includes(x.ghost))), 'examples include the ghost');
assert.ok(!g.some(x => x.ghost.cat === 'Tops' && x.ghost.fit === 1 && /white/.test(x.ghost.name)), 'never suggests what you own');
assert.ok(tryPiece([white, black], { id: 'w', cat: 'Shoes', color: '#eeeeee', name: 'White sneakers' }).count > 0, 'wishlist piece gets a fit count');
assert.ok(!gaps([white, wide, chunky]).some(x => x.ghost.cat === 'Bottoms' && x.ghost.fit !== 2), 'only wide pants owned → only wide pants suggested');
assert.ok(gaps(closet).every(x => !/cyan|lime|magenta|yellow|pink/.test(x.ghost.name)), 'no neon suggestions');
assert.equal(colorName('#6d2232'), 'burgundy'); assert.equal(colorName('#5a3a33'), 'brown'); assert.equal(colorName('#9a4a2a'), 'rust'); assert.equal(colorName('#b08a5a'), 'camel');

// hats + accessories make it into fits
const hat = it('cap', 'Accessories', '#151515', { kind: 'baseball cap' }), chain = it('chain', 'Accessories', '#c0c0c0', { kind: 'chain necklace' });
assert.ok(isHat(hat) && !isHat(chain));
const withAcc = generate([white, black, chunky, hat, chain], 'street', { n: 99 });
assert.ok(withAcc.some(o => o.items.includes(hat) && o.items.includes(chain)), 'a fit can carry a hat AND a chain');
assert.ok(withAcc[0].items.some(p => p.cat === 'Accessories'), 'the top-ranked fit is accessorized');

// builder: swapping shoes ranks what works first, rule-breakers last
const swaps = rankSwaps([white, wide, chunky, sleek], [white, wide, chunky], 'Shoes');
assert.equal(swaps[0].item, chunky); assert.equal(swaps.at(-1).score, null, 'sleek shoes under wide pants break every rule');
assert.equal(bestMode([white, wide, sleek]).score, null);

// inspo: palette from pixels, then fits in those colors (all-neutral inspo works too)
const pal = extractPalette([...Array(60).fill([200, 30, 30]), ...Array(40).fill([20, 20, 20])]);
assert.deepEqual(pal.map(c => c.hex), ['#c81e1e', '#141414']); assert.equal(pal[0].share, 0.6);
const greyFit = generate([white, black, chunky, orange], 'inspo', { inspo: ['#151515', '#f2f2f2', '#e9e9e9'], n: 99 });
assert.ok(greyFit.length && greyFit.every(o => !o.items.includes(orange)), 'black/white inspo → no orange jacket');

// variety: ideas spread across your pieces instead of one star item in every fit
const many = [...['#151515', '#f4f4f4', '#8c8c8c'].map((c, i) => it('t' + i, 'Tops', c)), ...['#151515', '#2b2b2b', '#5b5f3a', '#d8c3a0'].map((c, i) => it('b' + i, 'Bottoms', c)), chunky, it('s2', 'Shoes', '#151515', { kind: 'sneakers' })];
assert.ok(new Set(generate(many, 'classic', { n: 6 }).map(o => o.items.find(p => p.cat === 'Bottoms').id)).size >= 3, 'top 6 ideas use at least 3 different pants');

// accessories rotate: with one cap and one chain, neither shows up in more than 3 of 12 ideas
{ const ts = ['#151515', '#f4f4f4', '#8c8c8c', '#2b2b2b'].map((c, i) => it('t' + i, 'Tops', c)), bs = ['#151515', '#2b2b2b', '#d8c3a0', '#5b5f3a'].map((c, i) => it('b' + i, 'Bottoms', c));
  const fits = generate([...ts, ...bs, chunky, it('s2', 'Shoes', '#151515', { kind: 'sneakers' }), hat, chain], 'classic', { n: 12, tries: 3000 });
  assert.ok(fits.filter(o => o.items.includes(hat)).length <= 3 && fits.filter(o => o.items.includes(chain)).length <= 3, 'accessories capped per feed'); }

// flat-lay: every combination of slots fits the card and nothing overlaps
for (let mask = 0; mask < 8; mask++) {
  const slots = ['Tops', 'Bottoms', 'Shoes', ...['Layers', 'Hat', 'Accessory'].filter((_, i) => mask >> i & 1)], L = flatLayout(slots), bx = Object.values(L);
  assert.deepEqual(Object.keys(L).sort(), slots.sort());
  assert.ok(bx.every(([x, y, w, h]) => x >= 0 && y >= 0 && x + w <= 100 && y + h <= 100), 'inside the card');
  for (const a of bx) for (const b of bx) if (a !== b) assert.ok(a[0] + a[2] <= b[0] || b[0] + b[2] <= a[0] || a[1] + a[3] <= b[1] || b[1] + b[3] <= a[1], `overlap in ${slots}`);
  assert.ok(L.Hat ? L.Hat[2] < L.Tops[2] * 0.7 : true, 'a cap is smaller than a tee');
}

// shop the look: nearest color in the same slot, nothing when too far
{ const navy = it('n', 'Bottoms', '#1c2541', { fit: 2 }), khaki = it('k', 'Bottoms', '#c8b18b', { fit: 1 });
  assert.equal(closestOwned([navy, khaki, white], { cat: 'Bottoms', color: '#202a48', fit: 2 }), navy);
  assert.equal(closestOwned([navy, khaki], { cat: 'Bottoms', color: '#d62828' }), null, 'red pants: you have nothing close');
  assert.equal(closestOwned([hat, chain], { cat: 'Accessories', kind: 'baseball cap', color: '#101010' }), hat, 'a cap only matches caps'); }

// packing: 5 days from a small closet uses few pieces, tops rotate, every day has a complete fit
{ const ts = ['#151515', '#f4f4f4', '#8c8c8c', '#2b2b2b', '#d8c3a0'].map((c, i) => it('pt' + i, 'Tops', c)), bs = ['#151515', '#5b5f3a', '#1c2541'].map((c, i) => it('pb' + i, 'Bottoms', c));
  const all = [...ts, ...bs, chunky, it('ps', 'Shoes', '#151515', { kind: 'sneakers' })];
  const { fits, pieces } = packTrip(all, 5, { rand: (() => { let s = 7; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32; })() });
  assert.equal(fits.length, 5); assert.ok(fits.every(o => ['Tops', 'Bottoms', 'Shoes'].every(c => o.items.some(p => p.cat === c))));
  assert.ok(pieces.length <= 9, `packed ${pieces.length} pieces`); assert.ok(new Set(fits.map(o => o.items.find(p => p.cat === 'Tops').id)).size >= 3, 'tops rotate');
  assert.equal(packTrip([white, black, blue], 4).fits.length, 4, 'one possible fit still covers 4 days'); }

// print colors: a red cap picks up the red in a black graphic tee — boosts the fit, names it, and doesn't count as an extra loud color
{ const tee = it('gt', 'Tops', '#151515', { patterned: true, accents: ['#c8202a', '#f2f2f2'] }), redCap = it('rc', 'Accessories', '#c4232c', { kind: 'baseball cap' }), greenCap = it('gc', 'Accessories', '#2e8b3a', { kind: 'baseball cap' });
  assert.equal(echoes([tee, black, chunky, redCap]).length, 1); assert.equal(echoes([tee, black, chunky, greenCap]).length, 0);
  assert.equal(echoes([it('wt', 'Tops', '#121111', { accents: ['#3f3736'] }), black, chunky, it('dk', 'Accessories', '#3a3a33', { kind: 'baseball cap' })]).length, 0, 'grey wash on a black tee is not a print color');
  assert.equal(echoes([it('hd', 'Tops', '#0e0b0c', { accents: ['#42302b', '#c59c7b'] }), black, chunky, it('as', 'Accessories', '#294c36', { kind: 'baseball cap' })]).length, 0, 'dark brown print ≠ forest green cap');
  const r = scoreOutfit([tee, black, chunky, redCap], 'street'), g = scoreOutfit([tee, black, chunky, greenCap], 'street');
  assert.ok(r.score > g.score && /picks up the red/.test(r.note), r.note);
  const blueTee = it('bt', 'Tops', '#1c6fe8', { accents: ['#e8731c'] }), orangeCap = it('oc', 'Accessories', '#e2701f', { kind: 'baseball cap' });
  assert.ok(scoreOutfit([blueTee, black, chunky, orangeCap], 'classic'), 'classic allows it: the cap belongs to the tee\'s palette');
  assert.deepEqual(accentsOf([{ hex: '#151515', share: 0.8 }, { hex: '#1e1e1e', share: 0.1 }, { hex: '#c8202a', share: 0.06 }, { hex: '#c42530', share: 0.03 }], '#151515'), ['#c8202a'], 'shading and near-duplicates dropped'); }

const t0 = performance.now(); gaps([...closet, ...closet.map(i => ({ ...i, id: i.id + 2 })), ...closet.map(i => ({ ...i, id: i.id + 3 }))]);
console.log(`gaps on 15 items: ${Math.round(performance.now() - t0)}ms`);
// streaks + badges
const L = days => days.map((day, i) => ({ day, key: 'o' + i, ids: [], mode: 'classic' }));
assert.equal(prevDay('2026-03-01'), '2026-02-28');
assert.deepEqual([streaks(L(['2026-11-06', '2026-11-07', '2026-11-08']), '2026-11-08').cur, streaks(L(['2026-11-06', '2026-11-07']), '2026-11-08').cur], [3, 2], 'streak alive until today ends');
assert.equal(streaks(L(['2026-11-05', '2026-11-06']), '2026-11-08').cur, 0, 'missed a day breaks it');
assert.equal(streaks(L(['2026-10-01', '2026-10-02', '2026-10-03', '2026-11-08']), '2026-11-08').best, 3);
const bs = badges({ items: closet, log: L(['2026-11-06', '2026-11-07', '2026-11-08']), saved: [] }, '2026-11-08');
assert.deepEqual(bs.filter(b => b.done).map(b => b.id), ['first', 'streak3'], 'first fit + 3-day streak');

// cutout: 20x10 canvas — tee (8x8 solid), shoe pair (two 3x3), haze (alpha 60), ruler strip (1x10)
{
  const w = 20, h = 10, d = new Uint8ClampedArray(w * h * 4), set = (x, y, a) => { d[(y * w + x) * 4 + 3] = a; };
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) set(x, y, 60);          // haze everywhere
  for (let y = 1; y < 9; y++) for (let x = 1; x < 9; x++) set(x, y, 200);         // the piece (semi-solid)
  for (let y = 0; y < h; y++) set(19, y, 255);                                    // ruler: 10px blob, 1/6 of the piece
  const kept = cleanAlpha(d, w, h), a = (x, y) => d[(y * w + x) * 4 + 3];
  assert.equal(a(4, 4), 255); assert.equal(a(0, 0), 0); assert.equal(a(19, 5), 0); // piece solid, haze + ruler gone
  assert.equal(kept, 60 / 200, 'round trim takes the 4 corner pixels, not a square chunk');
  assert.ok(a(1, 4) > 0 && a(1, 4) < 255, 'edges are feathered');
  const shoes = () => { const e = new Uint8ClampedArray(w * h * 4); for (let y = 2; y < 5; y++) for (let x = 2; x < 5; x++) { e[(y * w + x) * 4 + 3] = 255; e[(y * w + x + 10) * 4 + 3] = 255; } return e; };
  assert.equal(cleanAlpha(shoes(), w, h), 18 / 200, 'both shoes of a pair survive');
  assert.equal(cleanAlpha(shoes(), w, h, { pieces: 1 }), 9 / 200, 'a tee photo keeps one piece, not the bag beside it');
}
{ // hole fill: a light logo the model read as table gets filled; a chain's open links don't
  const w = 40, h = 40, mk = () => { const d = new Uint8ClampedArray(w * h * 4); for (let y = 5; y < 35; y++) for (let x = 5; x < 35; x++) if (!(x >= 18 && x < 22 && y >= 18 && y < 22)) d[(y * w + x) * 4 + 3] = 255; return d; };
  const d = mk(); cleanAlpha(d, w, h, { trim: 0 }); assert.equal(d[(20 * w + 20) * 4 + 3], 255, 'hole filled');
  const c = mk(); cleanAlpha(c, w, h, { trim: 0, fill: false }); assert.equal(c[(20 * w + 20) * 4 + 3], 0, 'fill off for chains');
}
{ // 30x20 (trim radius 1): a ruler glued to the piece gets trimmed; a thin chain is left alone
  const w = 30, h = 20, mk = () => new Uint8ClampedArray(w * h * 4), on = (d, x, y) => { d[(y * w + x) * 4 + 3] = 255; };
  const d = mk();
  for (let y = 2; y < 14; y++) for (let x = 2; x < 14; x++) on(d, x, y);         // 12x12 piece
  for (let y = 0; y < h; y++) { on(d, 14, y); on(d, 15, y); }                     // 2px ruler touching its right edge
  cleanAlpha(d, w, h); const a = (x, y) => d[(y * w + x) * 4 + 3];
  assert.equal(a(7, 7) + a(7, 2) + a(13, 7), 510 + a(7, 2), 'piece intact');
  assert.ok(a(7, 2) > 0 && a(2, 2) < 255, 'edge kept, corner softened');
  assert.equal(a(14, 0) + a(15, 19) + a(14, 17), 0, 'ruler sticking out past the piece is trimmed');
  const c = mk();
  for (let x = 2; x < 28; x++) { on(c, x, 5); on(c, x, 6); }                      // chain: 2px thick everywhere
  assert.equal(cleanAlpha(c, w, h), 52 / 600, 'thin piece not eaten by the trim');
}
console.log('match.js ok');

// swatches name themselves; teal-ish green jacket reads green; multi-vibe counts
{
  const m = await import('./match.js');
  for (const [n, h] of Object.entries(m.SWATCHES)) assert.equal(m.colorName(h), n, `swatch ${n}`);
  assert.equal(m.colorName('#3e7a6c'), 'green');
  assert.equal(m.FITS.Tops[2], 'Oversized');
}
console.log('colors ok');
{
  const m = await import('./match.js');
  assert.equal(m.colorName('#2a2929'), 'black', 'washed black tee');
  assert.equal(m.colorName('#2d2d2c'), 'black');
  assert.equal(m.colorName('#7d7b78'), 'grey');
  const cap = { id: 'c', cat: 'Accessories', name: 'Vuja De cap', kind: 'baseball cap', color: '#5b3e2a' };
  assert.equal(m.closestOwned([cap], { cat: 'Accessories', kind: 'beanie', name: 'Grey beanie', color: '#808080' }), null, 'brown cap is not a grey beanie');
}
console.log('qa2 ok');
{
  const m = await import('./match.js');
  // green jacket with a brown collar: the collar is an accent, the dark-green shadow is not
  assert.deepEqual(m.accentsOf([{ hex: '#0f3d2e', share: 0.2 }, { hex: '#4a3a30', share: 0.06 }], '#3e7a6c'), ['#4a3a30']);
  const it = (id, cat, color, x = {}) => ({ id, cat, color, name: id, ...x });
  const crop = m.proportion([it('t', 'Tops', '#f4f4f4', { fit: 3 }), it('b', 'Bottoms', '#222', { fit: 2 }), it('s', 'Shoes', '#eee', { fit: 2 })]);
  assert.ok(crop.score > 0 && !crop.veto, 'cropped top + wide pants works');
  assert.equal(m.FITS.Tops[3], 'Cropped');
}
console.log('fit+accents ok');
{
  const m = await import('./match.js');
  const cap = { id: 'c', cat: 'Accessories', name: 'Vuja De cap', kind: 'baseball cap', color: '#51342a' };
  assert.equal(m.closestOwned([cap], { cat: 'Accessories', kind: 'beanie', color: '#402d2d' }), null, 'brown cap is not a black beanie');
}
console.log('shop ok');
{
  const m = await import('./match.js'), S = await import('./style.js');
  const it = (id, cat, color, x = {}) => ({ id, cat, color, name: id, ...x });
  // every combo word maps to real app color names
  const real = new Set(Object.keys(m.SWATCHES).concat('lime', 'magenta'));
  for (const c of S.COMBOS) for (const w of c.split(':')[0].split('+')) for (const n of (S.ALIAS[w.trim()] ?? w.trim()).split('|')) assert.ok(real.has(n), `combo word "${w}" in "${c}"`);
  for (const t of [S.JEANS, S.TROUSERS]) for (const [k, [, ws]] of Object.entries(t)) { assert.ok(real.has(k), k); for (const w of ws.split('+')) assert.ok(S.ALIAS[w.trim()], `pairing word ${w}`); }
  const forest = it('f', 'Tops', m.SWATCHES.forest), cream = it('c', 'Bottoms', m.SWATCHES.beige, { kind: 'trousers' }), wshoe = it('s', 'Shoes', m.SWATCHES.white, { kind: 'sneakers' });
  assert.match(m.combo([forest, cream, wshoe]).label, /grounded/);
  const r = m.scoreOutfit([forest, cream, wshoe], 'combos');
  assert.ok(r && /Forest \+ cream/.test(r.note), 'combos mode + vibe note');
  assert.equal(m.scoreOutfit([forest, it('p', 'Bottoms', m.SWATCHES.pink), wshoe], 'combos'), null, 'forest + pink is not in the book');
  // all black = monochrome combo, shoes ignored
  assert.match(m.combo([it('t', 'Tops', '#151515'), it('b', 'Bottoms', '#1b1a19'), wshoe]).label, /confident/);
  // dark wash jeans + burgundy tee is a listed pairing
  const dark = it('j', 'Bottoms', '#2c3d5a', { kind: 'jeans' }); // real dark wash, reads navy
  assert.ok(m.style([it('t', 'Tops', m.SWATCHES.burgundy), dark, wshoe]).some(([, n]) => /Dark wash jeans with burgundy/.test(n)));
  // double denim: one wash apart is marked down, far apart is fine
  const mid = it('mj', 'Layers', m.SWATCHES.denim, { kind: 'denim jacket' }), light = it('lj', 'Layers', '#a9c4dd', { kind: 'denim jacket' });
  const tee = it('t', 'Tops', m.SWATCHES.white);
  assert.ok(m.style([tee, mid, dark, wshoe]).some(([s]) => s < 0), 'mid jacket + dark jeans = near miss');
  assert.ok(m.style([tee, light, dark, wshoe]).some(([s, n]) => s > 0 && /far apart/.test(n)), 'light jacket + dark jeans works');
  // builder hints
  assert.equal(m.fixTip([it('t', 'Tops', '#7d7b78'), it('b', 'Bottoms', m.SWATCHES.navy), it('s', 'Shoes', '#f6f5f1'), it('c', 'Accessories', '#151515')]), null, 'finished fit, no tip');
  assert.match(m.fixTip([it('t', 'Tops', '#7d7b78'), it('b', 'Bottoms', m.SWATCHES.navy), it('s', 'Shoes', '#f6f5f1')]), /Plain/);
  assert.match(m.combo([it('t', 'Tops', '#151515'), it('b', 'Bottoms', '#7d7b78'), it('s', 'Shoes', '#151515')]).label, /stoic/, 'grey reads as grey, not taupe');
  assert.equal(m.combo([it('t', 'Tops', m.SWATCHES.orange), it('b', 'Bottoms', '#7d7b78'), it('s', 'Shoes', m.SWATCHES.forest)]), null, 'combo must explain the orange top');
  assert.match(m.fixTip([it('t', 'Tops', m.SWATCHES.red), it('b', 'Bottoms', m.SWATCHES.yellow), it('s', 'Shoes', m.SWATCHES.blue)]), /Busy|let one lead/);
}
console.log('style notes ok');
{
  const m = await import('./match.js'), c = await import('./cutout.js');
  const it = (id, cat, color, x = {}) => ({ id, cat, color, name: id, ...x });
  const tee = it('tee', 'Tops', '#f6f5f1', { kind: 't-shirt' }), hood = it('hood', 'Tops', '#151515', { kind: 'hoodie' });
  const zip = it('zip', 'Layers', '#7d7b78', { kind: 'hoodie' }), jkt = it('jkt', 'Layers', '#151515', { kind: 'jacket' });
  const pants = it('pants', 'Bottoms', '#151515', { kind: 'cargo pants' }), kicks = it('kicks', 'Shoes', '#f6f5f1', { kind: 'sneakers' });
  // layering ladder: no hoodie over a hoodie, no tee-weight layer over a jacket-weight top
  assert.ok(m.proportion([hood, zip, pants, kicks]).veto, 'two hoodies stacked');
  assert.ok(!m.proportion([tee, zip, pants, kicks]).veto, 'zip hoodie over a tee is fine');
  assert.ok(!m.proportion([hood, jkt, pants, kicks]).veto, 'jacket over a hoodie is fine');
  assert.ok(m.proportion([it('dj', 'Tops', '#4d6a8c', { kind: 'denim jacket' }), zip, pants, kicks]).veto, 'hoodie over a jacket');
  // dressy + sporty is allowed now (button-up with track pants)
  assert.ok(m.bestMode([it('b', 'Tops', '#f6f5f1', { vibe: 'formal' }), it('t', 'Bottoms', '#151515', { vibe: 'athletic' }), kicks]).score != null);
  // half-built outfits rank: baggy pants alone put chunky shoes above sleek ones
  const baggy = it('baggy', 'Bottoms', '#151515', { fit: 2 }), chunky = it('chunky', 'Shoes', '#f6f5f1', { fit: 2, kind: 'sneakers' }), sleek = it('sleek', 'Shoes', '#151515', { fit: 0, kind: 'loafers' });
  const r = m.rankSwaps([baggy, chunky, sleek], [baggy], 'Shoes');
  assert.equal(r[0].item.id, 'chunky'); assert.ok(r[0].score != null, 'chunky shoes score with baggy pants'); assert.equal(r.find(x => x.item.id === 'sleek').score, null, 'sleek shoes with baggy pants clash');
  // see what you can make: every look has the piece, varied
  const closet = [tee, hood, it('t2', 'Tops', '#7d7b78', { kind: 't-shirt' }), pants, it('p2', 'Bottoms', '#1e2a45', { kind: 'jeans' }), kicks, it('k2', 'Shoes', '#151515', { kind: 'boots' })];
  const made = m.madeWith(closet, pants);
  assert.ok(made.length >= 2 && made.every(o => o.items.includes(pants)), 'madeWith keeps the anchor');
  // weather: hot drops hoodies, cold drops shorts
  assert.ok(!m.forWeather(closet, 30).includes(hood)); assert.ok(m.forWeather([...closet, it('sh', 'Bottoms', '#151515', { kind: 'shorts' })], 5).every(p => p.kind !== 'shorts'));
  assert.ok(m.today(closet, { n: 5 }).length >= 2, 'today makes picks');
  // background by color: grey mat with a white tee in the middle → mat gone, tee kept
  const w = 40, h = 40, d = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4, inTee = x > 10 && x < 30 && y > 10 && y < 30, v = inTee ? 240 : 150 + (x % 3); d.set([v, v, v, 255], i); }
  c.floodOut(d, w, h, c.edge(w, h));
  assert.equal(d[(20 * w + 20) * 4 + 3], 255, 'tee stays'); assert.equal(d[3], 0, 'mat goes'); assert.equal(d[(5 * w + 35) * 4 + 3], 0);
}
{
  const c = await import('./cutout.js'), w = 40, h = 40, d = new Uint8ClampedArray(w * h * 4);
  // white 1px frame (old padding, ~5% of a real photo), grey mat, white tee: the frame alone would stop the fill
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const fr = x < 1 || y < 1 || x > 38 || y > 38, tee = x > 10 && x < 30 && y > 10 && y < 30, v = fr || tee ? 250 : 150; d.set([v, v, v, 255], (y * w + x) * 4); }
  c.keyOut(d, w, h);
  assert.equal(d[(20 * w + 20) * 4 + 3], 255, 'tee stays'); assert.equal(d[(5 * w + 5) * 4 + 3], 0, 'mat inside the frame goes');
}
console.log('redesign ok');
{
  const m = await import('./match.js');
  const it = (id, cat, color, x = {}) => ({ id, cat, color, name: id, ...x });
  const t1 = it('t1', 'Tops', '#151515'), t2 = it('t2', 'Tops', '#7d7b78'), b = it('b', 'Bottoms', '#151515'), s = it('s', 'Shoes', '#f6f5f1', { kind: 'sneakers' });
  const base = m.scoreOutfit([t1, b, s], 'classic').score;
  m.setTaste({ liked: [['t1', 'b', 's']] });
  assert.ok(m.scoreOutfit([t1, b, s], 'classic').score > base, 'a favorite pairing scores higher');
  m.setTaste({ nope: [['t1', 'b', 's']] });
  assert.equal(m.scoreOutfit([t1, b, s], 'classic'), null, '"not for me" never comes back');
  assert.ok(m.scoreOutfit([t2, b, s], 'classic').score < m.scoreOutfit([t2, it('b2', 'Bottoms', '#151515'), s], 'classic').score + 0.01, 'disliked pair (b+s) weighs on other looks too');
  m.setTaste();
  assert.equal(m.knownFit({ cat: 'Shoes', name: 'Air Force 1 white' }), 1); assert.equal(m.knownFit({ cat: 'Shoes', name: 'Yeezy 500' }), 2);
  assert.equal(m.knownFit({ cat: 'Shoes', name: 'Black loafers' }), 0); assert.equal(m.knownFit({ cat: 'Tops', name: 'Dunk tee' }), null);
  const picks = m.today([t1, t2, b, s], { skip: ['t1'], n: 5 });
  assert.ok(picks.length && picks.every(o => !o.items.includes(t1)), "yesterday's top rests");
}
console.log('v2 ok');
{
  const c = await import('./cutout.js');
  // draw a tee: wide shoulders/sleeves band on top, narrower body below
  const W = 60, H = 60, img = () => new Uint8ClampedArray(W * H * 4), set = (d, x, y) => { d[(y * W + x) * 4 + 3] = 255; };
  const tee = (d, tf) => { for (let y = 10; y < 50; y++) for (let x = 2; x < 58; x++) { const sleeve = y < 22, body = x >= 18 && x < 42; if (sleeve || body) { const [X, Y] = tf(x, y); set(d, X, Y); } } };
  const up = img(); tee(up, (x, y) => [x, y]); assert.equal(c.orient(up, W, H, 'Tops'), 0, 'upright tee stays');
  const left = img(); tee(left, (x, y) => [y, W - 1 - x]); assert.equal(c.orient(left, W, H, 'Tops'), 1, 'shoulders on the left → turn clockwise');
  const right = img(); tee(right, (x, y) => [W - 1 - y, x]); assert.equal(c.orient(right, W, H, 'Tops'), 3);
  // pants: solid waist band, two legs with a gap
  const pants = (d, tf) => { for (let y = 2; y < 58; y++) for (let x = 15; x < 45; x++) { const waist = y < 18, leg = x < 27 || x >= 33; if (waist || leg) { const [X, Y] = tf(x, y); set(d, X, Y); } } };
  const pu = img(); pants(pu, (x, y) => [x, y]); assert.equal(c.orient(pu, W, H, 'Bottoms'), 0, 'upright pants stay');
  const pl = img(); pants(pl, (x, y) => [y, W - 1 - x]); assert.equal(c.orient(pl, W, H, 'Bottoms'), 1, 'waist on the left → turn clockwise');
}
console.log('orient ok');
{
  const m = await import('./match.js');
  const it = (id, cat, color, x = {}) => ({ id, cat, color, name: id, ...x });
  const shirt = it('shirt', 'Tops', '#f6f5f1', { kind: 'button-up shirt' }), trousers = it('tr', 'Bottoms', '#1b1a19', { kind: 'trousers' });
  const loafers = it('lf', 'Shoes', '#1b1a19', { kind: 'loafers', fit: 0 }), runners = it('rn', 'Shoes', '#f6f5f1', { kind: 'sneakers', name: 'foam runner', fit: 2 });
  const blazer = it('bz', 'Layers', '#1e2a45', { kind: 'blazer' }), hoodie = it('hd', 'Layers', '#7d7b78', { kind: 'hoodie' });
  // dress shirt pulls dress shoes and a sharp layer first
  const shoes = m.rankSwaps([shirt, trousers, loafers, runners], [shirt, trousers], 'Shoes');
  assert.equal(shoes[0].item.id, 'lf', 'dress shirt + trousers → loafers first');
  const layers = m.rankSwaps([shirt, trousers, loafers, blazer, hoodie], [shirt, trousers, loafers], 'Layers');
  assert.equal(layers[0].item.id, 'bz', 'dress shirt → blazer before hoodie');
  // one sporty piece is tension (+), many on both sides clash (−)
  const track = it('tp', 'Bottoms', '#1b1a19', { kind: 'sweatpants', name: 'track pants' });
  assert.ok(m.style([shirt, track, loafers]).some(([s, n]) => s > 0 && /One (dressy|sporty)/.test(n)));
  assert.ok(m.style([shirt, blazer, track, runners]).some(([s]) => s < 0), 'two dressy + two sporty fight');
  // materials, prints, palette
  assert.ok(m.style([{ ...shirt, material: 'linen' }, { ...trousers, material: 'wool' }, loafers]).some(([, n]) => /texture/.test(n)));
  assert.ok(m.style([{ ...shirt, patterned: true }, { ...trousers, patterned: true }, loafers]).some(([s, n]) => s < 0 && /prints/.test(n)));
  m.setTaste({ avoid: ['white'] }); assert.ok(m.style([shirt, trousers, loafers]).some(([s, n]) => s < 0 && /suit you/.test(n))); m.setTaste();
  // occasion: work prefers the dressy look
  assert.ok(m.occasionFit([shirt, trousers, loafers], 'work') > m.occasionFit([it('t', 'Tops', '#151515', { kind: 't-shirt' }), track, runners], 'work'));
  // rain drops suede
  assert.equal(m.forWeather([{ ...loafers, material: 'suede' }, runners], null, true).length, 1);
  // why: rows explain the total
  const e = m.explain([shirt, trousers, loafers]); assert.ok(e && e.rows.length >= 2 && e.rows.some(([l]) => /Color rule/.test(l)));
}
console.log('batch2 ok');
