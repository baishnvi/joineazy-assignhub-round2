// Mock API layer: all data lives in localStorage. Session uses a simulated JWT.
const KEY = 'jz2_db';
export const TOKEN_KEY = 'jz2_token';
export const uid = () => Math.random().toString(36).slice(2, 9);
const h = (n) => new Date(Date.now() + n * 36e5).toISOString();

function seed() {
  const PW = 'Student@123';
  const users = [
    ['p1', 'Prof. Anita Desai', 'prof@demo.com', 'Prof@123', 'professor'],
    ['p2', 'Prof. Rahul Khanna', 'prof2@demo.com', 'Prof@123', 'professor'],
    ['s1', 'Aarav Sharma', 'student@demo.com', PW, 'student'],
    ['s2', 'Diya Mehta', 'diya@demo.com', PW, 'student'],
    ['s3', 'Rohan Verma', 'rohan@demo.com', PW, 'student'],
    ['s4', 'Ishita Rao', 'ishita@demo.com', PW, 'student'],
    ['s5', 'Kabir Singh', 'kabir@demo.com', PW, 'student'],
  ].map(([id, name, email, password, role]) => ({ id, name, email, password, role }));
  const all = ['s1', 's2', 's3', 's4', 's5'];
  const L = 'https://onedrive.live.com/';
  return {
    users,
    courses: [
      { id: 'c1', code: 'WD101', name: 'Web Development', professorId: 'p1', studentIds: all },
      { id: 'c2', code: 'CS201', name: 'Data Structures', professorId: 'p1', studentIds: all },
      { id: 'c3', code: 'DB301', name: 'Database Systems', professorId: 'p2', studentIds: ['s1', 's2'] },
    ],
    assignments: [
      { id: 'a1', courseId: 'c1', title: 'React Portfolio Project', description: 'Build a responsive portfolio with React and Tailwind CSS.', deadline: h(72), link: L, type: 'Individual' },
      { id: 'a2', courseId: 'c1', title: 'Team Capstone Proposal', description: 'One proposal document per group describing scope, stack and milestones.', deadline: h(120), link: L, type: 'Group' },
      { id: 'a3', courseId: 'c1', title: 'HTML/CSS Basics Quiz Report', description: 'Upload your solved quiz sheet with explanations.', deadline: h(-48), link: L, type: 'Individual' },
      { id: 'a4', courseId: 'c2', title: 'Linked List Implementation', description: 'Singly and doubly linked list with test cases.', deadline: h(48), link: L, type: 'Individual' },
      { id: 'a5', courseId: 'c2', title: 'Graph Algorithms Report', description: 'Compare BFS, DFS and Dijkstra with complexity analysis (group).', deadline: h(24), link: L, type: 'Group' },
      { id: 'a6', courseId: 'c3', title: 'ER Diagram Design', description: 'Design an ER diagram for a hospital management system.', deadline: h(96), link: L, type: 'Individual' },
    ],
    groups: [
      { id: 'g1', courseId: 'c1', name: 'Team Alpha', leaderId: 's2', memberIds: ['s2', 's3'] },
      { id: 'g2', courseId: 'c2', name: 'Graph Gurus', leaderId: 's1', memberIds: ['s1', 's4'] },
    ],
    acks: [
      { id: 'k1', assignmentId: 'a1', studentId: 's2', at: h(-5) },
      { id: 'k2', assignmentId: 'a1', studentId: 's3', at: h(-3) },
      { id: 'k3', assignmentId: 'a3', studentId: 's2', at: h(-60) },
      { id: 'k4', assignmentId: 'a3', studentId: 's3', at: h(-50) },
      { id: 'k5', assignmentId: 'a3', studentId: 's5', at: h(-30) },
      { id: 'k6', assignmentId: 'a2', groupId: 'g1', by: 's2', at: h(-2) },
    ],
  };
}

export const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || seed(); } catch { return seed(); } };
export const save = (db) => localStorage.setItem(KEY, JSON.stringify(db));
export const resetDb = () => { localStorage.removeItem(KEY); localStorage.removeItem(TOKEN_KEY); };

const b64 = (o) => btoa(JSON.stringify(o));
export const makeToken = (u) => `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: u.id, role: u.role, exp: Date.now() + 864e5 })}.mock-signature`;
export const readToken = (t) => { try { const p = JSON.parse(atob(t.split('.')[1])); return p.exp > Date.now() ? p : null; } catch { return null; } };

// ---- selectors ----
export const userName = (db, id) => db.users.find((u) => u.id === id)?.name ?? 'Unknown';
export const groupOf = (db, courseId, sid) => db.groups.find((g) => g.courseId === courseId && g.memberIds.includes(sid));
export const isOverdue = (a) => new Date(a.deadline) < new Date();
export function ackFor(db, a, sid) {
  if (a.type === 'Individual') return db.acks.find((k) => k.assignmentId === a.id && k.studentId === sid);
  const g = groupOf(db, a.courseId, sid);
  return g && db.acks.find((k) => k.assignmentId === a.id && k.groupId === g.id);
}
// Tracking rows for professor: students (Individual) or groups (Group)
export function track(db, course, a) {
  if (a.type === 'Individual')
    return course.studentIds.map((id) => {
      const u = db.users.find((x) => x.id === id);
      return { key: id, name: u?.name, sub: u?.email, ack: db.acks.find((k) => k.assignmentId === a.id && k.studentId === id) };
    });
  return db.groups.filter((g) => g.courseId === course.id).map((g) => ({
    key: g.id, name: g.name,
    sub: `Leader: ${userName(db, g.leaderId)} · ${g.memberIds.map((m) => userName(db, m)).join(', ')}`,
    ack: db.acks.find((k) => k.assignmentId === a.id && k.groupId === g.id),
  }));
}
