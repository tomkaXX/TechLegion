/* =========================================================================
   TechLegion — Firebase web config
   Paste the values from Firebase console → Project settings → General →
   "Your apps" → Web app → SDK setup and configuration → "Config".

   These values are PUBLIC by design (they identify the project, they are
   not secrets). Access is controlled by Firestore security rules
   (see firestore.rules). NEVER put the OAuth *client secret* here.

   While apiKey still starts with "REPLACE_", the login button stays hidden
   so the live site is not affected.
   ========================================================================= */
export const firebaseConfig = {
  apiKey: 'AIzaSyCRK7i_E9QvHFk5EgfPQ-ScSjphs6Cb3WQ',
  authDomain: 'techlegion-member-portal.firebaseapp.com',
  projectId: 'techlegion-member-portal',
  storageBucket: 'techlegion-member-portal.firebasestorage.app',
  messagingSenderId: '1060943513062',
  appId: '1:1060943513062:web:08ba3944601e07d83ec227',
  measurementId: 'G-RSMBQHHNHP' // not used: the site already has its own Google Analytics tag
};

export const FIREBASE_READY = !String(firebaseConfig.apiKey).startsWith('REPLACE_');
