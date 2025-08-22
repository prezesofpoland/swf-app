import fs from 'fs';
import path from 'path';

const swfDir = path.resolve(process.cwd(), 'public', 'swf');
const outFile = path.resolve(process.cwd(), 'public', 'swf-manifest.json');

function scan(dir) {
  const entries = [];
  if (!fs.existsSync(dir)) return entries;
  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop();
    for (const name of fs.readdirSync(cur)) {
      const p = path.join(cur, name);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) {
        stack.push(p);
      } else if (stat.isFile() && name.toLowerCase().endsWith('.swf')) {
        const rel = path.posix.join('swf', path.relative(swfDir, p).split(path.sep).join('/'));
        entries.push({ name: path.basename(name, '.swf'), fileName: name, path: '/' + rel });
      }
    }
  }
  entries.sort((a, b) => a.name.localeCompare(b.name, 'en'));
  return entries;
}

fs.mkdirSync(swfDir, { recursive: true });
const games = scan(swfDir);
fs.writeFileSync(outFile, JSON.stringify({ games, generatedAt: new Date().toISOString() }, null, 2));
console.log(`[swf-manifest] ${games.length} item(s) -> ${path.relative(process.cwd(), outFile)}`);
