import Link from "next/link";

type AppShellProps = {
  title: string;
  children: React.ReactNode;
};

export function AppShell({ title, children }: AppShellProps) {
  return (
    <main className="min-h-screen bg-[#f7f3ea] px-4 py-5 text-night">
      <div className="mx-auto flex min-h-[calc(100vh-40px)] w-full max-w-md flex-col gap-5">
        <header className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="rounded-lg border border-night/15 bg-white px-4 py-3 text-base font-bold shadow-sm active:scale-[0.99]"
          >
            Home
          </Link>
          <h1 className="text-right text-2xl font-black leading-tight">{title}</h1>
        </header>
        {children}
      </div>
    </main>
  );
}
