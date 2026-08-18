# Campusklasse 26/27 – Lernbegleitung

Diese Version erweitert die funktionierende Campusklasse um einen geschützten Bereich **„Lernbegleitung“** für Lehrkräfte.

## Enthalten

- `index.html`
- `app.js`
- `styles.css`
- `logo.jpg`
- `firestore.rules`
- `README-Lernbegleitung.md`

## Rollen

Neue Konten werden grundsätzlich als `student` angelegt.

Eine Lehrkraft wird einmalig in Firebase Firestore als `teacher` gesetzt. Schüler können ihre eigene Rolle nicht selbst auf `teacher` ändern.

## Lehrkraft einrichten

1. In Firebase → Authentication den Lehrer-Account anlegen.
2. In Firestore → Sammlung `users` das Dokument mit der UID dieses Accounts öffnen.
3. Das Feld `role` von `student` auf `teacher` ändern.
4. Speichern.
5. In der Campusklasse abmelden und erneut anmelden.

Danach erscheint im Menü **Lernbegleitung**.

## Lernbegleitung

Lehrkräfte sehen dort:
- Anzahl der Schüler
- Ampelübersicht der Aufgaben
- Aufgaben pro Schüler
- Kompetenzen
- letzte Lernjournal-Einträge
- eine geschützte Schüleransicht als Gesprächsgrundlage

Die Schüler sehen den Lehrerbereich nicht.

## Firestore-Regeln

Die Datei `firestore.rules` enthält Regeln, die verhindern, dass Schüler ihre Rolle selbst auf `teacher` ändern.

Vor dem Einsatz mit echten Schülerdaten sollte die Schule die Regeln und den Datenschutz prüfen.


## Lerncoaching-Dashboard

Die Lehrkraft-Ansicht wurde erweitert. Beim Öffnen eines Schülers werden zusammengeführt:
- aktueller Aufgabenstand und Ampel
- zugeordnete Projekte
- Kompetenzprofil mit Durchschnitt
- letzte Lernjournal-Einträge
- automatisch erzeugte Gesprächsimpulse unter „Was braucht dieser Schüler gerade?“

Die Gesprächsimpulse sind ausdrücklich nur Anlässe zum Nachfragen und keine Diagnose.
