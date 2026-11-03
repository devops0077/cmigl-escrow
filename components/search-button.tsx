"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { COMMAND_PALETTE_OPEN_EVENT } from "@/components/command-palette";

/**
 * Visible trigger for the command palette. Keyboard users can also open
 * it anywhere with Ctrl+K / Cmd+K; this button exists because phones
 * and tablets have no Ctrl+K.
 */
export function SearchButton({ className }: { className?: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      aria-label="Open search (Ctrl+K)"
      title="Search (Ctrl+K)"
      onClick={() => window.dispatchEvent(new Event(COMMAND_PALETTE_OPEN_EVENT))}
      className={className}
    >
      <Search className="h-4 w-4" />
      <span className="hidden lg:inline">Search</span>
      <kbd className="hidden lg:inline-flex items-center rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
        Ctrl K
      </kbd>
    </Button>
  );
}
