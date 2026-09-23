import type { ReactNode } from "react";
import "./Pill.css";

export type PillTone = "neutral" | "accent" | "uphill" | "downhill" | "curve" | "danger";

export interface PillProps {
  children: ReactNode;
  tone?: PillTone;
  /** Fills the pill with its tone instead of outlining it. */
  solid?: boolean;
}

/** A small flat label: terrain, surface, running style, race phase. */
const Pill = ({ children, tone = "neutral", solid = false }: PillProps) => (
  <span
    className={["Pill", `Pill--${tone}`, solid ? "Pill--solid" : ""].filter(Boolean).join(" ")}
  >
    {children}
  </span>
);

export default Pill;
