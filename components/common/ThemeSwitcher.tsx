"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Calendar } from "lucide-react";

import { Switch } from "@/components/ui/switch";

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const date = new Date();
    const formattedDate = new Intl.DateTimeFormat("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);

    setCurrentDate(formattedDate);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex items-center gap-4 h-[40px]">
        <div className="w-[60px] h-[32px] bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        <div className="w-[140px] h-[20px] bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
        <div className="w-[36px] h-[36px] bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
      </div>
    );
  }

  const isLightMode = theme === "light";

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2">
        <Moon className="h-4 w-4 text-muted-foreground" />
        <Switch
          checked={isLightMode}
          className="data-[state=checked]:bg-teal-600"
          onCheckedChange={() => setTheme(isLightMode ? "dark" : "light")}
        />
        <Sun className="h-4 w-4 text-muted-foreground" />
      </div>
      <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
        {currentDate}
      </span>
      <div className="flex items-center justify-center p-2 bg-teal-600 rounded-full">
        <Calendar className="w-5 h-5 text-white" />
      </div>
    </div>
  );
};
