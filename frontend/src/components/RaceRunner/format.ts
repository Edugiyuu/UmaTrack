/** The replay clock runs in turns; show the one being played. */
export const formatClock = (time: number, lastTurn: number) =>
  `Turno ${Math.min(lastTurn, Math.max(1, Math.ceil(time)))}`;

export const ordinal = (placement: number) => `${placement}º`;

export const money = (value: number) => value.toLocaleString("pt-BR");
