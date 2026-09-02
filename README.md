# Sicherheitseinweisung Anlieferer — TESTVERSION

> **Diese Fassung verschickt KEINE Mails an Niederlassungen.**
> Jede Bestätigung geht ausschließlich an **digital-services@wego-vti.de**,
> unabhängig vom eingestellten Standort. Betreff und Mailtext sind entsprechend
> als Test gekennzeichnet und nennen die Adresse, an die produktiv gegangen wäre.

Produktivfassung: <https://github.com/MarkusEsser167/Sicherheitseinweisung-Anlieferer>
· live unter <https://markusesser167.github.io/Sicherheitseinweisung-Anlieferer/>

## Unterschiede zur Produktivfassung

Bewusst klein gehalten, damit sich Änderungen leicht übernehmen lassen:

| Datei | Unterschied |
|---|---|
| `js/mail.js` | `TEST_RECIPIENT` gesetzt; Empfänger wird ersetzt, Betreff mit `[TEST]`, Hinweisblock im Mailtext |
| `js/app.js` | hängt den roten `TESTVERSION`-Banner ein |
| `css/styles.css` | Gestaltung des Banners (`.test-banner`) |
| `manifest.webmanifest`, `index.html` | Name, Titel und Themenfarbe als Test gekennzeichnet |
| `icons/*`, `scripts/make_icons.py` | Icon rot statt grün |
| `sw.js` | eigener `CACHE_NAME` |

Der Banner hängt an derselben Konstante wie die Umleitung: solange Mails
umgeleitet werden, ist der Banner sichtbar. Beides kann nicht auseinanderlaufen.

**Auf Produktivverhalten umstellen:** `TEST_RECIPIENT` in `js/mail.js` auf `null`
setzen — dann verschwindet auch der Banner. Für den echten Betrieb ist aber die
Produktivfassung gedacht, nicht dieses Repo.

**Änderungen aus der Produktivfassung übernehmen:** Dateien kopieren, danach nur
die Zeilen aus der Tabelle oben wieder anwenden.

---

## Ablauf für den Fahrer

1. **Startseite** – Sprachauswahl über Flaggen (15 Sprachen).
2. **Regelseite** – die sechs Punkte in der gewählten Sprache; jeder Punkt wird
   **einzeln** bestätigt. "Weiter" ist gesperrt, bis alle sechs bestätigt sind.
3. **Abschlussseite** – **KFZ-Kennzeichen** und **Fahrername** sind Pflicht,
   dazu eine Unterschrift per Finger. "Bestätigen und senden" ist gesperrt,
   solange ein Pflichtfeld leer ist.
4. **Bestätigung** – PDF geht an die Standort-Mailadresse; nach 25 Sekunden
   springt die App von selbst auf die Startseite zurück, damit der nächste
   Fahrer keine fremden Daten sieht.

Der **Standort** wird einmal pro Gerät eingerichtet (Suchfeld über alle 52
Niederlassungen) und bleibt dann in `localStorage` gespeichert. Der Fahrer sieht
ihn nur oben in der Leiste; geändert wird er über "Ändern".

## Sprachen

Deutsch, English, Ελληνικά, Italiano, Hrvatski, Nederlands, Polski, Română,
Slovenčina, Čeština, Türkçe, Українська, Български, Русский — dazu **Magyar**,
weil der offizielle Aushang auch auf Ungarisch vorliegt und die Aufnahme nichts
gekostet hat. Nicht gewünscht? Den `hu`-Block in `js/i18n.js` löschen.

> **Wichtig:** Regeltexte, Bestätigungssatz und Feldbeschriftungen sind
> **wortgleich** aus den offiziellen PDFs
> `BETRIEBSGELAENDE_REGELN_<SPRACHE>_*.pdf` übernommen — das ist der rechtlich
> relevante Text. Nur die Bedienoberfläche (Knöpfe, Hinweise) wurde für diese
> App übersetzt. Ändern sich die Aushänge, müssen die Texte in `js/i18n.js`
> nachgezogen werden.

## Das PDF

Zweisprachig: oben der Text in der Sprache des Fahrers, darunter klein und grau
der deutsche Text. Die Niederlassung kann so nachvollziehen, was bestätigt
wurde, ohne die Fremdsprache zu lesen. Bei Auswahl "Deutsch" entfällt die
Wiederholung. Alle 15 Sprachen passen auf eine A4-Seite.

Enthalten: Standort, Zeitpunkt, Sprache, die sechs abgehakten Punkte,
Bestätigungssatz, Fahrername, Kennzeichen und Unterschrift.

### Warum eine eingebettete Schrift

jsPDF bringt nur WinAnsi-Standardschriften mit — Griechisch, Kyrillisch und ein
Teil der türkischen und osteuropäischen Zeichen kämen als leere Kästchen im PDF
an. Deshalb liegt in `fonts/dejavu.js` eine auf die benötigten Unicode-Blöcke
reduzierte Fassung von DejaVu Sans (Regular + Bold, je ~100 KB statt ~750 KB).

Neu erzeugen (nur nötig, wenn Sprachen mit anderen Schriftsystemen dazukommen):

```bash
pip install fonttools brotli && python scripts/make_font.py
```

## Mailversand

Nutzt dieselbe deployte Apps-Script-Web-App wie die Produktivfassung
(`MAIL_SCRIPT_URL` in `js/mail.js`), verschickt aber ausschließlich an
`TEST_RECIPIENT`. Das Skript selbst (`apps-script/Code.gs`) lässt ohnehin nur
Adressen der Domain `wego-vti.de` zu.

Ob eine Mail wirklich rausging, ist clientseitig nicht auslesbar — die
`/exec`-URL leitet auf `script.googleusercontent.com` um, das keine CORS-Header
sendet, deshalb `mode: 'no-cors'` und eine undurchsichtige Antwort. Nachsehen im
Ausführungsprotokoll des Apps-Script-Projekts ("Ausführungen") oder im Postfach
von `digital-services@wego-vti.de`.

## Standortliste pflegen

`js/locations.js` wird aus `data/niederlassungen.xlsx` erzeugt (Spalten
`NDL | Niederlassung | E-Mail`). Bei Änderungen die Excel-Datei ersetzen und:

```bash
pip install openpyxl && python scripts/make_locations.py
```

## Offline

Einweisung, PDF-Erzeugung und Protokoll funktionieren ohne Netz — nur der
Mailversand braucht eine Verbindung. Ohne Netz wird das PDF heruntergeladen und
der Eintrag im Protokoll als "offen" geführt; die Abschlussseite sagt dem Fahrer
in seiner Sprache, dass er das PDF im Büro abgeben soll.

Das Protokoll (`#/protokoll`, Link unten auf der Startseite) listet alle
Einweisungen des Geräts mit Status — als Nachweis, falls eine Mail nicht
ankommt. Unterschriftsbilder werden dort **nicht** gespeichert, nur im PDF.

**Nach jeder Änderung an den Dateien `CACHE_NAME` in `sw.js` hochzählen**, sonst
liefern bereits installierte Geräte weiter die alte Fassung aus.

## Entwicklung

```bash
python -m http.server 8424 --directory sicherheitseinweisung-pwa-test
```

Oder über die Vorschau-Konfiguration `sicherheitseinweisung-pwa-test` in
`.claude/launch.json`.

Icons neu bauen: `pip install pillow && python scripts/make_icons.py`

## Aufbau

```
index.html              App-Hülle
css/styles.css          Gestaltung (große Trefferflächen, kräftige Kontraste)
js/app.js               Hash-Router
js/i18n.js              alle Übersetzungen (offizielle Regeltexte!)
js/flags.js             Flaggen als Inline-SVG
js/locations.js         52 Niederlassungen + Mailadressen (generiert)
js/settings.js          gespeicherter Standort (localStorage)
js/session.js           Zustand der laufenden Einweisung (nur im Speicher)
js/db.js                Protokoll (IndexedDB)
js/pdf.js               PDF-Erzeugung (jsPDF + Unicode-Schrift)
js/signature.js         Unterschriftenfeld
js/mail.js              Versand über Apps-Script-Webhook
js/views/               die einzelnen Seiten
fonts/dejavu.js         eingebettete Unicode-Schrift (generiert)
apps-script/Code.gs     Google-Apps-Script-Webhook
scripts/                Generatoren für Schrift, Standorte, Icons
```

Flaggen sind bewusst **kein** Emoji: Windows stellt die Flaggen-Emojis nicht
dar, dort erschienen nur Buchstabenpaare.
