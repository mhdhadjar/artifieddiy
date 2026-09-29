"use client";

import { DesktopIcon, MoonIcon, SunIcon } from "@phosphor-icons/react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const options = [
  { id: "system", label: "System", Icon: DesktopIcon },
  { id: "light", label: "Light", Icon: SunIcon },
  { id: "dark", label: "Dark", Icon: MoonIcon },
] as const;

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <div
      className={`flex rounded-full bg-panel p-1 text-xs font-medium dark:bg-panel-dark ${className}`}
      role="group"
      aria-label="Color theme"
    >
      {options.map((option) => {
        const active = ready && theme === option.id;
        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={active}
            onClick={() => setTheme(option.id)}
            aria-label={option.label}
            title={option.label}
            className={`grid h-7 w-7 place-items-center rounded-full transition ${
              active
                ? "bg-white text-ink shadow-sm dark:bg-ink dark:text-white"
                : "text-muted hover:text-ink dark:text-muted-dark dark:hover:text-white"
            }`}
          >
            <option.Icon size={16} weight={active ? "fill" : "regular"} />
          </button>
        );
      })}
    </div>
  );
}
