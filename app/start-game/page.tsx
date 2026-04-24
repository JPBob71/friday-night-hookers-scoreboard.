"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { createGame, GamePlayer, loadRoster, Player, saveGame, TeamName } from "@/lib/gameStorage";

type TeamAssignments = Record<TeamName, Player[]>;

function shufflePlayers(players: Player[]) {
  return [...players].sort(() => Math.random() - 0.5);
}

export default function StartGamePage() {
  const [roster, setRoster] = useState<Player[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [teams, setTeams] = useState<TeamAssignments>({ Red: [], Black: [] });

  useEffect(() => {
    const savedRoster = loadRoster();
    setRoster(savedRoster);
    setSelectedIds(savedRoster.map((player) => player.id));
  }, []);

  const selectedPlayers = useMemo(
    () => roster.filter((player) => selectedIds.includes(player.id)),
    [roster, selectedIds],
  );

  function togglePlayer(playerId: string) {
    setSelectedIds((current) =>
      current.includes(playerId)
        ? current.filter((id) => id !== playerId)
        : [...current, playerId],
    );
  }

  function randomizeTeams() {
    const shuffled = shufflePlayers(selectedPlayers);
    const nextTeams: TeamAssignments = { Red: [], Black: [] };

    shuffled.forEach((player, index) => {
      nextTeams[index % 2 === 0 ? "Red" : "Black"].push(player);
    });

    setTeams(nextTeams);
    const gamePlayers: GamePlayer[] = shuffled.map((player, index) => ({
      ...player,
      team: index % 2 === 0 ? "Red" : "Black",
      total: 0,
      total300s: 0,
      tickStreak: 0,
    }));

    saveGame(createGame(gamePlayers));
  }

  return (
    <AppShell title="Start Game">
      {roster.length === 0 ? (
        <div className="grid gap-4 rounded-lg bg-white p-4 shadow-sm">
          <p className="text-lg font-bold text-night/75">Add players before starting a game.</p>
          <Link
            href="/roster"
            className="flex min-h-16 items-center justify-center rounded-lg bg-felt px-5 py-4 text-xl font-black text-white"
          >
            Go to Roster
          </Link>
        </div>
      ) : (
        <>
          <section className="grid gap-3">
            <h2 className="text-xl font-black">Playing Tonight</h2>
            {roster.map((player) => {
              const isSelected = selectedIds.includes(player.id);

              return (
                <button
                  key={player.id}
                  onClick={() => togglePlayer(player.id)}
                  className={`flex min-h-16 items-center justify-between rounded-lg px-4 py-3 text-left text-xl font-black shadow-sm active:scale-[0.99] ${
                    isSelected ? "bg-felt text-white" : "bg-white text-night"
                  }`}
                >
                  <span>{player.name}</span>
                  <span className="text-base">{isSelected ? "In" : "Out"}</span>
                </button>
              );
            })}
          </section>

          <button
            onClick={randomizeTeams}
            disabled={selectedPlayers.length < 2}
            className="min-h-16 rounded-lg bg-scoreRed px-5 py-4 text-xl font-black text-white shadow-sm active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-night/30"
          >
            Randomize Red and Black
          </button>

          <section className="grid gap-4">
            <TeamList title="Red Team" players={teams.Red} className="border-scoreRed" />
            <TeamList title="Black Team" players={teams.Black} className="border-scoreBlack" />
          </section>

          {(teams.Red.length > 0 || teams.Black.length > 0) && (
            <Link
              href="/scoreboard"
              className="flex min-h-16 items-center justify-center rounded-lg bg-scoreBlack px-5 py-4 text-xl font-black text-white shadow-sm active:scale-[0.99]"
            >
              Open Scoreboard
            </Link>
          )}
        </>
      )}
    </AppShell>
  );
}

function TeamList({
  title,
  players,
  className,
}: {
  title: string;
  players: Player[];
  className: string;
}) {
  return (
    <div className={`rounded-lg border-l-8 bg-white p-4 shadow-sm ${className}`}>
      <h3 className="mb-3 text-xl font-black">{title}</h3>
      {players.length === 0 ? (
        <p className="font-bold text-night/60">No team yet.</p>
      ) : (
        <ul className="grid gap-2">
          {players.map((player) => (
            <li key={player.id} className="text-lg font-bold">
              {player.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
