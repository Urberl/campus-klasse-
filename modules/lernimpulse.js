/* =========================================================
   CAMPUSKLASSE – MODUL: LERNIMPULSE
   Eigenständiges Modul passend zur Master-App
   8 Kategorien · 40 interaktive Impulse
   ========================================================= */

const lernImpulseKategorien=[
  {
    id:"quick",
    icon:"⚡",
    title:"Quick Impulse",
    text:"Ein kleiner Lernschritt für zwischendurch.",
    color:"green"
  },
  {
    id:"verstehen",
    icon:"🧠",
    title:"Verstehen",
    text:"Zusammenhänge erkennen statt nur auswendig lernen.",
    color:"blue"
  },
  {
    id:"nachdenken",
    icon:"💭",
    title:"Nachdenken",
    text:"Den eigenen Lernweg bewusst wahrnehmen.",
    color:"purple"
  },
  {
    id:"anwenden",
    icon:"🛠️",
    title:"Anwenden",
    text:"Wissen in einer konkreten Situation nutzen.",
    color:"orange"
  },
  {
    id:"wiederholen",
    icon:"🔁",
    title:"Wiederholen",
    text:"Wichtiges aktiv aus dem Gedächtnis holen.",
    color:"yellow"
  },
  {
    id:"challenge",
    icon:"🚀",
    title:"Challenge",
    text:"Eine kleine Herausforderung annehmen.",
    color:"red"
  },
  {
    id:"haengt",
    icon:"🧩",
    title:"Wenn du hängst",
    text:"Einen Weg aus einer Lernblockade finden.",
    color:"teal"
  },
  {
    id:"ueberraschung",
    icon:"✨",
    title:"Überraschungsimpuls",
    text:"Ein zufälliger Impuls für deinen Lernweg.",
    color:"pink"
  }
];

const lernImpulse=[
  /* QUICK IMPULSE */
  {id:"q1",cat:"quick",title:"60-Sekunden-Start",task:"Öffne jetzt die Lernaufgabe, an der du gerade arbeitest. Schreibe in einem Satz auf: Was soll am Ende herauskommen?",hint:"Noch nicht lösen – nur das Ziel klären.",next:"Formuliere danach den ersten konkreten Arbeitsschritt."},
  {id:"q2",cat:"quick",title:"Ein Begriff",task:"Wähle einen wichtigen Begriff aus deinem aktuellen Thema und erkläre ihn mit maximal 12 Wörtern.",hint:"So, dass ihn eine Mitschülerin oder ein Mitschüler verstehen würde.",next:"Prüfe danach deine Erklärung am Material."},
  {id:"q3",cat:"quick",title:"Ein Satz",task:"Schreibe einen Satz: „Das Wichtigste, das ich heute verstanden habe, ist …“",hint:"Es reicht ein einziger klarer Satz.",next:"Markiere anschließend die Stelle im Material, die dazu gehört."},
  {id:"q4",cat:"quick",title:"Nächster Schritt",task:"Schließe für einen Moment alle anderen Aufgaben aus und benenne genau eine Sache, die du jetzt als Nächstes erledigst.",hint:"Nicht fünf Dinge – genau eines.",next:"Setze diesen Schritt sofort für 5 Minuten um."},
  {id:"q5",cat:"quick",title:"Lernumgebung",task:"Verändere genau eine Sache an deinem Arbeitsplatz, die dich gerade ablenkt.",hint:"Zum Beispiel Tabs schließen, Handy weglegen oder Material bereitlegen.",next:"Starte danach direkt mit deiner Aufgabe."},

  /* VERSTEHEN */
  {id:"v1",cat:"verstehen",title:"Warum?",task:"Wähle eine Aussage aus deinem aktuellen Thema und frage dreimal hintereinander: „Warum ist das so?“",hint:"Versuche, bei jeder Antwort eine Ebene tiefer zu kommen.",next:"Formuliere am Ende den Zusammenhang in einem eigenen Satz."},
  {id:"v2",cat:"verstehen",title:"Erklären statt abschreiben",task:"Erkläre einen schwierigen Inhalt laut, als würdest du ihn einer Person erklären, die noch nichts darüber weiß.",hint:"Keine Fachbegriffe verwenden, wenn du sie nicht erklären kannst.",next:"Notiere den Punkt, an dem du ins Stocken kommst."},
  {id:"v3",cat:"verstehen",title:"Zusammenhang finden",task:"Nimm zwei Begriffe aus deinem Thema. Was haben sie miteinander zu tun?",hint:"Suche nicht nur Gemeinsamkeiten – auch Unterschiede oder Ursache-Wirkungs-Beziehungen zählen.",next:"Zeichne oder formuliere die Verbindung."},
  {id:"v4",cat:"verstehen",title:"Beispiel bauen",task:"Finde selbst ein konkretes Beispiel, an dem dein aktueller Lerninhalt sichtbar wird.",hint:"Ein gutes Beispiel macht den Inhalt anschaulich.",next:"Prüfe: Würde das Beispiel auch jemand anderes verstehen?"},
  {id:"v5",cat:"verstehen",title:"Kernidee",task:"Streiche in deinen Notizen alles weg, was du für die Kernidee nicht unbedingt brauchst. Was bleibt?",hint:"Ziel: maximal drei zentrale Aussagen.",next:"Ordne diese drei Aussagen sinnvoll."},

  /* NACHDENKEN */
  {id:"n1",cat:"nachdenken",title:"Was kann ich schon?",task:"Bewerte deinen aktuellen Lernstand spontan von 1 bis 10. Was macht deine Zahl aus?",hint:"Es gibt keine richtige Zahl.",next:"Benenne einen Punkt, der deine Zahl um einen Schritt erhöhen könnte."},
  {id:"n2",cat:"nachdenken",title:"Mein Lernweg",task:"Was hat dir beim letzten Lernen tatsächlich geholfen?",hint:"Denke an eine konkrete Situation, nicht an eine allgemeine Methode.",next:"Überlege, wie du diesen Ansatz heute wieder nutzen kannst."},
  {id:"n3",cat:"nachdenken",title:"Fehler mit Nutzen",task:"Denke an einen Fehler aus einer aktuellen Aufgabe. Was kannst du daraus über deinen Denkweg lernen?",hint:"Nicht nur: „Ich habe es falsch gemacht.“",next:"Formuliere eine Regel für deinen nächsten Versuch."},
  {id:"n4",cat:"nachdenken",title:"Energie-Check",task:"Wie viel Energie hast du gerade für deine Aufgabe – niedrig, mittel oder hoch?",hint:"Beobachte dich, ohne dich dafür zu bewerten.",next:"Passe deine Aufgabe daran an: starten, vereinfachen oder vertiefen."},
  {id:"n5",cat:"nachdenken",title:"Was brauche ich?",task:"Vervollständige: „Damit ich weiterkomme, brauche ich gerade …“",hint:"Vielleicht Wissen, Zeit, Ruhe, eine Erklärung, Feedback oder eine Entscheidung.",next:"Suche genau diese Unterstützung oder Ressource."},

  /* ANWENDEN */
  {id:"a1",cat:"anwenden",title:"Auf echte Situation übertragen",task:"Übertrage einen aktuellen Lerninhalt auf eine Situation aus deinem Alltag, Praktikum oder späteren Beruf.",hint:"Was würde sich dort mit diesem Wissen anders betrachten lassen?",next:"Notiere die konkrete Situation."},
  {id:"a2",cat:"anwenden",title:"Mini-Fall",task:"Erfinde einen kurzen Fall, bei dem du dein aktuelles Wissen anwenden musst.",hint:"Der Fall sollte eine echte Entscheidung oder Lösung verlangen.",next:"Löse deinen eigenen Fall."},
  {id:"a3",cat:"anwenden",title:"Zeig es",task:"Zeige einen Lerninhalt nicht als Text, sondern als Skizze, Ablauf, Tabelle oder Beispiel.",hint:"Wähle die Darstellungsform, die den Zusammenhang am besten sichtbar macht.",next:"Prüfe, ob die Darstellung ohne deine Erklärung verständlich ist."},
  {id:"a4",cat:"anwenden",title:"Transferfrage",task:"Stelle dir die Frage: „Wo könnte mir dieses Wissen außerhalb der Schule nützlich sein?“",hint:"Nimm eine konkrete Situation.",next:"Beschreibe in zwei Sätzen, wie du es dort nutzen würdest."},
  {id:"a5",cat:"anwenden",title:"Entscheiden",task:"Nimm ein aktuelles Problem und entscheide dich für eine Lösung auf Grundlage deines Lernwissens.",hint:"Begründe deine Entscheidung mit mindestens einem Fachargument.",next:"Prüfe anschließend, ob es eine alternative Lösung gibt."},

  /* WIEDERHOLEN */
  {id:"w1",cat:"wiederholen",title:"Buch zu",task:"Schließe für zwei Minuten dein Material. Schreibe aus dem Kopf alles auf, was du zum aktuellen Thema noch weißt.",hint:"Nicht nachschauen.",next:"Öffne danach dein Material und markiere nur die fehlenden Punkte."},
  {id:"w2",cat:"wiederholen",title:"Drei Fragen",task:"Formuliere drei Prüfungsfragen zu deinem aktuellen Thema.",hint:"Eine leichte, eine mittlere und eine schwierige Frage.",next:"Beantworte alle drei ohne Material."},
  {id:"w3",cat:"wiederholen",title:"Karteikarten-Test",task:"Nimm drei wichtige Begriffe und erkläre jeden aus dem Kopf.",hint:"Wenn du nur die Definition kennst, ergänze ein Beispiel.",next:"Prüfe danach deine Antworten."},
  {id:"w4",cat:"wiederholen",title:"Was fehlt?",task:"Schreibe die fünf wichtigsten Punkte deines Themas aus dem Kopf auf.",hint:"Danach erst vergleichen.",next:"Ergänze genau das, was dir gefehlt hat."},
  {id:"w5",cat:"wiederholen",title:"Morgen-Test",task:"Formuliere eine Frage, die du dir morgen ohne Unterlagen selbst stellen kannst.",hint:"Die Antwort sollte eindeutig überprüfbar sein.",next:"Speichere die Frage in deinen Lernnotizen."},

  /* CHALLENGE */
  {id:"c1",cat:"challenge",title:"Ohne Vorlage",task:"Löse einen kleinen Teil deiner aktuellen Aufgabe ohne deine Vorlage oder Musterlösung zu öffnen.",hint:"Erst selbst denken, dann vergleichen.",next:"Vergleiche danach und finde genau eine Abweichung."},
  {id:"c2",cat:"challenge",title:"60-Sekunden-Erklärung",task:"Erkläre dein Thema in höchstens 60 Sekunden.",hint:"Nur Kernidee, Zusammenhang und ein Beispiel.",next:"Wenn du länger brauchst: Was kannst du weglassen?"},
  {id:"c3",cat:"challenge",title:"Schwierigste Frage",task:"Formuliere die schwierigste Frage, die eine Lehrkraft zu deinem Thema stellen könnte.",hint:"Nicht nach einer Fangfrage suchen – nach einer echten Denkfrage.",next:"Versuche sie selbst zu beantworten."},
  {id:"c4",cat:"challenge",title:"Gegenposition",task:"Finde zu deiner eigenen Aussage ein gutes Gegenargument.",hint:"Das Gegenargument muss ernst zu nehmen sein.",next:"Entscheide danach, welche Position dich stärker überzeugt und warum."},
  {id:"c5",cat:"challenge",title:"Ein Schritt weiter",task:"Nimm eine Aufgabe, die du bereits kannst, und verändere eine Bedingung. Was passiert?",hint:"Mache aus einer bekannten Aufgabe eine neue.",next:"Löse die veränderte Aufgabe."},

  /* WENN DU HÄNGST */
  {id:"h1",cat:"haengt",title:"Problem kleiner machen",task:"Zerlege die Aufgabe, an der du hängst, in drei kleinere Schritte.",hint:"Der erste Schritt darf sehr klein sein.",next:"Bearbeite nur Schritt 1."},
  {id:"h2",cat:"haengt",title:"Was genau ist unklar?",task:"Vervollständige: „Ich komme nicht weiter, weil ich … nicht verstehe / nicht weiß / nicht entscheiden kann.“",hint:"So wird aus einem diffusen Problem eine konkrete Frage.",next:"Formuliere daraus eine Frage an Material, KI, Mitschüler oder Lehrkraft."},
  {id:"h3",cat:"haengt",title:"Letzter sicherer Punkt",task:"Gehe zurück zu dem Punkt, an dem du noch sicher warst. Was konntest du dort?",hint:"Von dort aus Schritt für Schritt weiter.",next:"Finde den ersten Punkt, an dem die Unsicherheit beginnt."},
  {id:"h4",cat:"haengt",title:"Hilfe richtig holen",task:"Wenn du gerade Hilfe brauchst: Formuliere deine Frage so konkret, dass eine andere Person direkt darauf antworten könnte.",hint:"Nicht: „Ich verstehe das nicht.“",next:"Stelle die Frage tatsächlich im Forum oder einer passenden Lernressource."},
  {id:"h5",cat:"haengt",title:"5-Minuten-Reset",task:"Unterbrich die Aufgabe für fünf Minuten. Steh auf, bewege dich kurz und komme dann mit einem einzigen nächsten Schritt zurück.",hint:"Die Pause ist Teil der Strategie.",next:"Starte nach der Pause nur mit diesem einen Schritt."},

  /* ÜBERRASCHUNG */
  {id:"u1",cat:"ueberraschung",title:"Erkläre es mit einem Bild",task:"Finde ein Bild, eine Metapher oder einen Vergleich für einen Lerninhalt.",hint:"Je ungewöhnlicher, desto besser – solange der Zusammenhang stimmt.",next:"Erkläre, warum der Vergleich passt."},
  {id:"u2",cat:"ueberraschung",title:"Lerninhalt als Schlagzeile",task:"Formuliere dein aktuelles Thema als Zeitungsüberschrift.",hint:"Die Überschrift soll neugierig machen und trotzdem fachlich passen.",next:"Erkläre in einem Satz, was dahintersteckt."},
  {id:"u3",cat:"ueberraschung",title:"Perspektivwechsel",task:"Betrachte deinen Lerninhalt aus der Perspektive einer anderen Person: Kind, Kunde, Patient, Kollegin oder Praxispartner.",hint:"Was wäre für diese Person daran wichtig?",next:"Formuliere eine Frage aus dieser Perspektive."},
  {id:"u4",cat:"ueberraschung",title:"Falsche Antwort",task:"Erfinde bewusst eine plausible, aber falsche Antwort zu deinem Thema.",hint:"Die Antwort soll zunächst überzeugend wirken.",next:"Erkläre anschließend genau, warum sie falsch ist."},
  {id:"u5",cat:"ueberraschung",title:"Das würde ich fragen",task:"Wenn du heute nur eine einzige Frage zu deinem Thema stellen dürftest: Welche wäre es?",hint:"Wähle eine Frage, die deinen Lernweg wirklich weiterbringt.",next:"Suche die Antwort und prüfe sie mit einer verlässlichen Quelle."}
];

function lernImpulseDone(){
  try{return JSON.parse(localStorage.getItem("campusklasse_lernimpulse_done")||"[]")}
  catch(e){return []}
}

function lernImpulseSaveDone(ids){
  try{localStorage.setItem("campusklasse_lernimpulse_done",JSON.stringify(ids))}
  catch(e){}
}

function lernImpulseGet(id){return lernImpulse.find(x=>x.id===id)}
function lernImpulseCategory(id){return lernImpulseKategorien.find(x=>x.id===id)}

function renderLernimpulsCard(i){
  const c=lernImpulseCategory(i.cat);
  return `<button class="card tile impulse-card" onclick="openLernimpuls('${i.id}')">
    <span class="emoji">${c.icon}</span>
    <strong>${esc(i.title)}</strong>
    <small>${esc(i.task)}</small>
    <span class="pill" style="margin-top:10px;align-self:flex-start">${esc(c.title)}</span>
  </button>`;
}

export async function renderLernimpulse(){
  const done=lernImpulseDone();
  const total=lernImpulse.length;
  const pct=Math.round((done.length/total)*100);

  return `${window.CampusFirebase.pageHead(
    "SELBSTSTÄNDIG LERNEN",
    "Lernimpulse",
    "Kleine Aufgaben, die deinen Lernprozess in Bewegung bringen.",
    `<button class="secondary" onclick="openRandomLernimpuls()">✨ Überraschungsimpuls</button>`
  )}

  <div class="card impulse-intro">
    <div class="impulse-progress-head">
      <div>
        <span class="badge">💡 DEIN LERNIMPULS</span>
        <h2>Wähle einen Impuls – und mach ihn wirklich.</h2>
        <p>Die Impulse sind kurz. Entscheidend ist nicht, wie viele du anklickst, sondern was du danach tatsächlich tust.</p>
      </div>
      <div class="impulse-count"><strong>${done.length}</strong><span>von ${total}<br>erledigt</span></div>
    </div>
    <div class="progress"><i style="width:${pct}%"></i></div>
    <div class="impulse-progress-label">${pct}% deines Impuls-Pools ausprobiert</div>
  </div>

  <div class="grid grid-4">
    ${lernImpulseKategorien.map(c=>{
      const count=lernImpulse.filter(i=>i.cat===c.id).length;
      const doneCount=lernImpulse.filter(i=>i.cat===c.id && done.includes(i.id)).length;
      return `<button class="card tile impulse-category" onclick="filterLernimpulse('${c.id}')">
        <span class="emoji">${c.icon}</span>
        <strong>${esc(c.title)}</strong>
        <small>${esc(c.text)}</small>
        <span class="pill" style="margin-top:9px">${doneCount}/${count}</span>
      </button>`;
    }).join("")}
  </div>

  <div id="impulseList" class="impulse-section">
    <div class="impulse-section-head">
      <div>
        <div class="kicker">ALLE IMPULSE</div>
        <h2>Was passt gerade zu dir?</h2>
      </div>
      <div class="chips" id="impulseFilters">
        <button class="chip impulse-filter active" onclick="filterLernimpulse('all')">Alle</button>
        ${lernImpulseKategorien.map(c=>`<button class="chip impulse-filter" onclick="filterLernimpulse('${c.id}')">${c.icon} ${esc(c.title)}</button>`).join("")}
      </div>
    </div>
    <div class="grid grid-3" id="impulseCards">
      ${lernImpulse.map(renderLernimpulsCard).join("")}
    </div>
  </div>

  <div class="card" style="margin-top:12px">
    <h3>🧭 Und danach?</h3>
    <p>Ein Impuls ist kein Selbstzweck. Wenn du weiterarbeiten möchtest, kannst du direkt in deinen nächsten Lernschritt gehen.</p>
    <div class="chips" style="margin-top:10px">
      <a class="chip" href="#ressourcen">📚 Lernressource</a>
      <a class="chip" href="#methoden">🧰 Lernmethode</a>
      <a class="chip" href="#lernpfad">🧭 Persönlicher Lernpfad</a>
      <a class="chip" href="#journal">📓 Lernjournal</a>
    </div>
  </div>
  ${window.CampusFirebase.footer()}`;
}

function filterLernimpulse(cat){
  const list=document.getElementById("impulseCards");
  if(!list)return;
  document.querySelectorAll(".impulse-filter").forEach(b=>b.classList.remove("active"));
  const clicked=[...document.querySelectorAll(".impulse-filter")].find(b=>
    b.textContent.includes(cat==="all"?"Alle":(lernImpulseCategory(cat)?.title||""))
  );
  if(clicked)clicked.classList.add("active");
  const data=cat==="all"?lernImpulse:lernImpulse.filter(i=>i.cat===cat);
  list.innerHTML=data.map(renderLernimpulsCard).join("");
}

function openRandomLernimpuls(){
  const done=lernImpulseDone();
  const open=lernImpulse.filter(i=>!done.includes(i.id));
  const pool=open.length?open:lernImpulse;
  const i=pool[Math.floor(Math.random()*pool.length)];
  openLernimpuls(i.id);
}

function openLernimpuls(id){
  const i=lernImpulseGet(id);
  if(!i)return;
  const c=lernImpulseCategory(i.cat);
  const done=lernImpulseDone();
  const isDone=done.includes(i.id);

  window.CampusFirebase.modal(`<button class="modal-close" onclick="closeModal()">×</button>
    <div class="kicker">${c.icon} ${esc(c.title)}</div>
    <h2>${esc(i.title)}</h2>
    <div class="card" style="margin-top:12px;background:var(--soft-green)">
      <strong>Dein Impuls</strong>
      <p style="font-size:18px;line-height:1.55;margin:10px 0 0">${esc(i.task)}</p>
    </div>
    <div class="notice" style="margin-top:12px">
      <strong>💡 Kleiner Hinweis</strong>
      <p style="margin-bottom:0">${esc(i.hint)}</p>
    </div>
    <div class="form" style="margin-top:14px">
      <label>✍️ Deine kurze Antwort / Notiz
        <textarea id="impulseAnswer" rows="4" placeholder="Was hast du herausgefunden, entschieden oder ausprobiert?"></textarea>
      </label>
      <div class="notice">
        <strong>➡️ Nächster Schritt</strong>
        <p style="margin-bottom:0">${esc(i.next)}</p>
      </div>
      <div class="form-actions">
        <button class="secondary" onclick="closeModal()">Später</button>
        <button class="primary" onclick="completeLernimpuls('${i.id}')">✓ Erledigt</button>
      </div>
    </div>
    <div class="chips" style="margin-top:12px">
      <a class="chip" href="#ressourcen" onclick="closeModal()">📚 Lernressource</a>
      <a class="chip" href="#methoden" onclick="closeModal()">🧰 Methode</a>
      <a class="chip" href="#lernpfad" onclick="closeModal()">🧭 Lernpfad</a>
      <a class="chip" href="#journal" onclick="closeModal()">📓 Lernjournal</a>
    </div>`);
}

function completeLernimpuls(id){
  const answer=document.getElementById("impulseAnswer")?.value.trim()||"";
  const done=lernImpulseDone();
  if(!done.includes(id))done.push(id);
  lernImpulseSaveDone(done);

  const i=lernImpulseGet(id);
  closeModal();
  toast("Impuls erledigt – weiter geht's.");

  window.CampusFirebase.modal(`<button class="modal-close" onclick="closeModal()">×</button>
    <div class="kicker">✓ GESCHAFFT</div>
    <h2>Gut gemacht.</h2>
    <p>Du hast den Impuls <strong>${esc(i?.title||"")}</strong> abgeschlossen.</p>
    ${answer?`<div class="card" style="margin-top:12px"><strong>Deine Notiz</strong><p style="margin-bottom:0">${esc(answer)}</p></div>`:""}
    <div class="notice" style="margin-top:12px">
      <strong>➡️ Dein nächster Schritt</strong>
      <p style="margin-bottom:0">${esc(i?.next||"Weiterlernen.")}</p>
    </div>
    <div class="form-actions" style="margin-top:14px">
      <button class="secondary" onclick="closeModal()">Fertig</button>
      <button class="primary" onclick="closeModal();openRandomLernimpuls()">✨ Nächster Impuls</button>
    </div>`);
}

window.openLernimpuls=openLernimpuls;
window.openRandomLernimpuls=openRandomLernimpuls;
window.filterLernimpulse=filterLernimpulse;
window.completeLernimpuls=completeLernimpuls;
