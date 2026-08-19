/* =========================================================
   CAMPUSKLASSE – MODUL: LERNCOACHING
   ========================================================= */

const LERNCOACHING_EMAIL="BERATUNGSLEHRKRAFT@SCHULE.DE";

export async function renderLerncoaching(){
  const c=window.CampusFirebase;
  if(!c) throw new Error("CampusFirebase ist noch nicht bereit.");

  const subject=encodeURIComponent("Anfrage Lerncoaching");
  const body=encodeURIComponent(
    "Hallo,\n\nich würde gerne ein Lerncoaching vereinbaren.\n\nMein Anliegen:\n\nViele Grüße"
  );
  const mail=`mailto:${LERNCOACHING_EMAIL}?subject=${subject}&body=${body}`;

  return `${c.pageHead(
    "BEGLEITUNG",
    "Lerncoaching",
    "Du möchtest deinen Lernweg sortieren, ein Ziel klären oder weißt gerade nicht, wie du weiterkommst?",
    `<a class="primary" href="${mail}">✉️ Lerncoaching anfragen</a>`
  )}
  <div class="grid grid-2">
    <div class="card">
      <span class="badge">🧭 INDIVIDUELLE BEGLEITUNG</span>
      <h2>Du musst deinen Lernweg nicht allein planen.</h2>
      <p>Im Lerncoaching kannst du gemeinsam mit einer Lehrkraft auf deine aktuelle Situation schauen, Ziele klären und nächste Schritte entwickeln.</p>
      <p>Das Lerncoaching ist besonders hilfreich, wenn du:</p>
      <div class="list">
        <div class="list-item"><strong>🎯 ein Lernziel klären möchtest</strong><span class="pill">Ziel</span></div>
        <div class="list-item"><strong>📚 deinen Lernweg planen möchtest</strong><span class="pill">Planung</span></div>
        <div class="list-item"><strong>🧩 bei einer Lernschwierigkeit feststeckst</strong><span class="pill">Klären</span></div>
        <div class="list-item"><strong>💪 mehr Struktur oder Motivation suchst</strong><span class="pill">Stärkung</span></div>
        <div class="list-item"><strong>🚀 deinen nächsten Schritt finden möchtest</strong><span class="pill">Nächster Schritt</span></div>
      </div>
    </div>

    <div class="card">
      <span class="badge">✉️ KONTAKT</span>
      <h2>Eine Lehrkraft anschreiben</h2>
      <p>Wenn du ein Lerncoaching möchtest, kannst du direkt eine E-Mail-Anfrage senden.</p>
      <a class="primary" href="${mail}">✉️ E-Mail an Lerncoaching</a>
      <div class="notice" style="margin-top:16px">
        <strong>Was kannst du schreiben?</strong>
        <p style="margin-bottom:0">Du musst dein Anliegen nicht perfekt formulieren. Schreibe einfach kurz, wobei du Unterstützung möchtest.</p>
      </div>
    </div>
  </div>

  <div class="card" style="margin-top:12px">
    <h3>🧭 So läuft ein Lerncoaching ab</h3>
    <div class="lp-flow">
      <span>1. Anliegen klären</span><b>→</b>
      <span>2. Situation anschauen</span><b>→</b>
      <span>3. Ziel formulieren</span><b>→</b>
      <span>4. nächsten Schritt planen</span>
    </div>
  </div>

  <div class="card" style="margin-top:12px">
    <h3>💡 Wichtig</h3>
    <p>Lerncoaching bedeutet: gemeinsam hinschauen, sortieren und einen passenden nächsten Schritt finden. Du musst dafür noch keine fertige Lösung haben.</p>
    <p>Die Kontaktaufnahme erfolgt ausschließlich per E-Mail.</p>
  </div>
  ${c.footer()}`;
}
window.renderLerncoaching=renderLerncoaching;
