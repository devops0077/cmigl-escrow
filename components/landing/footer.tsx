import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t bg-background py-6 md:py-10">
      <div className="px-5 flex flex-col items-center justify-between gap-4 md:flex-row">
        <div className="flex flex-col items-center gap-4 md:items-start md:gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-lg font-bold text-primary">CMIGL Escrow</span>
          </Link>
          <p className="text-center text-sm text-muted-foreground md:text-left">
            Secure transactions between buyers and sellers.
          </p>
        </div>
        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-6">
          <nav className="flex gap-4 md:gap-6">
            <Link
              href="/terms"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacy
            </Link>
            <Link
              href="/help"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Help
            </Link>
          </nav>
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} CMIGL Escrow Services. All rights
            reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
