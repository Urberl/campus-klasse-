/* CAMPUS APP – STABILE LERNRESSOURCEN-BIBLIOTHEK */
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

const lernpfadStyle=document.createElement("style");lernpfadStyle.textContent=`.learning-path{max-width:900px;margin:auto}.path-step{display:grid;grid-template-columns:42px 48px 1fr;gap:14px;align-items:start}.path-number{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;background:var(--soft-green);font-weight:700}.path-icon{font-size:30px}.path-arrow{text-align:center;font-size:24px;color:var(--muted);height:18px}@media(max-width:700px){.path-step{grid-template-columns:34px 38px 1fr;gap:9px}.path-icon{font-size:25px}}`;document.head.appendChild(lernpfadStyle);
const coachingStyle=document.createElement("style");coachingStyle.textContent=`.method-icon{font-size:32px;margin-bottom:4px}`;document.head.appendChild(coachingStyle);
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
 const resources=[["🧰","Methoden","Lernmethoden, Lernstrategien und Werkzeuge.","methoden"],["💡","Lernimpulse","Kurze interaktive Impulse für deinen nächsten Lernschritt.","impulse"],["🧭","Persönlicher Lernpfad","Dein Weg vom Lernziel über Auftrag, Ressourcen und Methoden bis zur Selbsteinschätzung.","lernpfad"],["📓","Lernjournal","Dein persönlicher Reflexions- und Lernbegleiter.","journal"],["💬","Lerncoaching","Persönliche Unterstützung durch eine Lehrkraft.","lerncoaching"],["🧠","Lernimpulse","Kurze Impulse für Reflexion, Methoden und Deeper Learning."],["📚","Materialien","Arbeitsblätter, Vorlagen und hilfreiche Quellen."],["🛠️","Methoden","Planung, Teamarbeit, Präsentation und Reflexion."],["💻","Digitale Tools","Werkzeuge für Zusammenarbeit, Gestaltung und Organisation."],["🤖","KI zum Lernen","KI bewusst, kritisch und produktiv einsetzen."],["📚","Lernressourcen","TaskCards, KI, Videos, ByCS/mebis und weitere Lernangebote.","ressourcen"],["❓","Fragen & Hilfe","Wenn du nicht weiterkommst: fragen und teilen."],["⭐","Best Practice","Gute Lösungen aus der Campusklasse sichtbar machen."]];
 return `${pageHead("SELBSTSTÄNDIG LERNEN","Lernwerkstatt","Der offene Lernraum für Lernaufträge, Methoden, digitale Werkzeuge und eigene Lernwege.",`<button class="primary" onclick="openPostForm('idea')">＋ Lernimpuls</button>`)}
 <div class="grid grid-4">${resources.map(x=>x[3]
 ? `<a class="card tile" href="#${x[3]}" aria-label="${esc(x[1])} öffnen"><span class="emoji">${x[0]}</span><strong>${x[1]}</strong><small>${x[2]}</small></a>`
 : `<div class="card tile"><span class="emoji">${x[0]}</span><strong>${x[1]}</strong><small>${x[2]}</small></div>`
).join("")}</div>
 <div class="grid grid-2" style="margin-top:12px"><div class="card"><h3>🧭 So kann ich starten</h3><div class="list">${["Ich möchte etwas verstehen","Ich möchte recherchieren","Ich möchte etwas ausprobieren","Ich möchte etwas gestalten","Ich möchte ein Problem lösen","Ich möchte mich vorbereiten"].map(x=>`<div class="list-item"><strong>${x}</strong><span class="pill">Lernen</span></div>`).join("")}</div></div><div class="card"><h3>🤖 KI-Lernimpuls</h3><p>Nutze KI nicht nur für fertige Antworten. Bitte sie zum Beispiel, dir Fragen zu stellen, einen Lösungsweg zu prüfen oder Gegenargumente zu entwickeln.</p><div class="chips" style="margin-top:12px"><span class="chip">Erklären</span><span class="chip">Fragen</span><span class="chip">Feedback</span><span class="chip">Perspektiven</span></div></div></div>${footer()}`;
}


const RESOURCE_TYPES={
 taskcard:{icon:"🎴",label:"TaskCard"},
 ai:{icon:"🤖",label:"KI-Lernressource"},
 external:{icon:"🔗",label:"Externer Link"},
 video:{icon:"🎬",label:"Video-Link"},
 bycs:{icon:"📚",label:"ByCS / mebis"},
 website:{icon:"🌐",label:"Webseite"}
};
let activeResourceFilter="all";

function validResourceUrl(url){
 try{const u=new URL(url);return ["http:","https:"].includes(u.protocol)}catch(e){return false}
}
async function loadResources(){
 const snap=await getDocs(collection(db,"learningResources"));
 return snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>{
  const aa=a.createdAt?.seconds?a.createdAt.seconds*1000:(a.createdAtMs||0);
  const bb=b.createdAt?.seconds?b.createdAt.seconds*1000:(b.createdAtMs||0);
  return bb-aa;
 });
}
function resourceCard(r){
 const info=RESOURCE_TYPES[r.type]||RESOURCE_TYPES.external;
 return `<article class="card resource-card" data-resource-type="${esc(r.type)}">
  <div class="resource-top"><span class="resource-icon">${info.icon}</span><span class="badge">${esc(info.label)}</span></div>
  <h3>${esc(r.title||"Lernressource")}</h3>
  ${r.description?`<p>${esc(r.description)}</p>`:""}
  ${r.subject?`<small>📚 ${esc(r.subject)}</small>`:""}
  ${r.competency?`<div class="notice"><b>Kompetenz:</b> ${esc(r.competency)}</div>`:""}
  <a class="primary button" href="${esc(r.url||"#")}" target="_blank" rel="noopener noreferrer">Öffnen →</a>
 </article>`;
}
function openResourceForm(){
 modal(`<button class="modal-close" onclick="window.closeModal()">×</button>
 <div class="kicker">LERNWERKSTATT</div><h2>＋ Lernressource hinzufügen</h2>
 <div class="form">
  <label>Art<select id="rType" onchange="window.updateResourceType()">
   <option value="taskcard">🎴 TaskCard</option><option value="ai">🤖 KI-Lernressource</option>
   <option value="external">🔗 Externer Link</option><option value="video">🎬 Video-Link</option>
   <option value="bycs">📚 ByCS / mebis</option><option value="website">🌐 Webseite</option>
  </select></label>
  <label>Titel<input id="rTitle" required placeholder="z. B. Soziale Identität – Lernstation"></label>
  <label>Beschreibung<textarea id="rDescription" rows="3" placeholder="Was bietet die Ressource?"></textarea></label>
  <label>Fach / Lernbereich<input id="rSubject" placeholder="z. B. PP11 · Soziale Identität"></label>
  <label>Passende Kompetenz (optional)<input id="rCompetency" placeholder="Ich kann …"></label>
  <label>Geschätzte Lernzeit<input id="rDuration" placeholder="z. B. 20 Minuten"></label>
  <label id="rLinkLabel">Link<input id="rUrl" type="url" placeholder="https://…" required></label>
  <label>Schlagworte<input id="rTags" placeholder="PP11, Üben, Fallbeispiel"></label>
  <div class="notice">📌 Ohne Firebase Storage: Es werden nur Links und Beschreibungen in Firestore gespeichert.</div>
  <div class="form-actions"><button class="secondary" type="button" onclick="window.closeModal()">Abbrechen</button><button class="primary" type="button" onclick="window.saveResource()">Speichern</button></div>
 </div>`);
 updateResourceType();
}
function updateResourceType(){
 const t=$("rType")?.value;
 const labels={taskcard:"TaskCard-Link",ai:"KI-/fobizz-Link",external:"Externer Link",video:"Video-Link",bycs:"ByCS-/mebis-Link",website:"Webseiten-Link"};
 const el=$("rLinkLabel"); if(el) el.firstChild.textContent=(labels[t]||"Link");
}
async function saveResource(){
 const title=$("rTitle")?.value.trim(),type=$("rType")?.value||"external",url=$("rUrl")?.value.trim();
 if(!title){toast("Bitte einen Titel eingeben.");return}
 if(!validResourceUrl(url)){toast("Bitte einen gültigen http/https-Link eingeben.");return}
 try{
  await addDoc(collection(db,"learningResources"),{
   title,type,url,
   description:$("rDescription")?.value.trim()||"",
   subject:$("rSubject")?.value.trim()||"",
   competency:$("rCompetency")?.value.trim()||"",
   duration:$("rDuration")?.value.trim()||"",
   tags:($("rTags")?.value||"").split(",").map(x=>x.trim()).filter(Boolean),
   authorUid:currentUser.uid,authorName:profile?.displayName||currentUser.displayName||"Campus-Mitglied",
   createdAt:serverTimestamp(),createdAtMs:Date.now()
  });
  closeModal();await render();toast("Lernressource gespeichert.");
 }catch(e){console.error(e);toast("Speichern nicht möglich: "+(e.code||"Firestore-Fehler"))}
}
function setResourceFilter(t){
 activeResourceFilter=t;
 document.querySelectorAll("[data-resource-filter]").forEach(x=>x.classList.toggle("active",x.dataset.resourceFilter===t));
 filterResources();
}
function filterResources(){
 const q=($("resourceSearch")?.value||"").toLowerCase();
 document.querySelectorAll(".resource-card").forEach(c=>{
  c.style.display=(activeResourceFilter==="all"||c.dataset.resourceType===activeResourceFilter)&&c.textContent.toLowerCase().includes(q)?"":"none";
 });
}




async function renderJournal(){
 let entries=[],error="";
 try{
  const snap=await getDocs(query(collection(db,"learningJournal"),where("uid","==",currentUser.uid)));
  entries=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAtMs||0)-(a.createdAtMs||0));
 }catch(e){error=e?.message||String(e)}

 const total=entries.length;
 const counts={auf:entries.filter(e=>e.status==="auf-kurs").length,klaer:entries.filter(e=>e.status==="klaerungsbedarf").length,hand:entries.filter(e=>e.status==="handlungsbedarf").length};
 const latest=entries[0];

 return `${pageHead("LERNWERKSTATT","Lernjournal","Dokumentiere deinen Lernprozess in wenigen Minuten und mache deine Entwicklung sichtbar.",`<a class="secondary button" href="#lernwerkstatt">← Lernwerkstatt</a>`)}

 <div class="card" style="background:var(--soft-green)">
  <span class="badge">📓 DEIN LERNPROZESS</span>
  <h2 style="margin:8px 0 5px">Was habe ich heute gelernt?</h2>
  <p>Ein Eintrag dauert etwa <b>3–5 Minuten</b>. Halte fest, woran du gearbeitet hast, was du gelernt hast, wo du noch unsicher bist und was du als Nächstes tun möchtest.</p>
 </div>

 <div class="journal-summary">
  <div class="card"><strong>${total}</strong><small>Einträge</small></div>
  <div class="card"><strong>🟢 ${counts.auf}</strong><small>Auf Kurs</small></div>
  <div class="card"><strong>🟡 ${counts.klaer}</strong><small>Klärungsbedarf</small></div>
  <div class="card"><strong>🔴 ${counts.hand}</strong><small>Handlungsbedarf</small></div>
 </div>

 <div class="grid grid-2" style="margin-top:14px">
  <div class="card">
   <span class="badge">✍️ NEUER EINTRAG</span>
   <h3>Mein heutiger Lernschritt</h3>
   <div class="form">
    <label>Datum<input id="journalDate" type="date" value="${new Date().toISOString().slice(0,10)}"></label>
    <label>Daran habe ich gearbeitet
      <input id="journalTopic" placeholder="z. B. PP11 – Soziale Identität">
    </label>
    <label>Mein Lernziel
      <input id="journalGoal" placeholder="Was wollte ich heute verstehen, üben oder können?">
    </label>
    <label>Das habe ich heute gelernt
      <textarea id="journalLearned" rows="4" placeholder="2–4 Sätze: Was habe ich verstanden, gelernt oder anwenden können?"></textarea>
    </label>
    <label>Das ist mir noch nicht klar
      <textarea id="journalOpen" rows="3" placeholder="Wo bin ich noch unsicher oder brauche Hilfe?"></textarea>
    </label>
    <label>Mein Lernstand
      <div class="journal-status-options">
       <label class="status-option"><input type="radio" name="journalStatus" value="auf-kurs" checked> 🟢 <span><b>Auf Kurs</b><small>Ich kann den Inhalt erklären und anwenden.</small></span></label>
       <label class="status-option"><input type="radio" name="journalStatus" value="klaerungsbedarf"> 🟡 <span><b>Klärungsbedarf</b><small>Ich habe Teile verstanden, brauche aber noch Unterstützung.</small></span></label>
       <label class="status-option"><input type="radio" name="journalStatus" value="handlungsbedarf"> 🔴 <span><b>Handlungsbedarf</b><small>Ich muss gezielt weiterarbeiten.</small></span></label>
      </div>
    </label>
    <label>Was hat mir beim Lernen geholfen?
      <div class="journal-checks">
       <label><input type="checkbox" name="journalHelp" value="Lernauftrag"> Lernauftrag</label>
       <label><input type="checkbox" name="journalHelp" value="Lernressource"> Lernressource</label>
       <label><input type="checkbox" name="journalHelp" value="Methode"> Methode</label>
       <label><input type="checkbox" name="journalHelp" value="Austausch"> Austausch</label>
       <label><input type="checkbox" name="journalHelp" value="Lehrkraft"> Lehrkraft</label>
       <label><input type="checkbox" name="journalHelp" value="KI"> KI</label>
       <label><input type="checkbox" name="journalHelp" value="Üben"> eigenes Üben</label>
      </div>
    </label>
    <label>Mein nächster Schritt
      <select id="journalNextType">
       <option value="weiterlernen">→ Weiterlernen</option>
       <option value="ueben">→ Nochmals üben</option>
       <option value="ressource">→ Lernressource nutzen</option>
       <option value="methode">→ Andere Methode ausprobieren</option>
       <option value="austausch">→ Mitschüler fragen</option>
       <option value="coaching">→ Lerncoaching nutzen</option>
       <option value="einschaetzung">→ Kompetenz erneut einschätzen</option>
      </select>
    </label>
    <label>Mein konkreter nächster Schritt <span class="muted">(optional)</span>
      <input id="journalNext" placeholder="z. B. Ich bearbeite morgen noch einmal das Fallbeispiel.">
    </label>
    <button class="primary" type="button" onclick="window.saveJournalEntry()">📓 Eintrag speichern</button>
   </div>
  </div>

  <div class="card">
   <span class="badge">🧭 KURZREFLEXION</span>
   <h3>Dein Lernprozess in vier Fragen</h3>
   <div class="list">
    <div class="list-item"><div><strong>1. Woran habe ich gearbeitet?</strong><small>Thema und Lernziel kurz benennen.</small></div></div>
    <div class="list-item"><div><strong>2. Was kann ich jetzt besser?</strong><small>Das Wichtigste in eigenen Worten festhalten.</small></div></div>
    <div class="list-item"><div><strong>3. Wo brauche ich noch Unterstützung?</strong><small>Unsicherheiten konkret benennen.</small></div></div>
    <div class="list-item"><div><strong>4. Was mache ich als Nächstes?</strong><small>Einen realistischen nächsten Schritt wählen.</small></div></div>
   </div>
   <div class="notice" style="margin-top:12px">💡 Dein Lernjournal muss nicht perfekt formuliert sein. Entscheidend ist, dass du deinen eigenen Lernprozess ehrlich sichtbar machst.</div>
  </div>
 </div>

 <div class="card" style="margin-top:14px">
  <span class="badge">📈 MEINE LERNHISTORIE</span>
  <h2 style="margin:8px 0 5px">Meine Entwicklung</h2>
  ${latest?`<p><b>Letzter Eintrag:</b> ${esc(latest.date||"")} ${latest.topic?`· ${esc(latest.topic)}`:""} · ${latest.status==="auf-kurs"?"🟢 Auf Kurs":latest.status==="klaerungsbedarf"?"🟡 Klärungsbedarf":"🔴 Handlungsbedarf"}</p>`:""}
  <div class="journal-timeline">
   ${entries.length?entries.map(e=>`
    <article class="journal-history-item">
     <div class="journal-history-dot">${e.status==="auf-kurs"?"🟢":e.status==="klaerungsbedarf"?"🟡":"🔴"}</div>
     <div class="journal-history-content">
      <div class="journal-meta"><b>${esc(e.date||"")}</b><span>${esc(e.topic||"Lernprozess")}</span></div>
      ${e.goal?`<p><b>Lernziel:</b> ${esc(e.goal)}</p>`:""}
      ${e.learned?`<p><b>Gelernt:</b> ${esc(e.learned)}</p>`:""}
      ${e.open?`<p><b>Noch offen:</b> ${esc(e.open)}</p>`:""}
      ${e.next?`<p><b>Nächster Schritt:</b> ${esc(e.next)}</p>`:""}
     </div>
    </article>`).join(""):`<div class="empty"><strong>Noch keine Einträge.</strong><br>Dein erster Eintrag startet deine persönliche Lernhistorie.</div>`}
  </div>
  ${error?`<div class="notice" style="margin-top:12px"><b>Hinweis:</b> Die Lernhistorie konnte nicht vollständig geladen werden. ${esc(error)}</div>`:""}
 </div>
 ${footer()}`;
}

async function saveJournalEntry(){
 const status=document.querySelector('input[name="journalStatus"]:checked')?.value||"auf-kurs";
 const helps=[...document.querySelectorAll('input[name="journalHelp"]:checked')].map(x=>x.value);
 const data={
  uid:currentUser.uid,
  date:$("journalDate")?.value||new Date().toISOString().slice(0,10),
  topic:$("journalTopic")?.value.trim()||"",
  goal:$("journalGoal")?.value.trim()||"",
  learned:$("journalLearned")?.value.trim()||"",
  open:$("journalOpen")?.value.trim()||"",
  status,
  helps,
  nextType:$("journalNextType")?.value||"weiterlernen",
  next:$("journalNext")?.value.trim()||"",
  createdAt:serverTimestamp(),
  createdAtMs:Date.now()
 };
 if(!data.topic||!data.learned){toast("Bitte Thema und „Das habe ich heute gelernt“ ausfüllen.");return}
 try{
  await addDoc(collection(db,"learningJournal"),data);
  await render();
  toast("Lernjournal gespeichert.");
 }catch(e){
  console.error(e);
  toast("Speichern nicht möglich: "+(e.code||"Firestore-Fehler"));
 }
}
window.saveJournalEntry=saveJournalEntry;
async function saveJournalEntry(){
 const data={uid:currentUser.uid,date:$("journalDate")?.value||new Date().toISOString().slice(0,10),topic:$("journalTopic")?.value.trim()||"",learned:$("journalLearned")?.value.trim()||"",open:$("journalOpen")?.value.trim()||"",next:$("journalNext")?.value.trim()||"",status:$("journalStatus")?.value||"auf-kurs",createdAt:serverTimestamp(),createdAtMs:Date.now()};
 if(!data.learned&&!data.open&&!data.next){toast("Bitte mindestens eine Reflexion eintragen.");return}
 try{await addDoc(collection(db,"learningJournal"),data);await render();toast("Lernjournal-Eintrag gespeichert.")}catch(e){console.error(e);toast("Speichern nicht möglich: "+(e.code||"Firestore-Fehler"))}
}
window.saveJournalEntry=saveJournalEntry;
async function renderLerncoaching(){
 const coachingEmail=""; // Hier später die schulische Lerncoaching-E-Mail eintragen.

 return `${pageHead(
   "LERNWERKSTATT",
   "Lerncoaching",
   "Persönliche Unterstützung durch eine Lehrkraft, wenn du bei deinem Lernweg nicht weiterkommst.",
   `<a class="secondary button" href="#lernwerkstatt">← Lernwerkstatt</a>`
 )}
 <div class="card" style="background:var(--soft-green)">
   <span class="badge">💬 PERSÖNLICHE UNTERSTÜTZUNG</span>
   <h2 style="margin:8px 0 5px">Du musst deinen Lernweg nicht allein gehen.</h2>
   <p>Wenn du bei einem Lernziel, einer Aufgabe, deiner Lernorganisation oder deiner Selbsteinschätzung nicht weiterkommst, kannst du dich an eine Lehrkraft wenden.</p>
 </div>

 <div class="card" style="margin-top:14px">
   <div class="method-icon">✉️</div>
   <span class="badge">E-MAIL-KONTAKT</span>
   <h2 style="margin:7px 0">Lerncoaching anfragen</h2>
   <p>Beschreibe kurz, wobei du Unterstützung brauchst. Eine Lehrkraft kann sich anschließend bei dir melden und gemeinsam mit dir den nächsten Lernschritt klären.</p>
   ${coachingEmail
     ? `<a class="primary button" href="mailto:${coachingEmail}?subject=Lerncoaching%20Campusklasse">✉️ E-Mail an Lerncoaching</a>`
     : `<div class="notice"><b>E-Mail-Adresse noch nicht hinterlegt</b><br>In der app.js kann die schulische Lerncoaching-Adresse eingetragen werden.</div>`}
 </div>

 <div class="card" style="margin-top:14px">
   <h3>🧭 Wobei kann Lerncoaching helfen?</h3>
   <div class="grid grid-3">
    <div><span class="emoji">📚</span><h3>Lerninhalt</h3><p>Du verstehst einen Inhalt nicht oder weißt nicht, wie du weiterlernen sollst.</p></div>
    <div><span class="emoji">🗓️</span><h3>Lernorganisation</h3><p>Du brauchst Unterstützung bei Planung, Prioritäten oder deinem persönlichen Lernweg.</p></div>
    <div><span class="emoji">📊</span><h3>Lernstand</h3><p>Du hast Klärungs- oder Handlungsbedarf und möchtest wissen, was dein nächster sinnvoller Schritt ist.</p></div>
   </div>
 </div>

 <div class="card" style="margin-top:14px">
   <h3>✍️ Das kannst du in deiner E-Mail schreiben</h3>
   <div class="notice">
    <p><b>Mein Lernziel:</b> …</p>
    <p><b>Hier komme ich nicht weiter:</b> …</p>
    <p><b>Das habe ich bereits ausprobiert:</b> …</p>
    <p><b>Dabei wünsche ich mir Unterstützung:</b> …</p>
   </div>
 </div>

 <div class="card" style="margin-top:14px">
   <h3>💡 Kurz erklärt</h3>
   <p><b>Lerncoaching</b> bedeutet: Eine Lehrkraft unterstützt dich dabei, deinen eigenen Lernweg zu finden. Es geht nicht darum, dir die Lösung abzunehmen, sondern gemeinsam zu klären, <b>was du bereits kannst, wo du gerade festhängst und welcher nächste Schritt sinnvoll ist.</b></p>
 </div>
 ${footer()}`;
}


let currentImpulseCategory="all";
let currentImpulse=null;

const impulseData={
 quick:[
  {title:"Die 1-Satz-Idee",prompt:"Formuliere das Wichtigste, das du gerade gelernt hast, in genau einem Satz.",time:"1 Minute",action:"Schreiben"},
  {title:"Die offene Frage",prompt:"Welche eine Frage ist bei dir nach dem Lernen noch offen?",time:"1 Minute",action:"Nachdenken"},
  {title:"Ohne Unterlagen",prompt:"Schließe deine Unterlagen. Was sind die drei wichtigsten Dinge, die du noch weißt?",time:"1 Minute",action:"Abrufen"}
 ],
 verstehen:[
  {title:"Erkläre es einfach",prompt:"Erkläre den Inhalt so, als müsstest du ihn einer jüngeren Person erklären. Verwende möglichst wenige Fachbegriffe.",time:"2 Minuten",action:"Erklären"},
  {title:"Warum?",prompt:"Wähle eine zentrale Aussage. Frage fünfmal: „Warum ist das so?“ Notiere die wichtigste Begründung.",time:"3 Minuten",action:"Vertiefen"},
  {title:"Beispiel finden",prompt:"Finde ein eigenes Beispiel, das den Lerninhalt möglichst gut erklärt.",time:"2 Minuten",action:"Anwenden"}
 ],
 denken:[
  {title:"Perspektivwechsel",prompt:"Betrachte den Lerninhalt aus einer anderen Perspektive. Was würde eine andere Person dazu sagen?",time:"3 Minuten",action:"Perspektive wechseln"},
  {title:"Gegenbeispiel",prompt:"Finde ein Gegenbeispiel. Wann würde die Aussage nicht oder nur eingeschränkt gelten?",time:"3 Minuten",action:"Prüfen"},
  {title:"Was wäre wenn?",prompt:"Verändere eine wichtige Bedingung des Beispiels. Was würde sich dadurch verändern?",time:"3 Minuten",action:"Transfer"}
 ],
 anwenden:[
  {title:"Auf deinen Alltag übertragen",prompt:"Übertrage das Gelernte auf eine konkrete Situation aus deinem Alltag, Praktikum oder späteren Beruf.",time:"3 Minuten",action:"Transfer"},
  {title:"Fallbeispiel",prompt:"Erfinde selbst einen kurzen Fall, auf den du den Lerninhalt anwenden kannst.",time:"4 Minuten",action:"Anwenden"},
  {title:"Entscheidung treffen",prompt:"Stelle dir eine Situation vor, in der du das Gelernte nutzen musst. Welche Entscheidung würdest du treffen – und warum?",time:"3 Minuten",action:"Begründen"}
 ],
 wiederholen:[
  {title:"Gedächtnis-Check",prompt:"Schließe alle Unterlagen und schreibe fünf Dinge auf, die du noch weißt. Erst danach darfst du nachsehen.",time:"2 Minuten",action:"Abrufen"},
  {title:"3–2–1",prompt:"Schreibe 3 wichtige Begriffe, 2 Zusammenhänge und 1 offene Frage auf.",time:"2 Minuten",action:"Strukturieren"},
  {title:"Mini-Abfrage",prompt:"Stelle dir selbst drei Prüfungsfragen zum Thema und beantworte sie ohne Unterlagen.",time:"3 Minuten",action:"Selbsttest"}
 ],
 challenge:[
  {title:"Experten-Challenge",prompt:"Finde eine Grenze, Schwäche oder offene Frage des Konzepts. Begründe deine Einschätzung.",time:"5 Minuten",action:"Analysieren"},
  {title:"Vergleichen",prompt:"Vergleiche zwei Konzepte oder Erklärungen. Wo stimmen sie überein und wo unterscheiden sie sich?",time:"5 Minuten",action:"Analysieren"},
  {title:"Eigene Aufgabe entwickeln",prompt:"Entwickle selbst eine anspruchsvolle Prüfungs- oder Transferaufgabe zum Thema. Formuliere anschließend eine Musterlösung.",time:"7 Minuten",action:"Gestalten"}
 ],
 klärung:[
  {title:"Die Lücke finden",prompt:"Markiere genau die Stelle, an der du nicht mehr weiterkommst. Formuliere daraus eine konkrete Frage.",time:"2 Minuten",action:"Klärung"},
  {title:"Einen Schritt zurück",prompt:"Welchen Grundbegriff musst du vielleicht noch einmal klären, bevor du weitermachen kannst?",time:"2 Minuten",action:"Grundlage klären"},
  {title:"Hilfe auswählen",prompt:"Was würde dir jetzt am meisten helfen: Erklärung, Beispiel, Video, Übung, Austausch oder Lerncoaching?",time:"2 Minuten",action:"Unterstützung wählen"}
 ]
};

const impulseCategories=[
 ["all","🎲","Überraschungsimpuls"],
 ["quick","⚡","Quick Impulse"],
 ["verstehen","🧠","Verstehen"],
 ["denken","🔎","Nachdenken"],
 ["anwenden","✍️","Anwenden"],
 ["wiederholen","🔄","Wiederholen"],
 ["challenge","🔥","Challenge"],
 ["klärung","🟡","Wenn du hängst"]
];

function pickImpulse(cat="all"){
 let pool=cat==="all"?Object.values(impulseData).flat():impulseData[cat]||impulseData.quick;
 currentImpulse=pool[Math.floor(Math.random()*pool.length)];
 currentImpulseCategory=cat;
 renderImpulseCard();
}
function renderImpulseCard(){
 const box=$("impulseCard");
 if(!box||!currentImpulse)return;
 box.innerHTML=`<div class="impulse-card-inner">
  <div class="impulse-action">${esc(currentImpulse.action)} · ⏱ ${esc(currentImpulse.time)}</div>
  <h2>${esc(currentImpulse.title)}</h2>
  <p class="impulse-prompt">${esc(currentImpulse.prompt)}</p>
  <div class="impulse-response"><label>Deine kurze Antwort <span class="muted">(optional)</span><textarea id="impulseAnswer" rows="4" placeholder="Notiere deinen Gedanken …"></textarea></label></div>
  <div class="form-actions">
   <button class="secondary" type="button" onclick="window.pickImpulse('${currentImpulseCategory}')">↻ Anderen Impuls</button>
   <button class="primary" type="button" onclick="window.completeImpulse()">✓ Erledigt</button>
  </div>
 </div>`;
}
async function completeImpulse(){
 const answer=$("impulseAnswer")?.value.trim()||"";
 const item=currentImpulse;
 const cat=currentImpulseCategory;
 try{
  if(currentUser){
   await addDoc(collection(db,"learningImpulses"),{
    uid:currentUser.uid,title:item.title,category:cat,answer,completedAt:serverTimestamp(),completedAtMs:Date.now()
   });
  }
  const next=document.querySelector("#impulseNext");
  if(next) next.hidden=false;
  toast("Impuls abgeschlossen. Wie möchtest du weiterlernen?");
 }catch(e){toast("Impuls abgeschlossen.");const next=document.querySelector("#impulseNext");if(next)next.hidden=false}
}
window.pickImpulse=pickImpulse;window.completeImpulse=completeImpulse;


const assessmentData={
 title:"Soziale Identität – Kurzcheck",
 competence:"Ich kann erklären, wie soziale Identität entsteht, auf ein Fallbeispiel anwenden und auf eine eigene Situation übertragen.",
 parts:[
  {
   id:"understand",title:"🧠 Verstehen",short:"Begriff und Grundidee erklären",type:"text",
   prompt:"Erkläre in 2–3 Sätzen mit eigenen Worten, was soziale Identität bedeutet.",
   criteria:["Gruppenzugehörigkeit","Selbstbild / Selbstwahrnehmung","Bedeutung der Gruppe"],
   hints:["Zugehörigkeit zu einer Gruppe","Wahrnehmung des eigenen Selbst","Bedeutung der Gruppenzugehörigkeit"]
  },
  {
   id:"apply",title:"🔎 Anwenden",short:"Konzept auf eine Situation übertragen",type:"choice",
   prompt:"Eine Schülerin fühlt sich stark mit ihrer Klasse verbunden und bewertet andere Klassen zunehmend negativ. Welches Konzept passt am besten?",
   options:["Nur persönliche Identität","Soziale Identität und Ingroup/Outgroup","Klassische Konditionierung","Selbstwirksamkeit"],
   correct:1,
   follow:"Begründe in 1–2 Sätzen, woran du das erkennst."
  },
  {
   id:"transfer",title:"🎯 Transfer",short:"Eigenes Beispiel entwickeln",type:"text",
   prompt:"Nenne ein eigenes Beispiel aus Alltag, Schule oder Praktikum, bei dem soziale Identität eine Rolle spielen könnte, und begründe kurz warum.",
   criteria:["konkrete Situation","Gruppenzugehörigkeit","Einfluss auf Wahrnehmung / Verhalten"],
   hints:["konkrete Situation","Zugehörigkeit zu einer Gruppe","Einfluss auf Wahrnehmung oder Verhalten"]
  }
 ]
};
let assessmentState={step:0,answers:{},self:"",results:null};

function resetAssessment(){
 assessmentState={step:0,answers:{},self:"",results:null};
}
function assessmentIntro(){
 return `${pageHead("LERNWERKSTATT","Lernstandsmessung","Ein kurzer Kompetenz-Check: Nicht nur einschätzen – ausprobieren, ob du es wirklich kannst.",`<a class="secondary button" href="#lernwerkstatt">← Lernwerkstatt</a>`)}
 <div class="card" style="background:var(--soft-green)">
  <span class="badge">📊 LERNSTANDSMESSUNG</span>
  <h2 style="margin:8px 0 5px">${assessmentData.title}</h2>
  <p>${assessmentData.competence}</p>
 </div>
 <div class="card" style="margin-top:14px">
  <span class="badge">1 · DEINE SELBSTEINSCHÄTZUNG</span>
  <h3>Wie sicher fühlst du dich gerade?</h3>
  <div class="assessment-self">
   <label class="assessment-choice"><input type="radio" name="assessmentSelf" value="auf-kurs">🟢 <b>Auf Kurs</b><small>Ich glaube, ich kann es erklären und anwenden.</small></label>
   <label class="assessment-choice"><input type="radio" name="assessmentSelf" value="klaerungsbedarf">🟡 <b>Klärungsbedarf</b><small>Ich verstehe Teile, bin aber noch unsicher.</small></label>
   <label class="assessment-choice"><input type="radio" name="assessmentSelf" value="handlungsbedarf">🔴 <b>Handlungsbedarf</b><small>Ich brauche noch grundlegende Unterstützung.</small></label>
  </div>
  <button class="primary" type="button" onclick="window.startAssessment()">🔎 Kurzcheck starten</button>
 </div>
 <div class="card" style="margin-top:14px">
  <span class="badge">SO FUNKTIONIERT DER CHECK</span>
  <div class="grid grid-3">
   <div><span class="emoji">🧠</span><h3>Verstehen</h3><p>Kannst du den Inhalt erklären?</p></div>
   <div><span class="emoji">🔎</span><h3>Anwenden</h3><p>Kannst du ihn auf eine Situation übertragen?</p></div>
   <div><span class="emoji">🎯</span><h3>Transfer</h3><p>Kannst du selbstständig ein Beispiel entwickeln?</p></div>
  </div>
 </div>
 ${footer()}`;
}
function assessmentStep(){
 const p=assessmentData.parts[assessmentState.step];
 const total=assessmentData.parts.length;
 return `${pageHead("LERNSTANDSMESSUNG",p.title,p.short,`<button class="secondary" type="button" onclick="window.renderAssessmentPage()">Abbrechen</button>`)}
 <div class="assessment-progress"><span>Aufgabe ${assessmentState.step+1} von ${total}</span><div><i style="width:${((assessmentState.step+1)/total)*100}%"></i></div></div>
 <div class="card assessment-question">
  <span class="badge">${esc(p.title)}</span>
  <h2>${esc(p.prompt)}</h2>
  ${p.type==="choice"?`
   <div class="assessment-options">${p.options.map((o,i)=>`<label><input type="radio" name="assessmentAnswer" value="${i}"> ${esc(o)}</label>`).join("")}</div>
   <label>Kurze Begründung<textarea id="assessmentFollow" rows="4" placeholder="${esc(p.follow||"Begründe deine Antwort kurz.")}"></textarea></label>
  `:`
   <label>Deine Antwort<textarea id="assessmentAnswerText" rows="6" placeholder="Formuliere deine Antwort in eigenen Worten …"></textarea></label>
   <div class="notice"><b>💡 Tipp:</b> Achte auf die wesentlichen Aspekte und schreibe nicht einfach aus einer Lernressource ab.</div>
  `}
  <div class="form-actions">
   ${assessmentState.step>0?`<button class="secondary" type="button" onclick="window.assessmentBack()">← Zurück</button>`:""}
   <button class="primary" type="button" onclick="window.assessmentNext()">${assessmentState.step===total-1?"Auswerten →":"Weiter →"}</button>
  </div>
 </div>
 ${footer()}`;
}
function scoreOpen(answer,criteria){
 const a=(answer||"").toLowerCase();
 const hits=criteria.filter(c=>{
  const words=c.toLowerCase().split(/[ /]+/).filter(w=>w.length>4);
  return words.some(w=>a.includes(w));
 });
 return {hits:hits.length,total:criteria.length,percent:criteria.length?Math.round(hits.length/criteria.length*100):0,criteria:hits};
}
function buildAssessmentResults(){
 const a=assessmentState.answers;
 const r1=scoreOpen(a.understand?.text||"",assessmentData.parts[0].criteria);
 const r2=a.apply?.choice===1?100:0;
 const follow=(a.apply?.follow||"").toLowerCase();
 const r2bonus=(follow.includes("ingroup")||follow.includes("outgroup")||follow.includes("gruppe"))?Math.min(100,r2+0):r2;
 const r3=scoreOpen(a.transfer?.text||"",assessmentData.parts[2].criteria);
 const scores=[r1.percent,r2bonus,r3.percent];
 const avg=Math.round(scores.reduce((x,y)=>x+y,0)/scores.length);
 let status=avg>=80?"auf-kurs":avg>=50?"klaerungsbedarf":"handlungsbedarf";
 // Open responses are deliberately labelled as a preliminary self-check; they are not presented as a teacher-grade.
 return {scores,avg,status,r1,r2:r2bonus,r3};
}
async function startAssessment(){
 assessmentState.self=document.querySelector('input[name="assessmentSelf"]:checked')?.value||"";
 assessmentState.step=0;assessmentState.answers={};assessmentState.results=null;
 await renderAssessmentPage();
}
function assessmentNext(){
 const p=assessmentData.parts[assessmentState.step];
 if(p.type==="choice"){
  const choice=document.querySelector('input[name="assessmentAnswer"]:checked');
  if(!choice){toast("Bitte wähle eine Antwort.");return}
  assessmentState.answers[p.id]={choice:Number(choice.value),follow:$("assessmentFollow")?.value.trim()||""};
 }else{
  const text=$("assessmentAnswerText")?.value.trim()||"";
  if(!text){toast("Bitte beantworte die Aufgabe.");return}
  assessmentState.answers[p.id]={text};
 }
 if(assessmentState.step<assessmentData.parts.length-1){assessmentState.step++;renderAssessmentPage()}
 else {assessmentState.results=buildAssessmentResults();renderAssessmentPage()}
}
function assessmentBack(){
 if(assessmentState.step>0){assessmentState.step--;renderAssessmentPage()}
}
async function saveAssessmentToJournal(){
 if(!assessmentState.results){return}
 const r=assessmentState.results;
 const label=r.status==="auf-kurs"?"🟢 Auf Kurs":r.status==="klaerungsbedarf"?"🟡 Klärungsbedarf":"🔴 Handlungsbedarf";
 try{
  await addDoc(collection(db,"learningAssessments"),{
   uid:currentUser.uid,competence:assessmentData.competence,selfAssessment:assessmentState.self,
   results:r,status:r.status,createdAt:serverTimestamp(),createdAtMs:Date.now()
  });
  await addDoc(collection(db,"learningJournal"),{
   uid:currentUser.uid,date:new Date().toISOString().slice(0,10),topic:assessmentData.title,
   goal:assessmentData.competence,learned:`Lernstandsmessung: ${label}. Ergebnis ${r.avg}%.`,
   open:r.status==="auf-kurs"?"Keine zentrale Lücke erkannt.":"Einzelne Teilkompetenzen sollten weiter geübt werden.",
   status:r.status,helps:["Lernstandsmessung"],nextType:r.status==="auf-kurs"?"weiterlernen":"ueben",
   next:r.status==="auf-kurs"?"Wissen vertiefen und anwenden.":"Die schwächste Teilkompetenz gezielt weiterlernen und danach erneut testen.",
   createdAt:serverTimestamp(),createdAtMs:Date.now()
  });
  toast("Ergebnis im Lernjournal gespeichert.");
 }catch(e){toast("Ergebnis konnte nicht gespeichert werden.");console.error(e)}
}
async function renderAssessmentPage(){
 const appEl=$("app")||document.querySelector("main");
 if(!appEl)return;
 if(!assessmentState.results){appEl.innerHTML=assessmentState.step===0?assessmentIntro():assessmentStep();return}
 const r=assessmentState.results;
 const statusLabel=r.status==="auf-kurs"?"🟢 Auf Kurs":r.status==="klaerungsbedarf"?"🟡 Klärungsbedarf":"🔴 Handlungsbedarf";
 const recommendation=r.status==="auf-kurs"?"Du kannst den Inhalt bereits erklären, anwenden und übertragen. Vertiefe dein Wissen oder nutze einen Challenge-Impuls.":r.status==="klaerungsbedarf"?"Die Grundidee ist teilweise vorhanden. Arbeite gezielt an der schwächsten Teilkompetenz und teste dich danach erneut.":"Gehe einen Schritt zurück und bearbeite die Grundlagen erneut. Nutze eine Lernressource, Methode oder Lerncoaching.";
 appEl.innerHTML=`${pageHead("LERNSTANDSMESSUNG","Dein Ergebnis","Die Auswertung zeigt dir, welche Teilkompetenzen schon sicher sind und wo dein nächster Lernschritt liegt.",`<a class="secondary button" href="#lernwerkstatt">← Lernwerkstatt</a>`)}
 <div class="card assessment-result" style="background:var(--soft-green)">
  <span class="badge">📊 DEIN LERNSTAND</span><div class="assessment-status">${statusLabel}</div>
  <p>${recommendation}</p>
 </div>
 <div class="assessment-results-grid">
  ${[["🧠","Verstehen",r.r1.percent],["🔎","Anwenden",r.r2],["🎯","Transfer",r.r3.percent]].map(x=>`<div class="card"><span class="emoji">${x[0]}</span><h3>${x[1]}</h3><strong class="assessment-score">${x[2]}%</strong><p>${x[2]>=80?"🟢 sicher":x[2]>=50?"🟡 noch unsicher":"🔴 weiterlernen"}</p></div>`).join("")}
 </div>
 <div class="card" style="margin-top:14px">
  <span class="badge">🔎 VORHER / NACHHER</span>
  <h3>Deine Selbsteinschätzung im Vergleich</h3>
  <p><b>Vor dem Check:</b> ${assessmentState.self==="auf-kurs"?"🟢 Auf Kurs":assessmentState.self==="klaerungsbedarf"?"🟡 Klärungsbedarf":assessmentState.self==="handlungsbedarf"?"🔴 Handlungsbedarf":"nicht angegeben"}</p>
  <p><b>Nach dem Check:</b> ${statusLabel}</p>
  ${assessmentState.self&&assessmentState.self!==r.status?`<div class="notice">💡 Deine Einschätzung und dein Kurzcheck unterscheiden sich. Das ist nicht schlecht – genau daraus kannst du etwas über dein Lernen erfahren.</div>`:""}
 </div>
 <div class="card" style="margin-top:14px"><h3>🚀 Dein nächster Schritt</h3><div class="form-actions">
  <a class="primary button" href="${r.status==="auf-kurs"?"#impulse":"#ressourcen"}">${r.status==="auf-kurs"?"💡 Challenge-Impuls":"📚 Lernressource"}</a>
  <a class="secondary button" href="#methoden">🧰 Methode</a>
  <a class="secondary button" href="#lernpfad">🧭 Lernpfad</a>
  <a class="secondary button" href="#journal">📓 Lernjournal</a>
  ${r.status!=="auf-kurs"?`<a class="secondary button" href="#lerncoaching">💬 Lerncoaching</a>`:""}
  <button class="secondary" type="button" onclick="window.saveAssessmentToJournal()">📓 Ergebnis speichern</button>
  <button class="secondary" type="button" onclick="window.resetAssessment();window.renderAssessmentPage()">↻ Noch einmal testen</button>
 </div></div>${footer()}`;
}
window.startAssessment=startAssessment;window.assessmentNext=assessmentNext;window.assessmentBack=assessmentBack;window.renderAssessmentPage=renderAssessmentPage;window.saveAssessmentToJournal=saveAssessmentToJournal;window.resetAssessment=resetAssessment;

async function renderMessung(){ return renderAssessmentPage(); }
async function renderImpulse(){
 currentImpulse=null;
 return `${pageHead("LERNWERKSTATT","Lernimpulse","Ein kleiner interaktiver Anstoß für deinen nächsten Lernschritt.",`<a class="secondary button" href="#lernwerkstatt">← Lernwerkstatt</a>`)}
 <div class="card" style="background:var(--soft-green)">
  <span class="badge">💡 LERNIMPULSE</span>
  <h2 style="margin:8px 0 5px">Was brauchst du gerade?</h2>
  <p>Wähle einen Bereich oder lass dich überraschen. Die Impulse sind bewusst kurz und führen anschließend zurück in deinen Lernprozess.</p>
 </div>
 <div class="impulse-categories">
  ${impulseCategories.map(c=>`<button class="impulse-category" type="button" onclick="window.pickImpulse('${c[0]}')"><span>${c[1]}</span><b>${c[2]}</b></button>`).join("")}
 </div>
 <div id="impulseCard" class="card impulse-main">
  <div class="impulse-placeholder"><span>🎲</span><h2>Dein Impuls wartet</h2><p>Wähle oben einen Bereich.</p><button class="primary" type="button" onclick="window.pickImpulse('all')">🎲 Überraschungsimpuls</button></div>
 </div>
 <div id="impulseNext" class="card" style="margin-top:14px" hidden>
  <span class="badge">➡️ DEIN NÄCHSTER SCHRITT</span>
  <h3>Was möchtest du jetzt tun?</h3>
  <div class="form-actions">
   <button class="primary" type="button" onclick="location.hash='lernwerkstatt'">Weiterlernen</button>
   <a class="secondary button" href="#ressourcen">📚 Lernressource</a>
   <a class="secondary button" href="#methoden">🧰 Methode</a>
   <a class="secondary button" href="#lernpfad">🧭 Lernpfad</a>
   <a class="secondary button" href="#journal">📓 Lernjournal</a>
  </div>
 </div>
 <div class="card" style="margin-top:14px">
  <span class="badge">🔄 SO FUNKTIONIERT ES</span>
  <div class="grid grid-3">
   <div><span class="emoji">1️⃣</span><h3>Impuls wählen</h3><p>Was möchtest du gerade erreichen?</p></div>
   <div><span class="emoji">2️⃣</span><h3>Kurz bearbeiten</h3><p>Denke, schreibe oder probiere etwas aus.</p></div>
   <div><span class="emoji">3️⃣</span><h3>Weiterlernen</h3><p>Wähle deinen nächsten sinnvollen Schritt.</p></div>
  </div>
 </div>
 ${footer()}`;
}
async function renderMethoden(){
 const methods=[
 ["🧠","Verstehen & Erklären","Neue Inhalte durchdringen.","Erkläre einen Inhalt in eigenen Worten und nutze Warum-Fragen, Beispiele und Gegenbeispiele.","Kann ich es jemand anderem verständlich erklären?"],
 ["🗂️","Strukturieren","Zusammenhänge sichtbar machen.","Nutze Mindmap, Concept Map, Tabelle oder Ablaufdiagramm.","Wie hängen die Dinge miteinander zusammen?"],
 ["🔄","Wiederholen & Festigen","Wissen dauerhaft abrufen.","Nutze Active Recall, Karteikarten, Selbstabfrage oder Spaced Repetition.","Kann ich es ohne Unterlagen abrufen?"],
 ["✍️","Anwenden","Wissen übertragen.","Bearbeite Fallbeispiele, Transferaufgaben und entwickle eigene Beispiele.","Kann ich mein Wissen in einer neuen Situation verwenden?"],
 ["🔎","Analysieren","Sachverhalte untersuchen.","Arbeite mit Fallanalyse, Textanalyse, Vergleich und Perspektivwechsel.","Kann ich einen Sachverhalt systematisch untersuchen?"],
 ["🗣️","Lernen durch Austausch","Durch andere besser verstehen.","Nutze Lerntandem, Partnererklärung, Peer Teaching und gegenseitige Befragung.","Kann ich durch Austausch besser verstehen?"],
 ["📝","Schreiben & Verarbeiten","Inhalte selbst strukturieren.","Nutze Zusammenfassung, Exzerpt, Lernzettel oder One-Pager.","Kann ich den Inhalt in meinen eigenen Worten darstellen?"],
 ["🎯","Prüfungsvorbereitung","Gezielt für Leistungsnachweise lernen.","Nutze Prüfungssimulation, Selbsttests, Zeitdruck und Fehleranalyse.","Was kann ich sicher – und wo liegen meine Lücken?"],
 ["🌱","Lernprozess steuern","Den nächsten Lernschritt bestimmen.","Formuliere ein Lernziel, schätze dich ein, wähle eine Methode und prüfe den Fortschritt.","Was brauche ich jetzt, um weiterzukommen?"],
 ["🤖","Mit KI lernen","KI als Lernpartner einsetzen.","Lass dich erklären, abfragen oder mit Feedback unterstützen – ohne deine Eigenleistung abzugeben.","Wie kann KI meinen Lernprozess unterstützen?"]
 ];
 return `${pageHead("LERNWERKSTATT","Methoden","Wähle eine Methode passend zu deinem aktuellen Lernziel.",`<a class="secondary button" href="#lernwerkstatt">← Lernwerkstatt</a>`)}
 <div class="card" style="background:var(--soft-green)"><span class="badge">🧰 LERNWERKZEUGKASTEN</span><h2 style="margin:8px 0 5px">Was möchtest du gerade erreichen?</h2><p>Wähle die Methode nach deinem Lernziel – nicht danach, welche Methode du schon kennst.</p></div>
 <div class="method-grid">${methods.map((m,i)=>`<article class="card method-card"><div class="method-number">${i+1}</div><div class="method-icon">${m[0]}</div><h3>${m[1]}</h3><p><b>${m[2]}</b></p><div class="notice"><b>So geht's</b><br>${m[3]}</div><p class="method-question"><b>Leitfrage:</b> ${m[4]}</p></article>`).join("")}</div>
 <div class="card" style="margin-top:14px"><span class="badge">🔄 LERNKREISLAUF</span><h2 style="margin:8px 0 5px">Passende Methode zum Lernstand</h2><div class="grid grid-3"><div><span class="emoji">🟢</span><h3>Auf Kurs</h3><p>Vertiefen, anwenden oder selbstständig weiterlernen.</p></div><div><span class="emoji">🟡</span><h3>Klärungsbedarf</h3><p>Gezielt verstehen, strukturieren oder üben.</p></div><div><span class="emoji">🔴</span><h3>Handlungsbedarf</h3><p>Grundlagen erneut bearbeiten und Unterstützung nutzen.</p></div></div></div>
 <div class="card" style="margin-top:14px"><h3>🚀 Weiterlernen</h3><div class="form-actions"><a class="primary button" href="#ressourcen">📚 Lernressourcen</a><a class="secondary button" href="#ki-lernen">🤖 KI zum Lernen</a><a class="secondary button" href="#lernpfad">🧭 Persönlicher Lernpfad</a></div></div>
 ${footer()}`;
}

async function renderLernpfad(){
 const steps=[
  ["1","🎯","Lernziel wählen","Was möchtest du am Ende können?","Wähle eine konkrete Kompetenz oder ein Lernziel."],
  ["2","📝","Lernauftrag","Was sollst du konkret tun?","Bearbeite einen Lernauftrag, der dich Schritt für Schritt zum Lernziel führt."],
  ["3","📚","Lernressourcen","Womit kannst du lernen?","Nutze passende TaskCards, Videos, ByCS/mebis, KI-Angebote oder Webseiten."],
  ["4","🧰","Methode wählen","Wie kannst du am besten lernen?","Wähle z. B. Verstehen, Strukturieren, Wiederholen, Anwenden oder Analysieren."],
  ["5","🤖","KI zum Lernen","Wie kann KI dich unterstützen?","Lass dich erklären, abfragen oder mit Feedback begleiten – ohne deine Eigenleistung abzugeben."],
  ["6","📊","Selbsteinschätzung","Wo stehst du jetzt?","Schätze dich ein: Auf Kurs, Klärungsbedarf oder Handlungsbedarf."],
  ["7","📓","Reflektieren","Was hast du gelernt?","Halte im Lernjournal fest, was du verstanden hast, was noch offen ist und was dein nächster Schritt ist."]
 ];
 return `${pageHead("LERNWERKSTATT","Persönlicher Lernpfad","Dein Weg vom Lernziel zum eigenen Können – mit passenden Aufgaben, Ressourcen, Methoden und Reflexion.",`<a class="secondary button" href="#lernwerkstatt">← Lernwerkstatt</a>`)}
 <div class="card" style="background:var(--soft-green)">
   <span class="badge">🧭 DEIN PERSÖNLICHER LERNPFAD</span>
   <h2 style="margin:8px 0 5px">Nicht einfach Aufgaben abarbeiten – den eigenen Lernweg gestalten.</h2>
   <p>Der Lernpfad verbindet die Bereiche der Lernwerkstatt. Du entscheidest, was du lernen möchtest, wählst passende Unterstützung und überprüfst anschließend selbst, wie sicher du bist.</p>
 </div>
 <div class="learning-path" style="margin-top:14px">
   ${steps.map((s,i)=>`
     <article class="card path-step">
       <div class="path-number">${s[0]}</div><div class="path-icon">${s[1]}</div>
       <div><span class="badge">${s[2]}</span><h3>${s[3]}</h3><p>${s[4]}</p></div>
     </article>${i<steps.length-1?`<div class="path-arrow">↓</div>`:""}
   `).join("")}
 </div>
 <div class="card" style="margin-top:14px">
   <span class="badge">🔄 DER LERNKREISLAUF</span>
   <h2 style="margin:8px 0 5px">Die Selbsteinschätzung bestimmt den nächsten Schritt</h2>
   <div class="grid grid-3" style="margin-top:10px">
     <div class="card"><span class="emoji">🟢</span><h3>Auf Kurs</h3><p>Weiterlernen, anwenden oder Wissen vertiefen.</p></div>
     <div class="card"><span class="emoji">🟡</span><h3>Klärungsbedarf</h3><p>Gezielt eine passende Ressource oder Methode wählen.</p></div>
     <div class="card"><span class="emoji">🔴</span><h3>Handlungsbedarf</h3><p>Einen Schritt zurückgehen, Unterstützung holen und erneut lernen.</p></div>
   </div>
 </div>
 <div class="card" style="margin-top:14px">
   <h3>🚀 Direkt einsteigen</h3><p>Springe direkt in den passenden Bereich.</p>
   <div class="form-actions">
     <a class="primary button" href="#ressourcen">📚 Lernressourcen</a>
     <a class="secondary button" href="#methoden">🧰 Methoden</a>
     <a class="secondary button" href="#ki-lernen">🤖 KI zum Lernen</a>
     <a class="secondary button" href="#kompetenz">📊 Lernstand</a>
     <a class="secondary button" href="#journal">📓 Lernjournal</a>
   </div>
 </div>
 ${footer()}`;
}
async function renderRessourcen(){
 let rs=[],err="";
 try{rs=await loadResources()}catch(e){err=e?.message||String(e)}
 const teacher=isTeacher();
 return `${pageHead("LERNWERKSTATT","Lernressourcen","TaskCards, KI, Videos, ByCS/mebis und weitere Lernangebote.",teacher?`<button class="primary" onclick="window.openResourceForm()">＋ Lernressource</button>`:`<a class="secondary button" href="#lernwerkstatt">← Lernwerkstatt</a>`)}
 <div class="card resource-library-intro"><span class="badge">📚 LERNRESSOURCEN-BIBLIOTHEK</span><h2 style="margin:8px 0">Ein Ort für dein Weiterlernen</h2><p>Finde passende Lernangebote an einem Ort.</p></div>
 <div class="resource-toolbar"><input id="resourceSearch" class="search" placeholder="🔎 Lernressource suchen …" oninput="window.filterResources()"><div class="chips">
 <button class="chip active" data-resource-filter="all" onclick="window.setResourceFilter('all')">Alle</button>
 ${Object.entries(RESOURCE_TYPES).map(([k,v])=>`<button class="chip" data-resource-filter="${k}" onclick="window.setResourceFilter('${k}')">${v.icon} ${v.label}</button>`).join("")}
 </div></div>
 ${err?`<div class="card"><b>Lernressourcen konnten nicht geladen werden.</b><p>${esc(err)}</p></div>`:""}
 <div class="resource-grid">${rs.length?rs.map(resourceCard).join(""):`<div class="empty"><strong>Noch keine Lernressourcen</strong><br>${teacher?"Lege die erste Ressource an.":"Hier werden bald Lernangebote bereitstehen."}</div>`}</div>
 ${footer()}`;
}
window.openResourceForm=openResourceForm;window.updateResourceType=updateResourceType;window.saveResource=saveResource;window.setResourceFilter=setResourceFilter;window.filterResources=filterResources;
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

async function render(){
 if(!currentUser)return;
 const p=location.hash.replace("#","")||"start";
 const pages={start:renderStart,kompass:renderKompass,lernwerkstatt:renderLernwerkstatt,methoden:renderMethoden,impulse:renderImpulse,messung:renderMessung,lernpfad:renderLernpfad,lerncoaching:renderLerncoaching,ressourcen:renderRessourcen,forum:renderForum,projekte:renderProjekte,kompetenz:renderKompetenz,journal:renderJournal,praktikum:renderPraktikum,ki:renderKI,kalender:renderKalender,team:renderTeam};
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
