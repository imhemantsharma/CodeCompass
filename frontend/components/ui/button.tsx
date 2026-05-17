import * as React from "react";
import { clsx } from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline";
  size?: "sm" | "md" | "lg";
}

export function Button({ className, variant = "default", size = "md", ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none",
        variant === "outline"
          ? "border border-zinc-200 bg-transparent text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
          : "bg-zinc-900 text-white hover:bg-zinc-700",
        size === "sm" ? "h-8 px-3 text-xs" : size === "lg" ? "h-11 px-6 text-base" : "h-10 px-4 text-sm",
        className
      )}
      {...props}
    />
  );
}
