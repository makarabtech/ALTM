import { Team, Tournament, WorkspaceRepository } from "../demo/model.mjs";
import { demoWorkspace, DEMO_MANAGER } from "../demo/demo.mjs";

// Browser demo adapter. The Vue store consumes plain records, so this module
// can be replaced with async calls to the team's backend API.
let workspace;
let repository;
let storageAvailable = true;

function openWorkspace() {
  if (workspace) return workspace;
  try {
    repository = new WorkspaceRepository(window.localStorage);
    workspace = repository.load() ?? demoWorkspace();
  } catch {
    storageAvailable = false;
    workspace = demoWorkspace();
  }
  return workspace;
}

function save(change) {
  const current = openWorkspace();
  const value = change(current);
  if (storageAvailable) {
    try {
      repository.save(current);
    } catch {
      storageAvailable = false;
    }
  }
  return value;
}

function findTournament(tournaments, id) {
  const tournament = tournaments.find((item) => item.id === id);
  if (!tournament) throw new Error("Competition not found.");
  return tournament;
}

function findTeam(teams, id) {
  const team = teams.get(id);
  if (!team) throw new Error("Team not found.");
  return team;
}

function changeTournament(id, operation) {
  return save(({ tournaments, teams }) => operation(findTournament(tournaments, id), teams));
}

export const atlmApi = {
  load() {
    const { teams, tournaments } = openWorkspace();
    return {
      storageAvailable,
      teams: [...teams.values()].map((team) => ({
        id: team.id,
        name: team.name,
        managed: team.managerId === DEMO_MANAGER,
        players: team.players.map((player) => ({ ...player })),
      })),
      tournaments: tournaments.map((tournament) => ({
        id: tournament.id,
        name: tournament.name,
        format: tournament.format,
        startDate: tournament.startDate,
        generated: tournament.generated,
        status: tournament.status,
        roundCount: tournament.roundCount,
        championId: tournament.championId,
        registeredTeamIds: tournament.registrations.map(({ teamId }) => teamId),
        matches: tournament.matches.map((match) => ({
          ...match,
          status: match.status,
          winnerId: match.winnerId,
          result: match.result ? { ...match.result } : null,
        })),
        standings: tournament.standings(teams).map((row) => ({
          teamId: row.team.id,
          rank: row.rank,
          played: row.played,
          won: row.won,
          drawn: row.drawn,
          lost: row.lost,
          goalsFor: row.goalsFor,
          goalsAgainst: row.goalsAgainst,
          difference: row.difference,
          points: row.points,
        })),
      })),
    };
  },
  createTournament(fields) {
    return save(({ tournaments }) => {
      const tournament = new Tournament(fields);
      tournaments.push(tournament);
      return tournament.id;
    });
  },
  createTeam(name) {
    return save(({ teams }) => {
      const team = new Team({ name, managerId: DEMO_MANAGER });
      if ([...teams.values()].some((existing) => existing.name.toLowerCase() === team.name.toLowerCase())) {
        throw new Error("A team with this name already exists.");
      }
      teams.set(team.id, team);
      return team.id;
    });
  },
  addPlayer(teamId, fields) {
    return save(({ teams }) => findTeam(teams, teamId).addPlayer(fields));
  },
  removePlayer(teamId, playerId) {
    return save(({ teams }) => findTeam(teams, teamId).removePlayer(playerId));
  },
  registerTeam(tournamentId, teamId) {
    return changeTournament(tournamentId, (tournament, teams) => tournament.registerTeam(findTeam(teams, teamId)));
  },
  generateFixtures(tournamentId) {
    return changeTournament(tournamentId, (tournament) => tournament.generateFixtures());
  },
  scheduleMatch(tournamentId, matchId, fields) {
    return changeTournament(tournamentId, (tournament) => tournament.scheduleMatch(matchId, fields.dateTime, fields.venue));
  },
  startMatch(tournamentId, matchId) {
    return changeTournament(tournamentId, (tournament) => tournament.startMatch(matchId));
  },
  saveResult(tournamentId, matchId, fields) {
    return changeTournament(tournamentId, (tournament) => tournament.recordResult(matchId, fields));
  },
  clearResult(tournamentId, matchId) {
    return changeTournament(tournamentId, (tournament) => tournament.recordResult(matchId, null));
  },
};
