// Campusklasse 26/27 – Firebase-Version
let initializeApp, getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
    signInWithEmailAndPassword, signOut, sendPasswordResetEmail, updateProfile;
let getFirestore, collection, doc, addDoc, setDoc, updateDoc, deleteDoc,
    getDoc, getDocs, query, orderBy, limit, where, onSnapshot,
    serverTimestamp, arrayUnion, increment;

let firebaseReadyPromise = null;
async function loadFirebase(){
  if(firebaseReadyPromise) return firebaseReadyPromise;
  firebaseReadyPromise = Promise.all([
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js")
  ]).then(([appMod, authMod, fsMod])=>{
    ({initializeApp}=appMod);
    ({getAuth,onAuthStateChanged,createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,sendPasswordResetEmail,updateProfile}=authMod);
    ({getFirestore,collection,doc,addDoc,setDoc,updateDoc,deleteDoc,getDoc,getDocs,query,orderBy,limit,where,onSnapshot,serverTimestamp,arrayUnion,increment}=fsMod);
    if(!app) app=initializeApp(firebaseConfig);
    if(!auth) auth=getAuth(app);
    if(!db) db=getFirestore(app);
    return true;
  });
  return firebaseReadyPromise;
}

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

let app=null, auth=null, db=null;

const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const statusLabel={green:"Auf Kurs",yellow:"Klärungsbedarf",red:"Handlungsbedarf"};
const labels={question:"❓ Frage",info:"📢 Info",idea:"💡 Idee",project:"🚀 Projekt",practice:"🏢 Praxis"};
let currentUser=null, profile=null, unsubscribers=[];

function toast(t){const x=$("toast");x.textContent=t;x.classList.add("show");clearTimeout(window.tt);window.tt=setTimeout(()=>x.classList.remove("show"),2500)}
function authError(err){
  console.error("Firebase Auth Fehler:", err);
  const code = err?.code || "unbekannt";
  const message = err?.message || String(err);
  const map = {
    "auth/invalid-credential":"Firebase meldet: Zugangsdaten ungültig.",
    "auth/invalid-login-credentials":"Firebase meldet: Zugangsdaten ungültig.",
    "auth/user-not-found":"Firebase meldet: Benutzer nicht gefunden.",
    "auth/wrong-password":"Firebase meldet: Passwort falsch.",
    "auth/user-disabled":"Firebase meldet: Benutzer ist deaktiviert.",
    "auth/invalid-email":"Firebase meldet: E-Mail-Adresse ist ungültig.",
    "auth/network-request-failed":"Firebase meldet: Netzwerkfehler.",
    "auth/too-many-requests":"Firebase meldet: Zu viele Versuche.",
    "auth/operation-not-allowed":"Firebase meldet: E-Mail/Passwort-Anmeldung ist nicht aktiviert.",
    "auth/api-key-not-valid.-please-pass-a-valid-api-key.":"Firebase meldet: API-Key ist ungültig.",
    "auth/configuration-not-found":"Firebase meldet: Auth-Konfiguration nicht gefunden."
  };
  const friendly = map[code] || "Firebase meldet einen bisher nicht zugeordneten Fehler.";
  $("authError").innerHTML =
    "<strong>"+esc(friendly)+"</strong><br>" +
    "<small>Fehlercode: <code>"+esc(code)+"</code><br>"+esc(message)+"</small>";
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
  $("userName").textContent=(profile?.displayName||currentUser?.email||"Campus") + (isTeacher() ? " · Lehrkraft" : "");
  ensureTeacherNav();
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

function showLoginForm(){
  $("loginTab").classList.add("active");
  $("registerTab").classList.remove("active");
  $("loginForm").hidden=false;
  $("registerForm").hidden=true;
  $("authError").textContent="";
}
function showRegisterForm(){
  $("registerTab").classList.add("active");
  $("loginTab").classList.remove("active");
  $("loginForm").hidden=true;
  $("registerForm").hidden=false;
  $("authError").textContent="";
}
$("loginTab").addEventListener("click",showLoginForm);
$("registerTab").addEventListener("click",showRegisterForm);


$("loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  $("authError").textContent = "";

  const email = $("loginEmail").value.trim();
  const password = $("loginPassword").value;

  if (!email || !password) {
    $("authError").textContent = "Bitte E-Mail-Adresse und Passwort eingeben.";
    return;
  }
  if (!configReady) {
    $("authError").textContent = "Firebase ist noch nicht konfiguriert.";
    return;
  }

  try {
    await loadFirebase();
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    console.error("Anmeldung fehlgeschlagen:", err);
    authError(err);
  }
});
$("registerForm").addEventListener("submit",async e=>{
 e.preventDefault();
 $("authError").textContent="";
 const email=$("registerEmail").value.trim();
 const password=$("registerPassword").value;
 const password2=$("registerPassword2").value;
 const name=$("registerName").value.trim();
 if(password!==password2){
   $("authError").textContent="Die Passwörter stimmen nicht überein.";
   return;
 }
 if(!configReady){
   $("authError").textContent="Firebase ist noch nicht konfiguriert.";
   return;
 }
 try{
   await loadFirebase();
   if(!email || !name || !password){
     $("authError").textContent="Bitte alle Felder ausfüllen.";
     return;
   }
   const cred=await createUserWithEmailAndPassword(auth,email,password);
   await updateProfile(cred.user,{displayName:name});
   currentUser=cred.user;
   await ensureProfile(cred.user,name);
   showApp();
 }catch(err){
   console.error("Registrierung fehlgeschlagen:",err);
   authError(err);
 }
});
$("forgotBtn").onclick=async()=>{
 const email=$("loginEmail").value.trim();
 if(!email){$("authError").textContent="Bitte zuerst deine E-Mail-Adresse eingeben.";return}
 try{await loadFirebase();await sendPasswordResetEmail(auth,email);toast("E-Mail zum Zurücksetzen wurde versendet.")}catch(err){console.error(err);authError(err)}
};
$("logoutBtn").onclick=async()=>{
  try{await loadFirebase();await signOut(auth)}catch(e){console.error(e)}
};
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
 <div class="card" style="margin-top:12px"><h3>🚀 Aktuelle Projekte</h3><div class="list">${projects.map(p=>`<div class="list-item"><div><strong>${esc(p.title)}</strong><small>${esc(p.team||"")} · ${esc(p.partner||"")}</small></div><span class="pill">${Number(p.progress||0)}%</span></div>`).join("")||`<div class="empty">Noch keine Projekte.</div>`}</div></div>${footer()}`;
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
 const mine=await getDocs(query(collection(db,"competencies"),where("uid","==",currentUser.uid)));
 const data=mine.docs.map(d=>({id:d.id,...d.data()}));
 return `${pageHead("ENTWICKLUNG","Kompetenzwerkstatt","Kompetenzen sichtbar machen, Ziele setzen und Entwicklung reflektieren.",`<button class="primary" onclick="openCompetenceForm()">＋ Kompetenz</button>`)}
 <div class="grid grid-2">${data.map(c=>`<div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><h3>${esc(c.name)}</h3><span class="pill">${Number(c.value||0)}/10</span></div><div class="progress"><i style="width:${Number(c.value||0)*10}%"></i></div></div>`).join("")||`<div class="empty"><strong>Noch kein Kompetenzprofil</strong>Lege eine Kompetenz an.</div>`}</div>${footer()}`;
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
 return `${pageHead("TEAM & SCHULENTWICKLUNG","Team & SQ","Arbeitsorganisation für die Campusklasse und gemeinsame Schulentwicklung.",`<button class="primary" onclick="openTaskForm()">＋ Arbeitspaket</button>`)}
 <div class="grid grid-3">${["green","yellow","red"].map((s,i)=>`<div class="card"><div class="status-card">${statusDot(s)}<div><h3>${statusLabel[s]}</h3><p>${tasks.filter(t=>t.status===s).length} Arbeitspakete</p></div></div></div>`).join("")}</div>
 <div class="card" style="margin-top:12px"><h3>📋 Arbeitspakete</h3><div class="list">${tasks.map(taskHTML).join("")||`<div class="empty">Noch keine Arbeitspakete.</div>`}</div></div>
 <div class="notice" style="margin-top:12px"><b>Ampel:</b> <b>Auf Kurs</b> = planmäßig · <b>Klärungsbedarf</b> = Abstimmung/Entscheidung nötig · <b>Handlungsbedarf</b> = aktives Eingreifen erforderlich.</div>${footer()}`;
}


function ensureTeacherNav(){
  const nav = document.querySelector("#sidebar nav");
  if(!nav) return;
  let link = document.querySelector('[data-page="lernbegleitung"]');
  if(isTeacher()){
    if(!link){
      link = document.createElement("a");
      link.href="#lernbegleitung";
      link.dataset.page="lernbegleitung";
      link.className="nav-link teacher-nav";
      link.innerHTML="<span>👩‍🏫</span> Lernbegleitung";
      nav.appendChild(link);
    }
  }else if(link){
    link.remove();
  }
}

async function renderLernbegleitung(){
  if(!isTeacher()){
    return `${pageHead("GESCHÜTZTER BEREICH","Lernbegleitung","Dieser Bereich ist nur für Lehrkräfte freigeschaltet.")}<div class="card"><h3>Kein Zugriff</h3><p>Dein Konto besitzt keine Lehrkraft-Rolle.</p></div>${footer()}`;
  }

  let users=[],tasks=[],projects=[],journals=[],competencies=[];
  try{
    const [uSnap,tSnap,pSnap,jSnap,cSnap]=await Promise.all([
      getDocs(collection(db,"users")),
      getDocs(collection(db,"tasks")),
      getDocs(collection(db,"projects")),
      getDocs(collection(db,"journal")),
      getDocs(collection(db,"competencies"))
    ]);
    users=uSnap.docs.map(d=>({id:d.id,...d.data()}));
    tasks=tSnap.docs.map(d=>({id:d.id,...d.data()}));
    projects=pSnap.docs.map(d=>({id:d.id,...d.data()}));
    journals=jSnap.docs.map(d=>({id:d.id,...d.data()}));
    competencies=cSnap.docs.map(d=>({id:d.id,...d.data()}));
  }catch(e){
    console.error("Lernbegleitung konnte nicht geladen werden:",e);
    return `${pageHead("LERNBEGLEITUNG","Campus-Lernbegleitung","Überblick für Lehrkräfte.")}<div class="card"><h3>Daten konnten nicht geladen werden.</h3><p>Bitte prüfe die Firestore-Sicherheitsregeln.</p></div>${footer()}`;
  }

  const students=users.filter(u=>u.role==="student").sort((a,b)=>(a.displayName||a.email||"").localeCompare(b.displayName||b.email||"","de"));
  const activeTasks=tasks.filter(t=>t.status==="green").length;
  const clarification=tasks.filter(t=>t.status==="yellow").length;
  const action=tasks.filter(t=>t.status==="red").length;
  const withSignals=students.filter(s=>studentSupportSignal(s,tasks,journals,competencies).level!=="green").length;

  const rows=students.map(s=>{
    const signal=studentSupportSignal(s,tasks,journals,competencies);
    const st=tasks.filter(t=>t.ownerUid===s.uid);
    const jr=journals.filter(j=>j.uid===s.uid);
    const cp=competencies.filter(c=>c.uid===s.uid);
    const avg=cp.length ? (cp.reduce((a,c)=>a+Number(c.value||0),0)/cp.length).toFixed(1) : "—";
    return `<div class="support-student-row">
      <div class="support-student-main">
        <div class="support-avatar">${esc((s.displayName||"S").charAt(0).toUpperCase())}</div>
        <div>
          <strong>${esc(s.displayName||"Schüler/in")}</strong>
          <small>${esc(s.email||"")} · ${st.length} Aufgaben · ${jr.length} Reflexionen · Kompetenz Ø ${avg}/10</small>
          <div class="support-signal ${signal.level}"><span class="dot ${signal.level}"></span><span>${esc(signal.label)}</span></div>
        </div>
      </div>
      <div class="support-actions"><button class="secondary" onclick="openStudentSupport('${esc(s.uid)}')">Lernstand öffnen →</button></div>
    </div>`;
  }).join("");

  return `${pageHead("LEHRKRAFT","Lernbegleitung","Lernstände wahrnehmen, Gespräche vorbereiten und gemeinsam nächste Schritte entwickeln.")}
  <div class="grid grid-4">
    <div class="card stat"><b>${students.length}</b><span>Schüler/innen</span></div>
    <div class="card stat"><b>${activeTasks}</b><span>Aufgaben auf Kurs</span></div>
    <div class="card stat"><b>${clarification}</b><span>Klärungsbedarf</span></div>
    <div class="card stat"><b>${withSignals}</b><span>Gespräch sinnvoll</span></div>
  </div>
  <div class="card support-intro" style="margin-top:12px">
    <div><div class="kicker">LERNCOACHING</div><h2>Was braucht dieser Schüler gerade?</h2><p>Die Übersicht verbindet Aufgaben, Projekte, Kompetenzen und Reflexionen zu einer Gesprächsgrundlage. Die Hinweise sind <b>keine Diagnose</b>, sondern nur Anlässe zum Nachfragen.</p></div>
    <div class="chips"><span class="chip">sehen</span><span class="chip">fragen</span><span class="chip">reflektieren</span><span class="chip">nächsten Schritt vereinbaren</span></div>
  </div>
  <div class="card" style="margin-top:12px">
    <div class="page-head" style="margin-bottom:8px"><div><div class="kicker">KLASSE</div><h2>Meine Campusklasse</h2><p>Öffne den Lernstand eines Schülers für ein gezieltes Lernbegleitungsgespräch.</p></div></div>
    <div class="support-list">${rows || `<div class="empty"><strong>Noch keine Schülerkonten vorhanden.</strong> Sobald sich Schüler registrieren, erscheinen sie hier.</div>`}</div>
  </div>
  <div class="grid grid-3" style="margin-top:12px">
    <div class="card"><div class="support-mini-head"><span class="dot green"></span><strong>Auf Kurs</strong></div><p>Der aktuelle Lernweg wirkt planmäßig. Im Gespräch kann der nächste Entwicklungsschritt fokussiert werden.</p></div>
    <div class="card"><div class="support-mini-head"><span class="dot yellow"></span><strong>Klärungsbedarf</strong></div><p>Es gibt Hinweise auf offene Aufgaben, fehlende Reflexion oder einen Bereich, bei dem Nachfragen sinnvoll sein kann.</p></div>
    <div class="card"><div class="support-mini-head"><span class="dot red"></span><strong>Handlungsbedarf</strong></div><p>Es gibt deutliche Signale wie dringende Aufgaben oder mehrere offene Baustellen. Erst Gespräch führen, dann gemeinsam priorisieren.</p></div>
  </div>
  <div class="notice" style="margin-top:12px"><b>Datenschutz:</b> Die Ansicht ist für die schulische Lernbegleitung gedacht. Persönliche Lerninformationen bitte nur im erforderlichen schulischen Rahmen nutzen.</div>
  ${footer()}`;
}

function daysSince(v){
  if(!v) return null;
  let d=null;
  if(v?.seconds) d=new Date(v.seconds*1000);
  else if(v?.toDate) d=v.toDate();
  else if(typeof v==="string") d=new Date(v);
  if(!d || Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now()-d.getTime())/86400000);
}

function studentSupportSignal(student,tasks,journals,competencies){
  const mine=tasks.filter(t=>t.ownerUid===student.uid);
  const mineJournal=journals.filter(j=>j.uid===student.uid);
  const mineComp=competencies.filter(c=>c.uid===student.uid);
  const red=mine.filter(t=>t.status==="red").length;
  const yellow=mine.filter(t=>t.status==="yellow").length;
  const overdue=mine.filter(t=>{
    if(!t.deadline || t.deadline==="—" || t.status==="green") return false;
    const d=new Date(t.deadline+"T23:59:59");
    return !Number.isNaN(d.getTime()) && d.getTime()<Date.now();
  }).length;
  const latestJournal=mineJournal.slice().sort((a,b)=>{
    const ad=daysSince(a.createdAt); const bd=daysSince(b.createdAt);
    return (ad??9999)-(bd??9999);
  })[0];
  const journalAge=latestJournal ? daysSince(latestJournal.createdAt) : null;

  if(red>0 || overdue>=2) return {level:"red",label:"Gespräch zeitnah sinnvoll"};
  if(yellow>0 || overdue===1 || mineComp.length===0 || journalAge===null || journalAge>21) return {level:"yellow",label:"Nachfragen & nächsten Schritt klären"};
  return {level:"green",label:"Lernweg im Blick behalten"};
}

function supportNeedText(tasks,journals,competencies,projects,uid){
  const mine=tasks.filter(t=>t.ownerUid===uid);
  const journal=journals.filter(j=>j.uid===uid).sort((a,b)=>(daysSince(a.createdAt)??9999)-(daysSince(b.createdAt)??9999));
  const comp=competencies.filter(c=>c.uid===uid);
  const proj=projects.filter(p=>String(p.createdBy||"")===String(uid) || String(p.ownerUid||"")===String(uid) || String(p.studentUid||"")===String(uid));
  const red=mine.filter(t=>t.status==="red").length;
  const yellow=mine.filter(t=>t.status==="yellow").length;
  const overdue=mine.filter(t=>{
    if(!t.deadline || t.deadline==="—") return false;
    const d=new Date(t.deadline+"T23:59:59");
    return !Number.isNaN(d.getTime()) && d.getTime()<Date.now() && t.status!=="green";
  }).length;
  const age=journal[0]?daysSince(journal[0].createdAt):null;
  const needs=[];
  if(red) needs.push(`${red} Aufgabe(n) mit Handlungsbedarf priorisieren`);
  if(overdue) needs.push(`${overdue} überfällige Aufgabe(n) gemeinsam klären`);
  if(yellow) needs.push(`${yellow} Aufgabe(n) mit Klärungsbedarf besprechen`);
  if(!comp.length) needs.push("Kompetenzprofil gemeinsam starten");
  if(age===null || age>21) needs.push("Lernjournal/Reflexion wieder aufnehmen");
  if(!proj.length) needs.push("prüfen, ob ein Projektbezug hilfreich wäre");
  return needs.length ? needs.slice(0,3) : ["nächsten persönlichen Entwicklungsschritt festlegen"];
}

async function openStudentSupport(uid){
  if(!isTeacher()) return;
  try{
    const [uSnap,tasksSnap,journalSnap,compSnap,projectSnap]=await Promise.all([
      getDoc(doc(db,"users",uid)),
      getDocs(query(collection(db,"tasks"),where("ownerUid","==",uid),limit(100))),
      getDocs(query(collection(db,"journal"),where("uid","==",uid),limit(50))),
      getDocs(query(collection(db,"competencies"),where("uid","==",uid),limit(50))),
      getDocs(collection(db,"projects"))
    ]);

    const u=uSnap.exists()?uSnap.data():{};
    const tasks=tasksSnap.docs.map(d=>({id:d.id,...d.data()}));
    const journals=journalSnap.docs.map(d=>({id:d.id,...d.data()}));
    const comps=compSnap.docs.map(d=>({id:d.id,...d.data()}));
    const projects=projectSnap.docs.map(d=>({id:d.id,...d.data()}));
    const signal=studentSupportSignal({uid},tasks,journals,comps);
    const needs=supportNeedText(tasks,journals,comps,projects,uid);
    const mineProjects=projects.filter(p=>String(p.createdBy||"")===String(uid) || String(p.ownerUid||"")===String(uid) || String(p.studentUid||"")===String(uid));
    const avg=comps.length ? (comps.reduce((a,c)=>a+Number(c.value||0),0)/comps.length).toFixed(1) : "—";

    modal(`<button class="modal-close" onclick="closeModal()">×</button>
      <div class="kicker">LERNBEGLEITUNG · LERNSTAND</div>
      <div class="support-profile-head"><div class="support-avatar large">${esc((u.displayName||"S").charAt(0).toUpperCase())}</div><div><h2>${esc(u.displayName||"Schüler/in")}</h2><p>${esc(u.email||"")}</p><div class="support-signal ${signal.level}"><span class="dot ${signal.level}"></span><span>${esc(signal.label)}</span></div></div></div>

      <div class="grid grid-4" style="margin-top:14px">
        <div class="card stat"><b>${tasks.length}</b><span>Aufgaben</span></div>
        <div class="card stat"><b>${mineProjects.length}</b><span>Projekte</span></div>
        <div class="card stat"><b>${comps.length}</b><span>Kompetenzen</span></div>
        <div class="card stat"><b>${avg}/10</b><span>Kompetenz Ø</span></div>
      </div>

      <div class="support-coach-box">
        <div class="kicker">GESPRÄCHSIMPULS</div>
        <h3>Was braucht dieser Schüler gerade?</h3>
        <ul>${needs.map(n=>`<li>${esc(n)}</li>`).join("")}</ul>
        <p class="support-question"><b>Gute Einstiegsfrage:</b> „Was läuft gerade gut – und wo kommst du selbst noch nicht weiter?“</p>
      </div>

      <div class="support-section"><h3>☑️ Aktueller Lernstand</h3>
        <div class="list">${tasks.slice().sort((a,b)=>String(a.deadline||"").localeCompare(String(b.deadline||""))).map(taskHTML).join("")||`<div class="empty">Keine Aufgaben vorhanden.</div>`}</div>
      </div>

      <div class="support-section"><h3>🚀 Projekte</h3>
        <div class="list">${mineProjects.map(p=>`<div class="list-item"><div><strong>${esc(p.title||"Projekt")}</strong><small>${esc(p.goal||"")} · ${esc(p.team||"")}</small></div><span class="pill">${Number(p.progress||0)}%</span></div>`).join("")||`<div class="empty">Keine eindeutig zugeordneten Projekte vorhanden.</div>`}</div>
      </div>

      <div class="support-section"><h3>🧩 Kompetenzen</h3>
        <div class="support-competencies">${comps.map(c=>`<div class="support-competency"><div><strong>${esc(c.name||"Kompetenz")}</strong><span>${Number(c.value||0)}/10</span></div><div class="progress"><i style="width:${Math.max(0,Math.min(10,Number(c.value||0)))*10}%"></i></div></div>`).join("")||`<div class="empty">Noch kein Kompetenzprofil.</div>`}</div>
      </div>

      <div class="support-section"><h3>📓 Letzte Reflexionen</h3>
        <div class="list">${journals.slice().sort((a,b)=>(daysSince(a.createdAt)??9999)-(daysSince(b.createdAt)??9999)).slice(0,5).map(j=>`<article class="card"><span class="pill">${fmtDate(j.createdAt)}</span><h4>${esc(j.title||"Reflexion")}</h4><p>${esc(j.text||"")}</p></article>`).join("")||`<div class="empty">Noch keine Reflexionen.</div>`}</div>
      </div>

      <div class="notice" style="margin-top:14px"><b>Hinweis:</b> Die automatisch formulierten Gesprächsimpulse sind keine pädagogische oder psychologische Diagnose. Sie dienen ausschließlich als praktische Gesprächsanregung.</div>`);
  }catch(e){
    console.error("Schüleransicht:",e);
    toast("Lernbegleitung konnte nicht geöffnet werden.");
  }
}

async function render(){
 if(!currentUser)return;
 const p=location.hash.replace("#","")||"start";
 const pages={start:renderStart,kompass:renderKompass,lernwerkstatt:renderLernwerkstatt,forum:renderForum,projekte:renderProjekte,kompetenz:renderKompetenz,journal:renderJournal,praktikum:renderPraktikum,ki:renderKI,kalender:renderKalender,team:renderTeam,lernbegleitung:renderLernbegleitung};
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
  if(!configReady){
    showAuth();
    $("authError").textContent="Die Firebase-Konfiguration fehlt noch.";
    return;
  }
  try{
    await loadFirebase();
    onAuthStateChanged(auth,async user=>{
      clearListeners();
      currentUser=user;
      if(!user){profile=null;showAuth();return}
      try{await ensureProfile(user);showApp()}
      catch(e){console.error(e);showAuth();$("authError").textContent="Benutzerprofil konnte nicht geladen werden."}
    });
  }catch(e){
    console.error("Firebase konnte nicht geladen werden:",e);
    showAuth();
    $("authError").textContent="Firebase konnte nicht geladen werden. Der Reiter „Konto erstellen“ sollte trotzdem funktionieren.";
  }
}
init();
