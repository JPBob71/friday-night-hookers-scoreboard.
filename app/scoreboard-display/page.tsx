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
  const currentThrowerId = game && !game.winner ? game.throwOrder[game.currentThrowIndex] : "";
  const gameStatus = game?.winner
    ? `${game.winner} Wins`
    : clinchedScrew
      ? `${clinchedScrew} Screw Clinched`
      : "In Progress";

  return (
    <main className="min-h-screen w-full bg-night p-3 text-white lg:p-5 xl:p-6">
      <div className="grid min-h-[calc(100vh-24px)] w-full gap-4 lg:min-h-[calc(100vh-40px)] lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.48fr)_minmax(0,1fr)] lg:gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.56fr)_minmax(0,1fr)] xl:gap-5">
        <TeamColumn
          team="Red"
          players={rows.map((row) => row.Red)}
          currentThrowerId={currentThrowerId}
        />

        <CenterPanel
          game={game}
          status={gameStatus}
          redTotal={redTotal}
          blackTotal={blackTotal}
          pointsNeededToTie={pointsNeededToTie ?? "Round is tied"}
        />

        <TeamColumn
          team="Black"
          players={rows.map((row) => row.Black)}
          currentThrowerId={currentThrowerId}
        />
      </div>
    </main>
  );
}

function TeamColumn({
  team,
  players,
  currentThrowerId,
}: {
  team: TeamName;
  players: Array<GamePlayer | null>;
  currentThrowerId: string;
}) {
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

      <div className="grid gap-2 xl:gap-3">
        <div className="grid grid-cols-[minmax(7.5rem,1fr)_3.25rem_2.25rem_2.5rem_3rem] items-end gap-1 px-3 text-[10px] font-black uppercase text-white/70 xl:grid-cols-[minmax(13rem,1fr)_6rem_4.25rem_4.25rem_5rem] xl:gap-3 xl:px-5 xl:text-lg">
          <p>Name</p>
          <p className="text-center">Round</p>
          <p className="text-center">Ticks</p>
          <p className="text-center">300s</p>
          <p className="text-center">Total</p>
        </div>
        {players.length === 0 ? (
          <div className="rounded-lg border border-white/20 bg-white/10 p-6 text-center text-3xl font-black text-white/70">
            No players yet
          </div>
        ) : (
          players.map((player, index) => (
            <PlayerRow
              key={player?.id ?? `${team}-${index}`}
              player={player}
              team={team}
              isCurrentThrower={player?.id === currentThrowerId}
            />
          ))
        )}
      </div>
    </section>
  );
}

function PlayerRow({
  player,
  team,
  isCurrentThrower,
}: {
  player: GamePlayer | null;
  team: TeamName;
  isCurrentThrower: boolean;
}) {
  const isRed = team === "Red";

  if (!player) {
    return <div className="min-h-20 rounded-lg border border-white/15 bg-white/10 xl:min-h-24" />;
  }

  return (
    <div
      className={`grid min-h-20 grid-cols-[minmax(7.5rem,1fr)_3.25rem_2.25rem_2.5rem_3rem] items-center gap-1 rounded-lg border-4 px-3 py-3 text-night transition-all duration-150 xl:min-h-24 xl:grid-cols-[minmax(13rem,1fr)_6rem_4.25rem_4.25rem_5rem] xl:gap-3 xl:px-5 ${
        isCurrentThrower
          ? isRed
            ? "border-white bg-red-50 shadow-[0_0_0_6px_rgba(255,255,255,0.2),0_0_34px_rgba(255,255,255,0.4)]"
            : "border-white bg-neutral-100 shadow-[0_0_0_6px_rgba(255,255,255,0.18),0_0_34px_rgba(255,255,255,0.34)]"
          : "border-transparent bg-white/90"
      }`}
    >
      <p className="min-w-0 truncate text-2xl font-black leading-none xl:text-5xl">{player.name}</p>
      <p className="text-center text-4xl font-black leading-none xl:text-7xl">{player.roundScore}</p>
      <p className="text-center text-2xl font-black leading-none xl:text-5xl">{player.tickStreak}</p>
      <p className="text-center text-2xl font-black leading-none xl:text-5xl">{player.total300s}</p>
      <p className="text-center text-xl font-black leading-none text-night/70 xl:text-4xl">
        {player.total}
      </p>
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
          <h1 className="mt-2 text-5xl font-black leading-none xl:text-6xl">
            Round {game?.currentRound ?? 1}
          </h1>
          <p className="mt-3 text-xl font-black text-night/60 xl:text-3xl">
            Everyone is shooting for 300!
          </p>
        </div>

        <DisplayCard label="Status" value={status} size="large" />
        <DisplayCard
          label="Screws"
          value={`${game?.redWinningScrews ?? 0} - ${game?.blackWinningScrews ?? 0}`}
          sublabel="Red vs Black"
          size="hero"
        />
        <DisplayCard label="Needs To Tie" value={pointsNeededToTie} size="medium" />
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
  size = compact ? "compact" : "medium",
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  compact?: boolean;
  size?: "compact" | "medium" | "large" | "hero";
}) {
  const valueSize = {
    compact: "text-5xl xl:text-7xl",
    medium: "text-5xl xl:text-6xl",
    large: "text-6xl xl:text-7xl",
    hero: "text-8xl xl:text-9xl",
  }[size];

  return (
    <div className="rounded-lg bg-[#f7f3ea] p-4 xl:p-5">
      <p className="text-sm font-black uppercase text-night/55 xl:text-lg">{label}</p>
      <p className={`${valueSize} mt-2 font-black leading-none`}>
        {value}
      </p>
      {sublabel && <p className="mt-2 text-lg font-bold text-night/60 xl:text-2xl">{sublabel}</p>}
    </div>
  );
}
