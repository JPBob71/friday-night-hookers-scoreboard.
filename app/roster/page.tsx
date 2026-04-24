"use client";

import { FormEvent, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { createPlayer, loadRoster, Player, saveRoster } from "@/lib/gameStorage";

export default function RosterPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [name, setName] = useState("");
  const [hasLoadedRoster, setHasLoadedRoster] = useState(false);

  useEffect(() => {
    setPlayers(loadRoster());
    setHasLoadedRoster(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedRoster) return;
    saveRoster(players);
  }, [hasLoadedRoster, players]);

  function addPlayer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;

    setPlayers((current) => [...current, createPlayer(cleanName)]);
    setName("");
  }

  function removePlayer(playerId: string) {
    setPlayers((current) => current.filter((player) => player.id !== playerId));
  }

  return (
    <AppShell title="Roster">
      <form onSubmit={addPlayer} className="grid gap-3">
        <label className="grid gap-2 text-lg font-black" htmlFor="player-name">
          Player name
          <input
            id="player-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="min-h-16 rounded-lg border-2 border-night/20 bg-white px-4 text-xl font-bold outline-none focus:border-felt"
            placeholder="Add a player"
          />
        </label>
        <button className="min-h-16 rounded-lg bg-felt px-5 py-4 text-xl font-black text-white shadow-sm active:scale-[0.99]">
          Add Player
        </button>
      </form>

      <section className="grid gap-3">
        <h2 className="text-xl font-black">{players.length} Players</h2>
        {players.length === 0 ? (
          <p className="rounded-lg bg-white p-4 text-lg font-bold text-night/70">No players yet.</p>
        ) : (
          <ul className="grid gap-3">
            {players.map((player) => (
              <li
                key={player.id}
                className="flex min-h-16 items-center justify-between gap-3 rounded-lg bg-white p-4 shadow-sm"
              >
                <span className="text-xl font-black">{player.name}</span>
                <button
                  onClick={() => removePlayer(player.id)}
                  className="rounded-lg bg-night px-4 py-3 text-base font-black text-white active:scale-[0.99]"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
