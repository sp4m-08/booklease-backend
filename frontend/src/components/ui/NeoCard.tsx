import React from "react";
import { cn } from "@/lib/utils";

interface NeoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: "white" | "purple" | "blue" | "peach" | "green" | "yellow";
}

export const NeoCard = React.forwardRef<HTMLDivElement, NeoCardProps>(
  ({ className, color = "white", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "border-4 border-black p-6 shadow-neo overflow-hidden relative",
          {
            "bg-white": color === "white",
            "bg-neo-purple": color === "purple",
            "bg-neo-blue": color === "blue",
            "bg-neo-peach": color === "peach",
            "bg-neo-green": color === "green",
            "bg-neo-yellow": color === "yellow",
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
NeoCard.displayName = "NeoCard";
