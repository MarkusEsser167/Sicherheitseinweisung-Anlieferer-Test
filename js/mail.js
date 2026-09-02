/**
 * Versand des Bestaetigungs-PDFs an die Standort-Mailadresse.
 *
 * Gleiches Muster wie in der Unfallaufnahme- und der Lagermeldungen-App: ein
 * Google-Apps-Script-Webhook nimmt das PDF als Base64 entgegen und verschickt
 * es per GmailApp. Siehe apps-script/Code.gs und README.md.
 *
 * EINRICHTUNG: MAIL_SCRIPT_URL unten auf die eigene /exec-URL setzen. Solange
 * dort der Platzhalter steht, laeuft die App vollstaendig, nutzt aber sofort
 * den Fallback (PDF-Download + vorbereiteter Mailentwurf).
 */

export const MAIL_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzQe4sEqJEwdhDE6g_uh5csxYJKpMuY9rX_jiKSG3cV7EBzJRTsYZ3bI-sCqJNFuiIC/exec";

/**
 * ===================== TESTVERSION =====================
 * Umleitung ALLER Bestaetigungsmails auf eine feste Adresse. Der Standort wird
 * weiterhin normal ausgewaehlt und steht auch im PDF - nur der Empfaenger der
 * Mail wird ersetzt, damit beim Testen keine echte Niederlassung Post bekommt.
 * Die eigentlich vorgesehene Adresse steht zur Kontrolle im Mailtext.
 *
 * Diese Konstante ist der EINZIGE inhaltliche Unterschied zur Produktivfassung.
 * Sie steuert zugleich den roten "TESTVERSION"-Banner in der App (siehe
 * js/app.js) - Umleitung und Warnhinweis koennen also nicht auseinanderlaufen.
 *
 * Auf null setzen = Produktivverhalten (Mail geht an den Standort).
 */
export const TEST_RECIPIENT = "digital-services@wego-vti.de";

function isConfigured() {
  return /^https:\/\/script\.google\.com\//.test(MAIL_SCRIPT_URL);
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function buildSubject(entry) {
  const subject = `Sicherheitseinweisung ${entry.plate} – ${entry.locationName}`;
  // Im Betreff erkennbar, damit eine Testmail im Posteingang nicht mit einer
  // echten Bestaetigung verwechselt wird.
  return TEST_RECIPIENT ? `[TEST] ${subject}` : subject;
}

function buildBody(entry) {
  const lines = [
    "Ein Anlieferer hat die Sicherheitseinweisung digital bestätigt.",
    "",
    `Standort:      ${entry.locationName} (${entry.locationId})`,
    `Fahrer:        ${entry.driverName}`,
    `Kennzeichen:   ${entry.plate}`,
    `Sprache:       ${entry.langName}`,
    `Zeitpunkt:     ${new Date(entry.createdAt).toLocaleString("de-DE")}`,
    "",
    "Die unterschriebene Bestätigung liegt als PDF im Anhang.",
    "",
    "Diese Mail wurde automatisch von der App \"Sicherheitseinweisung Anlieferer\" erzeugt.",
  ];

  if (TEST_RECIPIENT) {
    lines.unshift(
      "*** TESTVERSION - KEINE ECHTE BESTÄTIGUNG ***",
      "",
      `Produktiv wäre diese Mail gegangen an: ${entry.email}`,
      `Umgeleitet auf:                        ${TEST_RECIPIENT}`,
      ""
    );
  }

  return lines.join("\n");
}

/**
 * Loest den Browser-Download des PDFs aus - Rueckfallebene, wenn der Versand
 * nicht moeglich ist (kein Netz, Webhook nicht eingerichtet oder gestoert).
 */
export function downloadPdf(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/**
 * Verschickt das PDF ueber den Apps-Script-Webhook.
 *
 * Hinweis zu no-cors: Die /exec-URL leitet auf script.googleusercontent.com um,
 * das keine CORS-Header sendet. Ein normaler cors-Request wuerde deshalb auch
 * dann einen Fehler werfen, wenn die Mail serverseitig einwandfrei rausgeht.
 * Mit no-cors ist die Antwort undurchsichtig ("opaque") - ob der Versand
 * geklappt hat, laesst sich clientseitig also NICHT auslesen, nur im
 * Ausfuehrungsprotokoll des Apps-Script-Projekts bzw. im Postfach.
 *
 * @returns {Promise<"sent"|"unconfigured"|"failed">}
 */
export async function sendPdfByMail(entry, blob, filename) {
  if (!isConfigured()) return "unconfigured";
  if (!navigator.onLine) return "failed";

  try {
    const base64 = await blobToBase64(blob);
    await fetch(MAIL_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        // TESTVERSION: nie an die Niederlassung, immer an die Testadresse.
        to: TEST_RECIPIENT || entry.email,
        subject: buildSubject(entry),
        message: buildBody(entry),
        filename,
        mime_type: "application/pdf",
        file_base64: base64,
      }),
    });
    return "sent";
  } catch (err) {
    console.warn("Mailversand fehlgeschlagen", err);
    return "failed";
  }
}
