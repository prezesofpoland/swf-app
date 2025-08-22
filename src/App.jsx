import React, { useEffect, useMemo, useRef, useState } from 'react';
import SwfPlayer from './components/SwfPlayer.jsx';

const MANIFEST_URL = new URL(`${import.meta.env.BASE_URL}swf-manifest.json`, window.location.href).toString();
const STORAGE_KEY = 'swfPlayer.size';
const FLASHVARS = (import.meta.env.VITE_SWF_FLASHVARS || '').trim();

export default function App() {
  const [games, setGames] = useState([]);
  const [filter, setFilter] = useState('');
  const [current, setCurrent] = useState(null);
  const [size, setSize] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { w: 960, h: 720 }; } catch { return { w: 960, h: 720 }; }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mainRef = useRef(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(size)); }, [size]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return games;
    return games.filter(g => g.name.toLowerCase().includes(q) || g.fileName.toLowerCase().includes(q));
  }, [games, filter]);

  async function loadManifest() {
    setLoading(true); setError(null);
    try {
      const res = await fetch(MANIFEST_URL, { cache: 'no-cache' });
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        const txt = await res.text();
        throw new Error(`Expected JSON, got ${ct || 'unknown'}\nPreview:\n` + txt.slice(0, 300));
      }
      const json = await res.json();
      const list = json.games || [];
      setGames(list);
      if (!current && list.length) setCurrent(list[0]);
    } catch (e) {
      console.error('manifest error', e);
      setError(String(e));
      setGames([]); setCurrent(null);
    } finally { setLoading(false); }
  }
  useEffect(() => { loadManifest(); }, []);

  const presets = {
    '800x600': { w: 800, h: 600 },
    '960x720': { w: 960, h: 720 },
    '1024x768': { w: 1024, h: 768 },
    '1280x960': { w: 1280, h: 960 },
    '1600x1200': { w: 1600, h: 1200 },
  };
  const setPresetSize = (key) => {
    const val = presets[key] || presets['960x720'];
    setSize(val);
    setTimeout(() => { document.querySelector('.player-shell')?.focus() }, 30);
  };
  const fitToWindow = () => {
    const el = mainRef.current; if (!el) return;
    const pad = 40;
    const availW = Math.max(300, el.clientWidth - pad);
    const availH = Math.max(200, el.clientHeight - pad - 60);
    const aspect = 4/3;
    let w = availW, h = Math.round(w / aspect);
    if (h > availH) { h = availH; w = Math.round(h * aspect); }
    setSize({ w, h }); setTimeout(() => { document.querySelector('.player-shell')?.focus() }, 30);
  };
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === '+' || e.key === '=') { e.preventDefault(); setSize(s => ({ w: Math.round(s.w * 1.1), h: Math.round(s.h * 1.1) })); }
      else if (e.key === '-' || e.key === '_') { e.preventDefault(); setSize(s => ({ w: Math.round(s.w / 1.1), h: Math.round(s.h / 1.1) })); }
      else if (e.key.toLowerCase() === '0') { e.preventDefault(); setSize({ w: 960, h: 720 }); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const swfSrc = useMemo(() => {
    if (!current?.path) return null;
    if (!FLASHVARS) return current.path;
    const sep = current.path.includes('?') ? '&' : '?';
    return `${current.path}${sep}${FLASHVARS}`;
  }, [current]);

  return (
    <div className="app">
      <div className="main" ref={mainRef}>
        <div>
          <div className="player-header" style={{borderTopLeftRadius:12, borderTopRightRadius:12}}>
            <div className="player-title">
              {current ? current.name : (loading ? 'Loading…' : 'No SWF found')}
            </div>
            <div className="controls" style={{display:'flex', gap:8, flexWrap:'wrap'}}>
              <button className="btn" onClick={() => setPresetSize('800x600')}>800×600</button>
              <button className="btn" onClick={() => setPresetSize('960x720')}>960×720</button>
              <button className="btn" onClick={() => setPresetSize('1024x768')}>1024×768</button>
              <button className="btn" onClick={() => setPresetSize('1280x960')}>1280×960</button>
              <button className="btn" onClick={fitToWindow} title="Dopasuj do okna (Ctrl+0 reset)">Dopasuj</button>
            </div>
          </div>
          <SwfPlayer key={swfSrc || 'empty'} src={swfSrc} width={size.w} height={size.h} />
        </div>
      </div>
      <aside className="sidebar">
        <div className="search">
          <input className="input" placeholder="Szukaj gry…" value={filter} onChange={e => setFilter(e.target.value)} />
          <button className="btn" onClick={loadManifest} title="Przeładuj listę">⟳</button>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
          <select className="input" value={`${size.w}x${size.h}`} onChange={(e)=> setPresetSize(e.target.value)}>
            {Object.keys(presets).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <button className="btn" onClick={fitToWindow} title="Dopasuj do okna">Dopasuj</button>
        </div>
        {error && (
          <div style={{border:'1px solid #5b2b2b', background:'#2a1515', color:'#ffb4b4', padding:10, borderRadius:8, marginBottom:8}}>
            <div style={{fontWeight:600, marginBottom:4}}>Błąd manifestu</div>
            <div style={{fontSize:12, opacity:.9, whiteSpace:'pre-wrap'}}>{String(error)}</div>
          </div>
        )}
        <div className="list">
          {loading && <div className="item"><span>Wczytywanie…</span></div>}
          {!loading && filtered.length === 0 && (
            <div className="item">
              <div>
                <div style={{fontWeight:600}}>Brak gier</div>
                <div style={{fontSize:12, color:'#8a8fa3'}}>
                  Dodaj pliki .swf do <code>public/swf</code> i kliknij ⟳.
                  <div><a href={MANIFEST_URL} target="_blank" rel="noreferrer" style={{color:'#4cc9f0'}}>Otwórz manifest</a></div>
                </div>
              </div>
            </div>
          )}
          {filtered.map(g => (
            <div key={g.path} className={'item' + (current?.path === g.path ? ' active' : '')} onClick={() => setCurrent(g)}>
              <div className="item-title" title={g.fileName}>{g.name}</div>
              <div className="badge">SWF</div>
            </div>
          ))}
        </div>
        <div className="footer">
          <div>Wrzucaj gry do: <code>public/swf</code></div>
          <div>Manifest: <code>/swf-manifest.json</code></div>
          <div>Flashvars (.env): <code>VITE_SWF_FLASHVARS</code></div>
        </div>
      </aside>
    </div>
  );
}
