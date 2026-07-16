# Dirty Seconds

Mobiele browsergame met Firebase Authentication en Cloud Firestore.

## Apps

- `/`: spelersapp. Spelers vullen alleen een alias en vierletterige spelcode in. Firebase meldt hen op de achtergrond anoniem aan.
- `/admin/`: beheerapp voor `simon.reede@gmail.com`. De beheerder maakt spellen aan, deelt teams in, start of reset spellen en kan spelers of ruimtes verwijderen.

## Firebase

Project-ID: `sekontjes`  
Projectnummer: `963419535029`

Benodigde Authentication-providers:

- Anonymous voor spelers
- Email/Password voor de beheerder

Het admin-e-mailadres moet geverifieerd zijn. Publiceer na wijzigingen ook `firestore.rules`.

## Belangrijke bestanden

- `index.html`: startpunt spelersapp
- `admin/index.html` en `admin/admin.js`: beheerapp
- `kaarten.json`: kaartenset
- `firestore.rules`: toegangsregels
- `firebase.json`: Hosting- en Rules-configuratie
