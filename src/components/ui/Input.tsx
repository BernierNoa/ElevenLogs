import type { InputHTMLAttributes } from "react";
import { useId } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
}

export function Input({ label, helper, id, className, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={inputId} className="champ-label">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={["champ-input", className].filter(Boolean).join(" ")}
        {...props}
      />
      {helper && <p className="champ-aide">{helper}</p>}
    </div>
  );
}
