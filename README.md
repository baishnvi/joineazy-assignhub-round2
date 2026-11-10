# Joineazy AssignHub – Round 2 (UI/UX Enhancement)

Student, Group & Assignment management with role-based workflows. React + Tailwind CSS frontend in `/frontend`, powered by a **mock API** (localStorage) with a simulated JWT session.

- **Live demo:** _add Vercel link_
- **Demo video:** _add Loom link_

## Demo logins
| Role | Email | Password | Notes |
|---|---|---|---|
| Professor | `prof@demo.com` | `Prof@123` | Teaches Web Development + Data Structures |
| Student | `student@demo.com` | `Student@123` | Leader of "Graph Gurus" (DSA); no group in Web Dev |
| Student (leader) | `diya@demo.com` | `Student@123` | Leader of "Team Alpha" (Web Dev) |
| Student (member) | `rohan@demo.com` | `Student@123` | Member of Team Alpha – sees "Acknowledged by Diya Mehta…" |

You can also register new accounts (choose Student or Professor). Students are auto-enrolled in all courses; professors can create courses.

## Features
- **Auth:** validated Login/Register with clear errors, role picker, role-aware redirect, JWT-style token (with expiry) in localStorage, protected routes, logout clears the session.
- **Professor:** course cards → assignments page; create/edit assignments (title, description, deadline date+time, OneDrive link, Individual/Group); per-assignment progress bar, submitted/total, drill-down of who has / hasn't submitted; search + deadline filter.
- **Student:** course cards with progress; assignments with deadline, OneDrive link, type, acknowledgement status; two-step "Yes, I have submitted → Confirm" with timestamp; group assignments acknowledged only by the leader and shown to all members as "Acknowledged by [Leader] on [date]"; no-group message with Create/Join button.
- **Groups:** create (become leader) or join; members and leader shown.
- **Polish:** toasts, hover/active transitions, loading spinners, empty states, overdue highlighting, late-submission tag, responsive layout (mobile/tablet/desktop), keyboard-closable modals, ARIA labels.

## Design choices
- **Mock API in one file** (`src/store.js`): seed data, selectors (`ackFor`, `groupOf`, `track`) and token helpers; swapping it for a real backend only touches `App.jsx` actions.
- **Single source of truth:** one `db` object in React context persisted to localStorage; every mutation goes through `update(fn)`.
- **Group acknowledgement is stored once per group** (`groupId`), so every member sees the same record instantly.
- **Reusable UI kit** (`src/ui.jsx`): `Btn, Field, Modal, Badge, Progress, Empty, Spinner, Toasts`.
- Tailwind v4 utility classes only; mobile-first grid; indigo/violet palette with semantic colours (green = done, red = overdue, amber = pending).

## Setup
```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```
Deploy: import the repo on Vercel/Netlify, set **Root Directory = `frontend`** (SPA rewrites are included via `vercel.json` / `public/_redirects`).
Reset demo data any time by clearing the site's localStorage.

## Component structure
```
App (AppCtx: db, user, login/register/logout, toast)
├── Public routes → Auth (login | register)
└── Protected → Layout (header)
    ├── /dashboard → Dashboard (course cards, New course modal)
    └── /courses/:id → Course
        ├── ProfCourse (filters, AssignmentForm modal, tracking drill-down)
        └── StudentCourse (progress, GroupModal, confirm modal, assignment cards)
```

## Screenshots
_Add screenshots/GIFs here (login, professor tracking, student group acknowledgement, mobile view)._
