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
 *   - form_type=nomination                  → "Dinner Nominations"       sheet
 *   - form_type=dinner_pledge                → "Dinner Pledges"           sheet
 *   - form_type=spaceapps_mentor             → "Space Apps Mentors"       sheet
 *   - form_type=spaceapps_judge              → "Space Apps Judges"        sheet
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
var NOMINATION_SHEET    = 'Dinner Nominations';
var DINNER_PLEDGE_SHEET = 'Dinner Pledges';
var SPACEAPPS_MENTOR_SHEET = 'Space Apps Mentors';
var SPACEAPPS_JUDGE_SHEET  = 'Space Apps Judges';
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
  'Email', 'Phone', 'LinkedIn',
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

var NOMINATION_HEADERS = [
  'Timestamp',
  'Nominator name', 'Nominator email',
  'Nominee name', 'Nominee LinkedIn', 'Nominee company / role',
  'Reason',
  'Consent to contact nominee', 'Accepted privacy'
];

var DINNER_PLEDGE_HEADERS = [
  'Timestamp',
  'Pledger name', 'Pledger email',
  'Nominee', 'Pledge amount (CHF)', 'Message',
  'Accepted privacy'
];

var SPACEAPPS_MENTOR_HEADERS = [
  'Timestamp',
  'Full name', 'Email', 'Phone', 'LinkedIn',
  'Area(s) of expertise', 'Relevant experience',
  'Availability', 'Prior Space Apps experience', 'Notes',
  'Accepted privacy'
];

var SPACEAPPS_JUDGE_HEADERS = [
  'Timestamp',
  'Full name', 'Email', 'Phone', 'LinkedIn',
  'Judging area(s) of expertise', 'Relevant experience',
  'Availability', 'Prior Space Apps experience', 'Notes',
  'Accepted privacy'
];

// ─── Router ──────────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    var p = e.parameter || {};
    var formType = (p.form_type || 'membership').toLowerCase();

    if (formType === 'cohort')         return handleCohort(p);
    if (formType === 'contact')        return handleContact(p);
    if (formType === 'newsletter')     return handleNewsletter(p);
    if (formType === 'study_tour')     return handleStudyTour(p);
    if (formType === 'nomination')     return handleNomination(p);
    if (formType === 'dinner_pledge')  return handleDinnerPledge(p);
    if (formType === 'spaceapps_mentor') return handleSpaceAppsMentor(p);
    if (formType === 'spaceapps_judge')  return handleSpaceAppsJudge(p);
    if (formType === '_diagnostic')      return handleDiagnostic();
    return handleMembership(p);
  } catch (err) {
    return jsonOut({ ok: false, error: err.message });
  }
}

/**
 * Read-only audit: for every sheet this script is supposed to manage, reports
 * whether the sheet exists, its row count, and whether its header row (row 1)
 * exactly matches the expected headers defined above. Also lists any sheets
 * in the spreadsheet that aren't accounted for. Does NOT create or modify
 * anything — safe to call at any time.
 *
 * Call with form_type=_diagnostic (no other fields needed).
 */
function handleDiagnostic() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var expected = {};
  expected[MEMBERSHIP_SHEET] = MEMBERSHIP_HEADERS;
  expected[COHORT_SHEETS['cca-f']] = COHORT_HEADERS;
  expected[COHORT_SHEETS['uas']] = COHORT_HEADERS;
  expected[CONTACT_SHEET] = CONTACT_HEADERS;
  expected[NEWSLETTER_SHEET] = NEWSLETTER_HEADERS;
  expected[STUDY_TOUR_SHEET] = STUDY_TOUR_HEADERS;
  expected[NOMINATION_SHEET] = NOMINATION_HEADERS;
  expected[DINNER_PLEDGE_SHEET] = DINNER_PLEDGE_HEADERS;
  expected[SPACEAPPS_MENTOR_SHEET] = SPACEAPPS_MENTOR_HEADERS;
  expected[SPACEAPPS_JUDGE_SHEET] = SPACEAPPS_JUDGE_HEADERS;

  var allSheetNames = ss.getSheets().map(function (s) { return s.getName(); });
  var report = {};

  Object.keys(expected).forEach(function (name) {
    var sheet = ss.getSheetByName(name);
    var exp = expected[name];
    if (!sheet) {
      report[name] = { exists: false, expectedHeaders: exp };
      return;
    }
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    var actualHeaders = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
    var headerMatch = actualHeaders.length === exp.length &&
      exp.every(function (h, i) { return actualHeaders[i] === h; });
    report[name] = {
      exists: true,
      rowCount: lastRow,
      dataRows: Math.max(0, lastRow - 1),
      headerMatch: headerMatch,
      actualHeaders: actualHeaders,
      expectedHeaders: exp
    };
  });

  report._unaccountedSheetsInSpreadsheet = allSheetNames.filter(function (n) {
    return !expected.hasOwnProperty(n);
  });

  return jsonOut({ ok: true, type: 'diagnostic', report: report });
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
    p.linkedin || '',
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

function handleNomination(p) {
  var sheet = ensureSheet(NOMINATION_SHEET, NOMINATION_HEADERS);
  var yesNo = function (v) { return v ? 'yes' : ''; };
  sheet.appendRow([
    new Date(),
    p.nominator_name || '',
    p.nominator_email || '',
    p.nominee_name || '',
    p.nominee_linkedin || '',
    p.nominee_role || '',
    p.reason || '',
    yesNo(p.consent_contact),
    yesNo(p.privacy)
  ]);

  sendAcknowledgement(p.nominator_email, p.nominator_name, 'nomination', p.nominee_name);
  return jsonOut({ ok: true, type: 'nomination' });
}

function handleDinnerPledge(p) {
  var sheet = ensureSheet(DINNER_PLEDGE_SHEET, DINNER_PLEDGE_HEADERS);
  var yesNo = function (v) { return v ? 'yes' : ''; };
  sheet.appendRow([
    new Date(),
    p.pledger_name || '',
    p.pledger_email || '',
    p.nominee_choice || '',
    p.pledge_amount || '',
    p.message || '',
    yesNo(p.privacy)
  ]);

  sendAcknowledgement(p.pledger_email, p.pledger_name, 'dinner_pledge', p.pledge_amount);
  return jsonOut({ ok: true, type: 'dinner_pledge' });
}

function handleSpaceAppsMentor(p) {
  var sheet = ensureSheet(SPACEAPPS_MENTOR_SHEET, SPACEAPPS_MENTOR_HEADERS);
  var yesNo = function (v) { return v ? 'yes' : ''; };
  sheet.appendRow([
    new Date(),
    p.full_name || '',
    p.email || '',
    p.phone || '',
    p.linkedin || '',
    p.expertise || '',
    p.experience || '',
    p.availability || '',
    p.prior_experience || '',
    p.notes || '',
    yesNo(p.privacy)
  ]);

  sendAcknowledgement(p.email, p.full_name, 'spaceapps_mentor');
  return jsonOut({ ok: true, type: 'spaceapps_mentor' });
}

function handleSpaceAppsJudge(p) {
  var sheet = ensureSheet(SPACEAPPS_JUDGE_SHEET, SPACEAPPS_JUDGE_HEADERS);
  var yesNo = function (v) { return v ? 'yes' : ''; };
  sheet.appendRow([
    new Date(),
    p.full_name || '',
    p.email || '',
    p.phone || '',
    p.linkedin || '',
    p.expertise || '',
    p.experience || '',
    p.availability || '',
    p.prior_experience || '',
    p.notes || '',
    yesNo(p.privacy)
  ]);

  sendAcknowledgement(p.email, p.full_name, 'spaceapps_judge');
  return jsonOut({ ok: true, type: 'spaceapps_judge' });
}

// ─── Acknowledgement emails ───────────────────────────────────────────────────

/**
 * Sends an acknowledgement-of-receipt email to the submitter.
 *
 * @param {string} toEmail     - Recipient address
 * @param {string} firstName   - Recipient first name (may be empty)
 * @param {string} formType    - One of: membership | cohort | contact | newsletter | study_tour | nomination | dinner_pledge | spaceapps_mentor | spaceapps_judge
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

    case 'nomination':
      subject = 'TechLegion — nomination received';
      body =
        greeting + '\n\n' +
        'Thank you for nominating ' + (extra || 'someone') + ' for a TechLegion community dinner.\n\n' +
        'Here\'s what happens next:\n' +
        '  1. We\'ll reach out to the nominee to confirm their details.\n' +
        '  2. We\'ll ask for their explicit consent before publishing anything about them.\n' +
        '  3. If they agree, they\'ll appear on ' + WEBSITE_URL + '/nominate.html for the community to pledge toward.\n\n' +
        'If you have any questions in the meantime, just reply to this email.\n\n' +
        'Warm regards,\nThe TechLegion Team\n' +
        WEBSITE_URL;
      break;

    case 'dinner_pledge':
      subject = 'TechLegion — pledge received';
      body =
        greeting + '\n\n' +
        'Thank you for pledging CHF ' + (extra || '') + ' toward a TechLegion community dinner.\n\n' +
        'A pledge is not an automatic charge — we\'ll only contact you with payment details (invoice or QR-bill) once a dinner is actually confirmed with the nominee. If a dinner never happens, no payment is requested.\n\n' +
        'Proceeds beyond the dinner cost go toward our Robotics & Drone Zone workshops in Zug.\n\n' +
        'Warm regards,\nThe TechLegion Team\n' +
        WEBSITE_URL;
      break;

    case 'spaceapps_mentor':
      subject = 'TechLegion — NASA Space Apps mentor application received';
      body =
        greeting + '\n\n' +
        'Thank you for applying to mentor at NASA Space Apps Challenge Zurich. We\'ve received your application and will pass it on to the Zurich local event organizing team.\n\n' +
        'They\'ll be in touch directly once mentor assignments are being finalised.\n\n' +
        'Warm regards,\nThe TechLegion Team\n' +
        WEBSITE_URL;
      break;

    case 'spaceapps_judge':
      subject = 'TechLegion — NASA Space Apps judge application received';
      body =
        greeting + '\n\n' +
        'Thank you for applying to judge at NASA Space Apps Challenge Zurich. We\'ve received your application and will pass it on to the Zurich local event organizing team.\n\n' +
        'They\'ll be in touch directly once judge assignments are being finalised.\n\n' +
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
  ensureSheet(NOMINATION_SHEET, NOMINATION_HEADERS);
  ensureSheet(DINNER_PLEDGE_SHEET, DINNER_PLEDGE_HEADERS);
  ensureSheet(SPACEAPPS_MENTOR_SHEET, SPACEAPPS_MENTOR_HEADERS);
  ensureSheet(SPACEAPPS_JUDGE_SHEET, SPACEAPPS_JUDGE_HEADERS);
  Logger.log('All sheets ready.');
}
