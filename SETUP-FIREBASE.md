# Firebase einrichten – Campusklasse 26/27

Diese Version ist für **GitHub Pages + Firebase Authentication + Cloud Firestore** vorbereitet.

Die aktuelle Firebase-Webdokumentation empfiehlt für neue Web-Apps die modulare SDK und unterstützt Browser-Module über `gstatic.com`. Diese App nutzt genau diesen Weg.

## 1. Firebase-Projekt anlegen

Öffne die Firebase Console:

https://console.firebase.google.com/

1. Google-Konto anmelden.
2. **Add project / Projekt hinzufügen**.
3. Projekt z. B. `campusklasse-26-27` nennen.
4. Analytics kannst du für diese Schulplattform zunächst weglassen.
5. Projekt erstellen.

## 2. Web-App registrieren

Im Firebase-Projekt:

1. Projektübersicht öffnen.
2. Auf das Web-Symbol `</>` klicken.
3. App-Nickname z. B. `Campusklasse Web`.
4. **Register app**.
5. Firebase zeigt dir einen `firebaseConfig`-Block.

Diesen Block brauchst du gleich.

## 3. Authentication aktivieren

Firebase Console → **Authentication** → **Sign-in method**

Aktiviere:

**Email/Password**

Weitere Anbieter brauchst du für die erste Version nicht.

## 4. Firestore anlegen

Firebase Console → **Firestore Database** → **Create database**

Für den produktiven Betrieb solltest du die Datenbank nicht dauerhaft mit offenen Testregeln betreiben.

Danach:

**Firestore → Rules**

Den kompletten Inhalt aus `firestore.rules` dieses Pakets einsetzen und veröffentlichen.

Die Regeln verlangen eine Anmeldung und unterscheiden außerdem zwischen Schülern und Lehrkräften/Admins.

## 5. Firebase-Konfiguration in app.js einsetzen

Öffne `app.js`.

Ganz oben findest du:

```js
const firebaseConfig = {
  apiKey: "HIER_EINTRAGEN",
  authDomain: "DEIN-PROJEKT.firebaseapp.com",
  projectId: "DEIN-PROJEKT",
  storageBucket: "DEIN-PROJEKT.firebasestorage.app",
  messagingSenderId: "HIER_EINTRAGEN",
  appId: "HIER_EINTRAGEN"
};
```

Ersetze diesen Block durch den Block aus deiner Firebase Console.

Beispielstruktur:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "campusklasse-26-27.firebaseapp.com",
  projectId: "campusklasse-26-27",
  storageBucket: "campusklasse-26-27.firebasestorage.app",
  messagingSenderId: "...",
  appId: "..."
};
```

Die Firebase-Web-Konfiguration ist für Client-Web-Apps vorgesehen. Sie ist **kein Passwort für die Datenbank**. Der eigentliche Schutz erfolgt über Authentication und Firestore Security Rules.

## 6. Dateien zu GitHub

In deinem bestehenden Repository:

**Add file → Upload files**

Diese Dateien direkt ins Hauptverzeichnis laden:

- `index.html`
- `styles.css`
- `app.js`
- `logo.jpg`
- `firestore.rules`
- `firestore.indexes.json`
- `firebase.json`
- `README.md`
- `.nojekyll`
- `SETUP-FIREBASE.md`

Vorhandene `index.html`, `styles.css` und `app.js` ersetzen.

## 7. GitHub Pages

Im Repository:

**Settings → Pages**

Bei Source:

**Deploy from a branch**

Branch:

**main**

Ordner:

**/(root)**

Speichern.

## 8. Firebase für deine GitHub-Adresse freigeben

Firebase Console → **Authentication → Settings → Authorized domains**

Füge deine GitHub-Pages-Domain hinzu.

Beispiel:

```text
deinname.github.io
```

Wenn die Plattform unter einem Repository läuft, lautet die Adresse typischerweise:

```text
https://deinname.github.io/campusklasse-26-27/
```

Als Authorized Domain wird trotzdem nur die Domain `deinname.github.io` benötigt.

## 9. Erstes Konto anlegen

Öffne anschließend deine GitHub-Pages-Seite.

Klicke:

**Konto erstellen**

und lege ein Testkonto an.

Danach sollte das Benutzerprofil automatisch in Firestore unter

```text
users
```

angelegt werden.

Neue Konten erhalten zunächst automatisch die Rolle:

```text
student
```

## 10. Lehrkraft/Admin einrichten

Für die erste Version wird die Rolle nicht über die öffentliche Registrierung vergeben.

Das ist absichtlich so.

Nach dem ersten Anlegen deines eigenen Kontos:

Firebase Console → Firestore Database → `users`

Dein Benutzer-Dokument öffnen.

Dort:

```text
role = teacher
```

setzen.

Mögliche Rollen:

```text
student
teacher
admin
```

Damit können Lehrkräfte/Admins in der App auch Inhalte löschen, während Schüler ihre eigenen Inhalte verwalten können.

## 11. Was jetzt zentral gespeichert wird

Im Gegensatz zur vorherigen Version liegen die Daten nicht mehr nur im Browser.

Cloud Firestore enthält:

```text
users
tasks
posts
projects
practice
calendar
journal
competencies
```

Damit kann z. B.:

Schüler A → Beitrag schreiben

und

Schüler B → denselben Beitrag sehen und beantworten.

Das ist der entscheidende Unterschied zur reinen GitHub-Pages-Version.

## 12. Datenschutz

Für eine Schule solltest du vor dem echten Einsatz insbesondere klären:

- Welche personenbezogenen Daten werden gespeichert?
- Welche Namen werden angezeigt?
- Welche E-Mail-Adressen werden verwendet?
- Wer darf welche Inhalte sehen?
- Wie lange werden Daten gespeichert?
- Welche Firebase-/Google-Dienste sind schulisch zulässig?
- Welche Vorgaben des Schulträgers bzw. der Schule gelten?

Die App ist technisch vorbereitet, ersetzt aber keine schulische Datenschutzprüfung.

## 13. Empfohlener nächster Ausbau

Für den echten Einsatz mit ca. 35 Schülern würde ich danach noch ergänzen:

- Einladungscode für die Campusklasse
- Lehrkraft-/Adminbereich
- Teilnehmerliste
- Rollenverwaltung
- Arbeitspakete mit 12 festen Karten
- Datei-/Materialablage
- Benachrichtigungen
- Projektteams
- persönliche Dashboards
- Datenschutz-/Impressumsseite
- ggf. schulische Single-Sign-on-Lösung, sofern technisch und organisatorisch möglich

