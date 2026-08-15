import type { HTMLAttributes, ReactNode } from "react";

export type BadgeVariant = "live" | "logged" | "motm" | "comp" | "danger" | "default";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children?: ReactNode;
}

/**
 * Le point du badge "live" est le seul élément animé de toute l'app —
 * l'animation reste encapsulée ici et nulle part ailleurs.
 */
export function Badge({
  variant = "default",
  className,
  children,
  ...props
}: BadgeProps) {
  const classes = ["badge"];
  if (variant !== "default") classes.push(`badge-${variant}`);
  if (className) classes.push(className);

  return (
    <span className={classes.join(" ")} {...props}>
      {variant === "live" && <span className="badge-dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
