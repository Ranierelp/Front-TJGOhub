import * as React from "react";

import { cn } from "@/lib/utils";

const Badge = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & {
    variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "purple";
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variantClasses = {
    default:     "border-transparent bg-blue-700 text-white",
    secondary:   "border-transparent bg-slate-500 text-white",
    destructive: "border-transparent bg-red-600 text-white",
    outline:     "text-foreground",
    success:     "border-transparent bg-emerald-600 text-white",
    warning:     "border-transparent bg-amber-500 text-white",
    purple:      "border-transparent bg-violet-600 text-white",
  };

  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
});

Badge.displayName = "Badge";

export { Badge };
