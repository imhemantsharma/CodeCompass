import * as React from "react";
import { clsx } from "clsx";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variant === "outline"
          ? "border border-zinc-200 bg-transparent text-zinc-600"
          : "bg-zinc-900 text-white border border-zinc-900",
        className
      )}
      {...props}
    />
  );
}
