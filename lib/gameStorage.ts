export type Player = {
  id: string;
  name: string;
};

export type TeamName = "Red" | "Black";

export type GamePlayer = Player & {
  team: TeamName;
  total: number;
  total300s: number;
  tickStreak: number;
};

export type SavedGame = {
  players: GamePlayer[];
  throwOrder: string[];
  currentThrowIndex: number;
  currentRound: number;
  teamSpankyIndexes: Record<TeamName, number>;
  redWinningScrews: number;
  blackWinningScrews: number;
  tieRounds: number;
  roundTotals: Record<TeamName, number>;
  winner: TeamName | null;
  history: GameSnapshot[];
};

export type GameSnapshot = Omit<SavedGame, "history">;

const rosterKey = "fnh-roster";
const gameKey = "fnh-current-game";

const canUseStorage = () => typeof window !== "undefined" && "localStorage" in window;

export function loadRoster(): Player[] {
  if (!canUseStorage()) return [];

  try {
    const saved = window.localStorage.getItem(rosterKey);
    return saved ? (JSON.parse(saved) as Player[]) : [];
  } catch {
    return [];
  }
}

export function saveRoster(players: Player[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(rosterKey, JSON.stringify(players));
}

export function loadGame(): SavedGame | null {
  if (!canUseStorage()) return null;

  try {
    const saved = window.localStorage.getItem(gameKey);
    return saved ? normalizeGame(JSON.parse(saved) as Partial<SavedGame>) : null;
  } catch {
    return null;
  }
}

export function saveGame(game: SavedGame) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(gameKey, JSON.stringify(game));
}

export function createPlayer(name: string): Player {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
  };
}

export function createGame(players: GamePlayer[]): SavedGame {
  const teamSpankyIndexes = { Red: 0, Black: 0 };

  return {
    players,
    throwOrder: buildThrowOrder(players, teamSpankyIndexes),
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
}

export function getGameSnapshot(game: SavedGame): GameSnapshot {
  return {
    players: game.players.map((player) => ({ ...player })),
    throwOrder: [...game.throwOrder],
    currentThrowIndex: game.currentThrowIndex,
    currentRound: game.currentRound,
    teamSpankyIndexes: { ...game.teamSpankyIndexes },
    redWinningScrews: game.redWinningScrews,
    blackWinningScrews: game.blackWinningScrews,
    tieRounds: game.tieRounds,
    roundTotals: { ...game.roundTotals },
    winner: game.winner,
  };
}

export function restoreGameSnapshot(snapshot: GameSnapshot, history: GameSnapshot[]): SavedGame {
  return {
    ...snapshot,
    players: snapshot.players.map((player) => ({ ...player })),
    throwOrder: [...snapshot.throwOrder],
    teamSpankyIndexes: { ...snapshot.teamSpankyIndexes },
    roundTotals: { ...snapshot.roundTotals },
    history,
  };
}

export function buildThrowOrder(
  players: GamePlayer[],
  spankyIndexes: Record<TeamName, number>,
) {
  const redPlayers = rotateTeamPlayers(
    players.filter((player) => player.team === "Red"),
    spankyIndexes.Red,
  );
  const blackPlayers = rotateTeamPlayers(
    players.filter((player) => player.team === "Black"),
    spankyIndexes.Black,
  );
  const longestTeam = Math.max(redPlayers.length, blackPlayers.length);
  const order: string[] = [];

  for (let index = 0; index < longestTeam; index += 1) {
    if (redPlayers[index]) order.push(redPlayers[index].id);
    if (blackPlayers[index]) order.push(blackPlayers[index].id);
  }

  return order;
}

export function getNextSpankyIndexes(
  players: GamePlayer[],
  spankyIndexes: Record<TeamName, number>,
) {
  return {
    Red: getNextTeamSpankyIndex(players, "Red", spankyIndexes.Red),
    Black: getNextTeamSpankyIndex(players, "Black", spankyIndexes.Black),
  };
}

function rotateTeamPlayers(players: GamePlayer[], startIndex: number) {
  if (players.length === 0) return players;
  const normalizedIndex = startIndex % players.length;
  return [...players.slice(normalizedIndex), ...players.slice(0, normalizedIndex)];
}

function getNextTeamSpankyIndex(players: GamePlayer[], team: TeamName, currentIndex: number) {
  const teamSize = players.filter((player) => player.team === team).length;
  if (teamSize === 0) return 0;
  return (currentIndex + 1) % teamSize;
}

function normalizeGame(game: Partial<SavedGame>): SavedGame {
  const players = (game.players ?? []).map((player) => ({
    ...player,
    total: player.total ?? 0,
    total300s: player.total300s ?? 0,
    tickStreak: player.tickStreak ?? 0,
  })) as GamePlayer[];

  return {
    players,
    throwOrder: game.throwOrder?.length
      ? game.throwOrder
      : buildThrowOrder(players, game.teamSpankyIndexes ?? { Red: 0, Black: 0 }),
    currentThrowIndex: game.currentThrowIndex ?? 0,
    currentRound: game.currentRound ?? 1,
    teamSpankyIndexes: game.teamSpankyIndexes ?? { Red: 0, Black: 0 },
    redWinningScrews: game.redWinningScrews ?? 0,
    blackWinningScrews: game.blackWinningScrews ?? 0,
    tieRounds: game.tieRounds ?? 0,
    roundTotals: game.roundTotals ?? { Red: 0, Black: 0 },
    winner: game.winner ?? null,
    history: game.history ?? [],
  };
}
