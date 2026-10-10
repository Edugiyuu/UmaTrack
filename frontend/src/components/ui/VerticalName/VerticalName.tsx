import type { CSSProperties } from "react";
import "./VerticalName.css";

/**
 * Her name running up the left edge of the v2 screens, read from the bottom (Figma,
 * docs/tasks/27: Inter Black 87, 20% spacing, white, under her art). Long names get a
 * smaller size so they still fit the height.
 */
const VerticalName = ({ name }: { name: string }) => (
  <span
    className="VerticalName"
    data-screen="name"
    aria-hidden="true"
    style={{ "--name-chars": Math.max(name.length, 9) } as CSSProperties}
  >
    {name}
  </span>
);

export default VerticalName;
