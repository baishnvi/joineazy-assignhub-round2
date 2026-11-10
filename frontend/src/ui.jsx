import { useEffect, useState } from 'react';
export const cx = (...a) => a.filter(Boolean).join(' ');
export const fmt = (iso) => new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
export const toInput = (iso) => { const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };

export function useLoad(deps = []) {
  const [l, setL] = useState(true);
  useEffect(() => { setL(true); const t = setTimeout(() => setL(false), 450); return () => clearTimeout(t); }, deps); // eslint-disable-line
  return l;
}
export const Spinner = () => (
  <div className="flex justify-center py-20" role="status" aria-label="Loading">
    <div className="h-9 w-9 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
  </div>
);
export const Empty = ({ icon = '📭', title, children }) => (
  <div className="anim-in rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
    <div className="text-4xl">{icon}</div>
    <h3 className="mt-2 font-semibold">{title}</h3>
    <p className="mt-1 text-sm text-slate-500">{children}</p>
  </div>
);
const tones = {
  slate: 'bg-slate-100 text-slate-700', green: 'bg-emerald-100 text-emerald-700', red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700', indigo: 'bg-indigo-100 text-indigo-700', violet: 'bg-violet-100 text-violet-700',
};
export const Badge = ({ tone = 'slate', children }) => (
  <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', tones[tone])}>{children}</span>
);
export const Progress = ({ value, max, tone = 'bg-indigo-600' }) => {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div className={cx('h-full rounded-full transition-all duration-500', pct === 100 ? 'bg-emerald-500' : tone)} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-xs text-slate-500">{value} of {max} · {pct}%</p>
    </div>
  );
};
const variants = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
  ghost: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};
export const Btn = ({ variant = 'primary', className, ...p }) => (
  <button {...p} className={cx('rounded-lg px-4 py-2 text-sm font-medium transition active:scale-95 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400', variants[variant], className)} />
);
export const Field = ({ label, error, as: As = 'input', children, ...p }) => (
  <label className="block text-sm">
    <span className="mb-1 block font-medium text-slate-700">{label}</span>
    <As {...p} className={cx('w-full rounded-lg border bg-white px-3 py-2 outline-none transition focus:ring-2', error ? 'border-red-400 focus:ring-red-200' : 'border-slate-300 focus:ring-indigo-200')}>{children}</As>
    {error && <span className="mt-1 block text-xs text-red-600" role="alert">{error}</span>}
  </label>
);
export function Modal({ title, onClose, children }) {
  useEffect(() => { const f = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f); }, [onClose]);
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} className="anim-in max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
export const Toasts = ({ items }) => (
  <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2" aria-live="polite">
    {items.map((t) => (
      <div key={t.id} className={cx('anim-in rounded-lg px-4 py-3 text-sm text-white shadow-lg', t.type === 'error' ? 'bg-red-600' : 'bg-slate-900')}>
        {t.type === 'error' ? '⚠️' : '✅'} {t.msg}
      </div>
    ))}
  </div>
);
