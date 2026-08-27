import React from "react";
import { cn } from "@/lib/utils";

interface NeoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const NeoButton = React.forwardRef<HTMLButtonElement, NeoButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-bold border-2 border-black transition-all",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          // Variants
          {
            "bg-neo-yellow shadow-neo hover:shadow-neo-hover active:shadow-neo-active hover:-translate-y-1": variant === "primary",
            "bg-neo-blue shadow-neo hover:shadow-neo-hover active:shadow-neo-active hover:-translate-y-1": variant === "secondary",
            "bg-red-400 text-white shadow-neo hover:shadow-neo-hover active:shadow-neo-active hover:-translate-y-1": variant === "danger",
            "bg-transparent border-transparent hover:bg-gray-100": variant === "ghost",
          },
          // Sizes
          {
            "px-3 py-1.5 text-sm": size === "sm",
            "px-6 py-2 text-base border-4": size === "md",
            "px-8 py-4 text-xl border-4": size === "lg",
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
NeoButton.displayName = "NeoButton";
