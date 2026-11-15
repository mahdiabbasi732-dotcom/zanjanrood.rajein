import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Btn, EmptyState, Field, Modal, Pill } from "@/components/notebook/ui";
import {
  FAMILY_STATUSES,
  JOBS,
  classCatalog,
  classLabel,
  emptyFamily,
  faNum,
  formatBirth,
  fullName,
  gradeTone,
  myAssignments,
  schoolOf,
  teacherCatalog,
  visibleStudents,
  type FamilyFile,
  type Student,
} from "@/lib/school/model";
import { useNotebook } from "@/lib/school/store";

export function StudentsPage() {
  const session = useNotebook((s) => s.session)!;
  const students = useNotebook((s) => s.students);
  const assignments = useNotebook((s) => s.assignments);
  const openStudent = useNotebook((s) => s.openStudent);
  const saveStudent = useNotebook((s) => s.saveStudent);
  const archiveStudent = useNotebook((s) => s.archiveStudent);
  const manager = session.role === "manager";
  const [q, setQ] = useState("");
  const [grade, setGrade] = useState("همه");
  const [archived, setArchived] = useState(false);
  const [editing, setEditing] = useState<Student | null | "new">(null);
  const list = useMemo(() => {
    return visibleStudents(students, assignments, session, manager && archived).filter((s) => {
      const blob = `${s.first} ${s.last} ${s.id}`.toLowerCase();
      if (q && !blob.includes(q.trim().toLowerCase())) return false;
      if (grade !== "همه" && s.grade !== grade) return false;
      return true;
    });
  }, [students, assignments, session, q, grade, archived, manager]);
  const grades = classCatalog(students, assignments).map((c) => c.grade);

  return (
    <div className="rise space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold">دانش‌آموزان</h2>
          <p className="text-muted">{manager ? "فهرست کامل مجتمع، با پرونده خانواده فقط در بخش خودش." : "فقط دانش‌آموزان کلاس و درس شما."}</p>
        </div>
        {manager ? <Btn onClick={() => setEditing("new")}>دانش‌آموز تازه</Btn> : null}
      </header>
      <div className="grid gap-2 rounded-3xl bg-paper p-3 shadow-soft md:grid-cols-[1fr_180px_auto]">
        <input className="control" placeholder="نام یا کد دانش‌آموزی" value={q} onChange={(e) => setQ(e.target.value)} aria-label="جستجوی دانش‌آموز" />
        <select className="control" value={grade} onChange={(e) => setGrade(e.target.value)} aria-label="پایه">
          <option>همه</option>
          {grades.map((g) => <option key={g}>{g}</option>)}
        </select>
        {manager ? (
          <label className="flex min-h-11 items-center gap-2 px-2 text-sm">
            <input type="checkbox" checked={archived} onChange={(e) => setArchived(e.target.checked)} />
            بایگانی‌ها
          </label>
        ) : null}
      </div>
      {list.length ? (
        <div className="grid gap-2">
          {list.map((s) => (
            <article key={s.id} className="flex flex-wrap items-center gap-3 rounded-2xl bg-paper p-3 shadow-soft">
              <button className="flex min-w-0 flex-1 items-center gap-3 text-right" onClick={() => openStudent(s.id)}>
                <span className={`grid size-11 shrink-0 place-items-center rounded-2xl font-extrabold ${gradeTone(s.grade) === "butter" ? "bg-butter" : "bg-lavender/25"}`}>{s.first.slice(0, 1)}</span>
                <span className="min-w-0">
                  <span className="block truncate font-extrabold">{fullName(s)} {s.archived ? "· بایگانی" : ""}</span>
                  <span className="text-sm text-muted">{classLabel(s.classId, s.grade)} · {s.id}</span>
                </span>
              </button>
              <Pill tone={gradeTone(s.grade)}>{schoolOf(s.grade).stage}</Pill>
              {manager ? (
                <div className="flex gap-2">
                  <Btn kind="ghost" onClick={() => setEditing(s)}>ویرایش</Btn>
                  <Btn kind="soft" onClick={() => archiveStudent(s.id, !s.archived)}>{s.archived ? "بازگردانی" : "بایگانی"}</Btn>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      ) : (
        <EmptyState src="/mascots/bear.jpg" title="کسی پیدا نشد" text="عبارت جستجو یا پایه را تغییر دهید." />
      )}
      {editing ? (
        <StudentForm
          initial={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={(input, id) => {
            const error = saveStudent(input, id);
            if (error) toast.error(error);
            else {
              toast.success("پرونده دانش‌آموز ذخیره شد.");
              setEditing(null);
            }
          }}
        />
      ) : null}
    </div>
  );
}

function StudentForm({ initial, onClose, onSave }: { initial: Student | null; onClose: () => void; onSave: (input: Omit<Student, "archived">, id?: string) => void }) {
  const assignments = useNotebook((s) => s.assignments);
  const classes = classCatalog([], assignments);
  const [form, setForm] = useState({
    id: initial?.id ?? "",
    first: initial?.first ?? "",
    last: initial?.last ?? "",
    father: initial?.father ?? "",
    birth: initial?.birth ?? "",
    grade: initial?.grade ?? classes[0]?.grade ?? "اول",
    gender: initial?.gender ?? "دختر",
    phone: initial?.phone ?? "",
    issues: initial?.issues ?? "",
    classId: initial?.classId ?? classes[0]?.classId ?? "",
  });
  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  return (
    <Modal title={initial ? "ویرایش دانش‌آموز" : "دانش‌آموز تازه"} onClose={onClose}>
      <div className="grid gap-1 sm:grid-cols-2">
        <Field label="کد دانش‌آموزی"><input className="control" value={form.id} disabled={!!initial} onChange={(e) => set("id", e.target.value)} /></Field>
        <Field label="پایه / کلاس">
          <select className="control" value={form.classId} onChange={(e) => {
            const found = classes.find((c) => c.classId === e.target.value);
            setForm((f) => ({ ...f, classId: e.target.value, grade: found?.grade ?? f.grade }));
          }}>
            {classes.map((c) => <option key={c.classId} value={c.classId}>{classLabel(c.classId, c.grade)}</option>)}
          </select>
        </Field>
        <Field label="نام"><input className="control" value={form.first} onChange={(e) => set("first", e.target.value)} /></Field>
        <Field label="نام خانوادگی"><input className="control" value={form.last} onChange={(e) => set("last", e.target.value)} /></Field>
        <Field label="نام پدر"><input className="control" value={form.father} onChange={(e) => set("father", e.target.value)} /></Field>
        <Field label="تاریخ تولد"><input className="control" value={form.birth} onChange={(e) => set("birth", e.target.value)} placeholder="13951010" /></Field>
        <Field label="تلفن"><input className="control" value={form.phone} onChange={(e) => set("phone", e.target.value)} /></Field>
        <Field label="جنسیت"><input className="control" value={form.gender} onChange={(e) => set("gender", e.target.value)} /></Field>
      </div>
      <Field label="موارد خاص آموزشی (فقط مدیر)">
        <textarea className="control" value={form.issues} onChange={(e) => set("issues", e.target.value)} />
      </Field>
      <Btn onClick={() => onSave(form, initial?.id)}>ذخیره پرونده</Btn>
    </Modal>
  );
}

export function ProfilePage() {
  const session = useNotebook((s) => s.session)!;
  const id = useNotebook((s) => s.openStudentId);
  const students = useNotebook((s) => s.students);
  const assignments = useNotebook((s) => s.assignments);
  const assessments = useNotebook((s) => s.assessments);
  const attendance = useNotebook((s) => s.attendance);
  const notes = useNotebook((s) => s.notes);
  const awards = useNotebook((s) => s.awards);
  const badges = useNotebook((s) => s.badges);
  const family = useNotebook((s) => s.family);
  const privateNotes = useNotebook((s) => s.privateNotes);
  const saveAcademicNote = useNotebook((s) => s.saveAcademicNote);
  const setView = useNotebook((s) => s.setView);
  const manager = session.role === "manager";
  const allowed = visibleStudents(students, assignments, session, true);
  const student = allowed.find((s) => s.id === id) ?? null;
  const [month, setMonth] = useState("همه");
  const authorId = manager ? "manager" : session.teacherId || "";
  const [text, setText] = useState("");
  useEffect(() => {
    setText(notes.find((n) => n.studentId === student?.id && n.authorId === authorId)?.text ?? "");
  }, [student?.id, authorId, notes]);

  if (!student) {
    return <EmptyState src="/mascots/bear.jpg" title="پرونده‌ای باز نیست" text="از فهرست دانش‌آموزان یکی را انتخاب کنید." action={<Btn onClick={() => setView("students")}>رفتن به فهرست</Btn>} />;
  }
  const rows = assessments.filter((a) => a.studentId === student.id && (month === "همه" || a.month === month) && (manager || a.teacherId === session.teacherId));
  const absents = attendance.filter((a) => a.studentId === student.id && a.status === "absent").length;
  const school = schoolOf(student.grade);
  const shownNotes = notes.filter((n) => n.studentId === student.id && (manager || n.authorId === authorId));

  return (
    <div className="rise space-y-4">
      <section className="rounded-3xl bg-paper p-5 shadow-soft">
        <button className="text-sm font-bold text-violet" onClick={() => setView("students")}>بازگشت به فهرست</button>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-3xl font-extrabold">{fullName(student)}</h2>
            <p className="text-muted">{classLabel(student.classId, student.grade)} · {school.full}</p>
            <p className="mt-1 text-sm">کد {student.id}</p>
          </div>
          <Pill tone={gradeTone(student.grade)}>{school.stage}</Pill>
        </div>
        {manager ? (
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
            <div className="rounded-2xl bg-mist p-3"><dt className="text-muted">نام پدر</dt><dd className="font-bold">{student.father || "—"}</dd></div>
            <div className="rounded-2xl bg-mist p-3"><dt className="text-muted">تولد</dt><dd className="font-bold">{formatBirth(student.birth) || "—"}</dd></div>
            <div className="rounded-2xl bg-mist p-3"><dt className="text-muted">تلفن</dt><dd className="font-bold">{student.phone || "—"}</dd></div>
          </dl>
        ) : (
          <p className="mt-3 rounded-2xl bg-mist p-3 text-sm">نام پدر، تلفن و پرونده خانواده برای معلم نمایش داده نمی‌شود.</p>
        )}
      </section>
      <section className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-3xl bg-paper p-4 shadow-soft"><p className="text-2xl font-extrabold text-violet">{faNum(rows.length)}</p><p>ارزشیابی در این نما</p></article>
        <article className="rounded-3xl bg-paper p-4 shadow-soft"><p className="text-2xl font-extrabold text-violet">{faNum(absents)}</p><p>غیبت ثبت‌شده</p></article>
        <article className="rounded-3xl bg-paper p-4 shadow-soft"><p className="text-2xl font-extrabold text-violet">{faNum(awards.filter((a) => a.studentId === student.id).length)}</p><p>نشان تشویقی</p></article>
      </section>
      <section className="rounded-3xl bg-paper p-5 shadow-soft">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xl font-extrabold">روند ماهانه</h3>
          <select className="control max-w-40" value={month} onChange={(e) => setMonth(e.target.value)} aria-label="ماه">
            <option>همه</option>
            {["مهر", "آبان", "آذر", "دی", "بهمن", "اسفند", "فروردین", "اردیبهشت", "خرداد"].map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
        {rows.length ? (
          <div className="space-y-3">
            {rows.map((r) => (
              <article key={r.id} className="rounded-2xl border border-line p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-extrabold">{r.courseName}</h4>
                  <span className="text-sm text-muted">{r.month} {r.year} · {r.source === "import" ? "دریافتی" : "ثبت دستی"}</span>
                </div>
                <p className="mt-1 font-bold">{r.overall || "بدون سطح کلی"}</p>
                {Object.keys(r.skills).length ? <p className="text-sm">{Object.entries(r.skills).map(([k, v]) => `${k}: ${v}`).join(" · ")}</p> : null}
                {r.note ? <p className="text-sm text-muted">{r.note}</p> : null}
                {r.history.length ? (
                  <details className="mt-2 text-sm text-muted">
                    <summary>نسخه‌های قبلی ({faNum(r.history.length)})</summary>
                    {r.history.map((h, i) => <p key={i} className="mt-1">{h.overall || "—"} · {h.by}</p>)}
                  </details>
                ) : null}
              </article>
            ))}
          </div>
        ) : <EmptyState src="/mascots/owl.jpg" title="برای این ماه هنوز نمره‌ای نیست" text="از بخش ارزشیابی می‌توانید سطح این ماه را ثبت کنید." />}
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl bg-paper p-5 shadow-soft">
          <h3 className="text-xl font-extrabold">یادداشت آموزشی</h3>
          <textarea className="control mt-3" value={text} onChange={(e) => setText(e.target.value)} placeholder="مشاهده درسی، نه یادداشت محرمانه خانواده" />
          <div className="mt-3"><Btn onClick={() => {
            const error = saveAcademicNote(student.id, text);
            if (error) toast.error(error);
            else toast.success("یادداشت ذخیره شد.");
          }}>ذخیره یادداشت من</Btn></div>
          <ul className="mt-3 space-y-2 text-sm">
            {shownNotes.map((n) => <li key={n.id} className="rounded-2xl bg-mist p-3"><b>{n.authorName}: </b>{n.text}</li>)}
          </ul>
        </div>
        <div className="rounded-3xl bg-paper p-5 shadow-soft">
          <h3 className="text-xl font-extrabold">نشان‌ها</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {awards.filter((a) => a.studentId === student.id).map((a) => {
              const badge = badges.find((b) => b.id === a.badgeId);
              return <Pill key={a.id} tone={badge?.tone}>{badge?.title} · {a.month}</Pill>;
            })}
          </div>
          {manager && family[student.id] ? <p className="mt-4 text-sm text-muted">پرونده خانواده ثبت شده است: {family[student.id].status}</p> : null}
          {manager && privateNotes[student.id] ? <p className="mt-2 rounded-2xl bg-butter/40 p-3 text-sm">یادداشت محرمانه مدیر جدا از نمای معلم نگهداری می‌شود.</p> : null}
        </div>
      </section>
    </div>
  );
}

export function ClassesPage() {
  const session = useNotebook((s) => s.session)!;
  const students = useNotebook((s) => s.students);
  const assignments = useNotebook((s) => s.assignments);
  const setFocusClass = useNotebook((s) => s.setFocusClass);
  const setView = useNotebook((s) => s.setView);
  const openStudent = useNotebook((s) => s.openStudent);
  const focus = useNotebook((s) => s.focusClassId);
  const manager = session.role === "manager";
  const mine = myAssignments(assignments, session);
  const classes = classCatalog(students, assignments).filter((c) => manager || mine.some((a) => a.classId === c.classId));
  const current = classes.find((c) => c.classId === focus) ?? classes[0];

  if (!current) return <EmptyState src="/mascots/fox.jpg" title="کلاسی به شما سپرده نشده" text="اگر اشتباه است، مدیر باید تخصیص درس را بررسی کند." />;
  const roster = visibleStudents(students, assignments, session).filter((s) => s.classId === current.classId);
  const courses = assignments.filter((a) => a.classId === current.classId && (manager || a.teacherId === session.teacherId));
  const school = schoolOf(current.grade);

  return (
    <div className="rise grid gap-4 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-2">
        {classes.map((c) => (
          <button key={c.classId} onClick={() => setFocusClass(c.classId)} className={`w-full rounded-2xl p-3 text-right ${c.classId === current.classId ? "bg-violet text-paper" : "bg-paper shadow-soft"}`}>
            <span className="block font-extrabold">{classLabel(c.classId, c.grade)}</span>
            <span className={`text-sm ${c.classId === current.classId ? "text-paper" : "text-muted"}`}>{faNum(c.count)} دانش‌آموز</span>
          </button>
        ))}
      </aside>
      <section className="rounded-3xl bg-paper p-5 shadow-soft">
        <p className="text-sm font-bold text-violet">{school.full}</p>
        <h2 className="text-2xl font-extrabold">{classLabel(current.classId, current.grade)}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Btn onClick={() => { setFocusClass(current.classId); setView("assess"); }}>ارزشیابی این کلاس</Btn>
          <Btn kind="soft" onClick={() => { setFocusClass(current.classId); setView("attendance"); }}>حضور و غیاب</Btn>
        </div>
        <h3 className="mb-2 mt-5 font-extrabold">درس‌ها</h3>
        <div className="flex flex-wrap gap-2">
          {courses.map((c) => <Pill key={c.courseId} tone={gradeTone(current.grade)}>{c.courseName} · {c.teacherName}</Pill>)}
        </div>
        <h3 className="mb-2 mt-5 font-extrabold">دانش‌آموزان</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {roster.map((s) => (
            <button key={s.id} className="rounded-2xl bg-mist px-3 py-3 text-right" onClick={() => openStudent(s.id)}>
              <span className="block font-bold">{fullName(s)}</span>
              <span className="text-sm text-muted">{s.id}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

export function TeachersPage() {
  const session = useNotebook((s) => s.session)!;
  const assignments = useNotebook((s) => s.assignments);
  const resetTeacherPassword = useNotebook((s) => s.resetTeacherPassword);
  const teachers = teacherCatalog(assignments);
  const [resetId, setResetId] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  if (session.role !== "manager") return <EmptyState src="/mascots/panda.jpg" title="این بخش برای مدیر است" text="معلمان فهرست همکاران را اینجا نمی‌بینند." />;
  return (
    <div className="rise space-y-4">
      <header>
        <h2 className="text-2xl font-extrabold">معلمان</h2>
        <p className="text-muted">{faNum(teachers.length)} معلم در ابتدایی پروین اعتصامی و متوسطه حضرت زینب کبری (س)</p>
      </header>
      <div className="grid gap-3 md:grid-cols-2">
        {teachers.map((t) => (
          <article key={t.id} className="rounded-3xl bg-paper p-4 shadow-soft">
            <h3 className="text-lg font-extrabold">{t.name}</h3>
            <p className="text-sm text-muted">کد پرسنلی {t.id}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {t.grades.map((g) => <Pill key={g} tone={gradeTone(g)}>پایه {g}</Pill>)}
            </div>
            <p className="mt-2 text-sm">{t.courses.slice(0, 4).join("، ")}{t.courses.length > 4 ? "…" : ""}</p>
            <div className="mt-3"><Btn kind="ghost" onClick={() => { setResetId(t.id); setPassword(""); }}>بازنشانی رمز</Btn></div>
          </article>
        ))}
      </div>
      {resetId ? (
        <Modal title="رمز تازه معلم" onClose={() => setResetId(null)}>
          <Field label="رمز جدید">
            <input className="control" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Btn onClick={() => {
            void resetTeacherPassword(resetId, password).then((error) => {
              if (error) toast.error(error);
              else {
                toast.success("رمز معلم عوض شد. آن را جداگانه به خودش بگویید.");
                setResetId(null);
              }
            });
          }}>ذخیره رمز</Btn>
        </Modal>
      ) : null}
    </div>
  );
}

export function FamilyPage() {
  const session = useNotebook((s) => s.session)!;
  const students = useNotebook((s) => s.students);
  const family = useNotebook((s) => s.family);
  const privateNotes = useNotebook((s) => s.privateNotes);
  const saveFamily = useNotebook((s) => s.saveFamily);
  const [q, setQ] = useState("");
  const [id, setId] = useState<string | null>(null);
  if (session.role !== "manager") return <EmptyState src="/mascots/cat.jpg" title="پرونده خانواده محرمانه است" text="فقط مدیر مدرسه این بخش را می‌بیند و در خروجی معلم نمی‌آید." />;
  const list = students.filter((s) => !s.archived && `${s.first} ${s.last} ${s.id}`.includes(q.trim()));
  const student = students.find((s) => s.id === id) ?? null;
  return (
    <div className="rise grid gap-4 lg:grid-cols-[280px_1fr]">
      <div>
        <h2 className="mb-2 text-2xl font-extrabold">پرونده خانواده</h2>
        <input className="control mb-2" placeholder="جستجو" value={q} onChange={(e) => setQ(e.target.value)} aria-label="جستجو در پرونده خانواده" />
        <div className="max-h-[70vh] space-y-1 overflow-auto">
          {list.map((s) => (
            <button key={s.id} className={`block w-full rounded-2xl px-3 py-2 text-right ${s.id === id ? "bg-violet text-paper" : "bg-paper"}`} onClick={() => setId(s.id)}>
              <span className="block font-bold">{fullName(s)}</span>
              <span className="text-sm opacity-80">{family[s.id] ? "پرونده دارد" : "بدون پرونده"}</span>
            </button>
          ))}
        </div>
      </div>
      {student ? <FamilyEditor key={student.id} student={student} file={family[student.id] ?? emptyFamily()} priv={privateNotes[student.id] ?? ""} onSave={saveFamily} /> : <EmptyState src="/mascots/cat.jpg" title="یک دانش‌آموز را انتخاب کنید" text="اطلاعات خانواده فقط همین‌جا و در پشتیبان مدیر می‌ماند." />}
    </div>
  );
}

function FamilyEditor({ student, file, priv, onSave }: { student: Student; file: FamilyFile; priv: string; onSave: (id: string, file: FamilyFile, priv: string) => string | null }) {
  const [form, setForm] = useState(file);
  const [note, setNote] = useState(priv);
  const together = form.status === "با هم زندگی می‌کنند";
  function set<K extends keyof FamilyFile>(key: K, value: FamilyFile[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  return (
    <form className="rounded-3xl bg-paper p-5 shadow-soft" onSubmit={(e) => {
      e.preventDefault();
      const error = onSave(student.id, form, note);
      if (error) toast.error(error);
      else toast.success("پرونده خانواده ذخیره شد.");
    }}>
      <h3 className="text-xl font-extrabold">{fullName(student)}</h3>
      <p className="mb-3 text-sm text-muted">{classLabel(student.classId, student.grade)} · این برگه در خروجی معلم نیست.</p>
      <Field label="وضعیت خانواده">
        <select className="control" value={form.status} onChange={(e) => set("status", e.target.value)}>
          {FAMILY_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <div className="grid sm:grid-cols-3">
        <Field label="اعضای خانواده"><input className="control" type="number" min={1} value={form.members} onChange={(e) => set("members", e.target.value)} /></Field>
        <Field label="خواهر و برادر"><input className="control" type="number" min={0} value={form.siblings} onChange={(e) => set("siblings", e.target.value)} /></Field>
        <Field label="ترتیب تولد"><input className="control" type="number" min={1} value={form.birthOrder} onChange={(e) => set("birthOrder", e.target.value)} /></Field>
      </div>
      <div className="grid sm:grid-cols-2">
        <Field label="شغل پدر"><select className="control" value={form.fatherJob} onChange={(e) => set("fatherJob", e.target.value)}>{JOBS.map((j) => <option key={j || "empty"}>{j}</option>)}</select></Field>
        <Field label="شغل مادر"><select className="control" value={form.motherJob} onChange={(e) => set("motherJob", e.target.value)}>{JOBS.map((j) => <option key={`m${j}`}>{j}</option>)}</select></Field>
      </div>
      <Field label="محل زندگی و سرپرستی"><textarea className="control" value={form.living} onChange={(e) => set("living", e.target.value)} /></Field>
      {together ? null : <Field label="ازدواج مجدد یا سرپرست"><textarea className="control" value={form.guardian} onChange={(e) => set("guardian", e.target.value)} /></Field>}
      <Field label="یادداشت محرمانه مدیر"><textarea className="control" value={note} onChange={(e) => setNote(e.target.value)} /></Field>
      <Btn type="submit">ذخیره پرونده</Btn>
    </form>
  );
}
