// Campusklasse 26/27 – AUTH DEBUG VERSION – bitte nur für den Login-Test verwenden
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

/* ============================================================
   LERNWERKSTATT – PP11 Kompetenz-Selbsteinschätzung
   LehrplanPLUS FOS 11 Pädagogik/Psychologie, gültig ab 2026/27
   Quelle: https://www.lehrplanplus.bayern.de/fachlehrplan/fos/11/paedagigik-psychologie/s_gueltig_ab_26_27
   ============================================================ */

const PP11_COMPETENCIES = [
  {
    id:"lb1", title:"Lernbereich 1", short:"Wissenschaft verstehen",
    description:"Wesenszüge wissenschaftlicher Pädagogik und Psychologie begreifen.",
    sections:[
      {id:"lb1-gegenstand", title:"Pädagogik und Psychologie", items:[
        ["lb1-1","Ich kann den Gegenstandsbereich der Psychologie mit Erleben und Verhalten erklären."],
        ["lb1-2","Ich kann den Gegenstandsbereich der Pädagogik als Erziehungswissenschaft und -praxis erklären."],
        ["lb1-3","Ich kann Ziele und Handlungen der Erziehung an einem Beispiel erläutern."],
        ["lb1-4","Ich kann die Beziehung zwischen Erziehenden und Zu-Erziehenden an einer Situation verdeutlichen."],
        ["lb1-5","Ich kann an einem konkreten Beispiel erklären, wie Pädagogik und Psychologie zusammenwirken."]
      ]},
      {id:"lb1-wissenschaft", title:"Wissenschaftliche Aussagen", items:[
        ["lb1-6","Ich kann erklären, was eine wissenschaftliche Aussage auszeichnet."],
        ["lb1-7","Ich kann systematische Gewinnung, Überprüfbarkeit, Allgemeingültigkeit und Objektivität erklären."],
        ["lb1-8","Ich kann wissenschaftliche von alltagspsychologischen Aussagen unterscheiden."],
        ["lb1-9","Ich kann erklären, warum eine subjektive Einzelerfahrung nicht automatisch allgemeingültig ist."]
      ]},
      {id:"lb1-experiment", title:"Experiment als Methode", items:[
        ["lb1-10","Ich kann erklären, wie ein Experiment zur systematischen Erkenntnisgewinnung beiträgt."],
        ["lb1-11","Ich kann Willkürlichkeit, Variierbarkeit und Wiederholbarkeit eines Experiments erklären."],
        ["lb1-12","Ich kann an einem ausgewählten Experiment die methodische Vorgehensweise erläutern."]
      ]}
    ]
  },
  {
    id:"lb2", title:"Lernbereich 2", short:"Erleben & Verhalten",
    description:"Grundlagen des Erlebens und Verhaltens analysieren, verstehen und anwenden.",
    sections:[
      {id:"lb2-wahrnehmung", title:"Wahrnehmung", items:[
        ["lb2-1","Ich kann den Wahrnehmungsprozess mit Reizaufnahme, Weiterleitung, Verarbeitung, Bewertung/Empfindung und Reaktion erklären."],
        ["lb2-2","Ich kann den Wahrnehmungsprozess an einem Beispiel aus meinem Lebensbereich erläutern."],
        ["lb2-3","Ich kann erklären, warum Wahrnehmung eine subjektive Konstruktion der Wirklichkeit ist."],
        ["lb2-4","Ich kann individuelle Einflussfaktoren auf Wahrnehmung erklären."],
        ["lb2-5","Ich kann soziale Einflussfaktoren auf Wahrnehmung erklären."],
        ["lb2-6","Ich kann eine konkrete Wahrnehmungssituation unter Berücksichtigung individueller und sozialer Faktoren analysieren."]
      ]},
      {id:"lb2-gedaechtnis", title:"Gedächtnis", items:[
        ["lb2-7","Ich kann das Mehrspeicher-Modell des Gedächtnisses erklären."],
        ["lb2-8","Ich kann Ultrakurzzeit-, Kurzzeit- und Langzeitgedächtnis unterscheiden."],
        ["lb2-9","Ich kann die Bedeutung von Kontrollprozessen wie Organisation und Elaboration erklären."],
        ["lb2-10","Ich kann verschiedene Speichersysteme des Langzeitgedächtnisses unterscheiden."],
        ["lb2-11","Ich kann deklarative und nicht-deklarative Gedächtnissysteme unterscheiden."],
        ["lb2-12","Ich kann Gedächtnisprozesse an Beispielen aus Schule oder Beruf erklären."]
      ]},
      {id:"lb2-lernen", title:"Lernstrategien", items:[
        ["lb2-13","Ich kann auf Grundlage der Gedächtnisforschung geeignete Lernstrategien auswählen."],
        ["lb2-14","Ich kann eine Mindmap sinnvoll für meinen eigenen Wissenserwerb einsetzen."],
        ["lb2-15","Ich kann Karteikarten sinnvoll für meinen eigenen Wissenserwerb einsetzen."],
        ["lb2-16","Ich kann digitale Hilfsmittel gezielt zur Unterstützung meines Lernens einsetzen."]
      ]},
      {id:"lb2-emotion", title:"Emotion", items:[
        ["lb2-17","Ich kann erklären, was eine Emotion ist und welche Komponenten sie umfasst."],
        ["lb2-18","Ich kann die Komponenten einer ausgewählten Emotion an einem Beispiel verdeutlichen."],
        ["lb2-19","Ich kann eine Situation im Hinblick auf Emotionen analysieren."],
        ["lb2-20","Ich kann eine antezedenzfokussierte Strategie zur Emotionsregulation erklären und anwenden."],
        ["lb2-21","Ich kann eine reaktionsfokussierte Strategie zur Emotionsregulation erklären und anwenden."]
      ]},
      {id:"lb2-motivation", title:"Motivation", items:[
        ["lb2-22","Ich kann den Begriff Motivation und seine wesentlichen Merkmale erklären."],
        ["lb2-23","Ich kann den Prozesscharakter von Motivation an einem Beispiel verdeutlichen."],
        ["lb2-24","Ich kann meine eigene Motivation anhand einer konkreten Situation analysieren."],
        ["lb2-25","Ich kann die Motivation einer anderen Person anhand einer Situation analysieren."]
      ]},
      {id:"lb2-weiner", title:"Attributionstheorie nach Weiner", items:[
        ["lb2-26","Ich kann die Attributionstheorie nach Weiner erklären."],
        ["lb2-27","Ich kann ergebnis- und attributionsabhängige Emotionen an Beispielen erklären."],
        ["lb2-28","Ich kann Ursachen den Dimensionen internal/external und stabil/variabel zuordnen."],
        ["lb2-29","Ich kann erklären, wie Attributionen die Erfolgserwartung beeinflussen."],
        ["lb2-30","Ich kann erklären, wie Attributionen Motivation beeinflussen."],
        ["lb2-31","Ich kann aus einer konkreten Attribution sinnvolle Konsequenzen für eigene oder fremde Motivation ableiten."]
      ]}
    ]
  },
  {
    id:"lb3", title:"Lernbereich 3", short:"Erziehung gestalten",
    description:"Erziehungsprozesse individuumsbezogen und kompetenzorientiert gestalten.",
    sections:[
      {id:"lb3-erziehung", title:"Merkmale von Erziehung", items:[
        ["lb3-1","Ich kann Merkmale von Erziehung erklären."],
        ["lb3-2","Ich kann beabsichtigte Lernhilfe als Merkmal von Erziehung erklären."],
        ["lb3-3","Ich kann die Bedeutung sozialer Kommunikation und Interaktion für Erziehung erklären."],
        ["lb3-4","Ich kann eine Situation aus Praktikum oder Berufsalltag hinsichtlich ihrer Erziehungsmerkmale analysieren."]
      ]},
      {id:"lb3-muendigkeit", title:"Mündigkeit nach Roth", items:[
        ["lb3-5","Ich kann Mündigkeit als Kompetenz im dreifachen Sinn erklären."],
        ["lb3-6","Ich kann Selbstkompetenz erklären und an einem Beispiel verdeutlichen."],
        ["lb3-7","Ich kann Sachkompetenz erklären und an einem Beispiel verdeutlichen."],
        ["lb3-8","Ich kann Sozialkompetenz erklären und an einem Beispiel verdeutlichen."],
        ["lb3-9","Ich kann geeignete Erziehungsmaßnahmen zur Förderung von Selbst-, Sach- und Sozialkompetenz entwickeln."]
      ]},
      {id:"lb3-stile", title:"Erziehungsstile nach Baumrind", items:[
        ["lb3-10","Ich kann die vier Erziehungsstile nach Baumrind nennen und beschreiben."],
        ["lb3-11","Ich kann autoritativ, autoritär, permissiv und vernachlässigend unterscheiden."],
        ["lb3-12","Ich kann einen Erziehungsstil in einer Alltags- oder Berufssituation erkennen."],
        ["lb3-13","Ich kann meine Zuordnung zu einem Erziehungsstil begründen."],
        ["lb3-14","Ich kann Konsequenzen eines Erziehungsstils für pädagogisches Handeln ableiten."]
      ]},
      {id:"lb3-baybep", title:"Frühe Bildung und BayBEP", items:[
        ["lb3-15","Ich kann die Bedeutung früher Bildung und Erziehung erklären."],
        ["lb3-16","Ich kann themenbezogene Bildungs- und Erziehungsbereiche des BayBEP benennen."],
        ["lb3-17","Ich kann Möglichkeiten zur Förderung digitaler Medien und Technologien entwickeln."],
        ["lb3-18","Ich kann Möglichkeiten zur Förderung von Umwelt und Gesundheit entwickeln."],
        ["lb3-19","Ich kann an einem Beispiel zeigen, wie Bildungs- und Erziehungsbereiche im pädagogischen Alltag umgesetzt werden können."]
      ]}
    ]
  },
  {
    id:"lb4", title:"Lernbereich 4", short:"Lernen verstehen",
    description:"Lernen als multidimensionalen und steuerbaren Prozess verstehen.",
    sections:[
      {id:"lb4-begriff", title:"Begriff Lernen", items:[
        ["lb4-1","Ich kann die Merkmale des Begriffs Lernen erklären."],
        ["lb4-2","Ich kann Verhaltensaufbau und Verhaltensänderung als Bestandteile von Lernen erklären."],
        ["lb4-3","Ich kann erklären, was mit relativ dauerhafter Veränderung gemeint ist."],
        ["lb4-4","Ich kann erklären, warum Reifung nicht als Lernen bezeichnet wird."],
        ["lb4-5","Ich kann die Bedeutung von Erfahrung und Übung für Lernen erklären."],
        ["lb4-6","Ich kann erklären, warum Lernen nicht direkt beobachtbar ist."],
        ["lb4-7","Ich kann an einem Beispiel begründen, ob eine Veränderung als Lernen bezeichnet werden kann."]
      ]},
      {id:"lb4-klassisch", title:"Klassisches Konditionieren nach Pawlow", items:[
        ["lb4-8","Ich kann die Grundidee des klassischen Konditionierens erklären."],
        ["lb4-9","Ich kann den Konditionierungsprozess nach Pawlow beschreiben."],
        ["lb4-10","Ich kann relevante Begriffe des klassischen Konditionierens sicher verwenden."],
        ["lb4-11","Ich kann klassisches Konditionieren in einer Alltags- oder Berufssituation erkennen und erklären."],
        ["lb4-12","Ich kann Reizgeneralisierung erklären und an einem Beispiel erkennen."],
        ["lb4-13","Ich kann Konditionierung höherer Ordnung erklären und an einem Beispiel erkennen."],
        ["lb4-14","Ich kann Konsequenzen des klassischen Konditionierens für pädagogisches Handeln ableiten."]
      ]},
      {id:"lb4-operant", title:"Operantes Konditionieren nach Thorndike und Skinner", items:[
        ["lb4-15","Ich kann die Grundidee des operanten Konditionierens erklären."],
        ["lb4-16","Ich kann die Lerngesetze nach Thorndike erklären."],
        ["lb4-17","Ich kann erklären, wie Lernen durch Verstärkung funktioniert."],
        ["lb4-18","Ich kann verschiedene Verstärkerarten unterscheiden."],
        ["lb4-19","Ich kann erklären, warum Verstärker relativ sind."],
        ["lb4-20","Ich kann einen konkreten Fall mithilfe des operanten Konditionierens analysieren."],
        ["lb4-21","Ich kann Konsequenzen des operanten Konditionierens für pädagogisches Handeln ableiten."]
      ]},
      {id:"lb4-bandura", title:"Sozial-kognitive Theorie nach Bandura", items:[
        ["lb4-22","Ich kann die Grundidee der sozial-kognitiven Theorie nach Bandura erklären."],
        ["lb4-23","Ich kann erklären, wie Menschen durch Beobachtung anderer lernen."],
        ["lb4-24","Ich kann die Aufmerksamkeitsprozesse und Bedingungen der Aufmerksamkeit erklären."],
        ["lb4-25","Ich kann die Gedächtnisprozesse beim Beobachtungslernen erklären."],
        ["lb4-26","Ich kann die motorischen Reproduktionsprozesse erklären."],
        ["lb4-27","Ich kann die Motivationsprozesse einschließlich Erwartungshaltungen und Formen der Bekräftigung erklären."],
        ["lb4-28","Ich kann einen konkreten Fall mithilfe der sozial-kognitiven Theorie analysieren."],
        ["lb4-29","Ich kann Konsequenzen der Theorie für pädagogisches Handeln ableiten."]
      ]},
      {id:"lb4-medien", title:"Medien und Lernen", items:[
        ["lb4-30","Ich kann positive Einflüsse von Medien auf Lernprozesse anhand einer Lerntheorie erklären."],
        ["lb4-31","Ich kann negative Einflüsse von Medien auf Lernprozesse anhand einer Lerntheorie erklären."],
        ["lb4-32","Ich kann eine konkrete Mediennutzung mithilfe einer Lerntheorie analysieren."],
        ["lb4-33","Ich kann Möglichkeiten für einen kompetenten Umgang mit medialen Einflüssen entwickeln."]
      ]}
    ]
  }
];

const PP11_RATING = {
  4:{label:"Auf Kurs", status:"green", hint:"Ich kann es selbstständig erklären und anwenden."},
  3:{label:"Klärungsbedarf", status:"yellow", hint:"Ich kann es grundsätzlich, bin aber noch unsicher."},
  2:{label:"Klärungsbedarf", status:"yellow", hint:"Ich kenne Grundzüge, brauche aber noch Übung oder Erklärung."},
  1:{label:"Handlungsbedarf", status:"red", hint:"Ich kann es noch nicht ausreichend erklären oder anwenden."}
};

function pp11AllItems(){
  return PP11_COMPETENCIES.flatMap(a=>a.sections.flatMap(s=>s.items.map(i=>({id:i[0],text:i[1],areaId:a.id,areaTitle:a.title,sectionId:s.id,sectionTitle:s.title}))));
}
function pp11StatusFromRating(v){
  return PP11_RATING[Number(v)]?.status || "red";
}
function pp11RatingLabel(v){
  return PP11_RATING[Number(v)]?.label || "Noch offen";
}
function pp11InjectStyles(){
  if($("pp11Styles")) return;
  const style=document.createElement("style");
  style.id="pp11Styles";
  style.textContent=`
    .pp11-hero{background:linear-gradient(135deg,var(--card),var(--soft-green));border:1px solid var(--line);border-radius:22px;padding:22px;margin-bottom:14px}
    .pp11-legend{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}
    .pp11-legend span{font-size:12px;padding:7px 10px;border-radius:999px;background:var(--bg);border:1px solid var(--line)}
    .pp11-area{overflow:hidden}
    .pp11-area-head{display:flex;align-items:center;justify-content:space-between;gap:12px;cursor:pointer}
    .pp11-area-head .area-title{display:flex;align-items:center;gap:10px}
    .pp11-area-head .area-title b{font-size:17px}
    .pp11-area-head .area-title small{display:block;color:var(--muted);font-weight:400;margin-top:3px}
    .pp11-summary{display:flex;gap:6px;flex-wrap:wrap}
    .pp11-summary .pill{font-size:11px}
    .pp11-section{margin-top:12px;border-top:1px solid var(--line);padding-top:12px}
    .pp11-section h4{margin:0 0 8px}
    .pp11-item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;padding:13px 0;border-bottom:1px solid var(--line)}
    .pp11-item:last-child{border-bottom:0}
    .pp11-item-text{font-size:14px;line-height:1.45}
    .pp11-rating{display:flex;gap:5px;white-space:nowrap}
    .pp11-rating button{border:1px solid var(--line);background:var(--bg);border-radius:10px;padding:8px 9px;cursor:pointer;font-weight:700}
    .pp11-rating button.active.green{background:#dff4e6;border-color:#74bd8a}
    .pp11-rating button.active.yellow{background:#fff3cc;border-color:#e4bd54}
    .pp11-rating button.active.red{background:#ffe1df;border-color:#dc7b74}
    .pp11-rating button:hover{transform:translateY(-1px)}
    .pp11-filter{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0}
    .pp11-filter button.active{background:var(--ink);color:white}
    .pp11-progress{height:9px;background:var(--bg);border-radius:999px;overflow:hidden;border:1px solid var(--line)}
    .pp11-progress i{display:block;height:100%;background:var(--ink);border-radius:999px}
    .pp11-focus{background:var(--soft-green);border:1px solid var(--line)}
    .pp11-teacher-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
    .pp11-teacher-card{border:1px solid var(--line);border-radius:14px;padding:12px;background:var(--card)}
    @media(max-width:760px){
      .pp11-item{grid-template-columns:1fr}
      .pp11-rating{width:100%}
      .pp11-rating button{flex:1}
      .pp11-teacher-grid{grid-template-columns:1fr}
    }
  `;
  document.head.appendChild(style);
}
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


$("loginForm").addEventListener("submit", async e => {
  e.preventDefault();

  const errorBox = $("authError");
  errorBox.hidden = false;
  errorBox.innerHTML = "<strong>1. Klick erkannt.</strong>";
  console.log("AUTH TEST 1: submit erkannt");

  const email = $("loginEmail").value.trim();
  const password = $("loginPassword").value;

  if (!email || !password) {
    errorBox.innerHTML = "<strong>TEST STOPP:</strong> Bitte E-Mail und Passwort eingeben.";
    return;
  }

  errorBox.innerHTML = "<strong>2. Firebase wird geladen …</strong>";
  console.log("AUTH TEST 2: loadFirebase");

  try {
    await loadFirebase();
    errorBox.innerHTML = "<strong>3. Firebase geladen.</strong><br>Jetzt wird angemeldet …";
    console.log("AUTH TEST 3: Firebase geladen");

    const cred = await signInWithEmailAndPassword(auth, email, password);

    console.log("AUTH TEST 4: LOGIN ERFOLGREICH", cred.user.uid);
    errorBox.innerHTML =
      "<strong style='color:green'>4. LOGIN ERFOLGREICH!</strong><br>" +
      "Benutzer: " + esc(cred.user.email || email);

    currentUser = cred.user;

    try {
      await ensureProfile(cred.user);
      errorBox.innerHTML += "<br>Profil erfolgreich geladen.";
    } catch (profileError) {
      console.error("AUTH TEST Profilfehler:", profileError);
      errorBox.innerHTML +=
        "<br><strong>Profilfehler:</strong> " +
        esc(profileError?.code || profileError?.message || String(profileError));
    }

    setTimeout(() => {
      try { showApp(); } catch (e) { console.error(e); }
    }, 500);

  } catch (err) {
    console.error("AUTH TEST FEHLER:", err);
    errorBox.innerHTML =
      "<strong style='color:red'>LOGIN FEHLGESCHLAGEN</strong><br>" +
      "Firebase-Code: <code>" + esc(err?.code || "unbekannt") + "</code><br>" +
      "Meldung: " + esc(err?.message || String(err));
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

async function getPP11Assessments(){
  const q=query(collection(db,"selfAssessments"),where("uid","==",currentUser.uid));
  const snap=await getDocs(q);
  const result={};
  snap.docs.forEach(d=>{const x=d.data(); result[x.competencyId]=Number(x.rating||0)});
  return result;
}

async function savePP11Assessment(competencyId,rating){
  try{
    const ref=doc(db,"selfAssessments",`${currentUser.uid}_${competencyId}`);
    await setDoc(ref,{
      uid:currentUser.uid,
      competencyId,
      rating:Number(rating),
      status:pp11StatusFromRating(rating),
      updatedAt:serverTimestamp()
    },{merge:true});
    toast("Selbsteinschätzung gespeichert.");
    await render();
  }catch(e){
    console.error("PP11 Selbsteinschätzung:",e);
    toast("Speichern nicht möglich. Prüfe die Firestore-Regeln.");
  }
}
window.savePP11Assessment=savePP11Assessment;

function pp11AreaSummary(items,assessments){
  const vals=items.map(x=>assessments[x.id]).filter(Boolean);
  const green=vals.filter(v=>v===4).length;
  const yellow=vals.filter(v=>v===2||v===3).length;
  const red=vals.filter(v=>v===1).length;
  return {total:items.length,answered:vals.length,green,yellow,red};
}

function pp11AreaCard(area,assessments){
  const items=area.sections.flatMap(s=>s.items.map(i=>({id:i[0],text:i[1]})));
  const sum=pp11AreaSummary(items,assessments);
  const percent=sum.total?Math.round(sum.answered/sum.total*100):0;
  return `<div class="card pp11-area">
    <div class="pp11-area-head" onclick="this.parentElement.classList.toggle('open')">
      <div class="area-title">
        <span class="emoji">${area.id==="lb1"?"🔬":area.id==="lb2"?"🧠":area.id==="lb3"?"🤝":"📚"}</span>
        <div><b>${esc(area.title)} · ${esc(area.short)}</b><small>${esc(area.description)}</small></div>
      </div>
      <div class="pp11-summary">
        <span class="pill green">🟢 ${sum.green}</span>
        <span class="pill">🟡 ${sum.yellow}</span>
        <span class="pill">🔴 ${sum.red}</span>
        <span class="pill">${sum.answered}/${sum.total}</span>
      </div>
    </div>
    <div style="margin-top:12px" class="pp11-progress"><i style="width:${percent}%"></i></div>
    <div class="pp11-sections">
      ${area.sections.map(sec=>`<div class="pp11-section"><h4>${esc(sec.title)}</h4>
        ${sec.items.map(i=>{
          const val=assessments[i[0]]||0, status=pp11StatusFromRating(val);
          return `<div class="pp11-item">
            <div class="pp11-item-text">${esc(i[1])}</div>
            <div class="pp11-rating" aria-label="Selbsteinschätzung">
              ${[4,3,2,1].map(v=>`<button class="${val===v?"active ":""}${pp11StatusFromRating(v)}" title="${esc(PP11_RATING[v].hint)}" onclick="event.stopPropagation();savePP11Assessment('${i[0]}',${v})">${v}</button>`).join("")}
            </div>
          </div>`;
        }).join("")}
      </div>`).join("")}
    </div>
  </div>`;
}

async function renderPP11TeacherOverview(){
  if(!isTeacher()) return "";
  try{
    const snap=await getDocs(collection(db,"selfAssessments"));
    const all=snap.docs.map(d=>d.data());
    const byId={};
    all.forEach(x=>{byId[x.competencyId]??=[];byId[x.competencyId].push(Number(x.rating||0))});
    const items=pp11AllItems();
    const weak=items.map(i=>{
      const vals=byId[i.id]||[];
      const avg=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0;
      return {...i,avg,n:vals.length};
    }).filter(x=>x.n).sort((a,b)=>a.avg-b.avg).slice(0,8);
    return `<div class="card pp11-focus" style="margin-top:12px">
      <h3>👩‍🏫 Lehrkraftblick · häufigster Lernbedarf</h3>
      <p>Aggregierte Übersicht über abgegebene Selbsteinschätzungen. Es werden hier keine Namen angezeigt.</p>
      <div class="pp11-teacher-grid">
        ${weak.map(x=>`<div class="pp11-teacher-card">
          <small>${esc(x.areaTitle)} · ${esc(x.sectionTitle)}</small>
          <strong style="display:block;margin-top:5px">${esc(x.text)}</strong>
          <span class="pill ${x.avg>=3.5?"green":x.avg>=2?"":"red"}" style="display:inline-block;margin-top:8px">Ø ${x.avg.toFixed(1)} · ${x.n} Einschätzungen</span>
        </div>`).join("") || `<div class="empty">Noch keine Selbsteinschätzungen vorhanden.</div>`}
      </div>
    </div>`;
  }catch(e){
    console.error("PP11 Lehrerübersicht:",e);
    return "";
  }
}

async function renderLernwerkstatt(){
  pp11InjectStyles();
  const assessments=await getPP11Assessments();
  const items=pp11AllItems();
  const answered=items.filter(i=>assessments[i.id]).length;
  const green=items.filter(i=>assessments[i.id]===4).length;
  const yellow=items.filter(i=>assessments[i.id]===2||assessments[i.id]===3).length;
  const red=items.filter(i=>assessments[i.id]===1).length;
  const focus=items.filter(i=>assessments[i.id]===1).slice(0,3);
  const percent=items.length?Math.round(answered/items.length*100):0;

  return `${pageHead("SELBSTSTÄNDIG LERNEN","Lernwerkstatt","Deine Lernwerkstatt verbindet Lehrplan-Kompetenzen, Selbsteinschätzung und gezielten Lernbedarf.",`<button class="primary" onclick="document.querySelector('.pp11-focus')?.scrollIntoView({behavior:'smooth'})">🎯 Mein Lernbedarf</button>`)}
  <div class="pp11-hero">
    <div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap">
      <div>
        <span class="badge">PP 11 · LEHRPLAN 2026/27</span>
        <h2 style="margin:9px 0 5px">Wo stehe ich?</h2>
        <p style="margin:0;max-width:720px">Schätze jede Kompetenz ehrlich ein. Die Selbsteinschätzung zeigt dir, was schon sitzt und wo du gezielt weiterlernen solltest.</p>
      </div>
      <div class="card" style="min-width:180px;padding:14px">
        <small>Bearbeitungsstand</small>
        <strong style="font-size:24px;display:block">${answered}/${items.length}</strong>
        <div class="pp11-progress" style="margin-top:8px"><i style="width:${percent}%"></i></div>
      </div>
    </div>
    <div class="pp11-legend">
      <span>🟢 <b>4 – Auf Kurs</b> · sicher</span>
      <span>🟡 <b>3/2 – Klärungsbedarf</b> · unsicher</span>
      <span>🔴 <b>1 – Handlungsbedarf</b> · noch nicht sicher</span>
    </div>
  </div>

  <div class="grid grid-3">
    <div class="card stat"><b>${green}</b><span>🟢 Auf Kurs</span></div>
    <div class="card stat"><b>${yellow}</b><span>🟡 Klärungsbedarf</span></div>
    <div class="card stat"><b>${red}</b><span>🔴 Handlungsbedarf</span></div>
  </div>

  <div class="card pp11-focus" style="margin-top:12px">
    <h3>🎯 Dein aktueller Lernfokus</h3>
    ${focus.length
      ? `<p>Diese Kompetenzen hast du als <b>Handlungsbedarf</b> markiert:</p>
         <div class="list">${focus.map(x=>`<div class="list-item"><div><strong>${esc(x.text)}</strong><small>${esc(x.areaTitle)} · ${esc(x.sectionTitle)}</small></div><span class="pill">Lernen</span></div>`).join("")}</div>`
      : answered===0
        ? `<p>Beginne mit einer Selbsteinschätzung. Danach wird dein persönlicher Lernfokus automatisch sichtbar.</p>`
        : `<p>Aktuell hast du keine Kompetenz mit Handlungsbedarf markiert. Sehr gut – arbeite an deinen gelben Bereichen weiter und überprüfe sie später erneut.</p>`}
  </div>

  <div style="margin-top:12px" class="list">
    ${PP11_COMPETENCIES.map(a=>pp11AreaCard(a,assessments)).join("")}
  </div>

  ${await renderPP11TeacherOverview()}
  <div class="notice" style="margin-top:12px"><b>Hinweis:</b> Die Selbsteinschätzung ist eine Lernhilfe und ersetzt keine Leistungsfeststellung. Eine Kompetenz gilt erst dann als wirklich gefestigt, wenn du sie auch erklären und auf neue Situationen anwenden kannst.</div>
  ${footer()}`;
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
