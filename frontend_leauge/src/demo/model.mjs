const FORMATS = ["league", "knockout"];
const MAX_TEAMS = 16;
const STORAGE_KEY = "atlm-vue-demo-v1";

function nameFor(value, label, maximum) {
  const name = String(value ?? "").trim().replace(/\s+/g, " ");
  if (!name || name.length > maximum) throw new Error(`${label} must contain 1–${maximum} characters.`);
  return name;
}

function dateIsValid(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export class Player {
  constructor({ id = crypto.randomUUID(), name, number }) {
    if (!Number.isInteger(number) || number < 1 || number > 99) {
      throw new Error("Use a jersey number from 1 to 99.");
    }
    this.id = id;
    this.name = nameFor(name, "Player name", 40);
    this.number = number;
    Object.freeze(this);
  }
}

export class Team {
  #players = [];

  constructor({ id = crypto.randomUUID(), name, managerId, players = [] }) {
    this.id = id;
    this.name = nameFor(name, "Team name", 36);
    this.managerId = managerId;
    players.forEach((player) => this.addPlayer(player));
  }

  get players() {
    return [...this.#players].sort((a, b) => a.number - b.number);
  }

  addPlayer(details) {
    const player = new Player(details);
    if (this.#players.some(({ number }) => number === player.number)) {
      throw new Error("That jersey number is already assigned to this team.");
    }
    this.#players.push(player);
  }

  removePlayer(playerId) {
    this.#players = this.#players.filter(({ id }) => id !== playerId);
  }

  toJSON() {
    return { id: this.id, name: this.name, managerId: this.managerId, players: this.players };
  }
}

export class Registration {
  constructor({ tournamentId, teamId, registeredAt = new Date().toISOString() }) {
    this.tournamentId = tournamentId;
    this.teamId = teamId;
    this.registeredAt = registeredAt;
    Object.freeze(this);
  }
}

export class Result {
  constructor(home, away, tiebreakWinnerId = null) {
    if (![home, away].every((goals) => Number.isInteger(goals) && goals >= 0 && goals <= 99)) {
      throw new Error("Enter a whole-number score from 0 to 99 for both teams.");
    }
    this.home = home;
    this.away = away;
    this.tiebreakWinnerId = tiebreakWinnerId;
    Object.freeze(this);
  }
}

export class Match {
  constructor({ id, round, position, homeId, awayId, bye, dateTime = "", venue = "", started = false, result = null }) {
    Object.assign(this, { id, round, position, homeId, awayId, bye, dateTime, venue, started, result });
    Object.freeze(this);
  }

  get status() {
    if (this.bye) return "bye";
    if (this.result) return "completed";
    if (!this.homeId || !this.awayId) return "awaiting";
    return this.started ? "in progress" : "scheduled";
  }

  get winnerId() {
    if (this.bye) return this.homeId ?? this.awayId;
    if (!this.result) return null;
    if (this.result.home > this.result.away) return this.homeId;
    if (this.result.away > this.result.home) return this.awayId;
    return this.result.tiebreakWinnerId;
  }
}

export class Standing {
  constructor(team) {
    this.team = team;
    this.played = 0;
    this.won = 0;
    this.drawn = 0;
    this.lost = 0;
    this.goalsFor = 0;
    this.goalsAgainst = 0;
    this.rank = 0;
  }

  include(goalsFor, goalsAgainst) {
    this.played += 1;
    this.goalsFor += goalsFor;
    this.goalsAgainst += goalsAgainst;
    if (goalsFor > goalsAgainst) this.won += 1;
    else if (goalsFor === goalsAgainst) this.drawn += 1;
    else this.lost += 1;
  }

  get points() {
    return this.won * 3 + this.drawn;
  }

  get difference() {
    return this.goalsFor - this.goalsAgainst;
  }
}

function roundRobin(teamIds) {
  const rotation = [...teamIds];
  if (rotation.length % 2) rotation.unshift(null);
  const fixtures = [];
  const half = rotation.length / 2;
  for (let round = 1; round < rotation.length; round += 1) {
    for (let index = 0; index < half; index += 1) {
      const first = rotation[index];
      const second = rotation[rotation.length - 1 - index];
      if (!first || !second) continue;
      const [homeId, awayId] = index === 0 && round % 2 === 0 ? [second, first] : [first, second];
      fixtures.push({ id: `r${round}-m${index + 1}`, round, position: index + 1, homeId, awayId });
    }
    rotation.splice(1, 0, rotation.pop());
  }
  return fixtures;
}

function knockout(teamIds) {
  let seeds = [1, 2];
  while (seeds.length < teamIds.length) {
    const sum = seeds.length * 2 + 1;
    seeds = seeds.flatMap((seed) => [seed, sum - seed]);
  }
  const fixtures = [];
  for (let count = seeds.length / 2, round = 1; count >= 1; count /= 2, round += 1) {
    for (let position = 1; position <= count; position += 1) {
      const id = `r${round}-m${position}`;
      if (round === 1) {
        const homeId = teamIds[seeds[2 * position - 2] - 1] ?? null;
        const awayId = teamIds[seeds[2 * position - 1] - 1] ?? null;
        fixtures.push({ id, round, position, homeId, awayId, bye: !homeId || !awayId });
      } else {
        const homeSource = `r${round - 1}-m${2 * position - 1}`;
        const awaySource = `r${round - 1}-m${2 * position}`;
        fixtures.push({ id, round, position, homeSource, awaySource });
      }
    }
  }
  return fixtures;
}

function compareStandings(a, b) {
  return b.points - a.points || b.difference - a.difference || b.goalsFor - a.goalsFor;
}

export class Tournament {
  #registrations = [];
  #fixtures = [];
  #details = new Map();
  #results = new Map();

  constructor({ id = crypto.randomUUID(), name, format, startDate }) {
    if (!FORMATS.includes(format)) throw new Error("Choose a competition format.");
    if (!dateIsValid(startDate)) throw new Error("Choose a valid start date.");
    this.id = id;
    this.name = nameFor(name, "Competition name", 56);
    this.format = format;
    this.startDate = startDate;
  }

  get registrations() {
    return [...this.#registrations];
  }

  get generated() {
    return this.#fixtures.length > 0;
  }

  get roundCount() {
    return this.#fixtures.at(-1)?.round ?? 0;
  }

  get matches() {
    const resolved = new Map();
    for (const fixture of this.#fixtures) {
      const homeId = fixture.homeSource ? resolved.get(fixture.homeSource).winnerId : fixture.homeId;
      const awayId = fixture.awaySource ? resolved.get(fixture.awaySource).winnerId : fixture.awayId;
      resolved.set(fixture.id, new Match({
        ...fixture,
        homeId,
        awayId,
        bye: Boolean(fixture.bye),
        ...this.#details.get(fixture.id),
        result: this.#results.get(fixture.id) ?? null
      }));
    }
    return [...resolved.values()];
  }

  get status() {
    if (!this.generated) return "registration open";
    const matches = this.matches;
    if (matches.every(({ status }) => status === "completed" || status === "bye")) return "completed";
    return matches.some(({ status }) => status === "completed" || status === "in progress") ? "in progress" : "fixtures ready";
  }

  get championId() {
    return this.format === "knockout" ? this.matches.at(-1)?.winnerId ?? null : null;
  }

  registerTeam(team, registeredAt) {
    if (!(team instanceof Team)) throw new Error("Choose an existing team.");
    if (this.generated) throw new Error("Registration closed when the fixtures were generated.");
    if (this.#registrations.some(({ teamId }) => teamId === team.id)) throw new Error("This team is already registered.");
    if (this.#registrations.length === MAX_TEAMS) throw new Error(`This prototype supports up to ${MAX_TEAMS} teams per competition.`);
    this.#registrations.push(new Registration({ tournamentId: this.id, teamId: team.id, registeredAt }));
  }

  generateFixtures() {
    if (this.generated) throw new Error("Fixtures already exist for this competition.");
    const ids = this.#registrations.map(({ teamId }) => teamId);
    if (ids.length < 2) throw new Error("Register at least two teams before generating fixtures.");
    this.#fixtures = this.format === "league" ? roundRobin(ids) : knockout(ids);
  }

  scheduleMatch(matchId, dateTime, venue) {
    const match = this.matches.find(({ id }) => id === matchId);
    if (!match || match.bye || match.status === "completed") throw new Error("This match cannot be rescheduled.");
    if (!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d$/.test(dateTime) || !dateIsValid(dateTime.slice(0, 10))) {
      throw new Error("Choose a valid match date and time.");
    }
    if (dateTime.slice(0, 10) < this.startDate) throw new Error("A fixture cannot take place before the competition start date.");
    this.#details.set(matchId, { ...this.#details.get(matchId), dateTime, venue: nameFor(venue, "Venue", 48) });
  }

  startMatch(matchId) {
    const match = this.matches.find(({ id }) => id === matchId);
    if (match?.status !== "scheduled") throw new Error("Only a scheduled match with two teams can start.");
    this.#details.set(matchId, { ...this.#details.get(matchId), started: true });
  }

  recordResult(matchId, scores) {
    const match = this.matches.find(({ id }) => id === matchId);
    if (!match || match.bye || !match.homeId || !match.awayId) throw new Error("Both teams must be known before entering a score.");
    let result = null;
    if (scores) {
      const tiedKnockout = this.format === "knockout" && scores.home === scores.away;
      const winner = tiedKnockout ? scores.tiebreakWinnerId : null;
      result = new Result(scores.home, scores.away, winner);
      if (tiedKnockout && ![match.homeId, match.awayId].includes(winner)) {
        throw new Error("Select the team that won the tiebreak.");
      }
    }
    const revised = new Match({ ...match, result });
    const next = this.#fixtures.find(({ homeSource, awaySource }) => [homeSource, awaySource].includes(matchId));
    if (next && match.winnerId !== revised.winnerId && (this.#results.has(next.id) || this.#details.get(next.id)?.started)) {
      throw new Error("A later match already started or has a score. Its participants must stay the same.");
    }
    if (result) this.#results.set(matchId, result);
    else {
      this.#results.delete(matchId);
      if (match.started) this.#details.set(matchId, { ...this.#details.get(matchId), started: false });
    }
  }

  standings(teams) {
    if (this.format !== "league") return [];
    const rows = new Map(this.#registrations.map(({ teamId }) => [teamId, new Standing(teams.get(teamId))]));
    for (const { homeId, awayId, result } of this.matches) {
      if (!result) continue;
      rows.get(homeId).include(result.home, result.away);
      rows.get(awayId).include(result.away, result.home);
    }
    const ranked = [...rows.values()].sort((a, b) => compareStandings(a, b) || a.team.name.localeCompare(b.team.name));
    ranked.forEach((row, index) => {
      row.rank = index && compareStandings(row, ranked[index - 1]) === 0 ? ranked[index - 1].rank : index + 1;
    });
    return ranked;
  }

  toJSON() {
    return {
      id: this.id, name: this.name, format: this.format, startDate: this.startDate,
      registrations: this.registrations, generated: this.generated,
      details: [...this.#details], results: [...this.#results]
    };
  }

  static restore(saved, teams) {
    const tournament = new Tournament(saved);
    for (const { teamId, registeredAt } of saved.registrations) tournament.registerTeam(teams.get(teamId), registeredAt);
    if (saved.generated) tournament.generateFixtures();
    const details = new Map(saved.details);
    const results = new Map(saved.results);
    // Replay each round in order so earlier winners populate later fixture slots.
    for (const { id } of tournament.matches) {
      const info = details.get(id);
      if (info?.dateTime) tournament.scheduleMatch(id, info.dateTime, info.venue);
      if (info?.started) tournament.startMatch(id);
      if (results.has(id)) tournament.recordResult(id, results.get(id));
    }
    return tournament;
  }
}

export class WorkspaceRepository {
  constructor(storage) {
    this.storage = storage;
  }

  load() {
    const raw = this.storage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.version !== 1 || !Array.isArray(data.teams) || !data.tournaments?.length) throw new Error("Unknown workspace format.");
    const teams = new Map(data.teams.map((record) => [record.id, new Team(record)]));
    const tournaments = data.tournaments.map((record) => Tournament.restore(record, teams));
    return { teams, tournaments, activeId: data.activeId };
  }

  save({ teams, tournaments, activeId }) {
    this.storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, teams: [...teams.values()], tournaments, activeId }));
  }
}
