import type { CSSProperties } from "react";
import { useSegmentSlider } from "../../animations/useSegmentSlider";
import "./CatalogPage.css";

export interface SegmentedOption<T extends string> {
  id: T;
  label: string;
}

interface SegmentedProps<T extends string> {
  label: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
}

/**
 * The pill switch of the catalogue pages: equal options on a sunken track, with a white
 * thumb that GSAP slides to the one picked.
 */
const Segmented = <T extends string>({ label, options, value, onChange }: SegmentedProps<T>) => {
  const thumbRef = useSegmentSlider<HTMLSpanElement>(options.findIndex(({ id }) => id === value));

  return (
    <div className="Segmented" data-screen="item">
      <span className="Segmented__label">{label}</span>
      <div
        className="Segmented__track"
        role="radiogroup"
        aria-label={label}
        style={{ "--segments": options.length } as CSSProperties}
      >
        <span ref={thumbRef} className="Segmented__thumb" aria-hidden="true" />
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={option.id === value}
            className={option.id === value ? "is-active" : undefined}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Segmented;
