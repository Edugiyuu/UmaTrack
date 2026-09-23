/** Race clock: `1:04.35` once past a minute, `52.10s` before it. */
export const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds - minutes * 60;
  return minutes > 0 ? `${minutes}:${rest.toFixed(2).padStart(5, "0")}` : `${rest.toFixed(2)}s`;
};

export const ordinal = (placement: number) => `${placement}º`;

export const money = (value: number) => value.toLocaleString("pt-BR");
