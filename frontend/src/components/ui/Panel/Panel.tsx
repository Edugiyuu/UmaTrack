import { useId, type ReactNode } from "react";
import "./Panel.css";

export interface PanelProps {
  /** Rendered as a tilted band across the top, the way the horse cards name their girl. */
  title?: ReactNode;
  /** Sits opposite the title — a control, a count, a status. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * A titled surface. Panels carry the page's content blocks; the band across the top
 * is the game's tilted label strip, so a panel reads as part of the same object.
 */
const Panel = ({ title, action, children, className }: PanelProps) => {
  const headingId = useId();

  return (
    <section
      className={["Panel", className ?? ""].filter(Boolean).join(" ")}
      aria-labelledby={title ? headingId : undefined}
    >
      {title && (
        <header className="Panel__header">
          <h2 className="Panel__title" id={headingId}>
            {title}
          </h2>
          {action && <div className="Panel__action">{action}</div>}
        </header>
      )}
      <div className="Panel__body">{children}</div>
    </section>
  );
};

export default Panel;
