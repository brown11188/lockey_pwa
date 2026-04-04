"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

const THEMES = [
  { value: "dark",   icon: Moon,    key: "themeDark" as const },
  { value: "light",  icon: Sun,     key: "themeLight" as const },
  { value: "system", icon: Monitor,  key: "themeSystem" as const },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
          {theme === "light" ? (
            <Sun className="h-5 w-5 text-amber-400" />
          ) : (
            <Moon className="h-5 w-5 text-amber-400" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-white">{t.settings.theme}</h3>
          <p className="text-sm text-gray-500">{t.settings.themeDesc}</p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        {THEMES.map(({ value, icon: Icon, key }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-center text-sm font-medium transition-all ${
              theme === value
                ? "border-amber-500 bg-amber-500/20 text-amber-300"
                : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
            }`}
          >
            <Icon className="h-4 w-4" />
            {t.settings[key]}
          </button>
        ))}
      </div>
    </div>
  );
}
