# TechLegion member portal — setup

Google login (top-right of every page) and the member portal (`portal.html`) run on
**Firebase Authentication + Cloud Firestore**. No server is needed; GitHub Pages keeps
hosting the site.

## Files

| File | Purpose |
|---|---|
| `assets/js/firebase-config.js` | Firebase web config (public values). Login stays hidden until filled in. |
| `assets/js/auth.js` | Sign-in button / avatar menu, creates `members/{uid}` on first login. Loaded by `main.js` on every page. |
| `portal.html` | Member dashboard + admin panel (approve/reject, roles, portal content). |
| `firestore.rules` | Security rules — the real access control. Paste into Firebase console. |
| `assets/css/main.css` | `.auth-*` styles at the bottom. |

## One-time setup

1. **Create the Firebase project** — <https://console.firebase.google.com> → *Add project* →
   project **techlegion-member-portal** (done).
   Google Analytics: optional.
2. **Enable Google sign-in** — Build → Authentication → Get started → Sign-in method →
   **Google** → Enable → set support email → Save.
   (Firebase creates its own OAuth client automatically; the client ID/secret created by hand
   in Google Cloud Console is not needed for this.)
3. **Authorised domains** — Authentication → Settings → Authorized domains → add
   `techlegion.ch` (and `www.techlegion.ch` if used). `localhost` is there by default.
4. **Create Firestore** — Build → Firestore Database → Create database → *Production mode* →
   location **europe-west6 (Zürich)** (data stays in Switzerland; cannot be changed later).
5. **Rules** — Firestore → Rules → paste the contents of `firestore.rules` → Publish.
6. **Register the web app** — Project settings → General → Your apps → `</>` (Web) →
   name "techlegion.ch" (no Hosting) → copy the `firebaseConfig` values into
   `assets/js/firebase-config.js`. These values are public by design; commit them.
7. **OAuth consent screen** — Google Cloud Console → APIs & Services → OAuth consent screen:
   app name "TechLegion", logo, support email, links to
   `https://techlegion.ch/privacy.html` and `https://techlegion.ch/terms.html`.
   While it is in **Testing**, only listed test users can sign in → click **Publish app**
   to open it to everyone (basic profile/email scopes need no Google verification).
8. **Make yourself admin** — deploy, open the site, click *Sign in*, then in Firestore →
   `members` → your document → set `status` = `approved` and `role` = `admin`.
   Reload `portal.html`: the admin panel appears. Further admins can be assigned from the panel.

## How it works

- First sign-in creates `members/{uid}` with `status: "pending"`, `role: "member"`.
- An admin approves or rejects in **portal.html → Admin — members**, and can set the role
  (`member`, `organizer`, `admin`).
- Approved members see their profile, membership status, and the *Events & hackathons*,
  *Volunteer opportunities* and *Community resources* lists.
- Those lists come from the Firestore `portal` collection and are added/deleted by admins in
  **Admin — portal content**. Because they are loaded from Firestore and the rules only allow
  approved members to read them, they are truly members-only (unlike text written into the HTML,
  which anyone can see in the page source).

## Notes

- **Never** put the OAuth *client secret* in the website or the repo.
- Update `privacy.html` to mention that sign-in stores name, email and profile photo from
  Google in Firebase (Google Cloud, Zürich region) for membership administration.
- Free Spark plan is plenty for this size (50k reads/day).
- Portal page text is English only for now; the header button is translated in all 5 languages.
