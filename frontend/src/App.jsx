import { useCallback, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import { AppCtx, useApp } from './ctx';
import { load, save, makeToken, readToken, uid, TOKEN_KEY } from './store';
import { Toasts, Badge, Btn } from './ui';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Course from './pages/Course';

function Layout() {
  const { user, logout } = useApp();
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-indigo-700"><span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-white">J</span><span className="hidden sm:inline">Joineazy AssignHub</span></Link>
          <div className="flex items-center gap-3">
            <div className="text-right text-sm leading-tight"><div className="font-medium">{user.name}</div><Badge tone={user.role === 'professor' ? 'violet' : 'indigo'}>{user.role}</Badge></div>
            <Btn variant="ghost" onClick={logout}>Logout</Btn>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6"><Outlet /></main>
    </div>
  );
}
const Protected = () => { const { user } = useApp(); return user ? <Layout /> : <Navigate to="/login" replace />; };
const Public = () => { const { user } = useApp(); return user ? <Navigate to="/dashboard" replace /> : <Outlet />; };

export default function App() {
  const [db, setDb] = useState(load);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [toasts, setToasts] = useState([]);
  const session = token && readToken(token);
  const user = session ? db.users.find((u) => u.id === session.sub) : null;

  const toast = useCallback((msg, type = 'ok') => {
    const id = uid(); setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  const update = useCallback((fn) => setDb((prev) => { const n = structuredClone(prev); fn(n); save(n); return n; }), []);
  const login = (email, password) => {
    const u = db.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase() && x.password === password);
    if (!u) throw new Error('Invalid email or password.');
    const t = makeToken(u); localStorage.setItem(TOKEN_KEY, t); setToken(t); return u;
  };
  const register = ({ name, email, password, role }) => {
    if (db.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) throw new Error('An account with this email already exists.');
    const id = uid();
    update((d) => {
      d.users.push({ id, name: name.trim(), email: email.trim(), password, role });
      if (role === 'student') d.courses.forEach((c) => c.studentIds.push(id)); // auto-enrol in this semester's courses
    });
  };
  const logout = () => { localStorage.removeItem(TOKEN_KEY); setToken(null); toast('Logged out successfully'); };

  return (
    <AppCtx.Provider value={{ db, update, user, login, register, logout, toast }}>
      <BrowserRouter>
        <Routes>
          <Route element={<Public />}>
            <Route path="/login" element={<Auth mode="login" />} />
            <Route path="/register" element={<Auth mode="register" />} />
          </Route>
          <Route element={<Protected />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/courses/:id" element={<Course />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <Toasts items={toasts} />
    </AppCtx.Provider>
  );
}
