import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Btn, EmptyState, Field, Mascot, Pill } from "@/components/notebook/ui";
import { csvToPackage, downloadFile, previewImport, toCsv, type ImportPreview } from "@/lib/school/io";
import {
  COMPLEX,
  ELEMENTARY,
  LEVELS,
  MIDDLE,
  MONTHS,
  YEAR_LABEL,
  classCatalog,
  classLabel,
  currentSchoolMonth,
  faLong,
  faNum,
  fullName,
  myAssignments,
  schoolOf,
  teacherCatalog,
  visibleStudents,
  yearForMonth,
} from "@/lib/school/model";
import { backupOf, teacherScopeGrades, useNotebook, visibleNews } from "@/lib/school/store";

export function NewsPage() {
  const session = useNotebook((s) => s.session)!;
  const announcements = useNotebook((s) => s.announcements);
  const assignments = useNotebook((s) => s.assignments);
  const saveAnnouncement = useNotebook((s) => s.saveAnnouncement);
  const removeAnnouncement = useNotebook((s) => s.removeAnnouncement);
  const manager = session.role === "manager";
  const items = visibleNews(announcements, session, teacherScopeGrades({ assignments, session }));
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"all" | "teachers" | "grade">("all");
  const [grade, setGrade] = useState("اول");
  return (
    <div className="rise space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold">اطلاعیه‌ها</h2>
          <p className="text-muted">خبرهای مدرسه، کوتاه و روشن.</p>
        </div>
        <Mascot src="/mascots/cloud.jpg" alt="" className="size-16 rounded-full" />
      </header>
      {manager ? (
        <form className="rounded-3xl bg-paper p-5 shadow-soft" onSubmit={(e) => {
          e.preventDefault();
          const error = saveAnnouncement({ title, body, audience, grade });
          if (error) toast.error(error);
          else {
            toast.success("اطلاعیه منتشر شد.");
            setTitle("");
            setBody("");
          }
        }}>
          <div className="grid gap-2 md:grid-cols-2">
            <Field label="عنوان"><input className="control" value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
            <Field label="مخاطب">
              <select className="control" value={audience} onChange={(e) => setAudience(e.target.value as typeof audience)}>
                <option value="all">همه</option>
                <option value="teachers">معلمان</option>
                <option value="grade">یک پایه</option>
              </select>
            </Field>
          </div>
          {audience === "grade" ? (
            <Field label="پایه">
              <select className="control" value={grade} onChange={(e) => setGrade(e.target.value)}>{["اول", "دوم", "سوم", "چهارم", "پنجم", "ششم", "هفتم", "هشتم", "نهم"].map((g) => <option key={g}>{g}</option>)}</select>
            </Field>
          ) : null}
          <Field label="متن"><textarea className="control" value={body} onChange={(e) => setBody(e.target.value)} /></Field>
          <Btn type="submit">انتشار</Btn>
        </form>
      ) : null}
      <div className="space-y-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-3xl bg-paper p-4 shadow-soft">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-extrabold">{item.title}</h3>
              {manager ? <button className="text-sm font-bold text-violet" onClick={() => removeAnnouncement(item.id)}>حذف</button> : null}
            </div>
            <p className="mt-1">{item.body}</p>
            <p className="mt-2 text-sm text-muted">{item.by}{item.audience === "grade" ? ` · پایه ${item.grade}` : ""}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export function ReportsPage() {
  const session = useNotebook((s) => s.session)!;
  const students = useNotebook((s) => s.students);
  const assignments = useNotebook((s) => s.assignments);
  const assessments = useNotebook((s) => s.assessments);
  const attendance = useNotebook((s) => s.attendance);
  const managerName = useNotebook((s) => s.managerName);
  const manager = session.role === "manager";
  const people = visibleStudents(students, assignments, session);
  const classes = classCatalog(students, assignments).filter((c) => manager || myAssignments(assignments, session).some((a) => a.classId === c.classId));
  const [studentId, setStudentId] = useState(people[0]?.id ?? "");
  const [classId, setClassId] = useState(classes[0]?.classId ?? "");
  const [month, setMonth] = useState(currentSchoolMonth());
  const [kind, setKind] = useState<"student" | "class" | "attend">("student");
  const student = people.find((s) => s.id === studentId) ?? null;
  const year = yearForMonth(month);
  const studentRows = assessments.filter((a) => a.studentId === studentId && (manager || a.teacherId === session.teacherId));
  const classCourses = assignments.filter((a) => a.classId === classId && (manager || a.teacherId === session.teacherId));
  const classStudents = people.filter((s) => s.classId === classId);
  const school = student ? schoolOf(student.grade) : schoolOf(classes.find((c) => c.classId === classId)?.grade || "اول");

  return (
    <div className="rise space-y-4">
      <header className="no-print flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold">گزارش و چاپ</h2>
          <p className="text-muted">خود دفتر رنگی است. برگه چاپ، ساده و اداری می‌ماند.</p>
        </div>
        <Btn onClick={() => window.print()}>چاپ همین برگه</Btn>
      </header>
      <div className="no-print grid gap-2 rounded-3xl bg-paper p-3 shadow-soft md:grid-cols-4">
        <select className="control" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)} aria-label="نوع گزارش">
          <option value="student">کارنامه دانش‌آموز</option>
          <option value="class">خلاصه کلاس</option>
          <option value="attend">حضور و غیاب</option>
        </select>
        {kind === "student" ? (
          <select className="control md:col-span-2" value={studentId} onChange={(e) => setStudentId(e.target.value)} aria-label="دانش‌آموز">
            {people.map((s) => <option key={s.id} value={s.id}>{fullName(s)} · {s.grade}</option>)}
          </select>
        ) : (
          <select className="control" value={classId} onChange={(e) => setClassId(e.target.value)} aria-label="کلاس">
            {classes.map((c) => <option key={c.classId} value={c.classId}>{classLabel(c.classId, c.grade)}</option>)}
          </select>
        )}
        {kind === "student" ? null : (
          <select className="control" value={month} onChange={(e) => setMonth(e.target.value)} aria-label="ماه">{MONTHS.map((m) => <option key={m}>{m}</option>)}</select>
        )}
      </div>
      <article id="print-root" className="rounded-3xl border border-line bg-paper p-6 text-ink shadow-soft">
        <header className="border-b border-ink pb-3">
          <h3 className="text-center text-xl font-extrabold">{school.full}</h3>
          <p className="text-center text-sm">{COMPLEX} · سال تحصیلی {YEAR_LABEL}</p>
          <p className="text-center text-sm">{kind === "student" ? "کارنامه ارزشیابی" : kind === "class" ? `خلاصه کلاس ${month} ${year}` : `گزارش حضور ${month}`}</p>
        </header>
        {kind === "student" && student ? (
          <div className="mt-4">
            <p>نام: <b>{fullName(student)}</b></p>
            <p>پایه: {student.grade} · کد: {student.id}</p>
            <p className="text-sm">مدیر: {managerName} · تاریخ تهیه: {faLong()}</p>
            <table className="mt-4 w-full border-collapse text-sm">
              <thead><tr className="border-b border-ink"><th className="p-2 text-right">ماه</th><th className="p-2 text-right">درس</th><th className="p-2 text-right">ارزشیابی</th><th className="p-2 text-right">مهارت‌ها</th></tr></thead>
              <tbody>
                {studentRows.map((r) => (
                  <tr key={r.id} className="border-b border-line">
                    <td className="p-2">{r.month} {r.year}</td>
                    <td className="p-2">{r.courseName}</td>
                    <td className="p-2">{r.overall || "—"}</td>
                    <td className="p-2">{Object.entries(r.skills).map(([k, v]) => `${k}: ${v}`).join("، ") || "—"}</td>
                  </tr>
                ))}
                {!studentRows.length ? <tr><td className="p-2" colSpan={4}>ارزشیابی ثبت نشده است.</td></tr> : null}
              </tbody>
            </table>
          </div>
        ) : null}
        {kind === "class" ? (
          <div className="mt-4 overflow-auto">
            <p className="mb-2">{classLabel(classId, classes.find((c) => c.classId === classId)?.grade || "")}</p>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-ink">
                  <th className="p-2 text-right">دانش‌آموز</th>
                  {classCourses.map((c) => <th key={c.courseId} className="p-2 text-right">{c.courseName}</th>)}
                </tr>
              </thead>
              <tbody>
                {classStudents.map((s) => (
                  <tr key={s.id} className="border-b border-line">
                    <td className="p-2">{fullName(s)}</td>
                    {classCourses.map((c) => {
                      const row = assessments.find((a) => a.studentId === s.id && a.courseId === c.courseId && a.month === month && a.year === year);
                      return <td key={c.courseId} className="p-2">{row?.overall || "—"}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
        {kind === "attend" ? (
          <table className="mt-4 w-full border-collapse text-sm">
            <thead><tr className="border-b border-ink"><th className="p-2 text-right">دانش‌آموز</th><th className="p-2 text-right">حاضر</th><th className="p-2 text-right">تأخیر</th><th className="p-2 text-right">غایب</th></tr></thead>
            <tbody>
              {classStudents.map((s) => {
                const rows = attendance.filter((a) => a.studentId === s.id && a.classId === classId);
                return (
                  <tr key={s.id} className="border-b border-line">
                    <td className="p-2">{fullName(s)}</td>
                    <td className="p-2">{faNum(rows.filter((r) => r.status === "present").length)}</td>
                    <td className="p-2">{faNum(rows.filter((r) => r.status === "late").length)}</td>
                    <td className="p-2">{faNum(rows.filter((r) => r.status === "absent").length)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : null}
        <p className="mt-6 text-sm">سطح‌های توصیفی: {LEVELS.join("، ")}. نمره متوسطه از ۰ تا ۲۰ است.</p>
      </article>
    </div>
  );
}

export function ExchangePage() {
  const session = useNotebook((s) => s.session)!;
  const students = useNotebook((s) => s.students);
  const assignments = useNotebook((s) => s.assignments);
  const assessments = useNotebook((s) => s.assessments);
  const importLogs = useNotebook((s) => s.importLogs);
  const applyImport = useNotebook((s) => s.applyImport);
  const manager = session.role === "manager";
  const teachers = teacherCatalog(assignments);
  const [teacherId, setTeacherId] = useState(session.teacherId || teachers[0]?.id || "");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mode, setMode] = useState<"replace" | "skip">("replace");
  const activeTeacher = session.role === "teacher" ? session.teacherId || "" : teacherId;

  function exportTeacher() {
    const teacher = teachers.find((t) => t.id === activeTeacher);
    if (!teacher) return;
    const records = assessments.filter((a) => a.teacherId === teacher.id).map((a) => ({
      type: "assessment",
      studentId: a.studentId,
      classId: a.classId,
      courseId: a.courseId,
      courseName: a.courseName,
      month: a.month,
      year: a.year,
      overall: a.overall,
      skills: a.skills,
      note: a.note,
    }));
    const pack = {
      schema: "parvin-rajaein-teacher-export",
      version: 1,
      elementary: ELEMENTARY,
      middle: MIDDLE,
      teacherId: teacher.id,
      teacherName: teacher.name,
      exportedAt: new Date().toISOString(),
      records,
    };
    downloadFile(`خروجی_${teacher.name}.json`, JSON.stringify(pack, null, 2), "application/json");
    toast.success("فایل خروجی آماده شد. آن را به مدیر بدهید.");
  }

  function exportCsv() {
    const list = assessments.filter((a) => manager || a.teacherId === session.teacherId);
    const rows: string[][] = manager
      ? [["کد دانش‌آموزی", "نام", "نام خانوادگی", "پایه", "شناسه کلاس", "کد درس", "درس", "ماه", "سال", "ارزشیابی کلی", "توضیح", "مهارت‌ها"]]
      : [["کد دانش‌آموزی", "شناسه کلاس", "کد درس", "ماه", "سال", "ارزشیابی کلی", "توضیح", "مهارت‌ها"]];
    for (const a of list) {
      const skills = Object.entries(a.skills).map(([k, v]) => `${k}:${v}`).join(" | ");
      if (manager) {
        const s = students.find((st) => st.id === a.studentId);
        rows.push([a.studentId, s?.first || "", s?.last || "", s?.grade || "", a.classId, a.courseId, a.courseName, a.month, a.year, a.overall, a.note, skills]);
      } else rows.push([a.studentId, a.classId, a.courseId, a.month, a.year, a.overall, a.note, skills]);
    }
    downloadFile("ارزشیابی.csv", toCsv(rows), "text/csv;charset=utf-8");
  }

  const summary = useMemo(() => {
    if (!preview || !preview.ok) return null;
    return {
      fresh: preview.changes.filter((c) => c.status === "new").length,
      conflict: preview.changes.filter((c) => c.status === "conflict").length,
      same: preview.changes.filter((c) => c.status === "same").length,
    };
  }, [preview]);

  return (
    <div className="rise space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold">تبادل داده</h2>
          <p className="text-muted">معلم خروجی می‌سازد. مدیر پیش‌نمایش می‌بیند و بعد ثبت می‌کند. ماه‌های قبلی بی‌صدا عوض نمی‌شوند.</p>
        </div>
        <Mascot src="/mascots/fox.jpg" alt="" className="size-16 rounded-full" />
      </header>
      <section className="rounded-3xl bg-paper p-5 shadow-soft">
        <h3 className="text-lg font-extrabold">{manager ? "خروجی کار یک معلم" : "خروجی کار من"}</h3>
        <p className="mb-3 text-sm text-muted">در این فایل تلفن، نام پدر، پرونده خانواده و یادداشت محرمانه نیست.</p>
        {manager ? (
          <Field label="معلم">
            <select className="control" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Btn onClick={exportTeacher}>ساخت فایل برای مدیر</Btn>
          <Btn kind="ghost" onClick={exportCsv}>خروجی جدول</Btn>
        </div>
      </section>
      {manager ? (
        <section className="rounded-3xl bg-paper p-5 shadow-soft">
          <h3 className="text-lg font-extrabold">دریافت فایل معلم</h3>
          <p className="text-sm text-muted">فایل‌های دفتر قبلی هم پذیرفته می‌شوند، ولی نام مدرسه داخل آن‌ها نادیده گرفته می‌شود.</p>
          <input className="mt-3 block w-full text-sm" type="file" accept="application/json,.json,text/csv,.csv" aria-label="انتخاب فایل معلم" onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const text = await file.text();
              const pkg = file.name.endsWith(".csv") ? csvToPackage(text, teacherId, teachers.find((t) => t.id === teacherId)?.name || "") : JSON.parse(text);
              const result = previewImport(pkg, { assignments, students, assessments });
              setPreview(result);
              if (!result.ok) toast.error(result.error);
            } catch {
              toast.error("فایل خوانده نشد. JSON یا جدول با سرستون درست لازم است.");
            }
          }} />
          {preview?.ok ? (
            <div className="mt-4">
              <p>معلم: <b>{preview.teacherName}</b></p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Pill tone="mint">{faNum(summary?.fresh || 0)} تازه</Pill>
                <Pill tone="butter">{faNum(summary?.conflict || 0)} اختلاف با سابقه</Pill>
                <Pill>{faNum(summary?.same || 0)} تکراری بدون تغییر</Pill>
                <Pill tone="peach">{faNum(preview.rejected.length)} رد شده</Pill>
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input type="radio" checked={mode === "replace"} onChange={() => setMode("replace")} />
                نسخه جدید بنشیند و قبلی در سوابق بماند
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" checked={mode === "skip"} onChange={() => setMode("skip")} />
                رکوردهای موجود دست نخورند
              </label>
              <div className="mt-3 max-h-64 overflow-auto rounded-2xl border border-line">
                {preview.changes.slice(0, 40).map((c) => (
                  <p key={c.key} className="border-b border-line px-3 py-2 text-sm">{c.name} · {c.courseName} · {c.month}: {c.overall || "مهارت"} {c.status === "conflict" ? `به‌جای ${c.previous}` : ""}</p>
                ))}
                {preview.rejected.slice(0, 12).map((r) => <p key={r} className="px-3 py-2 text-sm text-muted">{r}</p>)}
              </div>
              <div className="mt-3">
                <Btn onClick={() => {
                  const result = applyImport(preview.changes, mode, preview.teacherName);
                  if ("error" in result) toast.error(result.error);
                  else {
                    toast.success(`${faNum(result.added)} تازه و ${faNum(result.updated)} به‌روز شد.`);
                    setPreview(null);
                  }
                }}>تأیید و ثبت</Btn>
              </div>
            </div>
          ) : null}
          {importLogs.length ? (
            <ul className="mt-4 space-y-1 text-sm text-muted">
              {importLogs.slice(0, 5).map((log) => <li key={log.id}>{log.teacherName}: {faNum(log.added)} تازه، {faNum(log.updated)} به‌روز، {faNum(log.skipped)} ردِ تکراری</li>)}
            </ul>
          ) : null}
        </section>
      ) : (
        <p className="rounded-3xl bg-mist p-4 text-sm">پشتیبان کامل مدرسه فقط روی دستگاه مدیر است. شما همین فایل خروجی را تحویل می‌دهید.</p>
      )}
    </div>
  );
}

export function BackupPage() {
  const session = useNotebook((s) => s.session)!;
  const state = useNotebook();
  const restoreBackup = useNotebook((s) => s.restoreBackup);
  const [armed, setArmed] = useState(false);
  if (session.role !== "manager") return <EmptyState src="/mascots/panda.jpg" title="پشتیبان مخصوص مدیر است" text="معلمان از بخش تبادل داده خروجی کار خود را می‌گیرند." />;
  return (
    <div className="rise space-y-4">
      <h2 className="text-2xl font-extrabold">پشتیبان و بازیابی</h2>
      <section className="rounded-3xl bg-paper p-5 shadow-soft">
        <p>نسخه پشتیبان شامل ارزشیابی، حضور، پرونده خانواده و یادداشت محرمانه است. رمزنگاری نشده. فقط روی دستگاه خودتان بماند.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Btn onClick={() => downloadFile("پشتیبان_دفتر_کلاس.json", JSON.stringify(backupOf(state), null, 2), "application/json")}>دریافت پشتیبان</Btn>
        </div>
      </section>
      <section className="rounded-3xl bg-peach/30 p-5">
        <h3 className="font-extrabold">بازیابی</h3>
        <p className="text-sm">بازیابی، داده‌های فعلی همین دستگاه را با فایل عوض می‌کند.</p>
        <label className="mt-2 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={armed} onChange={(e) => setArmed(e.target.checked)} />
          می‌دانم جای داده‌های فعلی می‌نشیند
        </label>
        <input className="mt-3 block text-sm" type="file" accept="application/json,.json" disabled={!armed} aria-label="فایل پشتیبان" onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          try {
            const error = restoreBackup(JSON.parse(await file.text()));
            if (error) toast.error(error);
            else toast.success("پشتیبان بازیابی شد.");
          } catch {
            toast.error("فایل پشتیبان خوانده نشد.");
          }
        }} />
      </section>
    </div>
  );
}

export function GuidePage() {
  const session = useNotebook((s) => s.session)!;
  return (
    <div className="rise mx-auto max-w-3xl space-y-4">
      <Mascot src="/mascots/logo.jpg" alt="نشان دفتر کلاس" className="size-24 rounded-3xl" />
      <h2 className="text-2xl font-extrabold">راهنمای دفتر</h2>
      <section className="rounded-3xl bg-paper p-5 shadow-soft">
        <h3 className="font-extrabold">دو مدرسه، یک دفتر</h3>
        <p className="mt-1">{ELEMENTARY} برای پایه‌های اول تا ششم.</p>
        <p>{MIDDLE} برای پایه‌های هفتم تا نهم.</p>
        <p className="text-sm text-muted">هر دو در {COMPLEX} و سال {YEAR_LABEL}.</p>
      </section>
      <section className="rounded-3xl bg-paper p-5 shadow-soft">
        <h3 className="font-extrabold">ارزشیابی</h3>
        <p>اول تا ششم: {LEVELS.join("، ")}.</p>
        <p>هفتم تا نهم: نمره ۰ تا ۲۰.</p>
        <p>فارسی در همه پایه‌ها شش مهارت جدا دارد: روخوانی، روان‌خوانی، درک مطلب، املا، نگارش، انشا و تولید متن.</p>
        <p className="text-sm text-muted">هر ذخیره، نسخه قبلی را در سوابق همان ماه نگه می‌دارد.</p>
      </section>
      <section className="rounded-3xl bg-paper p-5 shadow-soft">
        <h3 className="font-extrabold">گردش کار</h3>
        <p>معلم در همین دفتر وارد می‌شود، ارزشیابی و حضور را ثبت می‌کند و از تبادل داده فایل خروجی می‌سازد.</p>
        <p>مدیر فایل را باز می‌کند، تعداد معتبر و اختلاف‌ها را می‌بیند و بعد تأیید می‌کند.</p>
      </section>
      <section className="rounded-3xl bg-butter/40 p-5">
        <h3 className="font-extrabold">محدودیت راستش</h3>
        <p>این برنامه بدون سرور است و داده‌ها در حافظه همین مرورگر می‌مانند. رمز ورود، قفل سرور نیست. کسی که به فایل برنامه یا حافظه مرورگر مدیر دسترسی دارد می‌تواند داده‌ها را ببیند.</p>
        <p className="mt-2">جداسازی عملی این است که نمای معلم نام پدر، تلفن، پرونده خانواده و یادداشت محرمانه را نشان نمی‌دهد و در فایل خروجی معلم هم نیستند. پشتیبان مدیر را به معلم ندهید.</p>
        {session.role === "teacher" ? <p className="mt-2 text-sm">شما الان با دسترسی معلم وارد شده‌اید.</p> : <p className="mt-2 text-sm">شما با دسترسی مدیر وارد شده‌اید.</p>}
      </section>
    </div>
  );
}
