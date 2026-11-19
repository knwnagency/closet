#!/usr/bin/env node
// Closet MCP server: lets Claude (Desktop or Code) read your closet and suggest outfits with the app's own rules (match.js + style.js).
// Your clothes live on your phone, so it reads your latest Export backup (closet-backup-*.json) from iCloud Drive, Downloads or closet/hauls.
// Everything stays on this Mac. Plain stdio JSON-RPC, no dependencies.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { MODES, FITS, colorName, isNeutral, generate, rankSwaps, bestMode, fixTip, madeWith, today, SLOTS } from '../match.js';

const here = dirname(fileURLToPath(import.meta.url)), home = homedir();
const DIRS = [process.env.CLOSET_BACKUP_DIR, join(home, 'Library/Mobile Documents/com~apple~CloudDocs/Fitted Backups'), join(home, 'Library/Mobile Documents/com~apple~CloudDocs'), join(home, 'Library/Mobile Documents/com~apple~CloudDocs/Downloads'),
  join(home, 'Downloads'), join(here, '../hauls')].filter(Boolean);

// Newest backup wins. Cached until the file changes.
let cache = { path: null, mtime: 0, data: null };
function load() {
  const files = DIRS.filter(existsSync).flatMap(d => readdirSync(d).filter(f => /^closet-backup.*\.json$/.test(f)).map(f => join(d, f)));
  if (!files.length) throw new Error(`No closet backup found. In the app: Me › Settings › Backup and sync › Save backup, then Save to Files › iCloud Drive › Fitted Backups. Looked in: ${DIRS.join(', ')}`);
  const path = files.map(f => [f, statSync(f).mtimeMs]).sort((a, b) => b[1] - a[1])[0];
  if (cache.path !== path[0] || cache.mtime !== path[1]) {
    const b = JSON.parse(readFileSync(path[0], 'utf8'));
    const imgs = new Map(b.items.map(i => [i.id, i.img])); // kept aside for show_pieces; the rest of the tools only need the text
    for (const i of b.items) { delete i.img; delete i.photo; } for (const w of b.wish ?? []) delete w.img; for (const i of b.inspo ?? []) delete i.img; // text only
    cache = { path: path[0], mtime: path[1], data: b, imgs };
  }
  return cache.data;
}

const fitName = p => p.cat === 'Accessories' ? '' : (FITS[p.cat] ?? FITS.default)[p.fit ?? 1];
const desc = p => ({ id: p.id, name: p.name, category: p.cat, kind: p.kind || undefined, color: colorName(p.color) + (isNeutral(p.color) ? ' (neutral)' : ''), fit: fitName(p) || undefined,
  vibe: [].concat(p.vibe ?? []).join(', ') || undefined, worn: p.wears || 0, print: p.patterned || undefined });
const look = o => ({ pieces: o.items.map(p => `${p.name} (${colorName(p.color)} ${p.kind || p.cat})`), ids: o.items.map(p => p.id), style: MODES[o.mode]?.label ?? o.mode, why: o.note });
// Pieces by id or by name (case-insensitive, partial). Throws with the closest names when nothing matches.
function find(items, q) {
  const s = String(q).toLowerCase(), hit = items.find(p => p.id === q) ?? items.find(p => p.name.toLowerCase() === s) ?? items.find(p => p.name.toLowerCase().includes(s));
  if (!hit) throw new Error(`No piece matches "${q}". Use the closet tool to see names.`);
  return hit;
}
function scope(b, collection) {
  if (!collection) return b.items;
  const c = (b.colls ?? []).find(c => c.name.toLowerCase() === String(collection).toLowerCase());
  if (!c) throw new Error(`No collection "${collection}". You have: ${(b.colls ?? []).map(c => c.name).join(', ') || 'none'}`);
  return b.items.filter(i => c.ids.includes(i.id));
}

const STYLES = Object.keys(MODES).filter(k => !MODES[k].hidden);
const TOOLS = {
  closet: {
    description: 'List every piece in the closet (or one collection): name, category, kind, color, fit, vibe, times worn. Also lists collections, the wishlist, the colors on the inspo board and the backup date.',
    inputSchema: { type: 'object', properties: { collection: { type: 'string', description: 'Collection name, e.g. Vacation or Club' } } },
    run({ collection }) { const b = load(); return { backup: cache.path, collections: (b.colls ?? []).map(c => `${c.name} (${c.ids.length})`), pieces: scope(b, collection).map(desc),
      wishlist: (b.wish ?? []).filter(w => !w.got).map(w => [w.name, w.cat, w.color && colorName(w.color), w.note].filter(Boolean).join(' · ')),
      inspo_colors: [...new Set((b.inspo ?? []).flatMap(i => (i.palette ?? []).filter(h => !(i.off ?? []).includes(h)).map(colorName)))] }; },
  },
  style_guide: {
    description: "The user's personal style guide (color combos, jeans and pants pairings, layering, fixes). The app's suggestions follow these rules; use them when advising.",
    inputSchema: { type: 'object', properties: {} },
    run() { const g = join(here, '../style-notes/STYLE-GUIDE.md'); return existsSync(g) ? readFileSync(g, 'utf8') : readFileSync(join(here, '../style.js'), 'utf8'); },
  },
  suggest_outfits: {
    description: `Outfits from the closet, scored by the app's rules. Optional: build around a piece, pick a style (${STYLES.join(', ')}, or "today" for a weather-aware mix), limit to a collection.`,
    inputSchema: { type: 'object', properties: {
      piece: { type: 'string', description: 'Build around this piece (name or id)' }, style: { type: 'string', enum: ['today', ...STYLES] },
      feels_like_c: { type: 'number', description: "Today's feels-like temperature in °C (drops hoodies when hot, shorts when cold)" },
      collection: { type: 'string' }, count: { type: 'number', description: 'How many (default 5)' } } },
    run({ piece, style = 'today', feels_like_c, collection, count = 5 }) {
      const items = scope(load(), collection), n = Math.min(12, count);
      if (piece) return madeWith(items, find(load().items, piece), n).map(look);
      if (style === 'today' || !MODES[style]) return today(items, { t: feels_like_c ?? null, n }).map(look);
      return generate(items, style, { n }).map(o => look({ ...o, mode: style }));
    },
  },
  check_outfit: {
    description: 'Score an outfit the user describes (list of piece names or ids): which style it works as and why, or why it clashes, plus one tip.',
    inputSchema: { type: 'object', properties: { pieces: { type: 'array', items: { type: 'string' } } }, required: ['pieces'] },
    run({ pieces }) { const b = load(), ps = pieces.map(q => find(b.items, q)), v = bestMode(ps);
      return { pieces: ps.map(p => p.name), works: v?.score != null, style: v?.mode ? MODES[v.mode].label : null, why: v?.note ?? 'Needs a top, bottoms and shoes', tip: v?.score != null ? fixTip(ps) : null }; },
  },
  show_pieces: {
    description: 'Show the photos of up to 6 pieces (names or ids), so you can judge an outfit visually, not just from the tags.',
    inputSchema: { type: 'object', properties: { pieces: { type: 'array', items: { type: 'string' }, maxItems: 6 } }, required: ['pieces'] },
    run({ pieces }) { const b = load(), ps = pieces.slice(0, 6).map(q => find(b.items, q));
      return { content: ps.flatMap(p => { const m = /^data:(image\/[a-z+]+);base64,(.*)$/.exec(cache.imgs.get(p.id) ?? '');
        return [{ type: 'text', text: `${p.name} (${colorName(p.color)} ${p.kind || p.cat}) · id ${p.id}` }, ...(m ? [{ type: 'image', mimeType: m[1], data: m[2] }] : [])]; }) }; },
  },
  best_for_slot: {
    description: 'Given the pieces picked so far, rank what to add for one slot (Tops, Layers, Bottoms, Shoes, Hat, Accessory), best match first, with the reason.',
    inputSchema: { type: 'object', properties: { pieces: { type: 'array', items: { type: 'string' } }, slot: { type: 'string', enum: Object.keys(SLOTS) }, count: { type: 'number' } }, required: ['slot'] },
    run({ pieces = [], slot, count = 5 }) { const b = load(), ps = pieces.map(q => find(b.items, q));
      return rankSwaps(b.items, ps, slot).slice(0, count).map(r => ({ piece: r.item.name, fits: r.score != null, why: r.note ?? 'Clashes with what you picked' })); },
  },
};

// ---------- MCP over stdio: one JSON-RPC message per line ----------
const send = m => process.stdout.write(JSON.stringify({ jsonrpc: '2.0', ...m }) + '\n');
function handle(msg) {
  const { id, method, params } = msg;
  if (method === 'initialize') return send({ id, result: { protocolVersion: params?.protocolVersion ?? '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'closet', version: '1.0.0' } } });
  if (method === 'tools/list') return send({ id, result: { tools: Object.entries(TOOLS).map(([name, t]) => ({ name, description: t.description, inputSchema: t.inputSchema })) } });
  if (method === 'tools/call') {
    const t = TOOLS[params?.name]; if (!t) return send({ id, error: { code: -32602, message: `Unknown tool ${params?.name}` } });
    try { const r = t.run(params.arguments ?? {}); return send({ id, result: r?.content ? r : { content: [{ type: 'text', text: typeof r === 'string' ? r : JSON.stringify(r, null, 1) }] } }); }
    catch (e) { return send({ id, result: { isError: true, content: [{ type: 'text', text: e.message }] } }); }
  }
  if (method === 'ping') return send({ id, result: {} });
  if (id != null) send({ id, error: { code: -32601, message: `Unknown method ${method}` } }); // notifications (no id) need no reply
}
let buf = '';
process.stdin.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1); if (line) try { handle(JSON.parse(line)); } catch (e) { console.error(e); } } });
