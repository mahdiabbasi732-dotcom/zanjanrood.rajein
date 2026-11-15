import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { seedAssignments, seedStudents } from "@/data/seed";
import {
  type Activity,
  type Announcement,
  type Assessment,
  type Assignment,
  type AttStatus,
  type Award,
  type BadgeDef,
  type FamilyFile,
  type ImportLog,
  type Note,
  type Session,
  type Student,
  COMPLEX,
  DEFAULT_MANAGER,
  ELEMENTARY,
  INITIAL_MANAGER_HASH,
  INITIAL_TEACHER_HASHES,
  MANAGER_USER,
  MIDDLE,
  STARTER_BADGES,
  YEAR_LABEL,
  assessmentKey,
  emptyFamily,
  fullName,
  isoDate,
  myAssignments,
  normYear,
  sha256,
  taughtStudentIds,
  uid,
  yearForMonth,
} from "@/lib/school/model";
import type { ImportChange } from "@/lib/school/io";

export type View =
  | "home"
  | "students"
  | "profile"
  | "classes"
  | "teachers"
  | "attendance"
  | "assess"
  | "family"
  | "badges"
  | "news"
  | "reports"
  | "exchange"
  | "backup"
  | "guide";

export type StudentInput = Omit<Student, "archived">;

type DraftRow = {
  studentId: string;
  classId: string;
  courseId: string;
  courseName: string;
  teacherId: string;
  month: string;
  year: string;
  overall: string;
  skills: Record<string, string>;
  note: string;
};

export type BackupFile = {
  schema: "parvin-rajaein-manager-backup";
  version: 1;
  school: string;
  students: Student[];
  assignments: Assignment[];
  assessments: Assessment[];
  attendance: NotebookState["attendance"];
  family: Record<string, FamilyFile>;
  privateNotes: Record<string, string>;
  notes: Note[];
  badges: BadgeDef[];
  awards: Award[];
  announcements: Announcement[];
  managerHash?: string;
  teacherHashes?: Record<string, string>;
  managerName?: string;
};

type NotebookState = {
  session: Session | null;
  remember: boolean;
  managerName: string;
  managerHash: string;
  teacherHashes: Record<string, string>;
  students: Student[];
  assignments: Assignment[];
  assessments: Assessment[];
  attendance: { id: string; studentId: string; classId: string; date: string; status: AttStatus; by: string; at: string }[];
  family: Record<string, FamilyFile>;
  privateNotes: Record<string, string>;
  notes: Note[];
  badges: BadgeDef[];
  awards: Award[];
  announcements: Announcement[];
  activity: Activity[];
  importLogs: ImportLog[];
  seenNewsAt: string;
  view: View;
  openStudentId: string | null;
  focusClassId: string | null;
  loginManager: (username: string, password: string, remember: boolean) => Promise<string | null>;
  loginTeacher: (teacherId: string, password: string, remember: boolean) => Promise<string | null>;
  logout: () => void;
  setView: (view: View) => void;
  openStudent: (id: string) => void;
  setFocusClass: (id: string | null) => void;
  changePassword: (current: string, next: string) => Promise<string | null>;
  resetTeacherPassword: (teacherId: string, next: string) => Promise<string | null>;
  setManagerName: (name: string) => void;
  saveStudent: (input: StudentInput, editingId?: string) => string | null;
  archiveStudent: (id: string, archived: boolean) => void;
  saveFamily: (id: string, file: FamilyFile, priv: string) => string | null;
  saveAcademicNote: (studentId: string, text: string) => string | null;
  saveAttendanceDay: (classId: string, date: string, rows: { studentId: string; status: AttStatus }[]) => string | null;
  saveAssessments: (rows: DraftRow[]) => { saved: number; error: string | null };
  grantAward: (studentId: string, badgeId: string, month: string, note: string) => string | null;
  revokeAward: (id: string) => void;
  saveBadge: (badge: BadgeDef) => string | null;
  removeBadge: (id: string) => void;
  saveAnnouncement: (input: { title: string; body: string; audience: Announcement["audience"]; grade: string }) => string | null;
  removeAnnouncement: (id: string) => void;
  markNewsSeen: () => void;
  applyImport: (changes: ImportChange[], mode: "replace" | "skip", teacherName: string) => { added: number; updated: number; skipped: number } | { error: string };
  restoreBackup: (data: unknown) => string | null;
};

const TAB_KEY = "parvin-tab-session";

function rememberSession(session: Session, remember: boolean) {
  if (typeof window === "undefined") return;
  if (remember) sessionStorage.removeItem(TAB_KEY);
  else sessionStorage.setItem(TAB_KEY, JSON.stringify(session));
}

function log(text: string, activity: Activity[]): Activity[] {
  return [{ id: uid(), text, at: new Date().toISOString() }, ...activity].slice(0, 80);
}

function canTouchStudent(state: NotebookState, studentId: string) {
  const session = state.session;
  if (!session) return false;
  if (session.role === "manager") return true;
  return taughtStudentIds(state.assignments, session.teacherId || "").has(studentId);
}

function canTeach(state: NotebookState, classId: string, courseId?: string) {
  const session = state.session;
  if (!session) return false;
  if (session.role === "manager") return true;
  return state.assignments.some(
    (a) => a.teacherId === session.teacherId && a.classId === classId && (!courseId || a.courseId === courseId),
  );
}

function stampWelcome(): Announcement {
  return {
    id: "welcome-1405",
    title: "آغاز ثبت ماهانه",
    body: "ارزشیابی هر ماه جدا می‌ماند و روی ماه قبل نوشته نمی‌شود. پس از تکمیل، معلم فایل خروجی را به مدیر می‌دهد.",
    audience: "all",
    grade: "",
    at: "2026-09-23T08:00:00.000Z",
    by: DEFAULT_MANAGER,
  };
}

export const useNotebook = create<NotebookState>()(
  persist(
    (set, get) => ({
      session: null,
      remember: true,
      managerName: DEFAULT_MANAGER,
      managerHash: INITIAL_MANAGER_HASH,
      teacherHashes: { ...INITIAL_TEACHER_HASHES },
      students: seedStudents.map((s) => ({ ...s, archived: false })),
      assignments: seedAssignments.map((a) => ({ ...a, studentIds: [...a.studentIds], skills: [...a.skills] })),
      assessments: [],
      attendance: [],
      family: {},
      privateNotes: {},
      notes: [],
      badges: STARTER_BADGES.map((b) => ({ ...b })),
      awards: [],
      announcements: [stampWelcome()],
      activity: [],
      importLogs: [],
      seenNewsAt: "",
      view: "home",
      openStudentId: null,
      focusClassId: null,

      loginManager: async (username, password, remember) => {
        if (username.trim().toLowerCase() !== MANAGER_USER) return "نام کاربری مدیر شناخته نشد.";
        const hash = await sha256(password);
        if (hash !== get().managerHash) return "رمز عبور درست نیست. اگر اولین ورود است، رمز موقت را در راهنمای پایین ببینید.";
        const session: Session = { role: "manager", teacherId: null, name: get().managerName };
        rememberSession(session, remember);
        set({ session, remember, view: "home" });
        return null;
      },

      loginTeacher: async (teacherId, password, remember) => {
        const teacher = get().assignments.find((a) => a.teacherId === teacherId);
        if (!teacher) return "این معلم در فهرست مدرسه نیست.";
        const hash = await sha256(password);
        const expect = get().teacherHashes[teacherId] ?? INITIAL_TEACHER_HASHES[teacherId];
        if (hash !== expect) return "رمز عبور درست نیست. رمز موقت اولیه، کد پرسنلی همان معلم است.";
        const session: Session = { role: "teacher", teacherId, name: teacher.teacherName };
        rememberSession(session, remember);
        set({ session, remember, view: "home" });
        return null;
      },

      logout: () => {
        if (typeof window !== "undefined") sessionStorage.removeItem(TAB_KEY);
        set({ session: null, view: "home", openStudentId: null });
      },

      setView: (view) => set({ view }),
      openStudent: (id) => set({ openStudentId: id, view: "profile" }),
      setFocusClass: (id) => set({ focusClassId: id }),

      changePassword: async (current, next) => {
        const session = get().session;
        if (!session) return "ابتدا وارد شوید.";
        if (next.trim().length < 6) return "رمز جدید باید حداقل ۶ نویسه باشد.";
        const hash = await sha256(current);
        const nextHash = await sha256(next.trim());
        if (session.role === "manager") {
          if (hash !== get().managerHash) return "رمز فعلی درست نیست.";
          set({ managerHash: nextHash });
          return null;
        }
        const id = session.teacherId || "";
        if (hash !== (get().teacherHashes[id] ?? "")) return "رمز فعلی درست نیست.";
        set({ teacherHashes: { ...get().teacherHashes, [id]: nextHash } });
        return null;
      },

      resetTeacherPassword: async (teacherId, next) => {
        if (get().session?.role !== "manager") return "فقط مدیر می‌تواند رمز معلم را عوض کند.";
        if (next.trim().length < 6) return "رمز جدید باید حداقل ۶ نویسه باشد.";
        const nextHash = await sha256(next.trim());
        set((s) => ({
          teacherHashes: { ...s.teacherHashes, [teacherId]: nextHash },
          activity: log(`رمز ورود یکی از معلمان بازنشانی شد.`, s.activity),
        }));
        return null;
      },

      setManagerName: (name) => {
        const clean = name.trim();
        if (!clean || get().session?.role !== "manager") return;
        set((s) => ({
          managerName: clean,
          session: s.session?.role === "manager" ? { ...s.session, name: clean } : s.session,
        }));
      },

      saveStudent: (input, editingId) => {
        if (get().session?.role !== "manager") return "ثبت دانش‌آموز فقط برای مدیر است.";
        const id = input.id.replace(/\D/g, "");
        if (!/^\d{8,12}$/.test(id)) return "کد دانش‌آموزی باید ۸ تا ۱۲ رقم باشد.";
        if (!input.first.trim() || !input.last.trim()) return "نام و نام خانوادگی لازم است.";
        if (!input.classId) return "کلاس را انتخاب کنید.";
        const students = get().students;
        if (students.some((s) => s.id === id && s.id !== editingId)) return "این کد دانش‌آموزی قبلاً ثبت شده است.";
        const twin = students.find(
          (s) => s.id !== (editingId || id) && s.first.trim() === input.first.trim() && s.last.trim() === input.last.trim() && s.father.trim() === input.father.trim() && !s.archived,
        );
        if (twin) return `دانش‌آموزی با همین نام و نام پدر وجود دارد (${twin.id}).`;
        const grade = get().assignments.find((a) => a.classId === input.classId)?.grade || input.grade;
        const next: Student = {
          id,
          first: input.first.trim(),
          last: input.last.trim(),
          father: input.father.trim(),
          birth: input.birth.trim(),
          grade,
          gender: input.gender || "دختر",
          phone: input.phone.trim(),
          issues: input.issues.trim(),
          classId: input.classId,
          archived: false,
        };
        set((s) => {
          const prev = s.students.find((st) => st.id === (editingId || id));
          let assignments = s.assignments.map((a) => ({ ...a, studentIds: [...a.studentIds] }));
          if (prev && prev.classId !== next.classId) {
            assignments = assignments.map((a) => {
              if (a.classId === prev.classId) return { ...a, studentIds: a.studentIds.filter((sid) => sid !== prev.id) };
              if (a.classId === next.classId && !a.studentIds.includes(next.id)) return { ...a, studentIds: [...a.studentIds, next.id] };
              return a;
            });
          }
          if (!prev) {
            assignments = assignments.map((a) => (a.classId === next.classId && !a.studentIds.includes(next.id) ? { ...a, studentIds: [...a.studentIds, next.id] } : a));
          }
          const list = prev ? s.students.map((st) => (st.id === prev.id ? { ...next, archived: st.archived } : st)) : [...s.students, next];
          if (editingId && editingId !== id) {
            return { students: list.filter((st) => st.id !== editingId), assignments, activity: log(`پرونده ${fullName(next)} ویرایش شد.`, s.activity) };
          }
          return { students: list, assignments, activity: log(prev ? `پرونده ${fullName(next)} ویرایش شد.` : `${fullName(next)} به دفتر اضافه شد.`, s.activity) };
        });
        return null;
      },

      archiveStudent: (id, archived) => {
        if (get().session?.role !== "manager") return;
        set((s) => ({
          students: s.students.map((st) => (st.id === id ? { ...st, archived } : st)),
          activity: log(archived ? "یک پرونده بایگانی شد." : "یک پرونده از بایگانی بازگشت.", s.activity),
        }));
      },

      saveFamily: (id, file, priv) => {
        if (get().session?.role !== "manager") return "پرونده خانواده فقط برای مدیر است.";
        if (!get().students.some((s) => s.id === id)) return "دانش‌آموز پیدا نشد.";
        set((s) => ({
          family: { ...s.family, [id]: { ...file } },
          privateNotes: { ...s.privateNotes, [id]: priv },
          activity: log("پرونده خانواده به‌روزرسانی شد.", s.activity),
        }));
        return null;
      },

      saveAcademicNote: (studentId, text) => {
        const state = get();
        if (!state.session) return "ابتدا وارد شوید.";
        if (!canTouchStudent(state, studentId)) return "این دانش‌آموز در کلاس‌های شما نیست.";
        const authorId = state.session.role === "manager" ? "manager" : state.session.teacherId || "teacher";
        const authorName = state.session.name;
        set((s) => {
          const rest = s.notes.filter((n) => !(n.studentId === studentId && n.authorId === authorId));
          const notes = text.trim() ? [{ id: uid(), studentId, authorId, authorName, text: text.trim(), at: new Date().toISOString() }, ...rest] : rest;
          return { notes, activity: log("یادداشت آموزشی ذخیره شد.", s.activity) };
        });
        return null;
      },

      saveAttendanceDay: (classId, date, rows) => {
        const state = get();
        if (!canTeach(state, classId)) return "ثبت حضور این کلاس برای شما باز نیست.";
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "تاریخ حضور را انتخاب کنید.";
        const by = state.session?.role === "manager" ? "manager" : state.session?.teacherId || "";
        set((s) => {
          const keep = s.attendance.filter((a) => !(a.classId === classId && a.date === date && rows.some((r) => r.studentId === a.studentId)));
          const fresh = rows.map((r) => ({ id: uid(), studentId: r.studentId, classId, date, status: r.status, by, at: new Date().toISOString() }));
          return { attendance: [...fresh, ...keep], activity: log(`حضور و غیاب ${date} ثبت شد.`, s.activity) };
        });
        return null;
      },

      saveAssessments: (rows) => {
        const state = get();
        if (!state.session) return { saved: 0, error: "ابتدا وارد شوید." };
        let saved = 0;
        const next = state.assessments.map((a) => ({ ...a, skills: { ...a.skills }, history: [...a.history] }));
        const by = state.session.name;
        for (const row of rows) {
          if (!canTeach(state, row.classId, row.courseId)) continue;
          const slot = state.assignments.find((a) => a.classId === row.classId && a.courseId === row.courseId && (state.session?.role === "manager" || a.teacherId === state.session?.teacherId));
          if (!slot || !slot.studentIds.includes(row.studentId)) continue;
          const year = normYear(row.month, row.year || yearForMonth(row.month));
          const key = assessmentKey({ ...row, year });
          const idx = next.findIndex((a) => assessmentKey(a) === key);
          const overall = row.overall.trim();
          const skills = Object.fromEntries(Object.entries(row.skills).filter(([, v]) => v.trim()));
          const note = row.note.trim();
          const blank = !overall && !Object.keys(skills).length && !note;
          if (idx < 0 && blank) continue;
          if (idx >= 0) {
            const prev = next[idx];
            const same = prev.overall === overall && prev.note === note && JSON.stringify(prev.skills) === JSON.stringify(skills);
            if (same) continue;
            if (blank) {
              next.splice(idx, 1);
            } else {
              next[idx] = {
                ...prev,
                overall,
                skills,
                note,
                year,
                courseName: slot.courseName,
                teacherId: slot.teacherId,
                updatedAt: new Date().toISOString(),
                source: "manual",
                history: [...prev.history, { at: prev.updatedAt, by, overall: prev.overall, skills: prev.skills, note: prev.note }].slice(-12),
              };
            }
          } else {
            next.push({
              id: uid(),
              studentId: row.studentId,
              classId: row.classId,
              courseId: row.courseId,
              courseName: slot.courseName,
              teacherId: slot.teacherId,
              month: row.month,
              year,
              overall,
              skills,
              note,
              updatedAt: new Date().toISOString(),
              source: "manual",
              history: [],
            });
          }
          saved += 1;
        }
        if (saved) set((s) => ({ assessments: next, activity: log(`${saved} ارزشیابی ماهانه ذخیره شد.`, s.activity) }));
        return { saved, error: null };
      },

      grantAward: (studentId, badgeId, month, note) => {
        const state = get();
        if (!state.session) return "ابتدا وارد شوید.";
        if (!canTouchStudent(state, studentId)) return "این دانش‌آموز در دسترس شما نیست.";
        if (!state.badges.some((b) => b.id === badgeId)) return "این نشان تعریف نشده است.";
        const byId = state.session.role === "manager" ? "manager" : state.session.teacherId || "";
        set((s) => ({
          awards: [{ id: uid(), studentId, badgeId, month, note: note.trim(), byId, byName: s.session?.name || "", at: new Date().toISOString() }, ...s.awards],
          activity: log("یک نشان تشویقی ثبت شد.", s.activity),
        }));
        return null;
      },

      revokeAward: (id) => {
        const state = get();
        const award = state.awards.find((a) => a.id === id);
        if (!award || !state.session) return;
        const mine = state.session.role === "manager" || award.byId === state.session.teacherId;
        if (!mine) return;
        set((s) => ({ awards: s.awards.filter((a) => a.id !== id) }));
      },

      saveBadge: (badge) => {
        if (get().session?.role !== "manager") return "تعریف نشان فقط برای مدیر است.";
        if (badge.title.trim().length < 2) return "نام نشان را بنویسید.";
        set((s) => {
          const exists = s.badges.some((b) => b.id === badge.id);
          const badges = exists ? s.badges.map((b) => (b.id === badge.id ? { ...badge, title: badge.title.trim() } : b)) : [...s.badges, { ...badge, id: badge.id || uid(), title: badge.title.trim() }];
          return { badges };
        });
        return null;
      },

      removeBadge: (id) => {
        if (get().session?.role !== "manager") return;
        set((s) => ({ badges: s.badges.filter((b) => b.id !== id), awards: s.awards.filter((a) => a.badgeId !== id) }));
      },

      saveAnnouncement: (input) => {
        if (get().session?.role !== "manager") return "ثبت اطلاعیه فقط برای مدیر است.";
        if (!input.title.trim() || !input.body.trim()) return "عنوان و متن اطلاعیه لازم است.";
        set((s) => ({
          announcements: [{ id: uid(), title: input.title.trim(), body: input.body.trim(), audience: input.audience, grade: input.grade, at: new Date().toISOString(), by: s.managerName }, ...s.announcements],
          activity: log("اطلاعیه تازه منتشر شد.", s.activity),
        }));
        return null;
      },

      removeAnnouncement: (id) => {
        if (get().session?.role !== "manager") return;
        set((s) => ({ announcements: s.announcements.filter((a) => a.id !== id) }));
      },

      markNewsSeen: () => set({ seenNewsAt: new Date().toISOString() }),

      applyImport: (changes, mode, teacherName) => {
        if (get().session?.role !== "manager") return { error: "دریافت فایل فقط برای مدیر است." };
        let added = 0;
        let updated = 0;
        let skipped = 0;
        const next = get().assessments.map((a) => ({ ...a, skills: { ...a.skills }, history: [...a.history] }));
        for (const change of changes) {
          if (change.status === "same") {
            skipped += 1;
            continue;
          }
          const idx = next.findIndex((a) => assessmentKey(a) === change.key);
          if (idx >= 0 && mode === "skip") {
            skipped += 1;
            continue;
          }
          if (idx >= 0) {
            const prev = next[idx];
            next[idx] = {
              ...prev,
              overall: change.overall,
              skills: { ...change.skills },
              note: change.note,
              courseName: change.courseName,
              teacherId: change.teacherId,
              year: change.year,
              updatedAt: new Date().toISOString(),
              source: "import",
              history: [...prev.history, { at: prev.updatedAt, by: "ورود فایل", overall: prev.overall, skills: prev.skills, note: prev.note }].slice(-12),
            };
            updated += 1;
          } else {
            next.push({
              id: uid(),
              studentId: change.studentId,
              classId: change.classId,
              courseId: change.courseId,
              courseName: change.courseName,
              teacherId: change.teacherId,
              month: change.month,
              year: change.year,
              overall: change.overall,
              skills: { ...change.skills },
              note: change.note,
              updatedAt: new Date().toISOString(),
              source: "import",
              history: [],
            });
            added += 1;
          }
        }
        set((s) => ({
          assessments: next,
          importLogs: [{ id: uid(), teacherName, at: new Date().toISOString(), added, updated, skipped }, ...s.importLogs].slice(0, 40),
          activity: log(`فایل ${teacherName} دریافت شد: ${added} تازه، ${updated} به‌روزرسانی.`, s.activity),
        }));
        return { added, updated, skipped };
      },

      restoreBackup: (data) => {
        if (get().session?.role !== "manager") return "بازیابی فقط برای مدیر است.";
        const root = data && typeof data === "object" ? (data as BackupFile) : null;
        if (!root || root.schema !== "parvin-rajaein-manager-backup" || !Array.isArray(root.students)) return "این فایل نسخه پشتیبان دفتر کلاس نیست.";
        set({
          students: root.students,
          assignments: Array.isArray(root.assignments) ? root.assignments : get().assignments,
          assessments: Array.isArray(root.assessments) ? root.assessments : [],
          attendance: Array.isArray(root.attendance) ? root.attendance : [],
          family: root.family || {},
          privateNotes: root.privateNotes || {},
          notes: Array.isArray(root.notes) ? root.notes : [],
          badges: Array.isArray(root.badges) && root.badges.length ? root.badges : STARTER_BADGES,
          awards: Array.isArray(root.awards) ? root.awards : [],
          announcements: Array.isArray(root.announcements) ? root.announcements : [],
          managerHash: root.managerHash || get().managerHash,
          teacherHashes: root.teacherHashes || get().teacherHashes,
          managerName: root.managerName || get().managerName,
          activity: log("نسخه پشتیبان بازیابی شد.", get().activity),
        });
        return null;
      },
    }),
    {
      name: "parvin-notebook-v1",
      version: 1,
      skipHydration: true,
      storage: createJSONStorage(() => ({
        getItem: (name) => (typeof window === "undefined" ? null : localStorage.getItem(name)),
        setItem: (name, value) => {
          if (typeof window !== "undefined") localStorage.setItem(name, value);
        },
        removeItem: (name) => {
          if (typeof window !== "undefined") localStorage.removeItem(name);
        },
      })),
      partialize: (s) => ({
        session: s.remember ? s.session : null,
        remember: s.remember,
        managerName: s.managerName,
        managerHash: s.managerHash,
        teacherHashes: s.teacherHashes,
        students: s.students,
        assignments: s.assignments,
        assessments: s.assessments,
        attendance: s.attendance,
        family: s.family,
        privateNotes: s.privateNotes,
        notes: s.notes,
        badges: s.badges,
        awards: s.awards,
        announcements: s.announcements,
        activity: s.activity,
        importLogs: s.importLogs,
        seenNewsAt: s.seenNewsAt,
        view: s.view,
        openStudentId: s.openStudentId,
        focusClassId: s.focusClassId,
      }),
    },
  ),
);

export function backupOf(s: NotebookState): BackupFile {
  return {
    schema: "parvin-rajaein-manager-backup",
    version: 1,
    school: `${COMPLEX} | ${ELEMENTARY} | ${MIDDLE} | ${YEAR_LABEL}`,
    students: s.students,
    assignments: s.assignments,
    assessments: s.assessments,
    attendance: s.attendance,
    family: s.family,
    privateNotes: s.privateNotes,
    notes: s.notes,
    badges: s.badges,
    awards: s.awards,
    announcements: s.announcements,
    managerHash: s.managerHash,
    teacherHashes: s.teacherHashes,
    managerName: s.managerName,
  };
}

export function visibleNews(list: Announcement[], session: Session | null, grades: Set<string>) {
  if (!session) return [];
  return list.filter((item) => {
    if (item.audience === "all" || item.audience === "teachers") return true;
    if (item.audience === "grade") return session.role === "manager" || grades.has(item.grade);
    return false;
  });
}

export function teacherScopeGrades(state: Pick<NotebookState, "assignments" | "session">) {
  return new Set(myAssignments(state.assignments, state.session).map((a) => a.grade));
}

export { emptyFamily, isoDate };
