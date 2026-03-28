"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

type PendingSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingLabel?: string;
  children: ReactNode;
};

export function PendingSubmitButton({
  className = "",
  disabled,
  pendingLabel = "Loading...",
  children,
  ...props
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = disabled || pending;

  return (
    <button
      {...props}
      className={`${className} ${isDisabled ? "cursor-not-allowed opacity-75" : ""}`.trim()}
      disabled={isDisabled}
      aria-busy={pending}
    >
      {pending ? (
        <span className="inline-flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden="true" />
          {pendingLabel}
        </span>
      ) : (
        children
      )}
    </button>
  );
}