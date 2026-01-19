/**
 * Export Menu
 * 
 * Advanced export functionality for search results
 * Supports PDF, CSV, JSON, Markdown formats
 * Includes graphs and metadata
 */

import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, FileJson, FileCode, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { SearchResult, KnowledgeGraph, SearchBuckets } from '../../types/search';

interface ExportMenuProps {
  results: SearchResult[];
  graph?: KnowledgeGraph;
  buckets?: SearchBuckets;
  query: string;
  sessionId?: string;
}

type ExportFormat = 'pdf' | 'csv' | 'json' | 'markdown';

export default function ExportMenu({
  results,
  graph,
  buckets,
  query,
  sessionId,
}: ExportMenuProps) {
  const [isExporting, setIsExporting] = useState<ExportFormat | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const exportToPDF = async () => {
    setIsExporting('pdf');
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPos = 20;

      // Header
      doc.setFontSize(20);
      doc.setTextColor(225, 70, 62); // Primary color
      doc.text('Search Results Export', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      // Query
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(`Query: ${query}`, 10, yPos);
      yPos += 8;

      // Metadata
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const metadata = [
        `Total Results: ${results.length}`,
        `Export Date: ${new Date().toLocaleString()}`,
        sessionId ? `Session ID: ${sessionId}` : '',
      ].filter(Boolean);
      metadata.forEach((line) => {
        doc.text(line, 10, yPos);
        yPos += 5;
      });
      yPos += 5;

      // Results
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Results:', 10, yPos);
      yPos += 8;

      results.forEach((result, index) => {
        // Check if we need a new page
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = 20;
        }

        // Title
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        const titleLines = doc.splitTextToSize(`${index + 1}. ${result.title}`, pageWidth - 20);
        doc.text(titleLines, 10, yPos);
        yPos += titleLines.length * 5 + 2;

        // Summary
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        const summaryLines = doc.splitTextToSize(result.summary, pageWidth - 20);
        doc.text(summaryLines, 10, yPos);
        yPos += summaryLines.length * 4 + 2;

        // Meta info
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(
          `Source: ${result.source} | Date: ${new Date(result.publishedAt).toLocaleDateString()} | Relevance: ${(result.relevanceScore * 100).toFixed(0)}%`,
          10,
          yPos
        );
        yPos += 5;

        // URL
        doc.text(`URL: ${result.url}`, 10, yPos);
        yPos += 8;

        // Entities
        if (result.entities.length > 0) {
          const entitiesText = result.entities.map(e => e.name).join(', ');
          const entityLines = doc.splitTextToSize(`Entities: ${entitiesText}`, pageWidth - 20);
          doc.text(entityLines, 10, yPos);
          yPos += entityLines.length * 4 + 3;
        }

        yPos += 3; // Spacing between results
      });

      // Graph summary (if available)
      if (graph && graph.nodes.length > 0) {
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Knowledge Graph Summary:', 10, yPos);
        yPos += 8;
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        doc.text(`Nodes: ${graph.nodes.length} | Links: ${graph.links.length}`, 10, yPos);
        yPos += 5;
        
        // Top entities
        const nodeCounts = new Map<string, number>();
        graph.nodes.forEach(node => {
          nodeCounts.set(node.type, (nodeCounts.get(node.type) || 0) + 1);
        });
        const topTypes = Array.from(nodeCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);
        topTypes.forEach(([type, count]) => {
          doc.text(`${type}: ${count}`, 15, yPos);
          yPos += 4;
        });
      }

      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Page ${i} of ${totalPages} | Nucigen Labs`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      doc.save(`search-results-${query.substring(0, 30).replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.pdf`);
      toast.success('PDF exported successfully');
    } catch (error: any) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(null);
      setIsOpen(false);
    }
  };

  const exportToCSV = () => {
    setIsExporting('csv');
    try {
      const headers = [
        'Title',
        'Summary',
        'Source',
        'URL',
        'Published Date',
        'Relevance Score',
        'Source Score',
        'Entities',
        'Tags',
      ];

      const rows = results.map((result) => [
        result.title,
        result.summary,
        result.source,
        result.url,
        new Date(result.publishedAt).toISOString(),
        (result.relevanceScore * 100).toFixed(2),
        (result.sourceScore * 100).toFixed(2),
        result.entities.map(e => e.name).join('; '),
        result.tags.join('; '),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `search-results-${query.substring(0, 30).replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('CSV exported successfully');
    } catch (error: any) {
      console.error('CSV export error:', error);
      toast.error('Failed to export CSV');
    } finally {
      setIsExporting(null);
      setIsOpen(false);
    }
  };

  const exportToJSON = () => {
    setIsExporting('json');
    try {
      const exportData = {
        query,
        sessionId,
        exportDate: new Date().toISOString(),
        metadata: {
          totalResults: results.length,
          graphNodes: graph?.nodes.length || 0,
          graphLinks: graph?.links.length || 0,
        },
        results,
        graph,
        buckets,
      };

      const jsonContent = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `search-results-${query.substring(0, 30).replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.json`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('JSON exported successfully');
    } catch (error: any) {
      console.error('JSON export error:', error);
      toast.error('Failed to export JSON');
    } finally {
      setIsExporting(null);
      setIsOpen(false);
    }
  };

  const exportToMarkdown = () => {
    setIsExporting('markdown');
    try {
      let markdown = `# Search Results Export\n\n`;
      markdown += `**Query:** ${query}\n\n`;
      markdown += `**Export Date:** ${new Date().toLocaleString()}\n\n`;
      markdown += `**Total Results:** ${results.length}\n\n`;
      
      if (graph) {
        markdown += `## Knowledge Graph\n\n`;
        markdown += `- Nodes: ${graph.nodes.length}\n`;
        markdown += `- Links: ${graph.links.length}\n\n`;
      }

      markdown += `## Results\n\n`;

      results.forEach((result, index) => {
        markdown += `### ${index + 1}. ${result.title}\n\n`;
        markdown += `${result.summary}\n\n`;
        markdown += `**Source:** ${result.source}  \n`;
        markdown += `**Date:** ${new Date(result.publishedAt).toLocaleDateString()}  \n`;
        markdown += `**Relevance:** ${(result.relevanceScore * 100).toFixed(0)}%  \n`;
        markdown += `**URL:** [${result.url}](${result.url})\n\n`;
        
        if (result.entities.length > 0) {
          markdown += `**Entities:** ${result.entities.map(e => e.name).join(', ')}\n\n`;
        }
        
        if (result.tags.length > 0) {
          markdown += `**Tags:** ${result.tags.map(t => `\`${t}\``).join(', ')}\n\n`;
        }
        
        markdown += `---\n\n`;
      });

      const blob = new Blob([markdown], { type: 'text/markdown' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `search-results-${query.substring(0, 30).replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.md`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Markdown exported successfully');
    } catch (error: any) {
      console.error('Markdown export error:', error);
      toast.error('Failed to export Markdown');
    } finally {
      setIsExporting(null);
      setIsOpen(false);
    }
  };

  const exportOptions = [
    {
      format: 'pdf' as ExportFormat,
      label: 'Export as PDF',
      icon: FileText,
      handler: exportToPDF,
      description: 'Includes all results, metadata, and graph summary',
    },
    {
      format: 'csv' as ExportFormat,
      label: 'Export as CSV',
      icon: FileSpreadsheet,
      handler: exportToCSV,
      description: 'Spreadsheet format for data analysis',
    },
    {
      format: 'json' as ExportFormat,
      label: 'Export as JSON',
      icon: FileJson,
      handler: exportToJSON,
      description: 'Complete data with graph and buckets',
    },
    {
      format: 'markdown' as ExportFormat,
      label: 'Export as Markdown',
      icon: FileCode,
      handler: exportToMarkdown,
      description: 'Human-readable format',
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={results.length === 0 || isExporting !== null}
        className="flex items-center gap-2 px-4 py-2 bg-background-glass-subtle hover:bg-background-glass-medium border border-borders-subtle rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Export results"
      >
        {isExporting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            <span>Export</span>
          </>
        )}
      </button>

      {isOpen && !isExporting && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-64 bg-background-elevated border border-borders-subtle rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="p-2">
              {exportOptions.map((option) => {
                const Icon = option.icon;
                const isExportingThis = isExporting === option.format;
                return (
                  <button
                    key={option.format}
                    onClick={option.handler}
                    disabled={isExportingThis}
                    className="w-full px-4 py-3 text-left text-sm text-text-primary hover:bg-background-glass-subtle transition-colors rounded-lg disabled:opacity-50 flex items-start gap-3"
                  >
                    <Icon className="w-5 h-5 text-text-secondary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-text-tertiary mt-0.5">
                        {option.description}
                      </div>
                    </div>
                    {isExportingThis && (
                      <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
