import { useState, useEffect, useRef } from "react";

// ─── Supabase ────────────────────────────────────────────────────────────────
const SB_URL = "https://rrexmdfnyyurqtmvebiw.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyZXhtZGZueXl1cnF0bXZlYml3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzAzMjEsImV4cCI6MjA4ODEwNjMyMX0.nmPMCosEMFj1epHMvsOVyfAoWJXDPqU0AL11ZcrE0j8";
const H = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" };

const api = {
  get:    (path) => fetch(`${SB_URL}/rest/v1/${path}`, { headers: H }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e))),
  post:   (path, body) => fetch(`${SB_URL}/rest/v1/${path}`, { method: "POST", headers: H, body: JSON.stringify(body) }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e))),
  patch:  (path, body) => fetch(`${SB_URL}/rest/v1/${path}`, { method: "PATCH", headers: H, body: JSON.stringify(body) }).then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e))),
  delete: (path) => fetch(`${SB_URL}/rest/v1/${path}`, { method: "DELETE", headers: H }).then(r => { if (!r.ok) return r.json().then(e => Promise.reject(e)); return []; }),
};

// ─── Admin credentials ───────────────────────────────────────────────────────
const ADMIN_USER = "ahsan";
const ADMIN_PASS = "ahsan123";

// ─── Constants ───────────────────────────────────────────────────────────────
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
const COLORS = ["#00ff88","#6366f1","#f59e0b","#ec4899","#06b6d4","#a78bfa","#34d399","#fb923c"];
const PROJECT_COLORS = ["#00ff88","#6366f1","#f59e0b","#ec4899","#06b6d4","#a78bfa","#f97316","#14b8a6"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const aColor  = n => COLORS[(n||"").charCodeAt(0) % COLORS.length];
const pColor  = n => PROJECT_COLORS[(n||"").charCodeAt(0) % PROJECT_COLORS.length];
const initials = n => (n||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

function hms(s) {
  if (s == null || s < 0) return "—";
  const h = Math.floor(s/3600), m = Math.floor((s%3600)/60), sec = s%60;
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
}
function hmLabel(s) { if (!s) return ""; return `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`; }
function fmtDate(iso, tz) {
  if (!iso) return "—";
  try { return new Intl.DateTimeFormat("en-US",{timeZone:tz||"Asia/Karachi",year:"numeric",month:"short",day:"2-digit"}).format(new Date(iso)); } catch { return "—"; }
}
function fmtTime(iso, tz) {
  if (!iso) return "—";
  try { return new Intl.DateTimeFormat("en-US",{timeZone:tz||"Asia/Karachi",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:true}).format(new Date(iso)); } catch { return "—"; }
}
function fmtDateTime(iso, tz) {
  if (!iso) return "—";
  try { return new Intl.DateTimeFormat("en-US",{timeZone:tz||"Asia/Karachi",year:"numeric",month:"short",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:true}).format(new Date(iso)); } catch { return "—"; }
}

function LiveClock({ tz }) {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () => setT(new Intl.DateTimeFormat("en-US",{timeZone:tz,hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:true,weekday:"short",month:"short",day:"numeric"}).format(new Date()));
    tick(); const id = setInterval(tick,1000); return ()=>clearInterval(id);
  }, [tz]);
  return <>{t}</>;
}

// ─── SQL Setup text ───────────────────────────────────────────────────────────
const SETUP_SQL = `-- Run once in Supabase SQL Editor

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  color       TEXT DEFAULT '#00ff88',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open_projects" ON projects FOR ALL USING (true) WITH CHECK (true);

-- Add project_id to existing time_sessions (safe to run even if column exists)
ALTER TABLE time_sessions ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Refresh RLS on time_sessions
ALTER TABLE time_sessions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='time_sessions' AND policyname='open_access') THEN
    CREATE POLICY "open_access" ON time_sessions FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;`;

// ─── Shared style constants ───────────────────────────────────────────────────
const S = {
  card: { background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.07)", borderRadius:14, padding:20 },
  inp:  { width:"100%", padding:"9px 12px", boxSizing:"border-box", background:"rgba(255,255,255,.05)", border:"1px solid rgba(255,255,255,.1)", borderRadius:8, color:"#e2e8f0", fontFamily:"inherit", fontSize:13 },
  lbl:  { fontSize:10, letterSpacing:"2px", color:"#64748b", display:"block", marginBottom:5 },
  btn:  (bg="#00ff88",c="#070710") => ({ padding:"9px 18px", borderRadius:8, border:"none", cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:"bold", letterSpacing:"1px", background:bg, color:c }),
};

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [page, setPage]         = useState("projects"); // projects | tracker | admin | adminLogin | setup
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [isAdmin, setIsAdmin]   = useState(false);
  const [toast, setToast]       = useState(null);
  const [dbReady, setDbReady]   = useState(true);

  const toast$ = (msg, type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

  const loadProjects = async () => {
    try { setProjects(await api.get("projects?order=created_at.asc")); setDbReady(true); }
    catch(e) {
      if (e?.code==="42P01" || String(e?.message).includes("does not exist")) { setDbReady(false); setPage("setup"); }
      else toast$("Error loading projects: "+(e?.message||JSON.stringify(e)),"err");
    }
  };

  const loadSessions = async (projectId) => {
    try {
      const qs = projectId ? `project_id=eq.${projectId}` : "";
      setSessions(await api.get(`time_sessions?${qs}&order=created_at.desc&limit=500`));
    } catch(e) { toast$("Error loading sessions: "+(e?.message||JSON.stringify(e)),"err"); }
  };

  useEffect(() => { loadProjects(); }, []);
  useEffect(() => { if (activeProject) loadSessions(activeProject.id); }, [activeProject]);

  const openProject = (p) => { setActiveProject(p); setPage("tracker"); };
  const goProjects  = () => { setActiveProject(null); setPage("projects"); loadProjects(); };

  return (
    <div style={{ minHeight:"100vh", background:"#070710", fontFamily:"'Courier New',monospace", color:"#e2e8f0", position:"relative", overflowX:"hidden" }}>
      {/* BG */}
      <div style={{position:"fixed",inset:0,zIndex:0,backgroundImage:"linear-gradient(rgba(0,255,136,.02) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,136,.02) 1px,transparent 1px)",backgroundSize:"44px 44px",pointerEvents:"none"}}/>
      <div style={{position:"fixed",top:-150,left:-150,width:600,height:600,borderRadius:"50%",background:"radial-gradient(circle,rgba(0,255,136,.06),transparent 70%)",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"fixed",bottom:-150,right:-150,width:700,height:700,borderRadius:"50%",background:"radial-gradient(circle,rgba(99,102,241,.06),transparent 70%)",pointerEvents:"none",zIndex:0}}/>

      {/* Toast */}
      {toast && (
        <div style={{position:"fixed",top:20,right:20,zIndex:9999,background:toast.type==="err"?"#dc2626":"#00ff88",color:toast.type==="err"?"#fff":"#070710",padding:"12px 20px",borderRadius:10,fontWeight:"bold",fontSize:13,boxShadow:"0 8px 40px rgba(0,0,0,.5)",animation:"slideIn .3s ease",maxWidth:360}}>
          {toast.msg}
        </div>
      )}

      <div style={{position:"relative",zIndex:1,maxWidth:1200,margin:"0 auto",padding:"0 16px 40px"}}>

        {/* ── TOP BAR ── */}
        <TopBar
          page={page} isAdmin={isAdmin} activeProject={activeProject}
          onProjects={goProjects}
          onAdmin={() => isAdmin ? setPage("admin") : setPage("adminLogin")}
          onLogout={() => { setIsAdmin(false); setPage("projects"); }}
        />

        {/* ── PAGES ── */}
        {page==="setup"   && <SetupPage sql={SETUP_SQL} onRetry={()=>{ loadProjects(); setPage("projects"); }}/>}
        {page==="projects"&& <ProjectsPage projects={projects} onOpen={openProject} onRefresh={loadProjects} toast$={toast$} />}
        {page==="tracker" && activeProject && (
          <TrackerPage
            project={activeProject} sessions={sessions}
            onRefresh={()=>loadSessions(activeProject.id)} toast$={toast$}
          />
        )}
        {page==="adminLogin" && <AdminLogin onSuccess={()=>{ setIsAdmin(true); setPage("admin"); }} toast$={toast$} />}
        {page==="admin" && isAdmin && (
          <AdminPage
            projects={projects} sessions={sessions}
            onRefreshProjects={loadProjects}
            onRefreshSessions={()=>loadSessions(activeProject?.id)}
            toast$={toast$}
          />
        )}
      </div>

      <style>{`
        *{box-sizing:border-box}
        body{margin:0;padding:0}
        @keyframes pulse   {0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes slideIn {from{transform:translateX(80px);opacity:0}to{transform:translateX(0);opacity:1}}
        @keyframes glowRed {0%,100%{box-shadow:0 0 12px rgba(220,38,38,.3)}50%{box-shadow:0 0 28px rgba(220,38,38,.6)}}
        @keyframes fadeIn  {from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        input:focus,textarea:focus,select:focus{outline:1px solid #00ff88 !important;border-color:#00ff88 !important}
        button:hover{opacity:.82}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:#070710}
        ::-webkit-scrollbar-thumb{background:#1e293b;border-radius:3px}
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOP BAR
// ═══════════════════════════════════════════════════════════════════════════════
function TopBar({ page, isAdmin, activeProject, onProjects, onAdmin, onLogout }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:16,padding:"20px 0 16px",borderBottom:"1px solid rgba(255,255,255,.06)",marginBottom:28,flexWrap:"wrap"}}>
      {/* Brand */}
      <div style={{display:"flex",flexDirection:"column",cursor:"pointer"}} onClick={onProjects}>
        <div style={{fontSize:10,letterSpacing:"5px",color:"#00ff88",marginBottom:2}}>TENSORFOLD.AI</div>
        <div style={{fontSize:"clamp(16px,3vw,22px)",fontWeight:900,color:"#fff",letterSpacing:"-0.5px",lineHeight:1}}>
          TIME TRACKER
        </div>
      </div>

      {/* Breadcrumb */}
      {activeProject && (
        <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#475569"}}>
          <span style={{cursor:"pointer",color:"#64748b"}} onClick={onProjects}>All Projects</span>
          <span>/</span>
          <span style={{color:activeProject.color||"#00ff88",fontWeight:"bold"}}>{activeProject.name}</span>
        </div>
      )}

      <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        <button onClick={onProjects}
          style={{...S.btn(page==="projects"?"#00ff88":"rgba(255,255,255,.06)",page==="projects"?"#070710":"#64748b")}}>
          🗂 PROJECTS
        </button>
        {isAdmin ? (
          <>
            <button onClick={onAdmin}
              style={{...S.btn(page==="admin"?"#6366f1":"rgba(255,255,255,.06)",page==="admin"?"#fff":"#64748b")}}>
              ⚙ ADMIN
            </button>
            <button onClick={onLogout} style={{...S.btn("rgba(220,38,38,.15)","#dc2626"), border:"1px solid rgba(220,38,38,.25)"}}>
              LOGOUT
            </button>
          </>
        ) : (
          <button onClick={onAdmin} style={{...S.btn("rgba(255,255,255,.06)","#64748b")}}>
            🔐 ADMIN
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SETUP PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function SetupPage({ sql, onRetry }) {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{...S.card, border:"1px solid rgba(251,191,36,.2)", animation:"fadeIn .4s ease"}}>
      <div style={{fontSize:10,letterSpacing:"3px",color:"#fbbf24",marginBottom:16}}>⚙ DATABASE SETUP REQUIRED</div>
      <p style={{color:"#94a3b8",lineHeight:1.7,marginBottom:12,fontSize:13}}>
        Run this SQL once in your{" "}
        <a href="https://supabase.com/dashboard/project/rrexmdfnyyurqtmvebiw/sql" target="_blank" rel="noreferrer" style={{color:"#00ff88"}}>Supabase SQL Editor ↗</a>
      </p>
      <div style={{position:"relative"}}>
        <pre style={{background:"#0d1117",border:"1px solid rgba(0,255,136,.15)",borderRadius:10,padding:20,overflowX:"auto",fontSize:11,color:"#00ff88",lineHeight:1.8,margin:0}}>
          {sql}
        </pre>
        <button onClick={()=>{navigator.clipboard.writeText(sql);setCopied(true);setTimeout(()=>setCopied(false),2000);}}
          style={{position:"absolute",top:10,right:10,padding:"5px 12px",background:copied?"#065f46":"rgba(0,255,136,.15)",border:"1px solid rgba(0,255,136,.3)",borderRadius:6,color:"#00ff88",fontFamily:"inherit",fontSize:10,cursor:"pointer"}}>
          {copied?"✓ COPIED":"COPY"}
        </button>
      </div>
      <div style={{marginTop:20,display:"flex",gap:10}}>
        <button onClick={onRetry} style={{...S.btn()}}>↻ RETRY CONNECTION</button>
        <a href="https://supabase.com/dashboard/project/rrexmdfnyyurqtmvebiw/sql" target="_blank" rel="noreferrer"
          style={{...S.btn("transparent","#00ff88"),border:"1px solid rgba(0,255,136,.3)",textDecoration:"none",display:"inline-flex",alignItems:"center"}}>
          OPEN SQL EDITOR ↗
        </a>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROJECTS PAGE
// ═══════════════════════════════════════════════════════════════════════════════
function ProjectsPage({ projects, onOpen, onRefresh, toast$ }) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName]         = useState("");
  const [desc, setDesc]         = useState("");
  const [color, setColor]       = useState("#00ff88");
  const [busy, setBusy]         = useState(false);

  const create = async () => {
    if (!name.trim()) return toast$("Enter a project name!","err");
    setBusy(true);
    try {
      await api.post("projects", { name: name.trim(), description: desc.trim()||null, color });
      toast$("✅ Project created!"); setName(""); setDesc(""); setShowForm(false); onRefresh();
    } catch(e) { toast$("Error: "+(e?.message||JSON.stringify(e)),"err"); }
    finally { setBusy(false); }
  };

  return (
    <div style={{animation:"fadeIn .4s ease"}}>
      {/* Header row */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:10,letterSpacing:"3px",color:"#64748b",marginBottom:4}}>WORKSPACE</div>
          <h2 style={{margin:0,fontSize:"clamp(20px,3vw,28px)",fontWeight:900,color:"#fff"}}>All Projects</h2>
        </div>
        <button onClick={()=>setShowForm(v=>!v)} style={{...S.btn(), padding:"10px 20px", fontSize:13}}>
          {showForm?"✕ CANCEL":"＋ NEW PROJECT"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div style={{...S.card, border:"1px solid rgba(0,255,136,.2)", marginBottom:24, animation:"fadeIn .3s ease"}}>
          <div style={{fontSize:10,letterSpacing:"3px",color:"#00ff88",marginBottom:16}}>CREATE PROJECT</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            <div>
              <label style={S.lbl}>PROJECT NAME *</label>
              <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Mobile App v2" style={S.inp}
                onKeyDown={e=>e.key==="Enter"&&create()}/>
            </div>
            <div>
              <label style={S.lbl}>COLOR</label>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:4}}>
                {PROJECT_COLORS.map(c=>(
                  <div key={c} onClick={()=>setColor(c)} style={{width:28,height:28,borderRadius:"50%",background:c,cursor:"pointer",border:color===c?"3px solid #fff":"3px solid transparent",transition:"all .15s"}}/>
                ))}
              </div>
            </div>
          </div>
          <div style={{marginBottom:16}}>
            <label style={S.lbl}>DESCRIPTION</label>
            <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Brief description…" style={S.inp}/>
          </div>
          <button onClick={create} disabled={busy} style={{...S.btn(), padding:"11px 24px", fontSize:13}}>
            {busy?"CREATING…":"CREATE PROJECT"}
          </button>
        </div>
      )}

      {/* Projects grid */}
      {projects.length===0 ? (
        <div style={{...S.card, textAlign:"center", padding:64, border:"1px dashed rgba(255,255,255,.06)"}}>
          <div style={{fontSize:48,marginBottom:16,opacity:.2}}>🗂</div>
          <div style={{fontSize:15,color:"#1e293b"}}>No projects yet</div>
          <div style={{fontSize:12,color:"#0f172a",marginTop:6}}>Create your first project to get started</div>
        </div>
      ) : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:16}}>
          {projects.map(p=>(
            <ProjectCard key={p.id} project={p} onOpen={onOpen} onRefresh={onRefresh} toast$={toast$}/>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project: p, onOpen, onRefresh, toast$ }) {
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting, setDeleting]     = useState(false);

  const del = async () => {
    setDeleting(true);
    try {
      await api.delete(`projects?id=eq.${p.id}`);
      toast$("Project deleted."); onRefresh();
    } catch(e) { toast$("Error: "+(e?.message||JSON.stringify(e)),"err"); setDeleting(false); }
  };

  return (
    <div style={{...S.card, cursor:"default", borderLeft:`3px solid ${p.color||"#00ff88"}`, animation:"fadeIn .4s ease", position:"relative"}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:12,marginBottom:14}}>
        <div style={{width:44,height:44,borderRadius:10,background:p.color||"#00ff88",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:900,color:"#070710",flexShrink:0}}>
          {initials(p.name)}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:16,fontWeight:"bold",color:"#e2e8f0",marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
          <div style={{fontSize:11,color:"#64748b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.description||"No description"}</div>
        </div>
      </div>
      <div style={{fontSize:10,color:"#334155",marginBottom:16,letterSpacing:"1px"}}>
        Created {fmtDate(p.created_at,"Asia/Karachi")}
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>onOpen(p)} style={{...S.btn(p.color||"#00ff88","#070710"), flex:1, padding:"10px", fontSize:12}}>
          OPEN TRACKER →
        </button>
        {!confirmDel ? (
          <button onClick={()=>setConfirmDel(true)} style={{...S.btn("rgba(220,38,38,.12)","#dc2626"), padding:"10px 14px", border:"1px solid rgba(220,38,38,.2)", fontSize:11}}>
            🗑
          </button>
        ) : (
          <button onClick={del} disabled={deleting} style={{...S.btn("#dc2626","#fff"), padding:"10px 14px", fontSize:11}}>
            {deleting?"…":"CONFIRM"}
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRACKER PAGE  (per-project)
// ═══════════════════════════════════════════════════════════════════════════════
function TrackerPage({ project, sessions, onRefresh, toast$ }) {
  const [view, setView]         = useState("clock");
  const [devName, setDevName]   = useState("");
  const [taskName, setTaskName] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [tz, setTz]             = useState("Asia/Karachi");
  const [active, setActive]     = useState(null);
  const [elapsed, setElapsed]   = useState(0);
  const [busy, setBusy]         = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterDev, setFilterDev]   = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [search, setSearch]     = useState("");
  const [sortCol, setSortCol]   = useState("created_at");
  const [sortDir, setSortDir]   = useState("desc");
  const tickRef = useRef(null);

  const load = async (silent=false) => {
    if (!silent) setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  useEffect(() => { const id=setInterval(()=>onRefresh(),30000); return()=>clearInterval(id); },[]);
  useEffect(() => {
    if (active) { tickRef.current=setInterval(()=>setElapsed(Math.floor((Date.now()-new Date(active.start_time).getTime())/1000)),1000); }
    else { clearInterval(tickRef.current); setElapsed(0); }
    return()=>clearInterval(tickRef.current);
  },[active]);

  const startClock = async () => {
    if (!devName.trim()) return toast$("Enter your name!","err");
    if (!taskName.trim()) return toast$("Enter a task name!","err");
    setBusy(true);
    try {
      const rows = await api.post("time_sessions",{developer_name:devName.trim(),task_name:taskName.trim(),task_description:taskDesc.trim()||null,timezone:tz,start_time:new Date().toISOString(),status:"active",project_id:project.id});
      setActive(Array.isArray(rows)?rows[0]:rows);
      toast$("⏱ Clock started!"); onRefresh();
    } catch(e) { toast$("Error: "+(e?.message||JSON.stringify(e)),"err"); }
    finally { setBusy(false); }
  };

  const stopClock = async () => {
    if (!active) return;
    setBusy(true);
    const secs = Math.floor((Date.now()-new Date(active.start_time).getTime())/1000);
    try {
      await api.patch(`time_sessions?id=eq.${active.id}`,{end_time:new Date().toISOString(),duration_seconds:secs,status:"completed"});
      setActive(null); setTaskName(""); setTaskDesc("");
      toast$(`✅ ${hms(secs)} logged!`); onRefresh();
    } catch(e) { toast$("Error: "+(e?.message||JSON.stringify(e)),"err"); }
    finally { setBusy(false); }
  };

  const uniqueDevs = [...new Set(sessions.map(s=>s.developer_name))].sort();
  const totalSecs  = sessions.filter(s=>s.status==="completed").reduce((a,s)=>a+(s.duration_seconds||0),0);
  const activeCnt  = sessions.filter(s=>s.status==="active").length;

  let tableRows = sessions.filter(s=>{
    if(filterDev!=="ALL"&&s.developer_name!==filterDev) return false;
    if(filterStatus!=="ALL"&&s.status!==filterStatus) return false;
    if(search){const q=search.toLowerCase();return s.developer_name?.toLowerCase().includes(q)||s.task_name?.toLowerCase().includes(q)||s.task_description?.toLowerCase().includes(q);}
    return true;
  });
  tableRows=[...tableRows].sort((a,b)=>{
    let av=a[sortCol]??0,bv=b[sortCol]??0;
    return sortDir==="asc"?(av<bv?-1:av>bv?1:0):(av>bv?-1:av<bv?1:0);
  });
  const toggleSort=col=>{if(sortCol===col)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortCol(col);setSortDir("desc");}};
  const tzMeta = TIMEZONES.find(t=>t.value===tz);
  const pc = project.color||"#00ff88";
  const thSt=col=>({padding:"11px 14px",textAlign:"left",fontSize:10,letterSpacing:"1.5px",color:sortCol===col?pc:"#475569",whiteSpace:"nowrap",cursor:"pointer",userSelect:"none",background:"rgba(0,0,0,.25)",borderBottom:"1px solid rgba(255,255,255,.07)"});

  return (
    <div style={{animation:"fadeIn .4s ease"}}>
      {/* Project header */}
      <div style={{marginBottom:24,padding:"16px 20px",background:`${pc}10`,border:`1px solid ${pc}30`,borderRadius:14,display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
        <div style={{width:48,height:48,borderRadius:10,background:pc,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:900,color:"#070710"}}>
          {initials(project.name)}
        </div>
        <div>
          <div style={{fontSize:18,fontWeight:900,color:"#fff"}}>{project.name}</div>
          {project.description&&<div style={{fontSize:12,color:"#64748b",marginTop:2}}>{project.description}</div>}
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:16,flexWrap:"wrap"}}>
          {[{l:"SESSIONS",v:sessions.length},{l:"HOURS",v:hms(totalSecs)},{l:"ACTIVE",v:activeCnt,red:activeCnt>0}].map(s=>(
            <div key={s.l} style={{textAlign:"center"}}>
              <div style={{fontSize:18,fontWeight:900,color:s.red?"#dc2626":pc}}>{s.v}</div>
              <div style={{fontSize:9,color:"#475569",letterSpacing:"2px"}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Nav */}
      <div style={{display:"flex",gap:8,marginBottom:20,borderBottom:"1px solid rgba(255,255,255,.06)",paddingBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        {[{id:"clock",l:"⏱ CLOCK IN/OUT"},{id:"logs",l:"📋 SESSION LOG"},{id:"team",l:"👥 TEAM"}].map(t=>(
          <button key={t.id} onClick={()=>setView(t.id)}
            style={{padding:"9px 18px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:"bold",letterSpacing:"1px",background:view===t.id?pc:"rgba(255,255,255,.05)",color:view===t.id?"#070710":"#64748b",transition:"all .15s"}}>
            {t.l}
          </button>
        ))}
        <button onClick={()=>load()} style={{marginLeft:"auto",padding:"9px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,.07)",background:"transparent",color:"#334155",cursor:"pointer",fontFamily:"inherit",fontSize:10}}>
          {refreshing?"…":"↻"}
        </button>
      </div>

      {/* ── CLOCK ── */}
      {view==="clock"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
          <div style={S.card}>
            <div style={{fontSize:10,letterSpacing:"3px",color:pc,marginBottom:20}}>DEVELOPER INFO</div>
            {[{lbl:"YOUR NAME *",v:devName,set:setDevName,ph:"e.g. Ahmed Khan"},{lbl:"TASK / TICKET *",v:taskName,set:setTaskName,ph:"e.g. Fix auth bug"}].map(f=>(
              <div key={f.lbl} style={{marginBottom:14}}>
                <label style={S.lbl}>{f.lbl}</label>
                <input value={f.v} onChange={e=>f.set(e.target.value)} placeholder={f.ph} disabled={!!active} style={S.inp}/>
              </div>
            ))}
            <div style={{marginBottom:14}}>
              <label style={S.lbl}>DESCRIPTION</label>
              <textarea value={taskDesc} onChange={e=>setTaskDesc(e.target.value)} placeholder="Brief notes…" disabled={!!active} style={{...S.inp,resize:"vertical",minHeight:64}}/>
            </div>
            <div style={{marginBottom:20}}>
              <label style={S.lbl}>YOUR TIMEZONE</label>
              <select value={tz} onChange={e=>setTz(e.target.value)} disabled={!!active} style={{...S.inp,background:"#0d1117"}}>
                {TIMEZONES.map(t=><option key={t.value} value={t.value}>{t.flag} {t.label}</option>)}
              </select>
            </div>
            {!active?(
              <button onClick={startClock} disabled={busy} style={{width:"100%",padding:14,background:busy?"#065f46":pc,color:"#070710",border:"none",borderRadius:10,fontFamily:"inherit",fontSize:14,fontWeight:900,letterSpacing:"2px",cursor:"pointer"}}>
                {busy?"STARTING…":"▶   START CLOCK"}
              </button>
            ):(
              <button onClick={stopClock} disabled={busy} style={{width:"100%",padding:14,background:busy?"#7f1d1d":"#dc2626",color:"#fff",border:"none",borderRadius:10,fontFamily:"inherit",fontSize:14,fontWeight:900,letterSpacing:"2px",cursor:"pointer",animation:"glowRed 2s infinite"}}>
                {busy?"SAVING…":"⏹   STOP & SAVE"}
              </button>
            )}
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{...S.card,background:`${pc}08`,border:`1px solid ${pc}25`,textAlign:"center"}}>
              <div style={{fontSize:10,letterSpacing:"3px",color:pc,marginBottom:8}}>{tzMeta?.flag} {tzMeta?.label?.toUpperCase()}</div>
              <div style={{fontSize:"clamp(13px,2vw,15px)",fontWeight:"bold"}}><LiveClock tz={tz}/></div>
            </div>
            {active?(
              <div style={{...S.card,background:"rgba(220,38,38,.05)",border:"1px solid rgba(220,38,38,.25)",flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:18}}>
                  <span style={{width:8,height:8,background:"#dc2626",borderRadius:"50%",display:"inline-block",animation:"pulse 1s infinite"}}/>
                  <span style={{fontSize:10,letterSpacing:"3px",color:"#dc2626"}}>RECORDING</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                  <div style={{width:44,height:44,borderRadius:"50%",background:aColor(active.developer_name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:"#070710"}}>
                    {initials(active.developer_name)}
                  </div>
                  <div>
                    <div style={{fontSize:17,fontWeight:"bold"}}>{active.developer_name}</div>
                    <div style={{fontSize:12,color:"#94a3b8"}}>{active.task_name}</div>
                  </div>
                </div>
                <div style={{fontSize:10,color:"#64748b",letterSpacing:"2px",marginBottom:4}}>ELAPSED</div>
                <div style={{fontSize:"clamp(30px,6vw,46px)",fontWeight:900,color:"#dc2626",fontVariantNumeric:"tabular-nums",letterSpacing:"-1px"}}>{hms(elapsed)}</div>
              </div>
            ):(
              <div style={{...S.card,border:"1px dashed rgba(255,255,255,.06)",flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",gap:10}}>
                <div style={{fontSize:48,opacity:.1}}>⏰</div>
                <div style={{fontSize:13,color:"#1e293b"}}>No active session</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── LOGS ── */}
      {view==="logs"&&(
        <div>
          <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search…" style={{...S.inp,width:"auto",flex:"1 1 180px",fontSize:12}}/>
            <select value={filterDev} onChange={e=>setFilterDev(e.target.value)} style={{...S.inp,width:"auto",background:"#0d1117",fontSize:12}}>
              <option value="ALL">All Developers</option>
              {uniqueDevs.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{...S.inp,width:"auto",background:"#0d1117",fontSize:12}}>
              <option value="ALL">All Status</option>
              <option value="completed">Completed</option>
              <option value="active">Active</option>
            </select>
          </div>
          <div style={{fontSize:11,color:"#334155",marginBottom:10}}>SHOWING {tableRows.length} / {sessions.length} RECORDS</div>
          <div style={{overflowX:"auto",borderRadius:14,border:"1px solid rgba(255,255,255,.07)"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:960}}>
              <thead>
                <tr>
                  {[{col:"developer_name",lbl:"DEVELOPER"},{col:"task_name",lbl:"TASK"},{col:"task_description",lbl:"DESCRIPTION"},{col:"timezone",lbl:"TZ"},{col:"start_time",lbl:"DATE"},{col:"start_time",lbl:"START",id:"st"},{col:"end_time",lbl:"END"},{col:"duration_seconds",lbl:"HOURS"},{col:"status",lbl:"STATUS"}].map(h=>(
                    <th key={h.id||h.col+h.lbl} onClick={()=>toggleSort(h.col)} style={thSt(h.col)}>
                      {h.lbl} {sortCol===h.col&&<span style={{color:pc}}>{sortDir==="asc"?"↑":"↓"}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.length===0&&<tr><td colSpan={9} style={{padding:48,textAlign:"center",color:"#1e293b",fontSize:13}}>{refreshing?"Loading…":"No sessions yet."}</td></tr>}
                {tableRows.map((s,i)=>{
                  const live=s.status==="active"?Math.floor((Date.now()-new Date(s.start_time).getTime())/1000):null;
                  const bg=i%2===0?"rgba(255,255,255,.015)":"transparent";
                  return(
                    <tr key={s.id} style={{borderBottom:"1px solid rgba(255,255,255,.04)",background:bg}}
                      onMouseEnter={e=>e.currentTarget.style.background=`${pc}08`}
                      onMouseLeave={e=>e.currentTarget.style.background=bg}>
                      <td style={{padding:"12px 14px",whiteSpace:"nowrap"}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <div style={{width:30,height:30,borderRadius:"50%",background:aColor(s.developer_name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,color:"#070710"}}>{initials(s.developer_name)}</div>
                          <span style={{fontWeight:"bold",color:"#e2e8f0"}}>{s.developer_name}</span>
                        </div>
                      </td>
                      <td style={{padding:"12px 14px",maxWidth:160}}><span style={{fontWeight:600,color:"#e2e8f0",wordBreak:"break-word"}}>{s.task_name}</span></td>
                      <td style={{padding:"12px 14px",maxWidth:180,fontSize:11,color:"#64748b",wordBreak:"break-word"}}>{s.task_description||"—"}</td>
                      <td style={{padding:"12px 14px",fontSize:11,color:"#64748b",whiteSpace:"nowrap"}}>{TIMEZONES.find(t=>t.value===s.timezone)?.flag||"🌍"} {(s.timezone||"").split("/")[1]||s.timezone}</td>
                      <td style={{padding:"12px 14px",fontSize:11,color:"#94a3b8",whiteSpace:"nowrap"}}>{fmtDate(s.start_time,s.timezone)}</td>
                      <td style={{padding:"12px 14px",fontSize:11,color:"#94a3b8",whiteSpace:"nowrap"}}>{fmtTime(s.start_time,s.timezone)}</td>
                      <td style={{padding:"12px 14px",fontSize:11,color:s.end_time?"#94a3b8":"#1e293b",whiteSpace:"nowrap"}}>{s.end_time?fmtTime(s.end_time,s.timezone):"—"}</td>
                      <td style={{padding:"12px 14px",whiteSpace:"nowrap"}}>
                        <div style={{fontWeight:"bold",fontVariantNumeric:"tabular-nums",color:s.status==="active"?"#dc2626":pc,fontSize:13}}>
                          {s.status==="active"?<span style={{animation:"pulse 2s infinite",display:"inline-block"}}>⏱ {hms(live)}</span>:hms(s.duration_seconds)}
                        </div>
                        {s.status==="completed"&&s.duration_seconds!=null&&<div style={{fontSize:10,color:"#334155",marginTop:2}}>{hmLabel(s.duration_seconds)}</div>}
                      </td>
                      <td style={{padding:"12px 14px"}}>
                        <span style={{padding:"3px 10px",borderRadius:20,fontSize:9,fontWeight:"bold",letterSpacing:"1px",background:s.status==="active"?"rgba(220,38,38,.15)":`${pc}18`,color:s.status==="active"?"#dc2626":pc,border:`1px solid ${s.status==="active"?"rgba(220,38,38,.3)":pc+"40"}`}}>
                          {s.status==="active"?"🔴 ACTIVE":"✅ DONE"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {tableRows.length>0&&(
            <div style={{display:"flex",gap:20,marginTop:12,fontSize:11,color:"#475569",justifyContent:"flex-end"}}>
              <span>TOTAL: <strong style={{color:pc}}>{hms(tableRows.filter(s=>s.status==="completed").reduce((a,s)=>a+(s.duration_seconds||0),0))}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* ── TEAM ── */}
      {view==="team"&&(
        <div>
          {uniqueDevs.length===0?(
            <div style={{...S.card,textAlign:"center",color:"#1e293b",padding:48}}>No team data yet.</div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>
              {uniqueDevs.map(d=>{
                const mine=sessions.filter(s=>s.developer_name===d);
                const secs=mine.filter(s=>s.status==="completed").reduce((a,s)=>a+(s.duration_seconds||0),0);
                const pct=totalSecs>0?Math.round((secs/totalSecs)*100):0;
                const online=mine.some(s=>s.status==="active");
                const tasks=[...new Set(mine.map(s=>s.task_name))].slice(0,3);
                return(
                  <div key={d} style={{...S.card,border:online?"1px solid rgba(220,38,38,.3)":S.card.border,boxShadow:online?"0 0 20px rgba(220,38,38,.08)":"none"}}>
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                      <div style={{width:44,height:44,borderRadius:"50%",background:aColor(d),display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:900,color:"#070710",position:"relative"}}>
                        {initials(d)}
                        {online&&<div style={{position:"absolute",bottom:0,right:0,width:11,height:11,background:"#dc2626",borderRadius:"50%",border:"2px solid #070710",animation:"pulse 1s infinite"}}/>}
                      </div>
                      <div>
                        <div style={{fontSize:14,fontWeight:"bold",color:"#e2e8f0"}}>{d}</div>
                        <div style={{fontSize:11,color:online?"#dc2626":"#64748b"}}>{online?"🔴 Active":"Offline"}</div>
                      </div>
                      <div style={{marginLeft:"auto",textAlign:"right"}}>
                        <div style={{fontSize:13,color:pc,fontWeight:"bold"}}>{pct}%</div>
                      </div>
                    </div>
                    <div style={{height:3,background:"rgba(255,255,255,.06)",borderRadius:2,marginBottom:14,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${pct}%`,background:pc,borderRadius:2}}/>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                      {[{l:"SESSIONS",v:mine.length},{l:"HOURS",v:hms(secs)}].map(st=>(
                        <div key={st.l} style={{background:"rgba(255,255,255,.03)",borderRadius:8,padding:"8px 10px"}}>
                          <div style={{fontSize:14,fontWeight:900,color:"#e2e8f0"}}>{st.v}</div>
                          <div style={{fontSize:9,color:"#475569",letterSpacing:"1px"}}>{st.l}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{fontSize:9,color:"#475569",letterSpacing:"1.5px",marginBottom:5}}>RECENT TASKS</div>
                    {tasks.map((t,ti)=><div key={ti} style={{fontSize:11,color:"#64748b",padding:"3px 0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",borderBottom:ti<tasks.length-1?"1px solid rgba(255,255,255,.04)":"none"}}>· {t}</div>)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN LOGIN
// ═══════════════════════════════════════════════════════════════════════════════
function AdminLogin({ onSuccess, toast$ }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [show, setShow] = useState(false);

  const login = () => {
    if (u === ADMIN_USER && p === ADMIN_PASS) { onSuccess(); }
    else toast$("Invalid username or password","err");
  };

  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"60vh",animation:"fadeIn .4s ease"}}>
      <div style={{width:"100%",maxWidth:420}}>
        <div style={{...S.card,border:"1px solid rgba(99,102,241,.25)"}}>
          <div style={{textAlign:"center",marginBottom:28}}>
            <div style={{fontSize:32,marginBottom:8}}>🔐</div>
            <div style={{fontSize:10,letterSpacing:"4px",color:"#6366f1",marginBottom:4}}>TENSORFOLD.AI</div>
            <div style={{fontSize:20,fontWeight:900,color:"#fff"}}>Admin Panel</div>
            <div style={{fontSize:11,color:"#475569",marginTop:4}}>Enter credentials to continue</div>
          </div>
          <div style={{marginBottom:14}}>
            <label style={S.lbl}>USERNAME</label>
            <input value={u} onChange={e=>setU(e.target.value)} placeholder="Username" style={S.inp} onKeyDown={e=>e.key==="Enter"&&login()}/>
          </div>
          <div style={{marginBottom:20}}>
            <label style={S.lbl}>PASSWORD</label>
            <div style={{position:"relative"}}>
              <input type={show?"text":"password"} value={p} onChange={e=>setP(e.target.value)} placeholder="Password" style={S.inp} onKeyDown={e=>e.key==="Enter"&&login()}/>
              <button onClick={()=>setShow(v=>!v)} style={{position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:12}}>{show?"HIDE":"SHOW"}</button>
            </div>
          </div>
          <button onClick={login} style={{...S.btn("#6366f1","#fff"),width:"100%",padding:13,fontSize:14,letterSpacing:"2px"}}>
            LOGIN →
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN PAGE — full manual CRUD
// ═══════════════════════════════════════════════════════════════════════════════
function AdminPage({ projects, sessions: propSessions, onRefreshProjects, onRefreshSessions, toast$ }) {
  const [tab, setTab]         = useState("sessions"); // sessions | projects
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editRow, setEditRow] = useState(null);   // session being edited
  const [editProj, setEditProj] = useState(null); // project being edited
  const [showAddSession, setShowAddSession] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [delConfirm, setDelConfirm] = useState(null);
  const [filterProjId, setFilterProjId] = useState("ALL");
  const [searchQ, setSearchQ] = useState("");

  const loadAll = async () => {
    setLoading(true);
    try { setSessions(await api.get("time_sessions?order=created_at.desc&limit=1000")); }
    catch(e) { toast$("Load error: "+e?.message,"err"); }
    finally { setLoading(false); }
  };
  useEffect(()=>{ loadAll(); },[]);

  const deleteSession = async (id) => {
    try { await api.delete(`time_sessions?id=eq.${id}`); toast$("Session deleted."); loadAll(); setDelConfirm(null); }
    catch(e) { toast$("Delete error: "+e?.message,"err"); }
  };
  const deleteProject = async (id) => {
    try { await api.delete(`projects?id=eq.${id}`); toast$("Project deleted."); onRefreshProjects(); setDelConfirm(null); }
    catch(e) { toast$("Delete error: "+e?.message,"err"); }
  };

  const filteredSessions = sessions.filter(s=>{
    if(filterProjId!=="ALL"&&s.project_id!==filterProjId) return false;
    if(searchQ){const q=searchQ.toLowerCase();return s.developer_name?.toLowerCase().includes(q)||s.task_name?.toLowerCase().includes(q);}
    return true;
  });

  const ac = "#6366f1"; // admin colour
  const thA = {padding:"10px 14px",textAlign:"left",fontSize:10,letterSpacing:"1.5px",color:"#475569",background:"rgba(0,0,0,.25)",borderBottom:"1px solid rgba(255,255,255,.07)",whiteSpace:"nowrap"};

  return (
    <div style={{animation:"fadeIn .4s ease"}}>
      {/* Admin header */}
      <div style={{marginBottom:24,padding:"16px 20px",background:"rgba(99,102,241,.08)",border:"1px solid rgba(99,102,241,.25)",borderRadius:14,display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
        <div style={{fontSize:28}}>⚙</div>
        <div>
          <div style={{fontSize:18,fontWeight:900,color:"#fff"}}>Admin Panel</div>
          <div style={{fontSize:11,color:"#6366f1",letterSpacing:"1px"}}>FULL DATABASE CONTROL · TENSORFOLD.AI</div>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:10}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:900,color:ac}}>{sessions.length}</div>
            <div style={{fontSize:9,color:"#475569",letterSpacing:"1px"}}>SESSIONS</div>
          </div>
          <div style={{textAlign:"center",marginLeft:16}}>
            <div style={{fontSize:20,fontWeight:900,color:ac}}>{projects.length}</div>
            <div style={{fontSize:9,color:"#475569",letterSpacing:"1px"}}>PROJECTS</div>
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div style={{display:"flex",gap:8,marginBottom:20,borderBottom:"1px solid rgba(255,255,255,.06)",paddingBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        {[{id:"sessions",l:"📋 SESSIONS"},{id:"projects",l:"🗂 PROJECTS"}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{padding:"9px 18px",borderRadius:8,border:"none",cursor:"pointer",fontFamily:"inherit",fontSize:11,fontWeight:"bold",letterSpacing:"1px",background:tab===t.id?ac:"rgba(255,255,255,.05)",color:tab===t.id?"#fff":"#64748b",transition:"all .15s"}}>
            {t.l}
          </button>
        ))}
        <button onClick={()=>{ if(tab==="sessions")setShowAddSession(v=>!v); else setShowAddProject(v=>!v); }}
          style={{...S.btn(),marginLeft:"auto",padding:"9px 18px",fontSize:11}}>
          {tab==="sessions"?(showAddSession?"✕ CANCEL":"＋ ADD SESSION"):(showAddProject?"✕ CANCEL":"＋ ADD PROJECT")}
        </button>
      </div>

      {/* ── ADD FORM ── */}
      {tab==="sessions"&&showAddSession&&(
        <AddSessionForm projects={projects} onSave={async(d)=>{
          try{ await api.post("time_sessions",d); toast$("✅ Session added!"); loadAll(); setShowAddSession(false); }
          catch(e){ toast$("Error: "+e?.message,"err"); }
        }} onCancel={()=>setShowAddSession(false)}/>
      )}
      {tab==="projects"&&showAddProject&&(
        <AddProjectForm onSave={async(d)=>{
          try{ await api.post("projects",d); toast$("✅ Project added!"); onRefreshProjects(); setShowAddProject(false); }
          catch(e){ toast$("Error: "+e?.message,"err"); }
        }} onCancel={()=>setShowAddProject(false)}/>
      )}

      {/* Edit modals */}
      {editRow&&<EditSessionModal session={editRow} projects={projects} onSave={async(d)=>{
        try{ await api.patch(`time_sessions?id=eq.${editRow.id}`,d); toast$("✅ Updated!"); loadAll(); setEditRow(null); }
        catch(e){ toast$("Error: "+e?.message,"err"); }
      }} onClose={()=>setEditRow(null)}/>}

      {editProj&&<EditProjectModal project={editProj} onSave={async(d)=>{
        try{ await api.patch(`projects?id=eq.${editProj.id}`,d); toast$("✅ Updated!"); onRefreshProjects(); setEditProj(null); }
        catch(e){ toast$("Error: "+e?.message,"err"); }
      }} onClose={()=>setEditProj(null)}/>}

      {/* Delete confirm */}
      {delConfirm&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:8888,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{...S.card,width:360,border:"1px solid rgba(220,38,38,.3)",textAlign:"center"}}>
            <div style={{fontSize:32,marginBottom:12}}>🗑</div>
            <div style={{fontSize:15,fontWeight:"bold",marginBottom:8}}>Confirm Delete</div>
            <div style={{fontSize:12,color:"#94a3b8",marginBottom:24}}>This action cannot be undone.</div>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={()=>setDelConfirm(null)} style={{...S.btn("rgba(255,255,255,.06)","#94a3b8"),padding:"10px 24px"}}>CANCEL</button>
              <button onClick={()=>delConfirm.type==="session"?deleteSession(delConfirm.id):deleteProject(delConfirm.id)}
                style={{...S.btn("#dc2626","#fff"),padding:"10px 24px"}}>DELETE</button>
            </div>
          </div>
        </div>
      )}

      {/* ── SESSIONS TABLE ── */}
      {tab==="sessions"&&(
        <div>
          <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
            <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="🔍 Search developer, task…"
              style={{...S.inp,width:"auto",flex:"1 1 180px",fontSize:12}}/>
            <select value={filterProjId} onChange={e=>setFilterProjId(e.target.value)} style={{...S.inp,width:"auto",background:"#0d1117",fontSize:12}}>
              <option value="ALL">All Projects</option>
              {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button onClick={loadAll} style={{padding:"9px 14px",borderRadius:8,border:"1px solid rgba(255,255,255,.1)",background:"transparent",color:"#64748b",cursor:"pointer",fontFamily:"inherit",fontSize:11}}>
              {loading?"…":"↻"}
            </button>
          </div>
          <div style={{fontSize:11,color:"#334155",marginBottom:10}}>{filteredSessions.length} / {sessions.length} RECORDS</div>
          <div style={{overflowX:"auto",borderRadius:14,border:"1px solid rgba(255,255,255,.07)"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:1000}}>
              <thead>
                <tr>
                  {["PROJECT","DEVELOPER","TASK","DESCRIPTION","DATE","START","END","HOURS","STATUS","ACTIONS"].map(h=>(
                    <th key={h} style={thA}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredSessions.length===0&&<tr><td colSpan={10} style={{padding:48,textAlign:"center",color:"#1e293b",fontSize:13}}>{loading?"Loading…":"No sessions."}</td></tr>}
                {filteredSessions.map((s,i)=>{
                  const proj=projects.find(p=>p.id===s.project_id);
                  const bg=i%2===0?"rgba(255,255,255,.015)":"transparent";
                  return(
                    <tr key={s.id} style={{borderBottom:"1px solid rgba(255,255,255,.04)",background:bg}}>
                      <td style={{padding:"11px 14px",whiteSpace:"nowrap"}}>
                        {proj?<span style={{padding:"3px 8px",borderRadius:6,background:`${proj.color||"#00ff88"}20`,color:proj.color||"#00ff88",fontSize:10,fontWeight:"bold"}}>{proj.name}</span>:<span style={{color:"#334155",fontSize:10}}>—</span>}
                      </td>
                      <td style={{padding:"11px 14px",whiteSpace:"nowrap"}}>
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <div style={{width:26,height:26,borderRadius:"50%",background:aColor(s.developer_name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:900,color:"#070710"}}>{initials(s.developer_name)}</div>
                          <span style={{fontWeight:"bold",color:"#e2e8f0"}}>{s.developer_name}</span>
                        </div>
                      </td>
                      <td style={{padding:"11px 14px",maxWidth:150,fontWeight:600,color:"#e2e8f0",wordBreak:"break-word"}}>{s.task_name}</td>
                      <td style={{padding:"11px 14px",maxWidth:160,fontSize:11,color:"#64748b",wordBreak:"break-word"}}>{s.task_description||"—"}</td>
                      <td style={{padding:"11px 14px",fontSize:11,color:"#94a3b8",whiteSpace:"nowrap"}}>{fmtDate(s.start_time,s.timezone)}</td>
                      <td style={{padding:"11px 14px",fontSize:11,color:"#94a3b8",whiteSpace:"nowrap"}}>{fmtTime(s.start_time,s.timezone)}</td>
                      <td style={{padding:"11px 14px",fontSize:11,color:s.end_time?"#94a3b8":"#1e293b",whiteSpace:"nowrap"}}>{s.end_time?fmtTime(s.end_time,s.timezone):"—"}</td>
                      <td style={{padding:"11px 14px",fontWeight:"bold",color:s.status==="active"?"#dc2626":"#00ff88",fontVariantNumeric:"tabular-nums",whiteSpace:"nowrap"}}>{hms(s.duration_seconds)}</td>
                      <td style={{padding:"11px 14px"}}>
                        <span style={{padding:"3px 8px",borderRadius:20,fontSize:9,fontWeight:"bold",background:s.status==="active"?"rgba(220,38,38,.15)":"rgba(0,255,136,.1)",color:s.status==="active"?"#dc2626":"#00ff88",border:`1px solid ${s.status==="active"?"rgba(220,38,38,.3)":"rgba(0,255,136,.2)"}`}}>
                          {s.status==="active"?"ACTIVE":"DONE"}
                        </span>
                      </td>
                      <td style={{padding:"11px 14px",whiteSpace:"nowrap"}}>
                        <div style={{display:"flex",gap:6}}>
                          <button onClick={()=>setEditRow(s)} style={{padding:"4px 10px",borderRadius:6,border:"1px solid rgba(99,102,241,.3)",background:"rgba(99,102,241,.1)",color:"#6366f1",cursor:"pointer",fontFamily:"inherit",fontSize:10,fontWeight:"bold"}}>EDIT</button>
                          <button onClick={()=>setDelConfirm({type:"session",id:s.id})} style={{padding:"4px 10px",borderRadius:6,border:"1px solid rgba(220,38,38,.3)",background:"rgba(220,38,38,.1)",color:"#dc2626",cursor:"pointer",fontFamily:"inherit",fontSize:10,fontWeight:"bold"}}>DEL</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PROJECTS TABLE ── */}
      {tab==="projects"&&(
        <div>
          <div style={{overflowX:"auto",borderRadius:14,border:"1px solid rgba(255,255,255,.07)"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr>
                  {["COLOR","NAME","DESCRIPTION","CREATED","SESSIONS","ACTIONS"].map(h=>(
                    <th key={h} style={thA}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.length===0&&<tr><td colSpan={6} style={{padding:48,textAlign:"center",color:"#1e293b",fontSize:13}}>No projects.</td></tr>}
                {projects.map((p,i)=>{
                  const cnt=sessions.filter(s=>s.project_id===p.id).length;
                  const bg=i%2===0?"rgba(255,255,255,.015)":"transparent";
                  return(
                    <tr key={p.id} style={{borderBottom:"1px solid rgba(255,255,255,.04)",background:bg}}>
                      <td style={{padding:"12px 14px"}}>
                        <div style={{width:28,height:28,borderRadius:6,background:p.color||"#00ff88"}}/>
                      </td>
                      <td style={{padding:"12px 14px",fontWeight:"bold",color:"#e2e8f0"}}>{p.name}</td>
                      <td style={{padding:"12px 14px",fontSize:11,color:"#64748b",maxWidth:200}}>{p.description||"—"}</td>
                      <td style={{padding:"12px 14px",fontSize:11,color:"#94a3b8",whiteSpace:"nowrap"}}>{fmtDateTime(p.created_at,"Asia/Karachi")}</td>
                      <td style={{padding:"12px 14px",fontWeight:"bold",color:p.color||"#00ff88"}}>{cnt}</td>
                      <td style={{padding:"12px 14px",whiteSpace:"nowrap"}}>
                        <div style={{display:"flex",gap:6}}>
                          <button onClick={()=>setEditProj(p)} style={{padding:"4px 10px",borderRadius:6,border:"1px solid rgba(99,102,241,.3)",background:"rgba(99,102,241,.1)",color:"#6366f1",cursor:"pointer",fontFamily:"inherit",fontSize:10,fontWeight:"bold"}}>EDIT</button>
                          <button onClick={()=>setDelConfirm({type:"project",id:p.id})} style={{padding:"4px 10px",borderRadius:6,border:"1px solid rgba(220,38,38,.3)",background:"rgba(220,38,38,.1)",color:"#dc2626",cursor:"pointer",fontFamily:"inherit",fontSize:10,fontWeight:"bold"}}>DEL</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Add Session Form ─────────────────────────────────────────────────────────
function AddSessionForm({ projects, onSave, onCancel }) {
  const blank = { developer_name:"", task_name:"", task_description:"", timezone:"Asia/Karachi", start_time:"", end_time:"", duration_seconds:"", status:"completed", project_id:"" };
  const [d, setD] = useState(blank);
  const set = k => v => setD(p=>({...p,[k]:v}));
  const save = () => {
    if(!d.developer_name.trim()||!d.task_name.trim()||!d.start_time) return;
    const payload = {...d, project_id:d.project_id||null, duration_seconds:d.duration_seconds?parseInt(d.duration_seconds):null, end_time:d.end_time||null};
    onSave(payload);
  };
  return (
    <div style={{...S.card,border:"1px solid rgba(99,102,241,.25)",marginBottom:20,animation:"fadeIn .3s ease"}}>
      <div style={{fontSize:10,letterSpacing:"3px",color:"#6366f1",marginBottom:16}}>ADD SESSION MANUALLY</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:12,marginBottom:14}}>
        {[
          {k:"developer_name",lbl:"DEVELOPER *",ph:"Ahmed Khan"},
          {k:"task_name",lbl:"TASK *",ph:"Fix login bug"},
          {k:"task_description",lbl:"DESCRIPTION",ph:"Details…"},
          {k:"start_time",lbl:"START TIME *",type:"datetime-local"},
          {k:"end_time",lbl:"END TIME",type:"datetime-local"},
          {k:"duration_seconds",lbl:"DURATION (secs)",ph:"3600",type:"number"},
        ].map(f=>(
          <div key={f.k}>
            <label style={S.lbl}>{f.lbl}</label>
            <input type={f.type||"text"} value={d[f.k]} onChange={e=>set(f.k)(e.target.value)} placeholder={f.ph||""} style={S.inp}/>
          </div>
        ))}
        <div>
          <label style={S.lbl}>PROJECT</label>
          <select value={d.project_id} onChange={e=>set("project_id")(e.target.value)} style={{...S.inp,background:"#0d1117"}}>
            <option value="">No project</option>
            {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label style={S.lbl}>TIMEZONE</label>
          <select value={d.timezone} onChange={e=>set("timezone")(e.target.value)} style={{...S.inp,background:"#0d1117"}}>
            {TIMEZONES.map(t=><option key={t.value} value={t.value}>{t.flag} {t.label}</option>)}
          </select>
        </div>
        <div>
          <label style={S.lbl}>STATUS</label>
          <select value={d.status} onChange={e=>set("status")(e.target.value)} style={{...S.inp,background:"#0d1117"}}>
            <option value="completed">Completed</option>
            <option value="active">Active</option>
          </select>
        </div>
      </div>
      <div style={{display:"flex",gap:10}}>
        <button onClick={save} style={{...S.btn("#6366f1","#fff"),padding:"10px 22px"}}>SAVE SESSION</button>
        <button onClick={onCancel} style={{...S.btn("rgba(255,255,255,.06)","#94a3b8"),padding:"10px 22px"}}>CANCEL</button>
      </div>
    </div>
  );
}

// ─── Add Project Form ─────────────────────────────────────────────────────────
function AddProjectForm({ onSave, onCancel }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [color, setColor] = useState("#6366f1");
  return (
    <div style={{...S.card,border:"1px solid rgba(99,102,241,.25)",marginBottom:20,animation:"fadeIn .3s ease"}}>
      <div style={{fontSize:10,letterSpacing:"3px",color:"#6366f1",marginBottom:16}}>ADD PROJECT MANUALLY</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
        <div>
          <label style={S.lbl}>PROJECT NAME *</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Backend API" style={S.inp}/>
        </div>
        <div>
          <label style={S.lbl}>DESCRIPTION</label>
          <input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Brief description…" style={S.inp}/>
        </div>
      </div>
      <div style={{marginBottom:16}}>
        <label style={S.lbl}>COLOR</label>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:4}}>
          {PROJECT_COLORS.map(c=>(
            <div key={c} onClick={()=>setColor(c)} style={{width:28,height:28,borderRadius:"50%",background:c,cursor:"pointer",border:color===c?"3px solid #fff":"3px solid transparent"}}/>
          ))}
        </div>
      </div>
      <div style={{display:"flex",gap:10}}>
        <button onClick={()=>{if(name.trim())onSave({name:name.trim(),description:desc.trim()||null,color});}} style={{...S.btn("#6366f1","#fff"),padding:"10px 22px"}}>SAVE PROJECT</button>
        <button onClick={onCancel} style={{...S.btn("rgba(255,255,255,.06)","#94a3b8"),padding:"10px 22px"}}>CANCEL</button>
      </div>
    </div>
  );
}

// ─── Edit Session Modal ───────────────────────────────────────────────────────
function EditSessionModal({ session: s, projects, onSave, onClose }) {
  const toLocal = iso => iso ? new Date(iso).toISOString().slice(0,16) : "";
  const [d, setD] = useState({
    developer_name: s.developer_name||"",
    task_name: s.task_name||"",
    task_description: s.task_description||"",
    timezone: s.timezone||"Asia/Karachi",
    start_time: toLocal(s.start_time),
    end_time: toLocal(s.end_time),
    duration_seconds: s.duration_seconds||"",
    status: s.status||"completed",
    project_id: s.project_id||"",
  });
  const set = k => v => setD(p=>({...p,[k]:v}));
  const save = () => {
    const payload = {
      ...d,
      start_time: d.start_time ? new Date(d.start_time).toISOString() : s.start_time,
      end_time: d.end_time ? new Date(d.end_time).toISOString() : null,
      duration_seconds: d.duration_seconds ? parseInt(d.duration_seconds) : null,
      project_id: d.project_id || null,
    };
    onSave(payload);
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:8888,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{...S.card,width:"100%",maxWidth:640,border:"1px solid rgba(99,102,241,.3)",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{fontSize:10,letterSpacing:"3px",color:"#6366f1",marginBottom:20}}>EDIT SESSION</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
          {[
            {k:"developer_name",lbl:"DEVELOPER"},
            {k:"task_name",lbl:"TASK"},
            {k:"task_description",lbl:"DESCRIPTION"},
            {k:"start_time",lbl:"START TIME",type:"datetime-local"},
            {k:"end_time",lbl:"END TIME",type:"datetime-local"},
            {k:"duration_seconds",lbl:"DURATION (secs)",type:"number"},
          ].map(f=>(
            <div key={f.k}>
              <label style={S.lbl}>{f.lbl}</label>
              <input type={f.type||"text"} value={d[f.k]} onChange={e=>set(f.k)(e.target.value)} style={S.inp}/>
            </div>
          ))}
          <div>
            <label style={S.lbl}>PROJECT</label>
            <select value={d.project_id} onChange={e=>set("project_id")(e.target.value)} style={{...S.inp,background:"#0d1117"}}>
              <option value="">No project</option>
              {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label style={S.lbl}>STATUS</label>
            <select value={d.status} onChange={e=>set("status")(e.target.value)} style={{...S.inp,background:"#0d1117"}}>
              <option value="completed">Completed</option>
              <option value="active">Active</option>
            </select>
          </div>
          <div>
            <label style={S.lbl}>TIMEZONE</label>
            <select value={d.timezone} onChange={e=>set("timezone")(e.target.value)} style={{...S.inp,background:"#0d1117"}}>
              {TIMEZONES.map(t=><option key={t.value} value={t.value}>{t.flag} {t.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={save} style={{...S.btn("#6366f1","#fff"),padding:"10px 22px"}}>SAVE CHANGES</button>
          <button onClick={onClose} style={{...S.btn("rgba(255,255,255,.06)","#94a3b8"),padding:"10px 22px"}}>CANCEL</button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Project Modal ───────────────────────────────────────────────────────
function EditProjectModal({ project: p, onSave, onClose }) {
  const [name, setName]   = useState(p.name||"");
  const [desc, setDesc]   = useState(p.description||"");
  const [color, setColor] = useState(p.color||"#00ff88");
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:8888,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{...S.card,width:"100%",maxWidth:480,border:"1px solid rgba(99,102,241,.3)"}}>
        <div style={{fontSize:10,letterSpacing:"3px",color:"#6366f1",marginBottom:20}}>EDIT PROJECT</div>
        <div style={{marginBottom:14}}>
          <label style={S.lbl}>PROJECT NAME</label>
          <input value={name} onChange={e=>setName(e.target.value)} style={S.inp}/>
        </div>
        <div style={{marginBottom:14}}>
          <label style={S.lbl}>DESCRIPTION</label>
          <input value={desc} onChange={e=>setDesc(e.target.value)} style={S.inp}/>
        </div>
        <div style={{marginBottom:20}}>
          <label style={S.lbl}>COLOR</label>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:4}}>
            {PROJECT_COLORS.map(c=>(
              <div key={c} onClick={()=>setColor(c)} style={{width:28,height:28,borderRadius:"50%",background:c,cursor:"pointer",border:color===c?"3px solid #fff":"3px solid transparent"}}/>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>onSave({name:name.trim(),description:desc.trim()||null,color})} style={{...S.btn("#6366f1","#fff"),padding:"10px 22px"}}>SAVE CHANGES</button>
          <button onClick={onClose} style={{...S.btn("rgba(255,255,255,.06)","#94a3b8"),padding:"10px 22px"}}>CANCEL</button>
        </div>
      </div>
    </div>
  );
}
