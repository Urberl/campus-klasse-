let initializeApp, getAuth, onAuthStateChanged, createUserWithEmailAndPassword,     signInWithEmailAndPassword, signOut, sendPasswordResetEmail, updateProfile; let getFirestore, collection, doc, addDoc, setDoc, updateDoc, deleteDoc,     getDoc, getDocs, query, orderBy, limit, where, onSnapshot,     serverTimestamp, arrayUnion, increment;  let firebaseReadyPromise = null; async function loadFirebase(){   if(firebaseReadyPromise) return firebaseReadyPromise;   firebaseReadyPromise = Promise.all([     import("https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js"),     import("https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js"),     import("https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js")   ]).then(([appMod, authMod, fsMod])=>{     ({initializeApp}=appMod);  ({getAuth,onAuthStateChanged,createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,sendPasswordResetEmail,updateProfile}=authMod);  ({getFirestore,collection,doc,addDoc,setDoc,updateDoc,deleteDoc,getDoc,getDocs,query,orderBy,limit,where,onSnapshot,serverTimestamp,arrayUnion,increment}=fsMod);     if(!app) app=initializeApp(firebaseConfig);     if(!auth) auth=getAuth(app);     if(!db) db=getFirestore(app);     window.CampusFirebase={        get db(){return db},        get currentUser(){return currentUser},        collection,doc,addDoc,setDoc,updateDoc,deleteDoc,getDoc,getDocs,        query,orderBy,limit,where,onSnapshot,serverTimestamp,arrayUnion,increment,        modal,toast,pageHead,footer,render     };     return true;   });   return firebaseReadyPromise; }  /*
     WICHTIG:
     Diese Werte werden nach dem Anlegen deiner Firebase-Web-App aus
     der Firebase Console hier eingesetzt.
*/ const firebaseConfig = {    apiKey: "AIzaSyAI7xMbH4TqCGh1BJKyRyv_LQtqlsLUDNc",    authDomain: "campus-klasse.firebaseapp.com",    projectId: "campus-klasse",    storageBucket: "campus-klasse.firebasestorage.app",    messagingSenderId: "164958867141",    appId: "1:164958867141:web:676ab50f17f8a4b710eaac",    measurementId: "G-VYLG8YKT9E" };   /* =========================================================
   CAMPUSKLASSE MASTER – STABILE MODULREGISTRY
   Die Master-App selbst enthält keine Pflicht-Imports
   von Zusatzmodulen. Module werden erst beim Öffnen geladen.
   ========================================================= */ const CAMPUS_MODULES={      lernpfad:{label:"        Persönlicher Lernpfad",route:"lernpfad",ready:true},      lernressourcen:{label:"        Lernressourcen",route:"ressourcen",ready:true},      lernjournal:{label:"        Lernjournal",route:"journal",ready:true},      lernmethoden:{label:"        Lernmethoden",route:"methoden",ready:false},      lernimpulse:{label:"        Lernimpulse",route:"impulse",ready:false},      lernstand:{label:"        Lernstandsmessung",route:"lernstand",ready:false},      lerncoaching:{label:"        Lerncoaching",route:"lerncoaching",ready:false},      resilienz:{label:"        Resilienz & Respressi",route:"resilienz",ready:false},      kompetenz:{label:"        Kompetenzwerkstatt",route:"kompetenz",ready:true},      forum:{label:"        Campus-Forum",route:"forum",ready:true},      projekte:{label:"        Projekte",route:"projekte",ready:true},      praxis:{label:"        fpA",route:"praktikum",ready:true},      ki:{label:"        KI-Innovationslabor",route:"ki",ready:true},      kalender:{label:"        Campus-Kalender",route:"kalender",ready:true},      kompetenzprofil:{label:"        Kompetenzprofil",route:"kompetenzprofil",ready:false},      team:{label:" Lehrkräfte Klassenteam",route:"team",ready:true} };  const configReady = !Object.values(firebaseConfig).some(v => String(v).includes("HIER_") || String(v).includes("DEIN-PROJEKT"));  let app=null, auth=null, db=null;  const $=id=>document.getElementById(id); const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
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

async function renderLernjournalRoute(){
  try{
    return await renderJournal();
  }catch(error){
    console.error("Lernjournal konnte nicht geladen werden:",error);
    return moduleError("Lernjournal","app.js",error);
  }
}

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
  if(!db) return [];
  const load=async()=>{
    try{
      const q=query(collection(db,name),orderBy(sortField,desc?"desc":"asc"),limit(100));
      const snap=await getDocs(q);
      return snap.docs.map(d=>({id:d.id,...d.data()}));
    }catch(e){
      console.warn("Sortierte Abfrage fehlgeschlagen, Fallback ohne orderBy:",name,e);
      try{
        const snap=await getDocs(collection(db,name));
        const rows=snap.docs.map(d=>({id:d.id,...d.data()}));
        rows.sort((a,b)=>{
          const av=a?.[sortField]?.seconds ?? a?.[sortField] ?? "";
          const bv=b?.[sortField]?.seconds ?? b?.[sortField] ?? "";
          return desc ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
        });
        return rows.slice(0,100);
      }catch(fallbackError){
        console.error("Firestore-Abfrage fehlgeschlagen:",name,fallbackError);
        return [];
      }
    }
  };
  return await Promise.race([
    load(),
    new Promise(resolve=>setTimeout(()=>{console.warn("Firestore-Abfrage Timeout:",name);resolve([])},7000))
  ]);
}

function fmtDate(v){if(!v)return"—";if(v.seconds)return new Date(v.seconds*1000).toLocaleDateString("de-DE");return String(v)}
function cleanDateInput(v){return v||"—"}

async function renderStart(){
  // Die Startseite darf nicht von Firestore-Abfragen abhängen.
  // So bleibt der Campus auch dann erreichbar, wenn Firebase langsam ist oder
  // eine einzelne Sammlung vorübergehend nicht antwortet.
  let displayName=profile?.displayName||currentUser?.email||"Campus-Mitglied";
  return `${pageHead("ÜBERSICHT","Unser Campus","Willkommen ${esc(displayName)} – hier findest du die wichtigsten Bereiche auf einen Blick.")}
  <section class="hero"><div><span class="badge">CAMPUSKLASSE 26/27</span><h1>Willkommen auf dem Campus.</h1><p>Hier verbinden wir Lernen, Projekte, Praxis und Gemeinschaft. Alle angemeldeten Mitglieder arbeiten am selben digitalen Campus.</p></div><div class="actions"><button class="primary" onclick="go('kompass')">Mein Kompass →</button><button class="secondary" onclick="go('forum')">Campus-Forum</button></div></section>
  <div class="grid grid-4">
    ${tile("🧭","Campus-Kompass","Dein persönlicher Lern- und Projektüberblick.","kompass")}
    ${tile("🛠️","Lernwerkstatt","Lernaufträge, Methoden, Tools und KI.","lernwerkstatt")}
    ${tile("💬","Campus-Forum","Austauschen, fragen, helfen und gemeinsam denken.","forum")}
    ${tile("🚀","Projekte","Projektteams, Ziele, Fortschritt und Ergebnisse.","projekte")}
    ${tile("🧩","Kompetenzwerkstatt","Kompetenzen sichtbar machen und entwickeln.","kompetenz")}
    ${tile("📓","Lernjournal","Lernweg, Reflexionen und nächste Schritte.","journal")}
    ${tile("🏢","fpA","Praxisaufträge und Reflexion.","praktikum")}
    ${tile("🤖","KI-Innovationslabor","KI-Ideen und Innovationspartnerschaften.","ki")}
    ${tile("🌱","Resilienz & Respressi","Interaktive Übungen für deinen Alltag.","resilienz")}
    ${tile("🗓️","Campus-Kalender","Schuljahr 2026/27 und Termine.","kalender")}
    ${tile("👥","Team & SQ","Gemeinsam organisieren und entwickeln.","team")}
  </div>
  <div class="card" style="margin-top:16px"><h3>Campus startet</h3><p>Wähle einen Bereich oben aus. Inhalte werden erst beim Öffnen des jeweiligen Moduls aus der Datenbank geladen.</p></div>${footer()}`;
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
  try{
    const snap=await getDocs(collection(db,"competencies"));
    data=snap.docs.map(d=>({id:d.id,...d.data()}));
  }catch(e){
    console.error("Kompetenznetzwerk:",e);networkAvailable=false;
    try{
      const mine=await getDocs(query(collection(db,"competencies"),where("uid","==",currentUser.uid)));
      data=mine.docs.map(d=>({id:d.id,...d.data()}));
    }catch(inner){console.error(inner)}
  }

  const categories=[
    ["🎤","Auftreten & Kommunikation"],["✍️","Schreiben & Sprache"],
    ["🧠","Lernen & Denken"],["🔢","Mathematik & analytisches Denken"],
    ["🎨","Kreativität & Gestaltung"],["💻","Digital & KI"],
    ["🤝","Zusammenarbeit"],["🌱","Persönliche Stärken"],
    ["🎵","Musik & Ausdruck"],["🏃","Sport & Bewegung"],
    ["🛠️","Praktisches & Handwerk"],["✨","Sonstiges"]
  ];
  const mine=data.filter(x=>x.uid===currentUser.uid);

  return `${pageHead("GEMEINSAM STÄRKER","Kompetenznetzwerk","Jeder kann etwas. Niemand kann alles. Gemeinsam können wir mehr.",`<button class="primary" onclick="openCompetenceForm()">＋ Meine Kompetenz</button>`)}
  <section class="hero competency-hero">
    <div><span class="badge">🤝 CAMPUS KANN WAS</span><h1>Was kannst du gut?</h1>
    <p>Trage ein, was du kannst – von Präsentieren und Rechnen bis Canva, Singen, Schreiben oder anderen Menschen etwas erklären. So entsteht ein Netzwerk, in dem wir uns gegenseitig helfen können.</p></div>
    <div class="competency-motto"><strong>„Jeder kann etwas.<br>Gemeinsam können wir mehr.“</strong></div>
  </section>
  ${!networkAvailable?`<div class="notice"><strong>ℹ️ Gemeinsames Netzwerk noch nicht vollständig erreichbar.</strong><p>Deine eigenen Einträge werden trotzdem angezeigt. Falls Firestore den gemeinsamen Zugriff noch nicht erlaubt, müssen die Regeln angepasst werden.</p></div>`:""}
  <div class="grid grid-4 competency-stats">
    <div class="card stat"><b>${data.length}</b><span>Kompetenzen</span></div>
    <div class="card stat"><b>${data.filter(x=>x.canHelp).length}</b><span>Hilfe-Angebote</span></div>
    <div class="card stat"><b>${mine.length}</b><span>Meine Kompetenzen</span></div>
    <div class="card stat"><b>${new Set(data.map(x=>x.uid)).size}</b><span>Mitglieder</span></div>
  </div>
  <div class="card" style="margin-top:12px"><div class="page-head" style="margin-bottom:10px">
    <div><div class="kicker">🧩 MEINE KOMPETENZEN</div><h2>Was bringe ich mit?</h2><p>Auch kleine Fähigkeiten können für andere wertvoll sein.</p></div>
    <button class="secondary" onclick="openCompetenceForm()">＋ Ergänzen</button>
  </div>
  ${mine.length?`<div class="grid grid-3">${mine.map(c=>competencyCard(c,true)).join("")}</div>`:`<div class="empty"><strong>Dein Kompetenzprofil ist noch leer.</strong><p>Füge deine erste Kompetenz hinzu.</p><button class="primary" onclick="openCompetenceForm()">⭐ Erste Kompetenz eintragen</button></div>`}</div>

  <div class="card" style="margin-top:12px"><div class="kicker">🤝 CAMPUS HILFT</div><h2>Wer kann was?</h2><p>Finde jemanden, der dich mit seinem Können unterstützen kann.</p>
    <div class="toolbar competency-toolbar">
      <input class="search" id="competencySearch" placeholder="Kompetenz oder Name suchen …">
      <select id="competencyCategory"><option value="all">Alle Bereiche</option>${categories.map(c=>`<option value="${esc(c[1])}">${c[0]} ${esc(c[1])}</option>`).join("")}</select>
      <label class="competency-check"><input id="competencyHelpersOnly" type="checkbox"> Nur „Ich kann helfen“</label>
    </div>
    <div class="grid grid-3" id="competencyNetwork">${data.map(c=>competencyCard(c,false)).join("")||`<div class="empty"><strong>Noch keine Kompetenzen im Netzwerk.</strong><p>Sei die erste Person.</p></div>`}</div>
  </div>
  <div class="card" style="margin-top:12px;background:var(--soft-green)"><span class="badge">💚 UNSER CAMPUS-GEDANKE</span><h2>Wissen teilen ist eine Stärke.</h2><p>Du musst nicht alles können. Vielleicht kannst du etwas, das jemand anderes gerade braucht – und umgekehrt.</p><p><strong>„Ich kann dir helfen. Du kannst mir helfen. Zusammen kommen wir weiter.“</strong></p></div>
  ${footer()}`;
}
function competencyCard(c,mine){
  const level=Math.max(1,Math.min(5,Number(c.level)||1)),bars="●".repeat(level)+"○".repeat(5-level);
  const initials=String(c.ownerName||"Campus").trim().split(/\s+/).slice(0,2).map(x=>x[0]).join("").toUpperCase();
  return `<article class="card competency-card" data-name="${esc((c.ownerName||"")+" "+(c.name||""))}" data-category="${esc(c.category||"Sonstiges")}" data-help="${c.canHelp?"yes":"no"}">
    <div class="competency-card-head"><div class="competency-avatar">${esc(initials||"C")}</div><div><strong>${esc(c.name||"Kompetenz")}</strong><small>${esc(c.ownerName||"Campus-Mitglied")}</small></div></div>
    <span class="pill">${esc(c.category||"Sonstiges")}</span><div class="competency-level">${bars}</div>
    ${c.description?`<p>${esc(c.description)}</p>`:""}
    ${c.canHelp?`<div class="notice competency-help"><strong>🤝 Ich kann helfen</strong>${c.helpText?`<p>${esc(c.helpText)}</p>`:""}</div>`:`<div class="competency-no-help">🌱 Lernt bzw. entwickelt sich weiter</div>`}
    ${mine?`<span class="pill">Meine Kompetenz</span>`:(c.canHelp?`<button class="primary competency-contact" onclick="openCompetencyHelp('${c.ownerUid}','${esc(c.ownerName||"Campus-Mitglied")}','${esc(c.name||"Kompetenz")}')">💬 Hilfe anfragen</button>`:"")}
  </article>`;
}
function filterCompetencyNetwork(){
  const q=($("competencySearch")?.value||"").toLowerCase().trim(),cat=$("competencyCategory")?.value||"all",only=$("competencyHelpersOnly")?.checked;
  document.querySelectorAll("#competencyNetwork .competency-card").forEach(card=>{
    card.hidden=!((!q||card.dataset.name.toLowerCase().includes(q))&&(cat==="all"||card.dataset.category===cat)&&(!only||card.dataset.help==="yes"));
  });
}
function openCompetencyHelp(uid,name,competency){
  modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">🤝 CAMPUS HILFT</div><h2>Hilfe anfragen</h2><p>Du möchtest <strong>${esc(name)}</strong> zu <strong>${esc(competency)}</strong> ansprechen.</p><label>Deine Nachricht<textarea id="competencyHelpMessage" rows="5" placeholder="Wobei brauchst du Hilfe?"></textarea></label><div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="createCompetencyHelpPost('${uid}','${esc(name)}','${esc(competency)}')">🤝 Hilfeanfrage erstellen</button></div>`);
}
async function createCompetencyHelpPost(uid,name,competency){
  const text=$("competencyHelpMessage")?.value.trim();if(!text){toast("Bitte kurz beschreiben, wobei du Hilfe brauchst.");return}
  try{await addDoc(collection(db,"posts"),{authorUid:currentUser.uid,authorName:profile?.displayName||currentUser?.email||"Campus-Mitglied",type:"question",text:"🤝 Hilfe gesucht bei „"+competency+"“ – @"+name+": "+text,likes:0,comments:[],createdAt:serverTimestamp()});closeModal();toast("Hilfeanfrage wurde im Campus-Forum erstellt.");}
  catch(e){console.error(e);toast("Hilfeanfrage konnte nicht erstellt werden.")}
}
async function renderJournal(){
  let data=[];

  try{
    // Deliberately load the journal collection without a composite index.
    // This avoids the common Firestore index error that otherwise makes the
    // whole journal page disappear.
    const snap=await getDocs(collection(db,"journal"));
    data=snap.docs
      .map(d=>({id:d.id,...d.data()}))
      .filter(j=>j.uid===currentUser.uid);

    data.sort((a,b)=>{
      const ad=a.journalDate||"";
      const bd=b.journalDate||"";
      if(ad!==bd)return bd.localeCompare(ad);
      return (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0);
    });
  }catch(error){
    console.error("Lernjournale konnten nicht geladen werden:",error);
    return `${pageHead(
      "REFLEXION",
      "Lernjournal",
      "Dein Lernweg, Reflexionen und nächste Schritte.",
      isTeacher()?`<button class="secondary" onclick="openTeacherJournalOverview()">👩‍🏫 Schüler-Lernjournale</button>`:""
    )}
    <div class="card">
      <span class="badge">LERNJOURNAL</span>
      <h2>Lernjournal momentan nicht verfügbar</h2>
      <p>Die Lernjournal-Daten konnten nicht geladen werden.</p>
      <button class="primary" onclick="render()">Erneut versuchen</button>
    </div>
    ${footer()}`;
  }

  const teacherButton=isTeacher()
    ? `<button class="secondary" onclick="openTeacherJournalOverview()">👩‍🏫 Schüler-Lernjournale</button>`
    : "";

  const rows=data.map(j=>`
    <div class="journal-library-row">
      <div class="journal-library-date">${esc(journalDisplayDate(j))}</div>
      <button type="button" class="journal-library-title" onclick="openJournalEntry('${esc(j.id)}')">
        ${esc(j.title||"Lernjournal")}
      </button>
      <button type="button" class="journal-pdf-btn" onclick="printJournalEntry('${esc(j.id)}')">📄 PDF</button>
    </div>
  `).join("");

  return `
  <style>
    .journal-two-tiles{
      display:grid;
      grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);
      gap:16px;
      align-items:start;
    }
    .journal-tile{min-width:0}
    .journal-tile-head{
      display:flex;
      justify-content:space-between;
      align-items:flex-start;
      gap:14px;
      margin-bottom:16px;
    }
    .journal-tile-head h2{margin:4px 0 5px}
    .journal-tile-head p{margin:0;color:var(--muted)}
    .journal-form-grid{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:12px;
    }
    .journal-form-grid .full{grid-column:1/-1}
    .journal-library{
      overflow:hidden;
      border:1px solid var(--line,#ddd);
      border-radius:12px;
    }
    .journal-library-head,
    .journal-library-row{
      display:grid;
      grid-template-columns:105px minmax(0,1fr) 68px;
      gap:10px;
      align-items:center;
      padding:11px 12px;
    }
    .journal-library-head{
      background:var(--soft-green);
      color:var(--muted);
      font-size:12px;
      font-weight:700;
      text-transform:uppercase;
      letter-spacing:.04em;
    }
    .journal-library-row{
      border-top:1px solid var(--line,#ddd);
      background:#fff;
    }
    .journal-library-date{
      color:var(--muted);
      font-size:13px;
    }
    .journal-library-title{
      border:0;
      background:none;
      padding:0;
      min-width:0;
      overflow:hidden;
      text-overflow:ellipsis;
      white-space:nowrap;
      text-align:left;
      font:inherit;
      font-weight:700;
      cursor:pointer;
    }
    .journal-library-title:hover{text-decoration:underline}
    .journal-pdf-btn{
      border:1px solid var(--line,#ddd);
      background:#fff;
      border-radius:8px;
      padding:7px 6px;
      cursor:pointer;
      white-space:nowrap;
    }
    .journal-empty{
      padding:24px 16px;
      text-align:center;
      color:var(--muted);
    }
    .journal-detail{
      margin-top:12px;
      padding:14px;
      border:1px solid var(--line,#ddd);
      border-radius:10px;
    }
    .journal-detail strong{display:block;margin-bottom:6px}
    .journal-detail p{margin:0;white-space:pre-wrap}
    @media(max-width:800px){
      .journal-two-tiles{grid-template-columns:1fr}
      .journal-form-grid{grid-template-columns:1fr}
      .journal-form-grid .full{grid-column:auto}
    }
    @media(max-width:520px){
      .journal-library-head,.journal-library-row{
        grid-template-columns:78px minmax(0,1fr) 54px;
        gap:7px;
        padding:10px 8px;
      }
      .journal-library-head{font-size:10px}
      .journal-library-date{font-size:11px}
      .journal-pdf-btn{font-size:10px;padding:6px 3px}
    }
  </style>

  ${pageHead(
    "REFLEXION",
    "Lernjournal",
    "Dein Lernweg, Reflexionen und nächste Schritte.",
    teacherButton
  )}

  <div class="journal-two-tiles">

    <section class="card journal-tile">
      <div class="journal-tile-head">
        <div>
          <span class="badge">✍️ LERNJOURNAL</span>
          <h2>Mein Lernjournal</h2>
          <p>Halte deinen Lernprozess ausführlich fest.</p>
        </div>
      </div>

      <div class="form journal-form-grid">

        <label>Datum
          <input id="jDate" type="date" value="${new Date().toISOString().slice(0,10)}">
        </label>

        <label>Titel
          <input id="jTitle" type="text" placeholder="z. B. Mein Lernfortschritt heute">
        </label>

        <label class="full">Woran habe ich heute gearbeitet?
          <textarea id="jWorkedOn" rows="3" placeholder="Thema, Aufgabe, Projekt oder Lernziel …"></textarea>
        </label>

        <label>Was habe ich verstanden oder gelernt?
          <textarea id="jLearned" rows="4" placeholder="Was ist mir heute klarer geworden? Was kann ich jetzt besser?"></textarea>
        </label>

        <label>Was war schwierig?
          <textarea id="jDifficult" rows="4" placeholder="Was war schwierig oder ist noch unklar?"></textarea>
        </label>

        <label>Was hat mir geholfen?
          <textarea id="jHelpful" rows="4" placeholder="Methode, Person, Material, Erklärung oder Strategie …"></textarea>
        </label>

        <label>Mein nächster Lernschritt
          <textarea id="jNextStep" rows="4" placeholder="Was mache ich als Nächstes?"></textarea>
        </label>

        <label>Befinden beim Lernen
          <select id="jMood">
            <option value="😊">😊 Gut</option>
            <option value="🙂">🙂 Eher gut</option>
            <option value="😐">😐 Ausgeglichen</option>
            <option value="😕">😕 Eher schwierig</option>
            <option value="😣">😣 Schwierig</option>
          </select>
        </label>

        <label>Zufriedenheit mit meinem Lernfortschritt
          <select id="jSatisfaction">
            <option value="⭐">⭐ Noch nicht zufrieden</option>
            <option value="⭐⭐">⭐⭐ Teilweise zufrieden</option>
            <option value="⭐⭐⭐" selected>⭐⭐⭐ Zufrieden</option>
            <option value="⭐⭐⭐⭐">⭐⭐⭐⭐ Sehr zufrieden</option>
            <option value="⭐⭐⭐⭐⭐">⭐⭐⭐⭐⭐ Sehr zufrieden und einen Schritt weiter</option>
          </select>
        </label>

        <div class="full form-actions">
          <button type="button" class="primary" onclick="addJournal()">Lernjournal speichern</button>
        </div>
      </div>
    </section>

    <section class="card journal-tile">
      <div class="journal-tile-head">
        <div>
          <span class="badge">📚 BIBLIOTHEK</span>
          <h2>Meine Lernjournale</h2>
          <p>Alle gespeicherten Lernjournale auf einen Blick.</p>
        </div>
        ${data.length?`<button type="button" class="secondary" onclick="printMyJournals()">📄 Alle PDF</button>`:""}
      </div>

      <div class="journal-library">
        <div class="journal-library-head">
          <span>Datum</span>
          <span>Titel</span>
          <span>PDF</span>
        </div>
        ${rows||`
          <div class="journal-empty">
            <strong>Noch kein Lernjournal vorhanden.</strong><br>
            Erstelle links deinen ersten Eintrag.
          </div>
        `}
      </div>
    </section>

  </div>
  ${footer()}`;
}

function journalDisplayDate(j){
  if(j?.journalDate){
    const d=new Date(j.journalDate+"T00:00:00");
    if(!isNaN(d.getTime()))return d.toLocaleDateString("de-DE");
  }
  return fmtDate(j?.createdAt);
}

async function getTeacherJournalData(){
  if(!isTeacher()){
    throw new Error("Nur Lehrkräfte dürfen die Schüler-Lernjournale öffnen.");
  }

  const snap=await getDocs(
    query(collection(db,"journal"),limit(1000))
  );
  const journals=snap.docs.map(d=>({id:d.id,...d.data()}));

  // Namen aus den Nutzerprofilen ergänzen. Falls ein Profil nicht gelesen
  // werden kann, bleibt die UID als technische Fallback-Anzeige.
  const uids=[...new Set(journals.map(j=>j.uid).filter(Boolean))];
  const users={};

  await Promise.all(uids.map(async uid=>{
    try{
      const us=await getDoc(doc(db,"users",uid));
      if(us.exists()){
        const u=us.data();
        users[uid]=u.displayName||u.email||uid;
      }
    }catch(e){
      console.warn("Profil konnte nicht geladen werden:",uid,e);
    }
  }));

  journals.forEach(j=>{
    j.studentName=users[j.uid]||j.displayName||j.authorName||j.uid||"Unbekannter Schüler";
  });

  journals.sort((a,b)=>{
    const ta=a.createdAt?.seconds||0;
    const tb=b.createdAt?.seconds||0;
    return tb-ta;
  });

  return journals;
}

async function openTeacherJournalOverview(){
  if(!isTeacher()){
    toast("Dieser Bereich ist nur für Lehrkräfte.");
    return;
  }

  try{
    const journals=await getTeacherJournalData();
    const groups={};

    journals.forEach(j=>{
      if(!groups[j.uid]) groups[j.uid]={
        uid:j.uid,
        name:j.studentName,
        entries:[]
      };
      groups[j.uid].entries.push(j);
    });

    const students=Object.values(groups).sort((a,b)=>a.name.localeCompare(b.name,"de"));

    modal(`
      <button class="modal-close" onclick="closeModal()">×</button>
      <div class="kicker">👩‍🏫 LEHRKRAFT</div>
      <h2>Schüler-Lernjournale</h2>
      <p>Wähle einen Schüler aus. Das Lernjournal kann anschließend als PDF ausgegeben werden.</p>

      ${students.length?`
        <div class="teacher-journal-list">
          ${students.map((s,i)=>`
            <div class="teacher-journal-row">
              <div>
                <strong>${esc(s.name)}</strong>
                <small>${s.entries.length} ${s.entries.length===1?"Eintrag":"Einträge"}</small>
              </div>
              <button class="primary" onclick="downloadStudentJournalPDF('${esc(s.uid)}')">
                📄 PDF
              </button>
            </div>
          `).join("")}
        </div>

        <div class="form-actions" style="margin-top:14px">
          <button class="secondary" onclick="downloadAllJournalsPDF()">
            📚 Alle Lernjournale als PDF
          </button>
          <button class="secondary" onclick="closeModal()">Schließen</button>
        </div>
      `:`<div class="empty"><strong>Noch keine Lernjournale vorhanden.</strong></div>`}
    `);
  }catch(e){
    console.error("Lehrkraft-Lernjournale:",e);
    toast("Die Schüler-Lernjournale konnten nicht geladen werden.");
  }
}

function journalPDFDate(value){
  if(!value)return "";
  if(value.seconds)return new Date(value.seconds*1000).toLocaleDateString("de-DE");
  const d=new Date(value);
  return isNaN(d)?"":d.toLocaleDateString("de-DE");
}

function journalPDFTime(value){
  if(!value)return "";
  if(value.seconds)return new Date(value.seconds*1000).toLocaleString("de-DE");
  const d=new Date(value);
  return isNaN(d)?"":d.toLocaleString("de-DE");
}

function openJournalPrintWindow(title,students){
  const win=window.open("","_blank","width=900,height=800");
  if(!win){
    toast("Das PDF-Fenster wurde vom Browser blockiert. Bitte Pop-ups für die Campus-App erlauben.");
    return;
  }

  const studentSections=students.map(student=>`
    <section class="student-section">
      <h1>${escPDF(student.name)}</h1>
      <div class="meta">CampusKlasse · Persönliches Lernjournal</div>
      ${student.entries.length
        ? student.entries.map(j=>`
          <article class="entry">
            <div class="date">${escPDF(journalDisplayDate(j))}</div>
            <h2>${escPDF(j.title||"Lernjournal")}</h2>
            ${j.mood?`<div class="mood">${escPDF(j.mood)} Befinden</div>`:""}
            ${j.satisfaction?`<div class="print-satisfaction">${escPDF(j.satisfaction)} Zufriedenheit</div>`:""}
            ${j.workedOn?`<div class="field"><h3>Woran habe ich heute gearbeitet?</h3><p>${escPDF(j.workedOn).replace(/\n/g,"<br>")}</p></div>`:""}
            ${j.learned?`<div class="field"><h3>Was habe ich verstanden oder gelernt?</h3><p>${escPDF(j.learned).replace(/\n/g,"<br>")}</p></div>`:""}
            ${j.difficult?`<div class="field"><h3>Was war schwierig?</h3><p>${escPDF(j.difficult).replace(/\n/g,"<br>")}</p></div>`:""}
            ${j.helpful?`<div class="field"><h3>Was hat mir geholfen?</h3><p>${escPDF(j.helpful).replace(/\n/g,"<br>")}</p></div>`:""}
            ${j.nextStep?`<div class="field"><h3>Mein nächster Lernschritt</h3><p>${escPDF(j.nextStep).replace(/\n/g,"<br>")}</p></div>`:""}
          </article>
        `).join("")
        : `<p class="empty">Noch keine Einträge.</p>`
      }
    </section>
  `).join("");

  win.document.write(`<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>${escPDF(title)}</title>
<style>
  @page{size:A4;margin:18mm}
  *{box-sizing:border-box}
  body{font-family:Arial,Helvetica,sans-serif;color:#222;line-height:1.55;margin:0}
  h1{font-size:28px;margin:0 0 4px}
  h2{font-size:18px;margin:6px 0 10px}
  .meta{color:#666;font-size:12px;margin-bottom:24px}
  .student-section{page-break-after:always}
  .student-section:last-child{page-break-after:auto}
  .entry{border:1px solid #ddd;border-radius:10px;padding:14px;margin:0 0 14px;break-inside:avoid}
  .date{font-size:11px;color:#777}
  .mood{font-size:22px;margin:4px 0}
  .print-satisfaction{color:#666;font-size:12px;margin-bottom:14px}
  .field{margin:14px 0 0}
  .field h3{font-size:13px;margin:0 0 5px;color:#444}
  .field p{margin:0}
  .empty{color:#777}
  .print-note{background:#f3f3f3;padding:10px;border-radius:8px;margin-bottom:20px;font-size:12px}
  @media print{.print-note{display:none}}
</style>
</head>
<body>
<div class="print-note">Lernjournal für die Dokumentation und pädagogische Begleitung. Im Druckdialog „Als PDF sichern“ bzw. „PDF“ auswählen.</div>
${studentSections}
<script>
window.onload=function(){setTimeout(function(){window.print()},300)}
<\/script>
</body>
</html>`);
  win.document.close();
}

function escPDF(value){
  return String(value??"")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

async function downloadStudentJournalPDF(uid){
  if(!isTeacher()){
    toast("Dieser Bereich ist nur für Lehrkräfte.");
    return;
  }

  try{
    const journals=await getTeacherJournalData();
    const entries=journals.filter(j=>j.uid===uid);
    const name=entries[0]?.studentName||"Schüler/in";

    closeModal();
    openJournalPrintWindow(
      "Lernjournal – "+name,
      [{uid,name,entries}]
    );
  }catch(e){
    console.error(e);
    toast("Das Lernjournal konnte nicht als PDF geöffnet werden.");
  }
}

async function downloadAllJournalsPDF(){
  if(!isTeacher()){
    toast("Dieser Bereich ist nur für Lehrkräfte.");
    return;
  }

  try{
    const journals=await getTeacherJournalData();
    const groups={};

    journals.forEach(j=>{
      if(!groups[j.uid]) groups[j.uid]={
        uid:j.uid,
        name:j.studentName,
        entries:[]
      };
      groups[j.uid].entries.push(j);
    });

    const students=Object.values(groups).sort((a,b)=>a.name.localeCompare(b.name,"de"));

    closeModal();
    openJournalPrintWindow(
      "CampusKlasse – Lernjournale",
      students
    );
  }catch(e){
    console.error(e);
    toast("Die Lernjournale konnten nicht als PDF geöffnet werden.");
  }
}

async function renderResilienz(){
  const skills=[
    {id:"atem",icon:"🌬️",title:"Resonanzatmung",desc:"4 s einatmen · 6 s ausatmen",tag:"Regulation"},
    {id:"boden",icon:"👣",title:"Boden spüren",desc:"Über Körper und Sinne im Hier und Jetzt ankommen",tag:"Körper"},
    {id:"distanz",icon:"🪟",title:"Distanzierung",desc:"Eine belastende Situation kurz von außen betrachten",tag:"Gedanken"},
    {id:"leicht",icon:"🪶",title:"Leichtigkeit",desc:"Den inneren Druck für einen Moment reduzieren",tag:"Gedanken"},
    {id:"bewegung",icon:"⚡",title:"Bewegungsreset",desc:"Kurz aktivieren und danach bewusst zurückkehren",tag:"Körper"},
    {id:"ressource",icon:"🌱",title:"Ressource aktivieren",desc:"Eine eigene Stärke oder hilfreiche Erfahrung aktivieren",tag:"Ressourcen"},
    {id:"kontakt",icon:"🤝",title:"Verbindung",desc:"Soziale Unterstützung bewusst nutzen",tag:"Beziehungen"},
    {id:"fokus",icon:"🎯",title:"Fokus",desc:"Den kleinsten machbaren nächsten Schritt finden",tag:"Handeln"}
  ];
  const favKey="campus_resilienz_schatzkiste";
  let favorites=[]; try{favorites=JSON.parse(localStorage.getItem(favKey)||"[]")}catch(e){favorites=[]}
  const favCount=favorites.length;

  return `${pageHead(
    "RESILIENZ & RESPRESSI",
    "Resilienz & Respressi",
    "Finde heraus, was dir gerade helfen könnte – und probiere es direkt aus.",
    `<button class="primary" onclick="resilienzImpuls()">🎴 Impuls für mich</button>`
  )}
  <style>
    .res-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
    .res-card{text-align:left;min-height:190px;cursor:pointer;transition:.15s}
    .res-card:hover{transform:translateY(-2px)}
    .res-icon{font-size:31px;margin-bottom:8px}.res-tag{display:inline-block;margin-top:8px}
    .res-layout{display:grid;grid-template-columns:1.35fr .65fr;gap:16px}
    .res-scale{width:100%;accent-color:#168fd0}
    .stress-value{font-size:38px;font-weight:800;line-height:1}
    .stress-face{font-size:30px}
    .stress-signs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px}
    .stress-sign{border:1px solid var(--line,#ddd);border-radius:10px;padding:10px;background:#fff}
    .skill-suggest{margin-top:14px;padding:16px;border-radius:14px;background:#eef8fd;border:1px solid #b9dff0}
    .treasure{min-height:260px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer}
    .chest{font-size:82px;line-height:1;margin:10px 0;filter:drop-shadow(0 8px 8px rgba(0,0,0,.12))}
    .treasure-count{margin-top:6px}
    .res-week{margin-top:16px}.res-checks{display:flex;flex-wrap:wrap;gap:8px}
    .breath-wrap{text-align:center;padding:4px 0}
    .breath-circle{width:154px;height:154px;border-radius:50%;margin:18px auto;display:flex;align-items:center;justify-content:center;border:4px solid currentColor;transform:scale(.84);transition:transform 4s linear,opacity .2s}
    .breath-circle.inhale{transform:scale(1.16)}.breath-circle.exhale{transform:scale(.84)}
    .breath-phase{font-size:21px;font-weight:800}.breath-time{font-size:40px;font-weight:800;margin-top:8px}
    .breath-hint{font-size:17px;line-height:1.5;min-height:52px}.breath-progress{height:9px;border-radius:99px;background:rgba(0,0,0,.08);overflow:hidden;margin:16px 0}
    .breath-progress>div{height:100%;width:0%;background:currentColor;transition:width .1s linear}
    .res-task{padding:16px;border:1px solid var(--line,#ddd);border-radius:12px;margin-top:16px}.res-task textarea{width:100%;min-height:90px}
    @media(max-width:1000px){.res-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.res-layout{grid-template-columns:1fr}}
    @media(max-width:600px){.res-grid,.stress-signs{grid-template-columns:1fr}}
  </style>

  <div class="res-layout">
    <div class="card">
      <div class="kicker">DEIN MOMENT</div>
      <h2>🌡️ Wie hoch ist dein Stress gerade?</h2>
      <p>Schätze deinen momentanen Stress von <b>0</b> (ruhig) bis <b>10</b> (sehr angespannt) ein. Es gibt dabei kein „richtig“ oder „falsch“.</p>
      <div style="display:flex;align-items:center;gap:14px;margin:18px 0 8px">
        <div class="stress-value" id="resStressValue">5</div><div class="stress-face" id="resStressFace">😐</div>
      </div>
      <input id="resStress" class="res-scale" type="range" min="0" max="10" value="5" oninput="updateResilienzStress(this.value)">
      <div style="display:flex;justify-content:space-between;color:var(--muted);font-size:12px"><span>0 · ruhig</span><span>5 · angespannt</span><span>10 · sehr hoch</span></div>

      <div class="card" style="margin-top:16px">
        <h3>Woran merkst du es bei dir?</h3>
        <div class="stress-signs" id="resStressSigns">
          <div class="stress-sign">🫀 Herzschlag / Puls</div>
          <div class="stress-sign">🫁 Atmung wird schneller</div>
          <div class="stress-sign">💪 Muskelspannung / Schultern</div>
          <div class="stress-sign">🧠 Gedanken kreisen</div>
          <div class="stress-sign">😣 Unruhe / Gereiztheit</div>
          <div class="stress-sign">🎯 Konzentration fällt schwer</div>
        </div>
      </div>

      <div class="skill-suggest" id="resSkillSuggest">
        <strong>✨ Deine passenden Skills</strong>
        <p style="margin-bottom:8px">Stell den Regler ein – dann schlägt dir die App passende Übungen vor.</p>
        <div id="resSkillButtons"></div>
      </div>
    </div>

    <button class="card treasure" onclick="openResilienzSchatzkiste()">
      <div class="kicker">MEIN PERSÖNLICHER WERKZEUGKASTEN</div>
      <div class="chest">🧰</div>
      <h2>Meine Resilienz-Schatzkiste</h2>
      <p>Hier sammelst du die Übungen, die dir persönlich helfen.</p>
      <span class="pill treasure-count">${favCount} Schätze gespeichert</span>
      <small style="margin-top:10px">Klicke, um die Schatzkiste zu öffnen.</small>
    </button>
  </div>

  <div class="card" style="margin-top:16px">
    <div class="kicker">RESPRESSI · MINI-ÜBUNGEN</div>
    <h2>⚡ Deine Resilienz-Skills</h2>
    <p>Jede Übung dauert nur wenige Minuten und kann direkt ausprobiert werden.</p>
    <div class="res-grid">${skills.map(x=>`
      <button type="button" class="card res-card" data-res-skill="${x.id}">
        <div class="res-icon">${x.icon}</div><h3>${x.title}</h3><p>${x.desc}</p><span class="pill res-tag">${x.tag}</span>
      </button>`).join("")}</div>
  </div>

  <div class="card res-week">
    <div class="kicker">MEINE RESILIENZ-WOCHE</div><h2>📈 Was hat mir gutgetan?</h2>
    <p>Markiere Strategien, die du diese Woche ausprobiert hast.</p>
    <div class="res-checks">${["Bewegung","Pause","Atemübung","Kontakt","Humor","Natur","Musik","Hilfe annehmen"].map(x=>`<button class="secondary" onclick="resilienzCheckin('${x}')">${x}</button>`).join("")}</div>
  </div>${footer()}`;
}

if(!window.__resilienzSkillTilesBound){
  window.__resilienzSkillTilesBound=true;
  document.addEventListener("click",function(e){
    const tile=e.target.closest("[data-res-skill]");
    if(tile){
      e.preventDefault();
      e.stopPropagation();
      startResilienzSkill(tile.getAttribute("data-res-skill"));
    }
  });
}

function updateResilienzStress(value){
  const v=Number(value);
  const val=$("resStressValue"),face=$("resStressFace"),box=$("resSkillButtons");
  if(val)val.textContent=v;
  if(face)face.textContent=v<=2?"🙂":v<=4?"😐":v<=6?"😟":v<=8?"😣":"😫";
  const ids=v<=2?["fokus","ressource","leicht"]:v<=5?["boden","bewegung","fokus","kontakt"]:v<=7?["atem","boden","distanz","bewegung"]:["atem","boden","pause","kontakt"];
  if(box)box.innerHTML=ids.slice(0,3).map(id=>{
    const s=resilienzSkillData(id);
    return `<button class="primary" style="margin:4px" onclick="window.startResilienzSkill('${id}')">${s[0]} ${s[1]}</button>`;
  }).join("");
}
function resilienzSkillData(id){
  const d={
    atem:["🌬️","Resonanzatmung","4 Sekunden ein · 6 Sekunden aus"],
    boden:["👣","Boden spüren","Körper und Sinne"],
    distanz:["🪟","Distanzierung","Situation von außen betrachten"],
    leicht:["🪶","Leichtigkeit","Druck reduzieren"],
    bewegung:["⚡","Bewegungsreset","kurz aktivieren"],
    ressource:["🌱","Ressource aktivieren","eigene Stärke"],
    kontakt:["🤝","Verbindung","Unterstützung nutzen"],
    fokus:["🎯","Fokus","nächsten kleinen Schritt"],
    pause:["☕","Bewusste Pause","kurz unterbrechen"]
  }; return d[id]||d.atem;
}
function resilienzImpuls(){
  const ids=["atem","boden","distanz","leicht","bewegung","ressource","kontakt","fokus"];
  startResilienzSkill(ids[Math.floor(Math.random()*ids.length)]);
}
function startResilienzSkill(id){
  // Resonanzatmung bleibt unverändert, da sie bereits zuverlässig funktioniert.
  if(id==="atem"){openResonanzatmung();return;}

  const d=resilienzSkillData(id);
  const tasks={
    boden:["Stell beide Füße auf den Boden. Spüre für einen Moment den Kontakt zum Boden. Nimm anschließend drei Dinge im Raum bewusst wahr.","Was hast du wahrgenommen?","z. B. „Meine Füße fühlen sich … an.“"],
    distanz:["Stell dir vor, du schaust kurz von außen auf die Situation. Was würdest du einer Person sagen, die dir wichtig ist?","Was wäre dein hilfreicher Satz?","Ein kurzer Satz …"],
    leicht:["Du musst nicht alles gleichzeitig lösen. Formuliere einen kleinen Schritt, der für heute ausreichend ist.","Was ist dein ausreichend guter nächster Schritt?","Für heute reicht …"],
    bewegung:["Steh auf und bewege dich kurz: Schultern kreisen, Arme ausschütteln, strecken und einige Schritte gehen. Danach kurz stehen bleiben.","Was hat sich verändert?","z. B. „Ich bin jetzt …“"],
    ressource:["Denke an eine Situation, die du trotz einer Schwierigkeit bewältigt hast. Welche eigene Stärke hat dir damals geholfen?","Welche Ressource nimmst du mit?","z. B. Geduld, Humor, Mut …"],
    kontakt:["Überlege, wer dir gerade guttun oder dich unterstützen könnte. Du entscheidest selbst, ob du Kontakt aufnimmst.","Wer oder was könnte dich unterstützen?","Eine Person oder Möglichkeit …"],
    fokus:["Finde den kleinsten nächsten Schritt, den du jetzt tatsächlich machen kannst. Nur einen.","Was ist dein nächster Schritt?","Ich mache jetzt …"]
  };
  const t=tasks[id] || tasks.fokus;

  const html=`
    <div class="res-skill-modal" style="padding:4px 0">
      <button type="button" class="modal-close" id="resSkillCloseTop">×</button>
      <div class="kicker">RESPRESSI · SKILL</div>
      <h2>${d[0]} ${d[1]}</h2>
      <p style="font-size:18px;line-height:1.55">${t[0]}</p>
      <div class="res-task">
        <label for="resTaskInput"><strong>${t[1]}</strong></label>
        <textarea id="resTaskInput" placeholder="${t[2]}"></textarea>
      </div>
      <div class="form-actions">
        <button type="button" class="secondary" id="resSkillCloseBottom">Schließen</button>
        <button type="button" class="secondary" id="resSkillSave">☆ In meine Schatzkiste</button>
        <button type="button" class="primary" id="resSkillDone">✓ Geschafft</button>
      </div>
    </div>`;

  modal(html);

  // Bind directly after rendering. This avoids relying on inline onclick
  // handlers for these dynamically created skill dialogs.
  const close=()=>closeResilienzModal();
  const top=$("resSkillCloseTop");
  const bottom=$("resSkillCloseBottom");
  const save=$("resSkillSave");
  const done=$("resSkillDone");

  if(top) top.addEventListener("click",close);
  if(bottom) bottom.addEventListener("click",close);
  if(save) save.addEventListener("click",()=>toggleResilienzSchatz(id));
  if(done) done.addEventListener("click",resilienzSkillDone);
}

function resilienzSkillDone(){toast("Gut. Nimm kurz wahr, was sich verändert hat.");closeResilienzModal();}
function closeResilienzModal(){
  stopResonanzTimer();
  try{
    const backdrop=$("modalBackdrop");
    if(backdrop){
      backdrop.hidden=true;
      backdrop.setAttribute("aria-hidden","true");
    }
    const modalEl=$("modal");
    if(modalEl) modalEl.innerHTML="";
  }catch(e){console.error("Resilienz-Modal schließen:",e)}
  try{if(typeof closeModal==="function")closeModal()}catch(e){}
}

function toggleResilienzSchatz(id){
  const key="campus_resilienz_schatzkiste";let a=[];try{a=JSON.parse(localStorage.getItem(key)||"[]")}catch(e){}
  a=a.includes(id)?a.filter(x=>x!==id):[...a,id];localStorage.setItem(key,JSON.stringify(a));
  toast(a.includes(id)?"In deine Resilienz-Schatzkiste gelegt.":"Aus der Schatzkiste entfernt.");
}
function openResilienzSchatzkiste(){
  let a=[];try{a=JSON.parse(localStorage.getItem("campus_resilienz_schatzkiste")||"[]")}catch(e){}
  const cards=a.map(id=>{const d=resilienzSkillData(id);return `<button class="card res-card" onclick="window.startResilienzSkill('${id}')"><div class="res-icon">${d[0]}</div><h3>${d[1]}</h3><p>${d[2]}</p></button>`}).join("");
  modal(`<button type="button" class="modal-close" onclick="window.closeResilienzModal()">×</button><div class="kicker">MEINE RESILIENZ-SCHATZKISTE</div>
    <h2>🧰 Meine Schätze</h2><p>Übungen, die du für dich als hilfreich ausgewählt hast.</p>
    <div class="res-grid">${cards||`<div class="empty">Deine Schatzkiste ist noch leer. Probiere eine Übung aus und lege sie anschließend hier hinein.</div>`}</div>
    <div class="form-actions"><button type="button" class="secondary" onclick="window.closeResilienzModal()">Schließen</button></div>`);
}
let resonanzTimer=null,resonanzRunning=false,resonanzEnd=0,resonanzStart=0;
function openResonanzatmung(){
  stopResonanzTimer();
  modal(`<button type="button" class="modal-close" onclick="window.closeResilienzModal()">×</button>
    <div class="kicker">RESPRESSI · RESONANZATMUNG</div><h2>🌬️ 4 Sekunden ein · 6 Sekunden aus</h2>
    <p style="font-size:17px;line-height:1.5">Der Kreis zeigt dir den Rhythmus. Einatmen: 4 Sekunden. Ausatmen: 6 Sekunden. Atme ruhig und ohne Druck.</p>
    <div class="breath-wrap">
      <div id="breathCircle" class="breath-circle"><span id="breathPhase" class="breath-phase">Bereit</span></div>
      <div id="breathClock" class="breath-time">02:00</div>
      <div id="breathHint" class="breath-hint">Drücke Start. Die erste Phase beginnt mit dem Einatmen.</div>
      <div class="breath-progress"><div id="breathProgress"></div></div>
      <button class="primary" id="breathStart" onclick="window.toggleResonanzTimer()">▶ Start</button>
    </div>
    <div class="form-actions"><button type="button" class="secondary" onclick="window.closeResilienzModal()">Schließen</button></div>`);
}
function toggleResonanzTimer(){
  const btn=$("breathStart");if(!btn)return;
  if(resonanzRunning){resonanzRunning=false;if(resonanzTimer){clearInterval(resonanzTimer);resonanzTimer=null}btn.textContent="▶ Weiter";return;}
  if(!resonanzEnd)resonanzEnd=Date.now()+120000;
  resonanzRunning=true;btn.textContent="⏸ Pause";updateResonanzTimer();
  resonanzTimer=setInterval(updateResonanzTimer,100);
}
function updateResonanzTimer(){
  const left=Math.max(0,resonanzEnd-Date.now()), elapsed=120000-left;
  const total=Math.ceil(left/1000),m=String(Math.floor(total/60)).padStart(2,"0"),s=String(total%60).padStart(2,"0");
  const clock=$("breathClock"),progress=$("breathProgress"),circle=$("breathCircle"),phase=$("breathPhase"),hint=$("breathHint");
  if(clock)clock.textContent=`${m}:${s}`;
  if(progress)progress.style.width=`${Math.min(100,(elapsed/120000)*100)}%`;
  if(left<=0){
    stopResonanzTimer();if(phase)phase.textContent="Geschafft";if(hint)hint.textContent="Nimm kurz wahr: Was hat sich verändert?";
    const b=$("breathStart");if(b){b.textContent="✓ Beendet";b.disabled=true} return;
  }
  const cycle=elapsed%10000;
  if(cycle<4000){
    if(circle){circle.classList.add("inhale");circle.classList.remove("exhale")}
    if(phase)phase.textContent=`Einatmen · ${Math.ceil((4000-cycle)/1000)} s`;
    if(hint)hint.textContent="Langsam einatmen …";
  }else{
    if(circle){circle.classList.add("exhale");circle.classList.remove("inhale")}
    if(phase)phase.textContent=`Ausatmen · ${Math.ceil((10000-cycle)/1000)} s`;
    if(hint)hint.textContent="Langsam und entspannt ausatmen …";
  }
}
function stopResonanzTimer(){
  if(resonanzTimer){clearInterval(resonanzTimer);resonanzTimer=null}
  resonanzRunning=false;resonanzEnd=0;resonanzStart=0;
}
function resilienzCheckin(name){try{localStorage.setItem("campus_resilienz_"+name,new Date().toISOString())}catch(e){}toast(name+": für diese Woche eingetragen.");}


function renderPraxisFragen(){
 return Promise.resolve(`${pageHead('fpA · EIGENES TOOL','Fragen aus der Praxis','Fragen aus dem Praktikum – getrennt von Praxisaufträgen.',`<button class="primary" onclick="openFPAQuestionForm()">＋ Frage eintragen</button>`)}<div class="card"><h2>❓ Fragen aus der Praxis</h2><p>Dieses Tool ist vollständig von Praxisaufträgen und KI-Innovationspartnerschaften getrennt.</p><div id="fpaQuestionsPage" class="empty">Lade Einträge …</div></div>${footer()}`);
}
function renderPraxisProjekte(){
 return Promise.resolve(`${pageHead('fpA · EIGENES TOOL','Projekte in der Praxis','Praxisprojekte – getrennt von Praxisaufträgen.',`<button class="primary" onclick="openFPAProjectForm()">＋ Projekt eintragen</button>`)}<div class="card"><h2>🚀 Projekte in der Praxis</h2><p>Dieses Tool ist vollständig eigenständig.</p><div id="fpaProjectsPage" class="empty">Lade Einträge …</div></div>${footer()}`);
}

async function renderPraktikum(){
  let assignments=[], questions=[], projects=[];
  try{assignments=await getCollection("practice","createdAt",true)}catch(e){console.error(e)}
  try{questions=await getCollection("fpaQuestions","createdAt",true)}catch(e){console.error(e)}
  try{projects=await getCollection("fpaProjects","createdAt",true)}catch(e){console.error(e)}

  assignments=assignments.filter(p=>p.module==="fpa" && p.type==="teacherAssignment");

  return `${pageHead("SCHULE ↔ PRAXIS","fpA","Praxisaufträge und eigenständige Werkzeuge für die fachpraktische Ausbildung.",
    `<button class="primary" onclick="openPracticeForm()">＋ Praxisauftrag</button>`)}
  <style>
    .fpa-main{margin-bottom:18px}
    .fpa-tools{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
    .fpa-tool{min-height:185px;cursor:pointer;transition:.15s}
    .fpa-tool:hover{transform:translateY(-2px)}
    .fpa-tool .emoji{font-size:30px;display:block;margin-bottom:10px}
    .fpa-count{margin-top:14px}
    @media(max-width:850px){.fpa-tools{grid-template-columns:1fr}}
  </style>

  <div class="card fpa-main">
    <div class="kicker">LEHRKRAFT → SCHÜLER</div>
    <h2>🧭 Praxisaufträge</h2>
    <p>Hier erscheinen ausschließlich fpA-Praxisaufträge der Lehrkraft.</p>
    <div class="grid grid-2">
      ${assignments.map(p=>`<article class="card">
        <span class="pill ${p.state==="offen"?"orange":"green"}">${esc(p.state||"offen")}</span>
        <h3>${esc(p.title||"Praxisauftrag")}</h3>
        <p>${esc(p.text||"")}</p>
        <small>${esc(p.date||"")}</small>
      </article>`).join("")||`<div class="empty">Noch keine Praxisaufträge vorhanden.</div>`}
    </div>
  </div>

  <div class="fpa-tools">
    <button class="card fpa-tool" onclick="openFPAQuestions()">
      <span class="emoji">❓</span><strong>Fragen aus der Praxis</strong>
      <small>Eigene Fragen aus dem Praktikum sammeln und dokumentieren.</small>
      <span class="pill fpa-count">${questions.length} Einträge</span>
    </button>

    <button class="card fpa-tool" onclick="openFPAProjects()">
      <span class="emoji">🚀</span><strong>Projekte in der Praxis</strong>
      <small>Praxisprojekte dokumentieren und Ergebnisse festhalten.</small>
      <span class="pill fpa-count">${projects.length} Projekte</span>
    </button>

    <button class="card fpa-tool" onclick="go('ki')">
      <span class="emoji">🤖</span><strong>KI-Innovationspartnerschaften</strong>
      <small>Praxisprobleme, Schülerteams und entstandene Lösungen.</small>
      <span class="pill fpa-count">Zum Modul →</span>
    </button>
  </div>
  ${footer()}`;
}

function openFPAQuestions(){
  let a=[];
  getCollection("fpaQuestions","createdAt",true).then(rows=>{
    a=rows;
    modal(`<button class="modal-close" onclick="closeModal()">×</button>
      <div class="kicker">fpA · FRAGEN</div><h2>❓ Fragen aus der Praxis</h2>
      <div class="list">${a.map(q=>`<div class="card" style="margin-bottom:10px">
        <small>${esc(q.createdAt?fmtDate(q.createdAt):"")}</small><h3>${esc(q.title||"Frage")}</h3>
        <p>${esc(q.text||"")}</p><span class="pill">${esc(q.studentName||"")}</span>
      </div>`).join("")||`<div class="empty">Noch keine Fragen.</div>`}</div>
      <div class="form-actions"><button class="secondary" onclick="closeModal()">Schließen</button>
      <button class="primary" onclick="closeModal();setTimeout(openFPAQuestionForm,50)">＋ Frage eintragen</button></div>`);
  }).catch(e=>{console.error(e);toast("Fragen konnten nicht geladen werden.")});
}
function openFPAQuestionForm(){
  modal(`<button class="modal-close" onclick="closeModal()">×</button>
    <div class="kicker">fpA · FRAGEN</div><h2>Frage aus der Praxis eintragen</h2>
    <div class="form">
      <label>Titel / kurze Frage<input id="fpaQTitle" required></label>
      <label>Meine Frage<textarea id="fpaQText" rows="5" required></textarea></label>
      <label>Kontext aus dem Praktikum<textarea id="fpaQContext" rows="3"></textarea></label>
      <div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button>
      <button class="primary" onclick="saveFPAQuestion()">Speichern</button></div>
    </div>`);
}
async function saveFPAQuestion(){
  const title=$("fpaQTitle")?.value.trim()||"", textQ=$("fpaQText")?.value.trim()||"";
  if(!title||!textQ){toast("Bitte Titel und Frage ausfüllen.");return}
  try{
    await addDoc(collection(db,"fpaQuestions"),{
      module:"fpa",type:"question",title,text:textQ,context:$("fpaQContext")?.value.trim()||"",
      studentName:profile?.displayName||currentUser?.email||"Campus-Mitglied",
      createdBy:currentUser.uid,createdAt:serverTimestamp()
    });
    closeModal();await render();toast("Frage gespeichert.");
  }catch(e){console.error(e);toast("Frage konnte nicht gespeichert werden: "+(e.code||"Fehler"))}
}

function openFPAProjects(){
  getCollection("fpaProjects","createdAt",true).then(a=>{
    modal(`<button class="modal-close" onclick="closeModal()">×</button>
      <div class="kicker">fpA · PROJEKTE</div><h2>🚀 Projekte in der Praxis</h2>
      <div class="list">${a.map(p=>`<div class="card" style="margin-bottom:10px">
        <span class="pill">${esc(p.status||"offen")}</span><h3>${esc(p.title||"Praxisprojekt")}</h3>
        <p>${esc(p.description||"")}</p><p><b>Team:</b> ${esc(p.team||"—")} · <b>Praxispartner:</b> ${esc(p.partner||"—")}</p>
      </div>`).join("")||`<div class="empty">Noch keine Praxisprojekte.</div>`}</div>
      <div class="form-actions"><button class="secondary" onclick="closeModal()">Schließen</button>
      <button class="primary" onclick="closeModal();setTimeout(openFPAProjectForm,50)">＋ Projekt eintragen</button></div>`);
  }).catch(e=>{console.error(e);toast("Projekte konnten nicht geladen werden.")});
}
function openFPAProjectForm(){
  modal(`<button class="modal-close" onclick="closeModal()">×</button>
    <div class="kicker">fpA · PROJEKT</div><h2>Praxisprojekt eintragen</h2>
    <div class="form">
      <label>Projektname<input id="fpaPTitle" required></label>
      <label>Team / Schüler<input id="fpaPTeam"></label>
      <label>Praxispartner<input id="fpaPPartner"></label>
      <label>Beschreibung<textarea id="fpaPDescription" rows="4"></textarea></label>
      <label>Ziel<textarea id="fpaPGoal" rows="3"></textarea></label>
      <div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button>
      <button class="primary" onclick="saveFPAProject()">Speichern</button></div>
    </div>`);
}
async function saveFPAProject(){
  const title=$("fpaPTitle")?.value.trim()||"";if(!title){toast("Bitte einen Projektnamen eingeben.");return}
  try{
    await addDoc(collection(db,"fpaProjects"),{
      module:"fpa",title,team:$("fpaPTeam")?.value.trim()||"",
      partner:$("fpaPPartner")?.value.trim()||"",description:$("fpaPDescription")?.value.trim()||"",
      goal:$("fpaPGoal")?.value.trim()||"",status:"offen",
      createdBy:currentUser.uid,createdAt:serverTimestamp()
    });
    closeModal();await render();toast("Praxisprojekt gespeichert.");
  }catch(e){console.error(e);toast("Projekt konnte nicht gespeichert werden: "+(e.code||"Fehler"))}
}

async function renderKI(){
  let challenges=[],solutions=[],results=[];
  try{challenges=await getCollection("kiChallenges","createdAt",true)}catch(e){console.error(e)}
  try{solutions=await getCollection("kiSolutions","createdAt",true)}catch(e){console.error(e)}
  try{results=await getCollection("kiResults","createdAt",true)}catch(e){console.error(e)}

  return `${pageHead("INNOVATIONSPARTNERSCHAFT","KI-Innovationspartnerschaften",
    "Praxisproblem → Schülerteam → Ergebnis.",
    `<button class="primary" onclick="openKIChallengeForm()">＋ Praxisproblem eintragen</button>`)}
  <style>
    .ki-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
    .ki-card{min-height:255px;cursor:pointer;transition:.15s;text-align:left}
    .ki-card:hover{transform:translateY(-2px)}
    .ki-step{font-size:27px;font-weight:800;margin-bottom:10px}
    .ki-action{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:16px}
    .ki-process{margin-top:16px}
    @media(max-width:850px){.ki-grid{grid-template-columns:1fr}}
  </style>
  <div class="ki-grid">
    <button class="card ki-card" onclick="openKIChallengesLibrary()">
      <div class="ki-step">1</div>
      <h2>Praxisproblem<br>Herausforderungen im Praktikumsbetrieb</h2>
      <p>Betriebe tragen konkrete Herausforderungen ein. Sie werden in einer Bibliothek gesammelt.</p>
      <div class="ki-action"><span class="pill">${challenges.length} Einträge</span><span class="pill">Öffnen →</span></div>
    </button>
    <button class="card ki-card" onclick="openKISolutionsLibrary()">
      <div class="ki-step">2</div>
      <h2>Schülerteam / Schüler<br>löst Herausforderung</h2>
      <p>Schüler übernehmen eine Herausforderung und dokumentieren Team, Aufgaben und KI-Einsatz.</p>
      <div class="ki-action"><span class="pill">${solutions.length} Bearbeitungen</span><span class="pill">Öffnen →</span></div>
    </button>
    <button class="card ki-card" onclick="openKIResultsLibrary()">
      <div class="ki-step">3</div>
      <h2>Ergebnisse<br>Ideen & Produkte</h2>
      <p>Entstandene Ideen, Konzepte, Prototypen und Produkte werden gesammelt.</p>
      <div class="ki-action"><span class="pill">${results.length} Ergebnisse</span><span class="pill">Öffnen →</span></div>
    </button>
  </div>
  <div class="card ki-process">
    <h3>Der Ablauf</h3>
    <div class="grid grid-3">
      <div class="card"><strong style="display:block;margin-bottom:8px">1. Praxisproblem</strong><small style="display:block">Ein realer Bedarf wird beschrieben.</small></div>
      <div class="card"><strong style="display:block;margin-bottom:8px">2. Entwicklung</strong><small style="display:block">Ein Schülerteam bearbeitet die Herausforderung.</small></div>
      <div class="card"><strong style="display:block;margin-bottom:8px">3. Ergebnis</strong><small style="display:block">Die Lösung wird dokumentiert.</small></div>
    </div>
  </div>${footer()}`;
}

function openKIChallengeForm(){
  modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">1 · PRAXISPROBLEM</div>
    <h2>Herausforderung eintragen</h2><div class="form">
    <label>Betrieb / Einrichtung<input id="kiCompany" required></label>
    <label>Ansprechperson<input id="kiContact"></label>
    <label>Titel des Praxisproblems<input id="kiTitle" required></label>
    <label>Herausforderung<textarea id="kiDescription" rows="5" required></textarea></label>
    <label>Betroffene / Zielgruppe<textarea id="kiTarget" rows="3"></textarea></label>
    <label>Gewünschter Nutzen<textarea id="kiGoal" rows="3"></textarea></label>
    <label>Datenschutz / Rahmenbedingungen<textarea id="kiPrivacy" rows="3"></textarea></label>
    <div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button>
    <button class="primary" onclick="saveKIChallenge()">Speichern</button></div></div>`);
}
async function saveKIChallenge(){
  const title=$("kiTitle")?.value.trim()||"", desc=$("kiDescription")?.value.trim()||"";
  if(!title||!desc){toast("Bitte Titel und Herausforderung ausfüllen.");return}
  try{
    await addDoc(collection(db,"kiChallenges"),{
      module:"kiInnovationspartnerschaften",company:$("kiCompany")?.value.trim()||"",
      contact:$("kiContact")?.value.trim()||"",title,description:desc,
      target:$("kiTarget")?.value.trim()||"",goal:$("kiGoal")?.value.trim()||"",
      privacy:$("kiPrivacy")?.value.trim()||"",status:"offen",
      createdBy:currentUser.uid,createdAt:serverTimestamp()
    });
    closeModal();await render();toast("Praxisproblem gespeichert.");
  }catch(e){console.error("KI Herausforderung:",e);toast("Speichern fehlgeschlagen: "+(e.code||"Fehler"))}
}
function openKIChallengesLibrary(){
  getCollection("kiChallenges","createdAt",true).then(a=>{
    modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">1 · PRAXISPROBLEM</div>
      <h2>Bibliothek der Herausforderungen</h2>
      <div class="list">${a.map(c=>`<div class="card" style="margin-bottom:10px">
        <span class="pill">${esc(c.status||"offen")}</span><h3>${esc(c.title||"Herausforderung")}</h3>
        <small>${esc(c.company||"")}</small><p>${esc(c.description||"")}</p>
        <button class="primary" onclick="openKITakeChallenge('${c.id}')">Herausforderung übernehmen</button>
      </div>`).join("")||`<div class="empty">Noch keine Herausforderungen.</div>`}</div>
      <div class="form-actions"><button class="secondary" onclick="closeModal()">Schließen</button>
      <button class="primary" onclick="closeModal();setTimeout(openKIChallengeForm,50)">＋ Neue Herausforderung</button></div>`);
  }).catch(e=>{console.error(e);toast("Herausforderungen konnten nicht geladen werden.")});
}
function openKITakeChallenge(id){
  getCollection("kiChallenges","createdAt",true).then(a=>{
    const c=a.find(x=>x.id===id);if(!c){toast("Herausforderung nicht gefunden.");return}
    modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">2 · ENTWICKLUNG</div>
      <h2>${esc(c.title)}</h2><p>${esc(c.description)}</p><div class="form">
      <label>Einzelperson oder Team<select id="kiMode"><option value="team">Schülerteam</option><option value="single">Einzelschüler/in</option></select></label>
      <label>Name / Team<input id="kiTeam" required></label><label>Mitglieder<textarea id="kiMembers" rows="3"></textarea></label>
      <label>Wer macht was?<textarea id="kiRoles" rows="4"></textarea></label>
      <label>Geplanter KI-Einsatz<textarea id="kiAI" rows="4"></textarea></label>
      <div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button>
      <button class="primary" onclick="saveKISolution('${c.id}')">Bearbeitung speichern</button></div></div>`);
  }).catch(e=>{console.error(e);toast("Herausforderung konnte nicht geöffnet werden.")});
}
async function saveKISolution(challengeId){
  const team=$("kiTeam")?.value.trim()||"";if(!team){toast("Bitte Name oder Team eintragen.");return}
  try{
    await addDoc(collection(db,"kiSolutions"),{
      module:"kiInnovationspartnerschaften",challengeId,mode:$("kiMode")?.value||"team",
      team,members:$("kiMembers")?.value.trim()||"",roles:$("kiRoles")?.value.trim()||"",
      aiUse:$("kiAI")?.value.trim()||"",status:"in Bearbeitung",
      createdBy:currentUser.uid,createdAt:serverTimestamp()
    });
    closeModal();await render();toast("Bearbeitung gespeichert.");
  }catch(e){console.error("KI Lösung:",e);toast("Speichern fehlgeschlagen: "+(e.code||"Fehler"))}
}
function openKISolutionsLibrary(){
  getCollection("kiSolutions","createdAt",true).then(a=>{
    modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">2 · ENTWICKLUNG</div>
      <h2>Schülerteams & Lösungsentwicklung</h2>
      <div class="list">${a.map(s=>`<div class="card" style="margin-bottom:10px">
        <span class="pill">${esc(s.status||"in Bearbeitung")}</span><h3>${esc(s.team||"Schüler/in")}</h3>
        <p><b>Mitglieder:</b> ${esc(s.members||"—")}</p><p><b>Wer macht was:</b> ${esc(s.roles||"—")}</p>
        <p><b>KI-Einsatz:</b> ${esc(s.aiUse||"—")}</p>
      </div>`).join("")||`<div class="empty">Noch keine Bearbeitungen.</div>`}</div>
      <div class="form-actions"><button class="secondary" onclick="closeModal()">Schließen</button>
      <button class="primary" onclick="closeModal();setTimeout(openKIChallengesLibrary,50)">＋ Herausforderung auswählen</button></div>`);
  }).catch(e=>{console.error(e);toast("Bearbeitungen konnten nicht geladen werden.")});
}
function openKIResultForm(){
  modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">3 · ERGEBNIS</div>
    <h2>Ergebnis dokumentieren</h2><div class="form">
    <label>Titel<input id="kiResultTitle" required></label>
    <label>Art<select id="kiResultType"><option>Idee</option><option>Konzept</option><option>Prototyp</option><option>Produkt</option><option>Material</option><option>Prompt / KI-Workflow</option><option>Sonstiges</option></select></label>
    <label>Beschreibung<textarea id="kiResultDescription" rows="5"></textarea></label>
    <label>Schülerteam / Schüler<input id="kiResultTeam"></label><label>Praxispartner<input id="kiResultPartner"></label>
    <label>Link zum Ergebnis<input id="kiResultLink"></label>
    <div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button>
    <button class="primary" onclick="saveKIResult()">Ergebnis speichern</button></div></div>`);
}
async function saveKIResult(){
  const title=$("kiResultTitle")?.value.trim()||"";if(!title){toast("Bitte einen Titel eingeben.");return}
  try{
    await addDoc(collection(db,"kiResults"),{
      module:"kiInnovationspartnerschaften",title,type:$("kiResultType")?.value||"Idee",
      description:$("kiResultDescription")?.value.trim()||"",team:$("kiResultTeam")?.value.trim()||"",
      partner:$("kiResultPartner")?.value.trim()||"",link:$("kiResultLink")?.value.trim()||"",
      createdBy:currentUser.uid,createdAt:serverTimestamp()
    });
    closeModal();await render();toast("Ergebnis gespeichert.");
  }catch(e){console.error("KI Ergebnis:",e);toast("Speichern fehlgeschlagen: "+(e.code||"Fehler"))}
}
function openKIResultsLibrary(){
  getCollection("kiResults","createdAt",true).then(a=>{
    modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">3 · ERGEBNIS</div>
      <h2>Ergebnisse, Ideen & Produkte</h2>
      <div class="list">${a.map(r=>`<div class="card" style="margin-bottom:10px">
        <span class="pill">${esc(r.type||"Ergebnis")}</span><h3>${esc(r.title||"Ergebnis")}</h3>
        <p>${esc(r.description||"")}</p><p><b>Team:</b> ${esc(r.team||"—")} · <b>Praxispartner:</b> ${esc(r.partner||"—")}</p>
        ${r.link?`<a href="${esc(r.link)}" target="_blank" rel="noopener">Ergebnis öffnen →</a>`:""}
      </div>`).join("")||`<div class="empty">Noch keine Ergebnisse.</div>`}</div>
      <div class="form-actions"><button class="secondary" onclick="closeModal()">Schließen</button>
      <button class="primary" onclick="closeModal();setTimeout(openKIResultForm,50)">＋ Ergebnis eintragen</button></div>`);
  }).catch(e=>{console.error(e);toast("Ergebnisse konnten nicht geladen werden.")});
}

async function renderKalender(){
  let events=[];
  try{events=await getCollection("events","start",false)}catch(e){console.error("Kalender:",e)}

  const months=[
    {m:8,y:2026,name:"September 2026"},
    {m:9,y:2026,name:"Oktober 2026"},
    {m:10,y:2026,name:"November 2026"},
    {m:11,y:2026,name:"Dezember 2026"},
    {m:0,y:2027,name:"Januar 2027"},
    {m:1,y:2027,name:"Februar 2027"},
    {m:2,y:2027,name:"März 2027"},
    {m:3,y:2027,name:"April 2027"},
    {m:4,y:2027,name:"Mai 2027"},
    {m:5,y:2027,name:"Juni 2027"},
    {m:6,y:2027,name:"Juli 2027"}
  ];
  const week=["Mo","Di","Mi","Do","Fr","Sa","So"];

  function dateVal(e){
    const raw=e.start||e.date||e.startDate;
    if(!raw)return null;
    if(typeof raw==="object" && raw.seconds)return new Date(raw.seconds*1000);
    const d=new Date(raw);
    return isNaN(d)?null:d;
  }
  function escLocal(v){return typeof esc==="function"?esc(String(v??"")):String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  function eventsForDay(y,m,d){
    return events.filter(e=>{
      const x=dateVal(e); return x && x.getFullYear()===y && x.getMonth()===m && x.getDate()===d;
    });
  }
  function monthHTML(y,m,name){
    const first=new Date(y,m,1);
    const days=new Date(y,m+1,0).getDate();
    const mondayOffset=(first.getDay()+6)%7;
    const cells=[];
    for(let i=0;i<mondayOffset;i++) cells.push(`<div class="cal-day empty"></div>`);
    for(let d=1;d<=days;d++){
      const dayEvents=eventsForDay(y,m,d);
      cells.push(`<button class="cal-day ${dayEvents.length?"has-event":""}" onclick="openCalendarDay(${y},${m},${d})">
        <span class="cal-num">${d}</span>
        ${dayEvents.length?`<span class="cal-dot"></span><span class="cal-count">${dayEvents.length}</span>`:""}
      </button>`);
    }
    while(cells.length%7) cells.push(`<div class="cal-day empty"></div>`);
    return `<section class="card cal-month">
      <div class="cal-month-head"><h2>${name}</h2>${events.some(e=>{const x=dateVal(e);return x&&x.getFullYear()===y&&x.getMonth()===m})?'<span class="pill">Termine vorhanden</span>':''}</div>
      <div class="cal-week">${week.map(x=>`<div>${x}</div>`).join("")}</div>
      <div class="cal-grid">${cells.join("")}</div>
    </section>`;
  }

  window._campusCalendarEvents=events;

  return `${pageHead("ORGANISATION","Campus-Kalender","Das Schuljahr 26/27 auf einen Blick. Monate mit Terminen sind sofort erkennbar.",
    `<button class="primary" onclick="openCalendarEventForm()">＋ Termin eintragen</button>`)}
  <style>
    .calendar-legend{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:16px}
    .cal-months{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
    .cal-month{padding:18px}
    .cal-month-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
    .cal-month-head h2{margin:0}
    .cal-week,.cal-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px}
    .cal-week div{text-align:center;font-size:12px;font-weight:700;color:var(--muted);padding:5px}
    .cal-day{min-height:48px;border:1px solid var(--line,#e2e8ef);background:#fff;border-radius:8px;position:relative;padding:7px;text-align:left;cursor:pointer}
    .cal-day:hover{border-color:#1995d3;transform:translateY(-1px)}
    .cal-day.empty{background:transparent;border-color:transparent;cursor:default}
    .cal-num{font-weight:700;font-size:13px}
    .cal-day.has-event{background:#eef8fd;border-color:#9ed4ef}
    .cal-dot{display:block;width:7px;height:7px;border-radius:50%;background:#168fd0;margin-top:6px}
    .cal-count{position:absolute;right:6px;bottom:5px;font-size:10px;font-weight:700;color:#1679ad}
    .calendar-help{margin-bottom:16px}
    @media(max-width:950px){.cal-months{grid-template-columns:1fr}}
  </style>
  <div class="card calendar-help">
    <div class="calendar-legend">
      <span>📅 <b>Schuljahr 2026/27</b></span>
      <span>● Tag mit Termin</span>
      <span>👉 Tag anklicken = Termine anzeigen</span>
    </div>
  </div>
  <div class="cal-months">
    ${months.map(x=>monthHTML(x.y,x.m,x.name)).join("")}
  </div>
  ${footer()}`;
}

function openCalendarDay(y,m,d){
  const events=window._campusCalendarEvents||[];
  const day=events.filter(e=>{
    const raw=e.start||e.date||e.startDate;
    let x=raw&&raw.seconds?new Date(raw.seconds*1000):new Date(raw);
    return x instanceof Date&&!isNaN(x)&&x.getFullYear()===y&&x.getMonth()===m&&x.getDate()===d;
  });
  const title=new Date(y,m,d).toLocaleDateString("de-DE",{weekday:"long",day:"2-digit",month:"long",year:"numeric"});
  modal(`<button class="modal-close" onclick="closeModal()">×</button>
    <div class="kicker">CAMPUS-KALENDER</div><h2>${typeof esc==="function"?esc(title):title}</h2>
    <div class="list">${day.map(e=>`
      <div class="card" style="margin-bottom:10px">
        <h3>${typeof esc==="function"?esc(e.title||e.name||"Termin"):e.title||e.name||"Termin"}</h3>
        <p>${typeof esc==="function"?esc(e.description||e.text||""):e.description||e.text||""}</p>
        ${e.location?`<small>📍 ${typeof esc==="function"?esc(e.location):e.location}</small>`:""}
      </div>`).join("")||`<div class="empty">An diesem Tag ist noch kein Termin eingetragen.</div>`}</div>
    <div class="form-actions"><button class="secondary" onclick="closeModal()">Schließen</button>
      <button class="primary" onclick="closeModal();setTimeout(openCalendarEventForm,50)">＋ Termin eintragen</button></div>`);
}

async function renderTeam(){
  let messages=[];
  try{messages=await getCollection("teacherMessages","createdAt",true)}catch(e){console.error("Klassenteam-Nachrichten:",e)}
  return `${pageHead("KLASSENTEAM","Lehrkräfte Klassenteam","Interner Austausch des Klassenteams – Nachrichten, Absprachen und kurze Informationen.",
    `<button class="primary" onclick="window.openTeacherMessageForm()">＋ Nachricht</button>`)}
  <style>
    .team-layout{display:grid;grid-template-columns:.8fr 1.2fr;gap:16px}
    .team-intro{min-height:220px}
    .message-list{display:flex;flex-direction:column;gap:10px}
    .teacher-message{padding:15px;border:1px solid var(--line,#ddd);border-radius:12px;background:#fff}
    .teacher-message-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
    .teacher-message-meta{font-size:12px;color:var(--muted);margin-top:4px}
    .teacher-message-text{white-space:pre-wrap;line-height:1.5;margin-top:10px}
    @media(max-width:850px){.team-layout{grid-template-columns:1fr}}
  </style>
  <div class="team-layout">
    <div class="card team-intro">
      <div class="kicker">INTERNER AUSTAUSCH</div>
      <h2>👥 Lehrkräfte Klassenteam</h2>
      <p>Hier können sich die Lehrkräfte des Klassenteams gegenseitig kurze Nachrichten, Informationen und Absprachen hinterlassen.</p>
      <div class="notice" style="margin-top:14px"><strong>Hinweis:</strong> Die Nachrichten sind für angemeldete Mitglieder der Campus-App gedacht.</div>
      <button class="primary" style="margin-top:14px" onclick="window.openTeacherMessageForm()">＋ Nachricht schreiben</button>
    </div>
    <div class="card">
      <div class="kicker">NACHRICHTEN</div>
      <h2>💬 Austausch im Klassenteam</h2>
      <div class="message-list">
        ${messages.map(m=>`
          <article class="teacher-message">
            <div class="teacher-message-head">
              <div><strong>${esc(m.authorName||"Lehrkraft")}</strong><div class="teacher-message-meta">${m.createdAt?fmtDate(m.createdAt):"gerade eben"}</div></div>
              <span class="pill">${m.recipientName?`an ${esc(m.recipientName)}`:"Klassenteam"}</span>
            </div>
            ${m.subject?`<h3 style="margin:10px 0 0">${esc(m.subject)}</h3>`:""}
            <div class="teacher-message-text">${esc(m.text||"")}</div>
          </article>`).join("")||`<div class="empty"><strong>Noch keine Nachrichten.</strong><br>Schreibe die erste Nachricht an das Klassenteam.</div>`}
      </div>
    </div>
  </div>${footer()}`;
}
function openTeacherMessageForm(){
  modal(`<button type="button" class="modal-close" onclick="closeModal()">×</button>
    <div class="kicker">LEHRKRÄFTE KLASSENTEAM</div><h2>💬 Nachricht schreiben</h2>
    <div class="form">
      <label>Betreff<input id="teacherMsgSubject" placeholder="z. B. Termin, Absprache, Information"></label>
      <label>Empfänger<select id="teacherMsgRecipient"><option value="">Gesamtes Klassenteam</option><option value="Direkte Nachricht">Direkte Nachricht / persönlicher Austausch</option></select></label>
      <label>Nachricht<textarea id="teacherMsgText" rows="6" placeholder="Was möchtest du den Kolleginnen und Kollegen mitteilen?" required></textarea></label>
      <div class="form-actions"><button type="button" class="secondary" onclick="closeModal()">Abbrechen</button><button type="button" class="primary" onclick="window.saveTeacherMessage()">Nachricht senden</button></div>
    </div>`);
}
async function saveTeacherMessage(){
  const msg=$("teacherMsgText")?.value.trim()||"";
  if(!msg){toast("Bitte eine Nachricht eingeben.");return}
  try{
    await addDoc(collection(db,"teacherMessages"),{
      module:"lehrkraefteKlassenteam",
      subject:$("teacherMsgSubject")?.value.trim()||"",
      recipientName:$("teacherMsgRecipient")?.value||"",
      text:msg,authorName:profile?.displayName||currentUser?.email||"Lehrkraft",
      authorUid:currentUser.uid,createdBy:currentUser.uid,createdAt:serverTimestamp()
    });
    closeModal();await render();toast("Nachricht im Klassenteam gespeichert.");
  }catch(e){console.error(e);toast("Nachricht konnte nicht gespeichert werden.")}
}

async function render(){
  if(!currentUser)return;
  const seq=++__campusRenderSeq;
  const p=location.hash.replace("#","")||"start";
  const pages={
    start:renderStart,kompass:renderKompass,lernwerkstatt:renderLernwerkstatt,
    ressourcen:renderRessourcenRoute,lernpfad:renderLernpfadRoute,forum:renderForum,
    projekte:renderProjekte,kompetenz:renderKompetenz,journal:renderLernjournalRoute,
    praktikum:renderPraktikum,resilienz:renderResilienz,praxisfragen:renderPraxisFragen,
    praxisprojekte:renderPraxisProjekte,ki:renderKI,kalender:renderKalender,team:renderTeam,
    impulse:renderLernimpulse,lernstand:()=>modulePlaceholder("Lernstandsmessung"),
    kompetenzprofil:()=>modulePlaceholder("Kompetenzprofil"),methoden:renderLernmethoden,
    lerncoaching:renderLerncoaching
  };
  const fn=pages[p]||renderStart;
  document.querySelectorAll(".nav-link").forEach(a=>a.classList.toggle("active",a.dataset.page===p));
  const content=$("content");
  if(!content)return;
  // Never leave a blank page while a module is loading.
  content.innerHTML=`<div class="card" style="margin:4px 0"><strong>Campus wird geladen …</strong><p style="margin:8px 0 0">Bitte einen Moment.</p></div>`;
  try{
    const html=await Promise.race([
      Promise.resolve().then(()=>fn()),
      new Promise((_,reject)=>setTimeout(()=>reject(new Error("Die Seite hat zu lange zum Laden gebraucht.")),10000))
    ]);
    if(seq!==__campusRenderSeq)return;
    content.innerHTML=html||`<div class="card"><h3>Keine Inhalte vorhanden.</h3></div>`;
    if(p==="kompetenz"){
      $("competencySearch")?.addEventListener("input",filterCompetencyNetwork);
      $("competencyCategory")?.addEventListener("change",filterCompetencyNetwork);
      $("competencyHelpersOnly")?.addEventListener("change",filterCompetencyNetwork);
    }
  }catch(e){
    if(seq!==__campusRenderSeq)return;
    console.error("Campus-Seitenfehler:",e);
    content.innerHTML=`<div class="card"><h3>Die Seite konnte nicht geladen werden.</h3><p>${esc(e?.message||"Unbekannter Fehler")}</p><button class="primary" onclick="go('start')">← Zur Startseite</button></div>`;
  }
  $("sidebar")?.classList.remove("open");
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
window.addEventListener("error",e=>{
  console.error("Campus globaler Fehler:",e.error||e.message);
  const c=$("content");
  if(c && !c.innerHTML.trim()) c.innerHTML=`<div class="card"><h3>Campus konnte den Inhalt nicht laden.</h3><p>Bitte die Seite einmal neu laden.</p></div>`;
});
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
window.openTeacherJournalOverview=openTeacherJournalOverview;
window.downloadStudentJournalPDF=downloadStudentJournalPDF;
window.downloadAllJournalsPDF=downloadAllJournalsPDF;
window.printMyJournals=printMyJournals;
window.printJournalEntry=printJournalEntry;
window.openJournalEntry=openJournalEntry;
window.openPostForm=openPostForm;
window.openPracticeForm=openPracticeForm;
window.openFPAQuestions=openFPAQuestions;
window.openFPAQuestionForm=openFPAQuestionForm;
window.saveFPAQuestion=saveFPAQuestion;
window.openFPAProjects=openFPAProjects;
window.openFPAProjectForm=openFPAProjectForm;
window.saveFPAProject=saveFPAProject;
window.openKIChallengeForm=openKIChallengeForm;
window.openKIChallengesLibrary=openKIChallengesLibrary;
window.openKITakeChallenge=openKITakeChallenge;
window.openKISolutionsLibrary=openKISolutionsLibrary;
window.openKIResultForm=openKIResultForm;
window.openKIResultsLibrary=openKIResultsLibrary;
window.saveKIChallenge=saveKIChallenge;
window.saveKISolution=saveKISolution;
window.saveKIResult=saveKIResult;
window.resilienzImpuls=resilienzImpuls;
window.openResonanzatmung=openResonanzatmung;
window.startResilienzSkill=startResilienzSkill;
window.openResilienzSchatzkiste=openResilienzSchatzkiste;
window.updateResilienzStress=updateResilienzStress;
window.toggleResonanzTimer=toggleResonanzTimer;
window.resilienzCheckin=resilienzCheckin;
window.closeModal=closeModal;
window.closeResilienzModal=closeResilienzModal;
window.resilienzSkillDone=resilienzSkillDone;
window.toggleResilienzSchatz=toggleResilienzSchatz;

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

window.addEventListener("hashchange",()=>render());
window.go=p=>{const target=String(p||"start"); if(location.hash!=="#"+target) location.hash=target; else render();};

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
async function addProject(){try{await addDoc(collection(db,"projects"),{title:$("xTitle").value.trim()||"Neues Projekt",team:$("xTeam").value.trim()||"Team",partner:$("xPartner").value.trim()||"—",progress:Math.max(0,Math.min(100,Number($("xProgress").value)||0)),status:"green",goal:$("xGoal").value.trim()||"Ziel ergänzen",createdBy:currentUser.uid,createdAt:serverTimestamp()});closeModal();await render();toast("Projekt angelegt.")}catch(e)
{toast("Projekt konnte nicht angelegt werden.")}}
function openJournalForm(){
  location.hash="journal";
  setTimeout(()=>{
    const field=$("jTitle");
    if(field)field.focus();
  },100);
}

function journalEntryText(j){
  return [
    ["Woran habe ich heute gearbeitet?",j.workedOn],
    ["Was habe ich verstanden oder gelernt?",j.learned],
    ["Was war schwierig?",j.difficult],
    ["Was hat mir geholfen?",j.helpful],
    ["Mein nächster Lernschritt",j.nextStep]
  ].filter(x=>x[1]).map(x=>x[0]+"\n"+x[1]).join("\n\n");
}

async function addJournal(){
  const title=$("jTitle")?.value.trim()||"";
  const journalDate=$("jDate")?.value||new Date().toISOString().slice(0,10);
  const workedOn=$("jWorkedOn")?.value.trim()||"";
  const learned=$("jLearned")?.value.trim()||"";
  const difficult=$("jDifficult")?.value.trim()||"";
  const helpful=$("jHelpful")?.value.trim()||"";
  const nextStep=$("jNextStep")?.value.trim()||"";
  const mood=$("jMood")?.value||"";
  const satisfaction=$("jSatisfaction")?.value||"";

  if(!title){
    toast("Bitte einen Titel eingeben.");
    $("jTitle")?.focus();
    return;
  }
  if(!learned){
    toast("Bitte festhalten, was du verstanden oder gelernt hast.");
    $("jLearned")?.focus();
    return;
  }

  try{
    await addDoc(collection(db,"journal"),{
      uid:currentUser.uid,
      displayName:profile?.displayName||currentUser?.email||"Campus-Mitglied",
      title,
      journalDate,
      workedOn,
      learned,
      difficult,
      helpful,
      nextStep,
      mood,
      satisfaction,
      text:journalEntryText({workedOn,learned,difficult,helpful,nextStep}),
      createdAt:serverTimestamp(),
      updatedAt:serverTimestamp()
    });

    await render();
    toast("Lernjournal gespeichert.");
  }catch(error){
    console.error("Lernjournal speichern:",error);
    toast("Lernjournal konnte nicht gespeichert werden.");
  }
}

async function getMyJournalEntries(){
  const snap=await getDocs(collection(db,"journal"));
  const entries=snap.docs
    .map(d=>({id:d.id,...d.data()}))
    .filter(j=>j.uid===currentUser.uid);

  entries.sort((a,b)=>{
    const ad=a.journalDate||"";
    const bd=b.journalDate||"";
    if(ad!==bd)return bd.localeCompare(ad);
    return (b.createdAt?.seconds||0)-(a.createdAt?.seconds||0);
  });

  return entries;
}

function openJournalEntry(id){
  getMyJournalEntries().then(entries=>{
    const j=entries.find(x=>x.id===id);
    if(!j){
      toast("Lernjournal nicht gefunden.");
      return;
    }

    modal(`
      <button class="modal-close" onclick="closeModal()">×</button>
      <div class="kicker">📖 LERNJOURNAL · ${esc(journalDisplayDate(j))}</div>
      <h2>${esc(j.title||"Lernjournal")}</h2>
      ${j.mood?`<span class="pill">${esc(j.mood)} Befinden</span>`:""}
      ${j.satisfaction?`<span class="pill">${esc(j.satisfaction)} Zufriedenheit</span>`:""}

      ${j.workedOn?`<div class="journal-detail"><strong>Woran habe ich heute gearbeitet?</strong><p>${esc(j.workedOn)}</p></div>`:""}
      ${j.learned?`<div class="journal-detail"><strong>Was habe ich verstanden oder gelernt?</strong><p>${esc(j.learned)}</p></div>`:""}
      ${j.difficult?`<div class="journal-detail"><strong>Was war schwierig?</strong><p>${esc(j.difficult)}</p></div>`:""}
      ${j.helpful?`<div class="journal-detail"><strong>Was hat mir geholfen?</strong><p>${esc(j.helpful)}</p></div>`:""}
      ${j.nextStep?`<div class="journal-detail"><strong>Mein nächster Lernschritt</strong><p>${esc(j.nextStep)}</p></div>`:""}

      <div class="form-actions">
        <button class="secondary" onclick="closeModal()">Schließen</button>
        <button class="primary" onclick="closeModal();printJournalEntry('${esc(j.id)}')">📄 Als PDF</button>
      </div>
    `);
  }).catch(error=>{
    console.error(error);
    toast("Lernjournal konnte nicht geöffnet werden.");
  });
}

async function printJournalEntry(id){
  try{
    const entries=await getMyJournalEntries();
    const j=entries.find(x=>x.id===id);
    if(!j){
      toast("Lernjournal nicht gefunden.");
      return;
    }

    openJournalPrintWindow(
      "Lernjournal – "+(j.title||"Reflexion"),
      [{
        uid:currentUser.uid,
        name:profile?.displayName||currentUser?.email||"Schüler/in",
        entries:[j]
      }]
    );
  }catch(error){
    console.error(error);
    toast("Das Lernjournal konnte nicht als PDF geöffnet werden.");
  }
}

async function printMyJournals(){
  try{
    const entries=await getMyJournalEntries();
    if(!entries.length){
      toast("Noch keine Lernjournale vorhanden.");
      return;
    }

    openJournalPrintWindow(
      "Meine Lernjournale",
      [{
        uid:currentUser.uid,
        name:profile?.displayName||currentUser?.email||"Schüler/in",
        entries
      }]
    );
  }catch(error){
    console.error(error);
    toast("Die Lernjournale konnten nicht als PDF geöffnet werden.");
  }
}

function openCompetenceForm(){
  const categories=["Auftreten & Kommunikation","Schreiben & Sprache","Lernen & Denken","Mathematik & analytisches Denken","Kreativität & Gestaltung","Digital & KI","Zusammenarbeit","Persönliche Stärken","Musik & Ausdruck","Sport & Bewegung","Praktisches & Handwerk","Sonstiges"];
  modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">🧩 MEINE KOMPETENZ</div><h2>Was kannst du gut?</h2><p>Auch Dinge, die dir selbstverständlich vorkommen, können für andere wertvoll sein.</p><div class="form">
  <label>⭐ Meine Kompetenz<input id="cName" placeholder="z. B. Präsentieren, Canva, Singen, gut erklären …" required></label>
  <label>🗂️ Bereich<select id="cCategory">${categories.map(c=>`<option>${esc(c)}</option>`).join("")}</select></label>
  <label>💪 Wie gut schätzt du dich ein?<select id="cLevel"><option value="1">🌱 1 – probiere ich gerade aus</option><option value="2">🙂 2 – kann ich schon etwas</option><option value="3" selected>💪 3 – kann ich gut</option><option value="4">🚀 4 – kann ich sehr gut</option><option value="5">⭐ 5 – kann ich anderen zeigen</option></select></label>
  <label>📝 Was genau kannst du?<textarea id="cDescription" rows="3" placeholder="Zum Beispiel: Ich kann Präsentationen übersichtlich gestalten und frei vor Gruppen sprechen."></textarea></label>
  <label><input id="cCanHelp" type="checkbox"> 🤝 <strong>Ich kann anderen dabei helfen.</strong></label>
  <label>💬 Wenn jemand Hilfe braucht …<textarea id="cHelpText" rows="2" placeholder="Wobei könntest du helfen?"></textarea></label>
  <div class="notice"><strong>💚 Campus-Gedanke</strong><p>Du musst nicht in allem gut sein. Eine einzige Fähigkeit kann für jemanden anderen genau das sein, was gerade gebraucht wird.</p></div>
  <div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="addCompetence()">Kompetenz eintragen</button></div></div>`);
}
async function addCompetence(){
  const name=$("cName")?.value.trim();if(!name){toast("Bitte eine Kompetenz eintragen.");return}
  try{
    await addDoc(collection(db,"competencies"),{uid:currentUser.uid,ownerName:profile?.displayName||currentUser?.email||"Campus-Mitglied",name,category:$("cCategory").value,level:Math.max(1,Math.min(5,Number($("cLevel").value)||1)),description:$("cDescription").value.trim()||"",canHelp:Boolean($("cCanHelp").checked),helpText:$("cHelpText").value.trim()||"",createdAt:serverTimestamp()});
    closeModal();await render();toast("Kompetenz ins Netzwerk aufgenommen.");
  }catch(e){console.error("Kompetenz speichern:",e);toast("Kompetenz konnte nicht gespeichert werden.")}
}

function openPracticeForm(){modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">PRAXIS</div>
<h2>Praxisauftrag</h2><div class="form"><label>Titel<input id="rTitle"></label><label>Datum<input id="rDate" type="date"></label>
<label>Beschreibung<textarea id="rText" rows="4"></textarea></label><div class="form-actions"><button class="secondary"
onclick="closeModal()">Abbrechen</button><button class="primary" onclick="addPractice()">Speichern</button></div></div>`)}
async function addPractice(){try{await addDoc(collection(db,"practice"),
{module:"fpa",type:"teacherAssignment",title:$("rTitle").value.trim()||"Praxisauftrag",date:cleanDateInput($("rDate").value),state:"offen",text:$("rText").value.trim()
||"Beschreibung ergänzen",createdBy:currentUser.uid,createdAt:serverTimestamp()});closeModal();await
render();toast("fpA-Praxisauftrag gespeichert.")}catch(e){console.error(e);toast("fpA-Praxisauftrag konnte nicht gespeichert werden.")}}
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

window.openTeacherMessageForm=openTeacherMessageForm;
window.saveTeacherMessage=saveTeacherMessage;
