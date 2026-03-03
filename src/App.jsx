import { useState, useEffect, useRef, createContext, useContext } from "react";

// ══════════════════════════════════════════════════════════
// DATABASE
// ══════════════════════════════════════════════════════════
const SB_URL = "https://rrexmdfnyyurqtmvebiw.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJyZXhtZGZueXl1cnF0bXZlYml3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MzAzMjEsImV4cCI6MjA4ODEwNjMyMX0.nmPMCosEMFj1epHMvsOVyfAoWJXDPqU0AL11ZcrE0j8";
const H = () => ({ apikey:SB_KEY, Authorization:`Bearer ${SB_KEY}`, "Content-Type":"application/json", Prefer:"return=representation" });
const ok = async r => { const t=await r.text(); if(r.ok) return t?JSON.parse(t):[]; throw await r.json().catch(()=>({message:r.statusText})); };
const db = {
  get:    p    => fetch(`${SB_URL}/rest/v1/${p}`,{headers:H()}).then(ok),
  post:   (p,b)=> fetch(`${SB_URL}/rest/v1/${p}`,{method:"POST",  headers:H(),body:JSON.stringify(b)}).then(ok),
  patch:  (p,b)=> fetch(`${SB_URL}/rest/v1/${p}`,{method:"PATCH", headers:H(),body:JSON.stringify(b)}).then(ok),
  del:    p    => fetch(`${SB_URL}/rest/v1/${p}`,{method:"DELETE",headers:H()}).then(ok),
};

// ══════════════════════════════════════════════════════════
// THEME CONTEXT
// ══════════════════════════════════════════════════════════
const ThemeCtx = createContext({dark:true,toggle:()=>{}});
const useTheme = () => useContext(ThemeCtx);

// ══════════════════════════════════════════════════════════
// AUTH CONTEXT
// ══════════════════════════════════════════════════════════
const AuthCtx = createContext(null);
const useAuth = () => useContext(AuthCtx);

// ══════════════════════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════════════════════
const TIMEZONES = [
  {label:"Pakistan (PKT)",value:"Asia/Karachi",flag:"🇵🇰"},
  {label:"UAE (GST)",value:"Asia/Dubai",flag:"🇦🇪"},
  {label:"India (IST)",value:"Asia/Kolkata",flag:"🇮🇳"},
  {label:"UK (GMT/BST)",value:"Europe/London",flag:"🇬🇧"},
  {label:"Germany (CET)",value:"Europe/Berlin",flag:"🇩🇪"},
  {label:"USA Eastern",value:"America/New_York",flag:"🇺🇸"},
  {label:"USA Pacific",value:"America/Los_Angeles",flag:"🇺🇸"},
  {label:"Australia (AEST)",value:"Australia/Sydney",flag:"🇦🇺"},
];
const PROJ_COLORS=["#6366f1","#00ff88","#f59e0b","#ec4899","#06b6d4","#a78bfa","#f97316","#14b8a6"];
const AVATAR_COLORS=["#6366f1","#00ff88","#f59e0b","#ec4899","#06b6d4","#a78bfa","#34d399","#fb923c"];
const PRIO_MAP={low:{c:"#64748b",bg:"rgba(100,116,139,.15)",label:"Low"},medium:{c:"#f59e0b",bg:"rgba(245,158,11,.15)",label:"Medium"},high:{c:"#f97316",bg:"rgba(249,115,22,.15)",label:"High"},urgent:{c:"#dc2626",bg:"rgba(220,38,38,.15)",label:"Urgent"}};
const STATUS_MAP={pending:{c:"#64748b",bg:"rgba(100,116,139,.15)",label:"Pending"},in_progress:{c:"#6366f1",bg:"rgba(99,102,241,.15)",label:"In Progress"},completed:{c:"#00ff88",bg:"rgba(0,255,136,.15)",label:"Completed"},blocked:{c:"#dc2626",bg:"rgba(220,38,38,.15)",label:"Blocked"}};

// ══════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════
const aColor  = n => AVATAR_COLORS[(n||"").charCodeAt(0)%AVATAR_COLORS.length];
const initials= n => (n||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
const hms = s => { if(s==null||s<0)return"—"; const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60; return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`; };
const hmLabel = s => { if(!s)return""; return `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m`; };
const fmtDate = (iso,tz) => { if(!iso)return"—"; try{return new Intl.DateTimeFormat("en-US",{timeZone:tz||"Asia/Karachi",year:"numeric",month:"short",day:"2-digit"}).format(new Date(iso));}catch{return"—";} };
const fmtTime = (iso,tz) => { if(!iso)return"—"; try{return new Intl.DateTimeFormat("en-US",{timeZone:tz||"Asia/Karachi",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:true}).format(new Date(iso));}catch{return"—";} };
const fmtDT   = (iso,tz) => { if(!iso)return"—"; try{return new Intl.DateTimeFormat("en-US",{timeZone:tz||"Asia/Karachi",year:"numeric",month:"short",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:true}).format(new Date(iso));}catch{return"—";} };
const toLocalInput = iso => iso ? new Date(iso).toISOString().slice(0,16) : "";
const calcDuration = (start,end) => { if(!start||!end)return null; const s=Math.floor((new Date(end)-new Date(start))/1000); return s>0?s:null; };

function LiveClock({tz}){
  const [t,setT]=useState("");
  useEffect(()=>{const tick=()=>setT(new Intl.DateTimeFormat("en-US",{timeZone:tz,hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:true,weekday:"short",month:"short",day:"numeric"}).format(new Date()));tick();const id=setInterval(tick,1000);return()=>clearInterval(id);},[tz]);
  return <>{t}</>;
}

// ══════════════════════════════════════════════════════════
// THEME TOKENS
// ══════════════════════════════════════════════════════════
const tokens = dark => ({
  bg:        dark?"#07070f":"#f1f5f9",
  bgCard:    dark?"rgba(255,255,255,.04)":"#ffffff",
  bgInput:   dark?"rgba(255,255,255,.06)":"#f8fafc",
  border:    dark?"rgba(255,255,255,.08)":"rgba(0,0,0,.1)",
  borderFocus:"#6366f1",
  text:      dark?"#e2e8f0":"#0f172a",
  textMuted: dark?"#64748b":"#64748b",
  textDim:   dark?"#334155":"#94a3b8",
  accent:    "#6366f1",
  accentGlow:dark?"rgba(99,102,241,.15)":"rgba(99,102,241,.1)",
  green:     "#00d68f",
  red:       "#dc2626",
  shadow:    dark?"0 4px 24px rgba(0,0,0,.4)":"0 4px 24px rgba(0,0,0,.08)",
  gridLine:  dark?"rgba(99,102,241,.04)":"rgba(99,102,241,.06)",
  navBg:     dark?"rgba(7,7,15,.9)":"rgba(255,255,255,.9)",
});

// ══════════════════════════════════════════════════════════
// STYLE HELPERS
// ══════════════════════════════════════════════════════════
const card = (T,extra={}) => ({background:T.bgCard,border:`1px solid ${T.border}`,borderRadius:16,padding:24,...extra});
const inp  = T => ({width:"100%",padding:"10px 14px",boxSizing:"border-box",background:T.bgInput,border:`1px solid ${T.border}`,borderRadius:10,color:T.text,fontFamily:"Inter,sans-serif",fontSize:14,outline:"none",transition:"border .15s"});
const lbl  = T => ({fontSize:11,fontWeight:600,letterSpacing:"0.06em",color:T.textMuted,display:"block",marginBottom:6,textTransform:"uppercase"});
const btn  = (bg,c,extra={}) => ({padding:"10px 20px",borderRadius:10,border:"none",cursor:"pointer",fontFamily:"Inter,sans-serif",fontSize:13,fontWeight:600,letterSpacing:"0.02em",background:bg,color:c,transition:"all .15s",...extra});

// ══════════════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════════════
function Toast({toast}){
  if(!toast)return null;
  return(
    <div style={{position:"fixed",top:24,right:24,zIndex:99999,background:toast.type==="err"?"#dc2626":"#00d68f",color:"#fff",padding:"14px 22px",borderRadius:12,fontWeight:600,fontSize:14,boxShadow:"0 8px 32px rgba(0,0,0,.3)",animation:"toastIn .3s ease",maxWidth:380,fontFamily:"Inter,sans-serif"}}>
      {toast.msg}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// MODAL WRAPPER
// ══════════════════════════════════════════════════════════
function Modal({onClose,children,T,width=560}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.6)",zIndex:9000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={onClose}>
      <div style={{...card(T),width:"100%",maxWidth:width,maxHeight:"90vh",overflowY:"auto",animation:"fadeUp .25s ease"}} onClick={e=>e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════════════════════
export default function App(){
  const [dark,setDark]=useState(()=>{try{return localStorage.getItem("tf_dark")!=="false";}catch{return true;}});
  const [user,setUser]=useState(()=>{try{const u=localStorage.getItem("tf_user");return u?JSON.parse(u):null;}catch{return null;}});
  const [toast,setToast]=useState(null);
  const [page,setPage]=useState("projects");
  const [activeProject,setActiveProject]=useState(null);

  const T=tokens(dark);
  const toggleDark=()=>{setDark(d=>{const n=!d;try{localStorage.setItem("tf_dark",n);}catch{}return n;});};
  const toast$=(msg,type="ok")=>{setToast({msg,type});setTimeout(()=>setToast(null),3500);};

  const login=(u)=>{setUser(u);try{localStorage.setItem("tf_user",JSON.stringify(u));}catch{}setPage("projects");};
  const logout=()=>{setUser(null);try{localStorage.removeItem("tf_user");}catch{}setPage("projects");setActiveProject(null);};

  if(!user) return(
    <ThemeCtx.Provider value={{dark,toggle:toggleDark,T}}>
      <Toast toast={toast}/>
      <LoginPage onLogin={login} toast$={toast$}/>
      <GlobalStyle dark={dark}/>
    </ThemeCtx.Provider>
  );

  return(
    <ThemeCtx.Provider value={{dark,toggle:toggleDark,T}}>
      <AuthCtx.Provider value={{user,logout}}>
        <Toast toast={toast}/>
        <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"Inter,sans-serif",transition:"background .3s,color .3s"}}>
          <BgDecor T={T} dark={dark}/>
          <div style={{position:"relative",zIndex:1}}>
            <TopBar page={page} setPage={setPage} activeProject={activeProject} onGoProjects={()=>{setPage("projects");setActiveProject(null);}} T={T} toggleDark={toggleDark} dark={dark}/>
            <div style={{maxWidth:1280,margin:"0 auto",padding:"0 20px 60px"}}>
              {page==="projects" && <ProjectsPage setPage={setPage} setActiveProject={setActiveProject} toast$={toast$} T={T}/>}
              {page==="tracker"  && activeProject && <TrackerPage project={activeProject} toast$={toast$} T={T}/>}
              {page==="admin"    && user.role==="admin" && <AdminPage toast$={toast$} T={T}/>}
            </div>
          </div>
        </div>
        <GlobalStyle dark={dark}/>
      </AuthCtx.Provider>
    </ThemeCtx.Provider>
  );
}

function BgDecor({T,dark}){
  return(<>
    <div style={{position:"fixed",inset:0,zIndex:0,backgroundImage:`linear-gradient(${T.gridLine} 1px,transparent 1px),linear-gradient(90deg,${T.gridLine} 1px,transparent 1px)`,backgroundSize:"48px 48px",pointerEvents:"none"}}/>
    <div style={{position:"fixed",top:-200,left:-200,width:700,height:700,borderRadius:"50%",background:`radial-gradient(circle,${dark?"rgba(99,102,241,.08)":"rgba(99,102,241,.06)"},transparent 70%)`,pointerEvents:"none",zIndex:0}}/>
    <div style={{position:"fixed",bottom:-200,right:-200,width:800,height:800,borderRadius:"50%",background:`radial-gradient(circle,${dark?"rgba(0,214,143,.05)":"rgba(0,214,143,.04)"},transparent 70%)`,pointerEvents:"none",zIndex:0}}/>
  </>);
}

function GlobalStyle({dark}){
  return(
    <style>{`
      *{box-sizing:border-box;-webkit-font-smoothing:antialiased}
      body{margin:0;padding:0}
      @keyframes toastIn{from{transform:translateX(60px);opacity:0}to{transform:translateX(0);opacity:1}}
      @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      @keyframes fadeIn{from{opacity:0}to{opacity:1}}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}
      @keyframes glowRed{0%,100%{box-shadow:0 0 14px rgba(220,38,38,.4)}50%{box-shadow:0 0 32px rgba(220,38,38,.7)}}
      @keyframes spin{to{transform:rotate(360deg)}}
      input:focus,textarea:focus,select:focus{outline:none!important;border-color:#6366f1!important;box-shadow:0 0 0 3px rgba(99,102,241,.15)!important}
      button:active{transform:scale(.97)}
      ::-webkit-scrollbar{width:6px;height:6px}
      ::-webkit-scrollbar-track{background:transparent}
      ::-webkit-scrollbar-thumb{background:${dark?"#1e293b":"#cbd5e1"};border-radius:4px}
    `}</style>
  );
}

// ══════════════════════════════════════════════════════════
// TOP BAR
// ══════════════════════════════════════════════════════════
function TopBar({page,setPage,activeProject,onGoProjects,T,toggleDark,dark}){
  const {user,logout}=useAuth();
  return(
    <div style={{background:T.navBg,backdropFilter:"blur(12px)",borderBottom:`1px solid ${T.border}`,position:"sticky",top:0,zIndex:100}}>
      <div style={{maxWidth:1280,margin:"0 auto",padding:"0 20px",display:"flex",alignItems:"center",gap:16,height:64,flexWrap:"wrap"}}>

        {/* Brand */}
        <div style={{cursor:"pointer",userSelect:"none"}} onClick={onGoProjects}>
          <div style={{fontSize:10,fontWeight:800,letterSpacing:"0.2em",color:T.accent,lineHeight:1}}>TENSORFOLD.AI</div>
          <div style={{fontSize:18,fontWeight:800,color:T.text,letterSpacing:"-0.03em",lineHeight:1.1}}>Time Tracker</div>
        </div>

        {/* Breadcrumb */}
        {activeProject&&(
          <div style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:T.textMuted}}>
            <span style={{cursor:"pointer"}} onClick={onGoProjects}>Projects</span>
            <span>/</span>
            <span style={{color:activeProject.color||T.accent,fontWeight:600}}>{activeProject.name}</span>
          </div>
        )}

        <div style={{marginLeft:"auto",display:"flex",gap:8,alignItems:"center"}}>
          {/* Dark/Light toggle */}
          <button onClick={toggleDark} title="Toggle theme"
            style={{...btn(T.bgInput,T.textMuted),padding:"8px 12px",border:`1px solid ${T.border}`,fontSize:16}}>
            {dark?"☀️":"🌙"}
          </button>

          {/* Admin link */}
          {user.role==="admin"&&(
            <button onClick={()=>setPage("admin")}
              style={{...btn(page==="admin"?T.accent:"transparent",page==="admin"?"#fff":T.textMuted),border:`1px solid ${page==="admin"?T.accent:T.border}`,padding:"8px 16px"}}>
              ⚙ Admin
            </button>
          )}

          {/* User chip */}
          <div style={{display:"flex",alignItems:"center",gap:8,background:T.bgInput,border:`1px solid ${T.border}`,borderRadius:10,padding:"6px 12px"}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:aColor(user.full_name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff"}}>{initials(user.full_name)}</div>
            <div style={{lineHeight:1.2}}>
              <div style={{fontSize:13,fontWeight:600,color:T.text}}>{user.full_name}</div>
              <div style={{fontSize:10,color:T.accent,textTransform:"uppercase",letterSpacing:"0.05em"}}>{user.role}</div>
            </div>
            <button onClick={logout} style={{...btn("transparent",T.textMuted),padding:"4px 8px",fontSize:12,marginLeft:4}}>Logout</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// LOGIN PAGE
// ══════════════════════════════════════════════════════════
function LoginPage({onLogin,toast$}){
  const {T,dark,toggle}=useTheme();
  const [u,setU]=useState("");
  const [p,setP]=useState("");
  const [showP,setShowP]=useState(false);
  const [busy,setBusy]=useState(false);

  const login=async()=>{
    if(!u.trim()||!p.trim())return toast$("Enter username and password","err");
    setBusy(true);
    try{
      const rows=await db.get(`users?username=eq.${encodeURIComponent(u.trim())}&password=eq.${encodeURIComponent(p.trim())}&limit=1`);
      if(!rows.length)return toast$("Invalid username or password","err");
      onLogin(rows[0]);
    }catch(e){toast$("Login error: "+(e?.message||"Unknown"),"err");}
    finally{setBusy(false);}
  };

  const accent="#6366f1";
  return(
    <div style={{minHeight:"100vh",background:dark?"#07070f":"#f1f5f9",display:"flex",alignItems:"center",justifyContent:"center",padding:16,fontFamily:"Inter,sans-serif",position:"relative",overflow:"hidden"}}>
      {/* Decorative orbs */}
      <div style={{position:"fixed",top:"-30%",left:"-20%",width:"70vw",height:"70vw",borderRadius:"50%",background:"radial-gradient(circle,rgba(99,102,241,.12),transparent 65%)",pointerEvents:"none"}}/>
      <div style={{position:"fixed",bottom:"-30%",right:"-20%",width:"70vw",height:"70vw",borderRadius:"50%",background:"radial-gradient(circle,rgba(0,214,143,.08),transparent 65%)",pointerEvents:"none"}}/>
      <div style={{position:"fixed",inset:0,backgroundImage:`linear-gradient(rgba(99,102,241,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.03) 1px,transparent 1px)`,backgroundSize:"40px 40px",pointerEvents:"none"}}/>

      {/* Theme toggle */}
      <button onClick={toggle} style={{position:"fixed",top:20,right:20,background:dark?"rgba(255,255,255,.08)":"rgba(0,0,0,.06)",border:"none",borderRadius:10,padding:"8px 14px",cursor:"pointer",fontSize:18,color:dark?"#e2e8f0":"#0f172a",zIndex:10}}>
        {dark?"☀️":"🌙"}
      </button>

      <div style={{width:"100%",maxWidth:460,position:"relative",zIndex:1,animation:"fadeUp .5s ease"}}>

        {/* Logo block */}
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{display:"inline-flex",alignItems:"center",justifyContent:"center",width:72,height:72,borderRadius:20,background:`linear-gradient(135deg, ${accent}, #8b5cf6)`,boxShadow:`0 12px 40px rgba(99,102,241,.4)`,marginBottom:20,fontSize:32}}>⏱</div>
          <div style={{fontSize:11,fontWeight:800,letterSpacing:"0.25em",color:accent,marginBottom:8}}>TENSORFOLD.AI</div>
          <h1 style={{margin:0,fontSize:"clamp(26px,4vw,36px)",fontWeight:900,color:dark?"#fff":"#0f172a",letterSpacing:"-0.04em",lineHeight:1.1}}>Time Tracker</h1>
          <p style={{margin:"10px 0 0",fontSize:14,color:dark?"#64748b":"#64748b"}}>Sign in to your workspace</p>
        </div>

        {/* Card */}
        <div style={{background:dark?"rgba(255,255,255,.05)":"#fff",border:`1px solid ${dark?"rgba(255,255,255,.1)":"rgba(0,0,0,.08)"}`,borderRadius:20,padding:36,boxShadow:dark?"0 24px 80px rgba(0,0,0,.5)":"0 24px 80px rgba(0,0,0,.1)"}}>

          <div style={{marginBottom:20}}>
            <label style={{...lbl(T),marginBottom:8}}>Username</label>
            <input value={u} onChange={e=>setU(e.target.value)} placeholder="Enter your username"
              style={{...inp(T),fontSize:15,padding:"12px 16px"}} onKeyDown={e=>e.key==="Enter"&&login()}/>
          </div>

          <div style={{marginBottom:28}}>
            <label style={{...lbl(T),marginBottom:8}}>Password</label>
            <div style={{position:"relative"}}>
              <input type={showP?"text":"password"} value={p} onChange={e=>setP(e.target.value)} placeholder="Enter your password"
                style={{...inp(T),fontSize:15,padding:"12px 44px 12px 16px"}} onKeyDown={e=>e.key==="Enter"&&login()}/>
              <button onClick={()=>setShowP(v=>!v)}
                style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:T.textMuted,fontSize:13,fontFamily:"inherit",fontWeight:600,padding:"2px 6px"}}>
                {showP?"HIDE":"SHOW"}
              </button>
            </div>
          </div>

          <button onClick={login} disabled={busy}
            style={{...btn(`linear-gradient(135deg, ${accent}, #8b5cf6)`,"#fff"),width:"100%",padding:"14px",fontSize:15,fontWeight:700,borderRadius:12,boxShadow:busy?"none":`0 8px 24px rgba(99,102,241,.35)`,opacity:busy?.7:1,letterSpacing:"0.02em"}}>
            {busy?"Signing in…":"Sign In →"}
          </button>

          <div style={{textAlign:"center",marginTop:20,fontSize:12,color:T.textMuted}}>
            Contact your admin if you don't have an account
          </div>
        </div>

        <p style={{textAlign:"center",fontSize:11,color:dark?"#1e293b":"#cbd5e1",marginTop:24,letterSpacing:"0.1em"}}>
          TENSORFOLD.AI · DISTRIBUTED TEAM TRACKER
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// PROJECTS PAGE
// ══════════════════════════════════════════════════════════
function ProjectsPage({setPage,setActiveProject,toast$,T}){
  const {user}=useAuth();
  const [projects,setProjects]=useState([]);
  const [myMemberships,setMyMemberships]=useState([]);
  const [loading,setLoading]=useState(true);
  const [showCreate,setShowCreate]=useState(false);
  const [form,setForm]=useState({name:"",description:"",color:"#6366f1"});
  const [busy,setBusy]=useState(false);

  const load=async()=>{
    setLoading(true);
    try{
      const [projs,members]=await Promise.all([
        db.get("projects?order=created_at.asc"),
        db.get(`project_members?user_id=eq.${user.id}`),
      ]);
      setMyMemberships(members);
      if(user.role==="admin") setProjects(projs);
      else{
        const myIds=new Set(members.map(m=>m.project_id));
        setProjects(projs.filter(p=>myIds.has(p.id)));
      }
    }catch(e){toast$("Error: "+e?.message,"err");}
    finally{setLoading(false);}
  };

  useEffect(()=>{load();},[]);

  const create=async()=>{
    if(!form.name.trim())return toast$("Enter project name","err");
    setBusy(true);
    try{
      await db.post("projects",{name:form.name.trim(),description:form.description.trim()||null,color:form.color});
      toast$("✅ Project created!");setForm({name:"",description:"",color:"#6366f1"});setShowCreate(false);load();
    }catch(e){toast$("Error: "+e?.message,"err");}
    finally{setBusy(false);}
  };

  const deleteProject=async(id)=>{
    if(!confirm("Delete this project? All sessions and tasks will be removed."))return;
    try{await db.del(`projects?id=eq.${id}`);toast$("Deleted.");load();}
    catch(e){toast$("Error: "+e?.message,"err");}
  };

  const openProject=p=>{setActiveProject(p);setPage("tracker");};

  return(
    <div style={{paddingTop:32,animation:"fadeIn .4s ease"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:32,flexWrap:"wrap",gap:12}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.12em",color:T.textMuted,marginBottom:4}}>WORKSPACE</div>
          <h2 style={{margin:0,fontSize:"clamp(22px,3vw,32px)",fontWeight:800,color:T.text,letterSpacing:"-0.03em"}}>
            {user.role==="admin"?"All Projects":"My Projects"}
          </h2>
        </div>
        {user.role==="admin"&&(
          <button onClick={()=>setShowCreate(v=>!v)}
            style={{...btn(showCreate?"rgba(220,38,38,.15)":T.accent,showCreate?"#dc2626":"#fff"),padding:"12px 24px",fontSize:14,borderRadius:12,boxShadow:showCreate?"none":"0 4px 16px rgba(99,102,241,.3)"}}>
            {showCreate?"✕ Cancel":"＋ New Project"}
          </button>
        )}
      </div>

      {/* Create Form */}
      {showCreate&&(
        <div style={{...card(T),border:`1px solid rgba(99,102,241,.3)`,marginBottom:28,animation:"fadeUp .3s ease"}}>
          <div style={{fontSize:12,fontWeight:700,letterSpacing:"0.1em",color:T.accent,marginBottom:20}}>CREATE PROJECT</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
            <div>
              <label style={lbl(T)}>Project Name *</label>
              <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Mobile App v2" style={inp(T)} onKeyDown={e=>e.key==="Enter"&&create()}/>
            </div>
            <div>
              <label style={lbl(T)}>Description</label>
              <input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Brief description…" style={inp(T)}/>
            </div>
          </div>
          <div style={{marginBottom:20}}>
            <label style={lbl(T)}>Color</label>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:6}}>
              {PROJ_COLORS.map(c=><div key={c} onClick={()=>setForm(f=>({...f,color:c}))} style={{width:32,height:32,borderRadius:8,background:c,cursor:"pointer",border:form.color===c?"3px solid #fff":"3px solid transparent",boxShadow:form.color===c?"0 0 0 2px "+c:"none",transition:"all .15s"}}/>)}
            </div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={create} disabled={busy} style={{...btn(T.accent,"#fff"),padding:"11px 24px",borderRadius:10}}>{busy?"Creating…":"Create Project"}</button>
            <button onClick={()=>setShowCreate(false)} style={{...btn("transparent",T.textMuted),padding:"11px 24px",border:`1px solid ${T.border}`,borderRadius:10}}>Cancel</button>
          </div>
        </div>
      )}

      {loading&&<div style={{textAlign:"center",padding:80,color:T.textMuted,fontSize:14}}>Loading projects…</div>}

      {!loading&&projects.length===0&&(
        <div style={{...card(T),textAlign:"center",padding:80,border:`1px dashed ${T.border}`}}>
          <div style={{fontSize:48,marginBottom:16,opacity:.3}}>🗂</div>
          <div style={{fontSize:16,color:T.textMuted}}>{user.role==="admin"?"No projects yet. Create your first one!":"You haven't been added to any projects yet."}</div>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:20}}>
        {projects.map(p=>(
          <ProjectCard key={p.id} project={p} onOpen={openProject} onDelete={deleteProject} T={T} isAdmin={user.role==="admin"}/>
        ))}
      </div>
    </div>
  );
}

function ProjectCard({project:p,onOpen,onDelete,T,isAdmin}){
  const [hov,setHov]=useState(false);
  return(
    <div style={{...card(T),borderLeft:`4px solid ${p.color||T.accent}`,cursor:"default",transition:"all .2s",transform:hov?"translateY(-2px)":"translateY(0)",boxShadow:hov?`0 8px 32px rgba(0,0,0,.2)`:T.shadow,animation:"fadeIn .4s ease"}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <div style={{display:"flex",alignItems:"flex-start",gap:14,marginBottom:16}}>
        <div style={{width:48,height:48,borderRadius:12,background:p.color||T.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:"#fff",flexShrink:0,letterSpacing:"-0.05em"}}>
          {initials(p.name)}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:17,fontWeight:700,color:T.text,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</div>
          <div style={{fontSize:13,color:T.textMuted,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.description||"No description"}</div>
        </div>
      </div>
      <div style={{fontSize:11,color:T.textDim,marginBottom:16}}>Created {fmtDate(p.created_at,"Asia/Karachi")}</div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={()=>onOpen(p)}
          style={{...btn(p.color||T.accent,"#fff"),flex:1,padding:"10px",borderRadius:10,boxShadow:`0 4px 12px ${p.color||T.accent}40`,fontSize:13}}>
          Open Tracker →
        </button>
        {isAdmin&&(
          <button onClick={()=>onDelete(p.id)}
            style={{...btn("rgba(220,38,38,.1)","#dc2626"),padding:"10px 14px",border:"1px solid rgba(220,38,38,.2)",borderRadius:10,fontSize:13}}>
            🗑
          </button>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// TRACKER PAGE
// ══════════════════════════════════════════════════════════
function TrackerPage({project,toast$,T}){
  const {user}=useAuth();
  const [tab,setTab]=useState("clock");
  const [sessions,setSessions]=useState([]);
  const [members,setMembers]=useState([]);
  const [allUsers,setAllUsers]=useState([]);
  const [tasks,setTasks]=useState([]);
  const [myActive,setMyActive]=useState(null);
  const [elapsed,setElapsed]=useState(0);
  const [busy,setBusy]=useState(false);
  const [taskName,setTaskName]=useState("");
  const [taskDesc,setTaskDesc]=useState("");
  const [tz,setTz]=useState(user.timezone||"Asia/Karachi");
  const [filterDev,setFilterDev]=useState("ALL");
  const [filterStatus,setFilterStatus]=useState("ALL");
  const [search,setSearch]=useState("");
  const [sortCol,setSortCol]=useState("created_at");
  const [sortDir,setSortDir]=useState("desc");
  const tickRef=useRef(null);
  const pc=project.color||T.accent;

  const loadAll=async()=>{
    try{
      const [sess,pm,users,tsk]=await Promise.all([
        db.get(`time_sessions?project_id=eq.${project.id}&order=created_at.desc&limit=500`),
        db.get(`project_members?project_id=eq.${project.id}`),
        db.get("users?order=full_name.asc"),
        db.get(`tasks?project_id=eq.${project.id}&order=created_at.desc`),
      ]);
      setSessions(sess);
      setAllUsers(users);
      const memberIds=new Set(pm.map(m=>m.user_id));
      setMembers(users.filter(u=>memberIds.has(u.id)));
      setTasks(tsk);
      // find my active session
      const active=sess.find(s=>s.user_id===user.id&&s.status==="active");
      setMyActive(active||null);
    }catch(e){toast$("Load error: "+e?.message,"err");}
  };

  useEffect(()=>{loadAll();},[project.id]);
  useEffect(()=>{const id=setInterval(loadAll,30000);return()=>clearInterval(id);},[project.id]);
  useEffect(()=>{
    if(myActive){tickRef.current=setInterval(()=>setElapsed(Math.floor((Date.now()-new Date(myActive.start_time).getTime())/1000)),1000);}
    else{clearInterval(tickRef.current);setElapsed(0);}
    return()=>clearInterval(tickRef.current);
  },[myActive]);

  const startClock=async()=>{
    if(myActive)return toast$("You already have an active session in this project. Stop it first.","err");
    if(!taskName.trim())return toast$("Enter a task name","err");
    setBusy(true);
    try{
      const rows=await db.post("time_sessions",{project_id:project.id,user_id:user.id,developer_name:user.full_name,task_name:taskName.trim(),task_description:taskDesc.trim()||null,timezone:tz,start_time:new Date().toISOString(),status:"active"});
      setMyActive(Array.isArray(rows)?rows[0]:rows);
      toast$("⏱ Clock started!");setTaskName("");setTaskDesc("");loadAll();
    }catch(e){toast$("Error: "+e?.message,"err");}
    finally{setBusy(false);}
  };

  const stopClock=async()=>{
    if(!myActive)return;
    setBusy(true);
    const end=new Date().toISOString();
    const secs=calcDuration(myActive.start_time,end);
    try{
      await db.patch(`time_sessions?id=eq.${myActive.id}`,{end_time:end,duration_seconds:secs,status:"completed"});
      setMyActive(null);toast$(`✅ ${hms(secs)} logged!`);loadAll();
    }catch(e){toast$("Error: "+e?.message,"err");}
    finally{setBusy(false);}
  };

  const totalSecs=sessions.filter(s=>s.status==="completed").reduce((a,s)=>a+(s.duration_seconds||0),0);
  const activeCnt=sessions.filter(s=>s.status==="active").length;
  const uniqueDevs=[...new Set(sessions.map(s=>s.developer_name))].sort();
  const tzMeta=TIMEZONES.find(t=>t.value===tz);
  const myTasks=tasks.filter(t=>t.user_id===user.id);

  let tableRows=sessions.filter(s=>{
    if(filterDev!=="ALL"&&s.developer_name!==filterDev)return false;
    if(filterStatus!=="ALL"&&s.status!==filterStatus)return false;
    if(search){const q=search.toLowerCase();return s.developer_name?.toLowerCase().includes(q)||s.task_name?.toLowerCase().includes(q);}
    return true;
  });
  tableRows=[...tableRows].sort((a,b)=>{let av=a[sortCol]??0,bv=b[sortCol]??0;return sortDir==="asc"?(av<bv?-1:av>bv?1:0):(av>bv?-1:av<bv?1:0);});
  const toggleSort=col=>{if(sortCol===col)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortCol(col);setSortDir("desc");}};

  const thS={padding:"11px 16px",textAlign:"left",fontSize:11,fontWeight:700,letterSpacing:"0.06em",color:T.textMuted,background:T.bgInput,borderBottom:`1px solid ${T.border}`,whiteSpace:"nowrap",cursor:"pointer",userSelect:"none"};

  return(
    <div style={{paddingTop:28,animation:"fadeIn .4s ease"}}>
      {/* Project Hero */}
      <div style={{...card(T),background:`linear-gradient(135deg,${pc}18,${pc}05)`,border:`1px solid ${pc}40`,marginBottom:28,display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
        <div style={{width:56,height:56,borderRadius:14,background:pc,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:800,color:"#fff",letterSpacing:"-0.05em",flexShrink:0}}>
          {initials(project.name)}
        </div>
        <div style={{flex:1}}>
          <h2 style={{margin:0,fontSize:"clamp(20px,3vw,28px)",fontWeight:800,color:T.text,letterSpacing:"-0.03em"}}>{project.name}</h2>
          {project.description&&<div style={{fontSize:13,color:T.textMuted,marginTop:3}}>{project.description}</div>}
        </div>
        <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>
          {[{l:"Sessions",v:sessions.length},{l:"Hours",v:hmLabel(totalSecs)||"0h"},{l:"Active",v:activeCnt,red:activeCnt>0},{l:"Members",v:members.length}].map(s=>(
            <div key={s.l} style={{textAlign:"center"}}>
              <div style={{fontSize:"clamp(20px,3vw,28px)",fontWeight:800,color:s.red?"#dc2626":pc,letterSpacing:"-0.05em"}}>{s.v}</div>
              <div style={{fontSize:11,color:T.textMuted,fontWeight:600,letterSpacing:"0.06em",textTransform:"uppercase"}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:6,marginBottom:24,background:T.bgInput,borderRadius:12,padding:4,width:"fit-content",flexWrap:"wrap"}}>
        {[{id:"clock",l:"⏱ Clock"},{id:"logs",l:"📋 Sessions"},{id:"team",l:"👥 Team"},{id:"tasks",l:"✅ My Tasks"+(myTasks.length?` (${myTasks.length})`:"")}].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{...btn(tab===t.id?T.accent:"transparent",tab===t.id?"#fff":T.textMuted),padding:"8px 18px",borderRadius:9,fontSize:13,boxShadow:tab===t.id?"0 2px 8px rgba(99,102,241,.3)":"none"}}>
            {t.l}
          </button>
        ))}
      </div>

      {/* ── CLOCK TAB ── */}
      {tab==="clock"&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
          <div style={card(T)}>
            <div style={{fontSize:12,fontWeight:700,letterSpacing:"0.1em",color:pc,marginBottom:20}}>CLOCK IN / OUT</div>

            {/* Developer — read-only with member list shown disabled */}
            <div style={{marginBottom:16}}>
              <label style={lbl(T)}>Developer</label>
              <div style={{...inp(T),background:T.bgInput,opacity:.8,display:"flex",alignItems:"center",gap:10,cursor:"default"}}>
                <div style={{width:26,height:26,borderRadius:"50%",background:aColor(user.full_name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#fff"}}>{initials(user.full_name)}</div>
                <span style={{fontWeight:600}}>{user.full_name}</span>
                <span style={{marginLeft:"auto",fontSize:11,color:T.accent,background:T.accentGlow,padding:"2px 8px",borderRadius:6}}>You</span>
              </div>
              {members.filter(m=>m.id!==user.id).length>0&&(
                <div style={{marginTop:8,fontSize:11,color:T.textMuted}}>Also in this project: {members.filter(m=>m.id!==user.id).map(m=>m.full_name).join(", ")}</div>
              )}
            </div>

            <div style={{marginBottom:16}}>
              <label style={lbl(T)}>Task Name *</label>
              <input value={taskName} onChange={e=>setTaskName(e.target.value)} placeholder="What are you working on?" disabled={!!myActive} style={inp(T)}/>
            </div>
            <div style={{marginBottom:16}}>
              <label style={lbl(T)}>Description</label>
              <textarea value={taskDesc} onChange={e=>setTaskDesc(e.target.value)} placeholder="Brief notes…" disabled={!!myActive} style={{...inp(T),resize:"vertical",minHeight:68}}/>
            </div>
            <div style={{marginBottom:20}}>
              <label style={lbl(T)}>Timezone</label>
              <select value={tz} onChange={e=>setTz(e.target.value)} disabled={!!myActive} style={{...inp(T),background:T.bgInput}}>
                {TIMEZONES.map(t=><option key={t.value} value={t.value}>{t.flag} {t.label}</option>)}
              </select>
            </div>

            {myActive?(
              <button onClick={stopClock} disabled={busy}
                style={{...btn("#dc2626","#fff"),width:"100%",padding:"14px",fontSize:15,fontWeight:700,borderRadius:12,animation:"glowRed 2s infinite"}}>
                {busy?"Saving…":"⏹  Stop & Save Session"}
              </button>
            ):(
              <button onClick={startClock} disabled={busy}
                style={{...btn(pc,"#fff"),width:"100%",padding:"14px",fontSize:15,fontWeight:700,borderRadius:12,boxShadow:`0 6px 20px ${pc}50`}}>
                {busy?"Starting…":"▶  Start Clock"}
              </button>
            )}
          </div>

          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div style={{...card(T),background:`${pc}0d`,border:`1px solid ${pc}30`,textAlign:"center"}}>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:pc,marginBottom:6}}>{tzMeta?.flag} {tzMeta?.label?.toUpperCase()}</div>
              <div style={{fontSize:"clamp(13px,2vw,16px)",fontWeight:600,color:T.text,fontFamily:"JetBrains Mono,monospace"}}><LiveClock tz={tz}/></div>
            </div>

            {myActive?(
              <div style={{...card(T),background:"rgba(220,38,38,.05)",border:"1px solid rgba(220,38,38,.2)",flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
                  <span style={{width:8,height:8,background:"#dc2626",borderRadius:"50%",display:"inline-block",animation:"pulse 1s infinite"}}/>
                  <span style={{fontSize:11,fontWeight:700,letterSpacing:"0.1em",color:"#dc2626"}}>RECORDING</span>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                  <div style={{width:44,height:44,borderRadius:"50%",background:aColor(user.full_name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:"#fff"}}>{initials(user.full_name)}</div>
                  <div>
                    <div style={{fontSize:16,fontWeight:700,color:T.text}}>{user.full_name}</div>
                    <div style={{fontSize:12,color:T.textMuted}}>{myActive.task_name}</div>
                  </div>
                </div>
                <div style={{fontSize:11,color:T.textMuted,letterSpacing:"0.06em",marginBottom:4}}>ELAPSED TIME</div>
                <div style={{fontSize:"clamp(32px,6vw,52px)",fontWeight:900,color:"#dc2626",fontFamily:"JetBrains Mono,monospace",letterSpacing:"-0.04em"}}>{hms(elapsed)}</div>
              </div>
            ):(
              <div style={{...card(T),border:`1px dashed ${T.border}`,flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",gap:10}}>
                <div style={{fontSize:48,opacity:.15}}>⏰</div>
                <div style={{fontSize:14,color:T.textMuted}}>No active session</div>
                <div style={{fontSize:12,color:T.textDim}}>Enter a task and start the clock</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── LOGS TAB ── */}
      {tab==="logs"&&(
        <div>
          <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search developer or task…" style={{...inp(T),width:"auto",flex:"1 1 200px",fontSize:13}}/>
            <select value={filterDev} onChange={e=>setFilterDev(e.target.value)} style={{...inp(T),width:"auto",fontSize:13}}>
              <option value="ALL">All Developers</option>
              {uniqueDevs.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{...inp(T),width:"auto",fontSize:13}}>
              <option value="ALL">All Status</option>
              <option value="completed">Completed</option>
              <option value="active">Active</option>
            </select>
          </div>
          <div style={{fontSize:12,color:T.textMuted,marginBottom:10,fontWeight:600}}>{tableRows.length} / {sessions.length} RECORDS</div>
          <div style={{overflowX:"auto",borderRadius:14,border:`1px solid ${T.border}`}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:900}}>
              <thead>
                <tr>
                  {[{col:"developer_name",l:"Developer"},{col:"task_name",l:"Task"},{col:"task_description",l:"Description"},{col:"start_time",l:"Date"},{col:"start_time",l:"Start",id:"st"},{col:"end_time",l:"End"},{col:"duration_seconds",l:"Duration"},{col:"status",l:"Status"}].map(h=>(
                    <th key={h.id||h.col+h.l} onClick={()=>toggleSort(h.col)} style={{...thS,color:sortCol===h.col?pc:T.textMuted}}>
                      {h.l} {sortCol===h.col&&<span>{sortDir==="asc"?"↑":"↓"}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.length===0&&<tr><td colSpan={8} style={{padding:48,textAlign:"center",color:T.textMuted,fontSize:13}}>No sessions yet.</td></tr>}
                {tableRows.map((s,i)=>{
                  const live=s.status==="active"?Math.floor((Date.now()-new Date(s.start_time).getTime())/1000):null;
                  const bg=i%2===0?T.bgInput:"transparent";
                  return(
                    <tr key={s.id} style={{background:bg,borderBottom:`1px solid ${T.border}`}}
                      onMouseEnter={e=>e.currentTarget.style.background=`${pc}0a`}
                      onMouseLeave={e=>e.currentTarget.style.background=bg}>
                      <td style={{padding:"12px 16px",whiteSpace:"nowrap"}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <div style={{width:30,height:30,borderRadius:"50%",background:aColor(s.developer_name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#fff"}}>{initials(s.developer_name)}</div>
                          <span style={{fontWeight:600,color:T.text}}>{s.developer_name}</span>
                        </div>
                      </td>
                      <td style={{padding:"12px 16px",maxWidth:160,fontWeight:500,color:T.text,wordBreak:"break-word"}}>{s.task_name}</td>
                      <td style={{padding:"12px 16px",maxWidth:180,fontSize:12,color:T.textMuted,wordBreak:"break-word"}}>{s.task_description||"—"}</td>
                      <td style={{padding:"12px 16px",fontSize:12,color:T.textMuted,whiteSpace:"nowrap"}}>{fmtDate(s.start_time,s.timezone)}</td>
                      <td style={{padding:"12px 16px",fontSize:12,color:T.textMuted,whiteSpace:"nowrap",fontFamily:"JetBrains Mono,monospace"}}>{fmtTime(s.start_time,s.timezone)}</td>
                      <td style={{padding:"12px 16px",fontSize:12,color:T.textMuted,whiteSpace:"nowrap",fontFamily:"JetBrains Mono,monospace"}}>{s.end_time?fmtTime(s.end_time,s.timezone):"—"}</td>
                      <td style={{padding:"12px 16px",fontWeight:700,color:s.status==="active"?"#dc2626":pc,fontFamily:"JetBrains Mono,monospace",whiteSpace:"nowrap"}}>
                        {s.status==="active"?<span style={{animation:"pulse 2s infinite",display:"inline-block"}}>⏱ {hms(live)}</span>:hms(s.duration_seconds)}
                        {s.status==="completed"&&s.duration_seconds&&<div style={{fontSize:11,color:T.textDim,fontWeight:400,fontFamily:"Inter,sans-serif"}}>{hmLabel(s.duration_seconds)}</div>}
                      </td>
                      <td style={{padding:"12px 16px"}}>
                        <span style={{padding:"4px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:s.status==="active"?"rgba(220,38,38,.15)":`${pc}20`,color:s.status==="active"?"#dc2626":pc,border:`1px solid ${s.status==="active"?"rgba(220,38,38,.3)":pc+"40"}`}}>
                          {s.status==="active"?"● Active":"✓ Done"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TEAM TAB ── */}
      {tab==="team"&&(
        <div>
          {members.length===0?(
            <div style={{...card(T),textAlign:"center",padding:64,color:T.textMuted}}>No team members in this project yet.</div>
          ):(
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:18}}>
              {members.map(m=>{
                const ms=sessions.filter(s=>s.user_id===m.id);
                const secs=ms.filter(s=>s.status==="completed").reduce((a,s)=>a+(s.duration_seconds||0),0);
                const online=ms.some(s=>s.status==="active");
                const pct=totalSecs>0?Math.round((secs/totalSecs)*100):0;
                const tlist=[...new Set(ms.map(s=>s.task_name))].slice(0,3);
                return(
                  <div key={m.id} style={{...card(T),border:online?"1px solid rgba(220,38,38,.3)":card(T).border,boxShadow:online?"0 0 20px rgba(220,38,38,.08)":T.shadow}}>
                    <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
                      <div style={{width:48,height:48,borderRadius:"50%",background:aColor(m.full_name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:800,color:"#fff",position:"relative"}}>
                        {initials(m.full_name)}
                        {online&&<div style={{position:"absolute",bottom:0,right:0,width:12,height:12,background:"#dc2626",borderRadius:"50%",border:`2px solid ${T.bgCard}`,animation:"pulse 1s infinite"}}/>}
                      </div>
                      <div>
                        <div style={{fontSize:16,fontWeight:700,color:T.text}}>{m.full_name}</div>
                        <div style={{fontSize:12,color:online?"#dc2626":T.textMuted}}>{online?"● Recording now":"Offline"}</div>
                      </div>
                      <div style={{marginLeft:"auto",textAlign:"right"}}>
                        <div style={{fontSize:16,fontWeight:800,color:pc}}>{pct}%</div>
                        <div style={{fontSize:10,color:T.textMuted,fontWeight:600}}>OF TOTAL</div>
                      </div>
                    </div>
                    <div style={{height:4,background:T.bgInput,borderRadius:2,marginBottom:14,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${pct}%`,background:pc,borderRadius:2,transition:"width .5s ease"}}/>
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                      {[{l:"Sessions",v:ms.length},{l:"Hours",v:hmLabel(secs)||"0h"}].map(s=>(
                        <div key={s.l} style={{background:T.bgInput,borderRadius:10,padding:"10px 12px"}}>
                          <div style={{fontSize:18,fontWeight:800,color:T.text}}>{s.v}</div>
                          <div style={{fontSize:10,color:T.textMuted,fontWeight:600,letterSpacing:"0.06em"}}>{s.l.toUpperCase()}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{fontSize:11,color:T.textMuted,fontWeight:700,letterSpacing:"0.06em",marginBottom:6}}>RECENT TASKS</div>
                    {tlist.length===0&&<div style={{fontSize:12,color:T.textDim}}>No sessions yet</div>}
                    {tlist.map((t,i)=><div key={i} style={{fontSize:12,color:T.textMuted,padding:"3px 0",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",borderBottom:i<tlist.length-1?`1px solid ${T.border}`:"none"}}>· {t}</div>)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── MY TASKS TAB ── */}
      {tab==="tasks"&&(
        <MyTasksPanel tasks={myTasks} user={user} project={project} onRefresh={loadAll} toast$={toast$} T={T}/>
      )}
    </div>
  );
}

// ── My Tasks Panel (member view) ──
function MyTasksPanel({tasks,user,project,onRefresh,toast$,T}){
  const [editTask,setEditTask]=useState(null);
  const pc=project.color||T.accent;

  const updateTask=async(id,patch)=>{
    try{
      await db.patch(`tasks?id=eq.${id}`,{...patch,updated_at:new Date().toISOString()});
      toast$("✅ Task updated!");onRefresh();setEditTask(null);
    }catch(e){toast$("Error: "+e?.message,"err");}
  };

  if(tasks.length===0)return(
    <div style={{...card(T),textAlign:"center",padding:72,color:T.textMuted}}>
      <div style={{fontSize:40,marginBottom:14,opacity:.3}}>✅</div>
      <div style={{fontSize:15,fontWeight:500}}>No tasks assigned to you in this project.</div>
      <div style={{fontSize:13,marginTop:8,color:T.textDim}}>Your admin will assign tasks here.</div>
    </div>
  );

  return(
    <div>
      {editTask&&(
        <Modal T={T} onClose={()=>setEditTask(null)} width={560}>
          <MemberTaskEditForm task={editTask} onSave={d=>updateTask(editTask.id,d)} onClose={()=>setEditTask(null)} T={T}/>
        </Modal>
      )}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:16}}>
        {tasks.map(t=>{
          const pr=PRIO_MAP[t.priority]||PRIO_MAP.medium;
          const st=STATUS_MAP[t.status]||STATUS_MAP.pending;
          const overdue=t.deadline&&t.status!=="completed"&&new Date(t.deadline)<new Date();
          return(
            <div key={t.id} style={{...card(T),borderLeft:`4px solid ${st.c}`,animation:"fadeIn .4s ease"}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8,marginBottom:10}}>
                <div style={{fontSize:15,fontWeight:700,color:T.text,lineHeight:1.3}}>{t.title}</div>
                <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:st.bg,color:st.c,whiteSpace:"nowrap",flexShrink:0}}>{st.label}</span>
              </div>
              {t.description&&<div style={{fontSize:13,color:T.textMuted,marginBottom:10,lineHeight:1.5}}>{t.description}</div>}
              <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
                <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:pr.bg,color:pr.c}}>{pr.label}</span>
                {t.deadline&&<span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:600,background:overdue?"rgba(220,38,38,.12)":T.bgInput,color:overdue?"#dc2626":T.textMuted}}>📅 {t.deadline}{overdue?" (Overdue)":""}</span>}
              </div>
              {t.member_notes&&<div style={{fontSize:12,color:T.textMuted,background:T.bgInput,borderRadius:8,padding:"8px 12px",marginBottom:12,fontStyle:"italic"}}>"{t.member_notes}"</div>}
              {t.notes&&<div style={{fontSize:12,color:T.accent,marginBottom:12}}>📌 Admin note: {t.notes}</div>}
              <button onClick={()=>setEditTask(t)} style={{...btn(T.accent,"#fff"),padding:"8px 18px",borderRadius:8,fontSize:12,boxShadow:`0 3px 10px ${T.accent}30`}}>
                Update Status / Notes →
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MemberTaskEditForm({task,onSave,onClose,T}){
  const [status,setStatus]=useState(task.status||"pending");
  const [notes,setNotes]=useState(task.member_notes||"");
  return(
    <div>
      <div style={{fontSize:12,fontWeight:700,letterSpacing:"0.1em",color:T.accent,marginBottom:16}}>UPDATE TASK</div>
      <div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:4}}>{task.title}</div>
      {task.description&&<div style={{fontSize:13,color:T.textMuted,marginBottom:16}}>{task.description}</div>}
      <div style={{marginBottom:16}}>
        <label style={lbl(T)}>Your Status</label>
        <select value={status} onChange={e=>setStatus(e.target.value)} style={{...inp(T)}}>
          {Object.entries(STATUS_MAP).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <div style={{marginBottom:20}}>
        <label style={lbl(T)}>Notes / Progress Update</label>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="What did you do? Any blockers?" style={{...inp(T),resize:"vertical",minHeight:90,lineHeight:1.5}}/>
      </div>
      <div style={{display:"flex",gap:10}}>
        <button onClick={()=>onSave({status,member_notes:notes})} style={{...btn(T.accent,"#fff"),padding:"10px 22px",borderRadius:10}}>Save Update</button>
        <button onClick={onClose} style={{...btn("transparent",T.textMuted),padding:"10px 22px",border:`1px solid ${T.border}`,borderRadius:10}}>Cancel</button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// ADMIN PAGE
// ══════════════════════════════════════════════════════════
function AdminPage({toast$,T}){
  const [tab,setTab]=useState("members");
  const [projects,setProjects]=useState([]);
  const [users,setUsers]=useState([]);
  const [sessions,setSessions]=useState([]);
  const [tasks,setTasks]=useState([]);
  const [pmLinks,setPmLinks]=useState([]);
  const {user:me}=useAuth();

  const loadAll=async()=>{
    try{
      const [p,u,s,t,pm]=await Promise.all([
        db.get("projects?order=created_at.asc"),
        db.get("users?order=full_name.asc"),
        db.get("time_sessions?order=created_at.desc&limit=500"),
        db.get("tasks?order=created_at.desc"),
        db.get("project_members"),
      ]);
      setProjects(p);setUsers(u);setSessions(s);setTasks(t);setPmLinks(pm);
    }catch(e){toast$("Load error: "+e?.message,"err");}
  };
  useEffect(()=>{loadAll();},[]);

  const tabs=[{id:"members",l:"👤 Members"},{id:"projects",l:"🗂 Projects"},{id:"sessions",l:"📋 Sessions"},{id:"tasks",l:"✅ Tasks"},{id:"account",l:"🔑 My Account"}];

  return(
    <div style={{paddingTop:28,animation:"fadeIn .4s ease"}}>
      <div style={{marginBottom:28,padding:"20px 24px",background:"rgba(99,102,241,.08)",border:"1px solid rgba(99,102,241,.2)",borderRadius:16,display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
        <div style={{fontSize:32}}>⚙</div>
        <div>
          <div style={{fontSize:20,fontWeight:800,color:T.text,letterSpacing:"-0.03em"}}>Admin Panel</div>
          <div style={{fontSize:12,color:T.accent,fontWeight:600,letterSpacing:"0.08em"}}>TENSORFOLD.AI · FULL DATABASE CONTROL</div>
        </div>
        <div style={{marginLeft:"auto",display:"flex",gap:20,flexWrap:"wrap"}}>
          {[{l:"Users",v:users.length},{l:"Projects",v:projects.length},{l:"Sessions",v:sessions.length},{l:"Tasks",v:tasks.length}].map(s=>(
            <div key={s.l} style={{textAlign:"center"}}>
              <div style={{fontSize:24,fontWeight:800,color:T.accent}}>{s.v}</div>
              <div style={{fontSize:11,color:T.textMuted,fontWeight:600,letterSpacing:"0.06em"}}>{s.l.toUpperCase()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab nav */}
      <div style={{display:"flex",gap:6,marginBottom:24,background:T.bgInput,borderRadius:12,padding:4,width:"fit-content",flexWrap:"wrap"}}>
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{...btn(tab===t.id?T.accent:"transparent",tab===t.id?"#fff":T.textMuted),padding:"9px 18px",borderRadius:9,fontSize:13,boxShadow:tab===t.id?"0 2px 8px rgba(99,102,241,.3)":"none"}}>
            {t.l}
          </button>
        ))}
      </div>

      {tab==="members"&&<AdminMembers users={users} projects={projects} pmLinks={pmLinks} onRefresh={loadAll} toast$={toast$} T={T}/>}
      {tab==="projects"&&<AdminProjects projects={projects} users={users} pmLinks={pmLinks} onRefresh={loadAll} toast$={toast$} T={T}/>}
      {tab==="sessions"&&<AdminSessions sessions={sessions} projects={projects} users={users} onRefresh={loadAll} toast$={toast$} T={T}/>}
      {tab==="tasks"&&<AdminTasks tasks={tasks} projects={projects} users={users} pmLinks={pmLinks} onRefresh={loadAll} toast$={toast$} T={T}/>}
      {tab==="account"&&<AdminAccount me={me} onRefresh={loadAll} toast$={toast$} T={T}/>}
    </div>
  );
}

// ── Admin Members ──
function AdminMembers({users,projects,pmLinks,onRefresh,toast$,T}){
  const [showAdd,setShowAdd]=useState(false);
  const [form,setForm]=useState({username:"",password:"",full_name:"",role:"member",timezone:"Asia/Karachi"});
  const [editUser,setEditUser]=useState(null);
  const [busy,setBusy]=useState(false);

  const create=async()=>{
    if(!form.username.trim()||!form.password.trim()||!form.full_name.trim())return toast$("Fill all required fields","err");
    setBusy(true);
    try{
      await db.post("users",{username:form.username.trim(),password:form.password.trim(),full_name:form.full_name.trim(),role:form.role,timezone:form.timezone});
      toast$("✅ Member created!");setForm({username:"",password:"",full_name:"",role:"member",timezone:"Asia/Karachi"});setShowAdd(false);onRefresh();
    }catch(e){toast$("Error: "+(e?.message||"Username may already exist"),"err");}
    finally{setBusy(false);}
  };

  const deleteUser=async(id)=>{
    if(!confirm("Delete this user?"))return;
    try{await db.del(`users?id=eq.${id}`);toast$("Deleted.");onRefresh();}
    catch(e){toast$("Error: "+e?.message,"err");}
  };

  const updateUser=async(id,d)=>{
    try{await db.patch(`users?id=eq.${id}`,d);toast$("✅ Updated!");onRefresh();setEditUser(null);}
    catch(e){toast$("Error: "+e?.message,"err");}
  };

  const thA={padding:"10px 16px",textAlign:"left",fontSize:11,fontWeight:700,letterSpacing:"0.06em",color:T.textMuted,background:T.bgInput,borderBottom:`1px solid ${T.border}`};

  return(
    <div>
      {editUser&&(
        <Modal T={T} onClose={()=>setEditUser(null)} width={520}>
          <EditUserForm user={editUser} onSave={d=>updateUser(editUser.id,d)} onClose={()=>setEditUser(null)} T={T}/>
        </Modal>
      )}

      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:16}}>
        <button onClick={()=>setShowAdd(v=>!v)} style={{...btn(showAdd?"rgba(220,38,38,.12)":T.accent,showAdd?"#dc2626":"#fff"),padding:"10px 22px",borderRadius:10}}>
          {showAdd?"✕ Cancel":"＋ Add Member"}
        </button>
      </div>

      {showAdd&&(
        <div style={{...card(T),border:"1px solid rgba(99,102,241,.3)",marginBottom:20,animation:"fadeUp .3s ease"}}>
          <div style={{fontSize:12,fontWeight:700,letterSpacing:"0.1em",color:T.accent,marginBottom:16}}>REGISTER NEW MEMBER</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            {[{k:"full_name",l:"Full Name *",ph:"Ahmed Khan"},{k:"username",l:"Username *",ph:"ahmed"},{k:"password",l:"Password *",ph:"••••••••"}].map(f=>(
              <div key={f.k}>
                <label style={lbl(T)}>{f.l}</label>
                <input value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} placeholder={f.ph} style={inp(T)} type={f.k==="password"?"password":"text"}/>
              </div>
            ))}
            <div>
              <label style={lbl(T)}>Role</label>
              <select value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))} style={{...inp(T)}}>
                <option value="member">Member</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label style={lbl(T)}>Timezone</label>
              <select value={form.timezone} onChange={e=>setForm(p=>({...p,timezone:e.target.value}))} style={{...inp(T)}}>
                {TIMEZONES.map(t=><option key={t.value} value={t.value}>{t.flag} {t.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button onClick={create} disabled={busy} style={{...btn(T.accent,"#fff"),padding:"10px 22px",borderRadius:10}}>{busy?"Creating…":"Create Member"}</button>
            <button onClick={()=>setShowAdd(false)} style={{...btn("transparent",T.textMuted),padding:"10px 22px",border:`1px solid ${T.border}`,borderRadius:10}}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{overflowX:"auto",borderRadius:14,border:`1px solid ${T.border}`}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead><tr>{["Name","Username","Role","Timezone","Projects","Actions"].map(h=><th key={h} style={thA}>{h}</th>)}</tr></thead>
          <tbody>
            {users.map((u,i)=>{
              const myProjects=pmLinks.filter(pm=>pm.user_id===u.id).map(pm=>projects.find(p=>p.id===pm.project_id)).filter(Boolean);
              const bg=i%2===0?T.bgInput:"transparent";
              return(
                <tr key={u.id} style={{background:bg,borderBottom:`1px solid ${T.border}`}}>
                  <td style={{padding:"12px 16px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:32,height:32,borderRadius:"50%",background:aColor(u.full_name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"#fff"}}>{initials(u.full_name)}</div>
                      <span style={{fontWeight:600,color:T.text}}>{u.full_name}</span>
                    </div>
                  </td>
                  <td style={{padding:"12px 16px",color:T.textMuted,fontFamily:"JetBrains Mono,monospace",fontSize:12}}>@{u.username}</td>
                  <td style={{padding:"12px 16px"}}>
                    <span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:u.role==="admin"?"rgba(99,102,241,.15)":"rgba(100,116,139,.15)",color:u.role==="admin"?T.accent:T.textMuted}}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{padding:"12px 16px",fontSize:12,color:T.textMuted}}>{TIMEZONES.find(t=>t.value===u.timezone)?.flag} {(u.timezone||"").split("/")[1]}</td>
                  <td style={{padding:"12px 16px",maxWidth:200}}>
                    <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                      {myProjects.length===0?<span style={{fontSize:11,color:T.textDim}}>No projects</span>:myProjects.map(p=>(
                        <span key={p.id} style={{padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:600,background:`${p.color||T.accent}20`,color:p.color||T.accent}}>{p.name}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{padding:"12px 16px"}}>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>setEditUser(u)} style={{...btn("rgba(99,102,241,.12)",T.accent),padding:"5px 12px",borderRadius:7,fontSize:12,border:"1px solid rgba(99,102,241,.25)"}}>Edit</button>
                      <button onClick={()=>deleteUser(u.id)} style={{...btn("rgba(220,38,38,.1)","#dc2626"),padding:"5px 12px",borderRadius:7,fontSize:12,border:"1px solid rgba(220,38,38,.2)"}}>Del</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EditUserForm({user:u,onSave,onClose,T}){
  const [d,setD]=useState({full_name:u.full_name,username:u.username,password:u.password,role:u.role,timezone:u.timezone||"Asia/Karachi"});
  return(
    <div>
      <div style={{fontSize:12,fontWeight:700,letterSpacing:"0.1em",color:T.accent,marginBottom:16}}>EDIT MEMBER</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:16}}>
        {[{k:"full_name",l:"Full Name"},{k:"username",l:"Username"},{k:"password",l:"Password"}].map(f=>(
          <div key={f.k}>
            <label style={lbl(T)}>{f.l}</label>
            <input value={d[f.k]} onChange={e=>setD(p=>({...p,[f.k]:e.target.value}))} style={inp(T)} type={f.k==="password"?"password":"text"}/>
          </div>
        ))}
        <div>
          <label style={lbl(T)}>Role</label>
          <select value={d.role} onChange={e=>setD(p=>({...p,role:e.target.value}))} style={inp(T)}>
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label style={lbl(T)}>Timezone</label>
          <select value={d.timezone} onChange={e=>setD(p=>({...p,timezone:e.target.value}))} style={inp(T)}>
            {TIMEZONES.map(t=><option key={t.value} value={t.value}>{t.flag} {t.label}</option>)}
          </select>
        </div>
      </div>
      <div style={{display:"flex",gap:10}}>
        <button onClick={()=>onSave(d)} style={{...btn(T.accent,"#fff"),padding:"10px 22px",borderRadius:10}}>Save Changes</button>
        <button onClick={onClose} style={{...btn("transparent",T.textMuted),padding:"10px 22px",border:`1px solid ${T.border}`,borderRadius:10}}>Cancel</button>
      </div>
    </div>
  );
}

// ── Admin Projects (manage membership) ──
function AdminProjects({projects,users,pmLinks,onRefresh,toast$,T}){
  const [sel,setSel]=useState(null); // selected project for member management
  const [addUserId,setAddUserId]=useState("");

  const membersOf=pid=>pmLinks.filter(pm=>pm.project_id===pid).map(pm=>users.find(u=>u.id===pm.user_id)).filter(Boolean);
  const nonMembers=pid=>users.filter(u=>!pmLinks.some(pm=>pm.project_id===pid&&pm.user_id===u.id));

  const addMember=async()=>{
    if(!addUserId)return;
    try{await db.post("project_members",{project_id:sel.id,user_id:addUserId});toast$("✅ Member added!");setAddUserId("");onRefresh();}
    catch(e){toast$("Error: "+e?.message,"err");}
  };
  const removeMember=async(userId)=>{
    try{await db.del(`project_members?project_id=eq.${sel.id}&user_id=eq.${userId}`);toast$("Removed.");onRefresh();}
    catch(e){toast$("Error: "+e?.message,"err");}
  };

  return(
    <div style={{display:"grid",gridTemplateColumns:sel?"1fr 1fr":"1fr",gap:20}}>
      <div>
        <div style={{fontSize:12,fontWeight:700,color:T.textMuted,letterSpacing:"0.1em",marginBottom:14}}>SELECT PROJECT TO MANAGE MEMBERS</div>
        {projects.map(p=>{
          const mc=membersOf(p.id).length;
          return(
            <div key={p.id} onClick={()=>setSel(p)} style={{...card(T),display:"flex",alignItems:"center",gap:14,marginBottom:12,cursor:"pointer",border:`1px solid ${sel?.id===p.id?p.color||T.accent:T.border}`,borderLeft:`4px solid ${p.color||T.accent}`,boxShadow:sel?.id===p.id?`0 0 0 1px ${p.color||T.accent}30`:T.shadow,transition:"all .15s"}}>
              <div style={{width:40,height:40,borderRadius:10,background:p.color||T.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,color:"#fff"}}>{initials(p.name)}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:15,fontWeight:700,color:T.text}}>{p.name}</div>
                <div style={{fontSize:12,color:T.textMuted}}>{mc} member{mc!==1?"s":""}</div>
              </div>
              <div style={{fontSize:20,color:T.textDim}}>{sel?.id===p.id?"→":""}</div>
            </div>
          );
        })}
      </div>

      {sel&&(
        <div style={{...card(T),border:`1px solid rgba(99,102,241,.25)`,animation:"fadeIn .3s ease"}}>
          <div style={{fontSize:12,fontWeight:700,letterSpacing:"0.1em",color:T.accent,marginBottom:4}}>MANAGE: {sel.name.toUpperCase()}</div>
          <div style={{fontSize:13,color:T.textMuted,marginBottom:20}}>Add or remove team members from this project</div>

          {/* Add member */}
          <div style={{display:"flex",gap:8,marginBottom:20}}>
            <select value={addUserId} onChange={e=>setAddUserId(e.target.value)} style={{...inp(T),flex:1}}>
              <option value="">Select member to add…</option>
              {nonMembers(sel.id).map(u=><option key={u.id} value={u.id}>{u.full_name} (@{u.username})</option>)}
            </select>
            <button onClick={addMember} style={{...btn(T.accent,"#fff"),padding:"10px 18px",borderRadius:10,whiteSpace:"nowrap"}}>Add</button>
          </div>

          {/* Current members */}
          <div style={{fontSize:11,fontWeight:700,color:T.textMuted,letterSpacing:"0.08em",marginBottom:10}}>CURRENT MEMBERS ({membersOf(sel.id).length})</div>
          {membersOf(sel.id).length===0&&<div style={{fontSize:13,color:T.textDim,padding:"12px 0"}}>No members yet. Add someone above.</div>}
          {membersOf(sel.id).map(m=>(
            <div key={m.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${T.border}`}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:aColor(m.full_name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff"}}>{initials(m.full_name)}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:14,fontWeight:600,color:T.text}}>{m.full_name}</div>
                <div style={{fontSize:12,color:T.textMuted}}>@{m.username}</div>
              </div>
              <button onClick={()=>removeMember(m.id)} style={{...btn("rgba(220,38,38,.1)","#dc2626"),padding:"5px 12px",borderRadius:7,fontSize:12,border:"1px solid rgba(220,38,38,.2)"}}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Admin Sessions ──
function AdminSessions({sessions,projects,users,onRefresh,toast$,T}){
  const [showAdd,setShowAdd]=useState(false);
  const [editS,setEditS]=useState(null);
  const [filterP,setFilterP]=useState("ALL");
  const [searchQ,setSearchQ]=useState("");
  const thA={padding:"10px 16px",textAlign:"left",fontSize:11,fontWeight:700,letterSpacing:"0.06em",color:T.textMuted,background:T.bgInput,borderBottom:`1px solid ${T.border}`,whiteSpace:"nowrap"};

  const filtered=sessions.filter(s=>{
    if(filterP!=="ALL"&&s.project_id!==filterP)return false;
    if(searchQ){const q=searchQ.toLowerCase();return s.developer_name?.toLowerCase().includes(q)||s.task_name?.toLowerCase().includes(q);}
    return true;
  });

  const deleteS=async id=>{
    if(!confirm("Delete this session?"))return;
    try{await db.del(`time_sessions?id=eq.${id}`);toast$("Deleted.");onRefresh();}
    catch(e){toast$("Error: "+e?.message,"err");}
  };
  const saveS=async(id,d)=>{
    try{await db.patch(`time_sessions?id=eq.${id}`,d);toast$("✅ Updated!");onRefresh();setEditS(null);}
    catch(e){toast$("Error: "+e?.message,"err");}
  };
  const addS=async d=>{
    try{await db.post("time_sessions",d);toast$("✅ Session added!");onRefresh();setShowAdd(false);}
    catch(e){toast$("Error: "+e?.message,"err");}
  };

  return(
    <div>
      {editS&&<Modal T={T} onClose={()=>setEditS(null)} width={640}><AdminSessionForm session={editS} projects={projects} users={users} onSave={d=>saveS(editS.id,d)} onClose={()=>setEditS(null)} T={T}/></Modal>}
      {showAdd&&<div style={{marginBottom:20}}><AdminSessionForm session={null} projects={projects} users={users} onSave={addS} onClose={()=>setShowAdd(false)} T={T} inline/></div>}

      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="🔍 Search developer, task…" style={{...inp(T),width:"auto",flex:"1 1 180px"}}/>
        <select value={filterP} onChange={e=>setFilterP(e.target.value)} style={{...inp(T),width:"auto"}}>
          <option value="ALL">All Projects</option>
          {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button onClick={()=>setShowAdd(v=>!v)} style={{...btn(showAdd?"rgba(220,38,38,.12)":T.accent,showAdd?"#dc2626":"#fff"),padding:"10px 18px",borderRadius:10,whiteSpace:"nowrap"}}>
          {showAdd?"✕ Cancel":"＋ Add Session"}
        </button>
      </div>
      <div style={{fontSize:12,color:T.textMuted,marginBottom:10,fontWeight:600}}>{filtered.length} / {sessions.length} RECORDS</div>
      <div style={{overflowX:"auto",borderRadius:14,border:`1px solid ${T.border}`}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:1000}}>
          <thead><tr>{["Project","Developer","Task","Date","Start","End","Duration","Status","Actions"].map(h=><th key={h} style={thA}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.length===0&&<tr><td colSpan={9} style={{padding:48,textAlign:"center",color:T.textMuted}}>No sessions.</td></tr>}
            {filtered.map((s,i)=>{
              const proj=projects.find(p=>p.id===s.project_id);
              const bg=i%2===0?T.bgInput:"transparent";
              return(
                <tr key={s.id} style={{background:bg,borderBottom:`1px solid ${T.border}`}}>
                  <td style={{padding:"11px 16px"}}>{proj?<span style={{padding:"3px 8px",borderRadius:6,fontSize:11,fontWeight:700,background:`${proj.color||T.accent}20`,color:proj.color||T.accent}}>{proj.name}</span>:<span style={{color:T.textDim,fontSize:11}}>—</span>}</td>
                  <td style={{padding:"11px 16px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:26,height:26,borderRadius:"50%",background:aColor(s.developer_name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:"#fff"}}>{initials(s.developer_name)}</div>
                      <span style={{fontWeight:600,color:T.text}}>{s.developer_name}</span>
                    </div>
                  </td>
                  <td style={{padding:"11px 16px",maxWidth:150,color:T.text,wordBreak:"break-word"}}>{s.task_name}</td>
                  <td style={{padding:"11px 16px",fontSize:12,color:T.textMuted,whiteSpace:"nowrap"}}>{fmtDate(s.start_time,s.timezone)}</td>
                  <td style={{padding:"11px 16px",fontSize:12,color:T.textMuted,fontFamily:"JetBrains Mono,monospace",whiteSpace:"nowrap"}}>{fmtTime(s.start_time,s.timezone)}</td>
                  <td style={{padding:"11px 16px",fontSize:12,color:T.textMuted,fontFamily:"JetBrains Mono,monospace",whiteSpace:"nowrap"}}>{s.end_time?fmtTime(s.end_time,s.timezone):"—"}</td>
                  <td style={{padding:"11px 16px",fontWeight:700,color:T.accent,fontFamily:"JetBrains Mono,monospace",whiteSpace:"nowrap"}}>{hms(s.duration_seconds)}</td>
                  <td style={{padding:"11px 16px"}}>
                    <span style={{padding:"3px 8px",borderRadius:20,fontSize:11,fontWeight:700,background:s.status==="active"?"rgba(220,38,38,.15)":"rgba(0,214,143,.12)",color:s.status==="active"?"#dc2626":"#00d68f"}}>{s.status==="active"?"Active":"Done"}</span>
                  </td>
                  <td style={{padding:"11px 16px"}}>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>setEditS(s)} style={{...btn("rgba(99,102,241,.12)",T.accent),padding:"5px 10px",borderRadius:7,fontSize:12,border:"1px solid rgba(99,102,241,.2)"}}>Edit</button>
                      <button onClick={()=>deleteS(s.id)} style={{...btn("rgba(220,38,38,.1)","#dc2626"),padding:"5px 10px",borderRadius:7,fontSize:12,border:"1px solid rgba(220,38,38,.2)"}}>Del</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminSessionForm({session:s,projects,users,onSave,onClose,T,inline}){
  const blank={project_id:"",user_id:"",developer_name:"",task_name:"",task_description:"",timezone:"Asia/Karachi",start_time:"",end_time:"",status:"completed"};
  const [d,setD]=useState(s?{...s,start_time:toLocalInput(s.start_time),end_time:toLocalInput(s.end_time)}:blank);
  const set=k=>v=>setD(p=>({...p,[k]:v}));
  const save=()=>{
    if(!d.developer_name.trim()||!d.task_name.trim()||!d.start_time)return;
    const start=new Date(d.start_time).toISOString();
    const end=d.end_time?new Date(d.end_time).toISOString():null;
    const duration=calcDuration(start,end);
    onSave({...d,start_time:start,end_time:end,duration_seconds:duration,project_id:d.project_id||null,user_id:d.user_id||null});
  };

  // Auto-fill developer_name from user selection
  const onUserChange=uid=>{
    const u=users.find(u=>u.id===uid);
    setD(p=>({...p,user_id:uid,developer_name:u?u.full_name:p.developer_name}));
  };

  const wrap=inline?{...card(T),border:"1px solid rgba(99,102,241,.25)",animation:"fadeUp .3s ease"}:{};
  return(
    <div style={wrap}>
      <div style={{fontSize:12,fontWeight:700,letterSpacing:"0.1em",color:T.accent,marginBottom:16}}>{s?"EDIT SESSION":"ADD SESSION"}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
        <div>
          <label style={lbl(T)}>Project</label>
          <select value={d.project_id} onChange={e=>set("project_id")(e.target.value)} style={inp(T)}>
            <option value="">No project</option>
            {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl(T)}>Team Member</label>
          <select value={d.user_id} onChange={e=>onUserChange(e.target.value)} style={inp(T)}>
            <option value="">Select user…</option>
            {users.map(u=><option key={u.id} value={u.id}>{u.full_name}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl(T)}>Developer Name *</label>
          <input value={d.developer_name} onChange={e=>set("developer_name")(e.target.value)} style={inp(T)}/>
        </div>
        <div>
          <label style={lbl(T)}>Task Name *</label>
          <input value={d.task_name} onChange={e=>set("task_name")(e.target.value)} style={inp(T)}/>
        </div>
        <div>
          <label style={lbl(T)}>Description</label>
          <input value={d.task_description} onChange={e=>set("task_description")(e.target.value)} style={inp(T)}/>
        </div>
        <div>
          <label style={lbl(T)}>Timezone</label>
          <select value={d.timezone} onChange={e=>set("timezone")(e.target.value)} style={inp(T)}>
            {TIMEZONES.map(t=><option key={t.value} value={t.value}>{t.flag} {t.label}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl(T)}>Start Time *</label>
          <input type="datetime-local" value={d.start_time} onChange={e=>set("start_time")(e.target.value)} style={inp(T)}/>
        </div>
        <div>
          <label style={lbl(T)}>End Time <span style={{color:T.textDim,fontWeight:400,fontSize:10}}>(duration auto-calculated)</span></label>
          <input type="datetime-local" value={d.end_time} onChange={e=>set("end_time")(e.target.value)} style={inp(T)}/>
        </div>
        <div>
          <label style={lbl(T)}>Status</label>
          <select value={d.status} onChange={e=>set("status")(e.target.value)} style={inp(T)}>
            <option value="completed">Completed</option>
            <option value="active">Active</option>
          </select>
        </div>
        {d.start_time&&d.end_time&&(
          <div style={{display:"flex",alignItems:"flex-end",paddingBottom:8}}>
            <div style={{padding:"10px 14px",background:T.bgInput,borderRadius:10,border:`1px solid ${T.border}`,fontSize:13,fontWeight:700,color:T.accent,fontFamily:"JetBrains Mono,monospace"}}>
              ⏱ {hms(calcDuration(new Date(d.start_time).toISOString(),new Date(d.end_time).toISOString()))}
            </div>
          </div>
        )}
      </div>
      <div style={{display:"flex",gap:10}}>
        <button onClick={save} style={{...btn(T.accent,"#fff"),padding:"10px 22px",borderRadius:10}}>{s?"Save Changes":"Add Session"}</button>
        <button onClick={onClose} style={{...btn("transparent",T.textMuted),padding:"10px 22px",border:`1px solid ${T.border}`,borderRadius:10}}>Cancel</button>
      </div>
    </div>
  );
}

// ── Admin Tasks ──
function AdminTasks({tasks,projects,users,pmLinks,onRefresh,toast$,T}){
  const [showAdd,setShowAdd]=useState(false);
  const [editT,setEditT]=useState(null);
  const [filterP,setFilterP]=useState("ALL");
  const thA={padding:"10px 16px",textAlign:"left",fontSize:11,fontWeight:700,letterSpacing:"0.06em",color:T.textMuted,background:T.bgInput,borderBottom:`1px solid ${T.border}`,whiteSpace:"nowrap"};

  const filtered=tasks.filter(t=>filterP==="ALL"||t.project_id===filterP);

  const deleteT=async id=>{
    if(!confirm("Delete this task?"))return;
    try{await db.del(`tasks?id=eq.${id}`);toast$("Deleted.");onRefresh();}
    catch(e){toast$("Error: "+e?.message,"err");}
  };
  const saveT=async(id,d)=>{
    try{await db.patch(`tasks?id=eq.${id}`,{...d,updated_at:new Date().toISOString()});toast$("✅ Updated!");onRefresh();setEditT(null);}
    catch(e){toast$("Error: "+e?.message,"err");}
  };
  const addT=async d=>{
    try{await db.post("tasks",d);toast$("✅ Task created!");onRefresh();setShowAdd(false);}
    catch(e){toast$("Error: "+e?.message,"err");}
  };

  return(
    <div>
      {editT&&<Modal T={T} onClose={()=>setEditT(null)} width={640}><AdminTaskForm task={editT} projects={projects} users={users} pmLinks={pmLinks} onSave={d=>saveT(editT.id,d)} onClose={()=>setEditT(null)} T={T}/></Modal>}
      {showAdd&&<div style={{marginBottom:20}}><AdminTaskForm task={null} projects={projects} users={users} pmLinks={pmLinks} onSave={addT} onClose={()=>setShowAdd(false)} T={T} inline/></div>}

      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <select value={filterP} onChange={e=>setFilterP(e.target.value)} style={{...inp(T),width:"auto"}}>
          <option value="ALL">All Projects</option>
          {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button onClick={()=>setShowAdd(v=>!v)} style={{...btn(showAdd?"rgba(220,38,38,.12)":T.accent,showAdd?"#dc2626":"#fff"),padding:"10px 18px",borderRadius:10,marginLeft:"auto",whiteSpace:"nowrap"}}>
          {showAdd?"✕ Cancel":"＋ Assign Task"}
        </button>
      </div>

      <div style={{overflowX:"auto",borderRadius:14,border:`1px solid ${T.border}`}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:960}}>
          <thead><tr>{["Project","Assigned To","Title","Priority","Status","Deadline","Member Notes","Actions"].map(h=><th key={h} style={thA}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.length===0&&<tr><td colSpan={8} style={{padding:48,textAlign:"center",color:T.textMuted}}>No tasks yet.</td></tr>}
            {filtered.map((t,i)=>{
              const proj=projects.find(p=>p.id===t.project_id);
              const assignee=users.find(u=>u.id===t.user_id);
              const pr=PRIO_MAP[t.priority]||PRIO_MAP.medium;
              const st=STATUS_MAP[t.status]||STATUS_MAP.pending;
              const overdue=t.deadline&&t.status!=="completed"&&new Date(t.deadline)<new Date();
              const bg=i%2===0?T.bgInput:"transparent";
              return(
                <tr key={t.id} style={{background:bg,borderBottom:`1px solid ${T.border}`}}>
                  <td style={{padding:"11px 16px"}}>{proj?<span style={{padding:"3px 8px",borderRadius:6,fontSize:11,fontWeight:700,background:`${proj.color||T.accent}20`,color:proj.color||T.accent}}>{proj.name}</span>:"—"}</td>
                  <td style={{padding:"11px 16px"}}>
                    {assignee?(
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:26,height:26,borderRadius:"50%",background:aColor(assignee.full_name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:"#fff"}}>{initials(assignee.full_name)}</div>
                        <span style={{fontWeight:600,color:T.text,fontSize:12}}>{assignee.full_name}</span>
                      </div>
                    ):<span style={{color:T.textDim,fontSize:11}}>Unassigned</span>}
                  </td>
                  <td style={{padding:"11px 16px",maxWidth:180,fontWeight:600,color:T.text,wordBreak:"break-word"}}>{t.title}</td>
                  <td style={{padding:"11px 16px"}}><span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:pr.bg,color:pr.c}}>{pr.label}</span></td>
                  <td style={{padding:"11px 16px"}}><span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:st.bg,color:st.c}}>{st.label}</span></td>
                  <td style={{padding:"11px 16px",fontSize:12,color:overdue?"#dc2626":T.textMuted,whiteSpace:"nowrap",fontWeight:overdue?700:400}}>
                    {t.deadline||"—"}{overdue?" ⚠":""}
                  </td>
                  <td style={{padding:"11px 16px",maxWidth:200,fontSize:12,color:T.textMuted,fontStyle:t.member_notes?"italic":"normal"}}>
                    {t.member_notes?`"${t.member_notes.slice(0,60)}${t.member_notes.length>60?"…":""}"` :"—"}
                  </td>
                  <td style={{padding:"11px 16px"}}>
                    <div style={{display:"flex",gap:6}}>
                      <button onClick={()=>setEditT(t)} style={{...btn("rgba(99,102,241,.12)",T.accent),padding:"5px 10px",borderRadius:7,fontSize:12,border:"1px solid rgba(99,102,241,.2)"}}>Edit</button>
                      <button onClick={()=>deleteT(t.id)} style={{...btn("rgba(220,38,38,.1)","#dc2626"),padding:"5px 10px",borderRadius:7,fontSize:12,border:"1px solid rgba(220,38,38,.2)"}}>Del</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminTaskForm({task:t,projects,users,pmLinks,onSave,onClose,T,inline}){
  const blank={project_id:"",user_id:"",title:"",description:"",priority:"medium",status:"pending",deadline:"",notes:""};
  const [d,setD]=useState(t||blank);
  const set=k=>v=>setD(p=>({...p,[k]:v}));

  // When project changes, filter users to only project members
  const projectMembers=d.project_id?users.filter(u=>pmLinks.some(pm=>pm.project_id===d.project_id&&pm.user_id===u.id)):users;

  const save=()=>{
    if(!d.title.trim()||!d.project_id)return;
    onSave({...d,user_id:d.user_id||null,deadline:d.deadline||null,notes:d.notes||null});
  };

  const wrap=inline?{...card(T),border:"1px solid rgba(99,102,241,.25)",animation:"fadeUp .3s ease"}:{};
  return(
    <div style={wrap}>
      <div style={{fontSize:12,fontWeight:700,letterSpacing:"0.1em",color:T.accent,marginBottom:16}}>{t?"EDIT TASK":"ASSIGN NEW TASK"}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:14}}>
        <div>
          <label style={lbl(T)}>Project *</label>
          <select value={d.project_id} onChange={e=>{set("project_id")(e.target.value);setD(p=>({...p,user_id:""}));}} style={inp(T)}>
            <option value="">Select project…</option>
            {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl(T)}>Assign To</label>
          <select value={d.user_id} onChange={e=>set("user_id")(e.target.value)} style={inp(T)}>
            <option value="">Unassigned</option>
            {projectMembers.map(u=><option key={u.id} value={u.id}>{u.full_name}</option>)}
          </select>
        </div>
        <div style={{gridColumn:"1/-1"}}>
          <label style={lbl(T)}>Task Title *</label>
          <input value={d.title} onChange={e=>set("title")(e.target.value)} placeholder="What needs to be done?" style={inp(T)}/>
        </div>
        <div style={{gridColumn:"1/-1"}}>
          <label style={lbl(T)}>Description</label>
          <textarea value={d.description} onChange={e=>set("description")(e.target.value)} placeholder="Detailed description of the task…" style={{...inp(T),resize:"vertical",minHeight:72}}/>
        </div>
        <div>
          <label style={lbl(T)}>Priority</label>
          <select value={d.priority} onChange={e=>set("priority")(e.target.value)} style={inp(T)}>
            {Object.entries(PRIO_MAP).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl(T)}>Status</label>
          <select value={d.status} onChange={e=>set("status")(e.target.value)} style={inp(T)}>
            {Object.entries(STATUS_MAP).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl(T)}>Deadline</label>
          <input type="date" value={d.deadline||""} onChange={e=>set("deadline")(e.target.value)} style={inp(T)}/>
        </div>
        <div>
          <label style={lbl(T)}>Admin Notes (visible to assignee)</label>
          <input value={d.notes||""} onChange={e=>set("notes")(e.target.value)} placeholder="Any notes for the team member…" style={inp(T)}/>
        </div>
      </div>
      <div style={{display:"flex",gap:10}}>
        <button onClick={save} style={{...btn(T.accent,"#fff"),padding:"10px 22px",borderRadius:10}}>{t?"Save Changes":"Create Task"}</button>
        <button onClick={onClose} style={{...btn("transparent",T.textMuted),padding:"10px 22px",border:`1px solid ${T.border}`,borderRadius:10}}>Cancel</button>
      </div>
    </div>
  );
}

// ── Admin My Account ──
function AdminAccount({me,onRefresh,toast$,T}){
  const [d,setD]=useState({full_name:me.full_name,username:me.username,password:"",newPassword:""});
  const [busy,setBusy]=useState(false);

  const save=async()=>{
    if(!d.password)return toast$("Enter current password to confirm","err");
    if(d.password!==me.password)return toast$("Current password is incorrect","err");
    setBusy(true);
    const patch={full_name:d.full_name,username:d.username};
    if(d.newPassword) patch.password=d.newPassword;
    try{
      await db.patch(`users?id=eq.${me.id}`,patch);
      toast$("✅ Account updated! Please log out and log back in.");onRefresh();
    }catch(e){toast$("Error: "+e?.message,"err");}
    finally{setBusy(false);}
  };

  return(
    <div style={{maxWidth:480}}>
      <div style={{...card(T),border:"1px solid rgba(99,102,241,.25)"}}>
        <div style={{fontSize:12,fontWeight:700,letterSpacing:"0.1em",color:T.accent,marginBottom:20}}>MY ACCOUNT SETTINGS</div>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:24,padding:"16px",background:T.bgInput,borderRadius:12}}>
          <div style={{width:52,height:52,borderRadius:"50%",background:aColor(me.full_name),display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:800,color:"#fff"}}>{initials(me.full_name)}</div>
          <div>
            <div style={{fontSize:16,fontWeight:700,color:T.text}}>{me.full_name}</div>
            <div style={{fontSize:12,color:T.accent,fontWeight:600}}>@{me.username} · {me.role}</div>
          </div>
        </div>
        {[{k:"full_name",l:"Full Name"},{k:"username",l:"Username"},{k:"password",l:"Current Password (to confirm changes)",type:"password"},{k:"newPassword",l:"New Password (leave blank to keep current)",type:"password"}].map(f=>(
          <div key={f.k} style={{marginBottom:16}}>
            <label style={lbl(T)}>{f.l}</label>
            <input type={f.type||"text"} value={d[f.k]} onChange={e=>setD(p=>({...p,[f.k]:e.target.value}))} style={inp(T)}/>
          </div>
        ))}
        <button onClick={save} disabled={busy} style={{...btn(T.accent,"#fff"),padding:"12px 28px",borderRadius:10,boxShadow:`0 4px 14px rgba(99,102,241,.3)`,width:"100%",fontSize:14,fontWeight:700}}>
          {busy?"Saving…":"Save Changes"}
        </button>
      </div>
    </div>
  );
}
