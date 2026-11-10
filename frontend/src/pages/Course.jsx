import { Link, Navigate, useParams } from 'react-router-dom';
import { useApp } from '../ctx';
import ProfCourse from './ProfCourse';
import StudentCourse from './StudentCourse';

export default function Course() {
  const { id } = useParams();
  const { db, user } = useApp();
  const course = db.courses.find((c) => c.id === id);
  const ok = course && (user.role === 'professor' ? course.professorId === user.id : course.studentIds.includes(user.id));
  if (!ok) return <Navigate to="/dashboard" replace />;
  return (
    <div className="anim-in">
      <Link to="/dashboard" className="mb-3 inline-block text-sm text-indigo-600 hover:underline">← Back to courses</Link>
      <div className="mb-5"><span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{course.code}</span><h1 className="text-2xl font-bold">{course.name}</h1></div>
      {user.role === 'professor' ? <ProfCourse course={course} /> : <StudentCourse course={course} />}
    </div>
  );
}
