/**
 * FinFlow Auth Module
 * Handles user registration, sign-in, and session management.
 * All data is stored in localStorage — demo/portfolio use only.
 */
const Auth = (() => {
  const USERS_KEY   = 'ff_users';
  const SESSION_KEY = 'ff_session';

  const DEMO_USER = {
    id:       'demo',
    name:     'Alex Johnson',
    email:    'demo@finflow.app',
    password: btoa('demo123'),
    avatar:   'AJ',
    joined:   '2025-01-01',
  };

  function getUsers() {
    const raw = localStorage.getItem(USERS_KEY);
    const users = raw ? JSON.parse(raw) : [];
    // Always include demo user
    if (!users.find(u => u.id === 'demo')) users.push(DEMO_USER);
    return users;
  }

  function saveUsers(users) {
    // Don't persist demo user
    const toSave = users.filter(u => u.id !== 'demo');
    localStorage.setItem(USERS_KEY, JSON.stringify(toSave));
  }

  function initials(name) {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  function signUp(name, email, password) {
    const users = getUsers();
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: 'An account with this email already exists.' };
    }
    const user = {
      id:       crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      name,
      email,
      password: btoa(password),
      avatar:   initials(name),
      joined:   new Date().toISOString().slice(0, 10),
    };
    users.push(user);
    saveUsers(users);
    // Auto sign-in
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id, email: user.email, name: user.name, avatar: user.avatar }));
    return { ok: true };
  }

  function signIn(email, password) {
    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === btoa(password));
    if (!user) return false;
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.id, email: user.email, name: user.name, avatar: user.avatar }));
    return true;
  }

  function signInDemo() {
    const u = DEMO_USER;
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: u.id, email: u.email, name: u.name, avatar: u.avatar }));
  }

  function currentUser() {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  function signOut() {
    localStorage.removeItem(SESSION_KEY);
  }

  return { signUp, signIn, signInDemo, currentUser, signOut };
})();
