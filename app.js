let initializeApp, getAuth, onAuthStateChanged, createUserWithEmailAndPassword,     signInWithEmailAndPassword, signOut, sendPasswordResetEmail, updateProfile; let getFirestore, collection, doc, addDoc, setDoc, updateDoc, deleteDoc,     getDoc, getDocs, query, orderBy, limit, where, onSnapshot,     serverTimestamp, arrayUnion, increment;  let firebaseReadyPromise = null; async function loadFirebase(){   if(firebaseReadyPromise) return firebaseReadyPromise;   firebaseReadyPromise = Promise.all([     import("https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js"),     import("https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js"),     import("https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js")   ]).then(([appMod, authMod, fsMod])=>{     ({initializeApp}=appMod);  ({getAuth,onAuthStateChanged,createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,sendPasswordResetEmail,updateProfile}=authMod);  ({getFirestore,collection,doc,addDoc,setDoc,updateDoc,deleteDoc,getDoc,getDocs,query,orderBy,limit,where,onSnapshot,serverTimestamp,arrayUnion,increment}=fsMod);     if(!app) app=initializeApp(firebaseConfig);     if(!auth) auth=getAuth(app);     if(!db) db=getFirestore(app);     window.CampusFirebase={        get db(){return db},        get currentUser(){return currentUser},        collection,doc,addDoc,setDoc,updateDoc,deleteDoc,getDoc,getDocs,        query,orderBy,limit,where,onSnapshot,serverTimestamp,arrayUnion,increment,        modal,toast,pageHead,footer,render     };     return true;   });   return firebaseReadyPromise; }  /*
     WICHTIG:
     Diese Werte werden nach dem Anlegen deiner Firebase-Web-App aus
     der Firebase Console hier eingesetzt.
*/ const firebaseConfig = {    apiKey: "AIzaSyAI7xMbH4TqCGh1BJKyRyv_LQtqlsLUDNc",    authDomain: "campus-klasse.firebaseapp.com",    projectId: "campus-klasse",    storageBucket: "campus-klasse.firebasestorage.app",    messagingSenderId: "164958867141",    appId: "1:164958867141:web:676ab50f17f8a4b710eaac",    measurementId: "G-VYLG8YKT9E" };   /* =========================================================
   CAMPUSKLASSE MASTER – STABILE MODULREGISTRY
   Die Master-App selbst enthält keine Pflicht-Imports
   von Zusatzmodulen. Module werden erst beim Öffnen geladen.
   ========================================================= */ const CAMPUS_MODULES={      lernpfad:{label:"        Persönlicher Lernpfad",route:"lernpfad",ready:true},      lernressourcen:{label:"        Lernressourcen",route:"ressourcen",ready:true},      lernjournal:{label:"        Lernjournal",route:"journal",ready:true},      lernmethoden:{label:"        Lernmethoden",route:"methoden",ready:false},      lernimpulse:{label:"        Lernimpulse",route:"impulse",ready:false},      lernstand:{label:"        Lernstandsmessung",route:"lernstand",ready:false},      lerncoaching:{label:"        Lerncoaching",route:"lerncoaching",ready:false},      resilienz:{label:"        Resilienz & Respressi",route:"resilienz",ready:false},      kompetenz:{label:"        Kompetenzwerkstatt",route:"kompetenz",ready:true},      forum:{label:"        Campus-Forum",route:"forum",ready:true},      projekte:{label:"        Projekte",route:"projekte",ready:true},      praxis:{label:"        Praxis & Partnerschaften",route:"praktikum",ready:true},      ki:{label:"        KI-Innovationslabor",route:"ki",ready:true},      kalender:{label:"        Campus-Kalender",route:"kalender",ready:true},      kompetenzprofil:{label:"        Kompetenzprofil",route:"kompetenzprofil",ready:false},      team:{label:"        Team & SQ",route:"team",ready:true} };  const configReady = !Object.values(firebaseConfig).some(v => String(v).includes("HIER_") || String(v).includes("DEIN-PROJEKT"));  let app=null, auth=null, db=null;  const $=id=>document.getElementById(id); const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const statusLabel={green:"Auf Kurs",yellow:"Klärungsbedarf",red:"Handlungsbedarf"};
const labels={question:"   Frage",info:"   Info",idea:"              Idee",project:"     Projekt",practice:"   Praxis"};
let currentUser=null, profile=null, unsubscribers=[];

function toast(t){const
x=$("toast");x.textContent=t;x.classList.add("show");clearTimeout(window.tt);window.tt=setTimeout(()=>x.classList.remove("show"),
2500)}
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
function pageHead(k,h,p,actions=""){return `<div class="page-head"><div><div class="kicker">${k}</div><h1>${h}</h1><p>${p}</p>
</div><div class="actions">${actions}</div></div>`}
function footer(){return `<div class="footer"><span>Campusklasse 26/27 · FOSBOS Weilheim</span><span>Gemeinsam · offen ·
respektvoll</span></div>`}
function tile(icon,title,text,target){return `<a class="card tile" href="#${target}"><span class="emoji">${icon}</span>
<strong>${title}</strong><small>${text}</small></a>`}
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

async function renderRessourcenRoute(){
  try{
    const module=await import("./modules/lernressourcen.js");
    return await module.renderRessourcen();
  }catch(error){
    console.error("Lernressourcen-Modul konnte nicht geladen werden:",error);
         return moduleError("      Lernressourcen","modules/lernressourcen.js",error);
     }
}

async function renderLernpfadRoute(){
  try{
    const module=await import("./modules/lernpfad.js");
    return await module.renderLernpfad();
  }catch(error){
    console.error("Lernpfad-Modul konnte nicht geladen werden:",error);
         return moduleError("      Persönlicher Lernpfad","modules/lernpfad.js",error);
     }
}

async function renderLernjournalRoute(){ return await renderJournal(); }

function moduleError(title,file,error){
  return `${pageHead("CAMPUS-MODUL",title,"Das einzelne Modul konnte nicht geladen werden.",`<button class="secondary"
onclick="go('start')">← Startseite</button>`)}
  <div class="card">
    <h3>Die Campus-App selbst funktioniert.</h3>
    <p>Nur dieses Modul ist momentan nicht erreichbar.</p>
    <div class="notice"><b>Benötigte Datei:</b> ${esc(file)}<br><small>${esc(error?.message||"Unbekannter Fehler")}</small></div>
  </div>${footer()}`;
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
 try{await loadFirebase();await sendPasswordResetEmail(auth,email);toast("E-Mail zum Zurücksetzen wurde versendet.")}catch(err)
{console.error(err);authError(err)}
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
 try{[tasks,projects,posts,calendar]=await
Promise.all([getCollection("tasks","deadline",false),getCollection("projects"),getCollection("posts"),getCollection("calendar","d ate",false)])}catch(e){}
 const on=tasks.filter(x=>x.status==="green").length;
 return `<section class="hero"><div><span class="badge">    CAMPUSKLASSE 26/27</span><h1>Willkommen auf dem Campus.</h1><p>Hier
verbinden wir Lernen, Projekte, Praxis und Gemeinschaft. Alle angemeldeten Mitglieder arbeiten am selben digitalen Campus.</p>
</div><div class="actions"><button class="primary" onclick="go('kompass')">Mein Kompass →</button><button class="secondary"
onclick="go('forum')">Campus-Forum</button></div></section>
 ${pageHead("ÜBERSICHT","Unser Campus","Die wichtigsten Bereiche auf einen Blick.")}
 <div class="grid grid-4">
    ${tile("       ","Campus-Kompass","Dein persönlicher Lern- und Projektüberblick.","kompass")}
    ${tile("       ","Lernwerkstatt","Lernaufträge, Methoden, Tools und KI.","lernwerkstatt")}
    ${tile("       ","Campus-Forum","Austauschen, fragen, helfen und gemeinsam denken.","forum")}
    ${tile("       ","Projekte","Projektteams, Ziele, Fortschritt und Ergebnisse.","projekte")}
    ${tile("       ","Kompetenzwerkstatt","Kompetenzen sichtbar machen und entwickeln.","kompetenz")}
    ${tile("       ","Lernjournal","Lernweg, Reflexionen und nächste Schritte.","journal")}
    ${tile("       ","Praktikum & Praxis","Praxisaufträge und Reflexion.","praktikum")}
 ${tile(" ","KI-Innovationslabor","KI-Ideen und Innovationspartnerschaften.","ki")}</div>
 <div class="grid grid-3" style="margin-top:12px"><div class="card stat"><b>${tasks.length}</b><span>Arbeitspakete</span></div>
<div class="card stat"><b>${on}</b><span>auf Kurs</span></div><div class="card stat"><b>${currentUser?1:0}</b><span>dein Zugang
ist aktiv</span></div></div>
 <div class="grid grid-2" style="margin-top:12px">
 <div class="card"><h3>   Campus-News</h3><div class="list">${posts.filter(p=>p.type==="info").slice(0,3).map(p=>`<div
class="list-item"><div><strong>${esc(p.text)}</strong><small>${fmtDate(p.createdAt)}</small></div><span class="pill">Info</span>
</div>`).join("")||`<div class="empty">Noch keine News.</div>`}</div></div>
  <div class="card"><h3>  Nächste Termine</h3><div class="list">${calendar.slice(0,3).map(c=>`<div class="list-item"><div>
<strong>${esc(c.title)}</strong><small>${esc(c.date)}</small></div><span class="pill green">Termin</span></div>`).join("")||`<div
class="empty">Noch keine Termine.</div>`}</div></div></div>${footer()}`;
}

async function renderKompass(){
 const tasks=await getCollection("tasks","deadline",false), projects=await getCollection("projects");
 return `${pageHead("PERSÖNLICH","Mein Campus-Kompass","Dein persönlicher Überblick über Aufgaben, Projekte, Ziele und Lernweg.",`<button class="primary" onclick="openTaskForm()">＋ Aufgabe</button>`)}
 <div class="grid grid-3"><div class="card stat"><b>${tasks.filter(t=>t.ownerUid===currentUser.uid).length}</b><span>Meine
Aufgaben</span></div><div class="card stat"><b>${projects.length}</b><span>Projekte</span></div><div class="card stat">
<b>${profile?.role==="teacher"?"Lehrkraft":profile?.role==="admin"?"Admin":"Schüler/in"}</b><span>Rolle</span></div></div>
 <div class="card" style="margin-top:12px"><h3>   Meine Aufgaben</h3><div
class="list">${tasks.filter(t=>t.ownerUid===currentUser.uid).map(taskHTML).join("")||`<div class="empty"><strong>Noch keine
Aufgaben</strong>Lege deine erste Aufgabe an.</div>`}</div></div>
  <div class="card" style="margin-top:12px"><h3>  Aktuelle Projekte</h3><div class="list">${projects.map(p=>`<div class="list- item"><div><strong>${esc(p.title)}</strong><small>${esc(p.team||"")} · ${esc(p.partner||"")}</small></div><span
class="pill">${Number(p.progress||0)}%</span></div>`).join("")||`<div class="empty">Noch keine Projekte.</div>`}</div>
</div>${footer()}`;
}
function taskHTML(t){return `<div class="list-item"><div><strong>${esc(t.title)}</strong><small>Verantwortlich:
${esc(t.ownerName||"")} · Deadline: ${esc(t.deadline||"—")} · Nächster Schritt: ${esc(t.next||"—")}</small></div><div
class="traffic">${statusDot(t.status)}<span class="pill">${statusLabel[t.status]||"—"}</span></div></div>`}

async function renderLernwerkstatt(){
  const resources=[
         ["     ","Persönlicher Lernpfad","Ziele setzen, Lernschritte planen und Fortschritt erkennen.","lernpfad"],
         ["     ","Lerncoaching","Individuelle Begleitung und Kontakt zu einer Lehrkraft.","lerncoaching"],
         ["     ","Lernmethoden","Planung, Lernen, Zusammenarbeit und Reflexion.","methoden"],
         ["     ","Lernressourcen","TaskCard, KI, Videos, ByCS/mebis und Webseiten.","ressourcen"],
         ["     ","Lernimpulse","Kurze Impulse für Reflexion und Deeper Learning.","impulse"],
         ["     ","Lernstandsmessung","Kurz prüfen: Wo stehe ich und was ist mein nächster Schritt?","lernstand"],
         ["     ","KI zum Lernen","KI bewusst, kritisch und produktiv einsetzen.","ki"],
         ["     ","Fragen & Hilfe","Wenn du nicht weiterkommst: fragen und teilen.","forum"]
  ];
  return `${pageHead("SELBSTSTÄNDIG LERNEN","Lernwerkstatt","Der offene Lernraum für Lernaufträge, Methoden, Tools und KI.",`<button class="primary" onclick="openPostForm('idea')">＋ Lernimpuls</button>`)}
  <div class="grid grid-4">${resources.map(x=>`<a class="card tile" href="#${x[3]}"><span class="emoji">${x[0]}</span>
<strong>${x[1]}</strong><small>${x[2]}</small></a>`).join("")}</div>
  <div class="grid grid-2" style="margin-top:12px">
    <div class="card"><h3>   So kann ich starten</h3><div class="list">${["Ich möchte etwas verstehen","Ich möchte recherchieren","Ich möchte etwas ausprobieren","Ich möchte etwas gestalten","Ich möchte ein Problem lösen","Ich möchte mich vorbereiten"].map(x=>`<div class="list-item"><strong>${x}</strong><span class="pill">Lernen</span></div>`).join("")}</div></div>
    <div class="card"><h3>   KI-Lernimpuls</h3><p>Nutze KI nicht nur für fertige Antworten. Bitte sie zum Beispiel, dir Fragen zu
stellen, einen Lösungsweg zu prüfen oder Gegenargumente zu entwickeln.</p><div class="chips" style="margin-top:12px"><span
class="chip">Erklären</span><span class="chip">Fragen</span><span class="chip">Feedback</span><span
class="chip">Perspektiven</span></div></div>
  </div>${footer()}`;
}

async function renderForum(){
 const posts=await getCollection("posts");
 return `${pageHead("GEMEINSCHAFT","Campus-Forum","Gemeinsam denken, fragen, austauschen und unterstützen.",`<button
class="primary" onclick="openPostForm()">＋ Beitrag schreiben</button>`)}
    <div class="toolbar"><div class="chips"><span class="chip">Alle</span><span class="chip">             Fragen</span><span class="chip">
Infos</span><span class="chip">   Ideen</span><span class="chip">   Projekte</span><span class="chip">   Praxis</span></div>
<input class="search" id="forumSearch" placeholder="Beiträge durchsuchen …"></div>
 <div class="list" id="forumList">${posts.map(postHTML).join("")||`<div class="empty"><strong>Noch keine
Beiträge</strong>Schreibe den ersten Beitrag.</div>`}</div>
  <div class="card" style="margin-top:12px;background:var(--soft-green)"><h3>  Campus hilft</h3><p>Du kannst anderen bei einem
Thema helfen? Teile dein Wissen.</p><button class="secondary" style="margin-top:10px" onclick="openHelpForm()">Hilfe
anbieten</button></div>${footer()}`;
}
function postHTML(p){const comments=Array.isArray(p.comments)?p.comments:[];return `<article class="forum-post"><div class="post- head"><div class="avatar">${p.authorUid===currentUser.uid?" ":" "}</div><div class="post-meta">
<strong>${esc(p.authorName||"Campus-Mitglied")}</strong><small>${fmtDate(p.createdAt)}</small></div><span
class="pill">${labels[p.type]||p.type||"Beitrag"}</span></div><div class="post-body">${esc(p.text)}</div><div class="post- actions"><button onclick="likePost('${p.id}')">♡ Gefällt mir (${Number(p.likes||0)})</button><button
onclick="focusComment('${p.id}')">   Antworten (${comments.length})</button>${(p.authorUid===currentUser.uid||isTeacher())?
`<button onclick="deletePost('${p.id}')">Löschen</button>`:""}</div><div class="comments">${comments.map(c=>`<div
class="comment"><b>${esc(c.name)}:</b> ${esc(c.text)}</div>`).join("")}<div class="comment-box"><input id="comment-${p.id}"
placeholder="Antwort schreiben …"><button onclick="commentPost('${p.id}')">Senden</button></div></div></article>`}

async function renderProjekte(){
  const projects=await getCollection("projects");
  return `${pageHead("DEEPER LEARNING","Projekte","Projektideen, Teams, Ziele, Fortschritt und Ergebnisse.",`<button
class="primary" onclick="openProjectForm()">＋ Projekt</button>`)}
  <div class="grid grid-3">${projects.map(p=>`<div class="card"><div class="status-card">${statusDot(p.status||"green")}<div>
<h3>${esc(p.title)}</h3><p>${esc(p.goal||"")}</p></div></div><div style="margin-top:12px"><div style="display:flex;justify- content:space-between;font-size:9px;color:var(--muted);margin-bottom:5px"><span>${esc(p.team||"")} · ${esc(p.partner||"")}</span>
<b>${Number(p.progress||0)}%</b></div><div class="progress"><i style="width:${Number(p.progress||0)}%"></i></div></div>
</div>`).join("")||`<div class="empty">Noch keine Projekte.</div>`}</div>${footer()}`;
}
async function renderKompetenz(){
  let data=[],networkAvailable=true;
  try{const snap=await getDocs(collection(db,"competencies"));data=snap.docs.map(d=>({id:d.id,...d.data()}))}
  catch(e){console.error("Kompetenznetzwerk:",e);networkAvailable=false;
    try{const mine=await getDocs(query(collection(db,"competencies"),where("uid","==",currentUser.uid)));data=mine.docs.map(d=>({id:d.id,...d.data()}))}
    catch(inner){console.error(inner)}}
  const categories=["Auftreten & Kommunikation","Schreiben & Sprache","Lernen & Denken","Mathematik & analytisches Denken","Kreativität & Gestaltung","Digital & KI","Zusammenarbeit","Persönliche Stärken","Musik & Ausdruck","Sport & Bewegung","Praktisches & Handwerk","Sonstiges"];
  const mine=data.filter(x=>x.uid===currentUser.uid);
  return `${pageHead("GEMEINSAM STÄRKER","Kompetenznetzwerk","Jeder kann etwas. Niemand kann alles. Gemeinsam können wir mehr.",`<button class="primary" onclick="openCompetenceForm()">＋ Meine Kompetenz</button>`)}
  <section class="hero competency-hero"><div><span class="badge">🤝 CAMPUS KANN WAS</span><h1>Was kannst du gut?</h1><p>Trage ein, was du kannst. So entsteht ein Netzwerk, in dem wir uns gegenseitig helfen können.</p></div><div class="competency-motto"><strong>„Jeder kann etwas.<br>Gemeinsam können wir mehr.“</strong></div></section>
  ${!networkAvailable?`<div class="notice"><strong>ℹ️ Gemeinsames Netzwerk noch nicht vollständig erreichbar.</strong><p>Deine eigenen Einträge werden trotzdem angezeigt.</p></div>`:""}
  <div class="grid grid-4 competency-stats"><div class="card stat"><b>${data.length}</b><span>Kompetenzen</span></div><div class="card stat"><b>${data.filter(x=>x.canHelp).length}</b><span>Hilfe-Angebote</span></div><div class="card stat"><b>${mine.length}</b><span>Meine Kompetenzen</span></div><div class="card stat"><b>${new Set(data.map(x=>x.uid)).size}</b><span>Mitglieder</span></div></div>
  <div class="card" style="margin-top:12px"><div class="page-head"><div><div class="kicker">🧩 MEINE KOMPETENZEN</div><h2>Was bringe ich mit?</h2></div><button class="secondary" onclick="openCompetenceForm()">＋ Ergänzen</button></div>
  ${mine.length?`<div class="grid grid-3">${mine.map(c=>competencyCard(c,true)).join("")}</div>`:`<div class="empty"><strong>Dein Kompetenzprofil ist noch leer.</strong><p>Füge deine erste Kompetenz hinzu.</p><button class="primary" onclick="openCompetenceForm()">⭐ Erste Kompetenz eintragen</button></div>`}</div>
  <div class="card" style="margin-top:12px"><div class="kicker">🤝 CAMPUS HILFT</div><h2>Wer kann was?</h2><p>Finde jemanden, der dich mit seinem Können unterstützen kann.</p><div class="toolbar competency-toolbar"><input class="search" id="competencySearch" placeholder="Kompetenz oder Name suchen …"><select id="competencyCategory"><option value="all">Alle Bereiche</option>${categories.map(c=>`<option>${esc(c)}</option>`).join("")}</select><label class="competency-check"><input id="competencyHelpersOnly" type="checkbox"> Nur „Ich kann helfen“</label></div><div class="grid grid-3" id="competencyNetwork">${data.map(c=>competencyCard(c,false)).join("")||`<div class="empty"><strong>Noch keine Kompetenzen im Netzwerk.</strong></div>`}</div></div>
  <div class="card" style="margin-top:12px;background:var(--soft-green)"><span class="badge">💚 UNSER CAMPUS-GEDANKE</span><h2>Wissen teilen ist eine Stärke.</h2><p><strong>„Ich kann dir helfen. Du kannst mir helfen. Zusammen kommen wir weiter.“</strong></p></div>${footer()}`;
}
function competencyCard(c,mine){
  const level=Math.max(1,Math.min(5,Number(c.level)||1)),bars="●".repeat(level)+"○".repeat(5-level);
  const initials=String(c.ownerName||"Campus").trim().split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase();
  return `<article class="card competency-card" data-name="${esc((c.ownerName||"")+" "+(c.name||""))}" data-category="${esc(c.category||"Sonstiges")}" data-help="${c.canHelp?"yes":"no"}"><div class="competency-card-head"><div class="competency-avatar">${esc(initials||"C")}</div><div><strong>${esc(c.name||"Kompetenz")}</strong><small>${esc(c.ownerName||"Campus-Mitglied")}</small></div></div><span class="pill">${esc(c.category||"Sonstiges")}</span><div class="competency-level">${bars}</div>${c.description?`<p>${esc(c.description)}</p>`:""}${c.canHelp?`<div class="notice competency-help"><strong>🤝 Ich kann helfen</strong>${c.helpText?`<p>${esc(c.helpText)}</p>`:""}</div>`:""}${mine?`<span class="pill">Meine Kompetenz</span>`:(c.canHelp?`<button class="primary competency-contact" onclick="openCompetencyHelp('${c.ownerUid}','${esc(c.ownerName||"Campus-Mitglied")}','${esc(c.name||"Kompetenz")}')">💬 Hilfe anfragen</button>`:"")}</article>`;
}
function filterCompetencyNetwork(){
  const q=($("competencySearch")?.value||"").toLowerCase().trim(),cat=$("competencyCategory")?.value||"all",only=$("competencyHelpersOnly")?.checked;
  document.querySelectorAll("#competencyNetwork .competency-card").forEach(card=>{card.hidden=!((!q||card.dataset.name.toLowerCase().includes(q))&&(cat==="all"||card.dataset.category===cat)&&(!only||card.dataset.help==="yes"))});
}
function openCompetencyHelp(uid,name,competency){
  modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">🤝 CAMPUS HILFT</div><h2>Hilfe anfragen</h2><p>Du möchtest <strong>${esc(name)}</strong> zu <strong>${esc(competency)}</strong> ansprechen.</p><label>Deine Nachricht<textarea id="competencyHelpMessage" rows="5"></textarea></label><div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="createCompetencyHelpPost('${uid}','${esc(name)}','${esc(competency)}')">🤝 Hilfeanfrage erstellen</button></div>`);
}
async function createCompetencyHelpPost(uid,name,competency){
  const text=$("competencyHelpMessage")?.value.trim();if(!text){toast("Bitte kurz beschreiben, wobei du Hilfe brauchst.");return}
  try{await addDoc(collection(db,"posts"),{authorUid:currentUser.uid,authorName:profile?.displayName||currentUser?.email||"Campus-Mitglied",type:"question",text:"🤝 Hilfe gesucht bei „"+competency+"“ – @"+name+": "+text,likes:0,comments:[],createdAt:serverTimestamp()});closeModal();toast("Hilfeanfrage wurde im Campus-Forum erstellt.")}catch(e){console.error(e);toast("Hilfeanfrage konnte nicht erstellt werden.")}
}
const JOURNAL_TILES_CSS=`<style id="journal-tiles-style">
.journal-module-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:14px}
.journal-module-tile{min-height:260px;padding:26px;border:1px solid var(--border,#dfe5e2);border-radius:18px;background:#fff;box-shadow:0 8px 24px rgba(0,0,0,.05);display:flex;flex-direction:column}
.journal-module-tile .journal-tile-icon{font-size:38px;margin-bottom:14px}.journal-module-tile h2{margin:0 0 8px;font-size:22px}
.journal-module-tile p{margin:0;color:#68736f;line-height:1.55}.journal-tile-spacer{flex:1}.journal-module-tile button{width:100%;margin-top:14px}
.journal-library-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}
.journal-library-count{font-size:13px;color:#68736f}.journal-library-list{border:1px solid var(--border,#dfe5e2);border-radius:12px;overflow:hidden}
.journal-library-row{display:grid;grid-template-columns:130px minmax(0,1fr) auto;align-items:center;gap:12px;padding:13px 14px;border-top:1px solid #e8ecea;background:#fff}
.journal-library-row:first-child{border-top:0}.journal-open{border:0;background:transparent;text-align:left;padding:0;cursor:pointer;font:inherit;min-width:0}
.journal-library-row .journal-date{font-size:13px;color:#68736f;white-space:nowrap}.journal-library-row .journal-title{font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
@media(max-width:760px){.journal-module-grid{grid-template-columns:1fr}.journal-module-tile{min-height:220px}.journal-library-row{grid-template-columns:90px minmax(0,1fr) auto;gap:8px}.journal-library-row .secondary{padding:7px 9px;font-size:12px}}
</style>`;

async function getMyJournalEntries(){
  const snap=await getDocs(query(collection(db,"journal"),where("uid","==",currentUser.uid),limit(100)));
  const data=snap.docs.map(d=>({id:d.id,...d.data()}));
  data.sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
  return data;
}

function journalPrintWindow(entries,title="Lernjournal"){
  const rows=(entries||[]).map(j=>`<article class="entry"><div class="date">${esc(fmtDate(j.createdAt))}</div><h2>${esc(j.title||"Reflexion")}</h2>${j.mood?`<div class="mood">${esc(j.mood)}</div>`:""}<div class="text">${esc(j.text||"—").replace(/\n/g,"<br>")}</div></article>`).join("");
  const w=window.open("","_blank","width=900,height=900");
  if(!w){toast("Bitte Pop-ups für die Campus-App erlauben.");return}
  w.document.write(`<!doctype html><html lang="de"><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font-family:Arial,sans-serif;max-width:820px;margin:40px auto;padding:0 24px;color:#26322e}h1{margin-bottom:30px}.entry{border-bottom:1px solid #ddd;padding:0 0 28px;margin:0 0 28px}.date{color:#68736f;font-size:13px;margin-bottom:8px}.mood{font-size:24px;margin:8px 0}.text{line-height:1.6;white-space:normal}@media print{body{margin:20px}.entry{break-inside:avoid}}</style></head><body><h1>${esc(title)}</h1>${rows||"<p>Keine Einträge vorhanden.</p>"}</body></html>`);
  w.document.close();w.focus();setTimeout(()=>w.print(),250);
}
async function printSingleJournalPDF(id){
  try{const entries=await getMyJournalEntries();const j=entries.find(x=>x.id===id);if(!j){toast("Der Eintrag wurde nicht gefunden.");return}journalPrintWindow([j],"Lernjournal · "+(j.title||"Reflexion"));}catch(e){console.error(e);toast("PDF-Ausgabe nicht möglich.")}
}
async function printMyJournalPDF(){
  try{const entries=await getMyJournalEntries();journalPrintWindow(entries,"Meine Lernjournal-Bibliothek");}catch(e){console.error(e);toast("PDF-Ausgabe nicht möglich.")}
}
async function openTeacherJournalOverview(){
  if(!isTeacher())return;
  try{
    const snap=await getDocs(collection(db,"journal"));
    const data=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
    const grouped={};data.forEach(j=>{(grouped[j.uid]??=[]).push(j)});
    const rows=Object.entries(grouped).map(([uid,items])=>`<div class="list-item"><div><strong>${esc(items[0]?.authorName||items[0]?.displayName||uid)}</strong><small>${items.length} Eintrag${items.length===1?"":"e"}</small></div><button class="secondary" onclick="downloadAllJournalsPDF('${uid}')">📄 PDF</button></div>`).join("");
    modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">LEHRKRAFT</div><h2>Schüler-Lernjournale</h2><p>Verfügbare Lernjournale nach Schülerprofil.</p><div class="list">${rows||`<div class="empty">Noch keine Lernjournale vorhanden.</div>`}</div>`);
  }catch(e){console.error(e);toast("Schüler-Lernjournale konnten nicht geladen werden.")}
}
async function downloadAllJournalsPDF(uid){
  if(!isTeacher())return;
  try{const snap=await getDocs(query(collection(db,"journal"),where("uid","==",uid),limit(100)));const entries=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));journalPrintWindow(entries,"Schüler-Lernjournal");}catch(e){console.error(e);toast("PDF-Ausgabe nicht möglich.")}
}
async function renderJournal(){
  let data=[];
  try{data=await getMyJournalEntries()}catch(e){console.error("Lernjournal laden:",e)}
  const teacherButton=isTeacher()?`<button class="secondary" onclick="openTeacherJournalOverview()">👩‍🏫 Schüler-Lernjournale</button>`:"";
  const rows=data.map(j=>`<div class="journal-library-row">
    <button class="journal-open" onclick="openJournalEntry('${j.id}')">
      <div class="journal-date">${esc(fmtDate(j.createdAt))}</div>
      <div class="journal-title">${esc(j.title||"Reflexion")}</div>
    </button>
    <button class="secondary" onclick="printSingleJournalPDF('${j.id}')">📄 PDF</button>
  </div>`).join("");

  return `${JOURNAL_TILES_CSS}
  ${pageHead("REFLEXION","Lernjournal","Dein Lernweg, Reflexionen und nächste Schritte.",teacherButton)}
  <div class="journal-module-grid">
    <section class="journal-module-tile">
      <div class="journal-tile-icon">✍️</div>
      <h2>Lernjournal erstellen</h2>
      <p>Halte fest, was du gelernt hast, was dich beschäftigt und welche nächsten Schritte du gehen möchtest.</p>
      <div class="journal-tile-spacer"></div>
      <button class="primary" onclick="openJournalForm()">＋ Neuen Journal-Eintrag erstellen</button>
    </section>
    <section class="journal-module-tile">
      <div class="journal-tile-icon">📚</div>
      <h2>Lernjournal-Bibliothek</h2>
      <p>Hier findest du deine bisherigen Reflexionen. Öffne einen Eintrag oder speichere ihn als PDF.</p>
      <div class="journal-tile-spacer"></div>
      <button class="secondary" onclick="openJournalLibrary()">Bibliothek öffnen →</button>
    </section>
  </div>
  <div class="card" id="journalLibraryPanel" style="margin-top:16px">
    <div class="journal-library-head">
      <div><span class="badge">📚 BIBLIOTHEK</span><h2 style="margin:7px 0 2px">Meine Lernjournal-Einträge</h2>
      <div class="journal-library-count">${data.length} Eintrag${data.length===1?"":"ä"} gespeichert</div></div>
      ${data.length?`<button class="secondary" onclick="printMyJournalPDF()">📄 Alle als PDF</button>`:""}
    </div>
    ${data.length?`<div class="journal-library-list">${rows}</div>`:`<div class="empty"><strong>Noch keine Einträge</strong><p>Deine gespeicherten Lernjournal-Einträge erscheinen hier.</p></div>`}
  </div>${footer()}`;
}

function openJournalLibrary(){
  const panel=$("journalLibraryPanel");
  if(panel) panel.scrollIntoView({behavior:"smooth",block:"start"});
}

async function openJournalEntry(id){
  try{
    const entries=await getMyJournalEntries();
    const j=entries.find(x=>x.id===id);
    if(!j){toast("Der Eintrag wurde nicht gefunden.");return}
    modal(`<button class="modal-close" onclick="closeModal()">×</button>
      <div class="kicker">LERNJOURNAL · ${esc(fmtDate(j.createdAt))}</div>
      <h2>${esc(j.title||"Reflexion")}</h2>
      ${j.mood?`<div style="font-size:26px;margin:8px 0">${esc(j.mood)}</div>`:""}
      <div class="journal-entry-full">${esc(j.text||"—").replace(/\n/g,"<br>")}</div>
      <div class="form-actions"><button class="secondary" onclick="closeModal()">Schließen</button>
      <button class="secondary" onclick="printSingleJournalPDF('${j.id}')">📄 PDF</button></div>`);
  }catch(e){console.error(e);toast("Der Eintrag konnte nicht geöffnet werden.")}
}

async function renderPraktikum(){
  const data=await getCollection("practice","createdAt",true);
  return `${pageHead("SCHULE ↔ PRAXIS","Praktikum & Praxis","Praxisaufträge, Beobachtungen und Reflexionen verbinden Schule und Praktikumsbetrieb.",`<button class="primary" onclick="openPracticeForm()">＋ Praxisauftrag</button>`)}
  <div class="grid grid-2">${data.map(p=>`<div class="card"><span class="pill ${p.state==="offen"?"orange":"green"}">${esc(p.state||"geplant")}</span><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p><small
style="display:block;color:var(--muted);margin-top:9px">${esc(p.date||"")}</small></div>`).join("")||`<div class="empty">Noch
keine Praxisaufträge.</div>`}</div>
  <div class="card" style="margin-top:12px"><h3>   Praxispartner</h3><p>Praktikum ist Lern- und Innovationsraum: Beobachtungen aus
der Praxis können zu Fragen, Projekten und KI-Innovationspartnerschaften werden.</p></div>${footer()}`;
}
async function renderKI(){
  return `${pageHead("INNOVATION","KI-Innovationslabor","KI verantwortungsvoll erproben und gemeinsam mit Praxispartnern Lösungen entwickeln.",`<button class="primary" onclick="openPostForm('idea')">＋ KI-Idee</button>`)}
    <div class="grid grid-3">${[["       ","KI beobachten","Welche Aufgabe in der Praxis könnte durch KI unterstützt werden?"],["           ","KI erproben","Eine kleine Idee mit klarer Fragestellung ausprobieren."],[" ","Innovationspartnerschaft","Ergebnis gemeinsam mit dem Praxispartner prüfen und weiterentwickeln."]].map(x=>`<div class="card tile"><span class="emoji">${x[0]}</span><strong>${x[1]}
</strong><small>${x[2]}</small></div>`).join("")}</div>
  <div class="card" style="margin-top:12px"><h3>   KI-Kompass</h3><div class="chips" style="margin-top:9px"><span
class="chip">Transparenz</span><span class="chip">Datenschutz</span><span class="chip">Quellen prüfen</span><span
class="chip">Eigenleistung</span><span class="chip">Bias reflektieren</span><span class="chip">Ergebnisse validieren</span></div>
</div>${footer()}`;
}
async function renderKalender(){
  const data=await getCollection("calendar","date",false);
  return `${pageHead("ORGANISATION","Campus-Kalender","Gemeinsame Termine, Meilensteine und Präsentationen.",`<button
class="primary" onclick="openCalendarForm()">＋ Termin</button>`)}
  <div class="list">${data.map(c=>`<div class="list-item"><div><strong>${esc(c.title)}</strong><small>${esc(c.date||"")}</small>
</div><span class="pill green">Termin</span></div>`).join("")||`<div class="empty">Noch keine Termine.</div>`}</div>${footer()}`;
}
async function renderTeam(){
  const tasks=await getCollection("tasks","deadline",false);
  return `${pageHead("TEAM & SCHULENTWICKLUNG","Team & SQ","Arbeitsorganisation für die Campusklasse und gemeinsame Schulentwicklung.",`<button class="primary" onclick="openTaskForm()">＋ Arbeitspaket</button>`)}
  <div class="grid grid-3">${["green","yellow","red"].map((s,i)=>`<div class="card"><div class="status-card">${statusDot(s)}<div>
<h3>${statusLabel[s]}</h3><p>${tasks.filter(t=>t.status===s).length} Arbeitspakete</p></div></div></div>`).join("")}</div>
  <div class="card" style="margin-top:12px"><h3>   Arbeitspakete</h3><div class="list">${tasks.map(taskHTML).join("")||`<div
class="empty">Noch keine Arbeitspakete.</div>`}</div></div>
  <div class="notice" style="margin-top:12px"><b>Ampel:</b> <b>Auf Kurs</b> = planmäßig · <b>Klärungsbedarf</b> =
Abstimmung/Entscheidung nötig · <b>Handlungsbedarf</b> = aktives Eingreifen erforderlich.</div>${footer()}`;
}

async function renderLernmethoden(){
  try{
    const m=await import("./modules/lernmethoden.js");
    return await m.renderLernmethoden();
  }catch(e){
    console.error("Lernmethoden:",e);
         return moduleError("      Lernmethoden","modules/lernmethoden.js",e);
     }
}

async function renderLerncoaching(){
  const email="BERATUNGSLEHRKRAFT@SCHULE.DE";
  const subject=encodeURIComponent("Anfrage Lerncoaching");
  const body=encodeURIComponent(
     "Hallo,\n\n" +
     "ich würde gerne ein Lerncoaching vereinbaren.\n\n" +
     "Mein Anliegen:\n\n\n" +
     "Viele Grüße"
  );
  const mail=`mailto:${email}?subject=${subject}&body=${body}`;

     return `${pageHead(
        "BEGLEITUNG",
        "Lerncoaching",
        "Gemeinsam den eigenen Lernweg klären, Ziele entwickeln und nächste Schritte finden.",
        `<a class="primary" href="${mail}">   Lerncoaching anfragen</a>`
     )}
     <div class="grid grid-2">
        <div class="card">
      <span class="badge">   INDIVIDUELLE BEGLEITUNG</span>
      <h2>Du musst deinen Lernweg nicht allein planen.</h2>
      <p>Im Lerncoaching kannst du gemeinsam mit einer Lehrkraft auf deine aktuelle Lernsituation schauen, Ziele klären und einen
passenden nächsten Schritt entwickeln.</p>
      <h3>Ein Lerncoaching kann helfen, wenn du …</h3>
      <div class="list">
                <div class="list-item"><strong>     ein Lernziel klären möchtest</strong><span class="pill">Ziel</span></div>
                <div class="list-item"><strong>     deinen Lernweg planen möchtest</strong><span class="pill">Planung</span></div>
                <div class="list-item"><strong>     bei einer Lernaufgabe feststeckst</strong><span class="pill">Klären</span></div>
                <div class="list-item"><strong>     mehr Struktur oder Motivation suchst</strong><span class="pill">Stärkung</span></div>
         <div class="list-item"><strong>   deinen nächsten Lernschritt finden möchtest</strong><span class="pill">Nächster
Schritt</span></div>
      </div>
    </div>
    <div class="card">
      <span class="badge">    KONTAKT</span>
      <h2>Eine Lehrkraft anschreiben</h2>
      <p>Du möchtest ein Lerncoaching? Dann kannst du direkt eine E-Mail an die zuständige Lehrkraft schreiben.</p>
      <a class="primary" href="${mail}">     E-Mail an Lerncoaching</a>
      <div class="notice" style="margin-top:16px">
         <strong>Du musst dein Anliegen nicht perfekt formulieren.</strong>
         <p style="margin-bottom:0">Schreibe einfach kurz, wobei du Unterstützung möchtest.</p>
      </div>
    </div>
  </div>
  <div class="card" style="margin-top:12px">
       <h3>   So kann ein Lerncoaching ablaufen</h3>
       <div class="lp-flow">
         <span>1. Anliegen klären</span><b>→</b>
         <span>2. Situation anschauen</span><b>→</b>
         <span>3. Ziel formulieren</span><b>→</b>
         <span>4. nächsten Schritt planen</span>
       </div>
     </div>
     <div class="card" style="margin-top:12px">
    <h3>   Wichtig</h3>
    <p>Du musst für ein Lerncoaching noch keine fertige Lösung haben. Gemeinsam wird sortiert, was gerade wichtig ist und welcher
nächste Schritt sinnvoll sein kann.</p>
    <p>Die Kontaktaufnahme erfolgt ausschließlich per E-Mail.</p>
  </div>
  ${footer()}`;
}


/* =========================================================
   CAMPUSKLASSE – LERNIMPULSE
   Zwei Zugänge:
   1. Gezielte Auswahl
   2. Lern-Glücksrad
   ========================================================= */

const lernImpulseKategorien=[
     {id:"quick",icon:"       ",title:"Quick Impulse",text:"Ein kleiner Lernschritt für zwischendurch."},
     {id:"verstehen",icon:"       ",title:"Verstehen",text:"Zusammenhänge erkennen statt nur auswendig lernen."},
     {id:"nachdenken",icon:"       ",title:"Nachdenken",text:"Den eigenen Lernweg bewusst wahrnehmen."},
     {id:"anwenden",icon:"       ",title:"Anwenden",text:"Wissen in einer konkreten Situation nutzen."},
     {id:"wiederholen",icon:"       ",title:"Wiederholen",text:"Wichtiges aktiv aus dem Gedächtnis holen."},
     {id:"challenge",icon:"       ",title:"Challenge",text:"Eine kleine Herausforderung annehmen."},
     {id:"haengt",icon:"       ",title:"Wenn du hängst",text:"Einen Weg aus einer Lernblockade finden."},
     {id:"ueberraschung",icon:"       ",title:"Überraschungsimpuls",text:"Ein zufälliger Impuls für deinen Lernweg."}
];

const lernImpulse=[
  {id:"q1",cat:"quick",title:"60-Sekunden-Start",task:"Öffne deine aktuelle Lernaufgabe. Schreibe in einem Satz auf: Was soll am Ende herauskommen?",hint:"Noch nicht lösen – nur das Ziel klären.",next:"Formuliere danach den ersten konkreten Arbeitsschritt."},
  {id:"q2",cat:"quick",title:"Ein Begriff",task:"Wähle einen wichtigen Begriff aus deinem aktuellen Thema und erkläre ihn mit maximal 12 Wörtern.",hint:"So, dass ihn eine Mitschülerin oder ein Mitschüler verstehen würde.",next:"Prüfe danach deine Erklärung am Material."},
  {id:"q3",cat:"quick",title:"Ein Satz",task:"Schreibe: „Das Wichtigste, das ich heute verstanden habe, ist …“",hint:"Ein klarer Satz reicht.",next:"Markiere anschließend die passende Stelle im Material."},
  {id:"q4",cat:"quick",title:"Nächster Schritt",task:"Benenne genau eine Sache, die du jetzt als Nächstes erledigst.",hint:"Nicht fünf Dinge – genau eines.",next:"Setze diesen Schritt sofort für fünf Minuten um."},
  {id:"q5",cat:"quick",title:"Lernumgebung",task:"Verändere genau eine Sache an deinem Arbeitsplatz, die dich gerade ablenkt.",hint:"Zum Beispiel Tabs schließen, Handy weglegen oder Material bereitlegen.",next:"Starte danach direkt mit deiner Aufgabe."},

  {id:"v1",cat:"verstehen",title:"Warum?",task:"Wähle eine Aussage aus deinem aktuellen Thema und frage dreimal hintereinander: „Warum ist das so?“",hint:"Versuche bei jeder Antwort eine Ebene tiefer zu kommen.",next:"Formuliere den Zusammenhang in einem eigenen Satz."},
  {id:"v2",cat:"verstehen",title:"Erklären statt abschreiben",task:"Erkläre einen schwierigen Inhalt laut, als würdest du ihn jemandem erklären, der noch nichts darüber weiß.",hint:"Verwende nur Fachbegriffe, die du erklären kannst.",next:"Notiere den Punkt, an dem du ins Stocken kommst."},
  {id:"v3",cat:"verstehen",title:"Zusammenhang finden",task:"Nimm zwei Begriffe aus deinem Thema. Was haben sie miteinander zu tun?",hint:"Auch Unterschiede oder Ursache-Wirkungs-Beziehungen zählen.",next:"Zeichne oder formuliere die Verbindung."},
  {id:"v4",cat:"verstehen",title:"Beispiel bauen",task:"Finde selbst ein konkretes Beispiel, an dem dein aktueller Lerninhalt sichtbar wird.",hint:"Ein gutes Beispiel macht den Inhalt anschaulich.",next:"Prüfe, ob das Beispiel auch jemand anderes verstehen würde."},
  {id:"v5",cat:"verstehen",title:"Kernidee",task:"Reduziere deine Notizen auf maximal drei zentrale Aussagen.",hint:"Alles Unwichtige darf weg.",next:"Ordne die drei Aussagen sinnvoll."},

  {id:"n1",cat:"nachdenken",title:"Was kann ich schon?",task:"Bewerte deinen aktuellen Lernstand spontan von 1 bis 10. Was macht deine Zahl aus?",hint:"Es gibt keine richtige Zahl.",next:"Benenne einen Punkt, der deine Zahl um einen Schritt erhöhen könnte."},
  {id:"n2",cat:"nachdenken",title:"Mein Lernweg",task:"Was hat dir beim letzten Lernen tatsächlich geholfen?",hint:"Denke an eine konkrete Situation.",next:"Überlege, wie du diesen Ansatz heute nutzen kannst."},
  {id:"n3",cat:"nachdenken",title:"Fehler mit Nutzen",task:"Denke an einen Fehler. Was kannst du daraus über deinen Denkweg lernen?",hint:"Nicht nur: „Ich habe es falsch gemacht.“",next:"Formuliere eine Regel für deinen nächsten Versuch."},
  {id:"n4",cat:"nachdenken",title:"Energie-Check",task:"Wie viel Energie hast du gerade für deine Aufgabe – niedrig, mittel oder hoch?",hint:"Beobachte dich, ohne dich zu bewerten.",next:"Passe deine Aufgabe daran an."},
  {id:"n5",cat:"nachdenken",title:"Was brauche ich?",task:"Vervollständige: „Damit ich weiterkomme, brauche ich gerade … “",hint:"Vielleicht Wissen, Zeit, Ruhe, Erklärung oder Feedback.",next:"Suche genau diese Unterstützung."},

  {id:"a1",cat:"anwenden",title:"Auf echte Situation übertragen",task:"Übertrage einen Lerninhalt auf eine Situation aus Alltag, Praktikum oder späterem Beruf.",hint:"Was würde sich dort mit diesem Wissen anders betrachten lassen?",next:"Beschreibe die konkrete Situation."},
  {id:"a2",cat:"anwenden",title:"Mini-Fall",task:"Erfinde einen kurzen Fall, bei dem du dein aktuelles Wissen anwenden musst.",hint:"Der Fall sollte eine echte Entscheidung oder Lösung verlangen.",next:"Löse deinen eigenen Fall."},
  {id:"a3",cat:"anwenden",title:"Zeig es",task:"Zeige einen Lerninhalt als Skizze, Ablauf, Tabelle oder Beispiel.",hint:"Wähle die Darstellungsform, die den Zusammenhang am besten sichtbar macht.",next:"Prüfe, ob die Darstellung verständlich ist."},
  {id:"a4",cat:"anwenden",title:"Transferfrage",task:"Frage dich: „Wo könnte mir dieses Wissen außerhalb der Schule nützlich sein?“",hint:"Nimm eine konkrete Situation.",next:"Beschreibe, wie du es dort nutzen würdest."},
  {id:"a5",cat:"anwenden",title:"Entscheiden",task:"Nimm ein aktuelles Problem und entscheide dich für eine Lösung auf Grundlage deines Lernwissens.",hint:"Begründe mit mindestens einem Fachargument.",next:"Prüfe, ob es eine alternative Lösung gibt."},

  {id:"w1",cat:"wiederholen",title:"Buch zu",task:"Schließe dein Material. Schreibe aus dem Kopf alles auf, was du noch weißt.",hint:"Nicht nachschauen.",next:"Vergleiche danach und markiere nur die fehlenden Punkte."},
  {id:"w2",cat:"wiederholen",title:"Drei Fragen",task:"Formuliere drei Prüfungsfragen zu deinem Thema: leicht, mittel und schwierig.",hint:"Die Fragen sollen wirklich prüfbar sein.",next:"Beantworte alle drei ohne Material."},
  {id:"w3",cat:"wiederholen",title:"Karteikarten-Test",task:"Erkläre drei wichtige Begriffe aus dem Kopf.",hint:"Ergänze zu jeder Erklärung ein Beispiel.",next:"Prüfe danach deine Antworten."},
  {id:"w4",cat:"wiederholen",title:"Was fehlt?",task:"Schreibe die fünf wichtigsten Punkte deines Themas aus dem Kopf auf.",hint:"Erst danach vergleichen.",next:"Ergänze genau das, was dir gefehlt hat."},
  {id:"w5",cat:"wiederholen",title:"Morgen-Test",task:"Formuliere eine Frage, die du dir morgen ohne Unterlagen stellen kannst.",hint:"Die Antwort muss überprüfbar sein.",next:"Speichere die Frage in deinen Lernnotizen."},

  {id:"c1",cat:"challenge",title:"Ohne Vorlage",task:"Löse einen kleinen Teil deiner aktuellen Aufgabe ohne Musterlösung.",hint:"Erst selbst denken, dann vergleichen.",next:"Finde genau eine Abweichung."},
  {id:"c2",cat:"challenge",title:"60-Sekunden-Erklärung",task:"Erkläre dein Thema in höchstens 60 Sekunden.",hint:"Nur Kernidee, Zusammenhang und ein Beispiel.",next:"Streiche alles, was nicht unbedingt nötig ist."},
  {id:"c3",cat:"challenge",title:"Schwierigste Frage",task:"Formuliere die schwierigste sinnvolle Frage zu deinem Thema.",hint:"Keine Fangfrage – eine echte Denkfrage.",next:"Versuche sie selbst zu beantworten."},
  {id:"c4",cat:"challenge",title:"Gegenposition",task:"Finde zu deiner eigenen Aussage ein gutes Gegenargument.",hint:"Das Gegenargument muss ernst zu nehmen sein.",next:"Entscheide, welche Position dich stärker überzeugt und warum."},
  {id:"c5",cat:"challenge",title:"Ein Schritt weiter",task:"Verändere eine Bedingung einer Aufgabe, die du bereits kannst. Was passiert?",hint:"Mache aus einer bekannten Aufgabe eine neue.",next:"Löse die veränderte Aufgabe."},

  {id:"h1",cat:"haengt",title:"Problem kleiner machen",task:"Zerlege die Aufgabe, an der du hängst, in drei kleinere Schritte.",hint:"Der erste Schritt darf sehr klein sein.",next:"Bearbeite nur Schritt 1."},
  {id:"h2",cat:"haengt",title:"Was genau ist unklar?",task:"Vervollständige: „Ich komme nicht weiter, weil ich …“",hint:"So wird aus einem diffusen Problem eine konkrete Frage.",next:"Formuliere daraus eine Frage an Material, KI, Mitschüler oder Lehrkraft."},
  {id:"h3",cat:"haengt",title:"Letzter sicherer Punkt",task:"Gehe zurück zu dem Punkt, an dem du noch sicher warst.",hint:"Von dort aus Schritt für Schritt weiter.",next:"Finde den ersten Punkt, an dem die Unsicherheit beginnt."},
  {id:"h4",cat:"haengt",title:"Hilfe richtig holen",task:"Formuliere deine Frage so konkret, dass eine andere Person direkt antworten kann.",hint:"Nicht: „Ich verstehe das nicht.“",next:"Stelle die Frage tatsächlich."},
  {id:"h5",cat:"haengt",title:"5-Minuten-Reset",task:"Unterbrich die Aufgabe für fünf Minuten und komme danach mit einem einzigen nächsten Schritt zurück.",hint:"Die Pause ist Teil der Strategie.",next:"Starte nach der Pause nur mit diesem einen Schritt."},

   {id:"u1",cat:"ueberraschung",title:"Erkläre es mit einem Bild",task:"Finde ein Bild, eine Metapher oder einen Vergleich für einen Lerninhalt.",hint:"Je ungewöhnlicher, desto besser – solange der Zusammenhang stimmt.",next:"Erkläre, warum der Vergleich passt."},
   {id:"u2",cat:"ueberraschung",title:"Lerninhalt als Schlagzeile",task:"Formuliere dein aktuelles Thema als Zeitungsüberschrift.",hint:"Neugierig machend und fachlich passend.",next:"Erkläre in einem Satz, was dahintersteckt."},
   {id:"u3",cat:"ueberraschung",title:"Perspektivwechsel",task:"Betrachte deinen Lerninhalt aus der Perspektive einer anderen Person.",hint:"Zum Beispiel Kind, Kunde, Patient oder Praxispartner.",next:"Formuliere eine Frage aus dieser Perspektive."},
   {id:"u4",cat:"ueberraschung",title:"Falsche Antwort",task:"Erfinde eine plausible, aber falsche Antwort zu deinem Thema.",hint:"Sie soll zunächst überzeugend wirken.",next:"Erkläre genau, warum sie falsch ist."},
   {id:"u5",cat:"ueberraschung",title:"Das würde ich fragen",task:"Wenn du nur eine einzige Frage zu deinem Thema stellen dürftest: Welche wäre es?",hint:"Wähle eine Frage, die deinen Lernweg wirklich weiterbringt.",next:"Suche die Antwort und prüfe sie."}
];

function lernImpulseDone(){
  try{return JSON.parse(localStorage.getItem("campusklasse_lernimpulse_done")||"[]")}catch(e){return []}
}
function lernImpulseSaveDone(ids){
  try{localStorage.setItem("campusklasse_lernimpulse_done",JSON.stringify(ids))}catch(e){}
}
function lernImpulseCategory(id){return lernImpulseKategorien.find(x=>x.id===id)}
function renderLernimpulsCard(i){
  const c=lernImpulseCategory(i.cat);
  return `<button class="card tile impulse-card" onclick="openLernimpuls('${i.id}')"><span class="emoji">${c.icon}</span>
<strong>${esc(i.title)}</strong><small>${esc(i.task)}</small><span class="pill">${esc(c.title)}</span></button>`;
}

async function renderLernimpulse(){
  const done=lernImpulseDone();
  const pct=Math.round(done.length/lernImpulse.length*100);
  return `${pageHead("SELBSTSTÄNDIG LERNEN","Lernimpulse","Du hast zwei Möglichkeiten: gezielt wählen oder dich überraschen lassen.",`<button class="primary" onclick="openRandomLernimpuls(true)">                Impuls drehen</button>`)}
  <div class="grid grid-2 impulse-choice-grid">
    <div class="card">
      <span class="badge">    GEZIELT WÄHLEN</span>
      <h2>Ich weiß, was ich gerade brauche.</h2>
      <p>Wähle einen Bereich, der zu deiner aktuellen Lernsituation passt.</p>
      <div class="grid grid-2">
        ${lernImpulseKategorien.filter(c=>c.id!=="ueberraschung").map(c=>`<button class="card tile impulse-category"
onclick="filterLernimpulse('${c.id}')"><span class="emoji">${c.icon}</span><strong>${esc(c.title)}</strong><small>${esc(c.text)}
</small></button>`).join("")}
      </div>
    </div>
    <div class="card impulse-wheel-card">
              <span class="badge">   ÜBERRASCHUNG</span>
              <div class="impulse-wheel" id="impulseWheel"><div class="impulse-wheel-pointer">▼</div><div class="impulse-wheel-inner">
<span>          </span><strong>Überrasch<br>mich!</strong></div></div>
              <h2>Lass dich überraschen.</h2>
              <p>Ein zufälliger Impuls wird ausgewählt. Wenn du ihn bekommst, ist er jetzt dran.</p>
         <button class="primary" onclick="openRandomLernimpuls(true)">          Jetzt drehen</button>
       </div>
     </div>
  <div class="card impulse-progress-card"><div class="impulse-progress-head"><h3>   Dein Fortschritt</h3><strong>${pct}%</strong>
</div><p>${done.length} von ${lernImpulse.length} Impulsen ausprobiert.</p><div class="progress"><i style="width:${pct}%"></i>
</div></div>
  <div id="impulseList" class="impulse-section"><div class="impulse-section-head"><div class="kicker">GEZIELTE AUSWAHL</div>
<h2>Was passt gerade zu dir?</h2></div><div class="grid grid-3"
id="impulseCards">${lernImpulse.map(renderLernimpulsCard).join("")}</div></div>${footer()}`;
}

function filterLernimpulse(cat){
  const list=$("impulseCards");if(!list)return;
  list.innerHTML=(cat==="all"?lernImpulse:lernImpulse.filter(i=>i.cat===cat)).map(renderLernimpulsCard).join("");
  $("impulseList")?.scrollIntoView({behavior:"smooth",block:"start"});
}

function openRandomLernimpuls(fromWheel=false){
  const wheel=$("impulseWheel");
  if(fromWheel&&wheel){
    wheel.classList.remove("is-spinning");
    void wheel.offsetWidth;
    wheel.classList.add("is-spinning");
  }
  const done=lernImpulseDone();
  const open=lernImpulse.filter(i=>!done.includes(i.id));
  const pool=open.length?open:lernImpulse;
  const i=pool[Math.floor(Math.random()*pool.length)];
  setTimeout(()=>openLernimpuls(i.id,fromWheel),fromWheel?850:0);
}

function openLernimpuls(id,fromWheel=false){
  const i=lernImpulse.find(x=>x.id===id);if(!i)return;
  const c=lernImpulseCategory(i.cat);
  modal(`<button class="modal-close" onclick="closeModal()">×</button>
         <div class="kicker">${fromWheel?"        ZUFALLSIMPULS":"    GEZIELTER IMPULS"} · ${c.icon} ${esc(c.title)}</div>
         <h2>${esc(i.title)}</h2>
    ${fromWheel?`<div class="notice"><strong>    Dieser Impuls ist jetzt dran.</strong><p>Du hast dich überraschen lassen –
probiere genau diesen Impuls aus.</p></div>`:""}
    <div class="card"><span class="badge">DEINE AUFGABE</span><p style="font-size:19px;line-height:1.55;margin- top:10px">${esc(i.task)}</p></div>
    <div class="notice"><strong>   Hinweis</strong><p>${esc(i.hint)}</p></div>
    <label>   Deine kurze Notiz<textarea id="impulseAnswer" rows="4" placeholder="Was hast du gemacht, erkannt oder herausgefunden?"></textarea></label>
    <div class="notice"><strong>   Danach</strong><p>${esc(i.next)}</p></div>
    <div class="form-actions"><button class="secondary" onclick="closeModal()">Später</button><button class="primary"
onclick="completeLernimpuls('${i.id}')">✓ Impuls gemacht</button></div>`);
}

function completeLernimpuls(id){
  const answer=$("impulseAnswer")?.value.trim()||"";
  const done=lernImpulseDone();
  if(!done.includes(id))done.push(id);
  lernImpulseSaveDone(done);
  const i=lernImpulse.find(x=>x.id===id);
  closeModal();
  toast("Impuls geschafft – gut gemacht!");
  modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">✓ GESCHAFFT</div><h2>Du hast ihn
gemacht.</h2><p><strong>${esc(i?.title||"Lernimpuls")}</strong> ist erledigt.</p>${answer?`<div class="card"><strong>Deine
Notiz</strong><p>${esc(answer)}</p></div>`:""}<div class="notice"><strong>   Dein nächster Schritt</strong>
<p>${esc(i?.next||"Weiterlernen.")}</p></div><div class="form-actions"><button class="secondary"
onclick="closeModal()">Fertig</button><button class="primary" onclick="closeModal();openRandomLernimpuls(true)">                 Nächsten
Impuls drehen</button></div>`);
}

window.openLernimpuls=openLernimpuls;
window.openRandomLernimpuls=openRandomLernimpuls;
window.filterLernimpulse=filterLernimpulse;
window.completeLernimpuls=completeLernimpuls;

async function render(){
  if(!currentUser)return;
  const p=location.hash.replace("#","")||"start";
  const pages={
    start:renderStart,
    kompass:renderKompass,
    lernwerkstatt:renderLernwerkstatt,
    ressourcen:renderRessourcenRoute,
    lernpfad:renderLernpfadRoute,
    forum:renderForum,
    projekte:renderProjekte,
    kompetenz:renderKompetenz,
    journal:renderLernjournalRoute,
    praktikum:renderPraktikum,
    ki:renderKI,
    kalender:renderKalender,
    team:renderTeam,
    impulse:renderLernimpulse,
         lernstand:()=>modulePlaceholder("        Lernstandsmessung"),
         resilienz:()=>modulePlaceholder("        Resilienz & Respressi"),
    kompetenzprofil:()=>modulePlaceholder("    Kompetenzprofil"),
    methoden:renderLernmethoden,
    lerncoaching:renderLerncoaching};
  const fn=pages[p]||renderStart;
  document.querySelectorAll(".nav-link").forEach(a=>a.classList.toggle("active",a.dataset.page===p));
  try{
    $("content").innerHTML=await fn();
    if(p==="kompetenz"){
      $("competencySearch")?.addEventListener("input",filterCompetencyNetwork);
      $("competencyCategory")?.addEventListener("change",filterCompetencyNetwork);
      $("competencyHelpersOnly")?.addEventListener("change",filterCompetencyNetwork);
    }
  }catch(e){
    console.error("Campus-Seitenfehler:",e);
    $("content").innerHTML=`<div class="card"><h3>Die Seite konnte nicht geladen werden.</h3><p>${esc(e?.message||"Unbekannter Fehler")}</p></div>`;
  }
  $("sidebar").classList.remove("open");
}
function modulePlaceholder(title){
  return `${pageHead("CAMPUS-MODUL",title,"Dieser Bereich ist in der Master-Struktur vorbereitet.",`<button class="secondary"
onclick="go('start')">← Startseite</button>`)}
  <div class="card"><span class="badge">   VORBEREITET</span><h2>${title}</h2><p>Dieser Bereich wird später als eigenes Modul
entwickelt. Die übrige Campus-App bleibt dabei unverändert.</p></div>${footer()}`;
}


/* =========================================================
   CAMPUSKLASSE – MODAL BRIDGE
   app.js wird als ES-Modul geladen. Funktionen aus einem
   ES-Modul sind nicht automatisch window-global.
   Die bestehenden Modal-Formulare verwenden jedoch inline
   onclick="...". Deshalb werden die benötigten Aktionen
   hier explizit nach window exportiert.
   ========================================================= */
window.__CampusModalBridgeInstalled=true;
window.addCalendar=addCalendar;
window.addCompetence=addCompetence;
window.addJournal=addJournal;
window.addPost=addPost;
window.addPractice=addPractice;
window.addProject=addProject;
window.addTask=addTask;
window.closeModal=closeModal;
window.commentPost=commentPost;
window.deletePost=deletePost;
window.focusComment=focusComment;
window.likePost=likePost;
window.openCalendarForm=openCalendarForm;
window.openCompetenceForm=openCompetenceForm;
window.openCompetencyHelp=openCompetencyHelp;
window.createCompetencyHelpPost=createCompetencyHelpPost;
window.openHelpForm=openHelpForm;
window.openJournalForm=openJournalForm;
window.printSingleJournalPDF=printSingleJournalPDF;
window.printMyJournalPDF=printMyJournalPDF;
window.openJournalEntry=openJournalEntry;
window.openJournalLibrary=openJournalLibrary;
window.openTeacherJournalOverview=openTeacherJournalOverview;
window.downloadStudentJournalPDF=downloadStudentJournalPDF;
window.downloadAllJournalsPDF=downloadAllJournalsPDF;
window.openPostForm=openPostForm;
window.openPracticeForm=openPracticeForm;
window.openProjectForm=openProjectForm;
window.openTaskForm=openTaskForm;


/* CAMPUS MODULE BRIDGE
   ES-Module erhalten die gemeinsamen Render-Helfer über window.
*/
window.__CampusModuleBridge=true;
window.CampusFirebase=window.CampusFirebase||{};
window.CampusFirebase.pageHead=pageHead;
window.CampusFirebase.footer=footer;
window.CampusFirebase.modal=modal;
window.CampusFirebase.toast=toast;

window.addEventListener("hashchange",render);
window.go=p=>{location.hash=p};

function openTaskForm(){
  modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">CAMPUS-KOMPASS</div><h2>Neue
Aufgabe</h2><div class="form"><label>Aufgabe<input id="fTitle" placeholder="Was soll erledigt werden?" required></label>
<label>Verantwortlich<input id="fOwner" placeholder="Name"></label><label>Deadline<input id="fDeadline" type="date"></label>
<label>Status<select id="fStatus"><option value="green">Auf Kurs</option><option value="yellow">Klärungsbedarf</option><option
value="red">Handlungsbedarf</option></select></label><label>Nächste Schritte<textarea id="fNext" rows="3"></textarea></label><div
class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary"
onclick="addTask()">Speichern</button></div></div>`);
}
async function addTask(){
  try{await addDoc(collection(db,"tasks"),{title:$("fTitle").value.trim()||"Neue Aufgabe",ownerName:$("fOwner").value.trim()||profile.displayName,ownerUid:currentUser.uid,deadline:cleanDateInput($("fDeadline").
value),status:$("fStatus").value,next:$("fNext").value.trim()||"Nächsten Schritt festlegen",createdBy:currentUser.uid,createdAt:serverTimestamp()});closeModal();await render();toast("Aufgabe gespeichert.")}catch(e){toast("Speichern nicht möglich.");console.error(e)}
}
function openPostForm(defaultType="question"){
  modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">CAMPUS-FORUM</div><h2>Beitrag
schreiben</h2><div class="form"><label>Kategorie<select id="pType"><option value="question"
${defaultType==="question"?"selected":""}>             Frage</option><option value="info" ${defaultType==="info"?"selected":""}>
Info</option><option value="idea" ${defaultType==="idea"?"selected":""}>                Idee</option><option value="project">
Projekt</option><option value="practice">    Praxis</option></select></label><label>Beitrag<textarea id="pText" rows="5"
placeholder="Was möchtest du teilen?" required></textarea></label><div class="form-actions"><button class="secondary"
onclick="closeModal()">Abbrechen</button><button class="primary" onclick="addPost()">Veröffentlichen</button></div></div>`);
}
async function addPost(){
  const text=$("pText").value.trim();if(!text){toast("Bitte Beitrag eingeben.");return}
  try{await addDoc(collection(db,"posts"),
{authorUid:currentUser.uid,authorName:profile.displayName,type:$("pType").value,text,likes:0,comments:
[],createdAt:serverTimestamp()});closeModal();await render();toast("Beitrag veröffentlicht.")}catch(e){toast("Beitrag konnte nicht gespeichert werden.");console.error(e)}
}
async function likePost(id){try{await updateDoc(doc(db,"posts",id),{likes:increment(1)}) ;await render()}catch(e){toast("Aktion nicht möglich.")}}
async function commentPost(id){
  const input=$("comment-"+id), text=input.value.trim();if(!text)return;
  try{await updateDoc(doc(db,"posts",id),{comments:arrayUnion({uid:currentUser.uid,name:profile.displayName,text,createdAt:new
Date().toISOString()})});await render()}catch(e){toast("Antwort konnte nicht gespeichert werden.")}
}
function focusComment(id){setTimeout(()=>{const e=$("comment-"+id);if(e)
{e.focus();e.scrollIntoView({behavior:"smooth",block:"center"});}},80)}
async function deletePost(id){if(!confirm("Beitrag wirklich löschen?"))return;try{await deleteDoc(doc(db,"posts",id));await
render()}catch(e){toast("Löschen nicht erlaubt.")}}
function openHelpForm(){openPostForm("idea")}
function openProjectForm(){
  modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">PROJEKTE</div><h2>Projekt anlegen</h2>
<div class="form"><label>Projektname<input id="xTitle"></label><label>Team<input id="xTeam"></label><label>Praxispartner<input
id="xPartner"></label><label>Ziel<textarea id="xGoal" rows="3"></textarea></label><label>Fortschritt (0–100)<input id="xProgress"
type="number" min="0" max="100" value="0"></label><div class="form-actions"><button class="secondary"
onclick="closeModal()">Abbrechen</button><button class="primary" onclick="addProject()">Speichern</button></div></div>`);
}
async function addProject(){try{await addDoc(collection(db,"projects"),{title:$("xTitle").value.trim()||"Neues Projekt",team:$("xTeam").value.trim()||"Team",partner:$("xPartner").value.trim()||"—",progress:Math.max(0,Math.min(100,Number($(" xProgress").value)||0)),status:"green",goal:$("xGoal").value.trim()||"Ziel ergänzen",createdBy:currentUser.uid,createdAt:serverTimestamp()});closeModal();await render();toast("Projekt angelegt.")}catch(e)
{toast("Projekt konnte nicht angelegt werden.")}}
function openJournalForm(){modal(`<button class="modal-close" onclick="closeModal()">×</button><div
class="kicker">LERNJOURNAL</div><h2>Neuer Reflexionseintrag</h2><div class="form"><label>Titel<input id="jTitle"></label>
<label>Ausführliche Reflexion<textarea id="jText" rows="18" placeholder="Was habe ich gelernt?

Was ist mir besonders gut gelungen?

Was war schwierig oder hat mich beschäftigt?

Was habe ich über mich und mein Lernen erfahren?

Welche Erkenntnis nehme ich mit?

Was möchte ich noch üben oder besser verstehen?

Was ist mein nächster konkreter Schritt?

Du kannst ausführlich und in mehreren Absätzen schreiben."></textarea></label><label>Stimmung<select id="jMood"><option>                </option><option>
</option><option> </option><option> </option><option> </option></select></label><div class="form-actions"><button
class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="addJournal()">Speichern</button>
</div></div>`)}
async function addJournal(){try{await addDoc(collection(db,"journal"),
{uid:currentUser.uid,title:$("jTitle").value.trim()||"Reflexion",text:$("jText").value.trim()||"—",mood:$("jMood").value,createdAt:serverTimestamp()});closeModal();await render();toast("Journal gespeichert.")}catch(e){toast("Journal konnte nicht gespeichert werden.")}}
function openCompetenceForm(){
  const categories=["Auftreten & Kommunikation","Schreiben & Sprache","Lernen & Denken","Mathematik & analytisches Denken","Kreativität & Gestaltung","Digital & KI","Zusammenarbeit","Persönliche Stärken","Musik & Ausdruck","Sport & Bewegung","Praktisches & Handwerk","Sonstiges"];
  modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">🧩 MEINE KOMPETENZ</div><h2>Was kannst du gut?</h2><p>Auch kleine Fähigkeiten können für andere wertvoll sein.</p><div class="form"><label>⭐ Meine Kompetenz<input id="cName" placeholder="z. B. Präsentieren, Canva, Singen, gut erklären …" required></label><label>🗂️ Bereich<select id="cCategory">${categories.map(c=>`<option>${esc(c)}</option>`).join("")}</select></label><label>💪 Wie gut schätzt du dich ein?<select id="cLevel"><option value="1">🌱 1 – probiere ich gerade aus</option><option value="2">🙂 2 – kann ich schon etwas</option><option value="3" selected>💪 3 – kann ich gut</option><option value="4">🚀 4 – kann ich sehr gut</option><option value="5">⭐ 5 – kann ich anderen zeigen</option></select></label><label>📝 Was genau kannst du?<textarea id="cDescription" rows="3"></textarea></label><label><input id="cCanHelp" type="checkbox"> 🤝 <strong>Ich kann anderen dabei helfen.</strong></label><label>💬 Wenn jemand Hilfe braucht …<textarea id="cHelpText" rows="2"></textarea></label><div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="addCompetence()">Kompetenz eintragen</button></div></div>`);
}
async function addCompetence(){
  const name=$("cName")?.value.trim();if(!name){toast("Bitte eine Kompetenz eintragen.");return}
  try{await addDoc(collection(db,"competencies"),{uid:currentUser.uid,ownerName:profile?.displayName||currentUser?.email||"Campus-Mitglied",name,category:$("cCategory").value,level:Math.max(1,Math.min(5,Number($("cLevel").value)||1)),description:$("cDescription").value.trim()||"",canHelp:Boolean($("cCanHelp").checked),helpText:$("cHelpText").value.trim()||"",createdAt:serverTimestamp()});closeModal();await render();toast("Kompetenz ins Netzwerk aufgenommen.")}catch(e){console.error(e);toast("Kompetenz konnte nicht gespeichert werden.")}
}

function openPracticeForm(){modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">PRAXIS</div>
<h2>Praxisauftrag</h2><div class="form"><label>Titel<input id="rTitle"></label><label>Datum<input id="rDate" type="date"></label>
<label>Beschreibung<textarea id="rText" rows="4"></textarea></label><div class="form-actions"><button class="secondary"
onclick="closeModal()">Abbrechen</button><button class="primary" onclick="addPractice()">Speichern</button></div></div>`)}
async function addPractice(){try{await addDoc(collection(db,"practice"),
{title:$("rTitle").value.trim()||"Praxisauftrag",date:cleanDateInput($("rDate").value),state:"offen",text:$("rText").value.trim()
||"Beschreibung ergänzen",createdBy:currentUser.uid,createdAt:serverTimestamp()});closeModal();await
render();toast("Praxisauftrag gespeichert.")}catch(e){toast("Praxisauftrag konnte nicht gespeichert werden.")}}
function openCalendarForm(){modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">CAMPUS-
KALENDER</div><h2>Termin ergänzen</h2><div class="form"><label>Titel<input id="calTitle"></label><label>Datum<input id="calDate"
type="date"></label><div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button><button
class="primary" onclick="addCalendar()">Speichern</button></div></div>`)}
async function addCalendar(){try{await addDoc(collection(db,"calendar"),
{title:$("calTitle").value.trim()||"Termin",date:cleanDateInput($("calDate").value),createdBy:currentUser.uid,createdAt:serverTimestamp()});closeModal();await render();toast("Termin gespeichert.")}catch(e){toast("Termin konnte nicht gespeichert werden.")}}

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
