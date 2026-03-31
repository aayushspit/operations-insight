import jsPDF from "jspdf";
import type { DiagnosticMessage } from "@/hooks/useDiagnostic";

export function generateDiagnosticPDF(messages: DiagnosticMessage[]) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const addPageIfNeeded = (needed: number) => {
    if (y + needed > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Supply Chain Diagnostic Report", margin, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(`Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, margin, y);
  y += 4;
  doc.text("SC Diagnostics — AI-Powered Consulting Tool", margin, y);
  doc.setTextColor(0);
  y += 12;

  // Separator
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Extract sections from assistant messages
  const assistantMessages = messages.filter(m => m.role === "assistant");
  const fullContent = assistantMessages.map(m => m.content).join("\n\n");

  // Sections
  const sections = [
    { title: "Executive Summary", marker: /executive\s*summary|situation.*complication.*resolution/i },
    { title: "Issue Tree / Root Cause Analysis", marker: /issue\s*tree|root\s*cause|mece/i },
    { title: "Prioritization Matrix", marker: /prioriti[sz]ation|quick\s*win|strategic\s*bet|2x2/i },
    { title: "Assumptions", marker: /assumption/i },
  ];

  // Write conversation as structured report
  for (const msg of messages) {
    addPageIfNeeded(20);

    if (msg.role === "user") {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(80);
      doc.text("User Input:", margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(60);
      const userLines = doc.splitTextToSize(msg.content, contentWidth);
      for (const line of userLines) {
        addPageIfNeeded(5);
        doc.text(line, margin, y);
        y += 4.5;
      }
      y += 4;
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.text("Diagnostic Analysis:", margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(40);

      // Clean markdown
      const cleaned = msg.content
        .replace(/#{1,6}\s/g, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/`(.*?)`/g, "$1");

      const lines = doc.splitTextToSize(cleaned, contentWidth);
      for (const line of lines) {
        addPageIfNeeded(5);
        doc.text(line, margin, y);
        y += 4.5;
      }
      y += 6;
    }

    // Separator between exchanges
    addPageIfNeeded(6);
    doc.setDrawColor(230);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(160);
    doc.text(
      `SC Diagnostics Report — Page ${i} of ${pageCount}`,
      margin,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  doc.save("diagnostic-report.pdf");
}
