/* CAMPUS APP VERSION: 9.0 – METHODEN-WERKZEUGKASTEN */
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


const tileLinkFixStyle=document.createElement("style");tileLinkFixStyle.textContent=`a.card.tile{display:block;text-decoration:none;color:inherit;cursor:pointer}a.card.tile:hover{transform:translateY(-1px)}`;document.head.appendChild(tileLinkFixStyle);
const methodenStyle=document.createElement("style");methodenStyle.textContent=`.method-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.method-card{position:relative;min-width:0;padding-top:22px}.method-number{position:absolute;right:14px;top:12px;width:27px;height:27px;border-radius:50%;display:grid;place-items:center;background:var(--soft-green);font-size:12px;font-weight:700}.method-icon{font-size:32px;margin-bottom:4px}.method-question{font-size:13px;color:var(--muted)}@media(max-width:950px){.method-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:700px){.method-grid{grid-template-columns:1fr}}`;document.head.appendChild(methodenStyle);
const resourceLibraryStyle=document.createElement("style");
resourceLibraryStyle.textContent=`
.resource-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-top:12px}
.resource-card{min-width:0}
.resource-top{display:flex;align-items:center;gap:8px}
.resource-icon{font-size:27px}
.resource-meta{display:flex;gap:8px;flex-wrap:wrap;color:var(--muted);font-size:12px}
.resource-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.resource-toolbar{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-top:12px}
.resource-toolbar .chips{display:flex;gap:6px;flex-wrap:wrap}
.resource-toolbar .chip.active{font-weight:700;border-color:var(--ink)}
.resource-library-intro{background:var(--soft-green)}
@media(max-width:950px){.resource-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:700px){.resource-grid{grid-template-columns:1fr}.resource-toolbar{display:block}.resource-toolbar .chips{margin-top:8px}}
`;
document.head.appendChild(resourceLibraryStyle);

let app=null, auth=null, db=null;

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
window.closeModal=closeModal;
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


$("loginForm").addEventListener("submit",async e=>{
 e.preventDefault();$("authError").textContent="";
 if(!configReady){$("authError").textContent="Firebase ist noch nicht konfiguriert.";return}
 try{
   await loadFirebase();
   await signInWithEmailAndPassword(auth,$("loginEmail").value.trim(),$("loginPassword").value);
 }catch(err){console.error(err);authError(err)}
});
$("registerForm").addEventListener("submit",async e=>{
 e.preventDefault();$("authError").textContent="";
 if($("registerPassword").value!==$("registerPassword2").value){$("authError").textContent="Die Passwörter stimmen nicht überein.";return}
 if(!configReady){$("authError").textContent="Firebase ist noch nicht konfiguriert.";return}
 try{
   await loadFirebase();
   const cred=await createUserWithEmailAndPassword(auth,$("registerEmail").value.trim(),$("registerPassword").value);
   await updateProfile(cred.user,{displayName:$("registerName").value.trim()});
   await ensureProfile(cred.user,$("registerName").value.trim());
 }catch(err){console.error(err);authError(err)}
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
 const resources=[["🔎","Lernaufträge","Selbstständig starten: recherchieren, verstehen, anwenden."],["🧠","Lernimpulse","Kurze Impulse für Reflexion, Methoden und Deeper Learning."],["📚","Materialien","Arbeitsblätter, Vorlagen und hilfreiche Quellen."],["🛠️","Methoden","Planung, Teamarbeit, Präsentation und Reflexion."],["💻","Digitale Tools","Werkzeuge für Zusammenarbeit, Gestaltung und Organisation."],["🤖","KI zum Lernen","KI bewusst, kritisch und produktiv einsetzen.","ki-lernen"],["🧰","Methoden","Lernmethoden, Lernstrategien und Werkzeuge.","methoden"],["📚","Lernressourcen","TaskCards, KI, Videos, ByCS/mebis und weitere Lernangebote.","ressourcen"],["❓","Fragen & Hilfe","Wenn du nicht weiterkommst: fragen und teilen."],["⭐","Best Practice","Gute Lösungen aus der Campusklasse sichtbar machen."]];
 return `${pageHead("SELBSTSTÄNDIG LERNEN","Lernwerkstatt","Der offene Lernraum für Lernaufträge, Methoden, digitale Werkzeuge und eigene Lernwege.",`<button class="primary" onclick="openPostForm('idea')">＋ Lernimpuls</button>`)}
 <div class="grid grid-4">${resources.map(x=>x[3]
  ? `<a class="card tile" href="#${x[3]}" aria-label="${esc(x[1])} öffnen"><span class="emoji">${x[0]}</span><strong>${x[1]}</strong><small>${x[2]}</small></a>`
  : `<div class="card tile"><span class="emoji">${x[0]}</span><strong>${x[1]}</strong><small>${x[2]}</small></div>`
).join("")}</div>
 <div class="grid grid-2" style="margin-top:12px"><div class="card"><h3>🧭 So kann ich starten</h3><div class="list">${["Ich möchte etwas verstehen","Ich möchte recherchieren","Ich möchte etwas ausprobieren","Ich möchte etwas gestalten","Ich möchte ein Problem lösen","Ich möchte mich vorbereiten"].map(x=>`<div class="list-item"><strong>${x}</strong><span class="pill">Lernen</span></div>`).join("")}</div></div><div class="card"><h3>🤖 KI-Lernimpuls</h3><p>Nutze KI nicht nur für fertige Antworten. Bitte sie zum Beispiel, dir Fragen zu stellen, einen Lösungsweg zu prüfen oder Gegenargumente zu entwickeln.</p><div class="chips" style="margin-top:12px"><span class="chip">Erklären</span><span class="chip">Fragen</span><span class="chip">Feedback</span><span class="chip">Perspektiven</span></div></div></div>${footer()}`;
}


/* ============================================================
   LERNRESSOURCEN-BIBLIOTHEK – OHNE FIREBASE STORAGE
   Firestore collection: learningResources
   ============================================================ */

const RESOURCE_TYPES = {
  taskcard: { icon:"🎴", label:"TaskCard" },
  ai:       { icon:"🤖", label:"KI-Lernressource" },
  external: { icon:"🔗", label:"Externer Link" },
  video:    { icon:"🎬", label:"Video-Link" },
  bycs:     { icon:"📚", label:"ByCS / mebis" },
  website:  { icon:"🌐", label:"Webseite" }
};
let activeResourceFilter="all";

function resourceTypeInfo(type){ return RESOURCE_TYPES[type] || RESOURCE_TYPES.external; }

function validHttpUrl(url){
  try {
    const u=new URL(url);
    return u.protocol==="https:" || u.protocol==="http:";
  } catch(e) { return false; }
}

async function getLearningResources(){
  const snap=await getDocs(collection(db,"learningResources"));
  return snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>{
    const at=a.createdAt?.seconds ? a.createdAt.seconds*1000 : (a.createdAtMs||0);
    const bt=b.createdAt?.seconds ? b.createdAt.seconds*1000 : (b.createdAtMs||0);
    return bt-at;
  });
}

function resourceCard(r){
  const info=resourceTypeInfo(r.type);
  const tags=(r.tags||[]).map(t=>`<span class="pill">${esc(t)}</span>`).join("");
  return `<article class="card resource-card" data-resource-type="${esc(r.type)}">
    <div class="resource-top">
      <span class="resource-icon">${info.icon}</span>
      <span class="badge">${esc(info.label)}</span>
    </div>
    <h3>${esc(r.title||"Lernressource")}</h3>
    ${r.description?`<p>${esc(r.description)}</p>`:""}
    <div class="resource-meta">
      ${r.subject?`<span>📚 ${esc(r.subject)}</span>`:""}
      ${r.duration?`<span>⏱️ ${esc(r.duration)}</span>`:""}
    </div>
    ${r.competency?`<div class="notice" style="margin-top:8px"><b>Passende Kompetenz:</b> ${esc(r.competency)}</div>`:""}
    ${tags?`<div class="resource-tags">${tags}</div>`:""}
    <div style="margin-top:12px">
      ${r.url && validHttpUrl(r.url)
        ? `<a class="primary button" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">Öffnen →</a>`
        : `<span class="pill">Kein gültiger Link</span>`}
    </div>
  </article>`;
}

function updateResourceForm(){
  const type=$("rType")?.value||"taskcard";
  const label=$("rLinkLabel");
  if(label) label.textContent=resourceTypeInfo(type).label;
  const hint=$("rLinkHint");
  if(hint){
    const hints={
      taskcard:"Link zur TaskCard",
      ai:"Link zu fobizz oder einer anderen schulisch freigegebenen KI",
      external:"Link zu einer externen Lernressource",
      video:"Link zu einem Video, z. B. YouTube oder einer Schulplattform",
      bycs:"Link zu ByCS / mebis / einer schulischen Lernressource",
      website:"Link zu einer Webseite"
    };
    hint.textContent=hints[type]||"Link zur Lernressource";
  }
}

function openResourceForm(){
  modal(`<button class="modal-close" onclick="window.closeModal()">×</button>
    <div class="kicker">LERNWERKSTATT</div>
    <h2>＋ Lernressource hinzufügen</h2>
    <div class="form">
      <label>Art
        <select id="rType" onchange="window.updateResourceForm()">
          <option value="taskcard">🎴 TaskCard</option>
          <option value="ai">🤖 KI-Lernressource</option>
          <option value="external">🔗 Externer Link</option>
          <option value="video">🎬 Video-Link</option>
          <option value="bycs">📚 ByCS / mebis</option>
          <option value="website">🌐 Webseite</option>
        </select>
      </label>
      <label>Titel
        <input id="rTitle" placeholder="z. B. Soziale Identität – Lernstation" required>
      </label>
      <label>Beschreibung
        <textarea id="rDescription" rows="3" placeholder="Was bietet diese Lernressource?"></textarea>
      </label>
      <label>Fach / Lernbereich
        <input id="rSubject" placeholder="z. B. Pädagogik & Psychologie 11 · Soziale Identität">
      </label>
      <label>Passende Kompetenz (optional)
        <input id="rCompetency" placeholder="z. B. Ich kann …">
      </label>
      <label>Geschätzte Lernzeit
        <input id="rDuration" placeholder="z. B. 20 Minuten">
      </label>
      <label><span id="rLinkLabel">TaskCard</span>
        <input id="rUrl" type="url" placeholder="https://…" required>
        <small id="rLinkHint">Link zur TaskCard</small>
      </label>
      <label>Schlagworte
        <input id="rTags" placeholder="z. B. PP11, Üben, Fallbeispiel">
      </label>
      <div class="notice">💡 Diese Bibliothek arbeitet bewusst ohne Firebase Storage. Es werden nur Informationen und Links in Firestore gespeichert. Dateien können später über schulische Freigabelinks ergänzt werden.</div>
      <div class="form-actions">
        <button class="secondary" type="button" onclick="window.closeModal()">Abbrechen</button>
        <button class="primary" type="button" id="saveResourceBtn" onclick="window.saveResource()">Speichern</button>
      </div>
    </div>`);
  updateResourceForm();
}

async function saveResource(){
  const title=$("rTitle")?.value.trim();
  const type=$("rType")?.value||"external";
  const description=$("rDescription")?.value.trim()||"";
  const subject=$("rSubject")?.value.trim()||"";
  const competency=$("rCompetency")?.value.trim()||"";
  const duration=$("rDuration")?.value.trim()||"";
  const url=$("rUrl")?.value.trim()||"";
  const tags=($("rTags")?.value||"").split(",").map(x=>x.trim()).filter(Boolean);

  if(!title){toast("Bitte einen Titel eingeben.");return}
  if(!url || !validHttpUrl(url)){toast("Bitte einen gültigen http/https-Link eingeben.");return}

  const btn=$("saveResourceBtn");
  if(btn){btn.disabled=true;btn.textContent="Speichert …";}

  try{
    await addDoc(collection(db,"learningResources"),{
      title,type,description,subject,competency,duration,url,tags,
      authorUid:currentUser.uid,
      authorName:profile?.displayName||currentUser.displayName||"Campus-Mitglied",
      createdAt:serverTimestamp(),
      createdAtMs:Date.now()
    });
    closeModal();
    await render();
    toast("Lernressource gespeichert.");
  }catch(e){
    console.error("Lernressource speichern:",e);
    if(btn){btn.disabled=false;btn.textContent="Speichern";}
    toast(`Lernressource konnte nicht gespeichert werden (${e?.code||"Fehler"}).`);
  }
}

function setResourceFilter(type){
  activeResourceFilter=type;
  document.querySelectorAll("[data-resource-filter]").forEach(b=>{
    b.classList.toggle("active",b.dataset.resourceFilter===type);
  });
  filterResources();
}

function filterResources(){
  const q=($("resourceSearch")?.value||"").toLowerCase().trim();
  document.querySelectorAll(".resource-card").forEach(card=>{
    const text=card.textContent.toLowerCase();
    const type=card.dataset.resourceType;
    const typeOk=activeResourceFilter==="all" || type===activeResourceFilter;
    card.style.display=(typeOk && (!q || text.includes(q)))?"":"none";
  });
}

async function renderRessourcen(){
  let resources=[],error="";
  try{resources=await getLearningResources();}
  catch(e){
    console.error("Lernressourcen laden:",e);
    error=e?.code ? `${e.code}: ${e.message||""}` : (e?.message||String(e));
  }
  const teacher=isTeacher();

  return `${pageHead(
    "LERNWERKSTATT",
    "Lernressourcen",
    "Alles, was dich beim Lernen unterstützt – TaskCards, KI, Videos, ByCS/mebis und weitere Lernangebote.",
    teacher?`<button class="primary" onclick="window.openResourceForm()">＋ Lernressource</button>`:`<a class="secondary button" href="#lernwerkstatt">← Lernwerkstatt</a>`
  )}
  <div class="card resource-library-intro">
    <span class="badge">📚 LERNRESSOURCEN-BIBLIOTHEK</span>
    <h2 style="margin:8px 0 4px">Ein Ort für dein Weiterlernen</h2>
    <p>Passende Lernangebote an einem Ort – unabhängig davon, wo sie technisch bereitgestellt werden.</p>
  </div>
  <div class="resource-toolbar">
    <input id="resourceSearch" class="search" placeholder="🔎 Lernressource suchen …" oninput="window.filterResources()">
    <div class="chips">
      <button class="chip active" data-resource-filter="all" onclick="window.setResourceFilter('all')">Alle</button>
      ${Object.entries(RESOURCE_TYPES).map(([k,v])=>`<button class="chip" data-resource-filter="${k}" onclick="window.setResourceFilter('${k}')">${v.icon} ${v.label}</button>`).join("")}
    </div>
  </div>
  ${error?`<div class="card"><b>Lernressourcen konnten nicht geladen werden.</b><p>${esc(error)}</p></div>`:""}
  <div class="resource-grid">
    ${resources.length?resources.map(resourceCard).join(""):`<div class="empty" style="grid-column:1/-1"><strong>Noch keine Lernressourcen</strong><br>${teacher?"Lege die erste TaskCard, fobizz-Ressource oder einen Lernlink an.":"Hier werden bald Lernangebote für dich bereitstehen."}</div>`}
  </div>
  ${footer()}`;
}

window.openResourceForm=openResourceForm;
window.updateResourceForm=updateResourceForm;
window.saveResource=saveResource;
window.setResourceFilter=setResourceFilter;
window.filterResources=filterResources;

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


async function renderMethoden(){
 const methods=[
  ["🧠","Verstehen & Erklären","Neue Inhalte wirklich durchdringen.","Erkläre einen Inhalt in eigenen Worten. Nutze Feynman, Warum-Fragen, Beispiele und Gegenbeispiele.","Kann ich es jemand anderem verständlich erklären?"],
  ["🗂️","Strukturieren","Zusammenhänge sichtbar machen.","Nutze Mindmap, Concept Map, Tabelle, Ablaufdiagramm oder Ursache-Wirkungs-Schema.","Wie hängen die Dinge miteinander zusammen?"],
  ["🔄","Wiederholen & Festigen","Wissen dauerhaft abrufen können.","Nutze Active Recall, Karteikarten, Selbstabfrage und Spaced Repetition.","Kann ich es ohne Unterlagen abrufen?"],
  ["✍️","Anwenden","Wissen auf neue Situationen übertragen.","Bearbeite Fallbeispiele, Transferaufgaben und entwickle eigene Beispiele.","Kann ich mein Wissen in einer neuen Situation verwenden?"],
  ["🔎","Analysieren","Komplexe Sachverhalte systematisch untersuchen.","Arbeite mit Fallanalyse, Textanalyse, Vergleich, Perspektivwechsel und Ursache-Wirkungs-Analyse.","Kann ich einen Sachverhalt systematisch untersuchen?"],
  ["🗣️","Lernen durch Austausch","Durch andere Menschen besser verstehen.","Nutze Lerntandem, Partnererklärung, Peer Teaching, gegenseitige Befragung und Diskussion.","Kann ich durch einen anderen Menschen besser verstehen?"],
  ["📝","Schreiben & Verarbeiten","Inhalte in eine eigene Struktur überführen.","Nutze Zusammenfassung, Exzerpt, Cornell-Methode, Lernzettel oder One-Pager.","Kann ich den Inhalt in meinen eigenen Worten darstellen?"],
  ["🎯","Prüfungsvorbereitung","Gezielt für Leistungsnachweise lernen.","Nutze Prüfungssimulation, alte Aufgaben, Selbsttests, Zeitdruck und Fehleranalyse.","Was kann ich schon sicher – und wo liegen meine Lücken?"],
  ["🌱","Lernprozess steuern","Den eigenen nächsten Lernschritt bestimmen.","Formuliere Lernziel, schätze dich ein, wähle eine Methode und überprüfe den Fortschritt.","Was brauche ich jetzt, um weiterzukommen?"],
  ["🤖","Mit KI lernen","KI als Lernpartner sinnvoll einsetzen.","Lass dich erklären, abfragen oder mit Feedback unterstützen – ohne die eigene Denkleistung abzugeben.","Wie kann KI meinen Lernprozess unterstützen, statt ihn zu ersetzen?"]
 ];
 return `${pageHead("LERNWERKSTATT","Methoden","Wähle eine Methode passend zu deinem aktuellen Lernziel. Nicht: Welche Methode kenne ich? Sondern: Was möchte ich gerade erreichen?",`<a class="secondary button" href="#lernwerkstatt">← Lernwerkstatt</a>`)}
 <div class="card" style="background:var(--soft-green)"><span class="badge">🧰 LERNWERKZEUGKASTEN</span><h2 style="margin:8px 0 5px">Was möchtest du gerade erreichen?</h2><p>Die passende Lernmethode hängt davon ab, was du gerade brauchst: verstehen, strukturieren, behalten, anwenden, prüfen oder deinen Lernprozess steuern.</p></div>
 <div class="method-grid" style="margin-top:12px">${methods.map((m,i)=>`<article class="card method-card"><div class="method-number">${i+1}</div><div class="method-icon">${m[0]}</div><h3>${m[1]}</h3><p><b>${m[2]}</b></p><div class="notice"><b>So kannst du vorgehen</b><br>${m[3]}</div><p class="method-question"><b>Leitfrage:</b> ${m[4]}</p></article>`).join("")}</div>
 <div class="card" style="margin-top:12px"><span class="badge">🧭 DEIN LERNWEG</span><h2 style="margin:8px 0 5px">Von der Selbsteinschätzung zur Methode</h2><div class="grid grid-3"><div><span class="emoji">📊</span><h3>1. Einschätzen</h3><p>Wo stehe ich? <b>Auf Kurs</b>, <b>Klärungsbedarf</b> oder <b>Handlungsbedarf</b>?</p></div><div><span class="emoji">🧰</span><h3>2. Methode wählen</h3><p>Was brauche ich jetzt: verstehen, üben, anwenden, prüfen oder reflektieren?</p></div><div><span class="emoji">🔄</span><h3>3. Erneut prüfen</h3><p>Nach dem Lernen erneut einschätzen und den nächsten Schritt festlegen.</p></div></div></div>
 <div class="card" style="margin-top:12px"><h3>💡 Tipp</h3><p>Du musst nicht immer mit derselben Methode lernen. <b>Wähle die Methode nach deinem Lernziel</b> und wechsle sie, wenn du nicht weiterkommst.</p><div class="form-actions"><a class="secondary button" href="#lernwerkstatt">← Lernwerkstatt</a><a class="primary button" href="#ressourcen">📚 Passende Lernressourcen</a><a class="secondary button" href="#ki-lernen">🤖 KI zum Lernen</a></div></div>
 ${footer()}`;
}

async function renderKILernen(){
 return `${pageHead(
   "LERNWERKSTATT",
   "KI zum Lernen",
   "KI als Lernpartner nutzen: erklären lassen, Fragen entwickeln, Feedback erhalten und das eigene Lernen überprüfen.",
   `<a class="secondary button" href="#lernwerkstatt">← Lernwerkstatt</a>`
 )}
 <div class="card" style="background:var(--soft-green)">
   <span class="badge">🤖 KI ALS LERNPARTNER</span>
   <h2 style="margin:8px 0 5px">Nicht die Antwort bekommen – besser lernen.</h2>
   <p>Nutze KI so, dass dein eigener Lernprozess im Mittelpunkt bleibt. Lass dir etwas erklären, stelle Rückfragen, prüfe dein Verständnis und entwickle eigene Lösungen.</p>
 </div>

 <div class="grid grid-3" style="margin-top:12px">
   <div class="card"><span class="emoji">💡</span><h3>1. Verstehen</h3><p>„Erkläre mir diesen Begriff auf dem Niveau der 11. Klasse und gib mir anschließend drei Verständnisfragen.“</p></div>
   <div class="card"><span class="emoji">🧠</span><h3>2. Üben</h3><p>„Stelle mir nacheinander Fragen. Warte jeweils auf meine Antwort und gib mir danach kurzes Feedback.“</p></div>
   <div class="card"><span class="emoji">🔎</span><h3>3. Prüfen</h3><p>„Prüfe meine Erklärung. Zeige mir, was noch unklar oder fachlich falsch ist, ohne die Lösung vorwegzunehmen.“</p></div>
 </div>

 <div class="card" style="margin-top:12px">
   <span class="badge">FOBIZZ</span>
   <h2 style="margin:8px 0 5px">KI-Tools zum Lernen</h2>
   <p>fobizz bietet KI-Chat, PDF Chat, KI-Assistenten und weitere Werkzeuge. Die konkreten Zugänge hängen von der schulischen Freigabe und dem vorhandenen fobizz-Zugang ab.</p>
   <div class="grid grid-3" style="margin-top:12px">
     <a class="card tile" href="https://fobizz.com/de/die-fobizz-tools-fuer-schule-und-unterricht/" target="_blank" rel="noopener noreferrer"><span class="emoji">🤖</span><strong>KI-Chat & KI-Tools</strong><small>Überblick über KI Chat, PDF Chat und weitere fobizz-KI-Tools.</small></a>
     <a class="card tile" href="https://fobizz.com/de/tutorials/" target="_blank" rel="noopener noreferrer"><span class="emoji">🎓</span><strong>KI ausprobieren</strong><small>Tutorials zu KI Chat, PDF Chat und weiteren fobizz-Werkzeugen.</small></a>
     <a class="card tile" href="https://app.fobizz.com/de/help/articles/308-ki-assistenten-einsetzen" target="_blank" rel="noopener noreferrer"><span class="emoji">🧩</span><strong>KI-Assistenten</strong><small>Hinweise für den sinnvollen Einsatz von KI-Assistenten.</small></a>
   </div>
 </div>

 <div class="grid grid-2" style="margin-top:12px">
   <div class="card"><h3>🛠️ So kannst du KI konkret nutzen</h3><div class="list">
     ${[
       ["Erklären","Lass dir schwierige Inhalte in unterschiedlichen Schwierigkeitsstufen erklären."],
       ["Fragen stellen","Lass dich abfragen, statt dir die Lösung sofort geben zu lassen."],
       ["Feedback","Gib der KI deine eigene Lösung und bitte um Hinweise statt um eine Musterlösung."],
       ["Perspektiven wechseln","Bitte um Gegenargumente, Beispiele oder alternative Erklärungen."],
       ["Lernplan","Lass dir aus deinen offenen Lernzielen einen realistischen Lernweg entwickeln."]
     ].map(x=>`<div class="list-item"><div><strong>${x[0]}</strong><small>${x[1]}</small></div><span class="pill">KI</span></div>`).join("")}
   </div></div>
   <div class="card"><h3>⚖️ KI-Kompass</h3><div class="list">
     ${[
       ["Eigenleistung","Die Gedanken und Lösungen bleiben deine eigenen."],
       ["Quellen prüfen","KI kann überzeugend klingen und trotzdem falsch liegen."],
       ["Datenschutz","Keine persönlichen oder vertraulichen Daten in ungeprüfte KI-Dienste eingeben."],
       ["Transparenz","Wenn KI bei einer Aufgabe wesentlich geholfen hat, den Einsatz kenntlich machen."],
       ["Nachdenken","Am Ende zählt: Kannst du den Inhalt selbst erklären und anwenden?"]
     ].map(x=>`<div class="list-item"><div><strong>${x[0]}</strong><small>${x[1]}</small></div></div>`).join("")}
   </div></div>
 </div>

 <div class="card" style="margin-top:12px"><h3>🎯 Verbindung zur Selbsteinschätzung</h3>
   <p>Wenn du bei einer Kompetenz <b>Klärungsbedarf</b> oder <b>Handlungsbedarf</b> erkennst, kannst du KI gezielt als nächsten Lernschritt einsetzen: erst erklären lassen, dann selbst anwenden und anschließend erneut einschätzen.</p>
   <a class="secondary button" href="#lernwerkstatt">← Zur Lernwerkstatt</a>
 </div>
 ${footer()}`;
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

async function render(){
 if(!currentUser)return;
 const p=location.hash.replace("#","")||"start";
 const pages={start:renderStart,kompass:renderKompass,lernwerkstatt:renderLernwerkstatt,ressourcen:renderRessourcen,methoden:renderMethoden,'ki-lernen':renderKILernen,forum:renderForum,projekte:renderProjekte,kompetenz:renderKompetenz,journal:renderJournal,praktikum:renderPraktikum,ki:renderKI,kalender:renderKalender,team:renderTeam};
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
