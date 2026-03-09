import { useState, useEffect, useRef } from "react";

const JSONBIN_KEY = "$2a$10$IEvmIsn0vDlhf/9ujl73ouc9z1EdYj3odFgY8I6O0E4Ad7TQVusQe";
const BIN_ID = "69af130cae596e708f71c776";
const API = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

const PLAYERS = {
  emmanuel: { name: "Emmanuel", emoji: "👑", color: "#00C4FF" },
  manwell: { name: "Manwell", emoji: "🔥", color: "#FF6B35" },
};

const VENUES = [
  { id: "acc_tue", label: "ACC Tourney – Tue Mar 10", sublabel: "Session 1 · Spectrum Center", emoji: "😈", color: "#003087", accent: "#FFFFFF" },
  { id: "acc_wed", label: "ACC Tourney – Wed Mar 11", sublabel: "Sessions 2 & 3 · Spectrum Center", emoji: "😈", color: "#003087", accent: "#CCCCCC" },
  { id: "acc_thu", label: "ACC Tourney – Thu Mar 12", sublabel: "Duke plays 7 PM ET · Spectrum Center", emoji: "😈", color: "#003575", accent: "#FFFFFF" },
  { id: "acc_fri", label: "ACC Tourney – Fri Mar 13", sublabel: "Semifinals · Spectrum Center", emoji: "😈", color: "#003575", accent: "#CCCCCC" },
  { id: "acc_sat", label: "ACC Championship – Sat Mar 14", sublabel: "8:30 PM ET · Spectrum Center", emoji: "🏆", color: "#1a2a6c", accent: "#FFD700" },
  { id: "hornets_mar17", label: "Hornets – Tue Mar 17", sublabel: "vs. Miami Heat", emoji: "🐝", color: "#1D1160", accent: "#00788C" },
  { id: "hornets_mar19", label: "Hornets – Thu Mar 19", sublabel: "vs. Orlando Magic", emoji: "🐝", color: "#1D1160", accent: "#00788C" },
  { id: "hornets_mar21", label: "Hornets – Sat Mar 21", sublabel: "vs. Memphis Grizzlies", emoji: "🐝", color: "#1D1160", accent: "#00788C" },
  { id: "hornets_mar24", label: "Hornets – Tue Mar 24", sublabel: "vs. Sacramento Kings", emoji: "🐝", color: "#1D1160", accent: "#00788C" },
  { id: "hornets_mar26", label: "Hornets – Thu Mar 26", sublabel: "vs. New York Knicks", emoji: "🐝", color: "#1D1160", accent: "#00788C" },
  { id: "hornets_mar28", label: "Hornets – Sat Mar 28", sublabel: "vs. Philadelphia 76ers", emoji: "🐝", color: "#1D1160", accent: "#00788C" },
  { id: "hornets_mar29", label: "Hornets – Sun Mar 29", sublabel: "vs. Boston Celtics", emoji: "🐝", color: "#1D1160", accent: "#00788C" },
];

const SPOTTED_LABELS = [
  "Spotted Diondre in the stands! 👀",
  "Found Diondre! 🎯",
  "There's Diondre! 🙌",
  "Diondre caught on camera! 📸",
  "Diondre can't hide! 😂",
];

function confettiPop(color) {
  const el = document.createElement("div");
  el.style.cssText = `position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;overflow:hidden;`;
  document.body.appendChild(el);
  for (let i = 0; i < 40; i++) {
    const dot = document.createElement("div");
    const x = Math.random() * 100;
    const size = 8 + Math.random() * 10;
    dot.style.cssText = `
      position:absolute;left:${x}%;top:-10%;
      width:${size}px;height:${size}px;
      background:${Math.random() > 0.5 ? color : "#FFD700"};
      border-radius:${Math.random() > 0.5 ? "50%" : "2px"};
      animation:fall ${1.2 + Math.random() * 1}s ease-in ${Math.random() * 0.5}s forwards;
    `;
    el.appendChild(dot);
  }
  const style = document.createElement("style");
  style.textContent = `@keyframes fall{to{transform:translateY(110vh) rotate(720deg);opacity:0;}}`;
  document.head.appendChild(style);
  setTimeout(() => { document.body.removeChild(el); }, 3000);
}

async function fetchState() {
  const res = await fetch(`${API}/latest`, {
    headers: { "X-Master-Key": JSONBIN_KEY },
  });
  const data = await res.json();
  return data.record;
}

async function saveState(state) {
  await fetch(API, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": JSONBIN_KEY,
    },
    body: JSON.stringify(state),
  });
}

export default function SpotGame() {
  const [scores, setScores] = useState({ emmanuel: 0, manwell: 0 });
  const [history, setHistory] = useState([]);
  const [flash, setFlash] = useState(null);
  const [activeTab, setActiveTab] = useState("game");
  const [syncing, setSyncing] = useState(false);
  const [online, setOnline] = useState(true);
  const pollRef = useRef(null);

  const loadState = async () => {
    try {
      const record = await fetchState();
      setScores(record.scores);
      setHistory(record.history || []);
      setOnline(true);
    } catch {
      setOnline(false);
    }
  };

  useEffect(() => {
    loadState();
    pollRef.current = setInterval(loadState, 5000);
    return () => clearInterval(pollRef.current);
  }, []);

  const handleScore = async (playerId, venueId) => {
    const venue = VENUES.find(v => v.id === venueId);
    const label = SPOTTED_LABELS[Math.floor(Math.random() * SPOTTED_LABELS.length)];
    const entry = {
      player: playerId,
      venue: venueId,
      label,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      id: Date.now(),
    };

    const newScores = { ...scores, [playerId]: scores[playerId] + 1 };
    const newHistory = [entry, ...history].slice(0, 50);

    setScores(newScores);
    setHistory(newHistory);
    setFlash(playerId);
    confettiPop(PLAYERS[playerId].color);
    setTimeout(() => setFlash(null), 800);

    setSyncing(true);
    try {
      await saveState({ scores: newScores, history: newHistory });
      setOnline(true);
    } catch {
      setOnline(false);
    } finally {
      setSyncing(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Reset all scores?")) return;
    const fresh = { scores: { emmanuel: 0, manwell: 0 }, history: [] };
    setScores(fresh.scores);
    setHistory(fresh.history);
    setSyncing(true);
    try { await saveState(fresh); } catch {}
    setSyncing(false);
  };

  const leader = scores.emmanuel > scores.manwell ? "emmanuel"
    : scores.manwell > scores.emmanuel ? "manwell" : null;
  const total = scores.emmanuel + scores.manwell;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0a0a1a 0%, #0d1b3e 50%, #0a0a1a 100%)",
      fontFamily: "'Trebuchet MS', 'Lucida Grande', sans-serif",
      color: "#fff",
      maxWidth: 430,
      margin: "0 auto",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "radial-gradient(ellipse at 50% -20%, rgba(0,80,255,0.18) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      {/* Header */}
      <div style={{
        padding: "24px 20px 16px", textAlign: "center",
        position: "relative", zIndex: 1,
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}>
        <div style={{ fontSize: 11, letterSpacing: 4, color: "#7799CC", textTransform: "uppercase", marginBottom: 4 }}>
          Crowd Spotter
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1 }}>👀 Spot Diondre</div>
        <div style={{ fontSize: 13, color: "#5588BB", marginTop: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <span>{total} spots total</span>
          <span style={{
            width: 8, height: 8, borderRadius: "50%", display: "inline-block",
            background: syncing ? "#FFD700" : online ? "#00FF88" : "#FF4444",
            boxShadow: `0 0 6px ${syncing ? "#FFD700" : online ? "#00FF88" : "#FF4444"}`,
          }} />
          <span style={{ fontSize: 11 }}>{syncing ? "saving..." : online ? "live" : "offline"}</span>
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{
        display: "flex", position: "relative", zIndex: 1,
        background: "rgba(255,255,255,0.04)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}>
        {["game", "history"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, padding: "12px 0",
            background: "none", border: "none", cursor: "pointer",
            color: activeTab === tab ? "#fff" : "#556688",
            fontWeight: activeTab === tab ? 700 : 400,
            fontSize: 13, letterSpacing: 1, textTransform: "uppercase",
            borderBottom: activeTab === tab ? "2px solid #00C4FF" : "2px solid transparent",
            transition: "all 0.2s",
          }}>
            {tab === "game" ? "🎮 Game" : "📋 History"}
          </button>
        ))}
      </div>

      {activeTab === "game" && (
        <div style={{ padding: "20px 16px", position: "relative", zIndex: 1 }}>
          {/* Scoreboard */}
          <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
            {Object.entries(PLAYERS).map(([id, p]) => (
              <div key={id} style={{
                flex: 1,
                background: flash === id ? `linear-gradient(135deg, ${p.color}44, ${p.color}22)` : "rgba(255,255,255,0.05)",
                border: `2px solid ${leader === id ? p.color : "rgba(255,255,255,0.1)"}`,
                borderRadius: 20, padding: "16px 12px", textAlign: "center",
                transition: "all 0.3s",
                transform: flash === id ? "scale(1.04)" : "scale(1)",
                boxShadow: leader === id ? `0 0 20px ${p.color}44` : "none",
              }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{p.emoji}</div>
                <div style={{ fontSize: 12, color: "#8899BB", letterSpacing: 1, textTransform: "uppercase" }}>{p.name}</div>
                <div style={{
                  fontSize: 52, fontWeight: 900, lineHeight: 1.1,
                  color: leader === id ? p.color : "#fff",
                  textShadow: leader === id ? `0 0 30px ${p.color}88` : "none",
                }}>{scores[id]}</div>
                {leader === id && scores[id] > 0 && (
                  <div style={{ fontSize: 10, color: p.color, letterSpacing: 2, marginTop: 2 }}>LEADING</div>
                )}
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, letterSpacing: 3, color: "#4466AA", textTransform: "uppercase", marginBottom: 12, textAlign: "center" }}>
            Who spotted them? At which game?
          </div>

          {VENUES.map(venue => (
            <div key={venue.id} style={{ marginBottom: 20 }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: `linear-gradient(90deg, ${venue.color}88, transparent)`,
                borderLeft: `4px solid ${venue.accent}`,
                padding: "8px 14px", borderRadius: "0 12px 12px 0", marginBottom: 10,
              }}>
                <span style={{ fontSize: 20 }}>{venue.emoji}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{venue.label}</div>
                  {venue.sublabel && <div style={{ fontSize: 11, opacity: 0.7, marginTop: 1 }}>{venue.sublabel}</div>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {Object.entries(PLAYERS).map(([id, p]) => (
                  <button key={id} onClick={() => handleScore(id, venue.id)} style={{
                    flex: 1, padding: "14px 8px",
                    background: `linear-gradient(135deg, ${p.color}22, ${p.color}11)`,
                    border: `1.5px solid ${p.color}55`,
                    borderRadius: 14, color: p.color, fontWeight: 700,
                    fontSize: 14, cursor: "pointer", transition: "all 0.15s",
                  }}
                  onMouseDown={e => e.currentTarget.style.transform = "scale(0.96)"}
                  onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
                  onTouchStart={e => e.currentTarget.style.transform = "scale(0.94)"}
                  onTouchEnd={e => e.currentTarget.style.transform = "scale(1)"}
                  >
                    <div style={{ fontSize: 18 }}>{p.emoji}</div>
                    <div style={{ fontSize: 12, marginTop: 2 }}>{p.name}</div>
                    <div style={{ fontSize: 10, opacity: 0.7, marginTop: 1 }}>+1 point</div>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {total > 0 && (
            <button onClick={handleReset} style={{
              width: "100%", marginTop: 8, padding: "12px",
              background: "rgba(255,50,50,0.08)", border: "1px solid rgba(255,50,50,0.25)",
              borderRadius: 12, color: "#FF6677", fontSize: 13, cursor: "pointer", letterSpacing: 1,
            }}>
              🔄 Reset Game
            </button>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div style={{ padding: "16px", position: "relative", zIndex: 1 }}>
          {history.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#445577" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👀</div>
              <div style={{ fontSize: 16 }}>No spots yet!</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>Head to a game and start spotting</div>
            </div>
          ) : (
            history.map(entry => {
              const p = PLAYERS[entry.player];
              const v = VENUES.find(v => v.id === entry.venue);
              return (
                <div key={entry.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 14px",
                  background: "rgba(255,255,255,0.04)",
                  borderLeft: `3px solid ${p.color}`,
                  borderRadius: "0 12px 12px 0", marginBottom: 8,
                }}>
                  <div style={{ fontSize: 22 }}>{p.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: p.color }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "#8899BB" }}>{entry.label}</div>
                    <div style={{ fontSize: 11, color: "#445566", marginTop: 2 }}>
                      {v?.emoji} {v?.label} · {entry.time}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 11, color: p.color, background: `${p.color}22`,
                    padding: "3px 8px", borderRadius: 20, fontWeight: 700,
                  }}>+1</div>
                </div>
              );
            })
          )}
        </div>
      )}
      <div style={{ height: 32 }} />
    </div>
  );
}
