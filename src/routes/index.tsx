import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { NotebookApp } from "@/components/notebook/app";
import { useNotebook } from "@/lib/school/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = useNotebook.persist.onFinishHydration(() => setReady(true));
    void useNotebook.persist.rehydrate();
    return unsub;
  }, []);

  if (!ready) {
    return (
      <main className="grid min-h-screen place-items-center bg-cream px-6 text-center text-ink">
        <div>
          <img src="/mascots/logo.jpg" alt="" className="mx-auto size-24 rounded-3xl bg-sticker object-cover" />
          <h1 className="mt-4 text-2xl font-extrabold">دفتر کلاس هوشمند</h1>
          <p className="mt-1 text-muted">مجتمع آموزشی رجعین در حال باز شدن است.</p>
        </div>
      </main>
    );
  }

  return <NotebookApp />;
}
