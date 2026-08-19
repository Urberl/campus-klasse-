/* CAMPUSKLASSE – MODUL: PERSÖNLICHER LERNPFAD
   Modularer Bereich – ohne Firebase Storage.
   Firestore: lernpfade
*/

const LERNPFAD_STATUS={
  green:{icon:"🟢",label:"Auf Kurs"},
  yellow:{icon:"🟡",label:"Klärungsbedarf"},
  red:{icon:"🔴",label:"Handlungsbedarf"}
};

const escLP=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const $lp=id=>document.getElementById(id);
const lpCtx=()=>window.CampusFirebase;
const lpStatus=s=>LERNPFAD_STATUS[s]||LERNPFAD_STATUS.yellow;

async function loadLernpfad(){
  const c=lpCtx();
  if(!c) return [];
  try{
    const q=c.query(c.collection(c.db,"lernpfade"),c.where("uid","==",c.currentUser.uid),c.orderBy("createdAt","desc"),c.limit(50));
    const snap=await c.getDocs(q);
    return snap.docs.map(d=>({id:d.id,...d.data()}));
  }catch(e){
    console.warn("Lernpfad laden – Fallback:",e);
    try{
      const q=c.query(c.collection(c.db,"lernpfade"),c.where("uid","==",c.currentUser.uid));
      const snap=await c.getDocs(q);
      return snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
    }catch(e2){console.error("Lernpfad:",e2);return []}
  }
}

function lernpfadCard(p){
  const s=lpStatus(p.status);
  const progress=Math.max(0,Math.min(100,Number(p.progress)||0));
  return `<article class="card lernpfad-card">
    <div class="lp-card-top"><span class="pill">${s.icon} ${s.label}</span><span class="lp-progress">${progress}%</span></div>
    <h3>${escLP(p.title||"Lernziel")}</h3>
    ${p.subject?`<small>📘 ${escLP(p.subject)}</small>`:""}
    ${p.goal?`<p><b>🎯 Ziel:</b> ${escLP(p.goal)}</p>`:""}
    <div class="lp-bar"><span style="width:${progress}%"></span></div>
    ${p.next?`<p><b>🚀 Nächster Schritt:</b> ${escLP(p.next)}</p>`:""}
    ${p.help?`<p><b>🧰 Das brauche ich noch:</b> ${escLP(p.help)}</p>`:""}
    <div class="lp-actions">
      <button class="secondary" onclick='window.editLernpfad("${p.id}")'>✏️ Aktualisieren</button>
    </div>
  </article>`;
}

export function openLernpfadForm(existing=null){
  const p=existing||{};
  lpCtx().modal(`<button class="modal-close" onclick="closeModal()">×</button>
    <div class="kicker">PERSÖNLICHER LERNPFAD</div>
    <h2>${existing?"Lernpfad aktualisieren":"Neuen Lernschritt planen"}</h2>
    <p class="muted">Plane nicht alles auf einmal. Entscheide, was für dich jetzt der nächste sinnvolle Schritt ist.</p>
    <div class="form">
      <label>📌 Lernziel / Thema
        <input id="lpTitle" value="${escLP(p.title)}" placeholder="z. B. Bindungstheorie verstehen">
      </label>
      <label>📘 Fach / Lernbereich
        <input id="lpSubject" value="${escLP(p.subject)}" placeholder="z. B. Pädagogik & Psychologie 11">
      </label>
      <label>🎯 Was möchte ich am Ende können oder verstehen?
        <textarea id="lpGoal" rows="3" placeholder="Formuliere dein persönliches Lernziel.">${escLP(p.goal)}</textarea>
      </label>
      <label>📊 Wo stehe ich gerade?
        <select id="lpStatus">
          <option value="green" ${p.status==="green"?"selected":""}>🟢 Auf Kurs</option>
          <option value="yellow" ${(!p.status||p.status==="yellow")?"selected":""}>🟡 Klärungsbedarf</option>
          <option value="red" ${p.status==="red"?"selected":""}>🔴 Handlungsbedarf</option>
        </select>
      </label>
      <label>📈 Mein Fortschritt: <span id="lpProgressValue">${Number(p.progress)||0}</span> %
        <input id="lpProgress" type="range" min="0" max="100" step="10" value="${Number(p.progress)||0}" oninput="$('lpProgressValue').textContent=this.value">
      </label>
      <label>🚀 Mein nächster konkreter Schritt
        <textarea id="lpNext" rows="2" placeholder="z. B. Lernressource öffnen und anschließend drei Fragen beantworten.">${escLP(p.next)}</textarea>
      </label>
      <label>🧰 Was brauche ich noch?
        <textarea id="lpHelp" rows="2" placeholder="z. B. Erklärung, Übung, Austausch oder Lerncoaching.">${escLP(p.help)}</textarea>
      </label>
      <div class="form-actions">
        <button class="secondary" onclick="closeModal()">Abbrechen</button>
        <button class="primary" onclick='window.saveLernpfad(${existing?`"${existing.id}"`:"null"})'>🧭 Lernpfad speichern</button>
      </div>
      <div id="lpError" class="notice" style="display:none;margin-top:10px"></div>
    </div>`);
}

export async function saveLernpfad(id=null){
  const c=lpCtx();
  const title=$lp("lpTitle")?.value.trim()||"";
  const subject=$lp("lpSubject")?.value.trim()||"";
  const goal=$lp("lpGoal")?.value.trim()||"";
  const status=$lp("lpStatus")?.value||"yellow";
  const progress=Number($lp("lpProgress")?.value||0);
  const next=$lp("lpNext")?.value.trim()||"";
  const help=$lp("lpHelp")?.value.trim()||"";
  const err=$lp("lpError");

  if(!title||!goal){
    if(err){err.textContent="Bitte Lernziel / Thema und dein persönliches Ziel ausfüllen.";err.style.display="block";}
    return;
  }
  try{
    const data={uid:c.currentUser.uid,title,subject,goal,status,progress,next,help,updatedAt:c.serverTimestamp()};
    if(id) await c.updateDoc(c.doc(c.db,"lernpfade",id),data);
    else await c.addDoc(c.collection(c.db,"lernpfade"),{...data,createdAt:c.serverTimestamp()});
    closeModal();c.toast(id?"Lernpfad aktualisiert.":"Lernschritt gespeichert.");await c.render();
  }catch(e){
    console.error("Lernpfad speichern:",e);
    if(err){err.textContent="Speichern nicht möglich. Bitte Firestore-Regeln für „lernpfade“ prüfen.";err.style.display="block";}
  }
}

export async function editLernpfad(id){
  const data=await loadLernpfad();
  const p=data.find(x=>x.id===id);
  if(p) openLernpfadForm(p);
}

export async function renderLernpfad(){
  const data=await loadLernpfad();
  const green=data.filter(x=>x.status==="green").length;
  const yellow=data.filter(x=>x.status==="yellow").length;
  const red=data.filter(x=>x.status==="red").length;
  const avg=data.length?Math.round(data.reduce((a,x)=>a+(Number(x.progress)||0),0)/data.length):0;

  return `${lpCtx().pageHead("LERNWERKSTATT","Persönlicher Lernpfad","Du entscheidest, woran du arbeitest, wo du gerade stehst und was dein nächster sinnvoller Schritt ist.",`<button class="primary" onclick="window.openLernpfadForm()">＋ Lernschritt planen</button>`)}
  <div class="card" style="background:var(--soft-green)">
    <span class="badge">🧭 DEIN PERSÖNLICHER LERNWEG</span>
    <h2>Nicht alles auf einmal – der nächste gute Schritt zählt.</h2>
    <p>Der Lernpfad verbindet Ziel, Lernstand und nächsten Schritt. Nutze ihn zusammen mit Lernwerkstatt, Lernstandsmessung, Lernressourcen und Lernjournal.</p>
  </div>

  <div class="grid grid-4" style="margin-top:12px">
    <div class="card stat"><b>${data.length}</b><span>Lernziele</span></div>
    <div class="card stat"><b>${avg}%</b><span>Ø Fortschritt</span></div>
    <div class="card stat"><b>🟢 ${green}</b><span>Auf Kurs</span></div>
    <div class="card stat"><b>🟡 ${yellow} · 🔴 ${red}</b><span>brauchen Aufmerksamkeit</span></div>
  </div>

  <div class="card" style="margin-top:12px">
    <h3>🔄 So funktioniert dein Lernpfad</h3>
    <div class="lp-flow">
      <span>🎯 Ziel setzen</span><b>→</b><span>📚 Lernen</span><b>→</b><span>📊 Lernstand prüfen</span><b>→</b><span>🚀 Nächsten Schritt wählen</span><b>→</b><span>📓 Reflektieren</span>
    </div>
  </div>

  <section style="margin-top:22px">
    <div class="section-head"><div><div class="kicker">MEINE LERNZIELE</div><h2>Aktuelle Lernpfade</h2></div></div>
    ${data.length?`<div class="grid grid-2">${data.map(lernpfadCard).join("")}</div>`:`<div class="card empty"><strong>Dein Lernpfad ist noch leer.</strong><p>Lege ein erstes persönliches Lernziel an und entscheide, was dein nächster Schritt sein soll.</p><button class="primary" onclick="window.openLernpfadForm()">🧭 Ersten Lernschritt planen</button></div>`}
  </section>
  ${lpCtx().footer()}`;
}

window.openLernpfadForm=openLernpfadForm;
window.saveLernpfad=saveLernpfad;
window.editLernpfad=editLernpfad;
