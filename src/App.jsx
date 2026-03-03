import { useState, useEffect, useRef } from "react";

const SUPABASE_URL = "https://rrexmdfnyyurqtmvebiw.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyZXhtZGZueXl1cnF0bXZlYml3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzAzMjEsImV4cCI6MjA4ODEwNjMyMX0.nmPMCosEMFj1epHMvsOVyfAoWJXDPqU0AL11ZcrE0j8";

const H = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

const db = {
  select: (tbl, qs = "") =>
    fetch(`${SUPABASE_URL}/rest/v1/${tbl}?${qs}&order=created_at.desc&limit=500`, { headers: H })
      .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e))),
  insert: (tbl, body) =>
    fetch(`${SUPABASE_URL}/rest/v1/${tbl}`, { method: "POST", headers: H, body: JSON.stringify(body) })
      .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e))),
  update: (tbl, id, body) =>
    fetch(`${SUPABASE_URL}/rest/v1/${tbl}?id=eq.${id}`, { method: "PATCH", headers: H, body: JSON.stringify(body) })
      .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e))),
};

const TIMEZONES = [
  { label: "Pakistan (PKT)",   value: "Asia/Karachi",        flag: "🇵🇰" },
  { label: "UAE (GST)",        value: "Asia/Dubai",          flag: "🇦🇪" },
  { label: "India (IST)",      value: "Asia/Kolkata",        flag: "🇮🇳" },
  { label: "UK (GMT/BST)",     value: "Europe/London",       flag: "🇬🇧" },
  { label: "Germany (CET)",    value: "Europe/Berlin",       flag: "🇩🇪" },
  { label: "USA Eastern",      value: "America/New_York",    flag: "🇺🇸" },
  { label: "USA Pacific",      value: "America/Los_Angeles", flag: "🇺🇸" },
  { label: "Australia (AEST)", value: "Australia/Sydney",    flag: "🇦🇺" },
];

function hms(s) {
  if (s == null || s < 0) return "—";
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}
function hmLabel(s) {
  if (!s) return "";
  return `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`;
}
function fmtDate(iso, tz) {
  if (!iso) return "—";
  try { return new Intl.DateTimeFormat("en-US",{timeZone:tz||"Asia/Karachi",year:"numeric",month:"short",day:"2-digit"}).format(new Date(iso)); } catch { return "—"; }
}
function fmtTime(iso, tz) {
  if (!iso) return "—";
  try { return new Intl.DateTimeFormat("en-US",{timeZone:tz||"Asia/Karachi",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:true}).format(new Date(iso)); } catch { return "—"; }
}

const COLORS = ["#00ff88","#6366f1","#f59e0b","#ec4899","#06b6d4","#a78bfa","#34d399","#fb923c"];
const aColor = n => COLORS[(n||"").charCodeAt(0) % COLORS.length];
const initials = n => (n||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

function LiveClock({ tz }) {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () => setT(new Intl.DateTimeFormat("en-US",{timeZone:tz,hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:true,weekday:"short",month:"short",day:"numeric"}).format(new Date()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [tz]);
  return <>{t}</>;
}

export default function App() {
  const [view, setView]                 = useState("clock");
  const [devName, setDevName]           = useState("");
  const [taskName, setTaskName]         = useState("");
  const [taskDesc, setTaskDesc]         = useState("");
  const [tz, setTz]                     = useState("Asia/Karachi");
  const [active, setActive]             = useState(null);
  const [elapsed, setElapsed]           = useState(0);
  const [sessions, setSessions]         = useState([]);
  const [busy, setBusy]                 = useState(false);
  const [refreshing, setRefreshing]     = useState(false);
  const [toast, setToast]               = useState(null);
  const [filterDev, setFilterDev]       = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [search, setSearch]             = useState("");
  const [sortCol, setSortCol]           = useState("created_at");
  const [sortDir, setSortDir]           = useState("desc");
  const tickRef = useRef(null);

  const toast$ = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try { setSessions(await db.select("time_sessions")); }
    catch (e) { toast$("DB error: " + (e?.message || e?.hint || JSON.stringify(e)), "err"); }
    finally { setRefreshing(false); }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { const id = setInterval(() => load(true), 30000); return () => clearInterval(id); }, []);
  useEffect(() => {
    if (active) {
      tickRef.current = setInterval(() =>
        setElapsed(Math.floor((Date.now() - new Date(active.start_time).getTime()) / 1000)), 1000);
    } else {
      clearInterval(tickRef.current);
      setElapsed(0);
    }
    return () => clearInterval(tickRef.current);
  }, [active]);

  const startClock = async () => {
    if (!devName.trim()) return toast$("Enter your name!", "err");
    if (!taskName.trim()) return toast$("Enter a task name!", "err");
    setBusy(true);
    try {
      const rows = await db.insert("time_sessions", {
        developer_name: devName.trim(),
        task_name: taskName.trim(),
        task_description: taskDesc.trim() || null,
        timezone: tz,
        start_time: new Date().toISOString(),
        status: "active",
      });
      setActive(Array.isArray(rows) ? rows[0] : rows);
      toast$("⏱ Clock started! Go build something awesome.");
      load(true);
    } catch (e) { toast$("Start error: " + (e?.message || e?.hint || JSON.stringify(e)), "err"); }
    finally { setBusy(false); }
  };

  const stopClock = async () => {
    if (!active) return;
    setBusy(true);
    const secs = Math.floor((Date.now() - new Date(active.start_time).getTime()) / 1000);
    try {
      await db.update("time_sessions", active.id, {
        end_time: new Date().toISOString(),
        duration_seconds: secs,
        status: "completed",
      });
      setActive(null); setTaskName(""); setTaskDesc("");
      toast$(`✅ ${hms(secs)} logged!`);
      load(true);
    } catch (e) { toast$("Stop error: " + (e?.message || e?.hint || JSON.stringify(e)), "err"); }
    finally { setBusy(false); }
  };

  // ── derived ───────────────────────────────────────────────────────────────
  const uniqueDevs = [...new Set(sessions.map(s => s.developer_name))].sort();
  const totalSecs  = sessions.filter(s => s.status === "completed").reduce((a, s) => a + (s.duration_seconds || 0), 0);
  const activeCnt  = sessions.filter(s => s.status === "active").length;
  const devStats   = uniqueDevs.map(d => {
    const mine = sessions.filter(s => s.developer_name === d);
    const secs = mine.filter(s => s.status === "completed").reduce((a, s) => a + (s.duration_seconds || 0), 0);
    return { name: d, sessions: mine.length, secs };
  }).sort((a, b) => b.secs - a.secs);

  let tableRows = sessions.filter(s => {
    if (filterDev !== "ALL" && s.developer_name !== filterDev) return false;
    if (filterStatus !== "ALL" && s.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.developer_name?.toLowerCase().includes(q) ||
             s.task_name?.toLowerCase().includes(q) ||
             s.task_description?.toLowerCase().includes(q);
    }
    return true;
  });
  tableRows = [...tableRows].sort((a, b) => {
    let av = a[sortCol] ?? 0, bv = b[sortCol] ?? 0;
    return sortDir === "asc" ? (av < bv ? -1 : av > bv ? 1 : 0) : (av > bv ? -1 : av < bv ? 1 : 0);
  });
  const toggleSort = col => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  };

  const tzMeta = TIMEZONES.find(t => t.value === tz);

  // ── style helpers ─────────────────────────────────────────────────────────
  const card = { background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: 14, padding: 20 };
  const inp  = { width: "100%", padding: "9px 12px", boxSizing: "border-box", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, color: "#e2e8f0", fontFamily: "inherit", fontSize: 13 };
  const lbl  = { fontSize: 10, letterSpacing: "2px", color: "#64748b", display: "block", marginBottom: 5 };
  const thSt = col => ({ padding: "11px 14px", textAlign: "left", fontSize: 10, letterSpacing: "1.5px", color: sortCol === col ? "#00ff88" : "#475569", whiteSpace: "nowrap", cursor: "pointer", userSelect: "none", background: "rgba(0,0,0,.25)", borderBottom: "1px solid rgba(255,255,255,.07)" });

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#070710", fontFamily: "'Courier New', monospace", color: "#e2e8f0", position: "relative", overflowX: "hidden" }}>

      {/* BG grid */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: "linear-gradient(rgba(0,255,136,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,.02) 1px,transparent 1px)", backgroundSize: "44px 44px", pointerEvents: "none" }} />
      <div style={{ position: "fixed", top: -150, left: -150, width: 550, height: 550, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,255,136,.07),transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", bottom: -150, right: -150, width: 650, height: 650, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,.07),transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: toast.type === "err" ? "#dc2626" : "#00ff88", color: toast.type === "err" ? "#fff" : "#070710", padding: "12px 20px", borderRadius: 10, fontWeight: "bold", fontSize: 13, boxShadow: "0 8px 40px rgba(0,0,0,.5)", animation: "slideIn .3s ease", maxWidth: 340 }}>
          {toast.msg}
        </div>
      )}

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1120, margin: "0 auto", padding: "24px 16px" }}>

        {/* ── HEADER ── */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 10, letterSpacing: "6px", color: "#00ff88", marginBottom: 6 }}>REMOLY TEAM</div>
          <h1 style={{ margin: 0, fontSize: "clamp(28px,5vw,44px)", fontWeight: 900, letterSpacing: "-1px", color: "#fff", textShadow: "0 0 40px rgba(0,255,136,.2)" }}>
            TIME TRACKER
          </h1>
          <div style={{ fontSize: 11, color: "#1e293b", letterSpacing: "3px", marginTop: 6 }}>
            DISTRIBUTED TEAM · MULTI-TIMEZONE · SUPABASE BACKEND
          </div>
        </div>

        {/* ── STATS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
          {[
            { label: "TOTAL SESSIONS", val: sessions.length,   c: "#e2e8f0" },
            { label: "TOTAL HOURS",    val: hms(totalSecs),    c: "#00ff88" },
            { label: "TEAM MEMBERS",   val: uniqueDevs.length, c: "#6366f1" },
            { label: "ACTIVE NOW",     val: activeCnt, c: activeCnt > 0 ? "#dc2626" : "#e2e8f0", glow: activeCnt > 0 },
          ].map((s, i) => (
            <div key={i} style={{ ...card, textAlign: "center", border: s.glow ? "1px solid rgba(220,38,38,.3)" : card.border, boxShadow: s.glow ? "0 0 20px rgba(220,38,38,.1)" : "none" }}>
              <div style={{ fontSize: "clamp(18px,3vw,26px)", fontWeight: 900, color: s.c, fontVariantNumeric: "tabular-nums" }}>{s.val}</div>
              <div style={{ fontSize: 9, letterSpacing: "2px", color: "#475569", marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── NAV ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,.06)", paddingBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
          {[
            { id: "clock", l: "⏱  CLOCK IN/OUT" },
            { id: "logs",  l: "📋  SESSION LOG" },
            { id: "team",  l: "👥  TEAM SUMMARY" },
          ].map(t => (
            <button key={t.id} onClick={() => setView(t.id)}
              style={{ padding: "9px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 11, fontWeight: "bold", letterSpacing: "1px", background: view === t.id ? "#00ff88" : "rgba(255,255,255,.05)", color: view === t.id ? "#070710" : "#64748b", transition: "all .15s" }}>
              {t.l}
            </button>
          ))}
          <button onClick={() => load()}
            style={{ marginLeft: "auto", padding: "9px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,.07)", background: "transparent", color: "#334155", cursor: "pointer", fontFamily: "inherit", fontSize: 10, letterSpacing: "1px" }}>
            {refreshing ? "…" : "↻ REFRESH"}
          </button>
        </div>

        {/* ════════════════════ CLOCK VIEW */}
        {view === "clock" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

            <div style={card}>
              <div style={{ fontSize: 10, letterSpacing: "3px", color: "#00ff88", marginBottom: 20 }}>DEVELOPER INFO</div>
              {[
                { lbl: "YOUR NAME *",     v: devName,  set: setDevName,  ph: "e.g. Ahmed Khan" },
                { lbl: "TASK / TICKET *", v: taskName, set: setTaskName, ph: "e.g. Fix auth bug · JIRA-123" },
              ].map(f => (
                <div key={f.lbl} style={{ marginBottom: 14 }}>
                  <label style={lbl}>{f.lbl}</label>
                  <input value={f.v} onChange={e => f.set(e.target.value)} placeholder={f.ph} disabled={!!active} style={inp} />
                </div>
              ))}
              <div style={{ marginBottom: 14 }}>
                <label style={lbl}>DESCRIPTION (OPTIONAL)</label>
                <textarea value={taskDesc} onChange={e => setTaskDesc(e.target.value)}
                  placeholder="Brief notes on what you're doing…" disabled={!!active}
                  style={{ ...inp, resize: "vertical", minHeight: 64 }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={lbl}>YOUR TIMEZONE</label>
                <select value={tz} onChange={e => setTz(e.target.value)} disabled={!!active} style={{ ...inp, background: "#0d1117" }}>
                  {TIMEZONES.map(t => <option key={t.value} value={t.value}>{t.flag} {t.label}</option>)}
                </select>
              </div>
              {!active ? (
                <button onClick={startClock} disabled={busy}
                  style={{ width: "100%", padding: 14, background: busy ? "#065f46" : "#00ff88", color: "#070710", border: "none", borderRadius: 10, fontFamily: "inherit", fontSize: 14, fontWeight: 900, letterSpacing: "2px", cursor: "pointer", transition: "all .15s" }}>
                  {busy ? "STARTING…" : "▶   START CLOCK"}
                </button>
              ) : (
                <button onClick={stopClock} disabled={busy}
                  style={{ width: "100%", padding: 14, background: busy ? "#7f1d1d" : "#dc2626", color: "#fff", border: "none", borderRadius: 10, fontFamily: "inherit", fontSize: 14, fontWeight: 900, letterSpacing: "2px", cursor: "pointer", animation: "glowRed 2s infinite" }}>
                  {busy ? "SAVING…" : "⏹   STOP & SAVE"}
                </button>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ ...card, background: "rgba(0,255,136,.04)", border: "1px solid rgba(0,255,136,.15)", textAlign: "center" }}>
                <div style={{ fontSize: 10, letterSpacing: "3px", color: "#00ff88", marginBottom: 8 }}>
                  {tzMeta?.flag} {tzMeta?.label?.toUpperCase()}
                </div>
                <div style={{ fontSize: "clamp(13px,2vw,15px)", fontWeight: "bold" }}>
                  <LiveClock tz={tz} />
                </div>
              </div>

              {active ? (
                <div style={{ ...card, background: "rgba(220,38,38,.05)", border: "1px solid rgba(220,38,38,.25)", flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
                    <span style={{ width: 8, height: 8, background: "#dc2626", borderRadius: "50%", display: "inline-block", animation: "pulse 1s infinite" }} />
                    <span style={{ fontSize: 10, letterSpacing: "3px", color: "#dc2626" }}>SESSION RECORDING</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: aColor(active.developer_name), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 900, color: "#070710", flexShrink: 0 }}>
                      {initials(active.developer_name)}
                    </div>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: "bold" }}>{active.developer_name}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8" }}>{active.task_name}</div>
                    </div>
                  </div>
                  {active.task_description && (
                    <div style={{ background: "rgba(255,255,255,.04)", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#64748b", marginBottom: 16 }}>
                      {active.task_description}
                    </div>
                  )}
                  <div style={{ fontSize: 10, color: "#64748b", letterSpacing: "2px", marginBottom: 4 }}>ELAPSED TIME</div>
                  <div style={{ fontSize: "clamp(30px,6vw,46px)", fontWeight: 900, color: "#dc2626", fontVariantNumeric: "tabular-nums", letterSpacing: "-1px" }}>
                    {hms(elapsed)}
                  </div>
                  <div style={{ fontSize: 11, color: "#475569", marginTop: 10 }}>
                    Started · {fmtDate(active.start_time, active.timezone)} {fmtTime(active.start_time, active.timezone)}
                  </div>
                </div>
              ) : (
                <div style={{ ...card, border: "1px dashed rgba(255,255,255,.06)", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 10 }}>
                  <div style={{ fontSize: 48, opacity: .12 }}>⏰</div>
                  <div style={{ fontSize: 13, color: "#1e293b" }}>No active session</div>
                  <div style={{ fontSize: 11, color: "#0f172a" }}>Fill in your details and hit Start Clock</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════ SESSION LOG */}
        {view === "logs" && (
          <div>
            <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="🔍  Search name, task, description…"
                style={{ ...inp, width: "auto", flex: "1 1 200px", fontSize: 12 }} />
              <select value={filterDev} onChange={e => setFilterDev(e.target.value)} style={{ ...inp, width: "auto", background: "#0d1117", fontSize: 12 }}>
                <option value="ALL">All Developers</option>
                {uniqueDevs.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inp, width: "auto", background: "#0d1117", fontSize: 12 }}>
                <option value="ALL">All Status</option>
                <option value="completed">Completed</option>
                <option value="active">Active</option>
              </select>
            </div>

            <div style={{ fontSize: 11, color: "#334155", marginBottom: 10, letterSpacing: "1px" }}>
              SHOWING {tableRows.length} / {sessions.length} RECORDS
            </div>

            <div style={{ overflowX: "auto", borderRadius: 14, border: "1px solid rgba(255,255,255,.07)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 960 }}>
                <thead>
                  <tr>
                    {[
                      { col: "developer_name",  lbl: "DEVELOPER" },
                      { col: "task_name",        lbl: "TASK / TICKET" },
                      { col: "task_description", lbl: "DESCRIPTION" },
                      { col: "timezone",         lbl: "TIMEZONE" },
                      { col: "start_time",       lbl: "DATE" },
                      { col: "start_time",       lbl: "START", id: "st" },
                      { col: "end_time",         lbl: "END" },
                      { col: "duration_seconds", lbl: "HOURS WORKED" },
                      { col: "status",           lbl: "STATUS" },
                    ].map(h => (
                      <th key={h.id || h.col + h.lbl} onClick={() => toggleSort(h.col)} style={thSt(h.col)}>
                        {h.lbl} {sortCol === h.col && <span style={{ color: "#00ff88" }}>{sortDir === "asc" ? "↑" : "↓"}</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.length === 0 && (
                    <tr><td colSpan={9} style={{ padding: 48, textAlign: "center", color: "#1e293b", fontSize: 13 }}>
                      {refreshing ? "Loading sessions…" : "No sessions match your filters."}
                    </td></tr>
                  )}
                  {tableRows.map((s, i) => {
                    const liveSecs = s.status === "active" ? Math.floor((Date.now() - new Date(s.start_time).getTime()) / 1000) : null;
                    const bg = i % 2 === 0 ? "rgba(255,255,255,.015)" : "transparent";
                    return (
                      <tr key={s.id} style={{ borderBottom: "1px solid rgba(255,255,255,.04)", background: bg }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(0,255,136,.03)"}
                        onMouseLeave={e => e.currentTarget.style.background = bg}>
                        <td style={{ padding: "13px 14px", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: aColor(s.developer_name), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 900, color: "#070710", flexShrink: 0 }}>
                              {initials(s.developer_name)}
                            </div>
                            <span style={{ fontWeight: "bold", color: "#e2e8f0" }}>{s.developer_name}</span>
                          </div>
                        </td>
                        <td style={{ padding: "13px 14px", maxWidth: 180 }}>
                          <span style={{ fontWeight: 600, color: "#e2e8f0", wordBreak: "break-word" }}>{s.task_name}</span>
                        </td>
                        <td style={{ padding: "13px 14px", maxWidth: 200 }}>
                          <span style={{ color: "#64748b", fontSize: 11, wordBreak: "break-word" }}>
                            {s.task_description || <span style={{ color: "#1e293b" }}>—</span>}
                          </span>
                        </td>
                        <td style={{ padding: "13px 14px", whiteSpace: "nowrap", fontSize: 11, color: "#64748b" }}>
                          {TIMEZONES.find(t => t.value === s.timezone)?.flag || "🌍"}{" "}
                          {(s.timezone || "").split("/")[1] || s.timezone}
                        </td>
                        <td style={{ padding: "13px 14px", whiteSpace: "nowrap", fontSize: 11, color: "#94a3b8" }}>{fmtDate(s.start_time, s.timezone)}</td>
                        <td style={{ padding: "13px 14px", whiteSpace: "nowrap", fontSize: 11, color: "#94a3b8" }}>{fmtTime(s.start_time, s.timezone)}</td>
                        <td style={{ padding: "13px 14px", whiteSpace: "nowrap", fontSize: 11, color: s.end_time ? "#94a3b8" : "#1e293b" }}>
                          {s.end_time ? fmtTime(s.end_time, s.timezone) : "—"}
                        </td>
                        <td style={{ padding: "13px 14px", whiteSpace: "nowrap" }}>
                          <div style={{ fontWeight: "bold", fontVariantNumeric: "tabular-nums", color: s.status === "active" ? "#dc2626" : "#00ff88", fontSize: 13 }}>
                            {s.status === "active"
                              ? <span style={{ animation: "pulse 2s infinite", display: "inline-block" }}>⏱ {hms(liveSecs)}</span>
                              : hms(s.duration_seconds)}
                          </div>
                          {s.status === "completed" && s.duration_seconds != null && (
                            <div style={{ fontSize: 10, color: "#334155", marginTop: 2 }}>{hmLabel(s.duration_seconds)}</div>
                          )}
                        </td>
                        <td style={{ padding: "13px 14px" }}>
                          <span style={{ padding: "4px 11px", borderRadius: 20, fontSize: 9, fontWeight: "bold", letterSpacing: "1.5px", background: s.status === "active" ? "rgba(220,38,38,.15)" : "rgba(0,255,136,.1)", color: s.status === "active" ? "#dc2626" : "#00ff88", border: `1px solid ${s.status === "active" ? "rgba(220,38,38,.3)" : "rgba(0,255,136,.2)"}` }}>
                            {s.status === "active" ? "🔴 ACTIVE" : "✅ DONE"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {tableRows.length > 0 && (
              <div style={{ display: "flex", gap: 20, marginTop: 12, fontSize: 11, color: "#475569", justifyContent: "flex-end" }}>
                <span>FILTERED: <strong style={{ color: "#e2e8f0" }}>{tableRows.length}</strong></span>
                <span>TOTAL TIME: <strong style={{ color: "#00ff88" }}>
                  {hms(tableRows.filter(s => s.status === "completed").reduce((a, s) => a + (s.duration_seconds || 0), 0))}
                </strong></span>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════ TEAM SUMMARY */}
        {view === "team" && (
          <div>
            <div style={{ fontSize: 10, letterSpacing: "3px", color: "#64748b", marginBottom: 16 }}>TEAM PERFORMANCE OVERVIEW</div>
            {devStats.length === 0 ? (
              <div style={{ ...card, textAlign: "center", color: "#1e293b", padding: 48 }}>No team data yet. Start some sessions!</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
                {devStats.map(d => {
                  const pct = totalSecs > 0 ? Math.round((d.secs / totalSecs) * 100) : 0;
                  const devSessions = sessions.filter(s => s.developer_name === d.name);
                  const isOnline = devSessions.some(s => s.status === "active");
                  const tasks = [...new Set(devSessions.map(s => s.task_name))].slice(0, 3);
                  return (
                    <div key={d.name} style={{ ...card, border: isOnline ? "1px solid rgba(220,38,38,.3)" : card.border, boxShadow: isOnline ? "0 0 20px rgba(220,38,38,.08)" : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                        <div style={{ width: 48, height: 48, borderRadius: "50%", background: aColor(d.name), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 900, color: "#070710", flexShrink: 0, position: "relative" }}>
                          {initials(d.name)}
                          {isOnline && <div style={{ position: "absolute", bottom: 0, right: 0, width: 12, height: 12, background: "#dc2626", borderRadius: "50%", border: "2px solid #070710", animation: "pulse 1s infinite" }} />}
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: "bold", color: "#e2e8f0" }}>{d.name}</div>
                          <div style={{ fontSize: 11, color: isOnline ? "#dc2626" : "#64748b" }}>{isOnline ? "🔴 Currently active" : "Offline"}</div>
                        </div>
                        <div style={{ marginLeft: "auto", textAlign: "right" }}>
                          <div style={{ fontSize: 14, color: "#00ff88", fontWeight: "bold" }}>{pct}%</div>
                          <div style={{ fontSize: 9, color: "#475569" }}>OF TOTAL</div>
                        </div>
                      </div>
                      <div style={{ height: 4, background: "rgba(255,255,255,.06)", borderRadius: 2, marginBottom: 14, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: aColor(d.name), borderRadius: 2 }} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                        {[
                          { label: "SESSIONS",     val: d.sessions },
                          { label: "HOURS LOGGED", val: hms(d.secs) },
                        ].map(stat => (
                          <div key={stat.label} style={{ background: "rgba(255,255,255,.03)", borderRadius: 8, padding: "10px 12px" }}>
                            <div style={{ fontSize: 15, fontWeight: 900, color: "#e2e8f0", fontVariantNumeric: "tabular-nums" }}>{stat.val}</div>
                            <div style={{ fontSize: 9, color: "#475569", letterSpacing: "1px", marginTop: 2 }}>{stat.label}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 9, color: "#475569", letterSpacing: "1.5px", marginBottom: 6 }}>RECENT TASKS</div>
                      {tasks.map((t, ti) => (
                        <div key={ti} style={{ fontSize: 11, color: "#64748b", padding: "4px 0", borderBottom: ti < tasks.length - 1 ? "1px solid rgba(255,255,255,.04)" : "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          · {t}
                        </div>
                      ))}
                      {tasks.length === 0 && <div style={{ fontSize: 11, color: "#1e293b" }}>No tasks yet</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 28, fontSize: 9, color: "#0f172a", letterSpacing: "3px" }}>
          REMOLY TIME TRACKER · SUPABASE BACKEND · TIMES STORED AS UTC
        </div>
      </div>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; padding: 0; }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes slideIn { from{transform:translateX(80px);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes glowRed { 0%,100%{box-shadow:0 0 12px rgba(220,38,38,.3)} 50%{box-shadow:0 0 28px rgba(220,38,38,.6)} }
        input:focus, textarea:focus, select:focus { outline: 1px solid #00ff88 !important; border-color: #00ff88 !important; }
        button:hover { opacity: .82; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: #070710; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 3px; }
      `}</style>
    </div>
  );
}
