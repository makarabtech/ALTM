const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });

export function dateLabel(value) {
  return date.format(new Date(`${value}T12:00`));
}

export function scheduleLabel(value) {
  return value ? `${dateLabel(value.slice(0, 10))} · ${time.format(new Date(value))}` : "Date to be set";
}

export function localDate() {
  const now = new Date();
  return [now.getFullYear(), now.getMonth() + 1, now.getDate()].map((part) => String(part).padStart(2, "0")).join("-");
}

export function roundLabel(tournament, round) {
  if (tournament.format === "league") return `Matchweek ${round}`;
  return ["Final", "Semifinals", "Quarterfinals"][tournament.roundCount - round] ?? "Round of 16";
}

export function statusLabel(status) {
  if (status === "awaiting") return "Awaiting teams";
  if (status === "bye") return "Bye · advances";
  return status;
}
