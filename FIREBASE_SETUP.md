# Firebase-instelling voor 30 Sekontjes

Projectnummer: `963419535029`

## Nog uitvoeren in Firebase Console

1. Open het bestaande project dat bij projectnummer `963419535029` hoort.
2. Ga naar **Projectinstellingen > Jouw apps > App toevoegen > Web**.
3. Registreer de app, bijvoorbeeld met bijnaam `30-sekontjes-web`.
4. Kopieer het getoonde `firebaseConfig`-object naar `index.html`.
5. Ga naar **Authentication > Sign-in method** en schakel **E-mail/wachtwoord** in.
6. Ga naar **Firestore Database** en maak de standaarddatabase aan, bij voorkeur in een Europese locatie die past bij de rest van het project.
7. Plaats de inhoud van `firestore.rules` bij **Firestore Database > Rules** en publiceer deze.

## Lokaal testen

Start de bestanden via een webserver, niet via `file://`, bijvoorbeeld:

```bash
python -m http.server 8080
```

Open daarna `http://localhost:8080`.

## Optioneel via Firebase CLI

```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only firestore:rules,hosting
```

Selecteer bij `firebase use --add` het project dat hoort bij projectnummer `963419535029`.
