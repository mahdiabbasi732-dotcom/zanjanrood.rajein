import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeftRight,
  Award,
  Bell,
  BookOpenCheck,
  CircleHelp,
  ClipboardCheck,
  DatabaseBackup,
  FileText,
  HeartHandshake,
  House,
  LogOut,
  Menu,
  Megaphone,
  School,
  Search,
  GraduationCap,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { AssessPage, AttendancePage, BadgesPage } from "@/components/notebook/academic";
import { Dashboard } from "@/components/notebook/dashboard";
import { LoginScreen } from "@/components/notebook/login";
import { BackupPage, ExchangePage, GuidePage, NewsPage, ReportsPage } from "@/components/notebook/office";
import { ClassesPage, FamilyPage, ProfilePage, StudentsPage, TeachersPage } from "@/components/notebook/people";
import { Btn, Field, Mascot, Modal } from "@/components/notebook/ui";
import { COMPLEX, faLong, fullName, visibleStudents } from "@/lib/school/model";
import { teacherScopeGrades, useNotebook, visibleNews, type View } from "@/lib/school/store";

const NAV: { id: View; label: string; icon: LucideIcon; manager?: boolean }[] = [
  { id: "home", label: "خانه", icon: House },
  { id: "students", label: "دانش‌آموزان", icon: Users },
  { id: "classes", label: "کلاس‌ها", icon: School },
  { id: "teachers", label: "معلمان", icon: GraduationCap, manager: true },
  { id: "attendance", label: "حضور و غیاب", icon: ClipboardCheck },
  { id: "assess", label: "ارزشیابی", icon: BookOpenCheck },
  { id: "family", label: "پرونده خانواده", icon: HeartHandshake, manager: true },
  { id: "badges", label: "نشان‌ها", icon: Award },
  { id: "news", label: "اطلاعیه‌ها", icon: Megaphone },
  { id: "reports", label: "گزارش‌ها", icon: FileText },
  { id: "exchange", label: "تبادل داده", icon: ArrowLeftRight },
  { id: "backup", label: "پشتیبان", icon: DatabaseBackup, manager: true },
  { id: "guide", label: "راهنما", icon: CircleHelp },
];

export function NotebookApp() {
  const session = useNotebook((s) => s.session);
  const [booted, setBooted] = useState(false);

  useEffect(() => {
    if (!useNotebook.getState().session) {
      try {
        const raw = sessionStorage.getItem("parvin-tab-session");
        if (raw) useNotebook.setState({ session: JSON.parse(raw), remember: false });
      } catch {
        sessionStorage.removeItem("parvin-tab-session");
      }
    }
    setBooted(true);
  }, []);

  return (
    <>
      <Toaster position="top-center" dir="rtl" richColors />
      {!booted ? null : session ? <Shell /> : <LoginScreen />}
    </>
  );
}

function Shell() {
  const session = useNotebook((s) => s.session)!;
  const view = useNotebook((s) => s.view);
  const setView = useNotebook((s) => s.setView);
  const logout = useNotebook((s) => s.logout);
  const students = useNotebook((s) => s.students);
  const assignments = useNotebook((s) => s.assignments);
  const announcements = useNotebook((s) => s.announcements);
  const seenNewsAt = useNotebook((s) => s.seenNewsAt);
  const markNewsSeen = useNotebook((s) => s.markNewsSeen);
  const openStudent = useNotebook((s) => s.openStudent);
  const changePassword = useNotebook((s) => s.changePassword);
  const managerName = useNotebook((s) => s.managerName);
  const setManagerName = useNotebook((s) => s.setManagerName);
  const [menu, setMenu] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [newsOpen, setNewsOpen] = useState(false);
  const [account, setAccount] = useState(false);
  const [currentPass, setCurrentPass] = useState("");
  const [nextPass, setNextPass] = useState("");
  const [name, setName] = useState(managerName);
  const manager = session.role === "manager";
  const items = NAV.filter((item) => manager || !item.manager);
  const people = useMemo(() => visibleStudents(students, assignments, session), [students, assignments, session]);
  const found = query.trim() ? people.filter((s) => `${s.first} ${s.last} ${s.id}`.includes(query.trim())).slice(0, 8) : [];
  const unread = visibleNews(announcements, session, teacherScopeGrades({ assignments, session })).filter((a) => a.at > seenNewsAt).length;
  const title = items.find((i) => i.id === view)?.label ?? "دفتر";

  return (
    <div className="min-h-screen bg-cream text-ink lg:flex">
      {menu ? <button className="fixed inset-0 z-30 bg-navy/40 lg:hidden" aria-label="بستن فهرست" onClick={() => setMenu(false)} /> : null}
      <aside className={`${menu ? "translate-x-0" : "translate-x-full"} ${collapsed ? "lg:w-24" : "lg:w-72"} fixed inset-y-0 right-0 z-40 flex w-72 flex-col bg-paper shadow-pop transition-transform lg:static lg:translate-x-0 lg:shadow-none`}>
        <div className="flex items-center gap-3 p-4">
          <Mascot src="/mascots/logo.jpg" alt="نشان دفتر کلاس" className="size-12 rounded-2xl" />
          {collapsed ? null : (
            <div>
              <p className="font-extrabold leading-tight">دفتر کلاس هوشمند</p>
              <p className="text-xs text-muted">{COMPLEX}</p>
            </div>
          )}
        </div>
        <nav className="flex-1 space-y-1 overflow-auto px-3" aria-label="بخش‌های دفتر">
          {items.map((item) => {
            const Icon = item.icon;
            const active = view === item.id;
            return (
              <button
                key={item.id}
                className={`flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 text-right font-bold ${active ? "bg-violet text-paper" : "hover:bg-mist"}`}
                onClick={() => {
                  setView(item.id);
                  setMenu(false);
                }}
              >
                <Icon size={18} aria-hidden />
                {collapsed ? <span className="sr-only lg:not-sr-only lg:hidden">{item.label}</span> : null}
                <span className={collapsed ? "lg:hidden" : ""}>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-3">
          {collapsed ? null : <Mascot src="/mascots/fox.jpg" alt="" className="floaty mx-auto mb-2 hidden size-24 rounded-full lg:block" />}
          <button className="hidden min-h-11 w-full rounded-xl bg-mist text-sm font-bold lg:block" onClick={() => setCollapsed((v) => !v)}>
            {collapsed ? "باز" : "جمع کردن فهرست"}
          </button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="no-print sticky top-0 z-20 flex items-center gap-2 border-b border-line bg-cream/95 px-3 py-3 backdrop-blur">
          <button className="grid size-11 place-items-center rounded-xl bg-paper lg:hidden" onClick={() => setMenu(true)} aria-label="باز کردن فهرست">
            <Menu size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-muted">{faLong()}</p>
            <h1 className="truncate text-lg font-extrabold">{title}</h1>
          </div>
          <div className="relative hidden md:block">
            <label className="flex items-center gap-2 rounded-xl bg-paper px-3">
              <Search size={16} aria-hidden />
              <input className="min-h-11 w-52 bg-transparent outline-none" placeholder="جستجوی دانش‌آموز" value={query} onChange={(e) => setQuery(e.target.value)} />
            </label>
            {found.length ? (
              <div className="absolute z-30 mt-1 w-full rounded-2xl bg-paper p-1 shadow-pop">
                {found.map((s) => (
                  <button key={s.id} className="block w-full rounded-xl px-3 py-2 text-right" onClick={() => { openStudent(s.id); setQuery(""); }}>
                    <span className="block font-bold">{fullName(s)}</span>
                    <span className="text-sm text-muted">{s.grade} · {s.id}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button className="relative grid size-11 place-items-center rounded-xl bg-paper" aria-label="اعلان‌ها" onClick={() => { setNewsOpen((v) => !v); markNewsSeen(); }}>
            <Bell size={18} />
            {unread ? <span className="absolute left-2 top-2 size-2 rounded-full bg-pink" /> : null}
          </button>
          <button className="flex min-h-11 items-center gap-2 rounded-xl bg-paper px-3" onClick={() => setAccount(true)}>
            <span className="max-w-28 truncate text-sm font-bold">{session.name}</span>
          </button>
        </header>
        {newsOpen ? (
          <div className="no-print mx-4 mt-3 rounded-3xl bg-paper p-4 shadow-soft">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-extrabold">تازه‌ها</h2>
              <button aria-label="بستن اعلان‌ها" onClick={() => setNewsOpen(false)}><X size={18} /></button>
            </div>
            {visibleNews(announcements, session, teacherScopeGrades({ assignments, session })).slice(0, 4).map((item) => (
              <p key={item.id} className="border-b border-line py-2 text-sm"><b>{item.title}. </b>{item.body}</p>
            ))}
            <button className="mt-2 text-sm font-bold text-violet" onClick={() => { setView("news"); setNewsOpen(false); }}>همه اطلاعیه‌ها</button>
          </div>
        ) : null}
        <main className="px-3 py-4 md:px-6 md:py-6">
          <label className="no-print mb-4 flex items-center gap-2 rounded-xl bg-paper px-3 md:hidden">
            <Search size={16} />
            <input className="min-h-11 w-full bg-transparent outline-none" placeholder="جستجوی دانش‌آموز" value={query} onChange={(e) => setQuery(e.target.value)} />
          </label>
          {query && found.length ? (
            <div className="no-print mb-4 space-y-1 md:hidden">
              {found.map((s) => (
                <button key={s.id} className="block w-full rounded-2xl bg-paper px-3 py-2 text-right" onClick={() => { openStudent(s.id); setQuery(""); }}>{fullName(s)}</button>
              ))}
            </div>
          ) : null}
          {view === "home" ? <Dashboard /> : null}
          {view === "students" ? <StudentsPage /> : null}
          {view === "profile" ? <ProfilePage /> : null}
          {view === "classes" ? <ClassesPage /> : null}
          {view === "teachers" ? <TeachersPage /> : null}
          {view === "attendance" ? <AttendancePage /> : null}
          {view === "assess" ? <AssessPage /> : null}
          {view === "family" ? <FamilyPage /> : null}
          {view === "badges" ? <BadgesPage /> : null}
          {view === "news" ? <NewsPage /> : null}
          {view === "reports" ? <ReportsPage /> : null}
          {view === "exchange" ? <ExchangePage /> : null}
          {view === "backup" ? <BackupPage /> : null}
          {view === "guide" ? <GuidePage /> : null}
        </main>
      </div>
      {account ? (
        <Modal title="حساب من" onClose={() => setAccount(false)}>
          <p className="mb-3 text-sm text-muted">{manager ? "مدیر مدرسه" : "معلم"} · {session.name}</p>
          {manager ? (
            <Field label="نام نمایشی مدیر">
              <input className="control" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
          ) : null}
          <Field label="رمز فعلی"><input className="control" type="password" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} /></Field>
          <Field label="رمز جدید"><input className="control" type="password" value={nextPass} onChange={(e) => setNextPass(e.target.value)} /></Field>
          <div className="flex flex-wrap gap-2">
            {manager ? <Btn kind="ghost" onClick={() => { setManagerName(name); toast.success("نام ذخیره شد."); }}>ذخیره نام</Btn> : null}
            <Btn onClick={() => {
              void changePassword(currentPass, nextPass).then((error) => {
                if (error) toast.error(error);
                else {
                  toast.success("رمز عوض شد.");
                  setCurrentPass("");
                  setNextPass("");
                }
              });
            }}>تغییر رمز</Btn>
            <Btn kind="soft" onClick={() => { logout(); setAccount(false); }}>
              <LogOut size={16} /> خروج
            </Btn>
          </div>
          <p className="mt-3 text-xs text-muted">رمز فقط روی همین دستگاه و به‌صورت درهم‌سازی‌شده می‌ماند. این قفل، امنیت سرور نیست.</p>
        </Modal>
      ) : null}
    </div>
  );
}
