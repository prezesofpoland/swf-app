import { useEffect, useRef, useState } from "react";

export default function SwfPlayer({ src, width = 960, height = 720 }) {
  const hostRef = useRef(null);
  const [armed, setArmed] = useState(false);   // start po kliknięciu (audio OK)
  const [error, setError] = useState(null);

  useEffect(() => {
    setError(null);
    if (!src || !armed) return;

    const ruffle =
      window.RufflePlayer && window.RufflePlayer.newest
        ? window.RufflePlayer.newest()
        : null;
    if (!ruffle) {
      setError("Ruffle nie jest załadowany. Dodaj skrypt do public/index.html.");
      return;
    }
    if (!hostRef.current) return;

    const player = ruffle.createPlayer();
    player.style.width = `${width}px`;
    player.style.height = `${height}px`;

    hostRef.current.innerHTML = "";
    hostRef.current.appendChild(player);

    const api = player.ruffle();
    api.load(src).catch((e) => setError(String(e)));

    // fokus dla klawiatury
    setTimeout(() => hostRef.current?.focus?.(), 30);

    return () => {
      try { api?.pause?.(); } catch {}
      try { player?.remove?.(); } catch {}
    };
  }, [src, width, height, armed]);

  return (
    <div
      className="player-shell"
      ref={hostRef}
      tabIndex={0}
      style={{ width, height, position: "relative" }}
    >
      {!armed && (
        <button
          onClick={() => setArmed(true)}
          title="Kliknij, aby uruchomić grę i dźwięk"
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "transparent",
            border: "none",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              border: "1px solid #2a2f3b",
              borderRadius: 12,
              background: "#111524",
              color: "#f1f5ff"
            }}
          >
            ▶️ Kliknij, aby uruchomić
          </div>
        </button>
      )}

      {error ? (
        <div
          style={{
            position: "absolute",
            left: 8,
            bottom: 8,
            padding: "8px 10px",
            fontSize: 12,
            color: "#ffb4b4",
            background: "rgba(0,0,0,.6)",
            border: "1px solid #333",
            borderRadius: 8,
          }}
        >
          Błąd ładowania: {error}
        </div>
      ) : null}
    </div>
  );
}
