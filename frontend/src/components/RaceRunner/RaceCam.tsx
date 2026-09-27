import { memo, type CSSProperties } from "react";
import { horseFolder, withImageFallback } from "../../utils/horseImage";

export interface RaceCamProps {
  /** "LIVE", "1º LUGAR". */
  title: string;
  tone: "live" | "leader";
  name: string;
  /** Line under the portrait: placement, gap, how long she has led. */
  caption: string;
  color: string;
  /**
   * Only the player's girl has art; the generated rivals do not, so they get their
   * colours and initial instead of a broken image.
   */
  hasArt: boolean;
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/** A broadcast camera card, with the hard offset shadow of the Figma art. */
const RaceCam = ({ title, tone, name, caption, color, hasArt }: RaceCamProps) => (
  <figure className={`RaceCam RaceCam--${tone}`} style={{ "--runner-color": color } as CSSProperties}>
    <header className="RaceCam__head">
      <span className="RaceCam__dot" aria-hidden="true" />
      {title}
    </header>
    <div className="RaceCam__view">
      {hasArt ? (
        <img
          key={name}
          {...withImageFallback(name, [`${horseFolder(name)}1.png`, "Profile1.gif"])}
          alt=""
          className="RaceCam__art"
        />
      ) : (
        <span className="RaceCam__silks" aria-hidden="true">
          {initials(name)}
        </span>
      )}
    </div>
    <figcaption className="RaceCam__caption">
      <strong>{name}</strong>
      <span>{caption}</span>
    </figcaption>
  </figure>
);

export default memo(RaceCam);
