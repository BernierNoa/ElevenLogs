import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant =
  | "primaire"
  | "secondaire"
  | "discret"
  | "destructif"
  | "dore";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "default" | "sm";
  iconOnly?: boolean;
  isLoading?: boolean;
  children?: ReactNode;
}

function buildButtonClass(
  variant: ButtonVariant,
  size: "default" | "sm",
  iconOnly: boolean,
  className?: string,
) {
  const classes = ["btn", `btn-${variant}`];
  if (size === "sm") classes.push("btn-sm");
  if (iconOnly) classes.push("btn-icone");
  if (className) classes.push(className);
  return classes.join(" ");
}

export function Button({
  variant = "primaire",
  size = "default",
  iconOnly = false,
  isLoading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={buildButtonClass(variant, size, iconOnly, className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading && <span className="btn-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
