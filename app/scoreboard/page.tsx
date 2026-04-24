"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { GamePlayer, loadGame, saveGame, TeamName } from "@/lib/gameStorage";

const scoreOptions = [0, 10, 15, 20, 25, 30, 50, 60, 75, 100, 200, 300];

export default function ScoreboardPage() {
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [activePlayerId, setActivePlayerId] = useState<string>("");

  useEffect(() => {
    const game = loadGame();
    if (!game) return;

    setPlayers(game.players);
    setActivePlayerId(game.players[0]?.id ?? "");
  }, []);

  useEffect(() => {
    if (players.length > 0) {
      saveGame({ players });
    }
  }, [players]);

  const teamTotals = useMemo(
    () => ({
      Red: players
        .filter((player) => player.team === "Red")
        .reduce((total, player) => total + player.total, 0),
      Black: players
        .filter((player) => player.team === "Black")
        .reduce((total, player) => total + player.total, 0),
    }),
    [players],
  );

  const activePlayer = players.find((player) => player.id === activePlayerId);

  function addScore(score: number) {
    if (!activePlayerId) return;

    setPlayers((current) =>
      current.map((player) =>
        player.id === activePlayerId ? { ...player, total: player.total + score } : player,
      ),
    );
  }

  function resetGameScores() {
    setPlayers((current) => current.map((player) => ({ ...player, total: 0 })));
  }

  return (
    <AppShell title="Scoreboard">
      {players.length === 0 ? (
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
          <section className="grid grid-cols-2 gap-3">
            <TeamScore name="Red" total={teamTotals.Red} />
            <TeamScore name="Black" total={teamTotals.Black} />
          </section>

          <section className="grid gap-4">
            <h2 className="text-xl font-black">Tap Player</h2>
            <TeamPlayers
              team="Red"
              players={players.filter((player) => player.team === "Red")}
              activePlayerId={activePlayerId}
              onSelectPlayer={setActivePlayerId}
            />
            <TeamPlayers
              team="Black"
              players={players.filter((player) => player.team === "Black")}
              activePlayerId={activePlayerId}
              onSelectPlayer={setActivePlayerId}
            />
          </section>

          <section className="grid gap-3 rounded-lg bg-white p-4 shadow-sm">
            <h2 className="text-xl font-black">
              Score {activePlayer ? activePlayer.name : "Player"}
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {scoreOptions.map((score) => (
                <button
                  key={score}
                  onClick={() => addScore(score)}
                  className="min-h-16 rounded-lg bg-lane px-3 py-4 text-2xl font-black text-night shadow-sm active:scale-[0.99]"
                >
                  {score}
                </button>
              ))}
            </div>
          </section>

          <button
            onClick={resetGameScores}
            className="min-h-16 rounded-lg border-2 border-night px-5 py-4 text-xl font-black text-night active:scale-[0.99]"
          >
            Reset Scores
          </button>
        </>
      )}
    </AppShell>
  );
}

function TeamScore({ name, total }: { name: TeamName; total: number }) {
  const isRed = name === "Red";

  return (
    <div className={`rounded-lg p-4 text-white shadow-sm ${isRed ? "bg-scoreRed" : "bg-scoreBlack"}`}>
      <p className="text-base font-black uppercase">{name}</p>
      <p className="mt-2 text-4xl font-black">{total}</p>
    </div>
  );
}

function TeamPlayers({
  team,
  players,
  activePlayerId,
  onSelectPlayer,
}: {
  team: TeamName;
  players: GamePlayer[];
  activePlayerId: string;
  onSelectPlayer: (playerId: string) => void;
}) {
  const isRed = team === "Red";

  return (
    <div className={`rounded-lg border-l-8 bg-white p-3 shadow-sm ${isRed ? "border-scoreRed" : "border-scoreBlack"}`}>
      <h3 className="mb-3 text-lg font-black">{team} Team</h3>
      <div className="grid gap-3">
        {players.map((player) => (
          <button
            key={player.id}
            onClick={() => onSelectPlayer(player.id)}
            className={`min-h-16 rounded-lg border-2 bg-[#f7f3ea] p-4 text-left active:scale-[0.99] ${
              activePlayerId === player.id
                ? isRed
                  ? "border-scoreRed"
                  : "border-scoreBlack"
                : "border-transparent"
            }`}
          >
            <span className="flex items-center justify-between gap-3">
              <span className="text-xl font-black">{player.name}</span>
              <span className="text-2xl font-black">{player.total}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
