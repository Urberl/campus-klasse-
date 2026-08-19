/* CAMPUSKLASSE – LERNJOURNAL – eigenständiges Modul */
const LJ_KEY="campusklasse_lernjournal";
const LJ_SPRUECHE=[
"Du musst nicht alles können. Du musst nur den nächsten Schritt gehen.",
"Auch kleine Fortschritte sind Fortschritte.",
"Du bist weiter, als du vielleicht gerade denkst.",
"Jeder Lernschritt zählt.",
"Fehler zeigen dir, wo dein nächster Lernschritt liegt.",
"Du darfst langsam lernen. Wichtig ist, dass du weitergehst.",
"Was heute noch schwierig ist, kann morgen schon leichter sein.",
"Du hast heute etwas für dich und deine Zukunft getan.",
"Lernen ist kein Wettlauf. Dein Weg darf dein eigener sein.",
"Ein kleiner Schritt ist besser als Stillstand.",
"Du musst nicht perfekt sein, um Fortschritte zu machen.",
"Deine Anstrengung heute kann dein Können von morgen werden.",
"Du darfst stolz auf das sein, was du heute geschafft hast.",
"Neugier ist ein guter Begleiter beim Lernen.",
"Nicht alles muss sofort gelingen.",
"Du lernst nicht nur durch Erfolge, sondern auch durch Versuche.",
"Bleib dran – manchmal entsteht Fortschritt genau dort, wo es schwierig wird.",
"Du hast dir heute Zeit für dein Lernen genommen. Das zählt.",
"Dein nächster Schritt muss nicht groß sein.",
"Vertraue darauf, dass Lernen Zeit braucht.",
"Was du heute reflektierst, hilft dir morgen weiter.",
"Du darfst deinen eigenen Lernweg gestalten.",
"Jede Erkenntnis ist ein Stück Orientierung.",
"Mach weiter in deinem Tempo. Du bist unterwegs."
];
const ljEsc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const ljLoad=()=>{try{let x=JSON.parse(localStorage.getItem(LJ_KEY)||"[]");return Array.isArray(x)?x:[]}catch(e){return[]}};
const ljSave=x=>localStorage.setItem(LJ_KEY,JSON.stringify(x));
const ljToday=()=>new Date().toISOString().slice(0,10);
const ljDate=d=>d?new Date(d+"T12:00:00").toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"}):"";
const ljQuote=()=>LJ_SPRUECHE[Math.floor(Math.random()*LJ_SPRUECHE.length)];
const ljMoods=[["😊","Sehr gut"],["🙂","Gut"],["😐","Okay"],["😕","Eher schwierig"],["😮‍💨","Anstrengend"]];

export async function renderLernjournal(){
 const e=ljLoad();
 return `${window.CampusFirebase.pageHead("REFLEXION","Lernjournal","Halte fest, was du gelernt hast, was schwierig war und was du als Nächstes tun möchtest.",`<button class="primary" onclick="ljNewEntry()">＋ Neuer Eintrag</button>`)}
 <div class="grid grid-2">
  <div class="card"><span class="badge">📓 DEIN LERNWEG</span><h2>Was hast du heute gelernt?</h2><p>Das Lernjournal macht deinen persönlichen Lernweg sichtbar.</p><button class="primary" onclick="ljNewEntry()">✍️ Eintrag schreiben</button></div>
  <div class="card"><span class="badge">🌱 DEIN FORTSCHRITT</span><h2>${e.length}</h2><p>${e.length===1?"Lernjournal-Eintrag":"Lernjournal-Einträge"} gesammelt.</p></div>
 </div>
 <div class="card" style="margin-top:14px"><div class="kicker">MEIN LERNVERLAUF</div><h2>Meine Einträge</h2>
 ${e.length?`<div class="lj-entry-list">${e.slice().reverse().map(ljCard).join("")}</div>`:`<div class="notice"><strong>🌱 Dein Lernjournal beginnt hier.</strong><p>Schreibe deinen ersten Eintrag und halte deinen Lernweg fest.</p><button class="primary" onclick="ljNewEntry()">Ersten Eintrag erstellen</button></div>`}
 </div>${window.CampusFirebase.footer()}`;
}
function ljCard(e){return `<article class="card lj-entry"><div class="lj-entry-head"><div><span class="badge">${ljEsc(ljDate(e.date))}</span><h3>${ljEsc(e.topic||"Lerneintrag")}</h3></div><span>${ljEsc(e.mood||"")}</span></div>${e.learned?`<div class="lj-field"><strong>💡 Das habe ich gelernt</strong><p>${ljEsc(e.learned)}</p></div>`:""}${e.difficult?`<div class="lj-field"><strong>🧩 Das war schwierig</strong><p>${ljEsc(e.difficult)}</p></div>`:""}${e.helped?`<div class="lj-field"><strong>💪 Das hat mir geholfen</strong><p>${ljEsc(e.helped)}</p></div>`:""}${e.next?`<div class="lj-field"><strong>➡️ Mein nächster Schritt</strong><p>${ljEsc(e.next)}</p></div>`:""}<div class="lj-entry-actions"><button class="secondary" onclick="ljEdit('${e.id}')">Bearbeiten</button><button class="secondary" onclick="ljDelete('${e.id}')">Löschen</button></div></article>`}
function ljNewEntry(){ljForm()}
function ljEdit(id){const e=ljLoad().find(x=>x.id===id);if(e)ljForm(e)}
function ljForm(e=null){
 e=e||{date:ljToday(),topic:"",learned:"",difficult:"",helped:"",next:"",mood:"🙂 Gut",satisfaction:""};
 window.CampusFirebase.modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">📓 LERNJOURNAL</div><h2>${e.id?"Eintrag bearbeiten":"Neuer Lernjournal-Eintrag"}</h2><p>Reflektiere kurz deinen heutigen Lernweg.</p><div class="form">
 <label>📅 Datum<input id="ljDate" type="date" value="${ljEsc(e.date)}"></label>
 <label>🎯 Woran habe ich heute gearbeitet?<input id="ljTopic" value="${ljEsc(e.topic)}" placeholder="z. B. Pädagogik – Bindung"></label>
 <label>💡 Was habe ich heute verstanden / gelernt?<textarea id="ljLearned" rows="3">${ljEsc(e.learned)}</textarea></label>
 <label>🧩 Was war schwierig?<textarea id="ljDifficult" rows="3">${ljEsc(e.difficult)}</textarea></label>
 <label>💪 Was hat mir geholfen?<textarea id="ljHelped" rows="3">${ljEsc(e.helped)}</textarea></label>
 <label>➡️ Was ist mein nächster Lernschritt?<textarea id="ljNext" rows="3">${ljEsc(e.next)}</textarea></label>
 <label>😊 Wie ging es mir beim Lernen?<select id="ljMood">${ljMoods.map(x=>`<option value="${x[0]} ${x[1]}" ${e.mood===x[0]+" "+x[1]?"selected":""}>${x[0]} ${x[1]}</option>`).join("")}</select></label>
 <label>⭐ Wie zufrieden bin ich mit meinem Lernen?<select id="ljSatisfaction"><option value="">Bitte auswählen</option>${["⭐ Noch nicht zufrieden","⭐⭐ Eher zufrieden","⭐⭐⭐ Zufrieden","⭐⭐⭐⭐ Sehr zufrieden","⭐⭐⭐⭐⭐ Sehr stolz"].map(x=>`<option ${e.satisfaction===x?"selected":""}>${x}</option>`).join("")}</select></label>
 <div class="form-actions"><button class="secondary" onclick="closeModal()">Abbrechen</button><button class="primary" onclick="ljSaveEntry('${e.id||""}')">${e.id?"Speichern":"Eintrag speichern"}</button></div></div>`);
}
function ljSaveEntry(id){
 const e={id:id||"lj_"+Date.now(),date:document.getElementById("ljDate")?.value||ljToday(),topic:document.getElementById("ljTopic")?.value.trim()||"",learned:document.getElementById("ljLearned")?.value.trim()||"",difficult:document.getElementById("ljDifficult")?.value.trim()||"",helped:document.getElementById("ljHelped")?.value.trim()||"",next:document.getElementById("ljNext")?.value.trim()||"",mood:document.getElementById("ljMood")?.value||"",satisfaction:document.getElementById("ljSatisfaction")?.value||"",createdAt:new Date().toISOString()};
 if(!e.topic&&!e.learned&&!e.difficult&&!e.helped&&!e.next){alert("Schreibe bitte mindestens etwas in deinen Eintrag.");return}
 const a=ljLoad(),i=a.findIndex(x=>x.id===e.id);i>=0?a[i]=e:a.push(e);ljSave(a);closeModal();
 setTimeout(()=>window.CampusFirebase.modal(`<button class="modal-close" onclick="closeModal()">×</button><div class="kicker">🌱 LERNJOURNAL</div><h2>${id?"Eintrag aktualisiert":"Eintrag gespeichert"}</h2><div class="lj-motivation"><div class="lj-motivation-icon">✨</div><div><span class="badge">EIN GEDANKE FÜR DICH</span><p>„${ljEsc(ljQuote())}“</p></div></div><div class="notice"><strong>💚 Gut gemacht.</strong><p>Du hast dir Zeit genommen, deinen Lernweg bewusst wahrzunehmen.</p></div><div class="form-actions"><button class="primary" onclick="closeModal()">Weiter</button></div>`),150);
}
function ljDelete(id){ljSave(ljLoad().filter(x=>x.id!==id));if(typeof toast==="function")toast("Eintrag gelöscht.");setTimeout(()=>{const c=document.getElementById("content");if(c)renderLernjournal().then(h=>c.innerHTML=h)},100)}
window.ljNewEntry=ljNewEntry;window.ljEdit=ljEdit;window.ljSaveEntry=ljSaveEntry;window.ljDelete=ljDelete;
