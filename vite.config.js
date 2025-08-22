import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function swfManifestPlugin({
  swfDir = path.resolve(process.cwd(), 'public', 'swf'),
  outFile = path.resolve(process.cwd(), 'public', 'swf-manifest.json'),
} = {}) {
  let basePath = '/';
  const scan = (dir) => {
    const entries = [];
    if (!fs.existsSync(dir)) return entries;
    const stack = [dir];
    while (stack.length) {
      const cur = stack.pop();
      for (const name of fs.readdirSync(cur)) {
        const p = path.join(cur, name);
        const stat = fs.statSync(p);
        if (stat.isDirectory()) stack.push(p);
        else if (stat.isFile() && name.toLowerCase().endsWith('.swf')) {
          const rel = path.posix.join('swf', path.relative(swfDir, p).split(path.sep).join('/'));
          const webPath = (basePath === '/' ? '/' : basePath) + rel;
          entries.push({ name: path.basename(name, '.swf'), fileName: name, path: webPath });
        }
      }
    }
    entries.sort((a, b) => a.name.localeCompare(b.name, 'en'));
    return entries;
  };
  const buildJson = () => JSON.stringify({ games: scan(swfDir), generatedAt: new Date().toISOString() }, null, 2);
  const writeManifest = () => {
    try { fs.mkdirSync(swfDir, { recursive: true }); } catch {}
    fs.writeFileSync(outFile, buildJson(), 'utf-8');
    console.log(`[swf-manifest] written -> ${path.relative(process.cwd(), outFile)}`);
  };
  return {
    name: 'swf-manifest-plugin',
    configResolved(cfg) { basePath = cfg.base || '/'; },
    configureServer(server) {
      writeManifest();
      server.middlewares.use((req, res, next) => {
        const target = (basePath === '/' ? '/' : basePath) + 'swf-manifest.json';
        if ((req.url || '') === target) {
          const json = buildJson();
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(json);
          return;
        }
        next();
      });
      server.watcher.add(swfDir);
      const onChange = (p) => {
        if (!p) return;
        const ext = path.extname(p).toLowerCase();
        if (ext === '.swf' || p.startsWith(swfDir)) writeManifest();
      };
      server.watcher.on('add', onChange);
      server.watcher.on('unlink', onChange);
      server.watcher.on('change', onChange);
    },
    buildStart() { writeManifest(); },
  };
}

const FROM_PATH = ''; // e.g., '/swf/TwojaGra/'
const TO_PATH   = ''; // e.g., '/swf/RZECZYWISTY_FOLDER/'
function swfPathAlias() {
  if (!FROM_PATH || !TO_PATH || FROM_PATH === TO_PATH) return { name: 'swf-path-alias-disabled' };
  return {
    name: 'swf-path-alias',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url?.startsWith(FROM_PATH)) req.url = req.url.replace(FROM_PATH, TO_PATH);
        next();
      });
    }
  }
}

export default defineConfig({
  plugins: [react()],
server: {
  proxy: {
    '^/.*\\.php(?:\\?.*)?$': {
      target: 'http://localhost:3000',
      changeOrigin: true,
      secure: false,
    },
  },
},
})
