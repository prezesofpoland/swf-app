import express from 'express';
import morgan from 'morgan';

const app = express();
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

function text(res, body='1') { res.type('text/plain; charset=utf-8').send(body); }

app.all('/index.php', (req, res) => {
  const op = (req.query.do || req.body.do || '').toString();
  if (op === 'verifyscore') return text(res, 'ok=1&status=1&verified=1&PHP_score=0');
  if (op === 'savescore')   return text(res, '1');
  return text(res, '1');
});
app.all(/.*\/(index|arcade|newscore|v3game|submit)\.php$/i, (req, res) => {
  const op = (req.query.do || req.body.do || '').toString();
  if (op === 'verifyscore') return text(res, 'ok=1&status=1&verified=1&PHP_score=0');
  if (op === 'savescore')   return text(res, '1');
  return text(res, '1');
});
app.all('/sec/loadhigh.php', (req, res) => text(res, ''));
app.all('/sec/sendhigh.php', (req, res) => text(res, '1'));
app.all(/.*\/sec\/(loadhigh|sendhigh)\.php$/i, (req, res) => {
  if (req.url && req.url.toLowerCase().includes('loadhigh.php')) return text(res, '');
  return text(res, '1');
});
// Catch-all for any .php
app.all(/\.php$/i, (req, res) => text(res, '1'));

app.listen(3000, () => console.log('Bridge running on :3000'));
