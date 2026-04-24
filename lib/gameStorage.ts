export type Player = {
  id: string;
  name: string;
};

export type TeamName = "Red" | "Black";

export type GamePlayer = Player & {
  team: TeamName;
  total: number;
};

export type SavedGame = {
  players: GamePlayer[];
};

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
    return saved ? (JSON.parse(saved) as SavedGame) : null;
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
