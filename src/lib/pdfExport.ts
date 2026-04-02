import jsPDF from "jspdf";
import type { DiagnosticMessage } from "@/hooks/useDiagnostic";

interface FinalReportData {
  problemStatement: string;
  selectedPath: string[];
  rootCauseSummary: string;
  checklistItems: string[];
  businessImpact: string[];
  scopingMessages: DiagnosticMessage[];
}

export function generateFinalReportPDF(data: FinalReportData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 22;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const addPageIfNeeded = (needed: number) => {
    if (y + needed > pageHeight - 20) {
      doc.addPage();
      y = margin;
    }
  };

  const drawSectionTitle = (title: string) => {
    addPageIfNeeded(14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30);
    doc.text(title.toUpperCase(), margin, y);
    y += 2;
    doc.setDrawColor(180);
    doc.setLineWidth(0.3);
    doc.line(margin, y, margin + 50, y);
    y += 6;
  };

  const drawBody = (text: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(50);
    const lines = doc.splitTextToSize(text, contentWidth);
    for (const line of lines) {
      addPageIfNeeded(5);
      doc.text(line, margin, y);
      y += 4.5;
    }
    y += 3;
  };

  // === HEADER ===
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(20);
  doc.text("Supply Chain Diagnostic Report", margin, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    `Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    margin, y
  );
  y += 4;
  doc.text("SC Diagnostics — AI-Powered Consulting Tool", margin, y);
  y += 8;

  doc.setDrawColor(200);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // === PROBLEM STATEMENT ===
  drawSectionTitle("Problem Statement");
  drawBody(data.problemStatement);

  // === DIAGNOSTIC PATH ===
  drawSectionTitle("Diagnostic Path");
  drawBody(data.selectedPath.join("  →  "));

  // === KEY FACTS FROM SCOPING ===
  const userAnswers = data.scopingMessages.filter(m => m.role === "user");
  if (userAnswers.length > 1) {
    drawSectionTitle("Key Facts Discovered During Diagnosis");
    for (let i = 1; i < userAnswers.length; i++) {
      const cleaned = userAnswers[i].content.replace(/PHASE_\d_COMPLETE/g, "").trim();
      if (cleaned) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(50);
        const lines = doc.splitTextToSize(`• ${cleaned}`, contentWidth - 4);
        for (const line of lines) {
          addPageIfNeeded(5);
          doc.text(line, margin + 2, y);
          y += 4.5;
        }
      }
    }
    y += 3;
  }

  // === ROOT CAUSE SUMMARY ===
  drawSectionTitle("Root Cause Summary");
  drawBody(data.rootCauseSummary);

  // === WHAT TO CHECK FIRST ===
  if (data.checklistItems.length > 0) {
    drawSectionTitle("What the Company Should Check First");
    for (const item of data.checklistItems) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(50);
      const lines = doc.splitTextToSize(`☐  ${item}`, contentWidth - 4);
      for (const line of lines) {
        addPageIfNeeded(5);
        doc.text(line, margin + 2, y);
        y += 4.5;
      }
      y += 1;
    }
    y += 3;
  }

  // === BUSINESS IMPACT ===
  if (data.businessImpact.length > 0) {
    drawSectionTitle("Likely Business Impact");
    for (const item of data.businessImpact) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(50);
      const lines = doc.splitTextToSize(`→  ${item}`, contentWidth - 4);
      for (const line of lines) {
        addPageIfNeeded(5);
        doc.text(line, margin + 2, y);
        y += 4.5;
      }
      y += 1;
    }
    y += 3;
  }

  // === IMPLEMENTATION ROADMAP ===
  drawSectionTitle("Implementation Roadmap (High Level)");
  const roadmap = [
    "Week 1-2: Validate root cause with data collection and stakeholder interviews",
    "Week 3-4: Quantify value at stake and build business case",
    "Month 2: Design solution and pilot plan",
    "Month 3-6: Implement changes, track KPIs, iterate",
  ];
  for (const step of roadmap) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(50);
    addPageIfNeeded(5);
    doc.text(`•  ${step}`, margin + 2, y);
    y += 5;
  }

  // === FOOTER ===
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(160);
    doc.text(
      `SC Diagnostics Report — Page ${i} of ${pageCount}`,
      margin,
      pageHeight - 10
    );
  }

  doc.save("diagnostic-report.pdf");
}

// Keep legacy export for backward compat
export function generateDiagnosticPDF(messages: DiagnosticMessage[]) {
  generateFinalReportPDF({
    problemStatement: messages.find(m => m.role === "user")?.content || "",
    selectedPath: [],
    rootCauseSummary: "",
    checklistItems: [],
    businessImpact: [],
    scopingMessages: messages,
  });
}
