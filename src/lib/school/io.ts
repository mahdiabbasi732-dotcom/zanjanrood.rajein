import {
  type Assessment,
  type Assignment,
  type Student,
  MONTHS,
  PERSIAN_SKILLS,
  assessmentKey,
  fullName,
  normYear,
  toEnDigits,
} from "@/lib/school/model";

const SCHEMAS = new Set(["ostad-halat2-teacher-export", "parvin-rajaein-teacher-export"]);

export type ImportChange = {
  key: string;
  studentId: string;
  name: string;
  classId: string;
  courseId: string;
  courseName: string;
  teacherId: string;
  month: string;
  year: string;
  overall: string;
  skills: Record<string, string>;
  note: string;
  status: "new" | "same" | "conflict";
  previous: string;
};

export type ImportPreview =
  | { ok: false; error: string }
  | { ok: true; teacherId: string; teacherName: string; changes: ImportChange[]; rejected: string[] };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function cleanSkills(value: unknown) {
  const src = asRecord(value) ?? {};
  const skills: Record<string, string> = {};
  for (const name of PERSIAN_SKILLS) {
    const raw = src[name];
    if (typeof raw === "string" && raw.trim()) skills[name] = raw.trim();
    else if (typeof raw === "number") skills[name] = String(raw);
  }
  return skills;
}

function skillText(skills: Record<string, string>) {
  return Object.entries(skills)
    .map(([k, v]) => `${k}: ${v}`)
    .join("، ");
}

export function previewImport(
  pkg: unknown,
  ctx: { assignments: Assignment[]; students: Student[]; assessments: Assessment[] },
): ImportPreview {
  const root = asRecord(pkg);
  if (!root) return { ok: false, error: "فایل قابل خواندن نیست." };
  const schema = String(root.schema || "");
  if (!SCHEMAS.has(schema)) return { ok: false, error: "این فایل از جنس خروجی معلم دفتر کلاس نیست." };
  const teacherId = String(root.teacherId || "");
  const known = ctx.assignments.find((a) => a.teacherId === teacherId);
  if (!known) return { ok: false, error: "این معلم در فهرست مدرسه پیدا نشد." };
  const teacherName = known.teacherName || String(root.teacherName || "");
  const records = Array.isArray(root.records) ? root.records : [];
  const owned = new Map<string, Assignment>();
  for (const a of ctx.assignments) {
    if (a.teacherId === teacherId) owned.set(`${a.classId}|${a.courseId}`, a);
  }
  const existing = new Map(ctx.assessments.map((a) => [assessmentKey(a), a]));
  const changes: ImportChange[] = [];
  const rejected: string[] = [];
  records.forEach((item, index) => {
    const rec = asRecord(item);
    const row = index + 1;
    if (!rec) {
      rejected.push(`ردیف ${row}: ساختار نامعتبر است.`);
      return;
    }
    if (rec.type && rec.type !== "assessment") {
      rejected.push(`ردیف ${row}: فقط ارزشیابی قابل دریافت است.`);
      return;
    }
    const studentId = toEnDigits(String(rec.studentId || "")).replace(/\D/g, "");
    const classId = String(rec.classId || "");
    const courseId = String(rec.courseId || "");
    const month = String(rec.month || "");
    if (!(MONTHS as readonly string[]).includes(month)) {
      rejected.push(`ردیف ${row}: ماه «${month || "خالی"}» در سال تحصیلی نیست.`);
      return;
    }
    const slot = owned.get(`${classId}|${courseId}`);
    if (!slot) {
      rejected.push(`ردیف ${row}: این کلاس و درس به ${teacherName} سپرده نشده است.`);
      return;
    }
    if (!slot.studentIds.includes(studentId)) {
      rejected.push(`ردیف ${row}: دانش‌آموز ${studentId} در این درس نیست.`);
      return;
    }
    const student = ctx.students.find((s) => s.id === studentId);
    const overall = rec.overall === undefined || rec.overall === null ? "" : String(rec.overall).trim();
    const skills = cleanSkills(rec.skills);
    const note = String(rec.note || "").slice(0, 500);
    if (!overall && !Object.keys(skills).length) {
      rejected.push(`ردیف ${row}: ارزشیابی خالی است.`);
      return;
    }
    const year = normYear(month, String(rec.year || ""));
    const key = assessmentKey({ studentId, classId, courseId, month, year });
    const prev = existing.get(key);
    const signature = `${overall}|${skillText(skills)}|${note}`;
    const prevSig = prev ? `${prev.overall}|${skillText(prev.skills)}|${prev.note}` : "";
    changes.push({
      key,
      studentId,
      name: student ? fullName(student) : studentId,
      classId,
      courseId,
      courseName: slot.courseName,
      teacherId,
      month,
      year,
      overall,
      skills,
      note,
      status: !prev ? "new" : prevSig === signature ? "same" : "conflict",
      previous: prev ? prev.overall || skillText(prev.skills) : "",
    });
  });
  if (!changes.length && rejected.length) return { ok: false, error: rejected[0] ?? "رکورد معتبری پیدا نشد." };
  return { ok: true, teacherId, teacherName, changes, rejected };
}

export function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let quoted = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else quoted = false;
      } else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(cur);
      cur = "";
    } else if (c === "\n") {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
    } else if (c !== "\r") cur += c;
  }
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim()));
}

const HEADER_MAP: Record<string, string> = {
  "کد دانش‌آموزی": "studentId",
  studentid: "studentId",
  "شناسه کلاس": "classId",
  classid: "classId",
  "کد درس": "courseId",
  courseid: "courseId",
  ماه: "month",
  سال: "year",
  ارزشیابی: "overall",
  "ارزشیابی کلی": "overall",
  توضیح: "note",
  "مهارت‌ها": "skills",
};

export function csvToPackage(text: string, teacherId: string, teacherName: string) {
  const table = parseCsv(text);
  if (table.length < 2) throw new Error("در فایل جدولی، سطری برای ثبت پیدا نشد.");
  const headers = table[0].map((h) => HEADER_MAP[h.trim()] || HEADER_MAP[h.trim().toLowerCase()] || h.trim());
  const records = table.slice(1).map((cells) => {
    const rec: Record<string, unknown> = { type: "assessment" };
    headers.forEach((key, i) => {
      rec[key] = (cells[i] ?? "").trim();
    });
    if (typeof rec.skills === "string" && rec.skills) {
      const skills: Record<string, string> = {};
      for (const part of String(rec.skills).split("|")) {
        const [name, value] = part.split(":");
        if (name && value) skills[name.trim()] = value.trim();
      }
      rec.skills = skills;
    }
    return rec;
  });
  return { schema: "parvin-rajaein-teacher-export", version: 1, teacherId, teacherName, records };
}

export function toCsv(rows: string[][]) {
  const body = rows
    .map((row) => row.map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  return `\uFEFF${body}`;
}

export function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
