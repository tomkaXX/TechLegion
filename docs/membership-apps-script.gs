/**
 * TechLegion → Google Sheet router
 *
 * Routes incoming form submissions to the correct sheet based on `form_type`:
 *   - form_type=membership (default)        → "Applications"     sheet
 *   - form_type=cohort + cohort=cca-f       → "Claude AI"        sheet
 *   - form_type=cohort + cohort=uas         → "UAS Drone Pilot"  sheet
 *   - form_type=contact                     → "Contact Messages" sheet
 *
 * Setup:
 *   1. Open the Google Sheet you already use for TechLegion applications.
 *   2. Extensions → Apps Script. Replace the existing code with this file. Save.
 *   3. Deploy → Manage deployments → pencil icon → New version → Deploy.
 *      The Web App URL stays the same.
 *   4. Submit a test from each form — the four sheets are created
 *      automatically on first use.
 */

var MEMBERSHIP_SHEET = 'Applications';
var CONTACT_SHEET    = 'Contact Messages';
var NEWSLETTER_SHEET = 'Newsletters';
var COHORT_SHEETS = {
  'cca-f': 'Claude AI',
  'uas':   'UAS Drone Pilot'
};

var MEMBERSHIP_HEADERS = [
  'Timestamp', 'Membership type',
  'First name', 'Last name', 'Date of birth', 'Gender', 'Nationality',
  'Email', 'Phone', 'Address', 'Postal code', 'City', 'Country',
  'Occupation', 'Company', 'LinkedIn', 'Areas of interest',
  'Enrol — name', 'Enrol — role', 'Enrol — email', 'Enrol — phone',
  'Referral source', 'Motivation',
  'Accepted statutes', 'Accepted privacy', 'Consented to data', 'Newsletter opt-in'
];

var COHORT_HEADERS = [
  'Timestamp', 'Cohort',
  'First name', 'Last name',
  'Email', 'Phone',
  'Motivation / notes'
];

var CONTACT_HEADERS = [
  'Timestamp',
  'First name', 'Last name',
  'Email', 'Phone',
  'Message',
  'Newsletter opt-in'
];

var NEWSLETTER_HEADERS = [
  'Timestamp',
  'First name', 'Last name',
  'Email',
  'Consent'
];

function doPost(e) {
  try {
    var p = e.parameter || {};
    var formType = (p.form_type || 'membership').toLowerCase();

    if (formType === 'cohort')     return handleCohort(p);
    if (formType === 'contact')    return handleContact(p);
    if (formType === 'newsletter') return handleNewsletter(p);
    return handleMembership(p);
  } catch (err) {
    return jsonOut({ ok: false, error: err.message });
  }
}

function handleMembership(p) {
  var sheet = ensureSheet(MEMBERSHIP_SHEET, MEMBERSHIP_HEADERS);
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
  return jsonOut({ ok: true, type: 'membership' });
}

function handleCohort(p) {
  var cohort = (p.cohort_choice || p.cohort || '').toLowerCase();
  var sheetName = COHORT_SHEETS[cohort] || 'Cohort Interest';
  var sheet = ensureSheet(sheetName, COHORT_HEADERS);
  sheet.appendRow([
    new Date(),
    cohort,
    p.first_name || '',
    p.last_name || '',
    p.email || '',
    p.phone || '',
    p.motivation || ''
  ]);
  return jsonOut({ ok: true, type: 'cohort', sheet: sheetName });
}

function handleNewsletter(p) {
  var sheet = ensureSheet(NEWSLETTER_SHEET, NEWSLETTER_HEADERS);
  var yesNo = function (v) { return v ? 'yes' : ''; };
  sheet.appendRow([
    new Date(),
    p.first_name || '',
    p.last_name || '',
    p.email || '',
    yesNo(p.consent)
  ]);
  return jsonOut({ ok: true, type: 'newsletter' });
}

function handleContact(p) {
  var sheet = ensureSheet(CONTACT_SHEET, CONTACT_HEADERS);
  var yesNo = function (v) { return v ? 'yes' : ''; };
  sheet.appendRow([
    new Date(),
    p.first_name || '',
    p.last_name || '',
    p.email || '',
    p.phone || '',
    p.message || '',
    yesNo(p.newsletter)
  ]);
  return jsonOut({ ok: true, type: 'contact' });
}

function ensureSheet(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Run once from the editor to bootstrap all five sheets.
function setup() {
  ensureSheet(MEMBERSHIP_SHEET, MEMBERSHIP_HEADERS);
  ensureSheet(COHORT_SHEETS['cca-f'], COHORT_HEADERS);
  ensureSheet(COHORT_SHEETS['uas'], COHORT_HEADERS);
  ensureSheet(CONTACT_SHEET, CONTACT_HEADERS);
  ensureSheet(NEWSLETTER_SHEET, NEWSLETTER_HEADERS);
  Logger.log('All sheets ready.');
}
