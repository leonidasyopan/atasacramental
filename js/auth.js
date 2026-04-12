'use strict';

/* ═══════════════════════════════════════════
   AUTH — Firebase Authentication
   Google SSO + Email/Password with allowlist
═══════════════════════════════════════════ */

/* ─── Firebase Init ────────────────────────────── */

firebase.initializeApp({
  apiKey: 'AIzaSyBJDVSlfrjeG-YDO7gVpGQ08g2dlFOqyzQ',
  authDomain: 'sacramentalmeeting.firebaseapp.com',
  projectId: 'sacramentalmeeting',
  storageBucket: 'sacramentalmeeting.firebasestorage.app',
  messagingSenderId: '172425824852',
  appId: '1:172425824852:web:0b8fac958975086092fbc1'
});

var auth = firebase.auth();
auth.languageCode = 'pt';

/* ─── Helpers ──────────────────────────────────── */

function isEmailAllowed(email) {
  if (!email) return false;
  var lower = email.toLowerCase();
  for (var i = 0; i < ALLOWED_EMAILS.length; i++) {
    if (ALLOWED_EMAILS[i].toLowerCase() === lower) return true;
  }
  return false;
}

function showScreen(screenId) {
  ['loading-screen', 'login-screen', 'denied-screen', 'app-content'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.style.display = id === screenId ? '' : 'none';
  });
}

function setAuthError(msg) {
  var el = document.getElementById('auth-error');
  if (el) {
    el.textContent = msg;
    el.style.display = msg ? '' : 'none';
  }
}

function setAuthLoading(loading) {
  var btns = document.querySelectorAll('#login-screen button');
  btns.forEach(function (b) { b.disabled = loading; });
  var spinner = document.getElementById('auth-spinner');
  if (spinner) spinner.style.display = loading ? '' : 'none';
}

/* ─── Auth State Listener ──────────────────────── */

auth.onAuthStateChanged(function (user) {
  if (user) {
    if (isEmailAllowed(user.email)) {
      // Authorized — show app
      showScreen('app-content');
      var display = document.getElementById('user-display');
      if (display) display.textContent = user.displayName || user.email;
    } else {
      // Authenticated but not authorized
      auth.signOut();
      var deniedEmail = document.getElementById('denied-email');
      if (deniedEmail) deniedEmail.textContent = user.email;
      showScreen('denied-screen');
    }
  } else {
    // Not authenticated — show login
    showScreen('login-screen');
  }
});

/* ─── Sign In: Google ──────────────────────────── */

function signInWithGoogle() {
  setAuthError('');
  setAuthLoading(true);
  var provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(function (err) {
    setAuthLoading(false);
    if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
      setAuthError(translateAuthError(err.code));
    }
  });
}

/* ─── Sign In: Email + Password ────────────────── */

function signInWithEmail() {
  var email = document.getElementById('auth-email').value.trim();
  var pass  = document.getElementById('auth-password').value;
  if (!email || !pass) { setAuthError('Preencha e-mail e senha.'); return; }

  setAuthError('');
  setAuthLoading(true);
  auth.signInWithEmailAndPassword(email, pass).catch(function (err) {
    setAuthLoading(false);
    setAuthError(translateAuthError(err.code));
  });
}

/* ─── Register: Email + Password ───────────────── */

function registerWithEmail() {
  var email = document.getElementById('auth-email').value.trim();
  var pass  = document.getElementById('auth-password').value;
  if (!email || !pass) { setAuthError('Preencha e-mail e senha.'); return; }
  if (pass.length < 6) { setAuthError('A senha deve ter pelo menos 6 caracteres.'); return; }

  setAuthError('');
  setAuthLoading(true);
  auth.createUserWithEmailAndPassword(email, pass).catch(function (err) {
    setAuthLoading(false);
    setAuthError(translateAuthError(err.code));
  });
}

/* ─── Password Reset ───────────────────────────── */

function resetPassword() {
  var email = document.getElementById('auth-email').value.trim();
  if (!email) { setAuthError('Digite o e-mail para redefinir a senha.'); return; }

  setAuthError('');
  setAuthLoading(true);
  auth.sendPasswordResetEmail(email).then(function () {
    setAuthLoading(false);
    setAuthError('');
    showToast('E-mail de redefinição enviado para ' + email);
  }).catch(function (err) {
    setAuthLoading(false);
    setAuthError(translateAuthError(err.code));
  });
}

/* ─── Sign Out ─────────────────────────────────── */

function signOutUser() {
  auth.signOut();
}

/* ─── Login Mode Toggle ────────────────────────── */

var loginMode = 'login';

function setLoginMode(mode) {
  loginMode = mode;
  setAuthError('');
  document.getElementById('btn-mode-login').classList.toggle('active', mode === 'login');
  document.getElementById('btn-mode-register').classList.toggle('active', mode === 'register');
  document.getElementById('auth-submit-login').style.display = mode === 'login' ? '' : 'none';
  document.getElementById('auth-submit-register').style.display = mode === 'register' ? '' : 'none';
  document.getElementById('auth-forgot').style.display = mode === 'login' ? '' : 'none';
}

/* ─── Back to Login (from denied screen) ───────── */

function backToLogin() {
  showScreen('login-screen');
}

/* ─── Error Translation ────────────────────────── */

function translateAuthError(code) {
  var map = {
    'auth/invalid-email': 'E-mail inválido.',
    'auth/user-disabled': 'Esta conta foi desativada.',
    'auth/user-not-found': 'Nenhuma conta encontrada com este e-mail.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/invalid-credential': 'E-mail ou senha incorretos.',
    'auth/email-already-in-use': 'Este e-mail já está cadastrado. Tente fazer login.',
    'auth/weak-password': 'A senha deve ter pelo menos 6 caracteres.',
    'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos.',
    'auth/network-request-failed': 'Erro de rede. Verifique sua conexão.',
    'auth/popup-blocked': 'Pop-up bloqueado. Permita pop-ups para este site.'
  };
  return map[code] || 'Erro de autenticação. Tente novamente.';
}
