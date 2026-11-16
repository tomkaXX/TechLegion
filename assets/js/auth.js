/* =========================================================================
   TechLegion — Member login (Firebase Authentication + Firestore)
   Loaded automatically on every page by main.js.

   - Adds a "Sign in" button / avatar menu to the top-right of the header
   - Signs in with Google (Firebase Auth popup)
   - Creates a members/{uid} document with status "pending" on first login
   - Exposes window.TLAuth and fires a "tl-auth" event on document so
     pages (e.g. portal.html) can react to the login state.
   ========================================================================= */
import { firebaseConfig, FIREBASE_READY } from './firebase-config.js';

const SDK = 'https://www.gstatic.com/firebasejs/10.14.1/';

/* ---------- Small i18n for the header widget ---------- */
const T = {
  en: { signin: 'Sign in', signout: 'Sign out', portal: 'Member portal', pending: 'Awaiting approval', approved: 'Member', rejected: 'Access restricted', admin: 'Admin', organizer: 'Organizer', error: 'Sign-in failed. Please try again.' },
  de: { signin: 'Anmelden', signout: 'Abmelden', portal: 'Mitgliederportal', pending: 'Wartet auf Freigabe', approved: 'Mitglied', rejected: 'Zugang eingeschränkt', admin: 'Admin', organizer: 'Organisator:in', error: 'Anmeldung fehlgeschlagen. Bitte erneut versuchen.' },
  fr: { signin: 'Connexion', signout: 'Déconnexion', portal: 'Espace membres', pending: 'En attente de validation', approved: 'Membre', rejected: 'Accès restreint', admin: 'Admin', organizer: 'Organisateur·rice', error: 'Échec de la connexion. Veuillez réessayer.' },
  it: { signin: 'Accedi', signout: 'Esci', portal: 'Area membri', pending: 'In attesa di approvazione', approved: 'Membro', rejected: 'Accesso limitato', admin: 'Admin', organizer: 'Organizzatore', error: 'Accesso non riuscito. Riprova.' },
  uk: { signin: 'Увійти', signout: 'Вийти', portal: 'Портал учасника', pending: 'Очікує схвалення', approved: 'Учасник', rejected: 'Доступ обмежено', admin: 'Адмін', organizer: 'Організатор', error: 'Не вдалося увійти. Спробуйте ще раз.' }
};
function t(key) {
  const lang = (document.documentElement.lang || 'en').slice(0, 2);
  return (T[lang] || T.en)[key] || T.en[key];
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const GOOGLE_G = '<svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';

/* ---------- State ---------- */
const state = { ready: false, enabled: FIREBASE_READY, user: null, member: null };
const TLAuth = {
  state,
  signIn: () => Promise.reject(new Error('Firebase not configured')),
  signOut: () => Promise.resolve(),
  refreshMember: () => Promise.resolve(null)
};
window.TLAuth = TLAuth;

function emit() {
  document.dispatchEvent(new CustomEvent('tl-auth', { detail: state }));
  renderWidget();
}

/* ---------- Header widget ---------- */
let widget;
function mountWidget() {
  const right = document.querySelector('.nav-right');
  if (!right || widget) return;
  widget = document.createElement('div');
  widget.className = 'auth-widget';
  const toggle = right.querySelector('.nav-toggle');
  right.insertBefore(widget, toggle || null);
  document.addEventListener('click', (e) => {
    if (!widget.contains(e.target)) widget.querySelector('.auth-menu')?.classList.remove('open');
  });
}

function statusLabel(m) {
  if (!m) return '';
  if (m.status === 'approved') return t(m.role === 'admin' ? 'admin' : m.role === 'organizer' ? 'organizer' : 'approved');
  return t(m.status === 'rejected' ? 'rejected' : 'pending');
}

function renderWidget() {
  if (!widget) return;
  if (!state.enabled || !state.ready) { widget.innerHTML = ''; return; }

  if (!state.user) {
    widget.innerHTML = `<button type="button" class="auth-signin">${GOOGLE_G}<span>${esc(t('signin'))}</span></button>`;
    widget.querySelector('.auth-signin').addEventListener('click', () => TLAuth.signIn().catch(() => {}));
    return;
  }

  const u = state.user;
  const m = state.member;
  const initial = esc((u.displayName || u.email || '?').trim().charAt(0).toUpperCase());
  const avatar = u.photoURL
    ? `<img src="${esc(u.photoURL)}" alt="" referrerpolicy="no-referrer" />`
    : `<span class="auth-initial">${initial}</span>`;
  const st = m ? `<span class="auth-status auth-status--${esc(m.status)}">${esc(statusLabel(m))}</span>` : '';

  widget.innerHTML = `
    <button type="button" class="auth-avatar" aria-haspopup="true" aria-label="${esc(u.displayName || u.email)}">${avatar}</button>
    <div class="auth-menu" role="menu">
      <div class="auth-who">
        <strong>${esc(u.displayName || '')}</strong>
        <small>${esc(u.email || '')}</small>
        ${st}
      </div>
      <a href="portal.html" role="menuitem">${esc(t('portal'))}</a>
      <button type="button" class="auth-signout" role="menuitem">${esc(t('signout'))}</button>
    </div>`;
  const menu = widget.querySelector('.auth-menu');
  widget.querySelector('.auth-avatar').addEventListener('click', (e) => { e.stopPropagation(); menu.classList.toggle('open'); });
  widget.querySelector('.auth-signout').addEventListener('click', () => TLAuth.signOut());
}

/* ---------- Firebase ---------- */
async function init() {
  mountWidget();
  if (!FIREBASE_READY) {
    console.info('[TechLegion] Login disabled: fill in assets/js/firebase-config.js');
    state.ready = true;
    emit();
    return;
  }

  const [{ initializeApp }, authMod, fsMod] = await Promise.all([
    import(SDK + 'firebase-app.js'),
    import(SDK + 'firebase-auth.js'),
    import(SDK + 'firebase-firestore.js')
  ]);
  const { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut, onAuthStateChanged } = authMod;
  const { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp } = fsMod;

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  // Give pages direct access to the SDK without loading it twice
  Object.assign(TLAuth, { app, auth, db, fs: fsMod });

  async function ensureMember(user) {
    const ref = doc(db, 'members', user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        status: 'pending',
        role: 'member',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });
      return (await getDoc(ref)).data();
    }
    updateDoc(ref, { lastLogin: serverTimestamp() }).catch(() => {});
    return snap.data();
  }

  TLAuth.refreshMember = async () => {
    if (!state.user) return null;
    try { state.member = await ensureMember(state.user); }
    catch (e) { console.error('[TechLegion] member lookup failed', e); state.member = null; }
    emit();
    return state.member;
  };

  TLAuth.signIn = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      if (e && e.code === 'auth/popup-blocked') return signInWithRedirect(auth, provider);
      if (e && (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request')) return;
      console.error('[TechLegion] sign-in failed', e);
      alert(t('error'));
      throw e;
    }
  };

  TLAuth.signOut = async () => {
    await signOut(auth);
    if (/portal\.html$/.test(location.pathname)) location.reload();
  };

  onAuthStateChanged(auth, async (user) => {
    state.user = user || null;
    state.member = null;
    state.ready = true;
    if (user) {
      emit(); // show avatar immediately
      await TLAuth.refreshMember();
    } else {
      emit();
    }
  });
}

// Re-render the widget when the language switcher changes <html lang>
new MutationObserver(renderWidget).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
