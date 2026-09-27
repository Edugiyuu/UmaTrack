import { forwardRef, type ButtonHTMLAttributes } from "react";
import "./Button.css";

export type ButtonVariant = "primary" | "ink" | "ghost";
export type ButtonSize = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretches the button to fill the space it is given. */
  block?: boolean;
}

/**
 * The game's button: a pill, the way the home Start button and the header login are.
 * `ink` is that near-black call to action, `primary` the turf green the race screens
 * use for "go", `ghost` the quiet option beside them.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", block = false, className, type, ...rest }, ref) => (
    <button
      ref={ref}
      // A button inside a form defaults to submitting it, which is never what these want.
      type={type ?? "button"}
      className={[
        "Button",
        `Button--${variant}`,
        `Button--${size}`,
        block ? "Button--block" : "",
        className ?? ""
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  )
);

Button.displayName = "Button";

export default Button;
