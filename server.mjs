import express from 'express';
import morgan from 'morgan';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// Arcade Bridge Lite v2.1 — no DB
const config = {
  port: process.env.PORT || 3000,
  okText: '1',
  requireSignature: false,
  knownSecrets: {},
  logToFile: true,
  logPath: path.resolve(process.cwd(), 'scores.log.jsonl'),
};

const app = express();
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

function legacyText(res, text='1') {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.status(200).send(text);
}

function extract(req) {
  const all = { ...(req.query || {}), ...(req.body || {}) };
  const reserved = new Set(['game','gname','gameid','score','gscore','enscore','rand','randchar','randchar2','sig','hash','k','user','username','do']);
  let game = all.game || all.gname || all.gameid || null;
  if (!game) {
    for (const [k, v] of Object.entries(all)) {
      if (reserved.has(k)) continue;
      if (/^[A-Za-z0-9_\-]{3,}$/.test(k) && !isNaN(parseFloat(v))) { game = k; break; }
    }
  }
  let score = null;
  if (game && all[game]!=null && !isNaN(parseFloat(all[game]))) score = parseFloat(all[game]);
  if (score==null && all.score!=null && !isNaN(parseFloat(all.score))) score = parseFloat(all.score);
  if (score==null && all.gscore!=null && !isNaN(parseFloat(all.gscore))) score = parseFloat(all.gscore);
  const rand = all.randchar || all.rand || all.randchar2 || '';
  const sig  = all.sig || all.hash || '';
  const user = all.user || all.username || null;
  const op   = (all.do || '').toString().toLowerCase();
  return { game, score, rand, sig, user, op, raw: all };
}

function verifySignature({ game, score, rand, sig }) {
  const secret = config.knownSecrets[game];
  if (!secret) return !config.requireSignature;
  if (!sig) return !config.requireSignature;
  const md5 = s => crypto.createHash('md5').update(s).digest('hex');
  const sha1 = s => crypto.createHash('sha1').update(s).digest('hex');
  const candidates = [
    md5(`${score}${rand}${secret}`),
    md5(`${game}${score}${rand}${secret}`),
    sha1(`${score}${rand}${secret}`),
    sha1(`${game}${score}${rand}${secret}`),
  ];
  return candidates.some(c => c.toLowerCase() === String(sig).toLowerCase());
}

async function handleIndex(req, res) {
  const p = extract(req);
 if (p.op === 'verifyscore') {
  res.setHeader('Content-Type','text/plain; charset=utf-8');
  return res.status(200).send('ok=1&status=1&verified=1&PHP_score=0');
}
  if (p.op === 'savescore') {
    const valid = verifySignature(p);
    if (!valid && config.requireSignature) return legacyText(res, 'ERROR');
    if (config.logToFile) {
      const line = JSON.stringify({
        t: new Date().toISOString(),
        path: req.originalUrl,
        ip: req.ip,
        ua: req.get('user-agent') || null,
        game: p.game,
        score: p.score,
        rand: p.rand,
        sig: p.sig ? 'present' : null,
      });
      try { fs.appendFileSync(config.logPath, line + '\n', 'utf-8'); } catch {}
    }
    return legacyText(res, config.okText);
  }
  return legacyText(res, config.okText);
}

['/index.php','/arcade.php','/newscore.php','/v3game.php','/submit.php'].forEach(route => {
  app.all(route, handleIndex);
});
app.all(/.*\/(index|arcade|newscore|v3game|submit)\.php$/i, handleIndex);

app.all('/sec/loadhigh.php', (req, res) => legacyText(res, ''));
app.all('/sec/sendhigh.php', (req, res) => legacyText(res, config.okText));
app.all(/.*\/sec\/loadhigh\.php$/i, (req, res) => legacyText(res, ''));
app.all(/.*\/sec\/sendhigh\.php$/i, (req, res) => legacyText(res, config.okText));

app.all(/\.php$/i, (req, res) => {
  console.log('[bridge] catch-all', req.originalUrl);
  return legacyText(res, config.okText);
});

app.get('/healthz', (req, res) => legacyText(res, 'ok'));

app.listen(config.port, () => {
  console.log(`[arcade-bridge-lite] listening on :${config.port}`);
  if (config.logToFile) console.log(`[arcade-bridge-lite] logging to ${config.logPath}`);
});

app.all(/\.php$/i, (req, res) => res.status(200).type('text/plain').send('1'));