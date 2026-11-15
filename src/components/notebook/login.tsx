import { useMemo, useState, type FormEvent } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Btn, Field, Mascot } from "@/components/notebook/ui";
import { COMPLEX, ELEMENTARY, MIDDLE, YEAR_LABEL, teacherCatalog } from "@/lib/school/model";
import { useNotebook } from "@/lib/school/store";

export function LoginScreen() {
  const assignments = useNotebook((s) => s.assignments);
  const loginManager = useNotebook((s) => s.loginManager);
  const loginTeacher = useNotebook((s) => s.loginTeacher);
  const teachers = useMemo(() => teacherCatalog(assignments), [assignments]);
  const [role, setRole] = useState<"manager" | "teacher">("manager");
  const [username, setUsername] = useState("nouri");
  const [teacherId, setTeacherId] = useState(teachers[0]?.id ?? "");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const error = role === "manager" ? await loginManager(username, password, remember) : await loginTeacher(teacherId, password, remember);
    setBusy(false);
    if (error) toast.error(error);
  }

  return (
    <main className="grid min-h-screen bg-cream lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-sticker px-10 py-12 lg:block">
        <div className="absolute -left-8 top-8 size-36 rounded-full bg-lavender/30" />
        <div className="absolute bottom-10 left-16 size-24 rounded-full bg-pink/40" />
        <div className="absolute right-10 top-16 size-16 rounded-full bg-mint/50" />
        <p className="relative text-sm font-bold text-violet">{COMPLEX}</p>
        <h1 className="relative mt-3 max-w-md text-4xl font-extrabold leading-tight">دفتر کلاس هوشمند</h1>
        <p className="relative mt-3 max-w-md text-lg text-muted">جایی برای ثبت آرامِ یادگیری، حضور و پیشرفت. نه یک فرم خشک اداری.</p>
        <Mascot src="/mascots/owl.jpg" alt="جغد دانا، شخصیت دفتر کلاس" className="floaty relative mt-8 size-72 rounded-full" />
        <Mascot src="/mascots/cloud.jpg" alt="" className="floaty absolute bottom-16 left-8 size-28 rounded-full" />
        <Mascot src="/mascots/pencil.jpg" alt="" className="floaty absolute bottom-28 right-10 size-24 rounded-full" />
      </section>
      <section className="flex items-center justify-center px-4 py-8">
        <form onSubmit={submit} className="rise w-full max-w-md rounded-3xl bg-paper p-6 shadow-soft">
          <div className="mb-4 flex items-center gap-3 lg:hidden">
            <Mascot src="/mascots/logo.jpg" alt="" className="size-14 rounded-2xl" />
            <div>
              <h1 className="text-xl font-extrabold">دفتر کلاس هوشمند</h1>
              <p className="text-sm text-muted">{COMPLEX}</p>
            </div>
          </div>
          <p className="text-lg font-bold">به دفتر کلاس هوشمند خوش آمدید.</p>
          <p className="mt-1 text-sm text-muted">
            {ELEMENTARY}
            <br />
            {MIDDLE}
            <br />
            سال تحصیلی {YEAR_LABEL}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-mist p-1">
            {(["manager", "teacher"] as const).map((item) => (
              <button key={item} type="button" className={`min-h-11 rounded-xl font-bold ${role === item ? "bg-paper text-violet shadow-soft" : "text-muted"}`} onClick={() => setRole(item)}>
                {item === "manager" ? "مدیر مدرسه" : "معلم"}
              </button>
            ))}
          </div>
          {role === "manager" ? (
            <Field label="نام کاربری">
              <input className="control" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
            </Field>
          ) : (
            <Field label="نام معلم">
              <select className="control" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="رمز عبور">
            <div className="relative">
              <input className="control pl-12" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
              <button type="button" className="absolute left-1 top-1 grid size-9 place-items-center rounded-lg text-muted" onClick={() => setShow((v) => !v)} aria-label={show ? "پنهان کردن رمز" : "نمایش رمز"}>
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>
          <label className="mb-4 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            مرا روی همین دستگاه به خاطر بسپار
          </label>
          <Btn type="submit" disabled={busy}>
            {busy ? "در حال ورود…" : "ورود به دفتر"}
          </Btn>
          <details className="mt-4 rounded-2xl bg-mist p-3 text-sm text-muted">
            <summary className="cursor-pointer font-bold text-ink">رمز موقت اولین ورود</summary>
            <p className="mt-2">مدیر: نام کاربری nouri و رمز parvin1405. معلم: رمز اولیه همان کد پرسنلی است. بعد از ورود رمز را عوض کنید.</p>
            <p className="mt-2">این دفتر آفلاین است و رمزها جای امنیت سرور را نمی‌گیرند. فایل پشتیبان مدیر را به کسی ندهید.</p>
          </details>
        </form>
      </section>
    </main>
  );
}
