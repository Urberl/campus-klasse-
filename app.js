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
    window.CampusFirebase={
      get db(){return db},
      get currentUser(){return currentUser},
      collection,doc,addDoc,setDoc,updateDoc,deleteDoc,getDoc,getDocs,
      query,orderBy,limit,where,onSnapshot,serverTimestamp,arrayUnion,increment,
      modal,toast,pageHead,footer,render
    };
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


/* =========================================================
   CAMPUSKLASSE MASTER â€“ STABILE MODULREGISTRY
   Die Master-App selbst enthÃ¤lt keine Pflicht-Imports
   von Zusatzmodulen. Module werden erst beim Ã–ffnen geladen.
   ========================================================= */
const CAMPUS_MODULES={
  lernpfad:{label:"ðŸ§­ PersÃ¶nlicher Lernpfad",route:"lernpfad",ready:true},
  lernressourcen:{label:"ðŸ“š Lernressourcen",route:"ressourcen",ready:true},
  lernjournal:{label:"ðŸ““ Lernjournal",route:"journal",ready:true},
  lernmethoden:{label:"ðŸ§° Lernmethoden",route:"methoden",ready:false},
  lernimpulse:{label:"ðŸ’¡ Lernimpulse",route:"impulse",ready:false},
  lernstand:{label:"ðŸ“Š Lernstandsmessung",route:"lernstand",ready:false},
  lerncoaching:{label:"ðŸ’¬ Lerncoaching",route:"lerncoaching",ready:false},
  resilienz:{label:"ðŸŒ± Resilienz & Respressi",route:"resilienz",ready:false},
  kompetenz:{label:"ðŸ§© Kompetenzwerkstatt",route:"kompetenz",ready:true},
  forum:{label:"ðŸ’¬ Campus-Forum",route:"forum",ready:true},
  projekte:{label:"ðŸš€ Projekte",route:"projekte",ready:true},
  praxis:{label:"ðŸ¢ Praxis & Partnerschaften",route:"praktikum",ready:true},
  ki:{label:"ðŸ¤– KI-Innovationslabor",route:"ki",ready:true},
  kalender:{label:"ðŸ—“ï¸ Campus-Kalender",route:"kalender",ready:true},
  kompetenzprofil:{label:"ðŸŽ¯ Kompetenzprofil",route:"kompetenzprofil",ready:false},
  team:{label:"ðŸ‘¥ Team & SQ",route:"team",ready:true}
};

const configReady = !Object.values(firebaseConfig).some(v => String(v).includes("HIER_") || String(v).includes("DEIN-PROJEKT"));

let app=null, auth=null, db=null;

const $=id=>document.getElementById(id);
const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const statusLabel={green:"Auf Kurs",yellow:"KlÃ¤rungsbedarf",red:"Handlungsbedarf"};
const labels={question:"â“ Frage",info:"ðŸ“¢ Info",idea:"ðŸ’¡ Idee",project:"ðŸš€ Projekt",practice:"ðŸ¢ Praxis"};
let currentUser=null, profile=null, unsubscribers=[];

function toast(t){const x=$("toast");x.textContent=t;x.classList.add("show");clearTimeout(window.tt);window.tt=setTimeout(()=>x.classList.remove("show"),2500)}
function authError(err){
  const map={
    "auth/invalid-credential":"E-Mail oder Passwort ist nicht korrekt.",
    "auth/email-already-in-use":"FÃ¼r diese E-Mail existiert bereits ein Konto.",
    "auth/weak-password":"Das Passwort muss mindestens 6 Zeichen haben.",
    "auth/invalid-email":"Bitte eine gÃ¼ltige E-Mail-Adresse eingeben.",
    "auth/too-many-requests":"Zu viele Versuche. Bitte spÃ¤ter erneut versuchen."
  };
  $("authError").textContent=map[err?.code]||"Anmeldung konnte nicht durchgefÃ¼hrt werden.";
}
function modal(html){$("modal").innerHTML=html;$("modalBackdrop").hidden=false}
function closeModal(){$("modalBackdrop").hidden=true}
function pageHead(k,h,p,actions=""){return `<div class="page-head"><div><div class="kicker">${k}</div><h1>${h}</h1><p>${p}</p></div><div class="actions">${actions}</div></div>`}
function footer(){return `<div class="footer"><span>Campusklasse 26/27 Â· FOSBOS Weilheim</span><span>Gemeinsam Â· offen Â· respektvoll</span></div>`}
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

async function renderRessourcenRoute(){
  try{
    const module=await import("./modules/lernressourcen.js");
    return await module.renderRessourcen();
  }catch(error){
    console.error("Lernressourcen-Modul konnte nicht geladen werden:",error);
    return moduleError("ðŸ“š Lernressourcen","modules/lernressourcen.js",error);
  }
}

async function renderLernpfadRoute(){
  try{
    const module=await import("./modules/lernpfad.js");
    return await module.renderLernpfad();
  }catch(error){
    console.error("Lernpfad-Modul konnte nicht geladen werden:",error);
    return moduleError("ðŸ§­ PersÃ¶nlicher Lernpfad","modules/lernpfad.js",error);
  }
}

function moduleError(title,file,error){
  return `${pageHead("CAMPUS-MODUL",title,"Das einzelne Modul konnte nicht geladen werden.",`<button class="secondary" onclick="go('start')">â† Startseite</button>`)}
  <div class="card">
    <h3>Die Campus-App selbst funktioniert.</h3>
    <p>Nur dieses Modul ist momentan nicht erreichbar.</p>
    <div class="notice"><b>BenÃ¶tigte Datei:</b> ${esc(file)}<br><small>${esc(error?.message||"Unbekannter Fehler")}</small></div>
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
 if($("registerPassword").value!==$("registerPassword2").value){$("authError").textContent="Die PasswÃ¶rter stimmen nicht Ã¼berein.";return}
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
 try{await loadFirebase();await sendPasswordResetEmail(auth,email);toast("E-Mail zum ZurÃ¼cksetzen wurde versendet.")}catch(err){console.error(err);authError(err)}
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
function fmtDate(v){if(!v)return"â€”";if(v.seconds)return new Date(v.seconds*1000).toLocaleDateString("de-DE");return String(v)}
function cleanDateInput(v){return v||"â€”"}

async function renderStart(){
 let tasks=[],projects=[],posts=[],calendar=[];
 try{[tasks,projects,posts,calendar]=await Promise.all([getCollection("tasks","deadline",false),getCollection("projects"),getCollection("posts"),getCollection("calendar","date",false)])}catch(e){}
 const on=tasks.filter(x=>x.status==="green").length;
 return `<section class="hero"><div><span class="badge">ðŸ« CAMPUSKLASSE 26/27</span><h1>Willkommen auf dem Campus.</h1><p>Hier verbinden wir Lernen, Projekte, Praxis und Gemeinschaft. Alle angemeldeten Mitglieder arbeiten am selben digitalen Campus.</p></div><div class="actions"><button class="primary" onclick="go('kompass')">Mein Kompass â†’</button><button class="secondary" onclick="go('forum')">Campus-Forum</button></div></section>
 ${pageHead("ÃœBERSICHT","Unser Campus","Die wichtigsten Bereiche auf einen Blick.")}
 <div class="grid grid-4">
 ${tile("ðŸ§­","Campus-Kompass","Dein persÃ¶nlicher Lern- und ProjektÃ¼berblick.","kompass")}
 ${tile("ðŸ› ï¸","Lernwerkstatt","LernauftrÃ¤ge, Methoden, Tools und KI.","lernwerkstatt")}
 ${tile("ðŸ’¬","Campus-Forum","Austauschen, fragen, helfen und gemeinsam denken.","forum")}
 ${tile("ðŸš€","Projekte","Projektteams, Ziele, Fortschritt und Ergebnisse.","projekte")}
 ${tile("ðŸ§©","Kompetenzwerkstatt","Kompetenzen sichtbar machen und entwickeln.","kompetenz")}
 ${tile("ðŸ““","Lernjournal","Lernweg, Reflexionen und nÃ¤chste Schritte.","journal")}
 ${tile("ðŸ¢","Praktikum & Praxis","PraxisauftrÃ¤ge und Reflexion.","praktikum")}
 ${tile("ðŸ¤–","KI-Innovationslabor","KI-Ideen und Innovationspartnerschaften.","ki")}</div>
 <div class="grid grid-3" style="margin-top:12px"><div class="card stat"><b>${tasks.length}</b><span>Arbeitspakete</span></div><div class="card stat"><b>${on}</b><span>auf Kurs</span></div><div class="card stat"><b>${currentUser?1:0}</b><span>dein Zugang ist aktiv</span></div></div>
 <div class="grid grid-2" style="margin-top:12px">
 <div class="card"><h3>ðŸ“¢ Campus-News</h3><div class="list">${posts.filter(p=>p.type==="info").slice(0,3).map(p=>`<div class="list-item"><div><strong>${esc(p.text)}</strong><small>${fmtDate(p.createdAt)}</small></div><span class="pill">Info</span></div>`).join("")||`<div class="empty">Noch keine News.</div>`}</div></div>
 <div class="card"><h3>ðŸ—“ï¸ NÃ¤chste Termine</h3><div class="list">${calendar.slice(0,3).map(c=>`<div class="list-item"><div><strong>${esc(c.title)}</strong><small>${esc(c.date)}</small></div><span class="pill green">Termin</span></div>`).join("")||`<div class="empty">Noch keine Termine.</div>`}</div></div></div>${footer()}`;
}

async function renderKompass(){
 const tasks=await getCollection("tasks","deadline",false), projects=await getCollection("projects");
 return `${pageHead("PERSÃ–NLICH","Mein Campus-Kompass","Dein persÃ¶nlicher Ãœberblick Ã¼ber Aufgaben, Projekte, Ziele und Lernweg.",`<button class="primary" onclick="openTaskForm()">ï¼‹ Aufgabe</button>`)}
 <div class="grid grid-3"><div class="card stat"><b>${tasks.filter(t=>t.ownerUid===currentUser.uid).length}</b><span>Meine Aufgaben</span></div><div class="card stat"><b>${projects.length}</b><span>Projekte</span></div><div class="card stat"><b>${profile?.role==="teacher"?"Lehrkraft":profile?.role==="admin"?"Admin":"SchÃ¼ler/in"}</b><span>Rolle</span></div></div>
 <div class="card" style="margin-top:12px"><h3>â˜‘ï¸ Meine Aufgaben</h3><div class="list">${tasks.filter(t=>t.ownerUid===currentUser.uid).map(taskHTML).join("")||`<div class="empty"><strong>Noch keine Aufgaben</strong>Lege deine erste Aufgabe an.</div>`}</div></div>
 <div class="card" style="margin-top:12px"><h3>ðŸš€ Aktuelle Projekte</h3><div class="list">${projects.map(p=>`<div class="list-item"><div><strong>${esc(p.title)}</strong><small>${esc(p.team||"")} Â· ${esc(p.partner||"")}</small></div><span class="pill">${Number(p.progress||0)}%</span></div>`).join("")||`<div class="empty">Noch keine Projekte.</div>`}</div></div>${footer()}`;
}
function taskHTML(t){return `<div class="list-item"><div><strong>${esc(t.title)}</strong><small>Verantwortlich: ${esc(t.ownerName||"")} Â· Deadline: ${esc(t.deadline||"â€”")} Â· NÃ¤chster Schritt: ${esc(t.next||"â€”")}</small></div><div class="traffic">${statusDot(t.status)}<span class="pill">${statusLabel[t.status]||"â€”"}</span></div></div>`}

async function renderLernwerkstatt(){
  const resources=[
    ["ðŸ§­","PersÃ¶nlicher Lernpfad","Ziele setzen, Lernschritte planen und Fortschritt erkennen.","lernpfad"],
    ["ðŸ’¬","Lerncoaching","Individuelle Begleitung und Kontakt zu einer Lehrkraft.","lerncoaching"],
    ["ðŸ§°","Lernmethoden","Planung, Lernen, Zusammenarbeit und Reflexion.","methoden"],
    ["ðŸ“š","Lernressourcen","TaskCard, KI, Videos, ByCS/mebis und Webseiten.","ressourcen"],
    ["ðŸ’¡","Lernimpulse","Kurze Impulse fÃ¼r Reflexion und Deeper Learning.","impulse"],
    ["ðŸ“Š","Lernstandsmessung","Kurz prÃ¼fen: Wo stehe ich und was ist mein nÃ¤chster Schritt?","lernstand"],
    ["ðŸ¤–","KI zum Lernen","KI bewusst, kritisch und produktiv einsetzen.","ki"],
    ["â“","Fragen & Hilfe","Wenn du nicht weiterkommst: fragen und teilen.","forum"]
  ];
  return `${pageHead("SELBSTSTÃ„NDIG LERNEN","Lernwerkstatt","Der offene Lernraum fÃ¼r LernauftrÃ¤ge, Methoden, Tools und KI.",`<button class="primary" onclick="openPostForm('idea')">ï¼‹ Lernimpuls</button>`)}
  <div class="grid grid-4">${resources.map(x=>`<a class="card tile" href="#${x[3]}"><span class="emoji">${x[0]}</span><strong>${x[1]}</strong><small>${x[2]}</small></a>`).join("")}</div>
  <div class="grid grid-2" style="margin-top:12px">
    <div class="card"><h3>ðŸ§­ So kann ich starten</h3><div class="list">${["Ich mÃ¶chte etwas verstehen","Ich mÃ¶chte recherchieren","Ich mÃ¶chte etwas ausprobieren","Ich mÃ¶chte etwas gestalten","Ich mÃ¶chte ein Problem lÃ¶sen","Ich mÃ¶chte mich vorbereiten"].map(x=>`<div class="list-item"><strong>${x}</strong><span class="pill">Lernen</span></div>`).join("")}</div></div>
    <div class="card"><h3>ðŸ¤– KI-Lernimpuls</h3><p>Nutze KI nicht nur fÃ¼r fertige Antworten. Bitte sie zum Beispiel, dir Fragen zu stellen, einen LÃ¶sungsweg zu prÃ¼fen oder Gegenargumente zu entwickeln.</p><div class="chips" style="margin-top:12px"><span class="chip">ErklÃ¤ren</span><span class="chip">Fragen</span><span class="chip">Feedback</span><span class="chip">Perspektiven</span></div></div>
  </div>${footer()}`;
}

async function renderForum(){
 const posts=await getCollection("posts");
 return `${pageHead("GEMEINSCHAFT","Campus-Forum","Gemeinsam denken, fragen, austauschen und unterstÃ¼tzen.",`<button class="primary" onclick="openPostForm()">ï¼‹ Beitrag schreiben</button>`)}
 <div class="toolbar"><div class="chips"><span class="chip">Alle</span><span class="chip">â“ Fragen</span><span class="chip">ðŸ“¢ Infos</span><span class="chip">ðŸ’¡ Ideen</span><span class="chip">ðŸš€ Projekte</span><span class="chip">ðŸ¢ Praxis</span></div><input class="search" id="forumSearch" placeholder="BeitrÃ¤ge durchsuchen â€¦"></div>
 <div class="list" id="forumList">${posts.map(postHTML).join("")||`<div class="empty"><strong>Noch keine BeitrÃ¤ge</strong>Schreibe den ersten Beitrag.</div>`}</div>
 <div class="card" style="margin-top:12px;background:var(--soft-green)"><h3>ðŸ¤ Campus hilft</h3><p>Du kannst anderen bei einem Thema helfen? Teile dein Wissen.</p><button class="secondary" style="margin-top:10px" onclick="openHelpForm()">Hilfe anbieten</button></div>${footer()}`;
}
function postHTML(p){const comments=Array.isArray(p.comments)?p.comments:[];return `<article class="forum-post"><div class="post-head"><div class="avatar">${p.authorUid===currentUser.uid?"ðŸ‘¤":"ðŸ«"}</div><div class="post-meta"><strong>${esc(p.authorName||"Campus-Mitglied")}</strong><small>${fmtDate(p.createdAt)}</small></div><span class="pill">${labels[p.type]||p.type||"Beitrag"}</span></div><div class="post-body">${esc(p.text)}</div><div class="post-actions"><button onclick="likePost('${p.id}')">â™¡ GefÃ¤llt mir (${Number(p.likes||0)})</button><button onclick="focusComment('${p.id}')">ðŸ’¬ Antworten (${comments.length})</button>${(p.authorUid===currentUser.uid||isTeacher())?`<button onclick="deletePost('${p.id}')">LÃ¶schen</button>`:""}</div><div class="comments">${comments.map(c=>`<div class="comment"><b>${esc(c.name)}:</b> ${esc(c.text)}</div>`).join("")}<div class="comment-box"><input id="comment-${p.id}" placeholder="Antwort schreiben â€¦"><button onclick="commentPost('${p.id}')">Senden</button></div></div></article>`}

async function renderProjekte(){
 const projects=await getCollection("projects");
 return `${pageHead("DEEPER LEARNING","Projekte","Projektideen, Teams, Ziele, Fortschritt und Ergebnisse.",`<button class="primary" onclick="openProjectForm()">ï¼‹ Projekt</button>`)}
 <div class="grid grid-3">${projects.map(p=>`<div class="card"><div class="status-card">${statusDot(p.status||"green")}<div><h3>${esc(p.title)}</h3><p>${esc(p.goal||"")}</p></div></div><div style="margin-top:12px"><div style="display:flex;justify-content:space-between;font-size:9px;color:var(--muted);margin-bottom:5px"><span>${esc(p.team||"")} Â· ${esc(p.partner||"")}</span><b>${Number(p.progress||0)}%</b></div><div class="progress"><i style="width:${Number(p.progress||0)}%"></i></div></div></div>`).join("")||`<div class="empty">Noch keine Projekte.</div>`}</div>${footer()}`;
}
async function renderKompetenz(){
 const mine=await getDocs(query(collection(db,"competencies"),where("uid","==",currentUser.uid)));
 const data=mine.docs.map(d=>({id:d.id,...d.data()}));
 return `${pageHead("ENTWICKLUNG","Kompetenzwerkstatt","Kompetenzen sichtbar machen, Ziele setzen und Entwicklung reflektieren.",`<button class="primary" onclick="openCompetenceForm()">ï¼‹ Kompetenz</button>`)}
 <div class="grid grid-2">${data.map(c=>`<div class="card"><div style="display:flex;justify-content:space-between;align-items:center"><h3>${esc(c.name)}</h3><span class="pill">${Number(c.value||0)}/10</span></div><div class="progress"><i style="width:${Number(c.value||0)*10}%"></i></div></div>`).join("")||`<div class="empty"><strong>Noch kein Kompetenzprofil</strong>Lege eine Kompetenz an.</div>`}</div>${footer()}`;
}
async function renderJournal(){
 const q=query(collection(db,"journal"),where("uid","==",currentUser.uid),orderBy("createdAt","desc"),limit(50));
 const snap=await getDocs(q), data=snap.docs.map(d=>({id:d.id,...d.data()}));
 return `${pageHead("REFLEXION","Lernjournal","Dein Lernweg, Reflexionen und nÃ¤chste Schritte.",`<button class="primary" onclick="openJournalForm()">ï¼‹ Eintrag</button>`)}
 <div class="list">${data.map(j=>`<article class="card"><div style="display:flex;justify-content:space-between"><div><span class="pill">${fmtDate(j.createdAt)}</span><h3 style="margin-top:9px">${esc(j.title)}</h3></div><span style="font-size:25px">${esc(j.mood||"ðŸ™‚")}</span></div><p>${esc(j.text)}</p></article>`).join("")||`<div class="empty"><strong>Noch kein Eintrag</strong>Starte mit einer kurzen Reflexion.</div>`}</div>${footer()}`;
}
async function renderPraktikum(){
 const data=await getCollection("practice","createdAt",true);
 return `${pageHead("SCHULE â†” PRAXIS","Praktikum & Praxis","PraxisauftrÃ¤ge, Beobachtungen und Reflexionen verbinden Schule und Praktikumsbetrieb.",`<button class="primary" onclick="openPracticeForm()">ï¼‹ Praxisauftrag</button>`)}
 <div class="grid grid-2">${data.map(p=>`<div class="card"><span class="pill ${p.state==="offen"?"orange":"green"}">${esc(p.state||"geplant")}</span><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p><small style="display:block;color:var(--muted);margin-top:9px">${esc(p.date||"")}</small></div>`).join("")||`<div class="empty">Noch keine PraxisauftrÃ¤ge.</div>`}</div>
 <div class="card" style="margin-top:12px"><h3>ðŸ¤ Praxispartner</h3><p>Praktikum ist Lern- und Innovationsraum: Beobachtungen aus der Praxis kÃ¶nnen zu Fragen, Projekten und KI-Innovationspartnerschaften werden.</p></div>${footer()}`;
}
async function renderKI(){
 return `${pageHead("INNOVATION","KI-Innovationslabor","KI verantwortungsvoll erproben und gemeinsam mit Praxispartnern LÃ¶sungen entwickeln.",`<button class="primary" onclick="openPostForm('idea')">ï¼‹ KI-Idee</button>`)}
 <div class="grid grid-3">${[["ðŸ”","KI beobachten","Welche Aufgabe in der Praxis kÃ¶nnte durch KI unterstÃ¼tzt werden?"],["ðŸ§ª","KI erproben","Eine kleine Idee mit klarer Fragestellung ausprobieren."],["ðŸ¤","Innovationspartnerschaft","Ergebnis gemeinsam mit dem Praxispartner prÃ¼fen und weiterentwickeln."]].map(x=>`<div class="card tile"><span class="emoji">${x[0]}</span><strong>${x[1]}</strong><small>${x[2]}</small></div>`).join("")}</div>
 <div class="card" style="margin-top:12px"><h3>âš–ï¸ KI-Kompass</h3><div class="chips" style="margin-top:9px"><span class="chip">Transparenz</span><span class="chip">Datenschutz</span><span class="chip">Quellen prÃ¼fen</span><span class="chip">Eigenleistung</span><span class="chip">Bias reflektieren</span><span class="chip">Ergebnisse validieren</span></div></div>${footer()}`;
}
async function renderKalender(){
 const data=await getCollection("calendar","date",false);
 return `${pageHead("ORGANISATION","Campus-Kalender","Gemeinsame Termine, Meilensteine und PrÃ¤sentationen.",`<button class="primary" onclick="openCalendarForm()">ï¼‹ Termin</button>`)}
 <div class="list">${data.map(c=>`<div class="list-item"><div><strong>${esc(c.title)}</strong><small>${esc(c.date||"")}</small></div><span class="pill green">Termin</span></div>`).join("")||`<div class="empty">Noch keine Termine.</div>`}</div>${footer()}`;
}
async function renderTeam(){
 const tasks=await getCollection("tasks","deadline",false);
 return `${pageHead("TEAM & SCHULENTWICKLUNG","Team & SQ","Arbeitsorganisation fÃ¼r die Campusklasse und gemeinsame Schulentwicklung.",`<button class="primary" onclick="openTaskForm()">ï¼‹ Arbeitspaket</button>`)}
 <div class="grid grid-3">${["green","yellow","red"].map((s,i)=>`<div class="card"><div class="status-card">${statusDot(s)}<div><h3>${statusLabel[s]}</h3><p>${tasks.filter(t=>t.status===s).length} Arbeitspakete</p></div></div></div>`).join("")}</div>
 <div class="card" style="margin-top:12px"><h3>ðŸ“‹ Arbeitspakete</h3><div class="list">${tasks.map(taskHTML).join("")||`<div class="empty">Noch keine Arbeitspakete.</div>`}</div></div>
 <div class="notice" style="margin-top:12px"><b>Ampel:</b> <b>Auf Kurs</b> = planmÃ¤ÃŸig Â· <b>KlÃ¤rungsbedarf</b> = Abstimmung/Entscheidung nÃ¶tig Â· <b>Handlungsbedarf</b> = aktives Eingreifen erforderlich.</div>${footer()}`;
}

async function renderLernmethoden(){
  try{
    const m=await import("./modules/lernmethoden.js");
    return await m.renderLernmethoden();
  }catch(e){
    console.error("Lernmethoden:",e);
    return moduleError("ðŸ§° Lernmethoden","modules/lernmethoden.js",e);
  }
}

async function renderLerncoaching(){
  const email="BERATUNGSLEHRKRAFT@SCHULE.DE";
  const subject=encodeURIComponent("Anfrage Lerncoaching");
  const body=encodeURIComponent(
    "Hallo,\n\n" +
    "ich wÃ¼rde gerne ein Lerncoaching vereinbaren.\n\n" +
    "Mein Anliegen:\n\n\n" +
    "Viele GrÃ¼ÃŸe"
  );
  const mail=`mailto:${email}?subject=${subject}&body=${body}`;

  return `${pageHead(
    "BEGLEITUNG",
    "Lerncoaching",
    "Gemeinsam den eigenen Lernweg klÃ¤ren, Ziele entwickeln und nÃ¤chste Schritte finden.",
    `<a class="primary" href="${mail}">âœ‰ï¸ Lerncoaching anfragen</a>`
  )}
  <div class="grid grid-2">
    <div class="card">
      <span class="badge">ðŸ§­ INDIVIDUELLE BEGLEITUNG</span>
      <h2>Du musst deinen Lernweg nicht allein planen.</h2>
      <p>Im Lerncoaching kannst du gemeinsam mit einer Lehrkraft auf deine aktuelle Lernsituation schauen, Ziele klÃ¤ren und einen passenden nÃ¤chsten Schritt entwickeln.</p>
      <h3>Ein Lerncoaching kann helfen, wenn du â€¦</h3>
      <div class="list">
        <div class="list-item"><strong>ðŸŽ¯ ein Lernziel klÃ¤ren mÃ¶chtest</strong><span class="pill">Ziel</span></div>
        <div class="list-item"><strong>ðŸ“š deinen Lernweg planen mÃ¶chtest</strong><span class="pill">Planung</span></div>
        <div class="list-item"><strong>ðŸ§© bei einer Lernaufgabe feststeckst</strong><span class="pill">KlÃ¤ren</span></div>
        <div class="list-item"><strong>ðŸ’ª mehr Struktur oder Motivation suchst</strong><span class="pill">StÃ¤rkung</span></div>
        <div class="list-item"><strong>ðŸš€ deinen nÃ¤chsten Lernschritt finden mÃ¶chtest</strong><span class="pill">NÃ¤chster Schritt</span></div>
      </div>
    </div>
    <div class="card">
      <span class="badge">âœ‰ï¸ KONTAKT</span>
      <h2>Eine Lehrkraft anschreiben</h2>
      <p>Du mÃ¶chtest ein Lerncoaching? Dann kannst du direkt eine E-Mail an die zustÃ¤ndige Lehrkraft schreiben.</p>
      <a class="primary" href="${mail}">âœ‰ï¸ E-Mail an Lerncoaching</a>
      <div class="notice" style="margin-top:16px">
        <strong>Du musst dein Anliegen nicht perfekt formulieren.</strong>
        <p style="margin-bottom:0">Schreibe einfach kurz, wobei du UnterstÃ¼tzung mÃ¶chtest.</p>
      </div>
    </div>
  </div>
  <div class="card" style="margin-top:12px">
    <h3>ðŸ§­ So kann ein Lerncoaching ablaufen</h3>
    <div class="lp-flow">
      <span>1. Anliegen klÃ¤ren</span><b>â†’</b>
      <span>2. Situation anschauen</span><b>â†’</b>
      <span>3. Ziel formulieren</span><b>â†’</b>
      <span>4. nÃ¤chsten Schritt planen</span>
    </div>
  </div>
  <div class="card" style="margin-top:12px">
    <h3>ðŸ’¡ Wichtig</h3>
    <p>Du musst fÃ¼r ein Lerncoaching noch keine fertige LÃ¶sung haben. Gemeinsam wird sortiert, was gerade wichtig ist und welcher nÃ¤chste Schritt sinnvoll sein kann.</p>
    <p>Die Kontaktaufnahme erfolgt ausschlieÃŸlich per E-Mail.</p>
  </div>
  ${footer()}`;
}

const lernImpulseKategorien=[
{id:"quick",icon:"⚡",title:"Quick Impulse",text:"Ein kleiner Lernschritt für zwischendurch."},
{id:"verstehen",icon:"🧠",title:"Verstehen",text:"Zusammenhänge erkennen statt nur auswendig lernen."},
{id:"nachdenken",icon:"💭",title:"Nachdenken",text:"Den eigenen Lernweg bewusst wahrnehmen."},
{id:"anwenden",icon:"🛠️",title:"Anwenden",text:"Wissen in einer konkreten Situation nutzen."},
{id:"wiederholen",icon:"🔁",title:"Wiederholen",text:"Wichtiges aktiv aus dem Gedächtnis holen."},
{id:"challenge",icon:"🚀",title:"Challenge",text:"Eine kleine Herausforderung annehmen."},
{id:"haengt",icon:"🧩",title:"Wenn du hängst",text:"Einen Weg aus einer Lernblockade finden."},
{id:"ueberraschung",icon:"✨",title:"Überraschungsimpuls",text:"Ein zufälliger Impuls für deinen Lernweg."}
];
const lernImpulse=[{id:"q1",cat:"quick",title:"60-Sekunden-Start",task:"Öffne deine aktuelle Lernaufgabe. Schreibe in einem Satz auf: Was soll am Ende herauskommen?",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"q2",cat:"quick",title:"Ein Begriff",task:"Wähle einen wichtigen Begriff und erkläre ihn mit maximal 12 Wörtern.",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"q3",cat:"quick",title:"Ein Satz",task:"Schreibe: Das Wichtigste, das ich heute verstanden habe, ist …",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"q4",cat:"quick",title:"Nächster Schritt",task:"Benenne genau eine Sache, die du jetzt als Nächstes erledigst.",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"q5",cat:"quick",title:"Lernumgebung",task:"Verändere genau eine Sache an deinem Arbeitsplatz, die dich gerade ablenkt.",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"v1",cat:"verstehen",title:"Warum?",task:"Wähle eine Aussage und frage dreimal: Warum ist das so?",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"v2",cat:"verstehen",title:"Erklären statt abschreiben",task:"Erkläre einen schwierigen Inhalt laut, als würdest du ihn jemandem erklären.",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"v3",cat:"verstehen",title:"Zusammenhang finden",task:"Nimm zwei Begriffe. Was haben sie miteinander zu tun?",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"v4",cat:"verstehen",title:"Beispiel bauen",task:"Finde selbst ein konkretes Beispiel für deinen Lerninhalt.",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"v5",cat:"verstehen",title:"Kernidee",task:"Reduziere deine Notizen auf maximal drei zentrale Aussagen.",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"n1",cat:"nachdenken",title:"Was kann ich schon?",task:"Bewerte deinen Lernstand spontan von 1 bis 10. Was macht deine Zahl aus?",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"n2",cat:"nachdenken",title:"Mein Lernweg",task:"Was hat dir beim letzten Lernen tatsächlich geholfen?",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"n3",cat:"nachdenken",title:"Fehler mit Nutzen",task:"Was kannst du aus einem aktuellen Fehler über deinen Denkweg lernen?",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"n4",cat:"nachdenken",title:"Energie-Check",task:"Wie viel Energie hast du gerade – niedrig, mittel oder hoch?",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"n5",cat:"nachdenken",title:"Was brauche ich?",task:"Vervollständige: Damit ich weiterkomme, brauche ich gerade …",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"a1",cat:"anwenden",title:"Auf echte Situation übertragen",task:"Übertrage einen Lerninhalt auf Alltag, Praktikum oder späteren Beruf.",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"a2",cat:"anwenden",title:"Mini-Fall",task:"Erfinde einen kurzen Fall, bei dem du dein Wissen anwenden musst.",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"a3",cat:"anwenden",title:"Zeig es",task:"Zeige einen Lerninhalt als Skizze, Ablauf, Tabelle oder Beispiel.",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"a4",cat:"anwenden",title:"Transferfrage",task:"Wo könnte dir dieses Wissen außerhalb der Schule nützlich sein?",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"a5",cat:"anwenden",title:"Entscheiden",task:"Entscheide ein aktuelles Problem auf Grundlage deines Lernwissens.",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"w1",cat:"wiederholen",title:"Buch zu",task:"Schließe dein Material. Schreibe aus dem Kopf alles auf, was du noch weißt.",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"w2",cat:"wiederholen",title:"Drei Fragen",task:"Formuliere drei Prüfungsfragen: leicht, mittel und schwierig.",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"w3",cat:"wiederholen",title:"Karteikarten-Test",task:"Erkläre drei wichtige Begriffe aus dem Kopf.",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"w4",cat:"wiederholen",title:"Was fehlt?",task:"Schreibe die fünf wichtigsten Punkte deines Themas aus dem Kopf auf.",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"w5",cat:"wiederholen",title:"Morgen-Test",task:"Formuliere eine Frage, die du dir morgen ohne Unterlagen stellen kannst.",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"c1",cat:"challenge",title:"Ohne Vorlage",task:"Löse einen kleinen Teil deiner Aufgabe ohne Musterlösung.",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"c2",cat:"challenge",title:"60-Sekunden-Erklärung",task:"Erkläre dein Thema in höchstens 60 Sekunden.",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"c3",cat:"challenge",title:"Schwierigste Frage",task:"Formuliere die schwierigste sinnvolle Frage zu deinem Thema.",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"c4",cat:"challenge",title:"Gegenposition",task:"Finde zu deiner eigenen Aussage ein gutes Gegenargument.",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"c5",cat:"challenge",title:"Ein Schritt weiter",task:"Verändere eine Bedingung einer Aufgabe, die du bereits kannst.",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"h1",cat:"haengt",title:"Problem kleiner machen",task:"Zerlege die Aufgabe, an der du hängst, in drei kleinere Schritte.",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"h2",cat:"haengt",title:"Was genau ist unklar?",task:"Vervollständige: Ich komme nicht weiter, weil ich …",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"h3",cat:"haengt",title:"Letzter sicherer Punkt",task:"Gehe zurück zu dem Punkt, an dem du noch sicher warst.",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"h4",cat:"haengt",title:"Hilfe richtig holen",task:"Formuliere deine Frage so konkret, dass eine andere Person direkt antworten kann.",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"h5",cat:"haengt",title:"5-Minuten-Reset",task:"Pausiere fünf Minuten und komme mit einem einzigen nächsten Schritt zurück.",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"u1",cat:"ueberraschung",title:"Erkläre es mit einem Bild",task:"Finde ein Bild, eine Metapher oder einen Vergleich für einen Lerninhalt.",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"u2",cat:"ueberraschung",title:"Lerninhalt als Schlagzeile",task:"Formuliere dein aktuelles Thema als Zeitungsüberschrift.",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"u3",cat:"ueberraschung",title:"Perspektivwechsel",task:"Betrachte deinen Lerninhalt aus der Perspektive einer anderen Person.",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"u4",cat:"ueberraschung",title:"Falsche Antwort",task:"Erfinde eine plausible, aber falsche Antwort und erkläre danach, warum sie falsch ist.",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."},{id:"u5",cat:"ueberraschung",title:"Das würde ich fragen",task:"Wenn du nur eine Frage stellen dürftest: Welche wäre es?",hint:"Mach den Impuls wirklich – nicht nur anklicken.",next:"Formuliere danach deinen nächsten konkreten Lernschritt."}];

function lernImpulseDone(){try{return JSON.parse(localStorage.getItem("campusklasse_lernimpulse_done")||"[]")}catch(e){return[]}}
function lernImpulseSaveDone(a){try{localStorage.setItem("campusklasse_lernimpulse_done",JSON.stringify(a))}catch(e){}}
function lernImpulseGet(id){return lernImpulse.find(x=>x.id===id)}
function lernImpulseCategory(id){return lernImpulseKategorien.find(x=>x.id===id)}
function renderLernimpulsCard(i){const c=lernImpulseCategory(i.cat);return `<button class="card tile impulse-card" onclick="openLernimpuls('${i.id}')"><span class="emoji">${c.icon}</span><strong>${esc(i.title)}</strong><small>${esc(i.task)}</small><span class="pill">${esc(c.title)}</span></button>`}
async function renderLernimpulse(){const d=lernImpulseDone(),p=Math.round(d.length/lernImpulse.length*100);return `${pageHead("SELBSTSTÄNDIG LERNEN","Lernimpulse","Kleine Aufgaben, die deinen Lernprozess in Bewegung bringen.",`<button class="secondary" onclick="openRandomLernimpuls()">✨ Überraschungsimpuls</button>`)}<div class="card impulse-intro"><h2>Wähle einen Impuls – und mach ihn wirklich.</h2><p>${d.length} von ${lernImpulse.length} Impulsen ausprobiert.</p><div class="progress"><i style="width:${p}%"></i></div></div><div class="grid grid-4">${lernImpulseKategorien.map(c=>`<button class="card tile impulse-category" onclick="filterLernimpulse('${c.id}')"><span class="emoji">${c.icon}</span><strong>${esc(c.title)}</strong><small>${esc(c.text)}</small></button>`).join("")}</div><div class="grid grid-3" id="impulseCards">${lernImpulse.map(renderLernimpulsCard).join("")}</div>${footer()}`}
function filterLernimpulse(cat){const x=$("impulseCards");if(x)x.innerHTML=(cat==="all"?lernImpulse:lernImpulse.filter(i=>i.cat===cat)).map(renderLernimpulsCard).join("")}
function openRandomLernimpuls(){const d=lernImpulseDone(),p=lernImpulse.filter(i=>!d.includes(i.id)),a=p.length?p:lernImpulse;openLernimpuls(a[Math.floor(Math.random()*a.length)].id)}
function openLernimpuls(id){const i=lernImpulseGet(id),c=lernImpulseCategory(i.cat);modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">${c.icon} ${esc(c.title)}</div><h2>${esc(i.title)}</h2><div class="card"><strong>Dein Impuls</strong><p>${esc(i.task)}</p></div><div class="notice"><strong>💡 Hinweis</strong><p>${esc(i.hint)}</p></div><label>✍️ Deine kurze Notiz<textarea id="impulseAnswer" rows="4"></textarea></label><div class="notice"><strong>➡️ Nächster Schritt</strong><p>${esc(i.next)}</p></div><div class="form-actions"><button class="secondary" onclick="closeModal()">Später</button><button class="primary" onclick="completeLernimpuls('${i.id}')">✓ Erledigt</button></div>`)}
function completeLernimpuls(id){const d=lernImpulseDone();if(!d.includes(id))d.push(id);lernImpulseSaveDone(d);toast("Impuls erledigt – weiter geht's.");closeModal();openRandomLernimpuls()}
window.openLernimpuls=openLernimpuls;window.openRandomLernimpuls=openRandomLernimpuls;window.filterLernimpulse=filterLernimpulse;window.completeLernimpuls=completeLernimpuls;

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
    journal:renderJournal,
    praktikum:renderPraktikum,
    ki:renderKI,
    kalender:renderKalender,
    team:renderTeam,
    impulse:renderLernimpulse,
    lernstand:()=>modulePlaceholder("ðŸ“Š Lernstandsmessung"),
    resilienz:()=>modulePlaceholder("ðŸŒ± Resilienz & Respressi"),
    kompetenzprofil:()=>modulePlaceholder("ðŸŽ¯ Kompetenzprofil"),
    methoden:renderLernmethoden,
    lerncoaching:renderLerncoaching};
  const fn=pages[p]||renderStart;
  document.querySelectorAll(".nav-link").forEach(a=>a.classList.toggle("active",a.dataset.page===p));
  try{
    $("content").innerHTML=await fn();
  }catch(e){
    console.error("Campus-Seitenfehler:",e);
    $("content").innerHTML=`<div class="card"><h3>Die Seite konnte nicht geladen werden.</h3><p>${esc(e?.message||"Unbekannter Fehler")}</p></div>`;
  }
  $("sidebar").classList.remove("open");
}
function modulePlaceholder(title){
  return `${pageHead("CAMPUS-MODUL",title,"Dieser Bereich ist in der Master-Struktur vorbereitet.",`<button class="secondary" onclick="go('start')">â† Startseite</button>`)}
  <div class="card"><span class="badge">ðŸ§© VORBEREITET</span><h2>${title}</h2><p>Dieser Bereich wird spÃ¤ter als eigenes Modul entwickelt. Die Ã¼brige Campus-App bleibt dabei unverÃ¤ndert.</p></div>${footer()}`;
}


/* =========================================================
   CAMPUSKLASSE â€“ MODAL BRIDGE
   app.js wird als ES-Modul geladen. Funktionen aus einem
   ES-Modul sind nicht automatisch window-global.
   Die bestehenden Modal-Formulare verwenden jedoch inline
   onclick="...". Deshalb werden die benÃ¶tigten Aktionen
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
window.openHelpForm=openHelpForm;
window.openJournalForm=openJournalForm;
window.openPostForm=openPostForm;
window.openPracticeForm=openPracticeForm;
window.openProjectForm=openProjectForm;
window.openTaskForm=openTaskForm;


/* CAMPUS MODULE BRIDGE
   ES-Module erhalten die gemeinsamen Render-Helfer Ã¼ber window.
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
 modal(`<button class="modal-close" onclick="closeModal()">Ã—</button><div class="kicker">CAMPUS-KOMPASS</div><h2>Neue Aufgabe</h2><div class="form"><label>Aufgabe<input id="fTitle" placeholder="Was soll erledigt werden?" required></label><label>Verantwortlich<input id="fOwner" placeholder="Name"></label><label>Deadline<input id="fDeadline" type="date"></label><label>Status<select id="fStatus"><option value="green">Auf Kurs</option><option value="yellow">KlÃ¤rungsbedarf</option><option value="red">Handlungsbedarf</option></select></label><label>NÃ¤chste Schritte<textarea id="fNext" rows="3"></textarea></label><div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="addTask()">Speichern</button></div></div>`);
}
async function addTask(){
 try{await addDoc(collection(db,"tasks"),{title:$("fTitle").value.trim()||"Neue Aufgabe",ownerName:$("fOwner").value.trim()||profile.displayName,ownerUid:currentUser.uid,deadline:cleanDateInput($("fDeadline").value),status:$("fStatus").value,next:$("fNext").value.trim()||"NÃ¤chsten Schritt festlegen",createdBy:currentUser.uid,createdAt:serverTimestamp()});closeModal();await render();toast("Aufgabe gespeichert.")}catch(e){toast("Speichern nicht mÃ¶glich.");console.error(e)}
}
function openPostForm(defaultType="question"){
 modal(`<button class="modal-close" onclick="closeModal()">Ã—</button><div class="kicker">CAMPUS-FORUM</div><h2>Beitrag schreiben</h2><div class="form"><label>Kategorie<select id="pType"><option value="question" ${defaultType==="question"?"selected":""}>â“ Frage</option><option value="info" ${defaultType==="info"?"selected":""}>ðŸ“¢ Info</option><option value="idea" ${defaultType==="idea"?"selected":""}>ðŸ’¡ Idee</option><option value="project">ðŸš€ Projekt</option><option value="practice">ðŸ¢ Praxis</option></select></label><label>Beitrag<textarea id="pText" rows="5" placeholder="Was mÃ¶chtest du teilen?" required></textarea></label><div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="addPost()">VerÃ¶ffentlichen</button></div></div>`);
}
async function addPost(){
 const text=$("pText").value.trim();if(!text){toast("Bitte Beitrag eingeben.");return}
 try{await addDoc(collection(db,"posts"),{authorUid:currentUser.uid,authorName:profile.displayName,type:$("pType").value,text,likes:0,comments:[],createdAt:serverTimestamp()});closeModal();await render();toast("Beitrag verÃ¶ffentlicht.")}catch(e){toast("Beitrag konnte nicht gespeichert werden.");console.error(e)}
}
async function likePost(id){try{await updateDoc(doc(db,"posts",id),{likes:increment(1)}) ;await render()}catch(e){toast("Aktion nicht mÃ¶glich.")}}
async function commentPost(id){
 const input=$("comment-"+id), text=input.value.trim();if(!text)return;
 try{await updateDoc(doc(db,"posts",id),{comments:arrayUnion({uid:currentUser.uid,name:profile.displayName,text,createdAt:new Date().toISOString()})});await render()}catch(e){toast("Antwort konnte nicht gespeichert werden.")}
}
function focusComment(id){setTimeout(()=>{const e=$("comment-"+id);if(e){e.focus();e.scrollIntoView({behavior:"smooth",block:"center"});}},80)}
async function deletePost(id){if(!confirm("Beitrag wirklich lÃ¶schen?"))return;try{await deleteDoc(doc(db,"posts",id));await render()}catch(e){toast("LÃ¶schen nicht erlaubt.")}}
function openHelpForm(){openPostForm("idea")}
function openProjectForm(){
 modal(`<button class="modal-close" onclick="closeModal()">Ã—</button><div class="kicker">PROJEKTE</div><h2>Projekt anlegen</h2><div class="form"><label>Projektname<input id="xTitle"></label><label>Team<input id="xTeam"></label><label>Praxispartner<input id="xPartner"></label><label>Ziel<textarea id="xGoal" rows="3"></textarea></label><label>Fortschritt (0â€“100)<input id="xProgress" type="number" min="0" max="100" value="0"></label><div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="addProject()">Speichern</button></div></div>`);
}
async function addProject(){try{await addDoc(collection(db,"projects"),{title:$("xTitle").value.trim()||"Neues Projekt",team:$("xTeam").value.trim()||"Team",partner:$("xPartner").value.trim()||"â€”",progress:Math.max(0,Math.min(100,Number($("xProgress").value)||0)),status:"green",goal:$("xGoal").value.trim()||"Ziel ergÃ¤nzen",createdBy:currentUser.uid,createdAt:serverTimestamp()});closeModal();await render();toast("Projekt angelegt.")}catch(e){toast("Projekt konnte nicht angelegt werden.")}}
function openJournalForm(){modal(`<button class="modal-close" onclick="closeModal()">Ã—</button><div class="kicker">LERNJOURNAL</div><h2>Neuer Reflexionseintrag</h2><div class="form"><label>Titel<input id="jTitle"></label><label>Reflexion<textarea id="jText" rows="5"></textarea></label><label>Stimmung<select id="jMood"><option>ðŸ™‚</option><option>ðŸ˜ƒ</option><option>ðŸ¤”</option><option>ðŸ˜</option><option>ðŸ˜•</option></select></label><div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="addJournal()">Speichern</button></div></div>`)}
async function addJournal(){try{await addDoc(collection(db,"journal"),{uid:currentUser.uid,title:$("jTitle").value.trim()||"Reflexion",text:$("jText").value.trim()||"â€”",mood:$("jMood").value,createdAt:serverTimestamp()});closeModal();await render();toast("Journal gespeichert.")}catch(e){toast("Journal konnte nicht gespeichert werden.")}}
function openCompetenceForm(){modal(`<button class="modal-close" onclick="closeModal()">Ã—</button><div class="kicker">KOMPETENZWERKSTATT</div><h2>Kompetenz ergÃ¤nzen</h2><div class="form"><label>Kompetenz<input id="cName"></label><label>Aktueller Stand (0â€“10)<input id="cValue" type="number" min="0" max="10" value="5"></label><div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="addCompetence()">Speichern</button></div></div>`)}
async function addCompetence(){try{await addDoc(collection(db,"competencies"),{uid:currentUser.uid,name:$("cName").value.trim()||"Neue Kompetenz",value:Math.max(0,Math.min(10,Number($("cValue").value)||0)),createdAt:serverTimestamp()});closeModal();await render();toast("Kompetenz gespeichert.")}catch(e){toast("Kompetenz konnte nicht gespeichert werden.")}}
function openPracticeForm(){modal(`<button class="modal-close" onclick="closeModal()">Ã—</button><div class="kicker">PRAXIS</div><h2>Praxisauftrag</h2><div class="form"><label>Titel<input id="rTitle"></label><label>Datum<input id="rDate" type="date"></label><label>Beschreibung<textarea id="rText" rows="4"></textarea></label><div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="addPractice()">Speichern</button></div></div>`)}
async function addPractice(){try{await addDoc(collection(db,"practice"),{title:$("rTitle").value.trim()||"Praxisauftrag",date:cleanDateInput($("rDate").value),state:"offen",text:$("rText").value.trim()||"Beschreibung ergÃ¤nzen",createdBy:currentUser.uid,createdAt:serverTimestamp()});closeModal();await render();toast("Praxisauftrag gespeichert.")}catch(e){toast("Praxisauftrag konnte nicht gespeichert werden.")}}
function openCalendarForm(){modal(`<button class="modal-close" onclick="closeModal()">Ã—</button><div class="kicker">CAMPUS-KALENDER</div><h2>Termin ergÃ¤nzen</h2><div class="form"><label>Titel<input id="calTitle"></label><label>Datum<input id="calDate" type="date"></label><div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="addCalendar()">Speichern</button></div></div>`)}
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
    $("authError").textContent="Firebase konnte nicht geladen werden. Der Reiter â€žKonto erstellenâ€œ sollte trotzdem funktionieren.";
  }
}