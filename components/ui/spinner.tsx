import * as React from "react";

import { cn } from "@/lib/utils";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  label?: string;
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-4",
};

export function Spinner({ size = "md", label, className, ...props }: SpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)} {...props}>
      <div
        className={cn(
          "animate-spin rounded-full border-muted-foreground border-t-blue-600",
          sizeClasses[size],
        )}
      />
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
    </div>
  );
}
