import type { ReactNode } from "react";
import { toneClass } from "@/lib/school/model";

export function Mascot({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return <img src={src} alt={alt} className={`bg-sticker object-cover ${className}`} />;
}

export function Pill({ children, tone = "lavender" }: { children: ReactNode; tone?: string }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-sm ${toneClass(tone)}`}>{children}</span>;
}

export function EmptyState({ src, title, text, action }: { src: string; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="grid justify-items-center rounded-3xl bg-paper px-6 py-10 text-center shadow-soft">
      <Mascot src={src} alt="" className="size-28 rounded-full" />
      <h3 className="mt-3 text-lg font-extrabold">{title}</h3>
      <p className="mt-1 max-w-sm text-muted">{text}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-navy/40 p-3 sm:place-items-center" role="dialog" aria-modal="true" aria-label={title}>
      <button className="absolute inset-0 cursor-default" aria-label="بستن" onClick={onClose} />
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-auto rounded-3xl bg-paper p-5 shadow-pop">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-lg font-extrabold">{title}</h3>
          <button className="grid size-11 place-items-center rounded-xl bg-mist" onClick={onClose} aria-label="بستن پنجره">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="mb-3 block text-sm font-medium text-muted">
      {label}
      <div className="mt-1 text-base font-normal text-ink">{children}</div>
    </label>
  );
}

export function Btn({
  children,
  onClick,
  kind = "primary",
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  kind?: "primary" | "ghost" | "soft" | "danger";
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const styles = {
    primary: "bg-violet text-paper shadow-soft",
    ghost: "bg-paper text-ink border border-line",
    soft: "bg-lavender/20 text-ink",
    danger: "bg-peach text-ink",
  }[kind];
  return (
    <button type={type} disabled={disabled} onClick={onClick} className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 font-bold disabled:opacity-50 ${styles}`}>
      {children}
    </button>
  );
}
