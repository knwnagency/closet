// Before shipping a rule change: compare the rules in this folder with the last commit (or any git ref) on your real pieces.
// node rules-check.mjs [ref] [backup.json]   (defaults: HEAD, the newest closet-backup*.json in hauls/)
// Prints: looks you saved or wore that now fail, pattern-on-pattern per day, how much the Best tab moved, which reasons show up more or less.
import { execSync } from 'child_process';
import { mkdtempSync, writeFileSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url)), ref = process.argv[2] ?? 'HEAD';
const old = mkdtempSync(join(tmpdir(), 'rules-'));
for (const f of ['match.js', 'style.js']) writeFileSync(join(old, f), execSync(`git show ${ref}:${f}`, { cwd: here }));
const A = await import(join(old, 'match.js')), B = await import(join(here, 'match.js'));

const backups = readdirSync(join(here, 'hauls')).filter(f => /^closet-backup.*\.json$/.test(f)).map(f => join(here, 'hauls', f));
const file = process.argv[3] ?? backups.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0];
if (!file) { console.log('No backup in hauls/. Save one from the app (Me › Settings › Backup) and put it there.'); process.exit(1); }
const b = JSON.parse(readFileSync(file, 'utf8')), items = b.items.map(({ img, photo, ...i }) => i), byId = new Map(items.map(i => [i.id, i]));
console.log(`${file.split('/').pop()} · ${items.length} pieces · rules now vs ${ref}\n`);

// 1. Your own looks must never start failing
const looks = [...(b.outfits ?? []), ...(b.log ?? [])].map(r => r.ids.map(id => byId.get(id)).filter(Boolean)).filter(ps => B.complete(ps));
let lost = 0; for (const ps of looks) if (A.bestMode(ps)?.score != null && B.bestMode(ps)?.score == null) { lost++; console.log('  NOW FAILS:', ps.map(p => p.name).join(' + ')); }
console.log(`Your saved and worn looks: ${looks.length} · now failing: ${lost}${lost ? '  ← fix before shipping' : ''}`);

// 2. A simulated month of Today (cold season, 10°C), same random seed for both
const month = M => { let seed = 11; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647; return Array.from({ length: 30 }, () => M.today(items, { n: 12, rand, t: 10, season: 'cold' })); };
const ma = month(A), mb = month(B), pat = M => d => d.filter(o => o.items.filter(p => ['Tops', 'Layers', 'Bottoms'].includes(p.cat) && M.patternOf(p) === 'allover').length >= 2).length;
const pa = ma.map(pat(A)), pb = mb.map(pat(B));
console.log(`Pattern on pattern, 30 days: before ${pa.reduce((x, y) => x + y, 0)} (max ${Math.max(...pa)}/day) · now ${pb.reduce((x, y) => x + y, 0)} (max ${Math.max(...pb)}/day)`);

// 3. Best tab
const ta = A.topLooks ? A.topLooks(items, 20).map(o => o.key) : [], tb = B.topLooks(items, 20).map(o => o.key);
console.log(`Best tab: ${tb.filter(k => ta.includes(k)).length} of ${tb.length} looks unchanged`);

// 4. Which reasons show up, before vs now (the stem before " with", "·" or ":")
const count = (M, m) => { const c = {}; for (const d of m) for (const o of d) for (const [, n] of M.style(o.items)) { const k = n.replace(/ with .*| · .*|:.*|, .*/, ''); c[k] = (c[k] ?? 0) + 1; } return c; };
const ca = count(A, ma), cb = count(B, mb), keys = [...new Set([...Object.keys(ca), ...Object.keys(cb)])].filter(k => (ca[k] ?? 0) !== (cb[k] ?? 0));
const looksN = mb.flat().length;
console.log(`\nReasons that changed (out of ${looksN} looks):`);
for (const k of keys.sort((x, y) => Math.abs((cb[y] ?? 0) - (ca[y] ?? 0)) - Math.abs((cb[x] ?? 0) - (ca[x] ?? 0))).slice(0, 15))
  console.log(`  ${k.padEnd(48)} ${String(ca[k] ?? 0).padStart(4)} → ${String(cb[k] ?? 0).padStart(4)}${(cb[k] ?? 0) / looksN > 0.2 ? '  ← on more than 1 look in 5' : ''}`);
