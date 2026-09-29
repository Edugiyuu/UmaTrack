import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

const matches = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(QUERY).matches
    : false;

/** Whether the player asked the system for less motion. Follows the setting live. */
export const usePrefersReducedMotion = () => {
  const [reduced, setReduced] = useState(matches);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const query = window.matchMedia(QUERY);
    const onChange = () => setReduced(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
};
