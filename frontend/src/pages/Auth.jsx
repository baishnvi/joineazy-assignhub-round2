import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../ctx';
import { Btn, Field, cx } from '../ui';

const demo = [['Professor', 'prof@demo.com', 'Prof@123'], ['Student', 'student@demo.com', 'Student@123'], ['Student (leader)', 'diya@demo.com', 'Student@123']];

export default function Auth({ mode }) {
  const isReg = mode === 'register';
  const { login, register, toast } = useApp();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '', confirm: '', role: 'student' });
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setErr({ ...err, [k]: undefined, form: undefined }); };

  const validate = () => {
    const e = {};
    if (isReg && f.name.trim().length < 2) e.name = 'Please enter your full name (min 2 characters).';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) e.email = 'Enter a valid email address.';
    if (!f.password) e.password = 'Password is required.';
    else if (isReg && !(f.password.length >= 6 && /[A-Za-z]/.test(f.password) && /\d/.test(f.password))) e.password = 'Use at least 6 characters with a letter and a number.';
    if (isReg && f.confirm !== f.password) e.confirm = 'Passwords do not match.';
    return e;
  };
  const submit = (ev) => {
    ev.preventDefault();
    const e = validate(); setErr(e); if (Object.keys(e).length) return;
    setBusy(true);
    setTimeout(() => {
      try {
        if (isReg) { register(f); toast('Account created! Please log in.'); nav('/login'); }
        else { const u = login(f.email, f.password); toast(`Welcome back, ${u.name.split(' ')[0]}!`); nav('/dashboard'); }
      } catch (x) { setErr({ form: x.message }); }
      setBusy(false);
    }, 500);
  };

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-4">
      <div className="anim-in w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-indigo-600 text-xl font-bold text-white">J</div>
          <h1 className="text-2xl font-bold">{isReg ? 'Create your account' : 'Welcome back'}</h1>
          <p className="text-sm text-slate-500">Joineazy AssignHub</p>
        </div>
        <form onSubmit={submit} noValidate className="space-y-4">
          {err.form && <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err.form}</div>}
          {isReg && <Field label="Full name" value={f.name} onChange={set('name')} error={err.name} placeholder="Aarav Sharma" autoComplete="name" />}
          <Field label="Email" type="email" value={f.email} onChange={set('email')} error={err.email} placeholder="you@example.com" autoComplete="email" />
          <Field label="Password" type="password" value={f.password} onChange={set('password')} error={err.password} autoComplete={isReg ? 'new-password' : 'current-password'} />
          {isReg && <>
            <Field label="Confirm password" type="password" value={f.confirm} onChange={set('confirm')} error={err.confirm} autoComplete="new-password" />
            <div>
              <span className="mb-1 block text-sm font-medium text-slate-700">I am a</span>
              <div className="grid grid-cols-2 gap-2">
                {['student', 'professor'].map((r) => (
                  <button type="button" key={r} onClick={() => setF({ ...f, role: r })} className={cx('rounded-lg border px-3 py-2 text-sm font-medium capitalize transition', f.role === r ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-300 hover:bg-slate-50')}>{r === 'student' ? '🎓' : '👩‍🏫'} {r}</button>
                ))}
              </div>
            </div>
          </>}
          <Btn type="submit" disabled={busy} className="w-full">{busy ? 'Please wait…' : isReg ? 'Register' : 'Login'}</Btn>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          {isReg ? 'Already have an account?' : "Don't have an account?"}{' '}
          <Link className="font-medium text-indigo-600 hover:underline" to={isReg ? '/login' : '/register'}>{isReg ? 'Login' : 'Register'}</Link>
        </p>
        {!isReg && (
          <div className="mt-5 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            <p className="mb-2 font-medium">Demo accounts (click to fill)</p>
            <div className="flex flex-wrap gap-2">
              {demo.map(([l, e, p]) => <button key={e} type="button" onClick={() => { setF({ ...f, email: e, password: p }); setErr({}); }} className="rounded-full border border-slate-300 bg-white px-3 py-1 transition hover:border-indigo-400 hover:text-indigo-700">{l}</button>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
