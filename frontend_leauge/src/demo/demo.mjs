import { Team, Tournament } from "./model.mjs";

export const DEMO_MANAGER = "demo-manager";

export function demoWorkspace() {
  const clubs = [
    ["falcons", "Phnom Penh Falcons", [["Sovann Dara", 9], ["Chenda Vann", 1], ["Vicheka Sok", 8]]],
    ["angkor", "Angkor City", [["Rithy Chan", 10], ["Kosal Heng", 4]]],
    ["mekong", "Mekong United", [["Samnang Keo", 7], ["Visal Tep", 5]]],
    ["tonle", "Tonle Rovers", [["Vannak Lim", 11], ["Mony Nhem", 6]]],
    ["bayon", "Bayon Athletic", [["Serey Chea", 3], ["Ratanak Nget", 12]]],
    ["bassac", "Bassac FC", [["Piseth Sou", 2], ["Narin Chum", 14]]]
  ];
  const teams = new Map(clubs.map(([id, name, roster]) => [id, new Team({
    id, name, managerId: DEMO_MANAGER,
    players: roster.map(([playerName, number]) => ({ id: `${id}-${number}`, name: playerName, number }))
  })]));
  const league = new Tournament({ id: "campus-league", name: "Campus Football League", format: "league", startDate: "2026-11-14" });
  const cup = new Tournament({ id: "spring-cup", name: "Spring Cup", format: "knockout", startDate: "2027-02-06" });
  for (const tournament of [league, cup]) {
    for (const team of teams.values()) tournament.registerTeam(team, "2026-11-10T12:00:00.000Z");
    tournament.generateFixtures();
  }
  const scores = [[3, 1], [0, 2], [2, 2], [1, 1], [0, 2], [3, 0]];
  league.matches.forEach((match, index) => {
    const day = new Date(Date.UTC(2026, 10, 14 + (match.round - 1) * 7)).toISOString().slice(0, 10);
    league.scheduleMatch(match.id, `${day}T${14 + (index % 3)}:00`, index % 2 ? "Pitch 2" : "Main Pitch");
    if (index < scores.length) league.recordResult(match.id, { home: scores[index][0], away: scores[index][1] });
  });
  return { teams, tournaments: [league, cup], activeId: league.id };
}
