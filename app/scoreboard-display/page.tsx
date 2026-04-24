"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { GamePlayer, loadGame, SavedGame, TeamName } from "@/lib/gameStorage";
import {
  buildMatchupRows,
  getClinchedScrew,
  getPointsNeededToTie,
  getTeamTotal,
} from "@/lib/gameDerived";

export default function ScoreboardDisplayPage() {
  const [game, setGame] = useState<SavedGame | null>(null);

  useEffect(() => {
    const syncGame = () => setGame(loadGame());

    syncGame();
    window.addEventListener("storage", syncGame);
    const interval = window.setInterval(syncGame, 500);

    return () => {
      window.removeEventListener("storage", syncGame);
      window.clearInterval(interval);
    };
  }, []);

  const rows = useMemo(() => buildMatchupRows(game), [game]);
  const redTotal = useMemo(() => getTeamTotal(game?.players ?? [], "Red"), [game]);
  const blackTotal = useMemo(() => getTeamTotal(game?.players ?? [], "Black"), [game]);
  const clinchedScrew = useMemo(() => (game ? getClinchedScrew(game) : null), [game]);
  const pointsNeededToTie = useMemo(() => (game ? getPointsNeededToTie(game) : null), [game]);
  const gameStatus = game?.winner
    ? `${game.winner} Wins`
    : clinchedScrew
      ? `${clinchedScrew} Screw Clinched`
      : "In Progress";

  return (
    <main className="min-h-screen w-full bg-night p-3 text-white lg:p-5 xl:p-6">
      <div className="grid min-h-[calc(100vh-24px)] w-full gap-4 lg:min-h-[calc(100vh-40px)] lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.68fr)_minmax(0,1fr)] lg:gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.62fr)_minmax(0,1fr)]">
        <TeamColumn team="Red" players={rows.map((row) => row.Red)} />

        <CenterPanel
          game={game}
          status={gameStatus}
          redTotal={redTotal}
          blackTotal={blackTotal}
          pointsNeededToTie={pointsNeededToTie ?? "Round is tied"}
        />

        <TeamColumn team="Black" players={rows.map((row) => row.Black)} />
      </div>
    </main>
  );
}

function TeamColumn({ team, players }: { team: TeamName; players: Array<GamePlayer | null> }) {
  const isRed = team === "Red";

  return (
    <section
      className={`grid min-h-0 content-start rounded-lg p-4 text-white shadow-2xl lg:p-5 xl:p-6 ${
        isRed ? "bg-scoreRed" : "bg-scoreBlack"
      }`}
    >
      <header className="mb-4 border-b border-white/30 pb-4 xl:mb-6">
        <p className="text-xl font-black uppercase text-white/70 xl:text-2xl">{team}</p>
        <h2 className="text-5xl font-black leading-none xl:text-7xl">{team} Team</h2>
      </header>

      <div className="grid gap-3 xl:gap-4">
        {players.length === 0 ? (
          <div className="rounded-lg border border-white/20 bg-white/10 p-6 text-center text-3xl font-black text-white/70">
            No players yet
          </div>
        ) : (
          players.map((player, index) => (
            <PlayerRow key={player?.id ?? `${team}-${index}`} player={player} />
          ))
        )}
      </div>
    </section>
  );
}

function PlayerRow({ player }: { player: GamePlayer | null }) {
  if (!player) {
    return <div className="min-h-24 rounded-lg border border-white/15 bg-white/10 xl:min-h-32" />;
  }

  return (
    <div className="grid min-h-24 grid-cols-[minmax(0,1fr)_minmax(140px,0.38fr)] gap-4 rounded-lg bg-white p-4 text-night xl:min-h-32 xl:grid-cols-[minmax(0,1fr)_minmax(190px,0.36fr)] xl:p-5">
      <div className="min-w-0">
        <p className="truncate text-4xl font-black leading-none xl:text-6xl">{player.name}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 xl:mt-5 xl:gap-3">
          <Stat label="Ticks" value={player.tickStreak} />
          <Stat label="300s" value={player.total300s} />
        </div>
      </div>
      <div className="grid gap-2 text-center xl:gap-3">
        <div className="rounded-lg bg-lane p-2 xl:p-3">
          <p className="text-sm font-black uppercase text-night/60 xl:text-base">Round</p>
          <p className="text-4xl font-black xl:text-6xl">{player.roundScore}</p>
        </div>
        <div className="rounded-lg bg-night p-2 text-white xl:p-3">
          <p className="text-sm font-black uppercase text-white/65 xl:text-base">Total</p>
          <p className="text-4xl font-black xl:text-6xl">{player.total}</p>
        </div>
      </div>
    </div>
  );
}

function CenterPanel({
  game,
  status,
  redTotal,
  blackTotal,
  pointsNeededToTie,
}: {
  game: SavedGame | null;
  status: string;
  redTotal: number;
  blackTotal: number;
  pointsNeededToTie: string;
}) {
  return (
    <section className="grid content-between gap-4 rounded-lg bg-white p-4 text-center text-night shadow-2xl lg:p-5 xl:p-6">
      <div className="grid gap-4 xl:gap-5">
        <div>
          <p className="text-lg font-black uppercase text-night/55 xl:text-2xl">
            Friday Night Hookers
          </p>
          <h1 className="mt-2 text-6xl font-black leading-none xl:text-8xl">
            Round {game?.currentRound ?? 1}
          </h1>
          <p className="mt-3 text-xl font-black text-night/60 xl:text-3xl">
            Everyone is shooting for 300!
          </p>
        </div>

        <DisplayCard label="Score Status" value={status} />
        <DisplayCard
          label="Screws"
          value={`${game?.redWinningScrews ?? 0} - ${game?.blackWinningScrews ?? 0}`}
          sublabel="Red vs Black"
        />
        <DisplayCard label="Needs To Tie" value={pointsNeededToTie} />
      </div>

      <div className="grid gap-4 xl:gap-5">
        <div className="grid grid-cols-2 gap-3 xl:gap-4">
          <DisplayCard label="Red Round" value={game?.roundTotals.Red ?? 0} compact />
          <DisplayCard label="Black Round" value={game?.roundTotals.Black ?? 0} compact />
        </div>
        <div className="grid grid-cols-2 gap-3 xl:gap-4">
          <DisplayCard label="Red Total" value={redTotal} compact />
          <DisplayCard label="Black Total" value={blackTotal} compact />
        </div>
        <Link
          href="/scoreboard"
          className="mx-auto inline-flex min-h-12 items-center justify-center rounded-lg border border-night/20 px-4 py-3 text-base font-black text-night active:scale-[0.99] xl:text-xl"
        >
          Controller View
        </Link>
      </div>
    </section>
  );
}

function DisplayCard({
  label,
  value,
  sublabel,
  compact = false,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  compact?: boolean;
}) {
  return (
    <div className="rounded-lg bg-[#f7f3ea] p-4 xl:p-5">
      <p className="text-sm font-black uppercase text-night/55 xl:text-lg">{label}</p>
      <p className={`${compact ? "text-5xl xl:text-7xl" : "text-5xl xl:text-6xl"} mt-2 font-black leading-none`}>
        {value}
      </p>
      {sublabel && <p className="mt-2 text-lg font-bold text-night/60 xl:text-2xl">{sublabel}</p>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-[#f7f3ea] p-2 text-center xl:p-3">
      <p className="text-xs font-black uppercase text-night/55 xl:text-sm">{label}</p>
      <p className="text-3xl font-black xl:text-5xl">{value}</p>
    </div>
  );
}
