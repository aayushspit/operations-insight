export function SiteHeader() {
  return (
    <header className="section-container flex items-center justify-between py-6">
      <span className="font-display text-sm font-semibold tracking-tight text-foreground">
        SC Diagnostics
      </span>
      <nav className="flex items-center gap-6">
        <a
          href="#diagnostic"
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Tool
        </a>
        <a
          href="#problems"
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Work
        </a>
        <a
          href="#about"
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          About
        </a>
      </nav>
    </header>
  );
}
