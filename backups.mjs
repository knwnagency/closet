// The newest closet backup on this Mac, for rules-check and the Claude connector.
// Looks anywhere in iCloud Drive (3 folders deep), Downloads and hauls/. Takes the newest full backup,
// then lays any newer "-changes" backups on top (newer pieces replace, deleted ones drop).
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const icloud = join(homedir(), 'Library/Mobile Documents/com~apple~CloudDocs');
export const ROOTS = [process.env.CLOSET_BACKUP_DIR, icloud, join(homedir(), 'Downloads'), new URL('./hauls', import.meta.url).pathname].filter(Boolean);
const TEST = /closet-backup-58-pieces/; // the old test closet, never your real one

function walk(dir, depth, out) {
  let ents; try { ents = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of ents) {
    if (e.isDirectory() && depth > 0 && !e.name.startsWith('.')) walk(join(dir, e.name), depth - 1, out);
    else if (/^(closet|already)-backup.*\.json$/.test(e.name) && !TEST.test(e.name)) out.push(join(dir, e.name));
  }
  return out;
}

export function backupFiles() {
  return ROOTS.flatMap(r => walk(r, 3, [])).map(path => ({ path, mtime: statSync(path).mtimeMs, changes: /-changes/.test(path) })).sort((a, b) => b.mtime - a.mtime);
}

// { file, files, data } or null. strip: drop photos (most tools only need the text)
export function newestBackup(files = backupFiles(), strip = true) {
  const base = files.find(f => !f.changes); if (!base) return null;
  const read = p => { const b = JSON.parse(readFileSync(p, 'utf8')); if (strip) for (const i of b.items ?? []) { delete i.photo; delete i.angles; } return b; };
  const data = read(base.path), used = [base];
  for (const f of files.filter(f => f.changes && f.mtime > base.mtime).reverse()) { // oldest change first
    const c = read(f.path), byId = new Map(data.items.map(i => [i.id, i]));
    for (const i of c.items ?? []) byId.set(i.id, i);
    for (const k of Object.keys(c.gone ?? {})) if (k.startsWith('items|')) byId.delete(k.slice(6));
    Object.assign(data, c, { items: [...byId.values()] }); used.push(f);
  }
  return { file: used.at(-1).path, files: used.map(f => f.path), data };
}
