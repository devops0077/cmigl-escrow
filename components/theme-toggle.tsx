"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function ThemeToggle({
  children,
  isCollapsed,
  isMobile = false,
  className,
}: {
  children?: React.ReactNode;
  isCollapsed?: boolean;
  isMobile?: boolean;
  className?: string;
}) {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <Button
        variant="ghost"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
        aria-label="Toggle theme"
        className={cn(
          `relative w-full justify-baseline  rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-0  disabled:pointer-events-none disabled:opacity-50 dark:focus:ring-offset-slate-900 `,
          className
        )}
      >
        {mounted && theme === "dark" ? (
          <Sun
            className={cn(
              "text-muted-foreground h-5 w-5 group-hover:text-primary",
              isMobile ? "text-foreground ml-0.5" : "-ml-0.5"
            )}
          />
        ) : (
          <Moon
            className={cn(
              "text-muted-foreground h-5 w-5 -ml-0.5 group-hover:text-primary",
              isMobile ? "text-foreground ml-0.5 " : "-ml-0.5"
            )}
          />
        )}

        {!isCollapsed && <span className="ml-2">Toggle Theme</span>}
      </Button>
    </>
  );
}
