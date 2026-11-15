import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Btn, EmptyState, Field, Mascot, Pill } from "@/components/notebook/ui";
import {
  LEVELS,
  MONTHS,
  PERSIAN_SKILLS,
  classCatalog,
  classLabel,
  currentSchoolMonth,
  faNum,
  fullName,
  isoDate,
  myAssignments,
  parseScore,
  visibleStudents,
  yearForMonth,
  type AttStatus,
  type BadgeDef,
} from "@/lib/school/model";
import { useNotebook } from "@/lib/school/store";

export function AttendancePage() {
  const session = useNotebook((s) => s.session)!;
  const students = useNotebook((s) => s.students);
  const assignments = useNotebook((s) => s.assignments);
  const attendance = useNotebook((s) => s.attendance);
  const focusClassId = useNotebook((s) => s.focusClassId);
  const saveAttendanceDay = useNotebook((s) => s.saveAttendanceDay);
  const manager = session.role === "manager";
  const classes = classCatalog(students, assignments).filter((c) => manager || myAssignments(assignments, session).some((a) => a.classId === c.classId));
  const [classId, setClassId] = useState(focusClassId && classes.some((c) => c.classId === focusClassId) ? focusClassId : classes[0]?.classId ?? "");
  const [date, setDate] = useState(isoDate());
  const roster = visibleStudents(students, assignments, session).filter((s) => s.classId === classId);
  const [marks, setMarks] = useState<Record<string, AttStatus>>({});

  const rosterKey = roster.map((s) => s.id).join("|");

  useEffect(() => {
    const next: Record<string, AttStatus> = {};
    for (const s of roster) {
      next[s.id] = attendance.find((a) => a.studentId === s.id && a.classId === classId && a.date === date)?.status ?? "present";
    }
    setMarks(next);
    // roster identity follows rosterKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, date, attendance, rosterKey]);

  if (!classes.length) return <EmptyState src="/mascots/bunny.jpg" title="کلاسی برای حضور و غیاب نیست" text="ابتدا باید کلاسی به شما سپرده شده باشد." />;

  return (
    <div className="rise space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold">حضور و غیاب</h2>
          <p className="text-muted">وضعیت هر روز جدا ذخیره می‌شود و روزهای قبل پاک نمی‌شوند.</p>
        </div>
        <Mascot src="/mascots/bunny.jpg" alt="" className="size-16 rounded-full" />
      </header>
      <div className="grid gap-2 rounded-3xl bg-paper p-3 shadow-soft md:grid-cols-2">
        <select className="control" value={classId} onChange={(e) => setClassId(e.target.value)} aria-label="کلاس">
          {classes.map((c) => <option key={c.classId} value={c.classId}>{classLabel(c.classId, c.grade)}</option>)}
        </select>
        <input className="control" type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="تاریخ" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Btn kind="soft" onClick={() => setMarks(Object.fromEntries(roster.map((s) => [s.id, "present"])))}>همه حاضر</Btn>
        <Btn onClick={() => {
          const error = saveAttendanceDay(classId, date, roster.map((s) => ({ studentId: s.id, status: marks[s.id] ?? "present" })));
          if (error) toast.error(error);
          else toast.success("حضور این روز ثبت شد.");
        }}>ذخیره حضور</Btn>
      </div>
      <div className="space-y-2">
        {roster.map((s) => (
          <article key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-paper p-3 shadow-soft">
            <div>
              <h3 className="font-extrabold">{fullName(s)}</h3>
              <p className="text-sm text-muted">{s.id}</p>
            </div>
            <div className="flex gap-1">
              {(["present", "late", "absent"] as const).map((status) => (
                <button key={status} className={`min-h-11 rounded-xl px-3 text-sm font-bold ${marks[s.id] === status ? "bg-violet text-paper" : "bg-mist"}`} onClick={() => setMarks((m) => ({ ...m, [s.id]: status }))}>
                  {status === "present" ? "حاضر" : status === "late" ? "تأخیر" : "غایب"}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

type Draft = { overall: string; skills: Record<string, string>; note: string };

export function AssessPage() {
  const session = useNotebook((s) => s.session)!;
  const students = useNotebook((s) => s.students);
  const assignments = useNotebook((s) => s.assignments);
  const assessments = useNotebook((s) => s.assessments);
  const focusClassId = useNotebook((s) => s.focusClassId);
  const saveAssessments = useNotebook((s) => s.saveAssessments);
  const manager = session.role === "manager";
  const mine = useMemo(() => myAssignments(assignments, session), [assignments, session]);
  const classIds = [...new Set(mine.map((a) => a.classId))];
  const classes = classCatalog(students, assignments).filter((c) => classIds.includes(c.classId));
  const [classId, setClassId] = useState(focusClassId && classIds.includes(focusClassId) ? focusClassId : classIds[0] ?? "");
  const courses = mine.filter((a) => a.classId === classId);
  const [courseId, setCourseId] = useState(courses[0]?.courseId ?? "");
  const course = courses.find((c) => c.courseId === courseId) ?? courses[0];
  const [month, setMonth] = useState(currentSchoolMonth());
  const [q, setQ] = useState("");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const year = yearForMonth(month);

  useEffect(() => {
    if (!courses.some((c) => c.courseId === courseId)) setCourseId(courses[0]?.courseId ?? "");
  }, [classId, courseId, courses]);

  useEffect(() => {
    if (!course) return;
    const next: Record<string, Draft> = {};
    for (const id of course.studentIds) {
      const found = assessments.find((a) => a.studentId === id && a.classId === course.classId && a.courseId === course.courseId && a.month === month && a.year === year);
      next[id] = { overall: found?.overall ?? "", skills: { ...(found?.skills ?? {}) }, note: found?.note ?? "" };
    }
    setDrafts(next);
  }, [course, month, year, assessments]);

  if (!course) return <EmptyState src="/mascots/owl.jpg" title="درسی برای ارزشیابی ندارید" text="مدیر باید درس را به شما بسپارد." />;

  const roster = course.studentIds
    .map((id) => students.find((s) => s.id === id && !s.archived))
    .filter((s): s is NonNullable<typeof s> => !!s)
    .filter((s) => `${s.first} ${s.last} ${s.id}`.includes(q.trim()));
  const filled = roster.filter((s) => drafts[s.id]?.overall || Object.values(drafts[s.id]?.skills ?? {}).some(Boolean)).length;

  function patch(id: string, partial: Partial<Draft>) {
    setDrafts((d) => ({ ...d, [id]: { ...d[id], ...partial, skills: partial.skills ?? d[id]?.skills ?? {} } }));
  }

  function copyPrevious() {
    const idx = MONTHS.indexOf(month as (typeof MONTHS)[number]);
    const prev = MONTHS[idx - 1];
    if (!prev || !course) {
      toast.error("ماه قبلی در این سال تحصیلی نیست.");
      return;
    }
    const prevYear = yearForMonth(prev);
    setDrafts((d) => {
      const next = { ...d };
      for (const id of course.studentIds) {
        const found = assessments.find((a) => a.studentId === id && a.classId === course.classId && a.courseId === course.courseId && a.month === prev && a.year === prevYear);
        if (found) next[id] = { overall: found.overall, skills: { ...found.skills }, note: found.note };
      }
      return next;
    });
    toast.success(`پیش‌نویس از ${prev} کپی شد. تا وقتی ذخیره نکنید، ماه قبل دست نمی‌خورد.`);
  }

  function save() {
    const rows = [];
    for (const s of roster) {
      const draft = drafts[s.id] ?? { overall: "", skills: {}, note: "" };
      let overall = draft.overall.trim();
      if (course.numeric) {
        const parsed = parseScore(overall);
        if (parsed === null) {
          toast.error(`نمره ${fullName(s)} باید بین ۰ تا ۲۰ باشد.`);
          return;
        }
        overall = parsed;
      } else if (overall && !(LEVELS as readonly string[]).includes(overall)) {
        toast.error(`سطح ${fullName(s)} نامعتبر است.`);
        return;
      }
      const skills: Record<string, string> = {};
      if (course.isPersian) {
        for (const skill of PERSIAN_SKILLS) {
          const raw = draft.skills[skill] ?? "";
          if (!raw) continue;
          if (course.numeric) {
            const parsed = parseScore(raw);
            if (parsed === null) {
              toast.error(`مهارت ${skill} برای ${fullName(s)} نامعتبر است.`);
              return;
            }
            if (parsed) skills[skill] = parsed;
          } else if ((LEVELS as readonly string[]).includes(raw)) skills[skill] = raw;
        }
      }
      rows.push({
        studentId: s.id,
        classId: course.classId,
        courseId: course.courseId,
        courseName: course.courseName,
        teacherId: course.teacherId,
        month,
        year,
        overall,
        skills,
        note: draft.note,
      });
    }
    const result = saveAssessments(rows);
    if (result.error) toast.error(result.error);
    else if (!result.saved) toast.message("تغییری برای ذخیره نبود.");
    else toast.success(`${faNum(result.saved)} ارزشیابی ذخیره شد. نسخه قبلی در سوابق ماند.`);
  }

  return (
    <div className="rise space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold">ارزشیابی</h2>
          <p className="text-muted">{course.numeric ? "پایه متوسطه: نمره ۰ تا ۲۰" : "پایه ابتدایی: سطح توصیفی"} {course.isPersian ? "· فارسی شش مهارت جدا دارد." : ""}</p>
        </div>
        <Mascot src="/mascots/owl.jpg" alt="" className="size-16 rounded-full" />
      </header>
      <div className="grid gap-2 rounded-3xl bg-paper p-3 shadow-soft lg:grid-cols-4">
        <select className="control" value={classId} aria-label="کلاس" onChange={(e) => setClassId(e.target.value)}>
          {classes.map((c) => <option key={c.classId} value={c.classId}>{classLabel(c.classId, c.grade)}</option>)}
        </select>
        <select className="control" value={course?.courseId} aria-label="درس" onChange={(e) => setCourseId(e.target.value)}>
          {courses.map((c) => <option key={c.courseId} value={c.courseId}>{c.courseName}{manager ? ` · ${c.teacherName}` : ""}</option>)}
        </select>
        <select className="control" value={month} aria-label="ماه" onChange={(e) => setMonth(e.target.value)}>
          {MONTHS.map((m) => <option key={m}>{m}</option>)}
        </select>
        <input className="control" placeholder="جستجو در همین کلاس" value={q} onChange={(e) => setQ(e.target.value)} aria-label="جستجو" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone="mint">{faNum(filled)} از {faNum(roster.length)} نفر</Pill>
        <Btn kind="ghost" onClick={copyPrevious}>کپی از ماه قبل</Btn>
        <Btn onClick={save}>ذخیره همین ماه</Btn>
      </div>
      <div className="space-y-3">
        {roster.map((s) => {
          const draft = drafts[s.id] ?? { overall: "", skills: {}, note: "" };
          return (
            <article key={s.id} className="rounded-3xl bg-paper p-4 shadow-soft">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-extrabold">{fullName(s)}</h3>
                <span className="text-sm text-muted">{s.id}</span>
              </div>
              {course.numeric ? (
                <Field label="نمره ۰ تا ۲۰">
                  <input className="control max-w-40" inputMode="decimal" value={draft.overall} onChange={(e) => patch(s.id, { overall: e.target.value })} />
                </Field>
              ) : (
                <div className="mt-2 flex flex-wrap gap-1">
                  {LEVELS.map((level) => (
                    <button key={level} className={`min-h-11 rounded-xl px-3 text-sm font-bold ${draft.overall === level ? "bg-violet text-paper" : "bg-mist"}`} onClick={() => patch(s.id, { overall: draft.overall === level ? "" : level })}>
                      {level}
                    </button>
                  ))}
                </div>
              )}
              {course.isPersian ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {PERSIAN_SKILLS.map((skill) => (
                    <label key={skill} className="text-sm text-muted">
                      {skill}
                      {course.numeric ? (
                        <input className="control mt-1" inputMode="decimal" value={draft.skills[skill] ?? ""} onChange={(e) => patch(s.id, { skills: { ...draft.skills, [skill]: e.target.value } })} />
                      ) : (
                        <select className="control mt-1" value={draft.skills[skill] ?? ""} onChange={(e) => patch(s.id, { skills: { ...draft.skills, [skill]: e.target.value } })}>
                          <option value="">انتخاب نشده</option>
                          {LEVELS.map((level) => <option key={level}>{level}</option>)}
                        </select>
                      )}
                    </label>
                  ))}
                </div>
              ) : null}
              <Field label="توضیح معلم">
                <input className="control" value={draft.note} onChange={(e) => patch(s.id, { note: e.target.value })} />
              </Field>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export function BadgesPage() {
  const session = useNotebook((s) => s.session)!;
  const badges = useNotebook((s) => s.badges);
  const awards = useNotebook((s) => s.awards);
  const students = useNotebook((s) => s.students);
  const assignments = useNotebook((s) => s.assignments);
  const saveBadge = useNotebook((s) => s.saveBadge);
  const removeBadge = useNotebook((s) => s.removeBadge);
  const grantAward = useNotebook((s) => s.grantAward);
  const revokeAward = useNotebook((s) => s.revokeAward);
  const manager = session.role === "manager";
  const people = visibleStudents(students, assignments, session);
  const [title, setTitle] = useState("");
  const [hint, setHint] = useState("");
  const [studentId, setStudentId] = useState(people[0]?.id ?? "");
  const [badgeId, setBadgeId] = useState(badges[0]?.id ?? "");
  const [month, setMonth] = useState(currentSchoolMonth());
  const [note, setNote] = useState("");
  const mineAwards = awards.filter((a) => people.some((s) => s.id === a.studentId));

  return (
    <div className="rise space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold">نشان‌های تشویقی</h2>
          <p className="text-muted">فقط نشان مثبت. هیچ برچسب منفی‌ای این‌جا ساخته نمی‌شود.</p>
        </div>
        <Mascot src="/mascots/chick.jpg" alt="" className="floaty size-20 rounded-full" />
      </header>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {badges.map((b) => (
          <article key={b.id} className="rounded-3xl bg-paper p-4 shadow-soft">
            <Pill tone={b.tone}>{b.title}</Pill>
            <p className="mt-2 text-sm text-muted">{b.hint}</p>
            {manager ? <button className="mt-2 text-sm font-bold text-violet" onClick={() => removeBadge(b.id)}>حذف نشان</button> : null}
          </article>
        ))}
      </div>
      <section className="grid gap-4 lg:grid-cols-2">
        <form className="rounded-3xl bg-paper p-5 shadow-soft" onSubmit={(e) => {
          e.preventDefault();
          const error = grantAward(studentId, badgeId, month, note);
          if (error) toast.error(error);
          else {
            toast.success("نشان ثبت شد.");
            setNote("");
          }
        }}>
          <h3 className="mb-2 text-lg font-extrabold">دادن نشان</h3>
          <Field label="دانش‌آموز">
            <select className="control" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              {people.map((s) => <option key={s.id} value={s.id}>{fullName(s)} · {s.grade}</option>)}
            </select>
          </Field>
          <Field label="نشان">
            <select className="control" value={badgeId} onChange={(e) => setBadgeId(e.target.value)}>
              {badges.map((b) => <option key={b.id} value={b.id}>{b.title}</option>)}
            </select>
          </Field>
          <Field label="ماه">
            <select className="control" value={month} onChange={(e) => setMonth(e.target.value)}>{MONTHS.map((m) => <option key={m}>{m}</option>)}</select>
          </Field>
          <Field label="یادداشت کوتاه"><input className="control" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
          <Btn type="submit">ثبت نشان</Btn>
        </form>
        {manager ? (
          <form className="rounded-3xl bg-mist p-5" onSubmit={(e) => {
            e.preventDefault();
            const badge: BadgeDef = { id: "", title, hint, tone: "lavender" };
            const error = saveBadge(badge);
            if (error) toast.error(error);
            else {
              toast.success("نشان تازه به فهرست اضافه شد.");
              setTitle("");
              setHint("");
            }
          }}>
            <h3 className="mb-2 text-lg font-extrabold">نشان تازه، فقط مدیر</h3>
            <Field label="نام"><input className="control" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
            <Field label="معنی"><input className="control" value={hint} onChange={(e) => setHint(e.target.value)} /></Field>
            <Btn type="submit">افزودن</Btn>
          </form>
        ) : <Mascot src="/mascots/chick.jpg" alt="جوجه جشن‌گیرنده" className="mx-auto size-48 rounded-full" />}
      </section>
      <section className="space-y-2">
        {mineAwards.length ? mineAwards.slice(0, 30).map((a) => {
          const student = students.find((s) => s.id === a.studentId);
          const badge = badges.find((b) => b.id === a.badgeId);
          const can = manager || a.byId === session.teacherId;
          return (
            <article key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-paper px-3 py-2 shadow-soft">
              <p><b>{student ? fullName(student) : a.studentId}</b> · {badge?.title} · {a.month}</p>
              {can ? <button className="min-h-11 px-2 text-sm font-bold" onClick={() => revokeAward(a.id)}>پس‌گرفتن</button> : null}
            </article>
          );
        }) : <p className="text-muted">هنوز نشانی داده نشده.</p>}
      </section>
    </div>
  );
}
