"use client";

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
    <main className="min-h-screen bg-[#f7f3ea] p-4 text-night lg:bg-night lg:p-6">
      <section className="grid min-h-[calc(100vh-32px)] place-items-center rounded-lg bg-white p-6 text-center shadow-sm lg:hidden">
        <div>
          <p className="text-sm font-black uppercase text-night/55">Scoreboard View</p>
          <h1 className="mt-2 text-3xl font-black">Use a larger screen</h1>
        </div>
      </section>

      <section className="hidden min-h-[calc(100vh-48px)] grid-cols-[1fr_360px_1fr] gap-5 lg:grid xl:grid-cols-[1fr_430px_1fr]">
        <TeamColumn team="Red" players={rows.map((row) => row.Red)} />

        <CenterPanel
          game={game}
          status={gameStatus}
          redTotal={redTotal}
          blackTotal={blackTotal}
          pointsNeededToTie={pointsNeededToTie ?? "Round is tied"}
        />

        <TeamColumn team="Black" players={rows.map((row) => row.Black)} />
      </section>
    </main>
  );
}

function TeamColumn({ team, players }: { team: TeamName; players: Array<GamePlayer | null> }) {
  const isRed = team === "Red";

  return (
    <section className={`rounded-lg p-5 text-white ${isRed ? "bg-scoreRed" : "bg-scoreBlack"}`}>
      <header className="mb-5 flex items-end justify-between border-b border-white/30 pb-4">
        <div>
          <p className="text-lg font-black uppercase text-white/70">{team}</p>
          <h2 className="text-5xl font-black">{team} Team</h2>
        </div>
      </header>

      <div className="grid gap-3">
        {players.map((player, index) => (
          <PlayerRow key={player?.id ?? `${team}-${index}`} player={player} />
        ))}
      </div>
    </section>
  );
}

function PlayerRow({ player }: { player: GamePlayer | null }) {
  if (!player) {
    return <div className="min-h-28 rounded-lg border border-white/15 bg-white/10" />;
  }

  return (
    <div className="grid min-h-28 grid-cols-[1fr_120px] gap-4 rounded-lg bg-white p-4 text-night">
      <div className="min-w-0">
        <p className="truncate text-3xl font-black">{player.name}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Stat label="Ticks" value={player.tickStreak} />
          <Stat label="300s" value={player.total300s} />
        </div>
      </div>
      <div className="grid gap-2 text-center">
        <div className="rounded-lg bg-lane p-2">
          <p className="text-xs font-black uppercase text-night/60">Round</p>
          <p className="text-3xl font-black">{player.roundScore}</p>
        </div>
        <div className="rounded-lg bg-night p-2 text-white">
          <p className="text-xs font-black uppercase text-white/65">Total</p>
          <p className="text-3xl font-black">{player.total}</p>
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
    <section className="grid content-between rounded-lg bg-white p-5 text-center shadow-sm">
      <div className="grid gap-4">
        <div>
          <p className="text-lg font-black uppercase text-night/55">Friday Night Hookers</p>
          <h1 className="mt-2 text-5xl font-black">Round {game?.currentRound ?? 1}</h1>
        </div>

        <DisplayCard label="Game Status" value={status} />
        <DisplayCard
          label="Screws"
          value={`${game?.redWinningScrews ?? 0} - ${game?.blackWinningScrews ?? 0}`}
          sublabel="Red vs Black"
        />
        <DisplayCard label="Points Needed To Tie" value={pointsNeededToTie} />
      </div>

      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-3">
          <DisplayCard label="Red Round" value={game?.roundTotals.Red ?? 0} compact />
          <DisplayCard label="Black Round" value={game?.roundTotals.Black ?? 0} compact />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <DisplayCard label="Red Total" value={redTotal} compact />
          <DisplayCard label="Black Total" value={blackTotal} compact />
        </div>
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
    <div className="rounded-lg bg-[#f7f3ea] p-4">
      <p className="text-sm font-black uppercase text-night/55">{label}</p>
      <p className={`${compact ? "text-4xl" : "text-5xl"} mt-2 font-black`}>{value}</p>
      {sublabel && <p className="mt-1 text-lg font-bold text-night/60">{sublabel}</p>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-[#f7f3ea] p-2 text-center">
      <p className="text-xs font-black uppercase text-night/55">{label}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}
