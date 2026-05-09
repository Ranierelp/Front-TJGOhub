"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted) {
    return <div className="w-16 h-8 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.15)" }} />;
  }

  const isLight = theme === "light";

  return (
    <button
      onClick={() => setTheme(isLight ? "dark" : "light")}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
      style={
        isLight
          ? { background: "rgba(255,255,255,0.22)", color: "white" }
          : { background: "rgba(15,23,42,0.55)",   color: "white" }
      }
      aria-label="Alternar tema"
    >
      {isLight ? <Sun size={13} /> : <Moon size={13} />}
      {isLight ? "Light" : "Dark"}
    </button>
  );
};
