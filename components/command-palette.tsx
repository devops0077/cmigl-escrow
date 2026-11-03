"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export const COMMAND_PALETTE_OPEN_EVENT = "cmigl:open-palette";

type CommandItem = {
  id: string;
  label: string;
  detail?: string;
  href: string;
  group: string;
};

type ApiTransaction = {
  id: string;
  amount: number;
  status: string;
  productCategory?: string | null;
  productDetails?: string | null;
  counterpartyName?: string;
  type?: string;
};

function formatNaira(amount: number): string {
  if (!Number.isFinite(amount)) return "";
  return `₦${amount.toLocaleString("en-NG")}`;
}

/**
 * Spotlight-style command palette, hand-rolled (no new dependency).
 * Opens with Ctrl+K / Cmd+K anywhere, or from the Search button in the
 * headers. Arrow keys move, Enter opens, Escape closes.
 *
 * Navigation commands are gated on the client session: signed-out
 * visitors only see public pages, and the Admin entry only appears for
 * users whose session role is ADMIN (the same check the dashboard
 * header already uses).
 *
 * Live transaction search only ever queries the signed-in user's own
 * transactions: /api/transactions scopes every query to buyerId /
 * sellerId of the session user (this PR also fixes that route's search
 * filter, which previously dropped the ownership scope when a search
 * term was present).
 */
export function CommandPalette() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [txResults, setTxResults] = useState<CommandItem[]>([]);
  const [txSearching, setTxSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isAdmin = session?.user?.role === "ADMIN";

  const navCommands = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [
      { id: "nav-home", label: "Home", href: "/", group: "Go to" },
      { id: "nav-help", label: "Help centre", href: "/help", group: "Go to" },
      { id: "nav-faq", label: "FAQ", href: "/faq", group: "Go to" },
      { id: "nav-privacy", label: "Privacy Policy", href: "/privacy", group: "Go to" },
      { id: "nav-terms", label: "Terms of Service", href: "/terms", group: "Go to" },
      { id: "nav-cookies", label: "Cookie Policy", href: "/cookies", group: "Go to" },
    ];
    if (session) {
      items.push(
        { id: "nav-dashboard", label: "Dashboard", href: "/dashboard", group: "Go to" },
        { id: "nav-wallet", label: "Wallet", href: "/dashboard/wallet", group: "Go to" },
        { id: "nav-transactions", label: "Transactions", href: "/dashboard/transactions", group: "Go to" },
        { id: "nav-messages", label: "Messages", href: "/dashboard/messages", group: "Go to" },
        { id: "nav-settings", label: "Settings", href: "/dashboard/settings", group: "Go to" }
      );
      if (isAdmin) {
        items.push({ id: "nav-admin", label: "Admin Panel", href: "/admin", group: "Go to" });
      }
    }
    return items;
  }, [session, isAdmin]);

  const trimmed = query.trim();
  const searchingTx = Boolean(session) && trimmed.length >= 2;

  // Debounced live transaction search for the signed-in user only.
  useEffect(() => {
    if (!open || !searchingTx) {
      setTxResults([]);
      setTxSearching(false);
      return;
    }
    setTxSearching(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/transactions?search=${encodeURIComponent(trimmed)}&limit=8&page=1`,
          { signal: controller.signal }
        );
        if (!res.ok) {
          setTxResults([]);
          return;
        }
        const json = (await res.json()) as { data?: ApiTransaction[] };
        const items: CommandItem[] = (json.data ?? []).slice(0, 8).map((tx) => ({
          id: `tx-${tx.id}`,
          label:
            tx.productDetails || tx.productCategory || "Transaction",
          detail: [
            tx.counterpartyName ? `with ${tx.counterpartyName}` : null,
            formatNaira(tx.amount),
            tx.status,
          ]
            .filter(Boolean)
            .join(" · "),
          href: `/dashboard/transactions/${tx.id}`,
          group: "Transactions",
        }));
        setTxResults(items);
      } catch {
        // Aborted or offline: leave previous results; never surface an error here.
        if (!controller.signal.aborted) setTxResults([]);
      } finally {
        if (!controller.signal.aborted) setTxSearching(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [open, searchingTx, trimmed]);

  const filteredNav = useMemo(() => {
    if (!trimmed) return navCommands;
    const q = trimmed.toLowerCase();
    return navCommands.filter((item) => item.label.toLowerCase().includes(q));
  }, [navCommands, trimmed]);

  const allItems = useMemo(
    () => [...filteredNav, ...txResults],
    [filteredNav, txResults]
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query, txResults, open]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setTxResults([]);
  }, []);

  const activate = useCallback(
    (item: CommandItem) => {
      close();
      router.push(item.href);
    },
    [close, router]
  );

  // Global open: Ctrl+K / Cmd+K, plus the header search buttons.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((wasOpen) => !wasOpen);
      }
    };
    const onOpenEvent = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(COMMAND_PALETTE_OPEN_EVENT, onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(COMMAND_PALETTE_OPEN_EVENT, onOpenEvent);
    };
  }, []);

  // Escape closes; body scroll locks while open; focus the input.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  // Keep the active row visible while arrow-keying.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (allItems.length ? (i + 1) % allItems.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) =>
        allItems.length ? (i - 1 + allItems.length) % allItems.length : 0
      );
    } else if (event.key === "Enter") {
      const item = allItems[activeIndex];
      if (item) {
        event.preventDefault();
        activate(item);
      }
    }
  };

  if (!open) return null;

  let runningIndex = -1;
  const groups: { name: string; items: { item: CommandItem; index: number }[] }[] = [];
  for (const item of allItems) {
    runningIndex += 1;
    const group = groups.find((g) => g.name === item.group);
    const entry = { item, index: runningIndex };
    if (group) group.items.push(entry);
    else groups.push({ name: item.group, items: [entry] });
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search and commands"
        className="mx-auto mt-[12vh] w-[calc(100%-2rem)] max-w-lg overflow-hidden rounded-xl border bg-background shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onInputKeyDown}
            type="text"
            placeholder="Search pages and transactions…"
            aria-label="Search pages and transactions"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden shrink-0 rounded border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
          {allItems.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {searchingTx && txSearching
                ? "Searching…"
                : trimmed
                  ? "No matching pages or transactions."
                  : "Type to search pages and transactions."}
            </p>
          )}

          {groups.map((group) => (
            <div key={group.name}>
              <p className="px-3 pb-1 pt-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {group.name}
              </p>
              {group.items.map(({ item, index }) => (
                <button
                  key={item.id}
                  type="button"
                  data-index={index}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => activate(item)}
                  className={`flex w-full flex-col rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    index === activeIndex
                      ? "bg-accent text-accent-foreground"
                      : "text-foreground"
                  }`}
                >
                  <span className="font-medium">{item.label}</span>
                  {item.detail && (
                    <span className="text-xs text-muted-foreground">
                      {item.detail}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}

          {searchingTx && txSearching && allItems.length > 0 && (
            <p className="px-3 py-2 text-center text-xs text-muted-foreground">
              Searching transactions…
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 border-t px-4 py-2 text-xs text-muted-foreground">
          <span>↑↓ Navigate</span>
          <span>Enter Open</span>
          <span>Esc Close</span>
          <span className="ml-auto hidden sm:inline">
            {session ? "Transactions are your own only" : "Sign in to search transactions"}
          </span>
        </div>
      </div>
    </div>
  );
}
