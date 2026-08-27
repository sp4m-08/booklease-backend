import React from "react";
import { cn } from "@/lib/utils";

interface NeoInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const NeoInput = React.forwardRef<HTMLInputElement, NeoInputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full">
        <input
          ref={ref}
          className={cn(
            "flex w-full border-4 border-black bg-white px-4 py-3 text-base font-medium",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus-visible:ring-red-500",
            className
          )}
          {...props}
        />
        {error && <span className="text-sm font-bold text-red-500">{error}</span>}
      </div>
    );
  }
);
NeoInput.displayName = "NeoInput";
