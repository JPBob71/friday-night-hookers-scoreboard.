import { GamePlayer, SavedGame, TeamName } from "@/lib/gameStorage";

export type MatchupRow = Record<TeamName, GamePlayer | null>;

export function getTeamTotal(players: GamePlayer[], team: TeamName) {
  return players
    .filter((player) => player.team === team)
    .reduce((total, player) => total + player.total, 0);
}

export function getPointsNeededToTie(game: SavedGame) {
  const { Red, Black } = game.roundTotals;
  if (Red === Black) return "Round is tied";
  return Red < Black ? `Red needs ${Black - Red}` : `Black needs ${Red - Black}`;
}

export function getClinchedScrew(game: SavedGame): TeamName | null {
  const redTotal = game.roundTotals.Red;
  const blackTotal = game.roundTotals.Black;
  if (redTotal === blackTotal || game.winner) return null;

  const leadingTeam: TeamName = redTotal > blackTotal ? "Red" : "Black";
  const trailingTeam: TeamName = leadingTeam === "Red" ? "Black" : "Red";
  const trailingTeamRemainingMax = getRemainingUnthrownCount(game, trailingTeam) * 300;

  return game.roundTotals[trailingTeam] + trailingTeamRemainingMax < game.roundTotals[leadingTeam]
    ? leadingTeam
    : null;
}

export function buildMatchupRows(game: SavedGame | null): MatchupRow[] {
  if (!game) return [];

  const redPlayers = getPlayersInThrowOrder(game, "Red");
  const blackPlayers = getPlayersInThrowOrder(game, "Black");
  const rowCount = Math.max(redPlayers.length, blackPlayers.length);

  return Array.from({ length: rowCount }, (_, index) => ({
    Red: redPlayers[index] ?? null,
    Black: blackPlayers[index] ?? null,
  }));
}

function getPlayersInThrowOrder(game: SavedGame, team: TeamName) {
  return game.throwOrder
    .map((playerId) => game.players.find((player) => player.id === playerId) ?? null)
    .filter((player): player is GamePlayer => player?.team === team);
}

function getRemainingUnthrownCount(game: SavedGame, team: TeamName) {
  return game.throwOrder.slice(game.currentThrowIndex).filter((playerId) => {
    const player = game.players.find((candidate) => candidate.id === playerId);
    return player?.team === team;
  }).length;
}
