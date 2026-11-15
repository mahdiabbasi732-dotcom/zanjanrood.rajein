export type Student = {
  id: string;
  first: string;
  last: string;
  father: string;
  birth: string;
  grade: string;
  gender: string;
  phone: string;
  issues: string;
  classId: string;
  archived?: boolean;
};

export type Assignment = {
  grade: string;
  classId: string;
  groupId: string;
  courseId: string;
  courseName: string;
  teacherId: string;
  teacherName: string;
  numeric: boolean;
  isPersian: boolean;
  skills: string[];
  studentIds: string[];
};

export type Assessment = {
  id: string;
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
  updatedAt: string;
  source: "manual" | "import";
  history: AssessmentSnap[];
};

export type AssessmentSnap = {
  at: string;
  by: string;
  overall: string;
  skills: Record<string, string>;
  note: string;
};

export type AttStatus = "present" | "absent" | "late";

export type AttendanceRow = {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: AttStatus;
  by: string;
  at: string;
};

export type FamilyFile = {
  status: string;
  members: string;
  siblings: string;
  birthOrder: string;
  fatherJob: string;
  motherJob: string;
  living: string;
  guardian: string;
};

export type Note = {
  id: string;
  studentId: string;
  authorId: string;
  authorName: string;
  text: string;
  at: string;
};

export type BadgeDef = {
  id: string;
  title: string;
  hint: string;
  tone: "lavender" | "sky" | "mint" | "butter" | "pink" | "peach" | "violet";
};

export type Award = {
  id: string;
  studentId: string;
  badgeId: string;
  month: string;
  note: string;
  byId: string;
  byName: string;
  at: string;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  audience: "all" | "teachers" | "grade";
  grade: string;
  at: string;
  by: string;
};

export type Activity = { id: string; text: string; at: string };

export type ImportLog = {
  id: string;
  teacherName: string;
  at: string;
  added: number;
  updated: number;
  skipped: number;
};

export type Session = {
  role: "manager" | "teacher";
  teacherId: string | null;
  name: string;
};

export const GRADES = ["اول", "دوم", "سوم", "چهارم", "پنجم", "ششم", "هفتم", "هشتم", "نهم"] as const;
export const MONTHS = ["مهر", "آبان", "آذر", "دی", "بهمن", "اسفند", "فروردین", "اردیبهشت", "خرداد"] as const;
export const LEVELS = ["خیلی خوب", "خوب", "قابل قبول", "نیازمند تلاش بیشتر"] as const;
export const PERSIAN_SKILLS = ["روخوانی", "روان‌خوانی", "درک مطلب", "املا", "نگارش", "انشا و تولید متن"] as const;
export const YEAR_LABEL = "۱۴۰۵–۱۴۰۶";
export const COMPLEX = "مجتمع آموزشی رجعین";
export const ELEMENTARY = "مدرسه پروین اعتصامی روستای رجعین";
export const MIDDLE = "مدرسه حضرت زینب کبری (س)";
export const DEFAULT_MANAGER = "زهرا نوری";
export const MANAGER_USER = "nouri";

export const FAMILY_STATUSES = [
  "با هم زندگی می‌کنند",
  "طلاق گرفته‌اند",
  "جدا از هم زندگی می‌کنند",
  "فوت پدر",
  "فوت مادر",
  "فوت والدین",
  "تحت سرپرستی دیگران",
];

export const JOBS = ["", "خانه‌دار", "کشاورز", "کارگر", "کارمند", "شاغل آزاد", "شاغل", "بیکار", "بازنشسته", "سایر"];

export const MIDDLE_GRADES = new Set(["هفتم", "هشتم", "نهم"]);

export const INITIAL_MANAGER_HASH = "242d1f4272f6efcba3e71214f77283202c412d53354fac2e586dfa116895a263";

export const INITIAL_TEACHER_HASHES: Record<string, string> = {
  "57000826": "c3b8e35cbf1079ffda5a1c4cbe9e69faddd83c85f7b656a17ab411bc9ace581d",
  "57000893": "508cfe101d04edd4603bcc80d72803e069a4523aff3fff521b8420c98c787657",
  "57001137": "3575f5ad32bd38b92eacf3e6e5426de9bdf6c68f9f96a20e4e5ab69448e2eb4b",
  "57021245": "09225b0faf10c20b3f28a2daa1644eaf34572997fa808f905e38697daa6b5fb6",
  "57021246": "0c51956bad70c4394e1e974f6cfd6668f6bab97cd3d075e9699223eeb0f6261b",
  "57021252": "919bc038002f4be03a61b4199be0846293b738511726c2e1dd0375b20ec44b14",
  "57030098": "3ca490bbb86d936c572dcb33e457f479fd058b53a3ea03990fbb3e238d476aec",
  "57030360": "4df0144d7ee6cc4b75fc7ef59d0ac3179129b9cbf1e67f41af59618b2f93f1dd",
  "57030560": "6c44afe335ef8bc59a6152d241c42231db4f36dcd65ced42a1fe8614bb5113b7",
  "57040378": "36b497a5579b1a0bf266d21ab9c25f81074b040662c80527dc89fb7c6a093509",
  "57040764": "a6b3cd841d29cf6abdef7f6815ef87af46d179993209c8d482b1cfb11a9cdd44",
  "57040956": "aa15490e9985947dc47768d8b70beca6223959bb44a3df191f7b50b35695a553",
  "57040958": "6ef53005a48e00002549b69a16f878c11fd66a3df104bae1fd0714252c097f5d",
  "57980299": "5e5aa15bfd5dbd6eb414a9874b8262d22cbbc03f8d774fa98dca6830981be574",
  "57990444": "bcbba5917d97b5abbc7bd092a212be92e7869ab20156788ab13188132437c280",
  "94056344": "aa90dd375889c90d8b02679607f1e7eb899246d0f8133fb8a084ee9dc8d1c39d",
};

export const STARTER_BADGES: BadgeDef[] = [
  { id: "effort", title: "تلاش عالی", hint: "برای کوشش پیوسته", tone: "lavender" },
  { id: "attend", title: "ستاره حضور", hint: "حضور منظم و آرام", tone: "sky" },
  { id: "read", title: "قهرمان روخوانی", hint: "پیشرفت در خواندن", tone: "mint" },
  { id: "idea", title: "فکر خلاق", hint: "ایده‌های تازه و دقیق", tone: "butter" },
  { id: "kind", title: "دوست یاری‌گر", hint: "کمک به همکلاسی‌ها", tone: "pink" },
  { id: "grow", title: "نشان پیشرفت", hint: "رشد نسبت به ماه قبل", tone: "peach" },
  { id: "math", title: "کاوشگر ریاضی", hint: "کنجکاوی در ریاضی", tone: "violet" },
  { id: "write", title: "ستاره نگارش", hint: "نوشتن روشن و مرتب", tone: "mint" },
];

const FA = "۰۱۲۳۴۵۶۷۸۹";
const AR = "٠١٢٣٤٥٦٧٨٩";

export function toEnDigits(value: string) {
  return value.replace(/[۰-۹٠-٩]/g, (ch) => {
    const a = FA.indexOf(ch);
    if (a >= 0) return String(a);
    return String(AR.indexOf(ch));
  });
}

export function faNum(value: number | string) {
  return String(value).replace(/\d/g, (d) => FA[Number(d)] ?? d);
}

export function uid() {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36);
}

export async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function isMiddle(grade: string) {
  return MIDDLE_GRADES.has(grade);
}

export function schoolOf(grade: string) {
  if (isMiddle(grade)) return { stage: "متوسطه" as const, full: MIDDLE, short: "حضرت زینب کبری (س)" };
  return { stage: "ابتدایی" as const, full: ELEMENTARY, short: "پروین اعتصامی" };
}

export function classLabel(classId: string, grade: string) {
  if (classId.includes("چند")) return `پایه ${grade} · کلاس چندپایه`;
  return `پایه ${grade}`;
}

export function fullName(s: Pick<Student, "first" | "last">) {
  return `${s.first} ${s.last}`.trim();
}

export function formatBirth(birth: string) {
  const d = toEnDigits(birth).replace(/\D/g, "");
  if (d.length === 8) return `${d.slice(0, 4)}/${d.slice(4, 6)}/${d.slice(6)}`;
  return birth;
}

export function isoDate(d = new Date()) {
  const z = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

export function faLong(d = new Date()) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 11) return "صبح بخیر";
  if (h < 15) return "ظهر بخیر";
  if (h < 19) return "عصر بخیر";
  return "شب بخیر";
}

export function currentSchoolMonth(d = new Date()) {
  const month = Number(
    new Intl.DateTimeFormat("en-u-ca-persian", { month: "numeric" }).format(d),
  );
  const names = ["فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور", "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"];
  const name = names[month - 1] ?? "مهر";
  return (MONTHS as readonly string[]).includes(name) ? name : "مهر";
}

export function yearForMonth(month: string) {
  return ["فروردین", "اردیبهشت", "خرداد"].includes(month) ? "۱۴۰۶" : "۱۴۰۵";
}

export function normYear(month: string, year: string) {
  const y = toEnDigits(year || "");
  const spring = ["فروردین", "اردیبهشت", "خرداد"].includes(month);
  if (spring && y.includes("1406")) return "۱۴۰۶";
  if (!spring && y.includes("1405")) return "۱۴۰۵";
  if (!y.trim()) return yearForMonth(month);
  if (y.includes("1406") && spring) return "۱۴۰۶";
  if (y.includes("1405") && !spring) return "۱۴۰۵";
  return yearForMonth(month);
}

export function assessmentKey(a: { studentId: string; classId: string; courseId: string; month: string; year: string }) {
  return [a.studentId, a.classId, a.courseId, a.month, normYear(a.month, a.year)].join("|");
}

export function emptyFamily(): FamilyFile {
  return { status: FAMILY_STATUSES[0], members: "", siblings: "", birthOrder: "", fatherJob: "", motherJob: "", living: "", guardian: "" };
}

export type ClassInfo = { classId: string; grade: string; count: number };

export function classCatalog(students: Student[], assignments: Assignment[]): ClassInfo[] {
  const map = new Map<string, ClassInfo>();
  for (const a of assignments) {
    if (!map.has(a.classId)) map.set(a.classId, { classId: a.classId, grade: a.grade, count: 0 });
  }
  for (const s of students) {
    if (s.archived) continue;
    const cur = map.get(s.classId) ?? { classId: s.classId, grade: s.grade, count: 0 };
    cur.count += 1;
    cur.grade = s.grade || cur.grade;
    map.set(s.classId, cur);
  }
  return [...map.values()].sort((a, b) => GRADES.indexOf(a.grade as (typeof GRADES)[number]) - GRADES.indexOf(b.grade as (typeof GRADES)[number]));
}

export type TeacherInfo = {
  id: string;
  name: string;
  grades: string[];
  classIds: string[];
  courses: string[];
  assignmentCount: number;
};

export function teacherCatalog(assignments: Assignment[]): TeacherInfo[] {
  const map = new Map<string, { id: string; name: string; grades: Set<string>; classIds: Set<string>; courses: Set<string>; n: number }>();
  for (const a of assignments) {
    const cur = map.get(a.teacherId) ?? { id: a.teacherId, name: a.teacherName, grades: new Set(), classIds: new Set(), courses: new Set(), n: 0 };
    cur.grades.add(a.grade);
    cur.classIds.add(a.classId);
    cur.courses.add(a.courseName);
    cur.n += 1;
    map.set(a.teacherId, cur);
  }
  return [...map.values()]
    .map((t) => ({
      id: t.id,
      name: t.name,
      grades: [...t.grades].sort((a, b) => GRADES.indexOf(a as (typeof GRADES)[number]) - GRADES.indexOf(b as (typeof GRADES)[number])),
      classIds: [...t.classIds],
      courses: [...t.courses],
      assignmentCount: t.n,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "fa"));
}

export function taughtStudentIds(assignments: Assignment[], teacherId: string) {
  const ids = new Set<string>();
  for (const a of assignments) {
    if (a.teacherId === teacherId) for (const id of a.studentIds) ids.add(id);
  }
  return ids;
}

export function visibleStudents(students: Student[], assignments: Assignment[], session: Session | null, includeArchived = false) {
  if (!session) return [];
  const list = students.filter((s) => includeArchived || !s.archived);
  if (session.role === "manager") return list;
  const ids = taughtStudentIds(assignments, session.teacherId || "");
  return list.filter((s) => ids.has(s.id));
}

export function myAssignments(assignments: Assignment[], session: Session | null) {
  if (!session) return [];
  if (session.role === "manager") return assignments;
  return assignments.filter((a) => a.teacherId === session.teacherId);
}

export function studentById(students: Student[], id: string) {
  return students.find((s) => s.id === id) ?? null;
}

export function parseScore(raw: string): string | null {
  const t = toEnDigits(raw).trim().replace("،", ".").replace(",", ".");
  if (!t) return "";
  if (!/^\d{1,2}(\.\d{1,2})?$/.test(t)) return null;
  const n = Number(t);
  if (Number.isNaN(n) || n < 0 || n > 20) return null;
  return String(n);
}

export function gradeTone(grade: string) {
  const map: Record<string, string> = {
    اول: "sky",
    دوم: "mint",
    سوم: "butter",
    چهارم: "peach",
    پنجم: "pink",
    ششم: "lavender",
    هفتم: "violet",
    هشتم: "sky",
    نهم: "pink",
  };
  return map[grade] ?? "lavender";
}

export function toneClass(tone: string) {
  const map: Record<string, string> = {
    lavender: "bg-lavender/25 text-ink",
    violet: "bg-violet/15 text-violet",
    sky: "bg-sky/35 text-ink",
    mint: "bg-mint/40 text-ink",
    butter: "bg-butter/70 text-ink",
    peach: "bg-peach/45 text-ink",
    pink: "bg-pink/35 text-ink",
  };
  return map[tone] ?? map.lavender;
}
