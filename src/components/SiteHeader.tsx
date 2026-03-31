import headshot from "@/assets/headshot.jpeg";

export function SiteHeader() {
  return (
    <header className="section-container flex items-center justify-between py-6">
      <div className="flex items-center gap-3">
        <img
          src={headshot}
          alt="Aayush Kawathekar"
          className="h-8 w-8 rounded-full object-cover"
        />
        <span className="text-sm font-light tracking-tight text-foreground">
          Aayush Kawathekar
        </span>
      </div>
      <nav className="flex items-center gap-6">
        <a
          href="#diagnostic"
          className="text-xs font-light text-muted-foreground transition-colors hover:text-foreground"
        >
          Tool
        </a>
        <a
          href="#problems"
          className="text-xs font-light text-muted-foreground transition-colors hover:text-foreground"
        >
          Work
        </a>
        <a
          href="#about"
          className="text-xs font-light text-muted-foreground transition-colors hover:text-foreground"
        >
          About
        </a>
      </nav>
    </header>
  );
}
