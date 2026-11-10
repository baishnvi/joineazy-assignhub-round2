import { useState } from 'react';
import { useApp } from '../ctx';
import { isOverdue, track, uid } from '../store';
import { Badge, Btn, Empty, Field, Modal, Progress, Spinner, fmt, toInput, useLoad } from '../ui';

const blank = { title: '', description: '', deadline: '', link: '', type: 'Individual' };

function AssignmentForm({ initial, onSave, onClose }) {
  const [f, setF] = useState(initial.id ? { ...initial, deadline: toInput(initial.deadline) } : blank);
  const [err, setErr] = useState({});
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setErr({ ...err, [k]: undefined }); };
  const submit = (e) => {
    e.preventDefault();
    const x = {};
    if (f.title.trim().length < 3) x.title = 'Title must be at least 3 characters.';
    if (f.description.trim().length < 10) x.description = 'Description must be at least 10 characters.';
    if (!f.deadline) x.deadline = 'Pick a deadline date and time.';
    if (!/^https?:\/\/\S+\.\S+/.test(f.link)) x.link = 'Enter a valid OneDrive URL (https://…).';
    setErr(x); if (Object.keys(x).length) return;
    onSave({ ...f, title: f.title.trim(), description: f.description.trim(), deadline: new Date(f.deadline).toISOString() });
  };
  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <Field label="Title" value={f.title} onChange={set('title')} error={err.title} />
      <Field as="textarea" rows={3} label="Description" value={f.description} onChange={set('description')} error={err.description} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Deadline" type="datetime-local" value={f.deadline} onChange={set('deadline')} error={err.deadline} />
        <Field as="select" label="Submission type" value={f.type} onChange={set('type')}><option>Individual</option><option>Group</option></Field>
      </div>
      <Field label="OneDrive link" type="url" value={f.link} onChange={set('link')} error={err.link} placeholder="https://onedrive.live.com/…" />
      <div className="flex justify-end gap-2"><Btn type="button" variant="ghost" onClick={onClose}>Cancel</Btn><Btn type="submit">{initial.id ? 'Save changes' : 'Create assignment'}</Btn></div>
    </form>
  );
}

export default function ProfCourse({ course }) {
  const { db, update, toast } = useApp();
  const loading = useLoad([course.id]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [form, setForm] = useState(null);
  const [open, setOpen] = useState(null);

  const list = db.assignments.filter((a) => a.courseId === course.id)
    .filter((a) => a.title.toLowerCase().includes(q.toLowerCase()))
    .filter((a) => status === 'all' || (status === 'overdue') === isOverdue(a))
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  const save = (data) => {
    update((d) => {
      if (data.id) Object.assign(d.assignments.find((a) => a.id === data.id), data);
      else d.assignments.push({ ...data, id: uid(), courseId: course.id });
    });
    toast(data.id ? 'Assignment updated' : 'Assignment created'); setForm(null);
  };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search assignments…" aria-label="Search assignments" className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value="all">All deadlines</option><option value="open">Open</option><option value="overdue">Past deadline</option>
        </select>
        <Btn onClick={() => setForm({})}>+ New assignment</Btn>
      </div>
      {loading ? <Spinner /> : !list.length ? (
        <Empty icon="📝" title={q || status !== 'all' ? 'No matching assignments' : 'No assignments yet'}>{q || status !== 'all' ? 'Try clearing the filters.' : 'Create the first assignment for this course.'}</Empty>
      ) : (
        <div className="space-y-4">
          {list.map((a) => {
            const rows = track(db, course, a);
            const done = rows.filter((r) => r.ack).length;
            const over = isOverdue(a);
            const isOpen = open === a.id;
            return (
              <article key={a.id} className="anim-in rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold">{a.title}</h3>
                    <p className="mt-1 text-sm text-slate-600">{a.description}</p>
                  </div>
                  <div className="flex gap-1.5"><Badge tone={a.type === 'Group' ? 'violet' : 'indigo'}>{a.type === 'Group' ? '👥' : '👤'} {a.type}</Badge>{over ? <Badge tone="red">Past deadline</Badge> : <Badge tone="green">Open</Badge>}</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
                  <span>⏰ {fmt(a.deadline)}</span>
                  <a href={a.link} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">📎 OneDrive link</a>
                </div>
                <div className="mt-4"><Progress value={done} max={rows.length} /><p className="text-xs text-slate-500">{a.type === 'Group' ? 'groups' : 'students'} submitted</p></div>
                <div className="mt-4 flex gap-2">
                  <Btn variant="ghost" onClick={() => setOpen(isOpen ? null : a.id)}>{isOpen ? 'Hide' : 'View'} submissions</Btn>
                  <Btn variant="ghost" onClick={() => setForm(a)}>Edit</Btn>
                </div>
                {isOpen && (
                  <div className="anim-in mt-4 grid gap-4 md:grid-cols-2">
                    {[['Submitted', rows.filter((r) => r.ack), true], ['Not submitted', rows.filter((r) => !r.ack), false]].map(([t, rs, ok]) => (
                      <div key={t} className="rounded-xl bg-slate-50 p-3">
                        <h4 className="mb-2 text-sm font-semibold">{ok ? '✅' : '⏳'} {t} ({rs.length})</h4>
                        {!rs.length ? <p className="text-xs text-slate-400">Nobody here.</p> : (
                          <ul className="space-y-2">{rs.map((r) => (
                            <li key={r.key} className="rounded-lg bg-white p-2 text-sm shadow-sm">
                              <div className="font-medium">{r.name}</div>
                              <div className="text-xs text-slate-500">{r.sub}</div>
                              {r.ack && <div className="text-xs text-emerald-600">Acknowledged {fmt(r.ack.at)}{new Date(r.ack.at) > new Date(a.deadline) && ' (late)'}</div>}
                            </li>))}</ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
      {form && <Modal title={form.id ? 'Edit assignment' : 'New assignment'} onClose={() => setForm(null)}><AssignmentForm initial={form} onSave={save} onClose={() => setForm(null)} /></Modal>}
    </>
  );
}
