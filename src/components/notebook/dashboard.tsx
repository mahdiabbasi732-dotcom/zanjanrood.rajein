import { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Btn, Mascot, Pill } from "@/components/notebook/ui";
import {
  YEAR_LABEL,
  classCatalog,
  classLabel,
  currentSchoolMonth,
  faLong,
  faNum,
  fullName,
  greeting,
  isoDate,
  myAssignments,
  schoolOf,
  teacherCatalog,
  visibleStudents,
  yearForMonth,
} from "@/lib/school/model";
import { useNotebook, visibleNews, teacherScopeGrades } from "@/lib/school/store";

export function Dashboard() {
  const session = useNotebook((s) => s.session)!;
  const students = useNotebook((s) => s.students);
  const assignments = useNotebook((s) => s.assignments);
  const assessments = useNotebook((s) => s.assessments);
  const attendance = useNotebook((s) => s.attendance);
  const activity = useNotebook((s) => s.activity);
  const announcements = useNotebook((s) => s.announcements);
  const setView = useNotebook((s) => s.setView);
  const setFocusClass = useNotebook((s) => s.setFocusClass);
  const manager = session.role === "manager";
  const month = currentSchoolMonth();
  const year = yearForMonth(month);
  const today = isoDate();
  const mine = useMemo(() => myAssignments(assignments, session), [assignments, session]);
  const people = useMemo(() => visibleStudents(students, assignments, session), [students, assignments, session]);
  const classes = useMemo(() => {
    const ids = new Set(mine.map((a) => a.classId));
    return classCatalog(students, assignments).filter((c) => manager || ids.has(c.classId));
  }, [students, assignments, mine, manager]);
  const teachers = useMemo(() => teacherCatalog(assignments), [assignments]);
  const news = visibleNews(announcements, session, teacherScopeGrades({ assignments, session })).slice(0, 3);

  const todayRows = attendance.filter((a) => a.date === today && (manager || classes.some((c) => c.classId === a.classId)));
  const absent = todayRows.filter((a) => a.status === "absent").length;
  const monthRows = assessments.filter((a) => a.month === month && a.year === year && (manager || a.teacherId === session.teacherId) && a.overall);
  const pending = mine.filter((a) => {
    const roster = a.studentIds.filter((id) => people.some((s) => s.id === id));
    return roster.some((id) => !assessments.some((r) => r.studentId === id && r.classId === a.classId && r.courseId === a.courseId && r.month === month && r.year === year && (r.overall || Object.keys(r.skills).length)));
  }).length;

  const chart = classes.map((c) => {
    const covered = people.filter((s) => s.classId === c.classId && assessments.some((a) => a.studentId === s.id && a.month === month && a.year === year && a.overall)).length;
    return { grade: c.grade, covered, total: c.count };
  });

  return (
    <div className="rise space-y-5">
      <section className="grid items-center gap-4 rounded-3xl bg-paper p-5 shadow-soft lg:grid-cols-[1fr_auto]">
        <div>
          <p className="text-sm font-bold text-violet">{faLong()}</p>
          <h2 className="mt-1 text-3xl font-extrabold">
            {greeting()}، {session.name}
          </h2>
          <p className="mt-2 max-w-xl text-muted">
            {manager ? "نمای مدیر مجتمع آموزشی رجعین" : "فقط کلاس‌ها و درس‌های شما اینجاست"} · سال {YEAR_LABEL}
          </p>
          <p className="mt-3 text-lg">امروز هم یک روز تازه برای یادگیری و پیشرفت است.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Btn onClick={() => setView("assess")}>ثبت ارزشیابی {month}</Btn>
            <Btn kind="soft" onClick={() => setView("attendance")}>حضور امروز</Btn>
          </div>
        </div>
        <Mascot src={manager ? "/mascots/owl.jpg" : "/mascots/panda.jpg"} alt="" className="floaty mx-auto size-36 rounded-full sm:size-44" />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat n={people.length} label={manager ? "دانش‌آموزان" : "دانش‌آموزان من"} hint="پرونده فعال" />
        <Stat n={classes.length} label="کلاس‌ها" hint={manager ? "ابتدایی و متوسطه" : "کلاس‌های سپرده‌شده"} />
        <Stat n={manager ? teachers.length : mine.length} label={manager ? "معلمان" : "درس‌های من"} hint={manager ? "در هر دو مدرسه" : "درس فعال"} />
        <Stat n={absent} label="غیبت امروز" hint={todayRows.length ? `${faNum(todayRows.length)} نفر ثبت شده` : "هنوز حضوری ثبت نشده"} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl bg-paper p-5 shadow-soft">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h3 className="text-xl font-extrabold">پوشش ارزشیابی {month}</h3>
              <p className="text-sm text-muted">{faNum(monthRows.length)} نمره یا سطح ثبت‌شده · {faNum(pending)} درس هنوز ناتمام</p>
            </div>
            <Pill tone="butter">{year}</Pill>
          </div>
          <div className="h-64" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <XAxis dataKey="grade" tick={{ fill: "#30334a", fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fill: "#5f6278", fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="covered" name="دانش‌آموز دارای ارزشیابی" fill="var(--color-violet)" radius={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-3xl bg-paper p-5 shadow-soft">
          <h3 className="text-xl font-extrabold">کلاس‌ها</h3>
          <div className="mt-3 space-y-2">
            {classes.map((c) => {
              const school = schoolOf(c.grade);
              return (
                <button
                  key={c.classId}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl bg-mist px-3 py-3 text-right"
                  onClick={() => {
                    setFocusClass(c.classId);
                    setView(manager ? "classes" : "assess");
                  }}
                >
                  <span>
                    <span className="block font-extrabold">{classLabel(c.classId, c.grade)}</span>
                    <span className="text-sm text-muted">{school.short}</span>
                  </span>
                  <Pill>{faNum(c.count)} نفر</Pill>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl bg-paper p-5 shadow-soft">
          <h3 className="text-xl font-extrabold">اطلاعیه‌ها</h3>
          <div className="mt-3 space-y-3">
            {news.length ? news.map((item) => (
              <article key={item.id}>
                <h4 className="font-bold">{item.title}</h4>
                <p className="text-sm text-muted">{item.body}</p>
              </article>
            )) : <p className="text-muted">اطلاعیه‌ای نیست.</p>}
          </div>
        </div>
        <div className="rounded-3xl bg-paper p-5 shadow-soft">
          <h3 className="text-xl font-extrabold">فعالیت‌های تازه</h3>
          <ul className="mt-3 space-y-2">
            {activity.length ? activity.slice(0, 6).map((item) => (
              <li key={item.id} className="rounded-2xl bg-mist px-3 py-2 text-sm">
                {item.text}
              </li>
            )) : <li className="text-muted">هنوز فعالیتی ثبت نشده. اولین ارزشیابی را همین امروز بنویسید.</li>}
          </ul>
          {manager ? null : <p className="mt-3 text-sm text-muted">نمونه دانش‌آموز شما: {people[0] ? fullName(people[0]) : "—"}</p>}
        </div>
      </section>
    </div>
  );
}

function Stat({ n, label, hint }: { n: number; label: string; hint: string }) {
  return (
    <article className="rounded-3xl bg-paper p-4 shadow-soft">
      <p className="text-3xl font-extrabold text-violet">{faNum(n)}</p>
      <h3 className="font-bold">{label}</h3>
      <p className="text-sm text-muted">{hint}</p>
    </article>
  );
}
