"use client";

import { FC, useEffect, useState } from "react";
import { useTheme } from "next-themes";

import { SunFilledIcon, MoonFilledIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

export interface ThemeSwitchProps {
  className?: string;
}

export const ThemeSwitch: FC<ThemeSwitchProps> = ({ className }) => {
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isLight = !isMounted || theme === "light";

  return (
    <button
      aria-label={`Alternar para modo ${isLight ? "escuro" : "claro"}`}
      className={cn(
        "px-1 transition-opacity hover:opacity-80 cursor-pointer text-muted-foreground",
        className,
      )}
      onClick={() => setTheme(isLight ? "dark" : "light")}
    >
      {isLight ? <MoonFilledIcon size={22} /> : <SunFilledIcon size={22} />}
    </button>
  );
};
