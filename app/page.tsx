import { BigLink } from "@/components/BigLink";

export default function Home() {
  return (
    <main className="min-h-screen bg-felt px-5 py-8 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-md flex-col justify-between gap-8">
        <section className="pt-10">
          <p className="mb-4 inline-block rounded-lg bg-lane px-3 py-2 text-sm font-black uppercase tracking-wide text-night">
            Game Night
          </p>
          <h1 className="text-5xl font-black leading-none">Friday Night Hookers</h1>
          <p className="mt-5 text-2xl font-bold text-white/90">Everyone is shooting for 300!</p>
        </section>

        <nav className="grid gap-4 pb-2">
          <BigLink href="/roster">Roster</BigLink>
          <BigLink href="/start-game" variant="red">
            Start Game
          </BigLink>
          <BigLink href="/scoreboard" variant="black">
            Scoreboard
          </BigLink>
          <div className="grid gap-2">
            <BigLink href="/scoreboard-display">Display Mode (TV)</BigLink>
            <p className="text-center text-sm font-bold text-white/75">
              Use this on the TV or second screen.
            </p>
          </div>
        </nav>
      </div>
    </main>
  );
}
