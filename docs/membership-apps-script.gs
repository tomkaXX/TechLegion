/**
 * TechLegion → Google Sheet router + auto-acknowledgement emails
 *
 * Routes incoming form submissions to the correct sheet based on `form_type`:
 *   - form_type=membership (default)        → "Applications"              sheet
 *   - form_type=cohort + cohort=cca-f       → "Claude AI"                 sheet
 *   - form_type=cohort + cohort=uas         → "UAS Drone Pilot"           sheet
 *   - form_type=contact                     → "Contact Messages"          sheet
 *   - form_type=newsletter                  → "Newsletters"               sheet
 *   - form_type=study_tour                  → "Study Tour Registrations"  sheet
 *
 * For EVERY submission, an acknowledgement email is automatically sent to
 * the submitter's email address confirming receipt.
 *
 * Setup:
 *   1. Open the Google Sheet you already use for TechLegion applications.
 *   2. Extensions → Apps Script. Replace the existing code with this file. Save.
 *   3. Deploy → Manage deployments → pencil icon → New version → Deploy.
 *      The Web App URL stays the same — no need to update anything in the HTML.
 *   4. Submit a test from each form — sheets are created automatically on first use.
 */

var MEMBERSHIP_SHEET    = 'Applications';
var CONTACT_SHEET       = 'Contact Messages';
var NEWSLETTER_SHEET    = 'Newsletters';
var STUDY_TOUR_SHEET    = 'Study Tour Registrations';
var COHORT_SHEETS = {
  'cca-f': 'Claude AI',
  'uas':   'UAS Drone Pilot'
};

var FROM_NAME    = 'TechLegion Switzerland';
var REPLY_TO     = 'community@techlegion.ch';
var WEBSITE_URL  = 'https://techlegion.ch';

// ─── Column headers ──────────────────────────────────────────────────────────

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

var STUDY_TOUR_HEADERS = [
  'Timestamp', 'Tour',
  'First name', 'Last name',
  'Email', 'Phone',
  'TechLegion member?',
  'Notes / requirements'
];

// ─── Router ──────────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    var p = e.parameter || {};
    var formType = (p.form_type || 'membership').toLowerCase();

    if (formType === 'cohort')      return handleCohort(p);
    if (formType === 'contact')     return handleContact(p);
    if (formType === 'newsletter')  return handleNewsletter(p);
    if (formType === 'study_tour')  return handleStudyTour(p);
    return handleMembership(p);
  } catch (err) {
    return jsonOut({ ok: false, error: err.message });
  }
}

// ─── Handlers ────────────────────────────────────────────────────────────────

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

  sendAcknowledgement(p.email, p.first_name, 'membership');
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

  sendAcknowledgement(p.email, p.first_name, 'cohort');
  return jsonOut({ ok: true, type: 'cohort', sheet: sheetName });
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

  sendAcknowledgement(p.email, p.first_name, 'contact');
  return jsonOut({ ok: true, type: 'contact' });
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

  sendAcknowledgement(p.email, p.first_name, 'newsletter');
  return jsonOut({ ok: true, type: 'newsletter' });
}

function handleStudyTour(p) {
  var sheet = ensureSheet(STUDY_TOUR_SHEET, STUDY_TOUR_HEADERS);
  sheet.appendRow([
    new Date(),
    p.tour_choice || '',
    p.first_name || '',
    p.last_name || '',
    p.email || '',
    p.phone || '',
    p.is_member || '',
    p.notes || ''
  ]);

  sendAcknowledgement(p.email, p.first_name, 'study_tour', p.tour_choice);
  return jsonOut({ ok: true, type: 'study_tour' });
}

// ─── Acknowledgement emails ───────────────────────────────────────────────────

/**
 * Sends an acknowledgement-of-receipt email to the submitter.
 *
 * @param {string} toEmail     - Recipient address
 * @param {string} firstName   - Recipient first name (may be empty)
 * @param {string} formType    - One of: membership | cohort | contact | newsletter | study_tour
 * @param {string} [extra]     - Optional extra context (e.g. tour name)
 */
function sendAcknowledgement(toEmail, firstName, formType, extra) {
  if (!toEmail || toEmail.indexOf('@') === -1) return; // guard

  var greeting = firstName ? ('Hi ' + firstName + ',') : 'Hello,';
  var subject, body;

  switch (formType) {

    case 'membership':
      subject = 'TechLegion — we received your membership application';
      body =
        greeting + '\n\n' +
        'Thank you for applying to join TechLegion Verein. We have received your application and the TechLegion board will review it shortly.\n\n' +
        'What happens next:\n' +
        '  1. The board reviews your application (usually within 5 working days).\n' +
        '  2. We may reach out for a short intro call.\n' +
        '  3. If approved, you\'ll receive an invoice with payment details.\n' +
        '  4. Membership activates on receipt of payment.\n\n' +
        'If you have any questions in the meantime, just reply to this email.\n\n' +
        'Warm regards,\nThe TechLegion Team\n' +
        WEBSITE_URL;
      break;

    case 'cohort':
      subject = 'TechLegion — study group interest received';
      body =
        greeting + '\n\n' +
        'Thanks for expressing interest in one of our study groups! We\'ve received your registration and will be in touch with details about the next available cohort.\n\n' +
        'In the meantime, feel free to join our WhatsApp community at ' + WEBSITE_URL + '/events.html to stay updated.\n\n' +
        'Warm regards,\nThe TechLegion Team\n' +
        WEBSITE_URL;
      break;

    case 'contact':
      subject = 'TechLegion — acknowledgement of receipt';
      body =
        greeting + '\n\n' +
        'Thank you for getting in touch with TechLegion. We have received your message and will get back to you as soon as possible — usually within a few working days.\n\n' +
        'If your matter is urgent, you can also reach us directly at ' + REPLY_TO + '.\n\n' +
        'Warm regards,\nThe TechLegion Team\n' +
        WEBSITE_URL;
      break;

    case 'newsletter':
      subject = 'TechLegion — you\'re on the list!';
      body =
        greeting + '\n\n' +
        'Thanks for subscribing to the TechLegion newsletter. You\'ll receive updates on upcoming events, study groups and community news.\n\n' +
        'You can unsubscribe at any time by replying to any newsletter email.\n\n' +
        'Warm regards,\nThe TechLegion Team\n' +
        WEBSITE_URL;
      break;

    case 'study_tour':
      var tourNames = {
        'gosgen-25-jul-2026': 'the Kernkraftwerk Gösgen-Däniken visit on 25 July 2026',
        'cern-jul-2026':      'the CERN visit (July 2026)'
      };
      var tourLabel = (extra && tourNames[extra]) ? tourNames[extra] : (extra || 'the upcoming study tour');
      subject = 'TechLegion — study tour registration received';
      body =
        greeting + '\n\n' +
        'Thank you for registering your interest in ' + tourLabel + '.\n\n' +
        'We\'ve noted your registration. Here\'s what to expect:\n' +
        '  • We\'ll confirm your spot once the final tour date and logistics are set.\n' +
        '  • TechLegion association members have priority — if you\'re not yet a member, you can apply at ' + WEBSITE_URL + '/membership.html\n' +
        '  • Group size is limited, so early registration is appreciated.\n\n' +
        'We\'ll be in touch soon with more details. If you have any questions in the meantime, reply to this email.\n\n' +
        'Warm regards,\nThe TechLegion Team\n' +
        WEBSITE_URL;
      break;

    default:
      subject = 'TechLegion — acknowledgement of receipt';
      body =
        greeting + '\n\n' +
        'Thank you for contacting TechLegion. We have received your submission and will follow up shortly.\n\n' +
        'Warm regards,\nThe TechLegion Team\n' +
        WEBSITE_URL;
  }

  try {
    MailApp.sendEmail({
      to:       toEmail,
      subject:  subject,
      body:     body,
      name:     FROM_NAME,
      replyTo:  REPLY_TO
    });
  } catch (mailErr) {
    // Log but don't fail the whole submission if email fails
    Logger.log('sendAcknowledgement error: ' + mailErr.message);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

/**
 * Run once from the script editor to bootstrap all sheets.
 */
function setup() {
  ensureSheet(MEMBERSHIP_SHEET, MEMBERSHIP_HEADERS);
  ensureSheet(COHORT_SHEETS['cca-f'], COHORT_HEADERS);
  ensureSheet(COHORT_SHEETS['uas'], COHORT_HEADERS);
  ensureSheet(CONTACT_SHEET, CONTACT_HEADERS);
  ensureSheet(NEWSLETTER_SHEET, NEWSLETTER_HEADERS);
  ensureSheet(STUDY_TOUR_SHEET, STUDY_TOUR_HEADERS);
  Logger.log('All sheets ready.');
}
