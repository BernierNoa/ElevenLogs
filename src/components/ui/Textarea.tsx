import type { TextareaHTMLAttributes } from "react";
import { useId } from "react";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helper?: string;
}

export function Textarea({
  label,
  helper,
  id,
  className,
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={textareaId} className="champ-label">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={["champ-area", className].filter(Boolean).join(" ")}
        {...props}
      />
      {helper && <p className="champ-aide">{helper}</p>}
    </div>
  );
}
