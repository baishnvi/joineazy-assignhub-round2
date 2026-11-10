import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../ctx';
import { ackFor, isOverdue, uid } from '../store';
import { Badge, Btn, Empty, Field, Modal, Progress, Spinner, useLoad } from '../ui';

export default function Dashboard() {
  const { db, user, update, toast } = useApp();
  const loading = useLoad([user.id]);
  const prof = user.role === 'professor';
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', code: '' });
  const [err, setErr] = useState({});
  const courses = db.courses.filter((c) => (prof ? c.professorId === user.id : c.studentIds.includes(user.id)));

  const create = (e) => {
    e.preventDefault();
    const x = {};
    if (f.name.trim().length < 3) x.name = 'Course name must be at least 3 characters.';
    if (!/^[A-Za-z0-9-]{3,10}$/.test(f.code)) x.code = 'Code: 3–10 letters/numbers (e.g. CS101).';
    setErr(x); if (Object.keys(x).length) return;
    update((d) => d.courses.push({ id: uid(), name: f.name.trim(), code: f.code.toUpperCase(), professorId: user.id, studentIds: d.users.filter((u) => u.role === 'student').map((u) => u.id) }));
    toast('Course created'); setOpen(false); setF({ name: '', code: '' });
  };

  return (
    <div className="anim-in">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{prof ? 'Your courses' : 'My courses this semester'}</h1>
          <p className="text-sm text-slate-500">Hi {user.name.split(' ')[0]}, {prof ? 'pick a course to manage assignments.' : 'pick a course to see assignments.'}</p>
        </div>
        {prof && <Btn onClick={() => setOpen(true)}>+ New course</Btn>}
      </div>
      {loading ? <Spinner /> : !courses.length ? (
        <Empty icon="📚" title="No courses yet">{prof ? 'Create your first course to get started.' : 'You are not enrolled in any course.'}</Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => {
            const as = db.assignments.filter((a) => a.courseId === c.id);
            const done = as.filter((a) => ackFor(db, a, user.id)).length;
            const late = as.filter((a) => isOverdue(a) && !ackFor(db, a, user.id)).length;
            return (
              <Link key={c.id} to={`/courses/${c.id}`} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-indigo-300 hover:shadow-lg">
                <div className="mb-3 flex items-center justify-between"><Badge tone="indigo">{c.code}</Badge>{!prof && late > 0 && <Badge tone="red">{late} overdue</Badge>}</div>
                <h2 className="text-lg font-semibold group-hover:text-indigo-700">{c.name}</h2>
                <p className="mb-4 text-sm text-slate-500">{prof ? `${c.studentIds.length} students · ` : ''}{as.length} assignment{as.length !== 1 && 's'}</p>
                {!prof && (as.length ? <Progress value={done} max={as.length} /> : <p className="text-xs text-slate-400">No assignments yet</p>)}
                {prof && <span className="text-sm font-medium text-indigo-600">Open assignments →</span>}
              </Link>
            );
          })}
        </div>
      )}
      {open && (
        <Modal title="Create course" onClose={() => setOpen(false)}>
          <form onSubmit={create} className="space-y-4" noValidate>
            <Field label="Course name" value={f.name} error={err.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <Field label="Course code" value={f.code} error={err.code} onChange={(e) => setF({ ...f, code: e.target.value })} />
            <div className="flex justify-end gap-2"><Btn type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Btn><Btn type="submit">Create</Btn></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
