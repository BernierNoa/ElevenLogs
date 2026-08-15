import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  logged?: boolean;
  children?: ReactNode;
}

export function Card({ logged = false, className, children, ...props }: CardProps) {
  const classes = ["carte"];
  if (logged) classes.push("carte-loggee");
  if (className) classes.push(className);

  return (
    <div className={classes.join(" ")} {...props}>
      {children}
    </div>
  );
}
