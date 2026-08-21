import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signOut, sendPasswordResetEmail,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  getFirestore, collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
  getDoc, getDocs, query, orderBy, limit, where, onSnapshot,
  serverTimestamp, arrayUnion, increment
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/*
  WICHTIG:
  Diese Werte werden nach dem Anlegen deiner Firebase-Web-App aus
  der Firebase Console hier eingesetzt.
*/
const firebaseConfig = {
  apiKey: "AIzaSyAI7xMbH4TqCGh1BJKyRyv_LQtqlsLUDNc",
  authDomain: "campus-klasse.firebaseapp.com",
  projectId: "campus-klasse",
  storageBucket: "campus-klasse.firebasestorage.app",
  messagingSenderId: "164958867141",
  appId: "1:164958867141:web:676ab50f17f8a4b710eaac",
  measurementId: "G-VYLG8YKT9E"
};

const configReady = !Object.values(firebaseConfig).some(v => String(v).includes("HIER_") || String(v).includes("DEIN-PROJEKT"));

let app, auth, db;
if(configReady){
  app=initializeApp(firebaseConfig);
  auth=getAuth(app);
  db=getFirestore(app);
}

const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const statusLabel={green:"Auf Kurs",yellow:"Klärungsbedarf",red:"Handlungsbedarf"};
const labels={question:"❓ Frage",info:"📢 Info",idea:"💡 Idee",project:"🚀 Projekt",practice:"🏢 Praxis"};
let currentUser=null, profile=null, unsubscribers=[];

function toast(t){const x=$("toast");x.textContent=t;x.classList.add("show");clearTimeout(window.tt);window.tt=setTimeout(()=>x.classList.remove("show"),2500)}
function authError(err){
  const map={
    "auth/invalid-credential":"E-Mail oder Passwort ist nicht korrekt.",
    "auth/email-already-in-use":"Für diese E-Mail existiert bereits ein Konto.",
    "auth/weak-password":"Das Passwort muss mindestens 6 Zeichen haben.",
    "auth/invalid-email":"Bitte eine gültige E-Mail-Adresse eingeben.",
    "auth/too-many-requests":"Zu viele Versuche. Bitte später erneut versuchen."
  };
  $("authError").textContent=map[err?.code]||"Anmeldung konnte nicht durchgeführt werden.";
}
function modal(html){$("modal").innerHTML=html;$("modalBackdrop").hidden=false}
function closeModal(){$("modalBackdrop").hidden=true}
function pageHead(k,h,p,actions=""){return `<div class="page-head"><div><div class="kicker">${k}</div><h1>${h}</h1><p>${p}</p></div><div class="actions">${actions}</div></div>`}
function footer(){return `<div class="footer"><span>Campusklasse 26/27 · FOSBOS Weilheim</span><span>Gemeinsam · offen · respektvoll</span></div>`}
function tile(icon,title,text,target){return `<a class="card tile" href="#${target}"><span class="emoji">${icon}</span><strong>${title}</strong><small>${text}</small></a>`}
function statusDot(s){return `<span class="dot ${s}"></span>`}
function isTeacher(){return profile?.role==="teacher"||profile?.role==="admin"}

function showAuth(){
  $("authScreen").hidden=false;$("app").hidden=true;$("logoutBtn").hidden=true;
  $("userName").textContent="";
}
function showApp(){
  $("authScreen").hidden=true;$("app").hidden=false;$("logoutBtn").hidden=false;
  $("userName").textContent=profile?.displayName||currentUser?.email||"Campus";
  render();
}
function clearListeners(){unsubscribers.forEach(u=>u&&u());unsubscribers=[]}

async function ensureProfile(user, displayName=""){
  const ref=doc(db,"users",user.uid), snap=await getDoc(ref);
  if(!snap.exists()){
    await setDoc(ref,{
      uid:user.uid,email:user.email||"",displayName:displayName||user.displayName||"Campus-Mitglied",
      role:"student",createdAt:serverTimestamp()
    });
  }
  const s=await getDoc(ref);profile=s.data();
}

$("loginTab").onclick=()=>{ $("loginTab").classList.add("active");$("registerTab").classList.remove("active");$("loginForm").hidden=false;$("registerForm").hidden=true;$("authError").textContent=""};
$("registerTab").onclick=()=>{ $("registerTab").classList.add("active");$("loginTab").classList.remove("active");$("loginForm").hidden=true;$("registerForm").hidden=false;$("authError").textContent=""};

$("loginForm").addEventListener("submit",async e=>{
 e.preventDefault();$("authError").textContent="";
 if(!configReady){$("authError").textContent="Firebase ist noch nicht konfiguriert. Öffne SETUP-FIREBASE.md.";return}
 try{await signInWithEmailAndPassword(auth,$("loginEmail").value.trim(),$("loginPassword").value)}catch(err){authError(err)}
});
$("registerForm").addEventListener("submit",async e=>{
 e.preventDefault();$("authError").textContent="";
 if($("registerPassword").value!==$("registerPassword2").value){$("authError").textContent="Die Passwörter stimmen nicht überein.";return}
 if(!configReady){$("authError").textContent="Firebase ist noch nicht konfiguriert. Öffne SETUP-FIREBASE.md.";return}
 try{
   const cred=await createUserWithEmailAndPassword(auth,$("registerEmail").value.trim(),$("registerPassword").value);
   await updateProfile(cred.user,{displayName:$("registerName").value.trim()});
   await ensureProfile(cred.user,$("registerName").value.trim());
 }catch(err){authError(err)}
});
$("forgotBtn").onclick=async()=>{
 const email=$("loginEmail").value.trim();
 if(!email){$("authError").textContent="Bitte zuerst deine E-Mail-Adresse eingeben.";return}
 try{await sendPasswordResetEmail(auth,email);toast("E-Mail zum Zurücksetzen wurde versendet.")}catch(err){authError(err)}
};
$("logoutBtn").onclick=()=>signOut(auth);
$("menuBtn").onclick=()=>$("sidebar").classList.toggle("open");
$("helpQuick").onclick=openHelpForm;
$("modalBackdrop").addEventListener("click",e=>{if(e.target.id==="modalBackdrop")closeModal()});

async function getCollection(name,sortField="createdAt",desc=true){
 const q=query(collection(db,name),orderBy(sortField,desc?"desc":"asc"),limit(100));
 const snap=await getDocs(q);return snap.docs.map(d=>({id:d.id,...d.data()}));
}
function fmtDate(v){if(!v)return"—";if(v.seconds)return new Date(v.seconds*1000).toLocaleDateString("de-DE");return String(v)}
function cleanDateInput(v){return v||"—"}

async function renderStart(){
 let tasks=[],projects=[],posts=[],calendar=[];
 try{[tasks,projects,posts,calendar]=await Promise.all([getCollection("tasks","deadline",false),getCollection("projects"),getCollection("posts"),getCollection("calendar","date",false)])}catch(e){}
 const on=tasks.filter(x=>x.status==="green").length;
 return `<section class="hero"><div><span class="badge">🏫 CAMPUSKLASSE 26/27</span><h1>Willkommen auf dem Campus.</h1><p>Hier verbinden wir Lernen, Projekte, Praxis und Gemeinschaft. Alle angemeldeten Mitglieder arbeiten am selben digitalen Campus.</p></div><div class="actions"><button class="primary" onclick="go('kompass')">Mein Kompass →</button><button class="secondary" onclick="go('forum')">Campus-Forum</button></div></section>
 ${pageHead("ÜBERSICHT","Unser Campus","Die wichtigsten Bereiche auf einen Blick.")}
 <div class="grid grid-4">
 ${tile("🧭","Campus-Kompass","Dein persönlicher Lern- und Projektüberblick.","kompass")}
 ${tile("🛠️","Lernwerkstatt","Lernaufträge, Methoden, Tools und KI.","lernwerkstatt")}
 ${tile("💬","Campus-Forum","Austauschen, fragen, helfen und gemeinsam denken.","forum")}
 ${tile("🚀","Projekte","Projektteams, Ziele, Fortschritt und Ergebnisse.","projekte")}
 ${tile("🧩","Kompetenzwerkstatt","Kompetenzen sichtbar machen und entwickeln.","kompetenz")}
 ${tile("📓","Lernjournal","Lernweg, Reflexionen und nächste Schritte.","journal")}
 ${tile("🏢","Praktikum & Praxis","Praxisaufträge und Reflexion.","praktikum")}
 ${tile("🤖","KI-Innovationslabor","KI-Ideen und Innovationspartnerschaften.","ki")}</div>
 <div class="grid grid-3" style="margin-top:12px"><div class="card stat"><b>${tasks.length}</b><span>Arbeitspakete</span></div><div class="card stat"><b>${on}</b><span>auf Kurs</span></div><div class="card stat"><b>${currentUser?1:0}</b><span>dein Zugang ist aktiv</span></div></div>
 <div class="grid grid-2" style="margin-top:12px">
 <div class="card"><h3>📢 Campus-News</h3><div class="list">${posts.filter(p=>p.type==="info").slice(0,3).map(p=>`<div class="list-item"><div><strong>${esc(p.text)}</strong><small>${fmtDate(p.createdAt)}</small></div><span class="pill">Info</span></div>`).join("")||`<div class="empty">Noch keine News.</div>`}</div></div>
 <div class="card"><h3>🗓️ Nächste Termine</h3><div class="list">${calendar.slice(0,3).map(c=>`<div class="list-item"><div><strong>${esc(c.title)}</strong><small>${esc(c.date)}</small></div><span class="pill green">Termin</span></div>`).join("")||`<div class="empty">Noch keine Termine.</div>`}</div></div></div>${footer()}`;
}

async function renderKompass(){
 const tasks=await getCollection("tasks","deadline",false), projects=await getCollection("projects");
 return `${pageHead("PERSÖNLICH","Mein Campus-Kompass","Dein persönlicher Überblick über Aufgaben, Projekte, Ziele und Lernweg.",`<button class="primary" onclick="openTaskForm()">＋ Aufgabe</button>`)}
 <div class="grid grid-3"><div class="card stat"><b>${tasks.filter(t=>t.ownerUid===currentUser.uid).length}</b><span>Meine Aufgaben</span></div><div class="card stat"><b>${projects.length}</b><span>Projekte</span></div><div class="card stat"><b>${profile?.role==="teacher"?"Lehrkraft":profile?.role==="admin"?"Admin":"Schüler/in"}</b><span>Rolle</span></div></div>
 <div class="card" style="margin-top:12px"><h3>☑️ Meine Aufgaben</h3><div class="list">${tasks.filter(t=>t.ownerUid===currentUser.uid).map(taskHTML).join("")||`<div class="empty"><strong>Noch keine Aufgaben</strong>Lege deine erste Aufgabe an.</div>`}</div></div>
 <div class="card" style="margin-top:12px"><h3>🚀 Aktuelle Projekte</h3><div class="list">${projects.map(p=>`<div class="list-item"><div><strong>${esc(p.title)}</strong><br><small>${esc(p.team||"")} · ${esc(p.partner||"")}</small></div><span class="pill">${Number(p.progress||0)}%</span></div>`).join("")||`<div class="empty">Noch keine Projekte.</div>`}</div></div>${footer()}`;
}
function taskHTML(t){return `<div class="list-item"><div><strong>${esc(t.title)}</strong><small>Verantwortlich: ${esc(t.ownerName||"")} · Deadline: ${esc(t.deadline||"—")} · Nächster Schritt: ${esc(t.next||"—")}</small></div><div class="traffic">${statusDot(t.status)}<span class="pill">${statusLabel[t.status]||"—"}</span></div></div>`}

async function renderLernwerkstatt(){
 const resources=[["🔎","Lernaufträge","Selbstständig starten: recherchieren, verstehen, anwenden."],["🧠","Lernimpulse","Kurze Impulse für Reflexion, Methoden und Deeper Learning."],["📚","Materialien","Arbeitsblätter, Vorlagen und hilfreiche Quellen."],["🛠️","Methoden","Planung, Teamarbeit, Präsentation und Reflexion."],["💻","Digitale Tools","Werkzeuge für Zusammenarbeit, Gestaltung und Organisation."],["🤖","KI zum Lernen","KI bewusst, kritisch und produktiv einsetzen."],["❓","Fragen & Hilfe","Wenn du nicht weiterkommst: fragen und teilen."],["⭐","Best Practice","Gute Lösungen aus der Campusklasse sichtbar machen."]];
 return `${pageHead("SELBSTSTÄNDIG LERNEN","Lernwerkstatt","Der offene Lernraum für Lernaufträge, Methoden, digitale Werkzeuge und eigene Lernwege.",`<button class="primary" onclick="openPostForm('idea')">＋ Lernimpuls</button>`)}
 <div class="grid grid-4">${resources.map(x=>`<div class="card tile"><span class="emoji">${x[0]}</span><strong>${x[1]}</strong><small>${x[2]}</small></div>`).join("")}</div>
 <div class="grid grid-2" style="margin-top:12px"><div class="card"><h3>🧭 So kann ich starten</h3><div class="list">${["Ich möchte etwas verstehen","Ich möchte recherchieren","Ich möchte etwas ausprobieren","Ich möchte etwas gestalten","Ich möchte ein Problem lösen","Ich möchte mich vorbereiten"].map(x=>`<div class="list-item"><strong>${x}</strong><span class="pill">Lernen</span></div>`).join("")}</div></div><div class="card"><h3>🤖 KI-Lernimpuls</h3><p>Nutze KI nicht nur für fertige Antworten. Bitte sie zum Beispiel, dir Fragen zu stellen, einen Lösungsweg zu prüfen oder Gegenargumente zu entwickeln.</p><div class="chips" style="margin-top:12px"><span class="chip">Erklären</span><span class="chip">Fragen</span><span class="chip">Feedback</span><span class="chip">Perspektiven</span></div></div></div>${footer()}`;
}

async function renderForum(){
 const posts=await getCollection("posts");
 return `${pageHead("GEMEINSCHAFT","Campus-Forum","Gemeinsam denken, fragen, austauschen und unterstützen.",`<button class="primary" onclick="openPostForm()">＋ Beitrag schreiben</button>`)}
 <div class="toolbar"><div class="chips"><span class="chip">Alle</span><span class="chip">❓ Fragen</span><span class="chip">📢 Infos</span><span class="chip">💡 Ideen</span><span class="chip">🚀 Projekte</span><span class="chip">🏢 Praxis</span></div><input class="search" id="forumSearch" placeholder="Beiträge durchsuchen …"></div>
 <div class="list" id="forumList">${posts.map(postHTML).join("")||`<div class="empty"><strong>Noch keine Beiträge</strong>Schreibe den ersten Beitrag.</div>`}</div>
 <div class="card" style="margin-top:12px;background:var(--soft-green)"><h3>🤝 Campus hilft</h3><p>Du kannst anderen bei einem Thema helfen? Teile dein Wissen.</p><button class="secondary" style="margin-top:10px" onclick="openHelpForm()">Hilfe anbieten</button></div>${footer()}`;
}
function postHTML(p){const comments=Array.isArray(p.comments)?p.comments:[];return `<article class="forum-post"><div class="post-head"><div class="avatar">${p.authorUid===currentUser.uid?"👤":"🏫"}</div><div class="post-meta"><strong>${esc(p.authorName||"Campus-Mitglied")}</strong><small>${fmtDate(p.createdAt)}</small></div><span class="pill">${labels[p.type]||p.type||"Beitrag"}</span></div><div class="post-body">${esc(p.text)}</div><div class="post-actions"><button onclick="likePost('${p.id}')">♡ Gefällt mir (${Number(p.likes||0)})</button><button onclick="focusComment('${p.id}')">💬 Antworten (${comments.length})</button>${(p.authorUid===currentUser.uid||isTeacher())?`<button onclick="deletePost('${p.id}')">Löschen</button>`:""}</div><div class="comments">${comments.map(c=>`<div class="comment"><b>${esc(c.name)}:</b> ${esc(c.text)}</div>`).join("")}<div class="comment-box"><input id="comment-${p.id}" placeholder="Antwort schreiben …"><button onclick="commentPost('${p.id}')">Senden</button></div></div></article>`}

async function renderProjekte(){
 const projects=await getCollection("projects");
 return `${pageHead("DEEPER LEARNING","Projekte","Projektideen, Teams, Ziele, Fortschritt und Ergebnisse.",`<button class="primary" onclick="openProjectForm()">＋ Projekt</button>`)}
 <div class="grid grid-3">${projects.map(p=>`<div class="card"><div class="status-card">${statusDot(p.status||"green")}<div><h3>${esc(p.title)}</h3><p>${esc(p.goal||"")}</p></div></div><div style="margin-top:12px"><div style="display:flex;justify-content:space-between;font-size:9px;color:var(--muted);margin-bottom:5px"><span>${esc(p.team||"")} · ${esc(p.partner||"")}</span><b>${Number(p.progress||0)}%</b></div><div class="progress"><i style="width:${Number(p.progress||0)}%"></i></div></div></div>`).join("")||`<div class="empty">Noch keine Projekte.</div>`}</div>${footer()}`;
}
async function renderKompetenz(){
  let data=[];
  try{
    const snap=await getDocs(query(collection(db,"competencies"),where("uid","==",currentUser.uid)));
    data=snap.docs.map(d=>({id:d.id,...d.data()}));
  }catch(e){console.error("Kompetenzwerkstatt:",e)}

  const avg=data.length ? Math.round(data.reduce((s,c)=>s+Number(c.value||0),0)/data.length*10)/10 : 0;
  const secure=data.filter(c=>Number(c.value||0)>=7).length;
  const develop=data.filter(c=>Number(c.value||0)>=4 && Number(c.value||0)<7).length;
  const support=data.filter(c=>Number(c.value||0)<4).length;

  const competencyRows=data.map(c=>`
    <article class="card competence-item">
      <div class="competence-head">
        <div>
          <div class="kicker">${esc(c.category||"Kompetenz")}</div>
          <h3>${esc(c.name)}</h3>
        </div>
        <span class="pill">${Number(c.value||0)}/10</span>
      </div>
      <div class="competence-bar"><i style="width:${Math.max(0,Math.min(100,Number(c.value||0)*10))}%"></i></div>
      <div class="competence-meta">
        <span>${Number(c.value||0)>=7?"🟢 sicher":Number(c.value||0)>=4?"🟡 im Aufbau":"🔴 Unterstützungsbedarf"}</span>
        ${c.target?`<span>Ziel: ${esc(c.target)}/10</span>`:""}
      </div>
      ${c.nextStep?`<p class="competence-next"><strong>Nächster Schritt:</strong> ${esc(c.nextStep)}</p>`:""}
    </article>`).join("");

  return `${pageHead("ENTWICKLUNG","Kompetenzwerkstatt","Kompetenzen sichtbar machen, Selbsteinschätzung durchführen, Ziele setzen und den nächsten Lernschritt planen.",
    `<button class="primary" onclick="window.openCompetenceForm()">＋ Kompetenz</button>`)}
  <style>
    .competence-intro{display:grid;grid-template-columns:1.3fr .7fr;gap:16px}
    .competence-raster{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:14px}
    .raster-level{padding:14px;border:1px solid var(--line,#dfe8ef);border-radius:12px;background:#fff}
    .raster-level strong{display:block;margin-bottom:5px}
    .competence-item{padding:18px}

    .teacher-class-overview{border:1px solid #d7e7f2}
    .teacher-overview-head{display:flex;justify-content:space-between;gap:20px;align-items:center}
    .class-student-list{display:grid;gap:8px}
    .class-student-row{display:grid;grid-template-columns:minmax(180px,1.5fr) 90px minmax(170px,1fr) auto;gap:12px;align-items:center;padding:12px 14px;border:1px solid var(--line,#e1e8ee);border-radius:10px;background:#fff}
    .class-student-name small{display:block;color:var(--muted);margin-top:3px}
    .class-student-stat{font-weight:700}
    .class-student-badges{display:flex;gap:5px;flex-wrap:wrap}
    .class-legend{display:flex;gap:14px;flex-wrap:wrap;margin:10px 0 14px;font-size:13px;color:var(--muted)}
    @media(max-width:700px){
      .teacher-overview-head{align-items:flex-start;flex-direction:column}
      .class-student-row{grid-template-columns:1fr auto}
      .class-student-stat{grid-column:2;grid-row:1}
      .class-student-badges{grid-column:1 / -1}
      .class-student-row button{grid-column:1 / -1;width:100%}
    }

    .competence-head{display:flex;justify-content:space-between;gap:15px;align-items:flex-start}
    .competence-head h3{margin:4px 0 0}
    .competence-bar{height:9px;background:#edf2f5;border-radius:99px;overflow:hidden;margin:14px 0 8px}
    .competence-bar i{display:block;height:100%;background:#1687d8;border-radius:99px}
    .competence-meta{display:flex;justify-content:space-between;font-size:13px;color:var(--muted);gap:10px}
    .competence-next{margin:12px 0 0;padding-top:10px;border-top:1px solid var(--line,#edf0f2)}
    @media(max-width:800px){.competence-intro{grid-template-columns:1fr}.competence-raster{grid-template-columns:1fr 1fr}}
    @media(max-width:520px){.competence-raster{grid-template-columns:1fr}}
  </style>

  <div class="competence-intro">
    <div class="card">
      <div class="kicker">MEIN KOMPETENZPROFIL</div>
      <h2>🎯 Wo stehe ich?</h2>
      <p>Schätze dich selbst ein, erkenne deine Stärken und lege fest, woran du als Nächstes arbeiten möchtest.</p>
      <div class="competence-raster">
        <div class="raster-level"><strong>0–3</strong>🔴 Grundlage fehlt<br><small>Unterstützung nötig</small></div>
        <div class="raster-level"><strong>4–6</strong>🟡 im Aufbau<br><small>Üben und anwenden</small></div>
        <div class="raster-level"><strong>7–8</strong>🟢 sicher<br><small>selbstständig anwenden</small></div>
        <div class="raster-level"><strong>9–10</strong>⭐ sehr sicher<br><small>erklären & übertragen</small></div>
      </div>
    </div>
    <div class="card">
      <div class="kicker">360°-ÜBERBLICK</div>
      <div class="stat"><b>${avg}</b><span>Ø Kompetenzstand</span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:12px">
        <div class="pill">🟢 ${secure} sicher</div>
        <div class="pill">🟡 ${develop} Aufbau</div>
        <div class="pill">🔴 ${support} Hilfe</div>
      </div>
    </div>
  </div>

  <div class="card" style="margin-top:14px">
    <div class="kicker">KOMPETENZRASTER</div>
    <h2>Meine Kompetenzen</h2>
    <p style="margin-top:-4px">Die Kompetenzwerkstatt verbindet Selbsteinschätzung, konkrete Lernprodukte, Feedback und den nächsten Lernschritt.</p>
    <div class="grid grid-2" style="margin-top:12px">
      ${competencyRows || `<div class="empty"><strong>Noch kein Kompetenzprofil</strong><br>Lege deine erste Kompetenz an und schätze deinen aktuellen Stand ein.</div>`}
    </div>
  </div>

  <div class="grid grid-3" style="margin-top:14px">
    <div class="card"><h3>🧩 Aufgaben analysieren</h3><p>Aufgabenstellung und Operatoren erfassen und in konkrete Arbeitsschritte übersetzen.</p></div>
    <div class="card"><h3>🔗 Wissen anwenden</h3><p>Fachwissen auswählen, Fachbegriffe sicher verwenden und Theorie mit Anwendung verbinden.</p></div>
    <div class="card"><h3>✍️ Fachlich schreiben</h3><p>Zusammenhänge erläutern, Texte strukturieren, Feedback nutzen und gezielt überarbeiten.</p></div>
  </div>

  ${isTeacher() ? `
  <div class="card teacher-class-overview" style="margin-top:14px">
    <div class="teacher-overview-head">
      <div>
        <div class="kicker">LEHRKRAFT · KLASSENEBENE</div>
        <h2>👩‍🏫 Kompetenzübersicht der ganzen Klasse</h2>
        <p>Alle Schüler:innen auf einen Blick: Kompetenzstände, Entwicklungsfelder und Unterstützungsbedarf.</p>
      </div>
      <button class="secondary" onclick="window.openClassCompetenceOverview()">Klassenübersicht öffnen</button>
    </div>
  </div>` : ""}

  <div class="card" style="margin-top:14px">
    <div class="kicker">MEIN NÄCHSTER LERNSCHRITT</div>
    <h2>Stärke → Entwicklungsziel → Übung</h2>
    <p>Nutze deine Selbsteinschätzung, um nicht nur zu sehen, wo du stehst, sondern was du als Nächstes konkret tun kannst.</p>
  </div>${footer()}`;
}

function openCompetenceForm(){
  modal(`<button type="button" class="modal-close" onclick="closeModal()">×</button>
    <div class="kicker">KOMPETENZWERKSTATT</div>
    <h2>🎯 Kompetenz anlegen</h2>
    <div class="form">
      <label>Kompetenz
        <input id="cName" placeholder="z. B. Fachbegriffe korrekt verwenden">
      </label>
      <label>Bereich
        <select id="cCategory">
          <option>Aufgabenanalyse & Operatoren</option>
          <option>Fachwissen & Fachsprache</option>
          <option>Theorie & Anwendung</option>
          <option>Transfer & Problemlösen</option>
          <option>Schreiben & Strukturieren</option>
          <option>Feedback & Überarbeitung</option>
          <option>Selbststeuerung & Lernorganisation</option>
        </select>
      </label>
      <label>Aktueller Stand: <span id="cValueOut">5</span>/10
        <input id="cValue" type="range" min="0" max="10" value="5"
          oninput="document.getElementById('cValueOut').textContent=this.value">
      </label>
      <label>Zielwert: <span id="cTargetOut">8</span>/10
        <input id="cTarget" type="range" min="0" max="10" value="8"
          oninput="document.getElementById('cTargetOut').textContent=this.value">
      </label>
      <label>Woran merke ich, dass ich die Kompetenz sicherer beherrsche?
        <textarea id="cEvidence" rows="3" placeholder="z. B. Ich kann …"></textarea>
      </label>
      <label>Mein nächster konkreter Lernschritt
        <textarea id="cNext" rows="3" placeholder="z. B. Ich übe …"></textarea>
      </label>
      <div class="form-actions">
        <button type="button" class="secondary" onclick="closeModal()">Abbrechen</button>
        <button type="button" class="primary" onclick="window.addCompetence()">Speichern</button>
      </div>
    </div>`);
}

async function addCompetence(){
  const name=$("cName")?.value.trim()||"Neue Kompetenz";
  const value=Math.max(0,Math.min(10,Number($("cValue")?.value)||0));
  const target=Math.max(0,Math.min(10,Number($("cTarget")?.value)||0));
  try{
    await addDoc(collection(db,"competencies"),{
      uid:currentUser.uid,name,
      category:$("cCategory")?.value||"Kompetenz",
      value,target,
      evidence:$("cEvidence")?.value.trim()||"",
      nextStep:$("cNext")?.value.trim()||"",
      createdAt:serverTimestamp(),
      updatedAt:serverTimestamp()
    });
    closeModal();await render();toast("Kompetenz gespeichert.");
  }catch(e){console.error("Kompetenz:",e);toast("Kompetenz konnte nicht gespeichert werden.")}
}


async function openClassCompetenceOverview(){
  if(!isTeacher()){toast("Dieser Bereich ist nur für Lehrkräfte.");return}
  try{
    const [userSnap, compSnap] = await Promise.all([
      getDocs(query(collection(db,"users"),where("role","==","student"))),
      getDocs(query(collection(db,"competencies"),limit(2000)))
    ]);

    const students = userSnap.docs.map(d=>({id:d.id,...d.data()}))
      .sort((a,b)=>(a.displayName||a.email||"").localeCompare(b.displayName||b.email||"","de"));
    const comps = compSnap.docs.map(d=>({id:d.id,...d.data()}));

    const byStudent={};
    comps.forEach(c=>{
      if(!c.uid)return;
      (byStudent[c.uid] ||= []).push(c);
    });

    const categories=[...new Set(comps.map(c=>c.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"de"));

    const rows=students.map(s=>{
      const mine=byStudent[s.id]||[];
      const avg=mine.length ? Math.round(mine.reduce((sum,c)=>sum+Number(c.value||0),0)/mine.length*10)/10 : null;
      const support=mine.filter(c=>Number(c.value||0)<4).length;
      const build=mine.filter(c=>Number(c.value||0)>=4 && Number(c.value||0)<7).length;
      const secure=mine.filter(c=>Number(c.value||0)>=7).length;
      return `<div class="class-student-row" data-categories="${esc([...new Set(mine.map(c=>c.category).filter(Boolean))].join("||"))}">
        <div class="class-student-name"><strong>${esc(s.displayName||s.email||"Unbekannt")}</strong><small>${mine.length} Kompetenzen</small></div>
        <div class="class-student-stat">${avg===null?"–":avg+"/10"}</div>
        <div class="class-student-badges">
          <span class="pill">🟢 ${secure}</span>
          <span class="pill">🟡 ${build}</span>
          <span class="pill">🔴 ${support}</span>
        </div>
        <button class="secondary" onclick="window.openStudentCompetence('${esc(s.id)}','${esc(s.displayName||s.email||"Schüler/in")}')">Details</button>
      </div>`;
    }).join("");

    const classAvg=(()=>{
      const values=comps.map(c=>Number(c.value)).filter(v=>Number.isFinite(v));
      return values.length ? Math.round(values.reduce((a,b)=>a+b,0)/values.length*10)/10 : 0;
    })();

    modal(`
      <button class="modal-close" onclick="closeModal()">×</button>
      <div class="kicker">LEHRKRAFT · KOMPETENZWERKSTATT</div>
      <h2>Klassenübersicht</h2>
      <p>Die Übersicht zeigt die Kompetenzentwicklung der gesamten Klasse. Die individuellen Details sind nur für Lehrkräfte sichtbar.</p>

      <div class="grid grid-3" style="margin:14px 0">
        <div class="card stat"><b>${students.length}</b><span>Schüler:innen</span></div>
        <div class="card stat"><b>${comps.length}</b><span>Kompetenzeinträge</span></div>
        <div class="card stat"><b>${classAvg}</b><span>Ø Kompetenzstand</span></div>
      </div>

      <label style="display:block;margin-bottom:12px">Kompetenzbereich
        <select id="classCompetenceCategory" onchange="window.filterClassCompetence()">
          <option value="">Alle Bereiche</option>
          ${categories.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("")}
        </select>
      </label>

      <div class="class-legend">
        <span>🟢 sicher (7–10)</span>
        <span>🟡 im Aufbau (4–6)</span>
        <span>🔴 Unterstützungsbedarf (0–3)</span>
      </div>

      <div class="class-student-list" id="classStudentList">
        ${rows || `<div class="empty">Noch keine Schüler:innen bzw. Kompetenzdaten vorhanden.</div>`}
      </div>

      <div class="notice" style="margin-top:14px">
        <b>Hinweis:</b> Die Klassenübersicht dient der Lernbegleitung und Förderplanung. Sie ersetzt keine pädagogische Gesamtbeurteilung.
      </div>
    `);
  }catch(e){
    console.error("Klassen-Kompetenzübersicht:",e);
    modal(`<button class="modal-close" onclick="closeModal()">×</button>
      <div class="kicker">LEHRKRAFT</div><h2>Klassenübersicht</h2>
      <div class="notice"><b>Die Übersicht konnte nicht geladen werden.</b><br>
      Prüfe die Firestore-Regeln für die Sammlungen <code>users</code> und <code>competencies</code>.</div>`);
  }
}

async function openStudentCompetence(uid,name){
  if(!isTeacher()){toast("Dieser Bereich ist nur für Lehrkräfte.");return}
  try{
    const snap=await getDocs(query(collection(db,"competencies"),where("uid","==",uid),limit(200)));
    const data=snap.docs.map(d=>({id:d.id,...d.data()}))
      .sort((a,b)=>Number(b.value||0)-Number(a.value||0));

    modal(`
      <button class="modal-close" onclick="window.openClassCompetenceOverview()">×</button>
      <div class="kicker">LEHRKRAFT · INDIVIDUELL</div>
      <h2>${esc(name)}</h2>
      <p>Kompetenzprofil und nächste Entwicklungsfelder.</p>
      <div class="grid grid-2" style="margin-top:12px">
        ${data.map(c=>`
          <article class="card">
            <div class="kicker">${esc(c.category||"Kompetenz")}</div>
            <h3>${esc(c.name)}</h3>
            <div class="competence-bar"><i style="width:${Math.max(0,Math.min(100,Number(c.value||0)*10))}%"></i></div>
            <div class="competence-meta"><span>${Number(c.value||0)}/10</span><span>Ziel ${Number(c.target||0)}/10</span></div>
            ${c.nextStep?`<p><strong>Nächster Schritt:</strong> ${esc(c.nextStep)}</p>`:""}
          </article>`).join("") || `<div class="empty">Noch keine Kompetenzen eingetragen.</div>`}
      </div>
    `);
  }catch(e){console.error(e);toast("Kompetenzprofil konnte nicht geladen werden.")}
}

function filterClassCompetence(){
  const category=$("classCompetenceCategory")?.value||"";
  document.querySelectorAll(".class-student-row").forEach(row=>{
    if(!category){row.hidden=false;return}
    const values=(row.dataset.categories||"").split("||");
    row.hidden=!values.includes(category);
  });
}

async function renderJournal(){
 const q=query(collection(db,"journal"),where("uid","==",currentUser.uid),orderBy("createdAt","desc"),limit(50));
 const snap=await getDocs(q), data=snap.docs.map(d=>({id:d.id,...d.data()}));
 return `${pageHead("REFLEXION","Lernjournal","Dein Lernweg, Reflexionen und nächste Schritte.",`<button class="primary" onclick="openJournalForm()">＋ Eintrag</button>`)}
 <div class="list">${data.map(j=>`<article class="card"><div style="display:flex;justify-content:space-between"><div><span class="pill">${fmtDate(j.createdAt)}</span><h3 style="margin-top:9px">${esc(j.title)}</h3></div><span style="font-size:25px">${esc(j.mood||"🙂")}</span></div><p>${esc(j.text)}</p></article>`).join("")||`<div class="empty"><strong>Noch kein Eintrag</strong>Starte mit einer kurzen Reflexion.</div>`}</div>${footer()}`;
}
async function renderPraktikum(){
 const data=await getCollection("practice","createdAt",true);
 return `${pageHead("SCHULE ↔ PRAXIS","Praktikum & Praxis","Praxisaufträge, Beobachtungen und Reflexionen verbinden Schule und Praktikumsbetrieb.",`<button class="primary" onclick="openPracticeForm()">＋ Praxisauftrag</button>`)}
 <div class="grid grid-2">${data.map(p=>`<div class="card"><span class="pill ${p.state==="offen"?"orange":"green"}">${esc(p.state||"geplant")}</span><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p><small style="display:block;color:var(--muted);margin-top:9px">${esc(p.date||"")}</small></div>`).join("")||`<div class="empty">Noch keine Praxisaufträge.</div>`}</div>
 <div class="card" style="margin-top:12px"><h3>🤝 Praxispartner</h3><p>Praktikum ist Lern- und Innovationsraum: Beobachtungen aus der Praxis können zu Fragen, Projekten und KI-Innovationspartnerschaften werden.</p></div>${footer()}`;
}
async function renderKI(){
 return `${pageHead("INNOVATION","KI-Innovationslabor","KI verantwortungsvoll erproben und gemeinsam mit Praxispartnern Lösungen entwickeln.",`<button class="primary" onclick="openPostForm('idea')">＋ KI-Idee</button>`)}
 <div class="grid grid-3">${[["🔍","KI beobachten","Welche Aufgabe in der Praxis könnte durch KI unterstützt werden?"],["🧪","KI erproben","Eine kleine Idee mit klarer Fragestellung ausprobieren."],["🤝","Innovationspartnerschaft","Ergebnis gemeinsam mit dem Praxispartner prüfen und weiterentwickeln."]].map(x=>`<div class="card tile"><span class="emoji">${x[0]}</span><strong>${x[1]}</strong><small>${x[2]}</small></div>`).join("")}</div>
 <div class="card" style="margin-top:12px"><h3>⚖️ KI-Kompass</h3><div class="chips" style="margin-top:9px"><span class="chip">Transparenz</span><span class="chip">Datenschutz</span><span class="chip">Quellen prüfen</span><span class="chip">Eigenleistung</span><span class="chip">Bias reflektieren</span><span class="chip">Ergebnisse validieren</span></div></div>${footer()}`;
}
async function renderKalender(){
 const data=await getCollection("calendar","date",false);
 return `${pageHead("ORGANISATION","Campus-Kalender","Gemeinsame Termine, Meilensteine und Präsentationen.",`<button class="primary" onclick="openCalendarForm()">＋ Termin</button>`)}
 <div class="list">${data.map(c=>`<div class="list-item"><div><strong>${esc(c.title)}</strong><small>${esc(c.date||"")}</small></div><span class="pill green">Termin</span></div>`).join("")||`<div class="empty">Noch keine Termine.</div>`}</div>${footer()}`;
}
async function renderTeam(){
 const tasks=await getCollection("tasks","deadline",false);
 return `${pageHead("TEAM & SCHULENTWICKLUNG","Klassenteam","Arbeitsorganisation für die Campusklasse und gemeinsame Schulentwicklung.",`<button class="primary" onclick="openTaskForm()">＋ Arbeitspaket</button>`)}
 <div class="grid grid-3">${["green","yellow","red"].map((s,i)=>`<div class="card"><div class="status-card">${statusDot(s)}<div><h3>${statusLabel[s]}</h3><p>${tasks.filter(t=>t.status===s).length} Arbeitspakete</p></div></div></div>`).join("")}</div>
 <div class="card" style="margin-top:12px"><h3>📋 Arbeitspakete</h3><div class="list">${tasks.map(taskHTML).join("")||`<div class="empty">Noch keine Arbeitspakete.</div>`}</div></div>
 <div class="notice" style="margin-top:12px"><b>Ampel:</b> <b>Auf Kurs</b> = planmäßig · <b>Klärungsbedarf</b> = Abstimmung/Entscheidung nötig · <b>Handlungsbedarf</b> = aktives Eingreifen erforderlich.</div>${footer()}`;
}

async function render(){
 if(!currentUser)return;
 const p=location.hash.replace("#","")||"start";
 const pages={start:renderStart,kompass:renderKompass,lernwerkstatt:renderLernwerkstatt,forum:renderForum,projekte:renderProjekte,kompetenz:renderKompetenz,journal:renderJournal,praktikum:renderPraktikum,ki:renderKI,kalender:renderKalender,team:renderTeam};
 const fn=pages[p]||renderStart;
 document.querySelectorAll(".nav-link").forEach(a=>a.classList.toggle("active",a.dataset.page===p));
 try{$("content").innerHTML=await fn()}catch(e){console.error(e);$("content").innerHTML=`<div class="card"><h3>Die Seite konnte nicht geladen werden.</h3><p>Bitte prüfe die Firestore-Sicherheitsregeln und die Browser-Konsole.</p></div>`}
 $("sidebar").classList.remove("open");
}
window.addEventListener("hashchange",render);
window.go=p=>{location.hash=p};

function openTaskForm(){
 modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">CAMPUS-KOMPASS</div><h2>Neue Aufgabe</h2><div class="form"><label>Aufgabe<input id="fTitle" placeholder="Was soll erledigt werden?" required></label><label>Verantwortlich<input id="fOwner" placeholder="Name"></label><label>Deadline<input id="fDeadline" type="date"></label><label>Status<select id="fStatus"><option value="green">Auf Kurs</option><option value="yellow">Klärungsbedarf</option><option value="red">Handlungsbedarf</option></select></label><label>Nächste Schritte<textarea id="fNext" rows="3"></textarea></label><div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="addTask()">Speichern</button></div></div>`);
}
async function addTask(){
 try{await addDoc(collection(db,"tasks"),{title:$("fTitle").value.trim()||"Neue Aufgabe",ownerName:$("fOwner").value.trim()||profile.displayName,ownerUid:currentUser.uid,deadline:cleanDateInput($("fDeadline").value),status:$("fStatus").value,next:$("fNext").value.trim()||"Nächsten Schritt festlegen",createdBy:currentUser.uid,createdAt:serverTimestamp()});closeModal();await render();toast("Aufgabe gespeichert.")}catch(e){toast("Speichern nicht möglich.");console.error(e)}
}
function openPostForm(defaultType="question"){
 modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">CAMPUS-FORUM</div><h2>Beitrag schreiben</h2><div class="form"><label>Kategorie<select id="pType"><option value="question" ${defaultType==="question"?"selected":""}>❓ Frage</option><option value="info" ${defaultType==="info"?"selected":""}>📢 Info</option><option value="idea" ${defaultType==="idea"?"selected":""}>💡 Idee</option><option value="project">🚀 Projekt</option><option value="practice">🏢 Praxis</option></select></label><label>Beitrag<textarea id="pText" rows="5" placeholder="Was möchtest du teilen?" required></textarea></label><div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="addPost()">Veröffentlichen</button></div></div>`);
}
async function addPost(){
 const text=$("pText").value.trim();if(!text){toast("Bitte Beitrag eingeben.");return}
 try{await addDoc(collection(db,"posts"),{authorUid:currentUser.uid,authorName:profile.displayName,type:$("pType").value,text,likes:0,comments:[],createdAt:serverTimestamp()});closeModal();await render();toast("Beitrag veröffentlicht.")}catch(e){toast("Beitrag konnte nicht gespeichert werden.");console.error(e)}
}
async function likePost(id){try{await updateDoc(doc(db,"posts",id),{likes:increment(1)}) ;await render()}catch(e){toast("Aktion nicht möglich.")}}
async function commentPost(id){
 const input=$("comment-"+id), text=input.value.trim();if(!text)return;
 try{await updateDoc(doc(db,"posts",id),{comments:arrayUnion({uid:currentUser.uid,name:profile.displayName,text,createdAt:new Date().toISOString()})});await render()}catch(e){toast("Antwort konnte nicht gespeichert werden.")}
}
function focusComment(id){setTimeout(()=>{const e=$("comment-"+id);if(e){e.focus();e.scrollIntoView({behavior:"smooth",block:"center"});}},80)}
async function deletePost(id){if(!confirm("Beitrag wirklich löschen?"))return;try{await deleteDoc(doc(db,"posts",id));await render()}catch(e){toast("Löschen nicht erlaubt.")}}
function openHelpForm(){openPostForm("idea")}
function openProjectForm(){
 modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">PROJEKTE</div><h2>Projekt anlegen</h2><div class="form"><label>Projektname<input id="xTitle"></label><label>Team<input id="xTeam"></label><label>Praxispartner<input id="xPartner"></label><label>Ziel<textarea id="xGoal" rows="3"></textarea></label><label>Fortschritt (0–100)<input id="xProgress" type="number" min="0" max="100" value="0"></label><div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="addProject()">Speichern</button></div></div>`);
}
async function addProject(){try{await addDoc(collection(db,"projects"),{title:$("xTitle").value.trim()||"Neues Projekt",team:$("xTeam").value.trim()||"Team",partner:$("xPartner").value.trim()||"—",progress:Math.max(0,Math.min(100,Number($("xProgress").value)||0)),status:"green",goal:$("xGoal").value.trim()||"Ziel ergänzen",createdBy:currentUser.uid,createdAt:serverTimestamp()});closeModal();await render();toast("Projekt angelegt.")}catch(e){toast("Projekt konnte nicht angelegt werden.")}}
function openJournalForm(){modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">LERNJOURNAL</div><h2>Neuer Reflexionseintrag</h2><div class="form"><label>Titel<input id="jTitle"></label><label>Reflexion<textarea id="jText" rows="5"></textarea></label><label>Stimmung<select id="jMood"><option>🙂</option><option>😃</option><option>🤔</option><option>😐</option><option>😕</option></select></label><div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="addJournal()">Speichern</button></div></div>`)}
async function addJournal(){try{await addDoc(collection(db,"journal"),{uid:currentUser.uid,title:$("jTitle").value.trim()||"Reflexion",text:$("jText").value.trim()||"—",mood:$("jMood").value,createdAt:serverTimestamp()});closeModal();await render();toast("Journal gespeichert.")}catch(e){toast("Journal konnte nicht gespeichert werden.")}}
function openCompetenceForm(){modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">KOMPETENZWERKSTATT</div><h2>Kompetenz ergänzen</h2><div class="form"><label>Kompetenz<input id="cName"></label><label>Aktueller Stand (0–10)<input id="cValue" type="number" min="0" max="10" value="5"></label><div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="addCompetence()">Speichern</button></div></div>`)}
async function addCompetence(){try{await addDoc(collection(db,"competencies"),{uid:currentUser.uid,name:$("cName").value.trim()||"Neue Kompetenz",value:Math.max(0,Math.min(10,Number($("cValue").value)||0)),createdAt:serverTimestamp()});closeModal();await render();toast("Kompetenz gespeichert.")}catch(e){toast("Kompetenz konnte nicht gespeichert werden.")}}
function openPracticeForm(){modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">PRAXIS</div><h2>Praxisauftrag</h2><div class="form"><label>Titel<input id="rTitle"></label><label>Datum<input id="rDate" type="date"></label><label>Beschreibung<textarea id="rText" rows="4"></textarea></label><div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="addPractice()">Speichern</button></div></div>`)}
async function addPractice(){try{await addDoc(collection(db,"practice"),{title:$("rTitle").value.trim()||"Praxisauftrag",date:cleanDateInput($("rDate").value),state:"offen",text:$("rText").value.trim()||"Beschreibung ergänzen",createdBy:currentUser.uid,createdAt:serverTimestamp()});closeModal();await render();toast("Praxisauftrag gespeichert.")}catch(e){toast("Praxisauftrag konnte nicht gespeichert werden.")}}
function openCalendarForm(){modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">CAMPUS-KALENDER</div><h2>Termin ergänzen</h2><div class="form"><label>Titel<input id="calTitle"></label><label>Datum<input id="calDate" type="date"></label><div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="addCalendar()">Speichern</button></div></div>`)}
async function addCalendar(){try{await addDoc(collection(db,"calendar"),{title:$("calTitle").value.trim()||"Termin",date:cleanDateInput($("calDate").value),createdBy:currentUser.uid,createdAt:serverTimestamp()});closeModal();await render();toast("Termin gespeichert.")}catch(e){toast("Termin konnte nicht gespeichert werden.")}}

async function init(){
 if(!configReady){showAuth();$("authError").textContent="Die Firebase-Konfiguration fehlt noch. Bitte SETUP-FIREBASE.md durchführen.";return}
 onAuthStateChanged(auth,async user=>{
   clearListeners();currentUser=user;
   if(!user){profile=null;showAuth();return}
   try{await ensureProfile(user);showApp()}catch(e){console.error(e);$("authError").textContent="Benutzerprofil konnte nicht geladen werden."}
 });
}
init();

window.openCompetenceForm=openCompetenceForm;
window.addCompetence=addCompetence;

window.openClassCompetenceOverview=openClassCompetenceOverview;
window.openStudentCompetence=openStudentCompetence;
window.filterClassCompetence=filterClassCompetence;
