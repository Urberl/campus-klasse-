/* CAMPUSKLASSE – modules/lernressourcen.js
   Eigenständiges Modul: Lernressourcen-Bibliothek
   Arbeitet zunächst ausschließlich mit Links, ohne Firebase Storage.
*/
const TYPES={
  taskcard:{icon:"🎴",label:"TaskCard"},
  ki:{icon:"🤖",label:"KI-Lernressource"},
  external:{icon:"🔗",label:"Externer Link"},
  video:{icon:"🎬",label:"Video-Link"},
  bycs:{icon:"📚",label:"ByCS / mebis"},
  website:{icon:"🌐",label:"Webseite"}
};

const escLR=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const $lr=id=>document.getElementById(id);
const typeLR=t=>TYPES[t]||{icon:"🔗",label:"Lernressource"};
const normalizeLR=u=>{const x=String(u||"").trim();return x?(/^https?:\/\//i.test(x)?x:"https://"+x):""};

function ctx(){
  const c=window.CampusFirebase;
  if(!c) throw new Error("CampusFirebase ist noch nicht bereit.");
  return c;
}

export async function loadLernressourcen(){
  const c=ctx();
  try{
    const q=c.query(c.collection(c.db,"lernressourcen"),c.orderBy("createdAt","desc"),c.limit(100));
    const snap=await c.getDocs(q);
    return snap.docs.map(d=>({id:d.id,...d.data()}));
  }catch(e){
    console.warn("Lernressourcen-Sortierung nicht verfügbar, Fallback:",e);
    const snap=await c.getDocs(c.collection(c.db,"lernressourcen"));
    return snap.docs.map(d=>({id:d.id,...d.data()}));
  }
}

function card(r){
  const t=typeLR(r.type),tags=Array.isArray(r.tags)?r.tags:[];
  return `<article class="card resource-card">
    <div class="resource-head"><span class="resource-icon">${t.icon}</span><span class="pill">${t.label}</span></div>
    <h3>${escLR(r.title||"Lernressource")}</h3>
    ${r.description?`<p>${escLR(r.description)}</p>`:""}
    ${r.subject?`<div class="resource-meta">📘 ${escLR(r.subject)}</div>`:""}
    ${tags.length?`<div class="chips">${tags.map(x=>`<span class="chip">#${escLR(x)}</span>`).join("")}</div>`:""}
    <button class="primary resource-open" onclick="window.openLernressource('${encodeURIComponent(r.url||"")}')">${t.icon} Lernressource öffnen →</button>
  </article>`;
}

export function openLernressource(encoded){
  const url=normalizeLR(decodeURIComponent(encoded||""));
  if(url) window.open(url,"_blank","noopener,noreferrer");
}

export function openLernressourceForm(){
  const c=ctx();
  c.modal(`<button class="modal-close" onclick="closeModal()">×</button>
    <div class="kicker">LERNWERKSTATT</div><h2>＋ Lernressource hinzufügen</h2>
    <p class="muted">Zunächst speichern wir Links. Dateien wie PDF, MP3 oder MP4 können später über Firebase Storage ergänzt werden.</p>
    <div class="form">
      <label>Art<select id="lrType">
        <option value="taskcard">🎴 TaskCard</option><option value="ki">🤖 KI-Lernressource</option>
        <option value="external">🔗 Externer Link</option><option value="video">🎬 Video-Link</option>
        <option value="bycs">📚 ByCS / mebis</option><option value="website">🌐 Webseite</option>
      </select></label>
      <label>Titel<input id="lrTitle" placeholder="z. B. Soziale Identität – Lernstation"></label>
      <label>Beschreibung<textarea id="lrDescription" rows="3" placeholder="Was bietet diese Lernressource?"></textarea></label>
      <label>Fach / Lernbereich<input id="lrSubject" placeholder="z. B. Pädagogik & Psychologie 11"></label>
      <label>Link<input id="lrUrl" type="url" placeholder="https://..."></label>
      <label>Schlagworte<input id="lrTags" placeholder="z. B. PPF11, Üben, Fallbeispiel"></label>
      <div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="window.saveLernressource()">Speichern</button></div>
      <div id="lrError" class="notice" style="display:none;margin-top:10px"></div>
    </div>`);
}

export async function saveLernressource(){
  const c=ctx();
  const title=$lr("lrTitle")?.value.trim()||"", type=$lr("lrType")?.value||"external";
  const url=normalizeLR($lr("lrUrl")?.value||""), subject=$lr("lrSubject")?.value.trim()||"";
  const description=$lr("lrDescription")?.value.trim()||"";
  const tags=($lr("lrTags")?.value||"").split(",").map(x=>x.trim()).filter(Boolean);
  const err=$lr("lrError");
  if(!title||!url){if(err){err.textContent="Bitte Titel und Link eingeben.";err.style.display="block"}return}
  try{
    await c.addDoc(c.collection(c.db,"lernressourcen"),{uid:c.currentUser.uid,title,type,url,subject,description,tags,createdAt:c.serverTimestamp()});
    closeModal();c.toast("Lernressource gespeichert.");await c.render();
  }catch(e){
    console.error("Lernressource speichern:",e);
    if(err){err.textContent="Speichern nicht möglich. Bitte Firestore-Regeln für „lernressourcen“ prüfen.";err.style.display="block"}
  }
}

export async function renderRessourcen(){
  const resources=await loadLernressourcen();
  const grouped={taskcard:[],ki:[],external:[],video:[],bycs:[],website:[]};
  resources.forEach(r=>(grouped[r.type]||grouped.external).push(r));
  return `${ctx().pageHead("LERNWERKSTATT","Lernressourcen-Bibliothek","Finde passende Lernmaterialien, digitale Angebote und externe Lernwege – übersichtlich wie eine TaskCard-Sammlung.",`<button class="primary" onclick="window.openLernressourceForm()">＋ Lernressource</button>`)}
  <div class="card" style="background:var(--soft-green)">
    <span class="badge">📚 DEINE LERNBIBLIOTHEK</span><h2>Passende Ressource auswählen</h2>
    <p>Eine zentrale Sammlung für TaskCards, KI-Lernangebote, Videos, ByCS/mebis und weitere Webseiten.</p>
    <div class="chips"><span class="chip">🎴 TaskCard</span><span class="chip">🤖 KI</span><span class="chip">🎬 Video</span><span class="chip">📚 ByCS / mebis</span><span class="chip">🌐 Webseite</span></div>
  </div>
  ${Object.entries(grouped).map(([type,list])=>{if(!list.length)return"";const t=typeLR(type);return `<section class="resource-section"><div class="section-head"><div><div class="kicker">${t.icon} ${t.label.toUpperCase()}</div><h2>${t.label}</h2></div><span class="pill">${list.length}</span></div><div class="grid grid-3">${list.map(card).join("")}</div></section>`}).join("")}
  ${resources.length?`<div class="notice" style="margin-top:16px">💡 Tipp: Nutze Schlagworte und Fachbereiche, um deine Lernressourcen später schnell zu filtern.</div>`:`<div class="card empty" style="margin-top:12px"><strong>Noch keine Lernressourcen vorhanden.</strong><p>Lege z. B. eine TaskCard, einen fobizz-Link, ein Video oder einen ByCS-/mebis-Link an.</p><button class="primary" onclick="window.openLernressourceForm()">＋ Erste Lernressource anlegen</button></div>`}
  ${ctx().footer()}`;
}

window.openLernressource=openLernressource;
window.openLernressourceForm=openLernressourceForm;
window.saveLernressource=saveLernressource;
