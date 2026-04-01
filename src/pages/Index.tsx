import { SiteHeader } from "@/components/SiteHeader";
import { HeroSection } from "@/components/HeroSection";
import { DiagnosticTool } from "@/components/DiagnosticTool";
import { ProblemsSection } from "@/components/ProblemsSection";
import { AboutSection } from "@/components/AboutSection";
import { Mail, Phone } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <HeroSection />
      <DiagnosticTool />
      <div className="my-16 section-container">
        <div className="h-px bg-border" />
      </div>
      <ProblemsSection />
      <div className="my-16 section-container">
        <div className="h-px bg-border" />
      </div>
      <AboutSection />
      <footer className="section-container py-12">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-6">
            <a
              href="mailto:aayush.kawathekar@gmail.com"
              className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <Mail className="h-3 w-3" />
              aayush.kawathekar@gmail.com
            </a>
            <a
              href="tel:+919324188747"
              className="flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <Phone className="h-3 w-3" />
              +91-9324188747
            </a>
          </div>
          <p className="text-[10px] text-muted-foreground/60">
            Built with structured thinking and AI.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
