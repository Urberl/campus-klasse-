let initializeApp, getAuth, onAuthStateChanged, createUserWithEmailAndPassword,     signInWithEmailAndPassword, signOut, sendPasswordResetEmail, updateProfile; let getFirestore, collection, doc, addDoc, setDoc, updateDoc, deleteDoc,     getDoc, getDocs, query, orderBy, limit, where, onSnapshot,     serverTimestamp, arrayUnion, increment;  let firebaseReadyPromise = null; async function loadFirebase(){   if(firebaseReadyPromise) return firebaseReadyPromise;   firebaseReadyPromise = Promise.all([     import("https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js"),     import("https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js"),     import("https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js")   ]).then(([appMod, authMod, fsMod])=>{     ({initializeApp}=appMod);  ({getAuth,onAuthStateChanged,createUserWithEmailAndPassword,signInWithEmailAndPassword,signOut,sendPasswordResetEmail,updateProfile}=authMod);  ({getFirestore,collection,doc,addDoc,setDoc,updateDoc,deleteDoc,getDoc,getDocs,query,orderBy,limit,where,onSnapshot,serverTimestamp,arrayUnion,increment}=fsMod);     if(!app) app=initializeApp(firebaseConfig);     if(!auth) auth=getAuth(app);     if(!db) db=getFirestore(app);     window.CampusFirebase={        get db(){return db},        get currentUser(){return currentUser},        collection,doc,addDoc,setDoc,updateDoc,deleteDoc,getDoc,getDocs,        query,orderBy,limit,where,onSnapshot,serverTimestamp,arrayUnion,increment,        modal,toast,pageHead,footer,render     };     return true;   });   return firebaseReadyPromise; }  /*
     WICHTIG:
     Diese Werte werden nach dem Anlegen deiner Firebase-Web-App aus
     der Firebase Console hier eingesetzt.
*/ const firebaseConfig = {    apiKey: "AIzaSyAI7xMbH4TqCGh1BJKyRyv_LQtqlsLUDNc",    authDomain: "campus-klasse.firebaseapp.com",    projectId: "campus-klasse",    storageBucket: "campus-klasse.firebasestorage.app",    messagingSenderId: "164958867141",    appId: "1:164958867141:web:676ab50f17f8a4b710eaac",    measurementId: "G-VYLG8YKT9E" };   /* =========================================================
   CAMPUSKLASSE MASTER – STABILE MODULREGISTRY
   Die Master-App selbst enthält keine Pflicht-Imports
   von Zusatzmodulen. Module werden erst beim Öffnen geladen.
   ========================================================= */ const CAMPUS_MODULES={      lernpfad:{label:"        Persönlicher Lernpfad",route:"lernpfad",ready:true},      lernressourcen:{label:"        Lernressourcen",route:"ressourcen",ready:true},      lernjournal:{label:"        Lernjournal",route:"journal",ready:true},      lernmethoden:{label:"        Lernmethoden",route:"methoden",ready:false},      lernimpulse:{label:"        Lernimpulse",route:"impulse",ready:false},      lernstand:{label:"        Lernstandsmessung",route:"lernstand",ready:true},      lerncoaching:{label:"        Lerncoaching",route:"lerncoaching",ready:false},      resilienz:{label:"        Resilienz & Respressi",route:"resilienz",ready:false},      kompetenz:{label:"        Kompetenzwerkstatt",route:"kompetenz",ready:true},      forum:{label:"        Campus-Forum",route:"forum",ready:true},      projekte:{label:"        Projekte",route:"projekte",ready:true},      praxis:{label:"        fpA",route:"praktikum",ready:true},      ki:{label:"        KI-Innovationslabor",route:"ki",ready:true},      kalender:{label:"        Campus-Kalender",route:"kalender",ready:true},      kompetenzprofil:{label:"        Kompetenzprofil",route:"kompetenzprofil",ready:false},      team:{label:"        Lehrkräfte Klassenteam",route:"team",ready:true} };  const configReady = !Object.values(firebaseConfig).some(v => String(v).includes("HIER_") || String(v).includes("DEIN-PROJEKT"));  let app=null, auth=null, db=null;  const $=id=>document.getElementById(id); const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
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
function updateTeacherTeamNav(){
  const links=[...document.querySelectorAll('a[href="#team"],button[data-page="team"],.nav-link[data-page="team"]')];
  links.forEach(link=>{
    const textNodes=[...link.childNodes].filter(n=>n.nodeType===3);
    if(textNodes.length){
      textNodes[textNodes.length-1].textContent=" Lehrkräfte Klassenteam";
    }else{
      link.setAttribute("aria-label","Lehrkräfte Klassenteam");
    }
    link.hidden=!isTeacher();
    link.setAttribute("aria-hidden",String(!isTeacher()));
  });
}


function showAuth(){
  $("authScreen").hidden=false;$("app").hidden=true;$("logoutBtn").hidden=true;
  $("userName").textContent="";
}
function showApp(){
  $("authScreen").hidden=true;$("app").hidden=false;$("logoutBtn").hidden=false;
  $("userName").textContent=profile?.displayName||currentUser?.email||"Campus";
  updateTeacherTeamNav();
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
    ${tile("       ","fpA","Praxisaufträge und Reflexion.","praktikum")}
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
         ["     ","KI zum Lernen","KI als Lernpartner nutzen – bereitgestellte KI-Angebote der Lehrkräfte.","ki-lernen"],
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


async function getKILearningLinks(){
  const rows=await getCollection("kiLernwerkstattLinks","createdAt",true);
  return rows.filter(x=>x.url&&x.title);
}

function normalizeExternalUrl(value){
  const raw=String(value||"").trim();
  if(!raw)return "";
  return /^https?:\/\//i.test(raw)?raw:"https://"+raw;
}

async function renderKILernen(){
  let links=[];
  try{links=await getKILearningLinks()}catch(e){console.error("KI-Lernwerkstatt:",e)}

  const categories=[
    {id:"lernen",icon:"🧠",title:"Mit KI lernen",text:"Themen erklären lassen, Zusammenhänge verstehen und Wissen aufbauen."},
    {id:"ueben",icon:"🎯",title:"Mit KI üben",text:"Fragen, Aufgaben, Quiz und Prüfungssituationen zum Üben nutzen."},
    {id:"partner",icon:"🤝",title:"KI als Lernpartner",text:"Tutor, Coach, Prüfer oder Sparringspartner gezielt einsetzen."},
    {id:"bewusst",icon:"🧭",title:"KI bewusst nutzen",text:"Prompts verbessern, Antworten prüfen und KI-Nutzung reflektieren."}
  ];

  const categoryLinks=id=>links.filter(x=>x.category===id);

  const teacherAction=isTeacher()
    ? `<button class="primary" onclick="openKILearningLinkForm()">＋ KI-Angebot bereitstellen</button>`
    : "";

  return `${pageHead(
    "KI ZUM LERNEN",
    "Lernwerkstatt · KI zum Lernen",
    "Lehrkräfte stellen geprüfte KI-Angebote bereit. Schülerinnen und Schüler nutzen die bereitgestellten Links zum Lernen.",
    teacherAction
  )}
  <style>
    .ki-learn-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
    .ki-learn-tile{min-width:0}
    .ki-learn-tile-head{display:flex;gap:12px;align-items:flex-start;margin-bottom:14px}
    .ki-learn-icon{font-size:34px;line-height:1}
    .ki-learn-links{display:flex;flex-direction:column;gap:8px;margin-top:14px}
    .ki-learn-link{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 12px;border:1px solid var(--line,#ddd);border-radius:10px;background:#fff;text-decoration:none;color:inherit}
    .ki-learn-link:hover{transform:translateY(-1px)}
    .ki-learn-link-main{min-width:0}
    .ki-learn-link-main strong{display:block}
    .ki-learn-link-main small{display:block;margin-top:3px;color:var(--muted);overflow:hidden;text-overflow:ellipsis}
    .ki-learn-link-open{white-space:nowrap;font-weight:700}
    .ki-learn-admin{display:flex;gap:6px;flex-wrap:wrap;margin-top:7px}
    .ki-learn-admin button{font-size:12px;padding:6px 9px}
    .ki-learn-empty{padding:12px;border:1px dashed var(--line,#ddd);border-radius:10px;color:var(--muted);margin-top:14px}
    .ki-learn-note{margin-top:16px}
    @media(max-width:800px){.ki-learn-grid{grid-template-columns:1fr}}
  </style>

  <div class="card" style="margin-bottom:16px;background:var(--soft-green)">
    <span class="badge">👩‍🏫 LEHRKRAFTGESTEUERT</span>
    <h2>KI-Angebote für dein Lernen</h2>
    <p>Hier findest du nur KI-Angebote, die von Lehrkräften für den Campus bereitgestellt wurden. Öffne ein Angebot und nutze es direkt zum Lernen.</p>
    ${isTeacher()?`<p style="margin-bottom:0"><strong>Lehrkräfte:</strong> Du kannst unten in jeder Kachel passende KI-Angebote hinzufügen und verwalten.</p>`:""}
  </div>

  <div class="ki-learn-grid">
    ${categories.map(c=>{
      const rows=categoryLinks(c.id);
      return `<section class="card ki-learn-tile">
        <div class="ki-learn-tile-head">
          <span class="ki-learn-icon">${c.icon}</span>
          <div><h2 style="margin:0 0 5px">${c.title}</h2><p style="margin:0">${c.text}</p></div>
        </div>
        <div class="ki-learn-links">
          ${rows.map(r=>`<div>
            <a class="ki-learn-link" href="${esc(normalizeExternalUrl(r.url))}" target="_blank" rel="noopener noreferrer">
              <span class="ki-learn-link-main"><strong>${esc(r.title)}</strong>${r.description?`<small>${esc(r.description)}</small>`:""}</span>
              <span class="ki-learn-link-open">Öffnen ↗</span>
            </a>
            ${isTeacher()?`<div class="ki-learn-admin"><button class="secondary" onclick="openKILearningLinkForm('${r.id}')">Bearbeiten</button><button class="secondary" onclick="deleteKILearningLink('${r.id}')">Entfernen</button></div>`:""}
          </div>`).join("")}
        </div>
        ${!rows.length?`<div class="ki-learn-empty">${isTeacher()?"Noch kein KI-Angebot in dieser Kategorie. Füge eines hinzu.":"Noch kein KI-Angebot bereitgestellt."}</div>`:""}
        ${isTeacher()?`<button class="secondary" style="margin-top:14px" onclick="openKILearningLinkForm('', '${c.id}')">＋ Angebot für diese Kachel</button>`:""}
      </section>`;
    }).join("")}
  </div>

  <div class="card ki-learn-note">
    <h3>🧭 Grundsatz</h3>
    <p>KI unterstützt dein Lernen – sie ersetzt nicht dein eigenes Denken. Prüfe Antworten, hinterfrage Ergebnisse und nutze KI so, dass du selbst etwas dazulernst.</p>
  </div>
  ${footer()}`;
}

function openKILearningLinkForm(id="",prefillCategory="lernen"){
  if(!isTeacher()){toast("Nur Lehrkräfte können KI-Angebote bereitstellen.");return}
  const load=async()=>{
    let item={};
    if(id){
      const rows=await getKILearningLinks();
      item=rows.find(x=>x.id===id)||{};
    }
    const categories=[
      ["lernen","🧠 Mit KI lernen"],
      ["ueben","🎯 Mit KI üben"],
      ["partner","🤝 KI als Lernpartner"],
      ["bewusst","🧭 KI bewusst nutzen"]
    ];
    modal(`<button class="modal-close" onclick="closeModal()">×</button>
      <div class="kicker">👩‍🏫 KI ZUM LERNEN</div>
      <h2>${id?"KI-Angebot bearbeiten":"KI-Angebot bereitstellen"}</h2>
      <p>Nur Lehrkräfte können Angebote einstellen. Schülerinnen und Schüler können die bereitgestellten Links öffnen, aber keine eigenen Links hinzufügen.</p>
      <div class="form">
        <label>Kategorie<select id="kiLearnCategory">${categories.map(c=>`<option value="${c[0]}" ${(item.category||prefillCategory)===c[0]?"selected":""}>${c[1]}</option>`).join("")}</select></label>
        <label>Name des KI-Angebots<input id="kiLearnTitle" value="${esc(item.title||"")}" placeholder="z. B. fobizz KI-Tools"></label>
        <label>Link<input id="kiLearnUrl" value="${esc(item.url||"")}" placeholder="https://…"></label>
        <label>Kurze Beschreibung<textarea id="kiLearnDescription" rows="3" placeholder="Wofür können Schülerinnen und Schüler dieses Angebot nutzen?">${esc(item.description||"")}</textarea></label>
        <div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="saveKILearningLink('${id}')">${id?"Änderungen speichern":"Bereitstellen"}</button></div>
      </div>`);
  };
  load().catch(e=>{console.error(e);toast("KI-Angebot konnte nicht geöffnet werden.")});
}

async function saveKILearningLink(id=""){
  if(!isTeacher()){toast("Nur Lehrkräfte können KI-Angebote bereitstellen.");return}
  const category=$("kiLearnCategory")?.value||"lernen";
  const title=$("kiLearnTitle")?.value.trim()||"";
  const url=normalizeExternalUrl($("kiLearnUrl")?.value||"");
  const description=$("kiLearnDescription")?.value.trim()||"";
  if(!title||!url){toast("Bitte Name und Link eintragen.");return}
  if(!/^https?:\/\//i.test(url)){toast("Bitte einen gültigen Link eingeben.");return}
  try{
    const data={category,title,url,description,updatedBy:currentUser.uid,updatedAt:serverTimestamp()};
    if(id) await updateDoc(doc(db,"kiLernwerkstattLinks",id),data);
    else await addDoc(collection(db,"kiLernwerkstattLinks"),{...data,createdBy:currentUser.uid,createdAt:serverTimestamp()});
    closeModal();await render();toast(id?"KI-Angebot aktualisiert.":"KI-Angebot bereitgestellt.");
  }catch(e){console.error("KI-Lernangebot:",e);toast("KI-Angebot konnte nicht gespeichert werden.")}
}

async function deleteKILearningLink(id){
  if(!isTeacher()){toast("Nur Lehrkräfte können KI-Angebote entfernen.");return}
  if(!confirm("Dieses KI-Angebot wirklich entfernen?"))return;
  try{await deleteDoc(doc(db,"kiLernwerkstattLinks",id));await render();toast("KI-Angebot entfernt.");}
  catch(e){console.error(e);toast("KI-Angebot konnte nicht entfernt werden.")}
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
      <button class="card res-card" onclick="startResilienzSkill('${x.id}')">
        <div class="res-icon">${x.icon}</div><h3>${x.title}</h3><p>${x.desc}</p><span class="pill res-tag">${x.tag}</span>
      </button>`).join("")}</div>
  </div>

  <div class="card res-week">
    <div class="kicker">MEINE RESILIENZ-WOCHE</div><h2>📈 Was hat mir gutgetan?</h2>
    <p>Markiere Strategien, die du diese Woche ausprobiert hast.</p>
    <div class="res-checks">${["Bewegung","Pause","Atemübung","Kontakt","Humor","Natur","Musik","Hilfe annehmen"].map(x=>`<button class="secondary" onclick="resilienzCheckin('${x}')">${x}</button>`).join("")}</div>
  </div>${footer()}`;
}

function updateResilienzStress(value){
  const v=Number(value);
  const val=$("resStressValue"),face=$("resStressFace"),box=$("resSkillButtons");
  if(val)val.textContent=v;
  if(face)face.textContent=v<=2?"🙂":v<=4?"😐":v<=6?"😟":v<=8?"😣":"😫";
  const ids=v<=2?["fokus","ressource","leicht"]:v<=5?["boden","bewegung","fokus","kontakt"]:v<=7?["atem","boden","distanz","bewegung"]:["atem","boden","pause","kontakt"];
  if(box)box.innerHTML=ids.slice(0,3).map(id=>{
    const s=resilienzSkillData(id);
    return `<button class="primary" style="margin:4px" onclick="startResilienzSkill('${id}')">${s[0]} ${s[1]}</button>`;
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
  if(id==="atem"){openResonanzatmung();return;}
  const d=resilienzSkillData(id);
  const tasks={
    boden:["Stell beide Füße auf den Boden. Spüre Druck, Temperatur und Kontakt. Schau anschließend drei Dinge im Raum bewusst an.","Was hast du wahrgenommen?","z. B. „Meine Schultern sind gerade etwas lockerer …“"],
    distanz:["Stell dir vor, du schaust kurz von außen auf deine Situation. Was würdest du einem guten Freund raten?","Was würdest du deinem guten Freund sagen?","Ein kurzer hilfreicher Satz …"],
    leicht:["Du musst nicht alles auf einmal lösen. Formuliere: „Für heute reicht als nächster Schritt …“","Was wäre dein ausreichend guter nächster Schritt?","Nur einen kleinen Schritt notieren …"],
    bewegung:["Steh auf. Kreise Schultern und Arme, strecke dich und gehe einige Schritte. Kehre anschließend bewusst zurück.","Was hat sich verändert?","z. B. „Ich bin wacher …“"],
    ressource:["Denke an eine Situation, die du trotz einer Schwierigkeit bewältigt hast. Welche Stärke kannst du heute nutzen?","Welche Ressource nimmst du mit?","z. B. Geduld, Humor, Durchhaltevermögen …"],
    kontakt:["Überlege: Wer könnte dir gerade guttun oder dich unterstützen? Du entscheidest selbst, ob du diese Person ansprichst.","Wer oder was könnte dich unterstützen?","Name oder Art der Unterstützung …"],
    fokus:["Formuliere den kleinsten nächsten Schritt, den du jetzt tatsächlich tun kannst. Nur diesen einen Schritt.","Was ist dein nächster Schritt?","Ich mache jetzt …"]
  };
  const t=tasks[id];
  modal(`<button class="modal-close" type="button" data-close-impuls-modal aria-label="Impuls schließen">×</button>
    <div class="kicker">RESPRESSI · SKILL</div><h2>${d[0]} ${d[1]}</h2>
    <p style="font-size:18px;line-height:1.55">${t[0]}</p>
    <div class="res-task"><label><strong>${t[1]}</strong></label><textarea id="resTaskInput" placeholder="${t[2]}"></textarea></div>
    <div class="form-actions"><button class="secondary" onclick="closeResilienzModal()">Schließen</button>
    <button class="secondary" onclick="toggleResilienzSchatz('${id}')">☆ In meine Schatzkiste</button>
    <button class="primary" onclick="resilienzSkillDone()">✓ Geschafft</button></div>`);
}
function resilienzSkillDone(){toast("Gut. Nimm kurz wahr, was sich verändert hat.");closeResilienzModal();}
function closeResilienzModal(){stopResonanzTimer();closeModal();}
function toggleResilienzSchatz(id){
  const key="campus_resilienz_schatzkiste";let a=[];try{a=JSON.parse(localStorage.getItem(key)||"[]")}catch(e){}
  a=a.includes(id)?a.filter(x=>x!==id):[...a,id];localStorage.setItem(key,JSON.stringify(a));
  toast(a.includes(id)?"In deine Resilienz-Schatzkiste gelegt.":"Aus der Schatzkiste entfernt.");
}
function openResilienzSchatzkiste(){
  let a=[];try{a=JSON.parse(localStorage.getItem("campus_resilienz_schatzkiste")||"[]")}catch(e){}
  const cards=a.map(id=>{const d=resilienzSkillData(id);return `<button class="card res-card" onclick="startResilienzSkill('${id}')"><div class="res-icon">${d[0]}</div><h3>${d[1]}</h3><p>${d[2]}</p></button>`}).join("");
  modal(`<button class="modal-close" onclick="closeResilienzModal()">×</button><div class="kicker">MEINE RESILIENZ-SCHATZKISTE</div>
    <h2>🧰 Meine Schätze</h2><p>Übungen, die du für dich als hilfreich ausgewählt hast.</p>
    <div class="res-grid">${cards||`<div class="empty">Deine Schatzkiste ist noch leer. Probiere eine Übung aus und lege sie anschließend hier hinein.</div>`}</div>
    <div class="form-actions"><button class="secondary" onclick="closeResilienzModal()">Schließen</button></div>`);
}
let resonanzTimer=null,resonanzRunning=false,resonanzEnd=0,resonanzStart=0;
function openResonanzatmung(){
  stopResonanzTimer();
  modal(`<button class="modal-close" onclick="closeResilienzModal()">×</button>
    <div class="kicker">RESPRESSI · RESONANZATMUNG</div><h2>🌬️ 4 Sekunden ein · 6 Sekunden aus</h2>
    <p style="font-size:17px;line-height:1.5">Der Kreis zeigt dir den Rhythmus. Einatmen: 4 Sekunden. Ausatmen: 6 Sekunden. Atme ruhig und ohne Druck.</p>
    <div class="breath-wrap">
      <div id="breathCircle" class="breath-circle"><span id="breathPhase" class="breath-phase">Bereit</span></div>
      <div id="breathClock" class="breath-time">02:00</div>
      <div id="breathHint" class="breath-hint">Drücke Start. Die erste Phase beginnt mit dem Einatmen.</div>
      <div class="breath-progress"><div id="breathProgress"></div></div>
      <button class="primary" id="breathStart" onclick="toggleResonanzTimer()">▶ Start</button>
    </div>
    <div class="form-actions"><button class="secondary" onclick="closeResilienzModal()">Schließen</button></div>`);
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
  try{events=await getCollection("events","start",false)}catch(e){console.error("Kalender events:",e)}
  if(!events.length){
    try{events=await getCollection("calendar","date",false)}catch(e){console.error("Kalender calendar:",e)}
  }

  const typeMeta={
    schulaufgabe:{label:"Schulaufgabe",className:"cal-blue"},
    kurzarbeit:{label:"Kurzarbeit",className:"cal-red"},
    projektvorstellung:{label:"Projektvorstellung",className:"cal-green"},
    referat:{label:"Referat",className:"cal-yellow"},
    praesentation:{label:"Präsentation",className:"cal-purple"},
    sonstiges:{label:"Sonstiger Termin",className:"cal-grey"}
  };
  const normalizeType=e=>{
    const raw=String(e?.type||e?.eventType||e?.category||"sonstiges").toLowerCase().trim();
    return raw==="präsentation"?"praesentation":(typeMeta[raw]?raw:"sonstiges");
  };
  const dateVal=e=>{
    const raw=e?.start||e?.date||e?.startDate;
    if(!raw)return null;
    if(typeof raw==="object"&&raw.seconds)return new Date(raw.seconds*1000);
    const d=new Date(String(raw).slice(0,10)+"T00:00:00");
    return isNaN(d)?null:d;
  };
  const eventsForDay=(y,m,d)=>events.filter(e=>{
    const x=dateVal(e);
    return x&&x.getFullYear()===y&&x.getMonth()===m&&x.getDate()===d;
  });

  const months=[
    {m:8,y:2026,name:"September 2026"},{m:9,y:2026,name:"Oktober 2026"},
    {m:10,y:2026,name:"November 2026"},{m:11,y:2026,name:"Dezember 2026"},
    {m:0,y:2027,name:"Januar 2027"},{m:1,y:2027,name:"Februar 2027"},
    {m:2,y:2027,name:"März 2027"},{m:3,y:2027,name:"April 2027"},
    {m:4,y:2027,name:"Mai 2027"},{m:5,y:2027,name:"Juni 2027"},{m:6,y:2027,name:"Juli 2027"}
  ];
  const week=["Mo","Di","Mi","Do","Fr","Sa","So"];

  const monthHTML=(y,m,name)=>{
    const first=new Date(y,m,1),days=new Date(y,m+1,0).getDate(),offset=(first.getDay()+6)%7,cells=[];
    for(let i=0;i<offset;i++)cells.push('<div class="cal-day empty"></div>');
    for(let d=1;d<=days;d++){
      const ds=eventsForDay(y,m,d);
      const firstType=ds.length?normalizeType(ds[0]):"";
      const meta=firstType?typeMeta[firstType]:null;
      cells.push(`<button type="button" class="cal-day ${meta?`has-event ${meta.className}`:""}" onclick="openCalendarDay(${y},${m},${d})">
        <span class="cal-num">${d}</span>
        ${meta?`<span class="cal-event-type">${esc(meta.label)}</span>${ds.length>1?`<span class="cal-count">+${ds.length-1}</span>`:""}`:""}
      </button>`);
    }
    while(cells.length%7)cells.push('<div class="cal-day empty"></div>');
    return `<section class="card cal-month">
      <div class="cal-month-head"><h2>${name}</h2></div>
      <div class="cal-week">${week.map(x=>`<div>${x}</div>`).join("")}</div>
      <div class="cal-grid">${cells.join("")}</div>
    </section>`;
  };

  window._campusCalendarEvents=events;
  const addButton=isTeacher()?'<button id="calendarAddBtn" class="primary" type="button">＋ Termin eintragen</button>':"";
  const legend=Object.entries(typeMeta).map(([k,v])=>
    `<span class="cal-legend-item"><i class="cal-legend-dot ${v.className}"></i>${esc(v.label)}</span>`
  ).join("");

  const html=`${pageHead("ORGANISATION","Campus-Kalender",
    "Das Schuljahr 26/27 auf einen Blick. Termine sind je nach Terminart farblich gekennzeichnet.",
    addButton)}
  <style>
    .cal-months{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
    .cal-month{padding:18px}.cal-month-head{margin-bottom:10px}
    .cal-week,.cal-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px}
    .cal-week{font-size:12px;color:var(--muted);text-align:center}
    .cal-day{min-height:62px;border:1px solid var(--line);border-radius:9px;background:#fff;padding:7px;text-align:left;cursor:pointer;position:relative;overflow:hidden}
    .cal-day.empty{border:0;background:transparent;cursor:default}
    .cal-day.has-event{border:2px solid rgba(0,0,0,.16)}
    .cal-num{display:block;font-size:14px}.cal-event-type{display:block;font-size:10px;line-height:1.15;margin-top:5px;font-weight:700}
    .cal-count{position:absolute;right:5px;bottom:5px;font-size:10px;background:rgba(255,255,255,.75);border-radius:10px;padding:1px 5px}
    .cal-blue{background:#dbeafe!important}.cal-red{background:#fee2e2!important}.cal-green{background:#dcfce7!important}
    .cal-yellow{background:#fef3c7!important}.cal-purple{background:#ede9fe!important}.cal-grey{background:#e5e7eb!important}
    .cal-legend{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
    .cal-legend-item{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--line);border-radius:999px;padding:6px 10px;background:#fff;font-size:12px}
    .cal-legend-dot{width:13px;height:13px;border-radius:3px;border:1px solid rgba(0,0,0,.12)}
    @media(max-width:800px){.cal-months{grid-template-columns:1fr}}
  </style>
  <div class="card" style="margin-bottom:16px">
    <strong>Campus-Kalender</strong>
    <p>Termine werden im gemeinsamen Kalender gespeichert. Klicke auf einen Tag, um die Details zu sehen.</p>
    <div class="cal-legend">${legend}</div>
  </div>
  <div class="cal-months">${months.map(x=>monthHTML(x.y,x.m,x.name)).join("")}</div>${footer()}`;
  setTimeout(()=>{const b=$("calendarAddBtn");if(b)b.addEventListener("click",openCalendarForm)},0);
  return html;
}

function calendarTypeMeta(e){
  const raw=String(e?.type||e?.eventType||e?.category||"sonstiges").toLowerCase().trim();
  const key=raw==="präsentation"?"praesentation":raw;
  return ({
    schulaufgabe:{label:"Schulaufgabe",className:"cal-blue"},
    kurzarbeit:{label:"Kurzarbeit",className:"cal-red"},
    projektvorstellung:{label:"Projektvorstellung",className:"cal-green"},
    referat:{label:"Referat",className:"cal-yellow"},
    praesentation:{label:"Präsentation",className:"cal-purple"},
    sonstiges:{label:"Sonstiger Termin",className:"cal-grey"}
  })[key]||{label:"Sonstiger Termin",className:"cal-grey"};
}

function openCalendarDay(y,m,d){
  const events=window._campusCalendarEvents||[];
  const day=events.filter(e=>{
    const raw=e.start||e.date||e.startDate;
    const x=raw&&raw.seconds?new Date(raw.seconds*1000):new Date(String(raw||"").slice(0,10)+"T00:00:00");
    return !isNaN(x)&&x.getFullYear()===y&&x.getMonth()===m&&x.getDate()===d;
  });
  const title=new Date(y,m,d).toLocaleDateString("de-DE",{weekday:"long",day:"2-digit",month:"long",year:"numeric"});
  modal(`<button class="modal-close" onclick="closeModal()">×</button>
    <div class="kicker">CAMPUS-KALENDER</div><h2>${esc(title)}</h2>
    <div class="list">${day.map(e=>{
      const meta=calendarTypeMeta(e);
      return `<div class="card ${meta.className}" style="margin-bottom:10px">
        <span class="pill">${esc(meta.label)}</span>
        <h3>${esc(e.title||e.name||"Termin")}</h3>
        ${e.time?`<p><strong>Uhrzeit:</strong> ${esc(e.time)}</p>`:""}
        ${e.location?`<p><strong>Ort:</strong> ${esc(e.location)}</p>`:""}
        <p style="white-space:pre-wrap">${esc(e.description||e.text||"")}</p>
      </div>`;
    }).join("")||`<div class="empty">An diesem Tag ist noch kein Termin eingetragen.</div>`}</div>
    <div class="form-actions"><button class="secondary" onclick="closeModal()">Schließen</button>
      ${isTeacher()?`<button class="primary" onclick="closeModal();setTimeout(openCalendarForm,50)">＋ Termin eintragen</button>`:""}
    </div>`);
}

async function renderTeam(){
  if(!isTeacher()){
    // Do not expose the teacher area to students and keep navigation safely available.
    return renderStart();
  }
  let updates=[];
  try{updates=await getCollection("classTeamUpdates","createdAt",true)}catch(e){console.error("Klassenteam:",e)}

  const typeMeta={
    info:"Information",vorkommnis:"Vorkommnis",vereinbarung:"Vereinbarung",
    beobachtung:"Beobachtung",wichtig:"Wichtig",sonstiges:"Sonstiges"
  };

  return `${pageHead("LEHRKRÄFTE","Lehrkräfte Klassenteam",
    "Interne Informationen für das Klassenteam – dokumentieren, informieren und später nachvollziehen.",
    `<button class="primary" onclick="openClassTeamUpdateForm()">＋ Information posten</button>`)}
  <style>
    .team-info-grid{display:grid;grid-template-columns:minmax(280px,1fr) minmax(0,1.8fr);gap:16px}
    .team-history-item{border:1px solid var(--line);border-radius:12px;padding:15px;margin-bottom:10px;background:#fff}
    .team-history-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}
    .team-history-meta{font-size:12px;color:var(--muted);margin-top:5px}
    .team-history-text{white-space:pre-wrap;margin:10px 0 0}
    @media(max-width:850px){.team-info-grid{grid-template-columns:1fr}}
  </style>
  <div class="team-info-grid">
    <section class="card">
      <div class="kicker">KLASSENTEAM</div>
      <h2>Interne Informationen</h2>
      <p>Hier können Lehrkräfte wichtige Beobachtungen, Vorkommnisse, Vereinbarungen und Informationen für das Klassenteam dokumentieren.</p>
      <div class="notice"><strong>Nur für Lehrkräfte</strong><p style="margin-bottom:0">Schülerinnen und Schüler haben keinen Zugang zu diesem Bereich.</p></div>
      <div style="margin-top:14px"><button class="primary" onclick="openClassTeamUpdateForm()">＋ Neue Information</button></div>
    </section>
    <section class="card">
      <div class="kicker">BIBLIOTHEK</div><h2>Historie</h2>
      <p>Alle bisherigen Informationen werden chronologisch gesammelt.</p>
      <div class="list">
        ${updates.map(u=>{
          const type=typeMeta[u.type]||"Sonstiges";
          const date=u.date||fmtDate(u.createdAt);
          return `<article class="team-history-item">
            <div class="team-history-head">
              <div><span class="pill">${esc(type)}</span><h3 style="margin:8px 0 0">${esc(u.title||"Information")}</h3></div>
              <small>${esc(date)}</small>
            </div>
            <div class="team-history-meta">Gepostet von ${esc(u.authorName||"Lehrkraft")}</div>
            <p class="team-history-text">${esc(u.text||"")}</p>
            ${u.followUp?`<div class="notice" style="margin-top:10px"><strong>Nächster Schritt / Vereinbarung</strong><p style="margin-bottom:0;white-space:pre-wrap">${esc(u.followUp)}</p></div>`:""}
          </article>`;
        }).join("")||`<div class="empty">Noch keine Informationen dokumentiert.</div>`}
      </div>
    </section>
  </div>${footer()}`;
}

function openClassTeamUpdateForm(){
  if(!isTeacher()){toast("Nur Lehrkräfte können Informationen posten.");return}
  const today=new Date();today.setMinutes(today.getMinutes()-today.getTimezoneOffset());
  modal(`<button class="modal-close" onclick="closeModal()">×</button>
    <div class="kicker">LEHRKRÄFTE KLASSENTEAM</div><h2>Information posten</h2>
    <div class="form">
      <label>Datum<input id="ctDate" type="date" value="${today.toISOString().slice(0,10)}"></label>
      <label>Art<select id="ctType">
        <option value="info">Information</option><option value="vorkommnis">Vorkommnis</option>
        <option value="vereinbarung">Vereinbarung</option><option value="beobachtung">Beobachtung</option>
        <option value="wichtig">Wichtig</option><option value="sonstiges">Sonstiges</option>
      </select></label>
      <label>Titel<input id="ctTitle" placeholder="Kurze Überschrift" required></label>
      <label>Information<textarea id="ctText" rows="6" placeholder="Was sollte das Klassenteam wissen?" required></textarea></label>
      <label>Nächster Schritt / Vereinbarung (optional)<textarea id="ctFollowUp" rows="3"></textarea></label>
      <div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button>
      <button class="primary" onclick="saveClassTeamUpdate()">Veröffentlichen</button></div>
    </div>`);
}

async function saveClassTeamUpdate(){
  if(!isTeacher()){toast("Nur Lehrkräfte können Informationen posten.");return}
  const title=$("ctTitle")?.value.trim()||"", body=$("ctText")?.value.trim()||"";
  if(!title||!body){toast("Bitte Titel und Information ausfüllen.");return}
  try{
    await addDoc(collection(db,"classTeamUpdates"),{
      date:$("ctDate")?.value||new Date().toISOString().slice(0,10),
      type:$("ctType")?.value||"info",title,text:body,
      followUp:$("ctFollowUp")?.value.trim()||"",
      authorUid:currentUser.uid,authorName:profile?.displayName||currentUser?.email||"Lehrkraft",
      createdAt:serverTimestamp(),updatedAt:serverTimestamp()
    });
    closeModal();await render();toast("Information für das Klassenteam gespeichert.");
  }catch(e){console.error("Klassenteam speichern:",e);toast("Information konnte nicht gespeichert werden.");}
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


/* =========================================================
   CAMPUSKLASSE – LERNSTANDSMESSUNG PP 11
   26 Lernstandsmessungen
   5 identische Kompetenzdimensionen × 3 Punkte = 15 Punkte
   ========================================================= */

const LERNSTAND_COMPETENCIES = [
  {id:"fachwissen",label:"Fachwissen",short:"Wissen"},
  {id:"erkennen",label:"Erkennen & Zuordnen",short:"Erkennen"},
  {id:"anwenden",label:"Anwenden & Erklären",short:"Anwenden"},
  {id:"analysieren",label:"Analysieren & Beurteilen",short:"Analysieren"},
  {id:"reflektieren",label:"Reflektieren & Handeln",short:"Handeln"}
];

const LERNSTAND_AREAS = {
  lb1:{title:"Wissenschaftliche Pädagogik & Psychologie",icon:"🔬"},
  lb2:{title:"Grundlagen des Erlebens & Verhaltens",icon:"🧠"},
  lb3:{title:"Erziehungsprozesse",icon:"🤝"},
  lb4:{title:"Lernen",icon:"📚"}
};

const LERNSTAND_DEFAULTS = [
  {
    "id": "ls01",
    "nr": 1,
    "learningArea": "lb1",
    "areaTitle": "Wissenschaftliche Pädagogik & Psychologie",
    "title": "Gegenstandsbereiche von Pädagogik und Psychologie",
    "description": "Kompetenzüberprüfung mit fünf einheitlichen Kompetenzdimensionen.",
    "tasks": [
      {
        "id": "fachwissen",
        "label": "Fachwissen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "erkennen",
        "label": "Erkennen & Zuordnen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "anwenden",
        "label": "Anwenden & Erklären",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "analysieren",
        "label": "Analysieren & Beurteilen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "reflektieren",
        "label": "Reflektieren & Handeln",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      }
    ]
  },
  {
    "id": "ls02",
    "nr": 2,
    "learningArea": "lb1",
    "areaTitle": "Wissenschaftliche Pädagogik & Psychologie",
    "title": "Wissenschaftliche Pädagogik/Psychologie vs. Alltagspsychologie",
    "description": "Kompetenzüberprüfung mit fünf einheitlichen Kompetenzdimensionen.",
    "tasks": [
      {
        "id": "fachwissen",
        "label": "Fachwissen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "erkennen",
        "label": "Erkennen & Zuordnen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "anwenden",
        "label": "Anwenden & Erklären",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "analysieren",
        "label": "Analysieren & Beurteilen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "reflektieren",
        "label": "Reflektieren & Handeln",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      }
    ]
  },
  {
    "id": "ls03",
    "nr": 3,
    "learningArea": "lb1",
    "areaTitle": "Wissenschaftliche Pädagogik & Psychologie",
    "title": "Experiment als wissenschaftliche Methode",
    "description": "Kompetenzüberprüfung mit fünf einheitlichen Kompetenzdimensionen.",
    "tasks": [
      {
        "id": "fachwissen",
        "label": "Fachwissen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "erkennen",
        "label": "Erkennen & Zuordnen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "anwenden",
        "label": "Anwenden & Erklären",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "analysieren",
        "label": "Analysieren & Beurteilen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "reflektieren",
        "label": "Reflektieren & Handeln",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      }
    ]
  },
  {
    "id": "ls04",
    "nr": 4,
    "learningArea": "lb2",
    "areaTitle": "Grundlagen des Erlebens und Verhaltens",
    "title": "Wahrnehmungsprozess",
    "description": "Kompetenzüberprüfung mit fünf einheitlichen Kompetenzdimensionen.",
    "tasks": [
      {
        "id": "fachwissen",
        "label": "Fachwissen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "erkennen",
        "label": "Erkennen & Zuordnen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "anwenden",
        "label": "Anwenden & Erklären",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "analysieren",
        "label": "Analysieren & Beurteilen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "reflektieren",
        "label": "Reflektieren & Handeln",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      }
    ]
  },
  {
    "id": "ls05",
    "nr": 5,
    "learningArea": "lb2",
    "areaTitle": "Grundlagen des Erlebens und Verhaltens",
    "title": "Einflussfaktoren auf Wahrnehmung",
    "description": "Kompetenzüberprüfung mit fünf einheitlichen Kompetenzdimensionen.",
    "tasks": [
      {
        "id": "fachwissen",
        "label": "Fachwissen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "erkennen",
        "label": "Erkennen & Zuordnen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "anwenden",
        "label": "Anwenden & Erklären",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "analysieren",
        "label": "Analysieren & Beurteilen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "reflektieren",
        "label": "Reflektieren & Handeln",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      }
    ]
  },
  {
    "id": "ls06",
    "nr": 6,
    "learningArea": "lb2",
    "areaTitle": "Grundlagen des Erlebens und Verhaltens",
    "title": "Mehrspeichermodell des Gedächtnisses",
    "description": "Kompetenzüberprüfung mit fünf einheitlichen Kompetenzdimensionen.",
    "tasks": [
      {
        "id": "fachwissen",
        "label": "Fachwissen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "erkennen",
        "label": "Erkennen & Zuordnen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "anwenden",
        "label": "Anwenden & Erklären",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "analysieren",
        "label": "Analysieren & Beurteilen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "reflektieren",
        "label": "Reflektieren & Handeln",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      }
    ]
  },
  {
    "id": "ls07",
    "nr": 7,
    "learningArea": "lb2",
    "areaTitle": "Grundlagen des Erlebens und Verhaltens",
    "title": "Speichersysteme des Langzeitgedächtnisses",
    "description": "Kompetenzüberprüfung mit fünf einheitlichen Kompetenzdimensionen.",
    "tasks": [
      {
        "id": "fachwissen",
        "label": "Fachwissen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "erkennen",
        "label": "Erkennen & Zuordnen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "anwenden",
        "label": "Anwenden & Erklären",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "analysieren",
        "label": "Analysieren & Beurteilen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "reflektieren",
        "label": "Reflektieren & Handeln",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      }
    ]
  },
  {
    "id": "ls08",
    "nr": 8,
    "learningArea": "lb2",
    "areaTitle": "Grundlagen des Erlebens und Verhaltens",
    "title": "Strategien zum Wissenserwerb",
    "description": "Kompetenzüberprüfung mit fünf einheitlichen Kompetenzdimensionen.",
    "tasks": [
      {
        "id": "fachwissen",
        "label": "Fachwissen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "erkennen",
        "label": "Erkennen & Zuordnen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "anwenden",
        "label": "Anwenden & Erklären",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "analysieren",
        "label": "Analysieren & Beurteilen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "reflektieren",
        "label": "Reflektieren & Handeln",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      }
    ]
  },
  {
    "id": "ls09",
    "nr": 9,
    "learningArea": "lb2",
    "areaTitle": "Grundlagen des Erlebens und Verhaltens",
    "title": "Emotionen und ihre Komponenten",
    "description": "Kompetenzüberprüfung mit fünf einheitlichen Kompetenzdimensionen.",
    "tasks": [
      {
        "id": "fachwissen",
        "label": "Fachwissen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "erkennen",
        "label": "Erkennen & Zuordnen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "anwenden",
        "label": "Anwenden & Erklären",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "analysieren",
        "label": "Analysieren & Beurteilen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "reflektieren",
        "label": "Reflektieren & Handeln",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      }
    ]
  },
  {
    "id": "ls10",
    "nr": 10,
    "learningArea": "lb2",
    "areaTitle": "Grundlagen des Erlebens und Verhaltens",
    "title": "Emotionsregulation",
    "description": "Kompetenzüberprüfung mit fünf einheitlichen Kompetenzdimensionen.",
    "tasks": [
      {
        "id": "fachwissen",
        "label": "Fachwissen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "erkennen",
        "label": "Erkennen & Zuordnen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "anwenden",
        "label": "Anwenden & Erklären",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "analysieren",
        "label": "Analysieren & Beurteilen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "reflektieren",
        "label": "Reflektieren & Handeln",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      }
    ]
  },
  {
    "id": "ls11",
    "nr": 11,
    "learningArea": "lb2",
    "areaTitle": "Grundlagen des Erlebens und Verhaltens",
    "title": "Motivation",
    "description": "Kompetenzüberprüfung mit fünf einheitlichen Kompetenzdimensionen.",
    "tasks": [
      {
        "id": "fachwissen",
        "label": "Fachwissen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "erkennen",
        "label": "Erkennen & Zuordnen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "anwenden",
        "label": "Anwenden & Erklären",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "analysieren",
        "label": "Analysieren & Beurteilen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "reflektieren",
        "label": "Reflektieren & Handeln",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      }
    ]
  },
  {
    "id": "ls12",
    "nr": 12,
    "learningArea": "lb2",
    "areaTitle": "Grundlagen des Erlebens und Verhaltens",
    "title": "Attributionstheorie nach Weiner",
    "description": "Kompetenzüberprüfung mit fünf einheitlichen Kompetenzdimensionen.",
    "tasks": [
      {
        "id": "fachwissen",
        "label": "Fachwissen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "erkennen",
        "label": "Erkennen & Zuordnen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "anwenden",
        "label": "Anwenden & Erklären",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "analysieren",
        "label": "Analysieren & Beurteilen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "reflektieren",
        "label": "Reflektieren & Handeln",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      }
    ]
  },
  {
    "id": "ls13",
    "nr": 13,
    "learningArea": "lb3",
    "areaTitle": "Erziehungsprozesse",
    "title": "Merkmale von Erziehung",
    "description": "Kompetenzüberprüfung mit fünf einheitlichen Kompetenzdimensionen.",
    "tasks": [
      {
        "id": "fachwissen",
        "label": "Fachwissen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "erkennen",
        "label": "Erkennen & Zuordnen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "anwenden",
        "label": "Anwenden & Erklären",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "analysieren",
        "label": "Analysieren & Beurteilen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "reflektieren",
        "label": "Reflektieren & Handeln",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      }
    ]
  },
  {
    "id": "ls14",
    "nr": 14,
    "learningArea": "lb3",
    "areaTitle": "Erziehungsprozesse",
    "title": "Mündigkeit nach Roth",
    "description": "Kompetenzüberprüfung mit fünf einheitlichen Kompetenzdimensionen.",
    "tasks": [
      {
        "id": "fachwissen",
        "label": "Fachwissen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "erkennen",
        "label": "Erkennen & Zuordnen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "anwenden",
        "label": "Anwenden & Erklären",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "analysieren",
        "label": "Analysieren & Beurteilen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "reflektieren",
        "label": "Reflektieren & Handeln",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      }
    ]
  },
  {
    "id": "ls15",
    "nr": 15,
    "learningArea": "lb3",
    "areaTitle": "Erziehungsprozesse",
    "title": "Erziehungsmaßnahmen",
    "description": "Kompetenzüberprüfung mit fünf einheitlichen Kompetenzdimensionen.",
    "tasks": [
      {
        "id": "fachwissen",
        "label": "Fachwissen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "erkennen",
        "label": "Erkennen & Zuordnen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "anwenden",
        "label": "Anwenden & Erklären",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "analysieren",
        "label": "Analysieren & Beurteilen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "reflektieren",
        "label": "Reflektieren & Handeln",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      }
    ]
  },
  {
    "id": "ls16",
    "nr": 16,
    "learningArea": "lb3",
    "areaTitle": "Erziehungsprozesse",
    "title": "Erziehungsstile nach Baumrind",
    "description": "Kompetenzüberprüfung mit fünf einheitlichen Kompetenzdimensionen.",
    "tasks": [
      {
        "id": "fachwissen",
        "label": "Fachwissen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "erkennen",
        "label": "Erkennen & Zuordnen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "anwenden",
        "label": "Anwenden & Erklären",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "analysieren",
        "label": "Analysieren & Beurteilen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "reflektieren",
        "label": "Reflektieren & Handeln",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      }
    ]
  },
  {
    "id": "ls17",
    "nr": 17,
    "learningArea": "lb3",
    "areaTitle": "Erziehungsprozesse",
    "title": "Frühe Bildung und Erziehung",
    "description": "Kompetenzüberprüfung mit fünf einheitlichen Kompetenzdimensionen.",
    "tasks": [
      {
        "id": "fachwissen",
        "label": "Fachwissen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "erkennen",
        "label": "Erkennen & Zuordnen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "anwenden",
        "label": "Anwenden & Erklären",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "analysieren",
        "label": "Analysieren & Beurteilen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "reflektieren",
        "label": "Reflektieren & Handeln",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      }
    ]
  },
  {
    "id": "ls18",
    "nr": 18,
    "learningArea": "lb4",
    "areaTitle": "Lernen",
    "title": "Begriff und Merkmale des Lernens",
    "description": "Kompetenzüberprüfung mit fünf einheitlichen Kompetenzdimensionen.",
    "tasks": [
      {
        "id": "fachwissen",
        "label": "Fachwissen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "erkennen",
        "label": "Erkennen & Zuordnen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "anwenden",
        "label": "Anwenden & Erklären",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "analysieren",
        "label": "Analysieren & Beurteilen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "reflektieren",
        "label": "Reflektieren & Handeln",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      }
    ]
  },
  {
    "id": "ls19",
    "nr": 19,
    "learningArea": "lb4",
    "areaTitle": "Lernen",
    "title": "Klassisches Konditionieren – Grundlagen",
    "description": "Beispielhafte Kompetenzüberprüfung: klassisches Konditionieren. Nach drei Versuchen werden die Musterlösungen sichtbar.",
    "tasks": [
      {
        "id": "fachwissen",
        "label": "Fachwissen",
        "points": 3,
        "prompt": "Erkläre die Begriffe neutraler Reiz, unkonditionierter Reiz, unkonditionierte Reaktion, konditionierter Reiz und konditionierte Reaktion.",
        "solution": "Neutraler Reiz: löst zunächst keine relevante gelernte Reaktion aus. Unkonditionierter Reiz: löst eine Reaktion ohne vorheriges Lernen aus. Unkonditionierte Reaktion: angeborene/nicht gelernte Reaktion. Konditionierter Reiz: ursprünglich neutraler Reiz, der durch Kopplung gelernt wurde. Konditionierte Reaktion: gelernte Reaktion auf den konditionierten Reiz."
      },
      {
        "id": "erkennen",
        "label": "Erkennen & Zuordnen",
        "points": 3,
        "prompt": "Ein Schüler bekommt vor einer Klassenarbeit wiederholt einen bestimmten Signalton kurz vor dem Austeilen der Aufgaben zu hören. Nach mehreren Wiederholungen wird er bereits beim Signalton nervös. Ordne Signalton, Klassenarbeit und Nervosität den Elementen der klassischen Konditionierung zu.",
        "solution": "Der Signalton ist zunächst ein neutraler Reiz und wird nach der Kopplung zum konditionierten Reiz. Die Klassenarbeit fungiert im Beispiel als unkonditionierter Reiz, die ursprüngliche Prüfungsreaktion als unkonditionierte Reaktion. Die Nervosität beim Signalton ist die konditionierte Reaktion."
      },
      {
        "id": "anwenden",
        "label": "Anwenden & Erklären",
        "points": 3,
        "prompt": "Erkläre mit dem Ablauf der klassischen Konditionierung, warum der Schüler nach mehreren Kopplungen bereits beim Signalton nervös wird.",
        "solution": "Der zunächst neutrale Signalton wird wiederholt mit dem auslösenden Reiz der Klassenarbeit gekoppelt. Durch die Lernvorgänge erhält der Signalton die Funktion eines konditionierten Reizes. Er kann anschließend allein die gelernte konditionierte Reaktion der Nervosität auslösen."
      },
      {
        "id": "analysieren",
        "label": "Analysieren & Beurteilen",
        "points": 3,
        "prompt": "Analysiere den Fall. Zeige, welche Aussage über den Lernprozess durch die Konditionierung erklärt werden kann und welche Aspekte damit nicht vollständig erklärt sind.",
        "solution": "Die Konditionierung erklärt die gelernte Verbindung zwischen Signalton und Nervosität. Sie erklärt aber nicht automatisch alle Ursachen der Prüfungsangst, etwa Gedanken, persönliche Bewertungen, Vorerfahrungen oder soziale Einflüsse. Eine fachlich gute Analyse grenzt die Erklärungskraft des Modells ein."
      },
      {
        "id": "reflektieren",
        "label": "Reflektieren & Handeln",
        "points": 3,
        "prompt": "Entwickle zwei pädagogisch sinnvolle Möglichkeiten, wie der Schüler die gelernte Reaktion auf den Signalton abschwächen könnte. Begründe beide Vorschläge fachlich.",
        "solution": "Möglich sind beispielsweise eine schrittweise Gegenkonditionierung bzw. neue positive Kopplungen mit dem Signalton sowie eine Veränderung der Situation durch wiederholte, sichere Erfahrungen ohne unmittelbar anschließende negative Konsequenz. Entscheidend ist die fachliche Begründung und die nachvollziehbare Verbindung zum Konditionierungsprozess."
      }
    ]
  },
  {
    "id": "ls20",
    "nr": 20,
    "learningArea": "lb4",
    "areaTitle": "Lernen",
    "title": "Erweiterungen des klassischen Konditionierens",
    "description": "Kompetenzüberprüfung mit fünf einheitlichen Kompetenzdimensionen.",
    "tasks": [
      {
        "id": "fachwissen",
        "label": "Fachwissen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "erkennen",
        "label": "Erkennen & Zuordnen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "anwenden",
        "label": "Anwenden & Erklären",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "analysieren",
        "label": "Analysieren & Beurteilen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "reflektieren",
        "label": "Reflektieren & Handeln",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      }
    ]
  },
  {
    "id": "ls21",
    "nr": 21,
    "learningArea": "lb4",
    "areaTitle": "Lernen",
    "title": "Thorndike / Versuch-Irrtum-Lernen",
    "description": "Kompetenzüberprüfung mit fünf einheitlichen Kompetenzdimensionen.",
    "tasks": [
      {
        "id": "fachwissen",
        "label": "Fachwissen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "erkennen",
        "label": "Erkennen & Zuordnen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "anwenden",
        "label": "Anwenden & Erklären",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "analysieren",
        "label": "Analysieren & Beurteilen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "reflektieren",
        "label": "Reflektieren & Handeln",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      }
    ]
  },
  {
    "id": "ls22",
    "nr": 22,
    "learningArea": "lb4",
    "areaTitle": "Lernen",
    "title": "Operantes Konditionieren / Verstärkung",
    "description": "Kompetenzüberprüfung mit fünf einheitlichen Kompetenzdimensionen.",
    "tasks": [
      {
        "id": "fachwissen",
        "label": "Fachwissen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "erkennen",
        "label": "Erkennen & Zuordnen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "anwenden",
        "label": "Anwenden & Erklären",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "analysieren",
        "label": "Analysieren & Beurteilen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "reflektieren",
        "label": "Reflektieren & Handeln",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      }
    ]
  },
  {
    "id": "ls23",
    "nr": 23,
    "learningArea": "lb4",
    "areaTitle": "Lernen",
    "title": "Verstärkung pädagogisch einsetzen",
    "description": "Kompetenzüberprüfung mit fünf einheitlichen Kompetenzdimensionen.",
    "tasks": [
      {
        "id": "fachwissen",
        "label": "Fachwissen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "erkennen",
        "label": "Erkennen & Zuordnen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "anwenden",
        "label": "Anwenden & Erklären",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "analysieren",
        "label": "Analysieren & Beurteilen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "reflektieren",
        "label": "Reflektieren & Handeln",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      }
    ]
  },
  {
    "id": "ls24",
    "nr": 24,
    "learningArea": "lb4",
    "areaTitle": "Lernen",
    "title": "Sozial-kognitive Theorie nach Bandura",
    "description": "Kompetenzüberprüfung mit fünf einheitlichen Kompetenzdimensionen.",
    "tasks": [
      {
        "id": "fachwissen",
        "label": "Fachwissen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "erkennen",
        "label": "Erkennen & Zuordnen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "anwenden",
        "label": "Anwenden & Erklären",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "analysieren",
        "label": "Analysieren & Beurteilen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "reflektieren",
        "label": "Reflektieren & Handeln",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      }
    ]
  },
  {
    "id": "ls25",
    "nr": 25,
    "learningArea": "lb4",
    "areaTitle": "Lernen",
    "title": "Modelllernen / Teilprozesse",
    "description": "Kompetenzüberprüfung mit fünf einheitlichen Kompetenzdimensionen.",
    "tasks": [
      {
        "id": "fachwissen",
        "label": "Fachwissen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "erkennen",
        "label": "Erkennen & Zuordnen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "anwenden",
        "label": "Anwenden & Erklären",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "analysieren",
        "label": "Analysieren & Beurteilen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "reflektieren",
        "label": "Reflektieren & Handeln",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      }
    ]
  },
  {
    "id": "ls26",
    "nr": 26,
    "learningArea": "lb4",
    "areaTitle": "Lernen",
    "title": "Medien und Lernen",
    "description": "Kompetenzüberprüfung mit fünf einheitlichen Kompetenzdimensionen.",
    "tasks": [
      {
        "id": "fachwissen",
        "label": "Fachwissen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "erkennen",
        "label": "Erkennen & Zuordnen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "anwenden",
        "label": "Anwenden & Erklären",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "analysieren",
        "label": "Analysieren & Beurteilen",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      },
      {
        "id": "reflektieren",
        "label": "Reflektieren & Handeln",
        "points": 3,
        "prompt": "Aufgabe wird später eingetragen.",
        "solution": ""
      }
    ]
  }
];

function lernstandStatus(points){
  const p=Number(points)||0;
  return p>=12?"green":p>=8?"yellow":"red";
}
function lernstandStatusText(points){
  return statusLabel[lernstandStatus(points)]||"—";
}
function lernstandTaskById(id){
  return LERNSTAND_DEFAULTS.find(x=>x.id===id);
}
function lernstandStoredTasks(){
  try{return JSON.parse(localStorage.getItem("campus_lernstand_tasks")||"{}")}catch(e){return {}}
}
function lernstandMergeTask(base,override){
  if(!override)return base;
  return {...base,...override,tasks:(base.tasks||[]).map(t=>{
    const o=(override.tasks||[]).find(x=>x.id===t.id);
    return o?{...t,...o}:t;
  })};
}
async function getLernstandTasks(){
  const local=lernstandStoredTasks();
  let remote=[];
  try{
    const snap=await getDocs(collection(db,"lernstandMessungen"));
    remote=snap.docs.map(d=>({id:d.id,...d.data()}));
  }catch(e){console.warn("Lernstand-Messungen:",e)}
  return LERNSTAND_DEFAULTS.map(base=>{
    const r=remote.find(x=>x.taskId===base.id);
    return lernstandMergeTask(base,local[base.id]||r||null);
  });
}
async function getMyLernstandAttempts(){
  try{
    const snap=await getDocs(collection(db,"lernstandVersuche"));
    return snap.docs.map(d=>({id:d.id,...d.data()}))
      .filter(x=>x.uid===currentUser.uid)
      .sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
  }catch(e){console.error("Lernstand-Versuche:",e);return []}
}
function lernstandAttemptCount(attempts,taskId){
  return attempts.filter(x=>x.taskId===taskId).length;
}
function lernstandLatest(attempts,taskId){
  return attempts.filter(x=>x.taskId===taskId).sort((a,b)=>(b.attempt||0)-(a.attempt||0))[0]||null;
}
function lernstandTrend(attempts,taskId){
  return attempts.filter(x=>x.taskId===taskId).sort((a,b)=>(a.attempt||0)-(b.attempt||0))
    .map(x=>Number(x.total)||0);
}
function lernstandCompetenceSeries(attempts,dimension){
  return attempts.filter(x=>x.competencies&&x.competencies[dimension]!==undefined)
    .sort((a,b)=>(a.createdAt?.seconds||0)-(b.createdAt?.seconds||0))
    .map(x=>Number(x.competencies[dimension])||0);
}
function lernstandOverallSeries(attempts){
  return attempts.sort((a,b)=>(a.createdAt?.seconds||0)-(b.createdAt?.seconds||0))
    .map(x=>Number(x.total)||0);
}
function lernstandBar(points,max=3){
  const p=Math.max(0,Math.min(max,Number(points)||0));
  return `<span class="ls-mini-bar"><i style="width:${Math.round(p/max*100)}%"></i></span>`;
}

async function getAllUsersForLernstand(){
  if(!isTeacher()) throw new Error("Nur Lehrkräfte dürfen die Schülerübersicht öffnen.");
  try{
    const snap=await getDocs(collection(db,"users"));
    return snap.docs.map(d=>({uid:d.id,...d.data()}))
      .filter(u=>u.role!=="teacher"&&u.role!=="admin")
      .sort((a,b)=>String(a.displayName||a.email||"").localeCompare(String(b.displayName||b.email||""),"de"));
  }catch(e){
    console.error("Schülerliste Lernstand:",e);
    return [];
  }
}

async function getAllLernstandAttempts(){
  if(!isTeacher()) return [];
  try{
    const snap=await getDocs(collection(db,"lernstandVersuche"));
    return snap.docs.map(d=>({id:d.id,...d.data()}));
  }catch(e){console.error("Alle Lernstand-Versuche:",e);return []}
}

function lernstandAttemptStatus(attempts,taskId,uid){
  const rows=attempts.filter(x=>x.taskId===taskId&&x.uid===uid);
  if(!rows.length)return "offen";
  const latest=rows.sort((a,b)=>(b.attempt||0)-(a.attempt||0))[0];
  return latest.status==="bewertet"?"bewertet":"abgegeben";
}
function lernstandStatusPill(status){
  if(status==="bewertet")return `<span class="pill green">✓ Bewertet</span>`;
  if(status==="abgegeben")return `<span class="pill yellow">● Abgegeben</span>`;
  return `<span class="pill">○ Offen</span>`;
}
function lernstandAttemptNumber(attempts,taskId,uid){
  return attempts.filter(x=>x.taskId===taskId&&x.uid===uid).length;
}

async function renderLernstand(){
  const tasks=await getLernstandTasks();
  const byArea={lb1:[],lb2:[],lb3:[],lb4:[]};
  tasks.forEach(t=>{if(byArea[t.learningArea])byArea[t.learningArea].push(t)});
  const ownAttempts=await getMyLernstandAttempts();
  const latestAll=ownAttempts.slice().sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
  const latest=latestAll[0];

  let teacherOverview="";
  if(isTeacher()){
    const students=await getAllUsersForLernstand();
    const allAttempts=await getAllLernstandAttempts();
    const submitted=new Set(allAttempts.map(a=>`${a.uid}|${a.taskId}`));
    const graded=new Set(allAttempts.filter(a=>a.status==="bewertet").map(a=>`${a.uid}|${a.taskId}`));
    const totalSlots=students.length*tasks.length;
    const submittedCount=submitted.size;
    const gradedCount=graded.size;
    teacherOverview=`
      <div class="card ls-teacher-dashboard" style="margin-bottom:16px">
        <div class="page-head" style="margin-bottom:12px">
          <div><div class="kicker">👩‍🏫 LEHRKRAFT · ÜBERSICHT</div><h2>Lernstand der Klasse</h2><p>Überblick über Bearbeitung, Abgabe und Bewertung. Für Details kannst du einen einzelnen Schüler öffnen.</p></div>
          <button class="primary" onclick="openLernstandTeacherOverview()">Schülerübersicht öffnen →</button>
        </div>
        <div class="ls-teacher-stats">
          <div class="card stat"><b>${students.length}</b><span>Schüler/innen</span></div>
          <div class="card stat"><b>${submittedCount}</b><span>Messungen abgegeben</span></div>
          <div class="card stat"><b>${gradedCount}</b><span>Messungen bewertet</span></div>
          <div class="card stat"><b>${Math.max(0,totalSlots-submittedCount)}</b><span>Noch offen</span></div>
        </div>
      </div>`;
  }

  return `${pageHead(
    "LERNSTAND · PÄDAGOGIK & PSYCHOLOGIE",
    "Lernstandsmessung",
    "26 Kompetenzüberprüfungen – mit einem einheitlichen Kompetenzprofil, damit deine Entwicklung sichtbar wird.",
    isTeacher()?`<button class="primary" onclick="openLernstandEditor()">＋ Aufgaben verwalten</button>`:""
  )}
  <style>
    .ls-intro{display:grid;grid-template-columns:1.35fr .65fr;gap:16px;margin-bottom:16px}.ls-intro-card{min-height:170px}
    .ls-flow{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:14px}.ls-flow div{padding:12px;border:1px solid var(--line,#ddd);border-radius:12px;background:#fff}.ls-flow b{display:block;margin-bottom:4px}
    .ls-area-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.ls-area{min-width:0}.ls-area-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}.ls-area-head h2{margin:3px 0 4px}
    .ls-item{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:13px 0;border-top:1px solid var(--line,#ddd)}.ls-item-main{min-width:0}.ls-item-main strong{display:block}.ls-item-main small{display:block;color:var(--muted);margin-top:3px}.ls-item-actions{display:flex;align-items:center;gap:7px;flex-wrap:wrap;justify-content:flex-end}
    .ls-competence-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:12px}.ls-comp-card{border:1px solid var(--line,#ddd);border-radius:12px;padding:11px;background:#fff}.ls-comp-card strong{font-size:12px;display:block}.ls-comp-card small{color:var(--muted)}.ls-mini-bar{display:block;height:6px;background:#edf0f2;border-radius:99px;overflow:hidden;margin-top:8px}.ls-mini-bar i{display:block;height:100%;background:var(--brand,#168fd0)}
    .ls-task-box{border:1px solid var(--line,#ddd);border-radius:12px;padding:14px;margin-top:10px;background:#fff}.ls-task-box h4{margin:0 0 7px}.ls-points{font-weight:800}.ls-progress{display:flex;gap:5px;margin:10px 0}.ls-progress span{height:7px;flex:1;border-radius:99px;background:#e9ecef}.ls-progress span.on{background:var(--brand,#168fd0)}.ls-solution{margin-top:10px;padding:12px;border-radius:10px;background:#f5f7f8;border:1px solid var(--line,#ddd)}
    .ls-teacher-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.ls-teacher-stats .card{margin:0}.ls-student-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.ls-student-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px;border:1px solid var(--line,#ddd);border-radius:12px;background:#fff}.ls-student-row small{display:block;color:var(--muted);margin-top:3px}.ls-detail-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:16px}.ls-matrix{width:100%;border-collapse:collapse}.ls-matrix th,.ls-matrix td{padding:9px;border-bottom:1px solid var(--line,#ddd);text-align:left;font-size:12px}.ls-matrix th{color:var(--muted)}.ls-matrix td.num{text-align:center;font-weight:800}.ls-overview-scroll{overflow:auto}.ls-grade-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}.ls-grade-grid label{font-size:12px}.ls-grade-grid input{width:100%}
    @media(max-width:900px){.ls-intro{grid-template-columns:1fr}.ls-area-grid,.ls-detail-grid,.ls-student-grid{grid-template-columns:1fr}.ls-flow{grid-template-columns:1fr}.ls-competence-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ls-teacher-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.ls-grade-grid{grid-template-columns:1fr 1fr}}
    @media(max-width:600px){.ls-competence-grid,.ls-teacher-stats,.ls-grade-grid{grid-template-columns:1fr}.ls-item,.ls-student-row{align-items:flex-start;flex-direction:column}.ls-item-actions{justify-content:flex-start}}
  </style>
  ${teacherOverview}
  <div class="ls-intro">
    <section class="card ls-intro-card"><span class="badge">WAS IST DAS?</span><h2>Dein Lernstand wird sichtbar.</h2><p>Nach jedem abgeschlossenen Thema kannst du deinen Lernstand überprüfen. Jede Messung prüft dieselben fünf Kompetenzdimensionen. Dadurch werden Fortschritte über das Schuljahr hinweg vergleichbar.</p><div class="ls-flow">${LERNSTAND_COMPETENCIES.map((c,i)=>`<div><b>${i+1}. ${c.label}</b><small>bis 3 Punkte</small></div>`).join("")}</div></section>
    <section class="card ls-intro-card"><span class="badge">15 PUNKTE</span><h2>Einheitliches Bewertungsschema</h2><p>Jede Kompetenzdimension wird mit bis zu <strong>3 Punkten</strong> bewertet. Zusammen ergeben sich maximal <strong>15 Punkte</strong>.</p><div class="list"><div class="list-item"><strong>12–15 Punkte</strong><span class="pill green">Auf Kurs</span></div><div class="list-item"><strong>8–11 Punkte</strong><span class="pill yellow">Klärungsbedarf</span></div><div class="list-item"><strong>0–7 Punkte</strong><span class="pill red">Handlungsbedarf</span></div></div></section>
  </div>
  <div class="card" style="margin-bottom:16px"><div class="kicker">KOMPETENZENTWICKLUNG</div><h2>Entwicklung über das Schuljahr</h2><p>Jede abgegebene und bewertete Messung wird dem eigenen Profil zugeordnet. Die fünf Kompetenzdimensionen können dadurch über mehrere Themen hinweg verglichen werden.</p><div class="ls-competence-grid">${LERNSTAND_COMPETENCIES.map(c=>{const series=lernstandCompetenceSeries(ownAttempts,c.id);const last=series.length?series[series.length-1]:null;return `<div class="ls-comp-card"><strong>${esc(c.label)}</strong><small>${last===null?"Noch kein Ergebnis":last+"/3 Punkte zuletzt"}</small>${last===null?"":lernstandBar(last,3)}</div>`}).join("")}</div>${latest?`<div class="notice" style="margin-top:14px"><strong>Letzter Lernstand: ${latest.total}/15 · ${lernstandStatusText(latest.total)}</strong><p style="margin-bottom:0">Versuch ${latest.attempt} bei „${esc(latest.title||"Lernstandsmessung")}".</p></div>`:`<div class="notice" style="margin-top:14px"><strong>Noch keine Lernstandsmessung abgeschlossen.</strong><p style="margin-bottom:0">Starte nach dem nächsten Thema mit der passenden Kompetenzüberprüfung.</p></div>`}</div>
  <div class="ls-area-grid">${["lb1","lb2","lb3","lb4"].map(areaId=>`<section class="card ls-area"><div class="ls-area-head"><div><span class="badge">${LERNSTAND_AREAS[areaId].icon} LERNBEREICH</span><h2>${esc(LERNSTAND_AREAS[areaId].title)}</h2></div><span class="pill">${byArea[areaId].length} Messungen</span></div>${byArea[areaId].map(t=>{const a=lernstandLatest(ownAttempts,t.id);const count=lernstandAttemptCount(ownAttempts,t.id);return `<div class="ls-item"><div class="ls-item-main"><strong>${t.nr}. ${esc(t.title)}</strong><small>${count?`letzter Stand: ${a.total}/15 · Versuch ${a.attempt}`:"noch nicht bearbeitet"}</small></div><div class="ls-item-actions">${a?`<span class="pill ${lernstandStatus(a.total)}">${lernstandStatusText(a.total)}</span>`:""}<button class="secondary" onclick="openLernstand('${t.id}')">${a?"Weiter / ansehen":"Starten"} →</button></div></div>`}).join("")}</section>`).join("")}</div>${footer()}`;
}

function openLernstand(id){
  if(isTeacher()){toast("Lehrkräfte bearbeiten und bewerten über die Schülerübersicht.");return}
  getLernstandTasks().then(async tasks=>{
    const t=tasks.find(x=>x.id===id);if(!t)return;
    const attempts=await getMyLernstandAttempts();
    const count=lernstandAttemptCount(attempts,id);
    if(count>=3){openLernstandResult(id);return}
    const nextAttempt=count+1;
    const prior=lernstandLatest(attempts,id);
    modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">${LERNSTAND_AREAS[t.learningArea].icon} LERNSTANDSMESSUNG ${t.nr}/26</div><h2>${esc(t.title)}</h2><p>${esc(t.description||"Kompetenzüberprüfung mit fünf Kompetenzdimensionen.")}</p><div class="notice"><strong>Versuch ${nextAttempt} von 3</strong><p style="margin-bottom:0">Bearbeite alle fünf Kompetenzaufgaben. Deine Antworten werden gespeichert. Nach dem dritten Versuch kannst du die Musterlösungen einsehen.</p></div><div class="ls-progress">${[1,2,3].map(n=>`<span class="${n<=count?"on":""}"></span>`).join("")}</div><div class="form">${t.tasks.map((q,i)=>`<div class="ls-task-box"><h4>${i+1}. ${esc(q.label)} <span class="ls-points">· ${q.points} P.</span></h4><p>${esc(q.prompt)}</p><textarea id="lsAnswer_${q.id}" rows="5" placeholder="Deine Antwort …"></textarea></div>`).join("")}<div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="submitLernstand('${t.id}',${nextAttempt})">Versuch ${nextAttempt} abgeben</button></div></div>`);
  });
}

function openLernstandResult(id){
  getLernstandTasks().then(async tasks=>{const t=tasks.find(x=>x.id===id);if(!t)return;const attempts=await getMyLernstandAttempts();const rows=attempts.filter(x=>x.taskId===id).sort((a,b)=>(a.attempt||0)-(b.attempt||0));const latest=rows[rows.length-1];modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">📘 ERGEBNIS · ${t.nr}/26</div><h2>${esc(t.title)}</h2><div class="notice"><strong>${latest?.status==="bewertet"?`${latest.total}/15 · ${lernstandStatusText(latest.total)}`:"Abgegeben – noch nicht bewertet"}</strong><p style="margin-bottom:0">Nach drei Versuchen stehen dir die Musterlösungen zur Verfügung.</p></div>${t.tasks.map((q,i)=>`<div class="ls-task-box"><h4>${i+1}. ${esc(q.label)} · ${q.points} P.</h4><div class="ls-solution"><strong>💡 Musterlösung</strong><p style="white-space:pre-wrap;margin-bottom:0">${esc(q.solution||"Noch keine Musterlösung hinterlegt.")}</p></div></div>`).join("")}<div class="form-actions"><button class="secondary" onclick="closeModal()">Schließen</button></div>`)});
}

async function submitLernstand(taskId,attempt){
  if(isTeacher()){toast("Lehrkräfte können keine Schülerantworten abgeben.");return}
  const tasks=await getLernstandTasks(),t=tasks.find(x=>x.id===taskId);if(!t)return;
  const existing=await getMyLernstandAttempts();if(existing.filter(x=>x.taskId===taskId).length>=3){toast("Für diese Lernstandsmessung sind bereits drei Versuche gespeichert.");return}
  const answers={};
  t.tasks.forEach(q=>answers[q.id]=$(`lsAnswer_${q.id}`)?.value.trim()||"");
  if(t.tasks.some(q=>!answers[q.id])){toast("Bitte beantworte alle fünf Kompetenzaufgaben.");return}
  try{await addDoc(collection(db,"lernstandVersuche"),{uid:currentUser.uid,displayName:profile?.displayName||currentUser?.email||"Schüler/in",taskId:t.id,title:t.title,nr:t.nr,learningArea:t.learningArea,attempt,answers,competencies:{},total:0,status:"abgegeben",createdAt:serverTimestamp()});closeModal();await render();toast(`Versuch ${attempt} wurde abgegeben.`)}catch(e){console.error("Lernstand speichern:",e);toast("Lernstand konnte nicht gespeichert werden.")}
}

async function openLernstandTeacherOverview(){
  if(!isTeacher()){toast("Dieser Bereich ist nur für Lehrkräfte.");return}
  const tasks=await getLernstandTasks(),students=await getAllUsersForLernstand(),attempts=await getAllLernstandAttempts();
  const completedFor=s=>tasks.filter(t=>attempts.some(a=>a.uid===s.uid&&a.taskId===t.id)).length;
  const gradedFor=s=>tasks.filter(t=>attempts.some(a=>a.uid===s.uid&&a.taskId===t.id&&a.status==="bewertet")).length;
  modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">👩‍🏫 LEHRKRAFT</div><h2>Schülerübersicht</h2><p>Hier siehst du, wer welche Lernstandsmessungen bereits abgegeben oder bewertet hat. Klicke einen Schüler an, um alle Details und die Kompetenzentwicklung zu öffnen.</p><div class="toolbar"><input class="search" id="lsStudentSearch" placeholder="Schüler/in suchen …" oninput="filterLernstandStudents()"></div><div class="ls-student-grid" id="lsStudentGrid">${students.map(s=>`<div class="ls-student-row" data-student-name="${esc((s.displayName||s.email||"").toLowerCase())}"><div><strong>${esc(s.displayName||s.email||"Schüler/in")}</strong><small>${completedFor(s)}/${tasks.length} Messungen abgegeben · ${gradedFor(s)}/${tasks.length} bewertet</small></div><button class="primary" onclick="openLernstandStudent('${s.uid}')">Einblick →</button></div>`).join("")||`<div class="empty">Keine Schülerprofile gefunden.</div>`}</div><div class="form-actions"><button class="secondary" onclick="closeModal()">Schließen</button></div>`);
}
function filterLernstandStudents(){const q=($('lsStudentSearch')?.value||'').toLowerCase().trim();document.querySelectorAll('#lsStudentGrid .ls-student-row').forEach(r=>r.hidden=!!q&&!r.dataset.studentName.includes(q))}

async function openLernstandStudent(uid){
  if(!isTeacher()){toast("Dieser Bereich ist nur für Lehrkräfte.");return}
  const tasks=await getLernstandTasks(),students=await getAllUsersForLernstand(),s=students.find(x=>x.uid===uid);if(!s)return;
  const attempts=(await getAllLernstandAttempts()).filter(a=>a.uid===uid).sort((a,b)=>(a.createdAt?.seconds||0)-(b.createdAt?.seconds||0));
  const latestByTask=tasks.map(t=>{const rows=attempts.filter(a=>a.taskId===t.id).sort((a,b)=>(b.attempt||0)-(a.attempt||0));return {t,a:rows[0]||null,rows}});
  const graded=attempts.filter(a=>a.status==="bewertet");
  const seriesByComp=LERNSTAND_COMPETENCIES.map(c=>({c,series:graded.map(a=>Number(a.competencies?.[c.id]??0))}));
  const avg=graded.length?(graded.reduce((n,a)=>n+Number(a.total||0),0)/graded.length).toFixed(1):"—";
  modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">👩‍🏫 SCHÜLER · INDIVIDUELLER LERNSTAND</div><h2>${esc(s.displayName||s.email||"Schüler/in")}</h2><div class="ls-teacher-stats"><div class="card stat"><b>${attempts.length}</b><span>Versuche</span></div><div class="card stat"><b>${graded.length}</b><span>Bewertet</span></div><div class="card stat"><b>${avg}</b><span>Ø Punkte / 15</span></div><div class="card stat"><b>${graded.length?"Ja":"Nein"}</b><span>Kompetenzprofil</span></div></div><div class="ls-detail-grid" style="margin-top:14px"><section class="card"><div class="kicker">KOMPETENZENTWICKLUNG</div><h3>Fünf Dimensionen</h3>${seriesByComp.map(x=>{const last=x.series.length?x.series[x.series.length-1]:null;return `<div style="margin:12px 0"><div style="display:flex;justify-content:space-between;gap:8px"><strong>${esc(x.c.label)}</strong><span>${last===null?"—":last+"/3"}</span></div>${last===null?"":lernstandBar(last,3)}</div>`}).join("")}</section><section class="card"><div class="kicker">FORTSCHRITT</div><h3>Lernstandsmessungen</h3><div class="ls-overview-scroll"><table class="ls-matrix"><thead><tr><th>#</th><th>Thema</th><th>Status</th><th>Punkte</th><th></th></tr></thead><tbody>${latestByTask.map(x=>`<tr><td>${x.t.nr}</td><td>${esc(x.t.title)}</td><td>${x.a?lernstandStatusPill(x.a.status):lernstandStatusPill("offen")}</td><td class="num">${x.a?.status==="bewertet"?`${x.a.total}/15`:"—"}</td><td>${x.a?`<button class="secondary" onclick="openLernstandTeacherAttempt('${x.a.id}')">Details</button>`:""}</td></tr>`).join("")}</tbody></table></div></section></div><div class="form-actions"><button class="secondary" onclick="openLernstandTeacherOverview()">← Schülerübersicht</button><button class="secondary" onclick="closeModal()">Schließen</button></div>`);
}

async function openLernstandTeacherAttempt(attemptId){
  if(!isTeacher())return;
  const snap=await getDoc(doc(db,"lernstandVersuche",attemptId));if(!snap.exists()){toast("Versuch nicht gefunden.");return}
  const a={id:snap.id,...snap.data()},tasks=await getLernstandTasks(),t=tasks.find(x=>x.id===a.taskId);if(!t)return;
  const competencies=a.competencies||{};
  modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">👩‍🏫 BEWERTUNG · VERSUCH ${a.attempt}/3</div><h2>${esc(a.title)}</h2><p><strong>${esc(a.displayName||"Schüler/in")}</strong> · ${a.status==="bewertet"?`${a.total}/15 · ${lernstandStatusText(a.total)}`:"noch nicht bewertet"}</p><div class="form">${t.tasks.map((q,i)=>`<div class="ls-task-box"><h4>${i+1}. ${esc(q.label)} · ${q.points} P.</h4><div class="notice"><strong>Antwort des Schülers</strong><p style="white-space:pre-wrap;margin-bottom:0">${esc(a.answers?.[q.id]||"")}</p></div><label>Punkte (0–3)<input id="lsGrade_${q.id}" type="number" min="0" max="3" step="1" value="${Math.max(0,Math.min(3,Number(competencies[q.id]??0)))}"></label><details style="margin-top:8px"><summary>Musterlösung anzeigen</summary><div class="ls-solution"><p style="white-space:pre-wrap;margin-bottom:0">${esc(q.solution||"Noch keine Musterlösung hinterlegt.")}</p></div></details></div>`).join("")}<label>Rückmeldung an den Schüler<textarea id="lsTeacherFeedback" rows="4" placeholder="Kurze Rückmeldung …">${esc(a.feedback||"")}</textarea></label><div class="form-actions"><button class="secondary" onclick="openLernstandStudent('${a.uid}')">Zurück</button><button class="primary" onclick="saveLernstandGrade('${a.id}')">Bewertung speichern</button></div></div>`);
}

async function saveLernstandGrade(attemptId){
  if(!isTeacher())return;
  try{
    const snap=await getDoc(doc(db,"lernstandVersuche",attemptId));if(!snap.exists())throw new Error("Versuch nicht gefunden");
    const a={id:snap.id,...snap.data()},tasks=await getLernstandTasks(),t=tasks.find(x=>x.id===a.taskId);if(!t)throw new Error("Messung nicht gefunden");
    const competencies={};let total=0;
    t.tasks.forEach(q=>{const v=Math.max(0,Math.min(3,Math.round(Number($(`lsGrade_${q.id}`)?.value)||0)));competencies[q.id]=v;total+=v});
    await updateDoc(doc(db,"lernstandVersuche",attemptId),{competencies,total,status:"bewertet",feedback:$('lsTeacherFeedback')?.value.trim()||"",gradedBy:currentUser.uid,gradedAt:serverTimestamp()});
    toast("Bewertung gespeichert.");await openLernstandStudent(a.uid);
  }catch(e){console.error("Lernstand bewerten:",e);toast("Bewertung konnte nicht gespeichert werden.")}
}

async function openLernstandEditor(){
  if(!isTeacher()){toast("Dieser Bereich ist nur für Lehrkräfte.");return}
  const tasks=await getLernstandTasks();
  modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">👩‍🏫 AUFGABENVERWALTUNG</div><h2>26 Kompetenzüberprüfungen verwalten</h2><p>Nur Lehrkräfte können Aufgaben und Musterlösungen bearbeiten. Schüler sehen ausschließlich die veröffentlichten Aufgaben und können nur Antworten abgeben.</p><div class="list">${tasks.map(t=>`<div class="ls-item"><div class="ls-item-main"><strong>${t.nr}. ${esc(t.title)}</strong><small>${esc(LERNSTAND_AREAS[t.learningArea].title)}</small></div><button class="secondary" onclick="openLernstandTaskEditor('${t.id}')">Aufgaben bearbeiten</button></div>`).join("")}</div><div class="form-actions"><button class="secondary" onclick="openLernstandTeacherOverview()">Schülerübersicht</button><button class="secondary" onclick="closeModal()">Schließen</button></div>`);
}

async function openLernstandTaskEditor(id){
  if(!isTeacher()){toast("Nur Lehrkräfte können Aufgaben einstellen.");return}
  const tasks=await getLernstandTasks(),t=tasks.find(x=>x.id===id);if(!t)return;
  modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">👩‍🏫 ${t.nr}/26 · ${esc(LERNSTAND_AREAS[t.learningArea].title)}</div><h2>${esc(t.title)}</h2><div class="form"><label>Kurzer Überblick / Beschreibung<textarea id="lsEditDescription" rows="3">${esc(t.description||"")}</textarea></label>${t.tasks.map(q=>`<div class="ls-task-box"><h4>${esc(q.label)} · 3 Punkte</h4><label>Aufgabe<textarea id="lsEditPrompt_${q.id}" rows="5">${esc(q.prompt||"")}</textarea></label><label>Musterlösung<textarea id="lsEditSolution_${q.id}" rows="5">${esc(q.solution||"")}</textarea></label></div>`).join("")}<div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="saveLernstandTask('${t.id}')">Speichern</button></div></div>`);
}

async function saveLernstandTask(id){
  if(!isTeacher())return;
  const base=lernstandTaskById(id);if(!base)return;
  const updated={...base,description:$('lsEditDescription')?.value.trim()||base.description,tasks:base.tasks.map(q=>({...q,prompt:$(`lsEditPrompt_${q.id}`)?.value.trim()||"",solution:$(`lsEditSolution_${q.id}`)?.value.trim()||""}))};
  try{await setDoc(doc(db,"lernstandMessungen",id),{taskId:id,title:updated.title,nr:updated.nr,learningArea:updated.learningArea,description:updated.description,tasks:updated.tasks,updatedBy:currentUser.uid,updatedAt:serverTimestamp()},{merge:true});const local=lernstandStoredTasks();local[id]=updated;localStorage.setItem("campus_lernstand_tasks",JSON.stringify(local));closeModal();await render();toast("Lernstandsmessung gespeichert.")}catch(e){console.error("Lernstand bearbeiten:",e);toast("Lernstandsmessung konnte nicht gespeichert werden.")}
}

window.openLernstand=openLernstand;window.submitLernstand=submitLernstand;window.openLernstandEditor=openLernstandEditor;window.openLernstandTaskEditor=openLernstandTaskEditor;window.saveLernstandTask=saveLernstandTask;window.openLernstandTeacherOverview=openLernstandTeacherOverview;window.openLernstandStudent=openLernstandStudent;window.openLernstandTeacherAttempt=openLernstandTeacherAttempt;window.saveLernstandGrade=saveLernstandGrade;window.filterLernstandStudents=filterLernstandStudents;window.openLernstandResult=openLernstandResult;

let __campusRenderSeq=0;
async function render(){
  if(!currentUser)return;
  const seq=++__campusRenderSeq;
  const p=location.hash.replace("#","")||"start";
  const pages={
    start:renderStart,kompass:renderKompass,lernwerkstatt:renderLernwerkstatt,"ki-lernen":renderKILernen,
    ressourcen:renderRessourcenRoute,lernpfad:renderLernpfadRoute,forum:renderForum,
    projekte:renderProjekte,kompetenz:renderKompetenz,journal:renderLernjournalRoute,
    praktikum:renderPraktikum,resilienz:renderResilienz,praxisfragen:renderPraxisFragen,
    praxisprojekte:renderPraxisProjekte,ki:renderKI,kalender:renderKalender,team:renderTeam,
    impulse:renderLernimpulse,lernstand:renderLernstand,
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
  updateTeacherTeamNav();
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
window.openCalendarForm=openCalendarForm;

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
window.openKILearningLinkForm=openKILearningLinkForm;
window.saveKILearningLink=saveKILearningLink;
window.deleteKILearningLink=deleteKILearningLink;
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

window.openProjectForm=openProjectForm;
window.openTaskForm=openTaskForm;
window.openClassTeamUpdateForm=openClassTeamUpdateForm;
window.saveClassTeamUpdate=saveClassTeamUpdate;


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

function openCalendarForm(){
  if(!isTeacher()){toast("Nur Lehrkräfte können Termine eintragen.");return}
  modal(`<button class="modal-close" onclick="closeModal()">×</button>
    <div class="kicker">CAMPUS-KALENDER · LEHRKRAFT</div><h2>Termin eintragen</h2>
    <div class="form">
      <label>Titel *<input id="calTitle" type="text" placeholder="z. B. Schulaufgabe Pädagogik" required></label>
      <label>Terminart *
        <select id="calType">
          <option value="schulaufgabe">Schulaufgabe</option>
          <option value="kurzarbeit">Kurzarbeit</option>
          <option value="projektvorstellung">Projektvorstellung</option>
          <option value="referat">Referat</option>
          <option value="praesentation">Präsentation</option>
          <option value="sonstiges">Sonstiger Termin / frei wählbar</option>
        </select>
      </label>
      <label>Datum *<input id="calDate" type="date" required></label>
      <label>Uhrzeit<input id="calTime" type="time"></label>
      <label>Ort<input id="calLocation" type="text" placeholder="z. B. F203"></label>
      <label>Beschreibung / weitere Informationen<textarea id="calDescription" rows="5" placeholder="Freie Informationen zum Termin …"></textarea></label>
      <div class="form-actions"><button class="secondary" type="button" onclick="closeModal()">Abbrechen</button>
      <button id="calendarSaveBtn" class="primary" type="button">Termin speichern</button></div>
    </div>`);
  const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());
  $("calDate").value=d.toISOString().slice(0,10);
  $("calendarSaveBtn").addEventListener("click",addCalendar);
}

async function addCalendar(){
  if(!isTeacher()){toast("Nur Lehrkräfte können Termine eintragen.");return}
  const title=$("calTitle")?.value.trim()||"",date=$("calDate")?.value||"",
        time=$("calTime")?.value||"",location=$("calLocation")?.value.trim()||"",
        description=$("calDescription")?.value.trim()||"",type=$("calType")?.value||"sonstiges";
  if(!title){toast("Bitte einen Titel eingeben.");return}
  if(!date){toast("Bitte ein Datum auswählen.");return}
  const payload={title,date,start:date,type,time,location,description,
    createdBy:currentUser.uid,createdByName:profile?.displayName||currentUser.email||"Campus-Mitglied",
    createdAt:serverTimestamp(),updatedAt:serverTimestamp()};
  const btn=$("calendarSaveBtn");if(btn){btn.disabled=true;btn.textContent="Speichert …"}
  try{
    await addDoc(collection(db,"events"),payload);
    closeModal();toast("Termin gespeichert.");await render();
  }catch(e){
    console.error("Kalender events:",e);
    try{
      await addDoc(collection(db,"calendar"),payload);
      closeModal();toast("Termin gespeichert.");await render();
    }catch(e2){
      console.error("Kalender calendar:",e2);
      if(btn){btn.disabled=false;btn.textContent="Termin speichern"}
      toast(e2?.code==="permission-denied"?"Speichern von Terminen ist in den Firebase-Regeln nicht freigegeben.":"Termin konnte nicht gespeichert werden.");
    }
  }
}


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


/* =========================================================
   ROBUST INTERACTION BRIDGE – KALENDER & IMPULSE
   ========================================================= */
(function(){
  if(window.__CampusInteractionBridgeInstalled)return;
  window.__CampusInteractionBridgeInstalled=true;

  document.addEventListener("click", async function(ev){
    const el=ev.target.closest("[data-calendar-add],[data-calendar-day],[data-impulse-id],[data-open-impulse]");
    if(!el)return;

    ev.preventDefault();
    ev.stopPropagation();

    try{
      if(el.hasAttribute("data-calendar-add")){
        if(typeof window.openCalendarForm==="function") window.openCalendarForm();
        else if(typeof openCalendarForm==="function") openCalendarForm();
        return;
      }

      if(el.hasAttribute("data-calendar-day")){
        const raw=el.getAttribute("data-calendar-day");
        const parts=raw.split("-").map(Number);
        if(parts.length===3 && typeof window.openCalendarDay==="function"){
          window.openCalendarDay(parts[0],parts[1],parts[2]);
        }
        return;
      }

      const impulseId=el.getAttribute("data-impulse-id")||el.getAttribute("data-open-impulse");
      if(impulseId){
        if(typeof window.openImpulse==="function") window.openImpulse(impulseId);
        else if(typeof window.openImpuls==="function") window.openImpuls(impulseId);
        else if(typeof window.openImpulseModal==="function") window.openImpulseModal(impulseId);
        else{
          const data=window._campusImpulses||window.impulses||[];
          const item=data.find(x=>String(x.id)===String(impulseId));
          if(item){
            const title=item.title||item.name||"Impuls";
            const body=item.text||item.content||item.description||"";
            if(typeof window.modal==="function") window.modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">IMPULS</div><h2>${esc(title)}</h2><p>${esc(body)}</p>`);
          }
        }
      }
    }catch(err){
      console.error("Campus Interaction:",err);
    }
  },true);
})();


/* Compatibility aliases */
if(typeof window.openCalendarForm!=="function" && typeof openCalendarForm==="function") window.openCalendarForm=openCalendarForm;
if(typeof window.addCalendar!=="function" && typeof addCalendar==="function") window.addCalendar=addCalendar;
if(typeof window.openCalendarDay!=="function" && typeof openCalendarDay==="function") window.openCalendarDay=openCalendarDay;
if(typeof window.openImpulse!=="function" && typeof openImpulse==="function") window.openImpulse=openImpulse;
if(typeof window.openImpuls!=="function" && typeof openImpuls==="function") window.openImpuls=openImpuls;
if(typeof window.openImpulseModal!=="function" && typeof openImpulseModal==="function") window.openImpulseModal=openImpulseModal;


try{ if(typeof closeResilienzModal==="function") window.closeResilienzModal=closeResilienzModal; }catch(_){}


/* Robust close handler for "Impuls für mich" */
(function(){
  if(window.__ImpulsCloseFixInstalled)return;
  window.__ImpulsCloseFixInstalled=true;
  document.addEventListener("click",function(ev){
    const btn=ev.target.closest('[data-close-impuls-modal]');
    if(!btn)return;
    ev.preventDefault();
    ev.stopPropagation();
    try{
      if(typeof window.closeModal==="function") window.closeModal();
      else if(typeof closeModal==="function") closeModal();
    }catch(err){ console.error("Impuls schließen:",err); }
  },true);
})();



/* =========================================================
   LERNRESSOURCEN – BEARBEITEN
   Ergänzt das bestehende Lernressourcen-Modul, ohne dessen
   Erstellen-/Anzeigen-Funktion zu ersetzen.
   ========================================================= */
(function(){
  if(window.__LernressourcenEditInstalled)return;
  window.__LernressourcenEditInstalled=true;

  const resourceCollections=["resources","lernressourcen"];

  async function getResourceDocs(){
    const fb=window.CampusFirebase;
    if(!fb?.db)return [];
    for(const name of resourceCollections){
      try{
        const snap=await fb.getDocs(fb.collection(fb.db,name));
        if(!snap.empty)return snap.docs.map(d=>({id:d.id,collection:name,data:d.data()}));
      }catch(e){ console.warn("Lernressourcen lesen:",name,e); }
    }
    return [];
  }

  function displayValue(v){
    if(v==null)return "";
    if(Array.isArray(v))return v.join(", ");
    if(typeof v==="object")return JSON.stringify(v);
    return String(v);
  }

  function escEdit(v){
    return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
  }

  window.editLernressource=async function(id,collectionName){
    if(!window.CampusFirebase?.currentUser)return;
    const profile=window.CampusFirebase.currentUser;
    const docs=await getResourceDocs();
    const item=docs.find(x=>x.id===id && (!collectionName||x.collection===collectionName));
    if(!item){toast("Lernressource wurde nicht gefunden.");return;}

    let data=item.data||{};
    const editableKeys=Object.keys(data).filter(k=>![
      "createdAt","updatedAt","createdBy","createdByName","uid","ownerId"
    ].includes(k));

    const preferred=["title","name","description","text","url","link","type","category","subject","tags"];
    const keys=[...preferred.filter(k=>editableKeys.includes(k)),...editableKeys.filter(k=>!preferred.includes(k))];

    const fields=keys.map(k=>{
      const val=displayValue(data[k]);
      const label=k.replace(/([A-Z])/g," $1").replace(/^./,s=>s.toUpperCase());
      const multi=String(val).length>90||k.toLowerCase().includes("description")||k.toLowerCase().includes("text");
      return `<label>${escEdit(label)}<textarea data-resource-field="${escEdit(k)}" rows="${multi?4:2}">${escEdit(val)}</textarea></label>`;
    }).join("");

    modal(`<button class="modal-close" type="button" onclick="closeModal()">×</button>
      <div class="kicker">LERNRESSOURCE</div>
      <h2>Lernressource bearbeiten</h2>
      <p>Ändere die Angaben und speichere anschließend.</p>
      <div class="form" id="editResourceForm">${fields||"<p>Für diese Ressource sind keine bearbeitbaren Felder vorhanden.</p>"}
        <div class="form-actions">
          <button class="secondary" type="button" onclick="closeModal()">Abbrechen</button>
          <button class="primary" type="button" id="saveResourceEdit">Änderungen speichern</button>
        </div>
      </div>`);

    const save=document.getElementById("saveResourceEdit");
    if(save)save.addEventListener("click",async()=>{
      const updates={updatedAt:fb.serverTimestamp()};
      document.querySelectorAll("[data-resource-field]").forEach(el=>{
        const key=el.getAttribute("data-resource-field");
        let value=el.value;
        const original=data[key];
        if(Array.isArray(original))value=value.split(",").map(s=>s.trim()).filter(Boolean);
        updates[key]=value;
      });
      save.disabled=true;save.textContent="Speichert …";
      try{
        await fb.updateDoc(fb.doc(fb.db,item.collection,item.id),updates);
        closeModal();toast("Lernressource wurde geändert.");
        await render();
      }catch(e){
        console.error("Lernressource bearbeiten:",e);
        save.disabled=false;save.textContent="Änderungen speichern";
        toast(e?.code==="permission-denied"
          ?"Die Firebase-Regeln erlauben das Bearbeiten dieser Ressource nicht."
          :"Änderungen konnten nicht gespeichert werden.");
      }
    });
  };

  async function addEditButtons(){
    if(!(typeof isTeacher==="function" && isTeacher()))return;
    const cards=[...document.querySelectorAll(".resource-card")];
    if(!cards.length)return;
    const docs=await getResourceDocs();
    if(!docs.length)return;

    cards.forEach(card=>{
      if(card.querySelector(".resource-edit-btn"))return;
      const titleEl=card.querySelector("h3,h2,strong");
      const title=titleEl?.textContent?.trim();
      if(!title)return;

      const item=docs.find(x=>{
        const d=x.data||{};
        return String(d.title??d.name??"").trim()===title;
      });
      if(!item)return;

      const btn=document.createElement("button");
      btn.type="button";
      btn.className="secondary resource-edit-btn";
      btn.textContent="✏️ Bearbeiten";
      btn.style.marginTop="8px";
      btn.addEventListener("click",e=>{
        e.preventDefault();e.stopPropagation();
        window.editLernressource(item.id,item.collection);
      });
      card.appendChild(btn);
    });
  }

  // Observe the app because Lernressourcen is a dynamically loaded module.
  const observer=new MutationObserver(()=>setTimeout(addEditButtons,80));
  observer.observe(document.body,{childList:true,subtree:true});
  setTimeout(addEditButtons,300);
})();

