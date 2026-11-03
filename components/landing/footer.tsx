import Link from "next/link";
import { CookieSettingsButton } from "@/components/cookie-settings-button";

const columns = [
  {
    title: "Product",
    links: [
      { href: "/#how-it-works", label: "How it works" },
      { href: "/auth/register", label: "Create account" },
      { href: "/auth/login", label: "Log in" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/help", label: "Help centre" },
      { href: "/faq", label: "FAQ" },
      { href: "/knowledge-base", label: "Knowledge base" },
      { href: "/tutorials", label: "Tutorials" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of service" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/cookies", label: "Cookie policy" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t">
      <div className="container mx-auto grid gap-10 px-5 py-12 md:grid-cols-[1.5fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Link href="/" className="text-lg font-bold text-primary">
            CMIGL Escrow
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">Secure transactions between buyers and sellers.</p>
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <h3 className="text-sm font-medium">{column.title}</h3>
            <ul className="mt-4 space-y-3 text-sm">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-muted-foreground transition-colors hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
              {column.title === "Legal" && (
                <li>
                  <CookieSettingsButton />
                </li>
              )}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t">
        <p className="container mx-auto px-5 py-6 text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} CMIGL Escrow Services. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

