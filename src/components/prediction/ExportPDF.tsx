/**
 * Export PDF Component
 * 
 * Generates a PDF export of scenario predictions
 * Uses jsPDF for PDF generation
 */

import { Download, FileText, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import type { EventPrediction } from '../../types/prediction';

interface ExportPDFProps {
  prediction: EventPrediction;
  eventTitle?: string;
}

export default function ExportPDF({ prediction, eventTitle }: ExportPDFProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      // Dynamic import of jsPDF
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      // Colors
      const primaryColor = [59, 130, 246]; // blue-500
      const textColor = [30, 30, 30];
      const lightGray = [200, 200, 200];

      let yPos = 20;

      // Header
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Nucigen Scenario Outlook', 105, 20, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(eventTitle || 'Event Analysis', 105, 30, { align: 'center' });

      yPos = 50;

      // Metadata
      doc.setTextColor(...textColor);
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date(prediction.generated_at).toLocaleString()}`, 20, yPos);
      yPos += 5;
      doc.text(`Event ID: ${prediction.event_id}`, 20, yPos);
      yPos += 5;
      doc.text(`Scenarios: ${prediction.outlooks.length} | Sources: ${prediction.evidence_count || 0}`, 20, yPos);
      yPos += 10;

      // Probability Overview
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Probability Distribution', 20, yPos);
      yPos += 8;

      // Sort by probability
      const sortedOutlooks = [...prediction.outlooks].sort((a, b) => b.probability - a.probability);

      sortedOutlooks.forEach((outlook, idx) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        const percentage = (outlook.probability * 100).toFixed(1);
        const barWidth = (outlook.probability * 150);

        // Bar
        doc.setFillColor(...primaryColor);
        doc.rect(20, yPos - 3, barWidth, 5, 'F');

        // Label
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...textColor);
        doc.text(`${outlook.title}: ${percentage}%`, 25, yPos);
        yPos += 7;
      });

      yPos += 5;

      // Scenarios Detail
      sortedOutlooks.forEach((outlook, idx) => {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        // Scenario Header
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...primaryColor);
        doc.text(`Scenario ${idx + 1}: ${outlook.title}`, 20, yPos);
        yPos += 6;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...textColor);
        doc.text(`Probability: ${(outlook.probability * 100).toFixed(1)}% | Time Horizon: ${outlook.time_horizon} | Confidence: ${outlook.confidence}`, 20, yPos);
        yPos += 6;

        // Mechanism
        doc.setFont('helvetica', 'bold');
        doc.text('Mechanism:', 20, yPos);
        yPos += 5;
        doc.setFont('helvetica', 'normal');
        const mechanismLines = doc.splitTextToSize(outlook.mechanism, 170);
        doc.text(mechanismLines, 20, yPos);
        yPos += mechanismLines.length * 5 + 3;

        // Supporting Evidence
        if (outlook.supporting_evidence && outlook.supporting_evidence.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.text('Supporting Evidence:', 20, yPos);
          yPos += 5;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);

          outlook.supporting_evidence.slice(0, 3).forEach((evidence) => {
            if (yPos > 270) {
              doc.addPage();
              yPos = 20;
            }
            doc.text(`• ${evidence.title}`, 25, yPos);
            yPos += 4;
            if (evidence.publisher) {
              doc.text(`  ${evidence.publisher}${evidence.date ? ` - ${new Date(evidence.date).toLocaleDateString()}` : ''}`, 25, yPos);
              yPos += 4;
            }
          });
          yPos += 3;
        }

        // Watch Indicators
        if (outlook.watch_indicators && outlook.watch_indicators.length > 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.text('Signals to Watch:', 20, yPos);
          yPos += 5;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);

          outlook.watch_indicators.slice(0, 5).forEach((indicator) => {
            if (yPos > 270) {
              doc.addPage();
              yPos = 20;
            }
            doc.text(`• ${indicator}`, 25, yPos);
            yPos += 4;
          });
        }

        yPos += 10;

        // Separator
        doc.setDrawColor(...lightGray);
        doc.line(20, yPos, 190, yPos);
        yPos += 5;
      });

      // Footer on last page
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
        doc.text('Generated by Nucigen', 20, 290);
        doc.text(new Date().toLocaleDateString(), 190, 290, { align: 'right' });
      }

      // Save
      const fileName = `nucigen-prediction-${prediction.event_id}-${Date.now()}.pdf`;
      doc.save(fileName);

      toast.success('PDF exported successfully');
    } catch (error: any) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-2 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.15] rounded-lg text-sm font-light text-text-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {exporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Exporting...</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span>Export PDF</span>
        </>
      )}
    </button>
  );
}
