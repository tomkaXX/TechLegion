/**
 * TechLegion membership form → Google Sheet
 *
 * Setup:
 *   1. Create a new Google Sheet (e.g. "TechLegion Applications").
 *   2. Extensions → Apps Script. Delete the default code.
 *   3. Paste this entire file in. Save.
 *   4. Deploy → New deployment → type "Web app".
 *        - Execute as: Me (your Google account)
 *        - Who has access: Anyone
 *      Click Deploy, authorise, copy the Web App URL.
 *   5. Open membership.html, find MEMBERSHIP_ENDPOINT, paste the URL.
 *   6. Submit a test application — a new row should appear in the sheet.
 *
 * Re-deploying after edits: Deploy → Manage deployments → pencil icon →
 * "New version" → Deploy. The same URL keeps working.
 */

var SHEET_NAME = 'Applications';

var HEADERS = [
  'Timestamp', 'Membership type',
  'First name', 'Last name', 'Date of birth', 'Gender', 'Nationality',
  'Email', 'Phone', 'Address', 'Postal code', 'City', 'Country',
  'Occupation', 'Company', 'LinkedIn', 'Areas of interest',
  'Enrol — name', 'Enrol — role', 'Enrol — email', 'Enrol — phone',
  'Referral source', 'Motivation',
  'Accepted statutes', 'Accepted privacy', 'Consented to data', 'Newsletter opt-in'
];

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

    // Initialise header row on first run
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    var p = e.parameter || {};
    var yesNo = function (v) { return v ? 'yes' : ''; };

    sheet.appendRow([
      new Date(),
      p.membership_type || '',
      p.first_name || '',
      p.last_name || '',
      p.dob || '',
      p.gender || '',
      p.nationality || '',
      p.email || '',
      p.phone || '',
      p.address || '',
      p.postal || '',
      p.city || '',
      p.country || '',
      p.occupation || '',
      p.company || '',
      p.linkedin || '',
      p.interests || '',
      p.enrol_name || '',
      p.enrol_role || '',
      p.enrol_email || '',
      p.enrol_phone || '',
      p.referral || '',
      p.motivation || '',
      yesNo(p.statutes),
      yesNo(p.privacy),
      yesNo(p.data),
      yesNo(p.newsletter)
    ]);

    // Optional: email the board on every submission
    // MailApp.sendEmail({
    //   to: 'community@techlegion.ch',
    //   subject: 'New TechLegion membership application: ' + (p.first_name || '') + ' ' + (p.last_name || ''),
    //   body: 'Tier: ' + (p.membership_type || '') + '\nEmail: ' + (p.email || '') + '\n\nSee the sheet for full details.'
    // });

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Optional helper: open the sheet URL → run setup() once to test the script
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  Logger.log('Setup complete. Sheet: ' + sheet.getName());
}
