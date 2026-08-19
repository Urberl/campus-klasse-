/* CAMPUSKLASSE – MODUL: LERNCOACHING */

const LERNCOACHING_EMAIL = "BERATUNGSLEHRKRAFT@SCHULE.DE";

export async function renderLerncoaching() {
  const c = window.CampusFirebase;

  if (!c || typeof c.pageHead !== "function" || typeof c.footer !== "function") {
    throw new Error("Die Campus-Modulschnittstelle ist nicht verfügbar.");
  }

  const subject = encodeURIComponent("Anfrage Lerncoaching");
  const body = encodeURIComponent(
    "Hallo,\n\n" +
    "ich würde gerne ein Lerncoaching vereinbaren.\n\n" +
    "Mein Anliegen:\n\n\n" +
    "Viele Grüße"
  );

  const mail = `mailto:${LERNCOACHING_EMAIL}?subject=${subject}&body=${body}`;

  return `${c.pageHead(
    "BEGLEITUNG",
    "Lerncoaching",
    "Gemeinsam den eigenen Lernweg klären, Ziele entwickeln und nächste Schritte finden.",
    `<a class="primary" href="${mail}">✉️ Lerncoaching anfragen</a>`
  )}

  <div class="grid grid-2">

    <div class="card">
      <span class="badge">🧭 INDIVIDUELLE BEGLEITUNG</span>
      <h2>Du musst deinen Lernweg nicht allein planen.</h2>

      <p>
        Im Lerncoaching kannst du gemeinsam mit einer Lehrkraft
        auf deine aktuelle Lernsituation schauen, Ziele klären
        und einen passenden nächsten Schritt entwickeln.
      </p>

      <h3>Ein Lerncoaching kann helfen, wenn du …</h3>

      <div class="list">
        <div class="list-item">
          <strong>🎯 ein Lernziel klären möchtest</strong>
          <span class="pill">Ziel</span>
        </div>
        <div class="list-item">
          <strong>📚 deinen Lernweg planen möchtest</strong>
          <span class="pill">Planung</span>
        </div>
        <div class="list-item">
          <strong>🧩 bei einer Lernaufgabe feststeckst</strong>
          <span class="pill">Klären</span>
        </div>
        <div class="list-item">
          <strong>💪 mehr Struktur oder Motivation suchst</strong>
          <span class="pill">Stärkung</span>
        </div>
        <div class="list-item">
          <strong>🚀 deinen nächsten Lernschritt finden möchtest</strong>
          <span class="pill">Nächster Schritt</span>
        </div>
      </div>
    </div>

    <div class="card">
      <span class="badge">✉️ KONTAKT</span>
      <h2>Eine Lehrkraft anschreiben</h2>

      <p>
        Du möchtest ein Lerncoaching? Dann kannst du direkt
        eine E-Mail an die zuständige Lehrkraft schreiben.
      </p>

      <a class="primary" href="${mail}">
        ✉️ E-Mail an Lerncoaching
      </a>

      <div class="notice" style="margin-top:16px">
        <strong>Du musst dein Anliegen nicht perfekt formulieren.</strong>
        <p style="margin-bottom:0">
          Schreibe einfach kurz, wobei du Unterstützung möchtest.
        </p>
      </div>
    </div>

  </div>

  <div class="card" style="margin-top:12px">
    <h3>🧭 So kann ein Lerncoaching ablaufen</h3>

    <div class="lp-flow">
      <span>1. Anliegen klären</span>
      <b>→</b>
      <span>2. Situation anschauen</span>
      <b>→</b>
      <span>3. Ziel formulieren</span>
      <b>→</b>
      <span>4. nächsten Schritt planen</span>
    </div>
  </div>

  <div class="card" style="margin-top:12px">
    <h3>💡 Wichtig</h3>
    <p>
      Du musst für ein Lerncoaching noch keine fertige Lösung haben.
      Gemeinsam wird sortiert, was gerade wichtig ist und welcher
      nächste Schritt sinnvoll sein kann.
    </p>
    <p>Die Kontaktaufnahme erfolgt ausschließlich per E-Mail.</p>
  </div>

  ${c.footer()}`;
}

window.renderLerncoaching = renderLerncoaching;
