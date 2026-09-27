/** The replay clock runs in turns; this is the one being played. */
export const currentTurn = (time: number, lastTurn: number) =>
  Math.min(lastTurn, Math.max(1, Math.ceil(time)));

export const ordinal = (placement: number) => `${placement}º`;

export const money = (value: number) => value.toLocaleString("pt-BR");
