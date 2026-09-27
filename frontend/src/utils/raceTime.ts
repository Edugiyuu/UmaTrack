/** "12,47 turnos": the race engine times every finish in turns. */
export const formatTurns = (turns: number) =>
  `${turns.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} turnos`;

/** Races run before the turn engine were timed in seconds. */
const formatSeconds = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds - minutes * 60;
  return minutes > 0 ? `${minutes}:${rest.toFixed(2).padStart(5, "0")}` : `${rest.toFixed(2)}s`;
};

export const formatRaceTime = (value: number, unit: "seconds" | "turns" = "turns") =>
  unit === "seconds" ? formatSeconds(value) : formatTurns(value);
