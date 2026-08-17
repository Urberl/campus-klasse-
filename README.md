# Campusklasse 26/27 – Firebase Edition

Gemeinsame Webplattform für die Campusklasse der FOSBOS Weilheim.

## Architektur

**Frontend:** GitHub Pages  
**Login:** Firebase Authentication (E-Mail + Passwort)  
**Datenbank:** Cloud Firestore  
**Logo:** FOSBOS Weilheim

## Bereiche

- Startseite
- Mein Campus-Kompass
- Lernwerkstatt
- Campus-Forum
- Projekte
- Kompetenzwerkstatt
- Lernjournal
- Praktikum & Praxis
- KI-Innovationslabor
- Campus-Kalender
- Team & SQ

## Zentrale Daten

Die Anwendung speichert die gemeinsamen Inhalte in Cloud Firestore.

Persönliche Inhalte wie Lernjournal und Kompetenzprofil sind an die jeweilige Benutzer-ID gebunden.

## Ampel

- 🟢 Auf Kurs
- 🟡 Klärungsbedarf
- 🔴 Handlungsbedarf

## Wichtig

Vor dem ersten Start muss `app.js` mit der Firebase-Konfiguration des eigenen Firebase-Projekts versehen werden.

Danach müssen in Firebase:

1. Authentication → Email/Password aktivieren
2. Firestore Database anlegen
3. `firestore.rules` veröffentlichen
4. die GitHub-Pages-Domain als Authorized Domain eintragen

Eine vollständige Schritt-für-Schritt-Anleitung befindet sich in:

`SETUP-FIREBASE.md`

## Sicherheit

Die Firestore-Regeln verlangen eine Anmeldung. Schüler erhalten bei der Registrierung automatisch die Rolle `student`. Eine Lehrkraft/Admin-Rolle muss anschließend kontrolliert in Firestore vergeben werden.

Vor dem Einsatz mit echten Schülerdaten sind Datenschutz und schulische IT-Vorgaben zu prüfen.
