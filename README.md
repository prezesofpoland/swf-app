# Flash + React + Ruffle (starter v3)

## Szybki start
```bash
npm i
npm run dev
```

Wrzuć gry do `public/swf/`. Lista zaktualizuje się po ⟳ (w dev plugin nasłuchuje na zmiany).

## Build / Preview
```bash
npm run build
npm run preview
```
`prebuild` generuje manifest, więc preview widzi listę gier.

## Wymagane w `public/index.html`
```html
<script src="https://unpkg.com/@ruffle-rs/ruffle"></script>
<script>
  window.RufflePlayer = window.RufflePlayer || {};
  window.RufflePlayer.config = { autoplay: "on", unmuteOverlay: "hidden", warnOnUnsupportedContent: true };
</script>
```

## Diagnoza
- `http://localhost:5173/swf-manifest.json` → musi być JSON (nie HTML).
- Konsola:
```js
fetch('/swf/nazwa.swf').then(r=>r.arrayBuffer()).then(b=>{
  const h = String.fromCharCode(...new Uint8Array(b.slice(0,3)));
  console.log('Header:', h, 'Size:', b.byteLength);
});
```
Poprawne nagłówki: `FWS`, `CWS`, `ZWS`.

## Notatki
- Audio odpala po kliknięciu (overlay), zgodnie z polityką autoplay.
- Ścieżki w manifeście są absolutne i respektują `vite.base`.
