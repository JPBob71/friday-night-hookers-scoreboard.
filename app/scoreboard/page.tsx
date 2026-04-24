"use client";

import Link from "next/link";
import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  buildThrowOrder,
  GamePlayer,
  getGameSnapshot,
  getNextSpankyIndexes,
  loadGame,
  restoreGameSnapshot,
  SavedGame,
  saveGame,
  TeamName,
} from "@/lib/gameStorage";
import { getClinchedScrew, getPointsNeededToTie, getTeamTotal } from "@/lib/gameDerived";

const scoreOptions = [0, 10, 15, 20, 25, 30, 50, 60, 75, 100, 200, 300];
const winningScrewsNeeded = 10;

export default function ScoreboardPage() {
  const [game, setGame] = useState<SavedGame | null>(null);
  const currentThrowerRowRef = useRef<HTMLDivElement | null>(null);
  const [advancePulseKey, setAdvancePulseKey] = useState(0);

  useEffect(() => {
    setGame(loadGame());
  }, []);

  useEffect(() => {
    if (game) {
      saveGame(game);
    }
  }, [game]);

  const currentThrower = useMemo(() => {
    if (!game || game.winner) return null;
    return game.players.find((player) => player.id === game.throwOrder[game.currentThrowIndex]) ?? null;
  }, [game]);

  const teamScores = useMemo(() => {
    if (!game) return { Red: 0, Black: 0 };

    return {
      Red: getTeamTotal(game.players, "Red"),
      Black: getTeamTotal(game.players, "Black"),
    };
  }, [game]);

  const pointsNeededToTie = useMemo(() => {
    if (!game) return null;
    return getPointsNeededToTie(game);
  }, [game]);
  const playersThrown = game
    ? game.winner
      ? game.throwOrder.length
      : game.currentThrowIndex
    : 0;
  const playersInRound = game?.throwOrder.length ?? 0;
  const clinchedScrew = useMemo(() => {
    if (!game || game.winner) return null;
    return getClinchedScrew(game);
  }, [game]);
  const nextThrower = useMemo(() => {
    if (!game || game.winner) return null;
    return game.players.find((player) => player.id === game.throwOrder[game.currentThrowIndex + 1]) ?? null;
  }, [game]);

  useEffect(() => {
    if (!currentThrower?.id) return;

    setAdvancePulseKey((key) => key + 1);
    const scrollTimer = window.setTimeout(() => {
      currentThrowerRowRef.current?.scrollIntoView({
        behavior: "smooth",
        inline: "nearest",
        block: "center",
      });
    }, 40);

    return () => window.clearTimeout(scrollTimer);
  }, [currentThrower?.id]);

  function recordThrow(score: number) {
    if (!game || !currentThrower || game.winner) return;

    setGame((current) => {
      if (!current) return current;

      const snapshot = getGameSnapshot(current);
      const scoringPlayer = current.players.find(
        (player) => player.id === current.throwOrder[current.currentThrowIndex],
      );
      if (!scoringPlayer) return current;

      const players = current.players.map((player) => {
        if (player.id !== scoringPlayer.id) return player;

        return {
          ...player,
          total: player.total + score,
          roundScore: player.roundScore + score,
          total300s: score === 300 ? player.total300s + 1 : player.total300s,
          tickStreak: score === 300 ? player.tickStreak + 1 : 0,
        };
      });
      const roundTotals = {
        ...current.roundTotals,
        [scoringPlayer.team]: current.roundTotals[scoringPlayer.team] + score,
      };
      const nextHistory = [...current.history, snapshot].slice(-75);
      const nextThrowIndex = current.currentThrowIndex + 1;

      if (nextThrowIndex < current.throwOrder.length) {
        return {
          ...current,
          players,
          roundTotals,
          currentThrowIndex: nextThrowIndex,
          history: nextHistory,
        };
      }

      const roundWinner = getRoundWinner(roundTotals);
      const redWinningScrews =
        roundWinner === "Red" ? current.redWinningScrews + 1 : current.redWinningScrews;
      const blackWinningScrews =
        roundWinner === "Black" ? current.blackWinningScrews + 1 : current.blackWinningScrews;
      const winner =
        redWinningScrews >= winningScrewsNeeded
          ? "Red"
          : blackWinningScrews >= winningScrewsNeeded
            ? "Black"
            : null;
      const nextSpankyIndexes = getNextSpankyIndexes(players, current.teamSpankyIndexes);

      return {
        ...current,
        players: winner ? players : resetPlayerRoundScores(players),
        currentThrowIndex: 0,
        currentRound: winner ? current.currentRound : current.currentRound + 1,
        teamSpankyIndexes: winner ? current.teamSpankyIndexes : nextSpankyIndexes,
        throwOrder: winner ? current.throwOrder : buildThrowOrder(players, nextSpankyIndexes),
        redWinningScrews,
        blackWinningScrews,
        tieRounds: roundWinner ? current.tieRounds : current.tieRounds + 1,
        roundTotals: winner ? roundTotals : { Red: 0, Black: 0 },
        winner,
        history: nextHistory,
      };
    });
  }

  function undoLastThrow() {
    setGame((current) => {
      if (!current || current.history.length === 0) return current;

      const previous = current.history[current.history.length - 1];
      const remainingHistory = current.history.slice(0, -1);
      return restoreGameSnapshot(previous, remainingHistory);
    });
  }

  function correctCurrentThrower(playerId: string) {
    setGame((current) => {
      if (!current || current.winner) return current;
      const throwIndex = current.throwOrder.indexOf(playerId);
      if (throwIndex === -1) return current;

      return {
        ...current,
        currentThrowIndex: throwIndex,
      };
    });
  }

  function resetGameScores() {
    setGame((current) => {
      if (!current) return current;
      const teamSpankyIndexes = { Red: 0, Black: 0 };

      return {
        ...current,
        players: current.players.map((player) => ({
          ...player,
          total: 0,
          roundScore: 0,
          total300s: 0,
          tickStreak: 0,
        })),
        throwOrder: buildThrowOrder(current.players, teamSpankyIndexes),
        currentThrowIndex: 0,
        currentRound: 1,
        teamSpankyIndexes,
        redWinningScrews: 0,
        blackWinningScrews: 0,
        tieRounds: 0,
        roundTotals: { Red: 0, Black: 0 },
        winner: null,
        history: [],
      };
    });
  }

  return (
    <AppShell title="Scoreboard">
      {!game || game.players.length === 0 ? (
        <div className="grid gap-4 rounded-lg bg-white p-4 shadow-sm">
          <p className="text-lg font-bold text-night/75">Start a game to build teams.</p>
          <Link
            href="/start-game"
            className="flex min-h-16 items-center justify-center rounded-lg bg-scoreRed px-5 py-4 text-xl font-black text-white"
          >
            Start Game
          </Link>
        </div>
      ) : (
        <>
          <section className="grid gap-3 rounded-lg bg-white p-4 text-center shadow-sm">
            <p className="text-base font-black uppercase text-night/60">
              Round {game.currentRound}
            </p>
            <h2 className="text-2xl font-black">
              {game.winner
                ? `${game.winner} wins with 10 screws!`
                : currentThrower
                  ? `${currentThrower.name} throws now`
                  : "Ready"}
            </h2>
            <p className="text-lg font-bold text-night/70">Everyone is shooting for 300!</p>
          </section>

          <section className="grid gap-3 rounded-lg bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black uppercase text-night/60">Round Status</p>
                <p className="text-2xl font-black">Round {game.currentRound}</p>
              </div>
              <div className="rounded-lg bg-[#f7f3ea] px-3 py-2 text-right">
                <p className="text-sm font-black uppercase text-night/60">Thrown</p>
                <p className="text-xl font-black">
                  {playersThrown} of {playersInRound}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <RoundTotal label="Red" value={game.roundTotals.Red} />
              <RoundTotal label="Black" value={game.roundTotals.Black} />
            </div>
            {clinchedScrew && (
              <div
                className={`rounded-lg p-3 text-center text-white ${
                  clinchedScrew === "Red" ? "bg-scoreRed" : "bg-scoreBlack"
                }`}
              >
                <p className="text-sm font-black uppercase">Screw Clinched</p>
                <p className="mt-1 text-2xl font-black">{clinchedScrew} Team</p>
              </div>
            )}
            <div className="rounded-lg bg-lane p-3 text-center text-night">
              <p className="text-sm font-black uppercase">Next Player</p>
              <p className="mt-1 text-2xl font-black">
                {currentThrower ? currentThrower.name : "Game Over"}
              </p>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <TeamPanel
              name="Red"
              screws={game.redWinningScrews}
              roundTotal={game.roundTotals.Red}
              score={teamScores.Red}
            />
            <TeamPanel
              name="Black"
              screws={game.blackWinningScrews}
              roundTotal={game.roundTotals.Black}
              score={teamScores.Black}
            />
          </section>

          <section className="grid gap-3 rounded-lg bg-white p-4 text-center shadow-sm">
            <div>
              <p className="text-sm font-black uppercase text-night/60">Tie Rounds</p>
              <p className="text-4xl font-black">{game.tieRounds}</p>
            </div>
            <div className="rounded-lg bg-[#f7f3ea] p-3">
              <p className="text-sm font-black uppercase text-night/60">Points Needed To Tie</p>
              <p className="mt-1 text-xl font-black">
                {pointsNeededToTie}
              </p>
            </div>
          </section>

          <section className="grid gap-3 rounded-lg bg-white p-4 shadow-sm">
            <div className="rounded-lg bg-night p-4 text-center text-white">
              <p className="text-sm font-black uppercase text-white/65">Current Thrower</p>
              <p className="mt-1 text-4xl font-black">
                {currentThrower ? currentThrower.name : "Game Over"}
              </p>
              <p className="mt-2 text-lg font-bold text-white/75">
                {nextThrower ? `Next Up: ${nextThrower.name}` : "Last throw of the round"}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {scoreOptions.map((score) => (
                <button
                  key={score}
                  onClick={() => recordThrow(score)}
                  disabled={Boolean(game.winner)}
                  className="min-h-20 rounded-lg bg-lane px-3 py-5 text-3xl font-black text-night shadow-sm transition-transform active:scale-[0.98] disabled:bg-night/20 disabled:text-night/40"
                >
                  {score}
                </button>
              ))}
            </div>
            <details className="rounded-lg bg-[#f7f3ea] p-3">
              <summary className="cursor-pointer text-sm font-black uppercase text-night/60">
                Admin Correction
              </summary>
              <div className="mt-3 grid gap-2">
                <label className="text-sm font-black uppercase text-night/60" htmlFor="current-thrower">
                  Set Current Thrower
                </label>
                <select
                  id="current-thrower"
                  value={currentThrower?.id ?? ""}
                  onChange={(event) => correctCurrentThrower(event.target.value)}
                  disabled={Boolean(game.winner)}
                  className="min-h-12 rounded-lg border-2 border-night/20 bg-white px-3 text-lg font-bold"
                >
                  {game.throwOrder.map((playerId, index) => {
                    const player = game.players.find((candidate) => candidate.id === playerId);
                    if (!player) return null;

                    return (
                      <option key={`${playerId}-${index}`} value={playerId}>
                        {index + 1}. {player.name}
                      </option>
                    );
                  })}
                </select>
              </div>
            </details>
          </section>

          <section className="grid gap-4">
            <TeamPlayers
              team="Red"
              players={game.players.filter((player) => player.team === "Red")}
              spankyIndex={game.teamSpankyIndexes.Red}
              currentThrowerId={currentThrower?.id ?? ""}
              currentThrowerRowRef={currentThrowerRowRef}
              advancePulseKey={advancePulseKey}
            />
            <TeamPlayers
              team="Black"
              players={game.players.filter((player) => player.team === "Black")}
              spankyIndex={game.teamSpankyIndexes.Black}
              currentThrowerId={currentThrower?.id ?? ""}
              currentThrowerRowRef={currentThrowerRowRef}
              advancePulseKey={advancePulseKey}
            />
          </section>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={undoLastThrow}
              disabled={game.history.length === 0}
              className="min-h-16 rounded-lg bg-night px-5 py-4 text-xl font-black text-white active:scale-[0.99] disabled:bg-night/30"
            >
              Undo Throw
            </button>
            <button
              onClick={resetGameScores}
              className="min-h-16 rounded-lg border-2 border-night px-5 py-4 text-xl font-black text-night active:scale-[0.99]"
            >
              Reset Game
            </button>
          </div>
        </>
      )}
    </AppShell>
  );
}

function getRoundWinner(roundTotals: Record<TeamName, number>): TeamName | null {
  if (roundTotals.Red > roundTotals.Black) return "Red";
  if (roundTotals.Black > roundTotals.Red) return "Black";
  return null;
}

function resetPlayerRoundScores(players: GamePlayer[]) {
  return players.map((player) => ({ ...player, roundScore: 0 }));
}

function TeamPanel({
  name,
  screws,
  roundTotal,
  score,
}: {
  name: TeamName;
  screws: number;
  roundTotal: number;
  score: number;
}) {
  const isRed = name === "Red";

  return (
    <div className={`rounded-lg p-4 text-white shadow-sm ${isRed ? "bg-scoreRed" : "bg-scoreBlack"}`}>
      <p className="text-base font-black uppercase">{name}</p>
      <p className="mt-2 text-4xl font-black">{screws}</p>
      <p className="font-bold">Screws</p>
      <div className="mt-4 grid gap-1 rounded-lg bg-white/15 p-3">
        <p className="text-sm font-black uppercase">Round Total</p>
        <p className="text-2xl font-black">{roundTotal}</p>
        <p className="text-sm font-black uppercase">Team Score</p>
        <p className="text-2xl font-black">{score}</p>
      </div>
    </div>
  );
}

function RoundTotal({ label, value }: { label: TeamName; value: number }) {
  const isRed = label === "Red";

  return (
    <div className={`rounded-lg p-3 text-center text-white ${isRed ? "bg-scoreRed" : "bg-scoreBlack"}`}>
      <p className="text-sm font-black uppercase">{label} Total</p>
      <p className="text-3xl font-black">{value}</p>
    </div>
  );
}

function TeamPlayers({
  team,
  players,
  spankyIndex,
  currentThrowerId,
  currentThrowerRowRef,
  advancePulseKey,
}: {
  team: TeamName;
  players: GamePlayer[];
  spankyIndex: number;
  currentThrowerId: string;
  currentThrowerRowRef: RefObject<HTMLDivElement | null>;
  advancePulseKey: number;
}) {
  const isRed = team === "Red";
  const currentSpankyId = players[spankyIndex]?.id ?? "";
  const nextSpankyId = players.length > 0 ? players[(spankyIndex + 1) % players.length].id : "";

  return (
    <div className={`rounded-lg border-l-8 bg-white p-3 shadow-sm ${isRed ? "border-scoreRed" : "border-scoreBlack"}`}>
      <h3 className="mb-3 text-lg font-black">{team} Team</h3>
      <div className="grid gap-3">
        {players.map((player) => {
          const isCurrentThrower = player.id === currentThrowerId;
          const isCurrentSpanky = player.id === currentSpankyId;
          const isNextSpanky = player.id === nextSpankyId;

          return (
            <div
              key={isCurrentThrower ? `${player.id}-${advancePulseKey}` : player.id}
              ref={isCurrentThrower ? currentThrowerRowRef : null}
              className={`rounded-lg border-4 p-4 transition-all duration-150 ease-out ${
                isCurrentThrower
                  ? isRed
                    ? "animate-thrower-pulse scale-[1.025] border-scoreRed bg-red-100 shadow-[0_0_0_6px_rgba(202,37,55,0.2),0_16px_36px_rgba(202,37,55,0.28)]"
                    : "animate-thrower-pulse scale-[1.025] border-scoreBlack bg-white shadow-[0_0_0_6px_rgba(16,24,32,0.18),0_16px_36px_rgba(16,24,32,0.26)]"
                  : "scale-100 border-transparent bg-[#f7f3ea] opacity-65"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xl font-black">{player.name}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {isCurrentThrower && <Badge>Throwing Now</Badge>}
                    {isCurrentSpanky && <Badge>Spanky</Badge>}
                    {isNextSpanky && <Badge>Next Spanky</Badge>}
                    {player.tickStreak === 3 && <Badge>Turkey</Badge>}
                  </div>
                </div>
                <p className="text-3xl font-black">{player.total}</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                <PlayerStat label="300s" value={player.total300s} />
                <PlayerStat label="Tick Streak" value={player.tickStreak} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-lg bg-lane px-2 py-1 text-xs font-black uppercase text-night">
      {children}
    </span>
  );
}

function PlayerStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white p-3">
      <p className="text-sm font-black uppercase text-night/55">{label}</p>
      <p className="text-2xl font-black">{value}</p>
    </div>
  );
}
