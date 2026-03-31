import { SiteHeader } from "@/components/SiteHeader";
import { HeroSection } from "@/components/HeroSection";
import { DiagnosticTool } from "@/components/DiagnosticTool";
import { ProblemsSection } from "@/components/ProblemsSection";
import { AboutSection } from "@/components/AboutSection";

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
      <footer className="section-container py-12 text-center">
        <p className="text-xs text-muted-foreground">
          Built with structured thinking and AI.
        </p>
      </footer>
    </div>
  );
};

export default Index;
