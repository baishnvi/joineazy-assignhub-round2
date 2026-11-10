import { useState } from 'react';
import { useApp } from '../ctx';
import { ackFor, groupOf, isOverdue, uid, userName } from '../store';
import { Badge, Btn, Empty, Field, Modal, Progress, Spinner, cx, fmt, useLoad } from '../ui';

function GroupModal({ course, onClose }) {
  const { db, user, update, toast } = useApp();
  const mine = groupOf(db, course.id, user.id);
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const groups = db.groups.filter((g) => g.courseId === course.id);
  const create = (e) => {
    e.preventDefault();
    if (name.trim().length < 3) return setErr('Group name must be at least 3 characters.');
    if (groups.some((g) => g.name.toLowerCase() === name.trim().toLowerCase())) return setErr('A group with this name already exists.');
    update((d) => d.groups.push({ id: uid(), courseId: course.id, name: name.trim(), leaderId: user.id, memberIds: [user.id] }));
    toast(`Group “${name.trim()}” created – you are the leader`); onClose();
  };
  const join = (g) => { update((d) => d.groups.find((x) => x.id === g.id).memberIds.push(user.id)); toast(`Joined ${g.name}`); onClose(); };
  return (
    <Modal title={mine ? 'My group' : 'Create or join a group'} onClose={onClose}>
      {mine ? <GroupCard g={mine} /> : (
        <div className="space-y-5">
          <form onSubmit={create} className="space-y-3" noValidate>
            <Field label="Create a new group (you become the leader)" value={name} error={err} onChange={(e) => { setName(e.target.value); setErr(''); }} placeholder="e.g. Code Ninjas" />
            <Btn type="submit">Create group</Btn>
          </form>
          <div>
            <h3 className="mb-2 text-sm font-medium text-slate-700">…or join an existing group</h3>
            {!groups.length ? <p className="text-sm text-slate-400">No groups in this course yet.</p> : groups.map((g) => (
              <div key={g.id} className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-slate-200 p-3">
                <div className="min-w-0 text-sm"><div className="font-medium">{g.name}</div><div className="truncate text-xs text-slate-500">{g.memberIds.length} members · Leader: {userName(db, g.leaderId)}</div></div>
                <Btn variant="ghost" onClick={() => join(g)}>Join</Btn>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
function GroupCard({ g }) {
  const { db, user } = useApp();
  return (
    <div>
      <h3 className="font-semibold">{g.name}</h3>
      <ul className="mt-2 space-y-1.5">
        {g.memberIds.map((m) => (
          <li key={m} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <span>{userName(db, m)}{m === user.id && ' (you)'}</span>
            {m === g.leaderId ? <Badge tone="amber">👑 Leader</Badge> : <Badge>Member</Badge>}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function StudentCourse({ course }) {
  const { db, user, update, toast } = useApp();
  const loading = useLoad([course.id]);
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [groupOpen, setGroupOpen] = useState(false);
  const group = groupOf(db, course.id, user.id);

  const all = db.assignments.filter((a) => a.courseId === course.id).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  const done = all.filter((a) => ackFor(db, a, user.id)).length;
  const state = (a) => (ackFor(db, a, user.id) ? 'done' : isOverdue(a) ? 'overdue' : 'pending');
  const list = all.filter((a) => a.title.toLowerCase().includes(q.toLowerCase())).filter((a) => filter === 'all' || state(a) === filter || (filter === 'pending' && state(a) === 'overdue'));

  const acknowledge = (a) => {
    update((d) => d.acks.push({ id: uid(), assignmentId: a.id, by: user.id, at: new Date().toISOString(), ...(a.type === 'Group' ? { groupId: group.id } : { studentId: user.id }) }));
    toast(a.type === 'Group' ? 'Group submission acknowledged' : 'Submission acknowledged'); setConfirm(null);
  };

  return (
    <>
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:col-span-2"><h2 className="mb-2 text-sm font-semibold text-slate-600">Your progress</h2>{all.length ? <Progress value={done} max={all.length} /> : <p className="text-sm text-slate-400">No assignments yet.</p>}</div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold text-slate-600">Your group</h2>
          {group ? <><p className="text-sm font-medium">{group.name}</p><p className="text-xs text-slate-500">{group.memberIds.length} members · {group.leaderId === user.id ? '👑 You lead' : `Leader: ${userName(db, group.leaderId)}`}</p></> : <p className="text-xs text-slate-500">Not in a group yet.</p>}
          <button onClick={() => setGroupOpen(true)} className="mt-2 text-sm font-medium text-indigo-600 hover:underline">{group ? 'View members' : 'Create or join'}</button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search assignments…" aria-label="Search assignments" className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
        <div className="flex gap-1 rounded-lg bg-slate-200 p-1 text-sm">
          {[['all', 'All'], ['pending', 'Pending'], ['done', 'Done']].map(([k, l]) => <button key={k} onClick={() => setFilter(k)} className={cx('rounded-md px-3 py-1 transition', filter === k ? 'bg-white font-medium shadow-sm' : 'text-slate-600 hover:text-slate-900')}>{l}</button>)}
        </div>
      </div>

      {loading ? <Spinner /> : !list.length ? (
        <Empty icon="🎉" title={all.length ? 'Nothing matches' : 'No assignments yet'}>{all.length ? 'Try a different filter or search.' : 'Your professor has not posted anything for this course.'}</Empty>
      ) : (
        <div className="space-y-4">
          {list.map((a) => {
            const ack = ackFor(db, a, user.id);
            const over = !ack && isOverdue(a);
            const leader = group && userName(db, group.leaderId);
            return (
              <article key={a.id} className={cx('anim-in rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md', over ? 'border-red-300 bg-red-50/40' : ack ? 'border-emerald-200' : 'border-slate-200')}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0"><h3 className="text-lg font-semibold">{ack && <span className="mr-1 text-emerald-600">✔</span>}{a.title}</h3><p className="mt-1 text-sm text-slate-600">{a.description}</p></div>
                  <div className="flex gap-1.5"><Badge tone={a.type === 'Group' ? 'violet' : 'indigo'}>{a.type === 'Group' ? '👥' : '👤'} {a.type}</Badge>{ack ? <Badge tone="green">Submitted</Badge> : over ? <Badge tone="red">Overdue</Badge> : <Badge tone="amber">Pending</Badge>}</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
                  <span className={over ? 'font-medium text-red-600' : ''}>⏰ {fmt(a.deadline)}</span>
                  <a href={a.link} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">📎 OneDrive link</a>
                </div>
                <div className="mt-4 border-t border-slate-100 pt-3 text-sm">
                  {a.type === 'Group' && !group ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-amber-50 p-3 text-amber-800">
                      <span>You are not part of any group. Create or join one to submit this assignment.</span>
                      <Btn onClick={() => setGroupOpen(true)}>Create / Join group</Btn>
                    </div>
                  ) : ack ? (
                    <p className="text-emerald-700">✅ {a.type === 'Group' ? `Acknowledged by ${userName(db, ack.by)} on ${fmt(ack.at)}` : `You acknowledged on ${fmt(ack.at)}`}{new Date(ack.at) > new Date(a.deadline) && <span className="text-red-600"> (late)</span>}</p>
                  ) : a.type === 'Group' && group.leaderId !== user.id ? (
                    <p className="text-slate-500">⏳ Waiting for group leader <b>{leader}</b> to acknowledge.</p>
                  ) : (
                    <Btn variant="success" onClick={() => setConfirm(a)}>Yes, I have submitted{a.type === 'Group' && ' (as group leader)'}</Btn>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
      {confirm && (
        <Modal title="Confirm submission" onClose={() => setConfirm(null)}>
          <p className="text-sm text-slate-600">Are you sure you have uploaded <b>{confirm.title}</b> to the OneDrive link{confirm.type === 'Group' ? `? This will be recorded for every member of ${group.name}` : ''}? A timestamp will be saved and this cannot be undone.</p>
          <div className="mt-5 flex justify-end gap-2"><Btn variant="ghost" onClick={() => setConfirm(null)}>Not yet</Btn><Btn variant="success" onClick={() => acknowledge(confirm)}>Confirm</Btn></div>
        </Modal>
      )}
      {groupOpen && <GroupModal course={course} onClose={() => setGroupOpen(false)} />}
    </>
  );
}
