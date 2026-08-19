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
 const cards=[
  ["🧭","Persönlicher Lernpfad","Deine Lernziele, nächste Schritte und dein persönlicher Weg.","lernpfad"],
  ["💬","Lerncoaching","Kurz erklärt, was Lerncoaching ist – mit direktem Kontakt zu einer Lehrkraft.","lerncoaching"],
  ["🧰","Lernmethoden","Methoden für Verstehen, Strukturieren, Üben, Anwenden und Reflektieren.","methoden"],
  ["📚","Lernressourcen","TaskCards, KI-Lernressourcen, Videos, ByCS/mebis und weitere Lernangebote.","ressourcen"],
  ["💡","Lernimpulse","Kurze interaktive Anstöße für deinen nächsten Lernschritt.","impulse"],
  ["📊","Lernstandsmessung","Kurz prüfen: Kann ich es wirklich – und was ist mein nächster Schritt?","messung"],
  ["🤖","KI zum Lernen","KI als Lernpartner nutzen: erklären, fragen, prüfen und reflektieren.","ki-lernen"]
 ];
 return `${pageHead("SELBSTSTÄNDIG LERNEN","Lernwerkstatt","Ein übersichtlicher Lernraum: Du entscheidest, was du lernen möchtest, wie du lernst und welche Unterstützung du brauchst.",`<a class="secondary button" href="#journal">📓 Lernjournal</a>`)}
 <div class="card" style="background:var(--soft-green)">
   <span class="badge">🧭 DEIN LERNWEG</span>
   <h2 style="margin:8px 0 5px">Vom Lernziel zum nächsten Schritt</h2>
   <p>Wähle den Bereich, der gerade zu deinem Lernprozess passt. Du musst nicht alles gleichzeitig nutzen.</p>
   <div class="chips" style="margin-top:10px">
    <span class="chip">🎯 Ziel klären</span><span class="chip">📚 Lernen</span><span class="chip">🔎 Überprüfen</span><span class="chip">🚀 Weiterlernen</span>
   </div>
 </div>
 <div class="grid grid-3 lernwerkstatt-grid">${cards.map(c=>`<a class="card tile lernwerkstatt-card" href="#${c[3]}"><span class="emoji">${c[0]}</span><strong>${c[1]}</strong><small>${c[2]}</small><span class="tile-arrow">→</span></a>`).join("")}</div>
 <div class="card" style="margin-top:12px">
   <span class="badge">💡 WENN DU NICHT WEITERKOMMST</span>
   <h3>Du musst nicht allein weiterprobieren.</h3>
   <p>Starte mit einem Lernimpuls, suche eine passende Ressource, probiere eine andere Methode oder nimm Kontakt zum Lerncoaching auf.</p>
   <div class="form-actions">
    <a class="primary button" href="#impulse">💡 Lernimpuls</a>
    <a class="secondary button" href="#ressourcen">📚 Ressource</a>
    <a class="secondary button" href="#lerncoaching">💬 Lerncoaching</a>
   </div>
 </div>${footer()}`;
}


const lernMethodenData=[
 ["🧩","Aktives Abrufen","Unterlagen schließen und aus dem Gedächtnis erklären, auflisten oder beantworten.","Verstehen & Wiederholen"],
 ["🗂️","3–2–1-Methode","3 wichtige Begriffe, 2 Zusammenhänge und 1 offene Frage festhalten.","Strukturieren"],
 ["🗣️","Erklären in eigenen Worten","Einen Inhalt so erklären, dass ihn eine andere Person verstehen könnte.","Verstehen"],
 ["🔄","Lernstoff übertragen","Das Gelernte auf ein neues Beispiel aus Schule, Alltag oder Praktikum anwenden.","Anwenden"],
 ["❓","Fragen erzeugen","Selbst Prüfungsfragen entwickeln und anschließend beantworten.","Prüfen"],
 ["🧠","Vergleichen","Zwei Konzepte gegenüberstellen: Gemeinsamkeiten, Unterschiede und Grenzen.","Analysieren"],
 ["🎯","Mini-Lernziel","Ein großes Ziel in einen konkreten, heute erreichbaren Lernschritt zerlegen.","Planen"],
 ["🔎","Fehleranalyse","Nicht nur verbessern, sondern klären: Was war mein Denkfehler und wie vermeide ich ihn?","Reflektieren"]
];

const lernRessourcenData=[
 ["🎴","TaskCards","Interaktive Lernkarten und Materialsammlungen.","TaskCard","https://www.taskcards.de/"],
 ["🤖","KI-Lernressource","Zum Beispiel fobizz: KI-Werkzeuge und Lernangebote für Schule.","KI-Lernressource","https://fobizz.com/"],
 ["🎬","Video-Link","Ein Lernvideo gezielt zur Erklärung oder Wiederholung nutzen.","Video",""],
 ["📚","ByCS / mebis","Lernangebote und digitale Lernumgebungen des bayerischen Schulbereichs.","ByCS / mebis","https://www.bycs.de/"],
 ["🌐","Externer Link","Eine von der Lehrkraft bereitgestellte Webseite oder Quelle.","Externer Link",""],
 ["🔗","Webseite","Eine frei zugängliche Webseite als ergänzende Lernquelle.","Webseite",""]
];

const lernImpulseData=[
 ["⚡","Quick Impuls","Formuliere das Wichtigste, das du gerade gelernt hast, in einem Satz.","1 Minute"],
 ["🧠","Erkläre es einfach","Erkläre den Inhalt ohne Fachbegriffe, als würdest du ihn einer jüngeren Person erklären.","2 Minuten"],
 ["🔎","Gegenbeispiel","Finde ein Beispiel, bei dem die Aussage nicht oder nur eingeschränkt gilt.","3 Minuten"],
 ["✍️","Auf den Alltag übertragen","Übertrage das Gelernte auf eine konkrete Situation aus Alltag, Schule oder Praktikum.","3 Minuten"],
 ["🔄","Gedächtnis-Check","Schließe die Unterlagen und notiere fünf Dinge, die du noch weißt. Vergleiche erst danach.","2 Minuten"],
 ["🔥","Challenge","Finde eine Grenze, Schwäche oder offene Frage des Konzepts und begründe deine Einschätzung.","5 Minuten"],
 ["🟡","Die Lücke finden","Markiere genau die Stelle, an der du nicht weiterkommst, und formuliere daraus eine konkrete Frage.","2 Minuten"]
];

function lernPathLoad(){
 try{return JSON.parse(localStorage.getItem("campus_lernpfad_"+(currentUser?.uid||"guest"))||"[]")}catch(e){return[]}
}
function lernPathSave(items){
 try{localStorage.setItem("campus_lernpfad_"+(currentUser?.uid||"guest"),JSON.stringify(items))}catch(e){console.warn(e)}
}
function addPathStep(){
 const title=prompt("Was möchtest du als Nächstes lernen oder erreichen?");
 if(!title?.trim())return;
 const items=lernPathLoad();
 items.unshift({id:Date.now(),title:title.trim(),done:false});
 lernPathSave(items);
 render();
}
function togglePathStep(id){
 const items=lernPathLoad().map(x=>x.id===id?{...x,done:!x.done}:x);
 lernPathSave(items);render();
}
function deletePathStep(id){
 const items=lernPathLoad().filter(x=>x.id!==id);
 lernPathSave(items);render();
}
window.addPathStep=addPathStep;
window.togglePathStep=togglePathStep;
window.deletePathStep=deletePathStep;

async function renderLernpfad(){
 const items=lernPathLoad();
 const done=items.filter(x=>x.done).length;
 return `${pageHead("PERSÖNLICH","Persönlicher Lernpfad","Deine eigenen Lernziele und nächsten Schritte – einfach, übersichtlich und veränderbar.",`<button class="primary" onclick="addPathStep()">＋ Lernschritt</button>`)}
 <div class="grid grid-3">
  <div class="card stat"><b>${items.length}</b><span>Lernschritte</span></div>
  <div class="card stat"><b>${done}</b><span>erledigt</span></div>
  <div class="card stat"><b>${Math.round((done/Math.max(items.length,1))*100)}%</b><span>Fortschritt</span></div>
 </div>
 <div class="card" style="margin-top:12px">
  <span class="badge">🎯 MEIN NÄCHSTER SCHRITT</span>
  <p>Formuliere kleine Schritte statt großer Vorsätze. Du kannst sie jederzeit verändern.</p>
  <button class="primary" onclick="addPathStep()">＋ Lernschritt anlegen</button>
 </div>
 <div class="list" style="margin-top:12px">${items.map(x=>`<div class="list-item"><div><strong>${x.done?"✅ ":"⬜ "}${esc(x.title)}</strong><small>${x.done?"Erledigt":"Noch offen"}</small></div><div class="form-actions"><button class="secondary" onclick="togglePathStep(${x.id})">${x.done?"↩ Öffnen":"✓ Erledigt"}</button><button class="secondary" onclick="deletePathStep(${x.id})">×</button></div></div>`).join("")||`<div class="empty"><strong>Noch kein persönlicher Lernschritt</strong><br>Lege einen kleinen nächsten Schritt an.</div>`}</div>
 <div class="card" style="margin-top:12px;background:var(--soft-green)"><h3>💡 Tipp</h3><p>Wenn du bei einem Lernschritt festhängst, nutze <a href="#impulse">Lernimpulse</a>, <a href="#ressourcen">Lernressourcen</a> oder <a href="#lerncoaching">Lerncoaching</a>.</p></div>${footer()}`;
}

async function renderLerncoaching(){
 return `${pageHead("UNTERSTÜTZUNG","Lerncoaching","Lerncoaching hilft dir dabei, dein Lernen selbst zu steuern, Hindernisse zu erkennen und passende nächste Schritte zu finden.",`<a class="secondary button" href="#lernwerkstatt">← Lernwerkstatt</a>`)}
 <div class="grid grid-2">
  <div class="card">
   <span class="badge">💬 WAS IST LERNCOACHING?</span>
   <h2>Gemeinsam herausfinden, wie du weiterkommst.</h2>
   <p>Im Lerncoaching geht es nicht darum, dir die Lösung abzunehmen. Du schaust gemeinsam mit einer Lehrkraft auf dein Lernen:</p>
   <div class="list">
    ${["Was möchte ich erreichen?","Was funktioniert bei mir schon gut?","Wo komme ich gerade nicht weiter?","Welche Lernstrategie passt zu mir?","Was ist mein nächster konkreter Schritt?"].map(x=>`<div class="list-item"><strong>${x}</strong><span class="pill">Lerncoaching</span></div>`).join("")}
   </div>
  </div>
  <div class="card" style="background:var(--soft-green)">
   <span class="badge">📧 KONTAKT</span>
   <h2>Du möchtest mit einer Lehrkraft sprechen?</h2>
   <p>Nutze die E-Mail-Adresse der zuständigen Lerncoach-Lehrkraft. Die konkrete Adresse kann von der Schule hinterlegt werden.</p>
   <a class="primary button" href="mailto:lerncoaching@fosbos-weilheim.de?subject=Lerncoaching%20Campusklasse">📧 Lerncoaching per E-Mail</a>
   <p class="muted" style="margin-top:10px">Falls eure Schule eine andere Adresse verwendet, kann der Link später leicht angepasst werden.</p>
  </div>
 </div>
 <div class="card" style="margin-top:12px"><h3>🧭 Wann kann Lerncoaching sinnvoll sein?</h3><p>Zum Beispiel wenn du dein Lernziel kennst, aber nicht weißt, wie du anfangen sollst; wenn du wiederholt festhängst oder wenn du deine Lernstrategie verändern möchtest.</p></div>${footer()}`;
}

async function renderMethoden(){
 return `${pageHead("LERNEN LERNEN","Lernmethoden","Wähle eine Methode passend zu dem, was du gerade erreichen möchtest.",`<a class="secondary button" href="#lernwerkstatt">← Lernwerkstatt</a>`)}
 <div class="grid grid-4">${lernMethodenData.map(x=>`<div class="card tile method-card"><span class="emoji">${x[0]}</span><strong>${x[1]}</strong><small>${x[2]}</small><span class="pill">${x[3]}</span></div>`).join("")}</div>
 <div class="card" style="margin-top:12px;background:var(--soft-green)"><h3>🎯 Welche Methode passt?</h3><div class="grid grid-3"><div><b>Ich verstehe etwas noch nicht.</b><p>→ Erklären in eigenen Worten</p></div><div><b>Ich muss es sicher behalten.</b><p>→ Aktives Abrufen</p></div><div><b>Ich muss es anwenden.</b><p>→ Lernstoff übertragen</p></div></div></div>${footer()}`;
}

function openResource(url){
 if(!url){toast("Für diese Ressource ist noch kein Link hinterlegt.");return}
 window.open(url,"_blank","noopener,noreferrer");
}
window.openResource=openResource;

async function renderRessourcen(){
 return `${pageHead("LERNEN","Lernressourcen","Eine übersichtliche Bibliothek für digitale und externe Lernangebote.",`<a class="secondary button" href="#lernwerkstatt">← Lernwerkstatt</a>`)}
 <div class="card" style="background:var(--soft-green)"><span class="badge">📚 LERNRESSOURCEN-BIBLIOTHEK</span><p style="margin-bottom:0">Hier können später gezielt Materialien und Links zu einem Lernbereich gesammelt werden. Vorerst arbeiten wir ohne Firebase Storage und verlinken externe Angebote.</p></div>
 <div class="grid grid-3" style="margin-top:12px">${lernRessourcenData.map((x,i)=>`<div class="card resource-card"><span class="emoji">${x[0]}</span><span class="pill">${x[3]}</span><h3>${x[1]}</h3><p>${x[2]}</p>${x[4]?`<button class="primary" onclick="openResource('${x[4]}')">Öffnen →</button>`:`<button class="secondary" onclick="toast('Hier kann später ein Link der Lehrkraft hinterlegt werden.')">Link hinterlegen</button>`}</div>`).join("")}</div>
 <div class="card" style="margin-top:12px"><h3>🔗 Geplante Erweiterung</h3><p>Die Bibliothek kann später um eigene PDF-, Word-, JPG-, MP3- oder MP4-Dateien erweitert werden. Dafür wäre Firebase Storage sinnvoll; die jetzige Version benötigt diesen Speicher noch nicht.</p></div>${footer()}`;
}

function impulsePick(){
 const item=lernImpulseData[Math.floor(Math.random()*lernImpulseData.length)];
 const box=$("impulseBox");
 if(!box)return;
 box.innerHTML=`<div class="impulse-result"><span class="emoji">${item[0]}</span><span class="pill">${item[3]}</span><h2>${item[1]}</h2><p>${item[2]}</p><label>Mein kurzer Gedanke <span class="muted">(optional)</span><textarea id="impulseNote" rows="4" placeholder="Was fällt dir dazu ein?"></textarea></label><div class="form-actions"><button class="secondary" onclick="impulsePick()">↻ Anderen Impuls</button><button class="primary" onclick="toast('Impuls abgeschlossen.');document.querySelector('#impulseNext').hidden=false">✓ Erledigt</button></div></div>`;
}
window.impulsePick=impulsePick;

async function renderImpulse(){
 return `${pageHead("WEITERLERNEN","Lernimpulse","Kurze, interaktive Anstöße für deinen nächsten sinnvollen Lernschritt.",`<a class="secondary button" href="#lernwerkstatt">← Lernwerkstatt</a>`)}
 <div class="grid grid-4">${[["🎲","Überraschung"],["⚡","Quick Impuls"],["🧠","Verstehen"],["🔥","Challenge"]].map((x,i)=>`<button class="card tile impulse-select" onclick="impulsePick()"><span class="emoji">${x[0]}</span><strong>${x[1]}</strong><small>${i===0?"Lass dich überraschen.":"Ein kurzer Impuls für dein Lernen."}</small></button>`).join("")}</div>
 <div id="impulseBox" class="card impulse-box" style="margin-top:12px"><div class="empty"><span class="emoji">💡</span><strong>Dein Impuls wartet.</strong><p>Wähle oben einen Bereich oder starte mit einem Überraschungsimpuls.</p><button class="primary" onclick="impulsePick()">🎲 Impuls starten</button></div></div>
 <div id="impulseNext" class="card" style="margin-top:12px;background:var(--soft-green)" hidden><h3>➡️ Dein nächster Schritt</h3><div class="form-actions"><a class="primary button" href="#lernpfad">🧭 Lernpfad</a><a class="secondary button" href="#ressourcen">📚 Lernressource</a><a class="secondary button" href="#methoden">🧰 Methode</a><a class="secondary button" href="#journal">📓 Lernjournal</a></div></div>${footer()}`;
}

async function renderMessung(){
 return `${pageHead("ÜBERPRÜFEN","Lernstandsmessung","Kurz prüfen: Kann ich es wirklich? Die Messung unterstützt dich dabei, deinen Lernstand realistischer einzuschätzen.",`<a class="secondary button" href="#lernwerkstatt">← Lernwerkstatt</a>`)}
 <div class="card" style="background:var(--soft-green)"><span class="badge">📊 KURZ-CHECK</span><h2>Vorher einschätzen – danach überprüfen.</h2><p>Wähle zuerst deine Einschätzung und überprüfe sie anschließend mit kurzen Aufgaben: Verstehen, Anwenden und Transfer.</p><div class="form-actions"><button class="primary" onclick="startMiniCheck()">🔎 Check starten</button></div></div>
 <div id="miniCheckBox" class="card" style="margin-top:12px"><h3>🧭 So funktioniert es</h3><p>Die Lernstandsmessung ist bewusst kurz. Sie ersetzt keine Leistungsbewertung durch die Lehrkraft.</p></div>${footer()}`;
}
function startMiniCheck(){
 const box=$("miniCheckBox");
 if(!box)return;
 box.innerHTML=`<span class="badge">1 · SELBSTEINSCHÄTZUNG</span><h3>Wie sicher fühlst du dich?</h3><div class="assessment-options"><label><input type="radio" name="miniSelf" value="green"> 🟢 Auf Kurs</label><label><input type="radio" name="miniSelf" value="yellow"> 🟡 Klärungsbedarf</label><label><input type="radio" name="miniSelf" value="red"> 🔴 Handlungsbedarf</label></div><button class="primary" onclick="miniCheckNext()">Weiter →</button>`;
}
function miniCheckNext(){
 const self=document.querySelector('input[name="miniSelf"]:checked')?.value;
 if(!self){toast("Bitte zuerst eine Einschätzung wählen.");return}
 const box=$("miniCheckBox");
 box.innerHTML=`<span class="badge">2 · KURZ TESTEN</span><h3>Erkläre den Lerninhalt in 2–3 Sätzen.</h3><textarea id="miniAnswer" rows="6" placeholder="Deine Antwort …"></textarea><div class="form-actions"><button class="primary" onclick="miniCheckResult('${self}')">Auswerten →</button></div>`;
}
function miniCheckResult(self){
 const text=($("miniAnswer")?.value||"").trim();
 if(!text){toast("Bitte eine kurze Antwort eingeben.");return}
 const words=text.split(/\s+/).filter(Boolean).length;
 const status=words>=35?"green":words>=15?"yellow":"red";
 const labels={green:"🟢 Auf Kurs",yellow:"🟡 Klärungsbedarf",red:"🔴 Handlungsbedarf"};
 const box=$("miniCheckBox");
 box.innerHTML=`<span class="badge">3 · DEIN ERGEBNIS</span><h3>${labels[status]}</h3><p>Deine Antwort ist als kurzer Selbstcheck ausgewertet worden. Eine längere Antwort ist nicht automatisch eine bessere Antwort – prüfe deshalb zusätzlich selbst, ob du den Inhalt fachlich richtig erklären kannst.</p><p><b>Selbsteinschätzung:</b> ${labels[self]}</p><p><b>Check:</b> ${labels[status]}</p><div class="notice">💡 Wenn beides nicht übereinstimmt, nutze einen Lernimpuls oder eine passende Lernressource und überprüfe dich anschließend erneut.</div><div class="form-actions"><a class="primary button" href="#impulse">💡 Lernimpuls</a><a class="secondary button" href="#ressourcen">📚 Lernressource</a><a class="secondary button" href="#journal">📓 Lernjournal</a></div>`;
}
window.startMiniCheck=startMiniCheck;
window.miniCheckNext=miniCheckNext;
window.miniCheckResult=miniCheckResult;

async function renderKILernen(){
 return `${pageHead("DIGITAL LERNEN","KI zum Lernen","Nutze KI als Lernpartner – nicht als Ersatz für dein eigenes Denken.",`<a class="secondary button" href="#lernwerkstatt">← Lernwerkstatt</a>`)}
 <div class="grid grid-3">
  ${[["🧠","Erklären lassen","Bitte die KI, einen schwierigen Begriff auf deinem Niveau zu erklären."],["❓","Fragen lassen","Lass dir Fragen stellen, statt dir die Lösung geben zu lassen."],["🔎","Antwort prüfen","Gib deine eigene Lösung ein und bitte um begründetes Feedback."],["🔄","Perspektive wechseln","Bitte um Gegenargumente oder eine andere Sichtweise."],["🧪","Üben","Lass dir neue Übungsfälle erstellen – ohne sofort die Lösung zu zeigen."],["⚖️","Reflektieren","Prüfe Quellen, Datenschutz, Eigenleistung und mögliche Fehler."]].map(x=>`<div class="card"><span class="emoji">${x[0]}</span><h3>${x[1]}</h3><p>${x[2]}</p></div>`).join("")}
 </div>
 <div class="card" style="margin-top:12px;background:var(--soft-green)"><h3>🤖 KI-Lernregel</h3><p><b>Erst selbst denken → dann KI nutzen → Ergebnis prüfen → in eigenen Worten festhalten.</b></p><a class="primary button" href="https://fobizz.com/" target="_blank" rel="noopener noreferrer">KI-Lernressource fobizz →</a></div>${footer()}`;
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

async function render(){
 if(!currentUser)return;
 const p=location.hash.replace("#","")||"start";
 const pages={start:renderStart,kompass:renderKompass,lernwerkstatt:renderLernwerkstatt,lernpfad:renderLernpfad,lerncoaching:renderLerncoaching,methoden:renderMethoden,ressourcen:renderRessourcen,impulse:renderImpulse,messung:renderMessung,"ki-lernen":renderKILernen,forum:renderForum,projekte:renderProjekte,kompetenz:renderKompetenz,journal:renderJournal,praktikum:renderPraktikum,ki:renderKI,kalender:renderKalender,team:renderTeam};
 const fn=pages[p]||renderStart;
 document.querySelectorAll(".nav-link").forEach(a=>a.classList.toggle("active",a.dataset.page===p));
 try{$("content").innerHTML=await fn()}catch(e){console.error(e);$("content").innerHTML=`<div class="card"><h3>Die Seite konnte nicht geladen werden.</h3><p>Bitte prüfe die Firestore-Sicherheitsregeln und die Browser-Konsole.</p></div>`}
 $("sidebar").classList.remove("open");
}
const lernwerkstattStyle=document.createElement("style");
lernwerkstattStyle.textContent=`.lernwerkstatt-grid{margin-top:12px}.lernwerkstatt-card{position:relative;min-height:155px}.tile-arrow{position:absolute;right:14px;bottom:12px;color:var(--muted);font-size:20px}.method-card,.resource-card{min-height:210px}.resource-card .pill{display:inline-block;margin-top:8px}.impulse-select{border:1px solid var(--line);cursor:pointer;text-align:left;width:100%}.impulse-box{min-height:230px}.impulse-result{max-width:850px;margin:0 auto}.assessment-options{display:grid;gap:9px;margin:12px 0}.assessment-options label{padding:12px;border:1px solid var(--line);border-radius:10px;cursor:pointer}@media(max-width:800px){.lernwerkstatt-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:560px){.lernwerkstatt-grid{grid-template-columns:1fr}.lernwerkstatt-card{min-height:130px}}`;
document.head.appendChild(lernwerkstattStyle);

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
