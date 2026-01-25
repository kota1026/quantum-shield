'use client';

import React, { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Download, FileText, FileSpreadsheet, ChevronDown, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type ExportFormat = 'pdf' | 'csv';

interface ExportOption {
  format: ExportFormat;
  icon: React.ComponentType<{ className?: string }>;
  mimeType: string;
  extension: string;
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    format: 'pdf',
    icon: FileText,
    mimeType: 'application/pdf',
    extension: '.pdf',
  },
  {
    format: 'csv',
    icon: FileSpreadsheet,
    mimeType: 'text/csv',
    extension: '.csv',
  },
];

interface ExportButtonProps {
  onExport: (format: ExportFormat) => Promise<Blob | string>;
  filename?: string;
  formats?: ExportFormat[];
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export function ExportButton({
  onExport,
  filename = 'export',
  formats = ['pdf', 'csv'],
  className,
  variant = 'outline',
  size = 'sm',
  disabled = false,
}: ExportButtonProps) {
  const t = useTranslations('enterprise.export');
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<ExportFormat | null>(null);
  const [exportSuccess, setExportSuccess] = useState<ExportFormat | null>(null);

  const availableOptions = EXPORT_OPTIONS.filter((opt) => formats.includes(opt.format));

  const handleExport = useCallback(
    async (format: ExportFormat) => {
      setIsExporting(format);
      setExportSuccess(null);

      try {
        const result = await onExport(format);
        const option = EXPORT_OPTIONS.find((o) => o.format === format);

        if (!option) return;

        // Create download link
        let blob: Blob;
        if (typeof result === 'string') {
          blob = new Blob([result], { type: option.mimeType });
        } else {
          blob = result;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}${option.extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setExportSuccess(format);
        setTimeout(() => setExportSuccess(null), 2000);
      } catch (error) {
        console.error('Export failed:', error);
      } finally {
        setIsExporting(null);
        setIsOpen(false);
      }
    },
    [onExport, filename]
  );

  // Single format - show simple button
  if (availableOptions.length === 1) {
    const option = availableOptions[0];
    const Icon = option.icon;

    return (
      <Button
        variant={variant}
        size={size}
        onClick={() => handleExport(option.format)}
        disabled={disabled || isExporting !== null}
        className={cn('gap-2', className)}
      >
        {isExporting === option.format ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : exportSuccess === option.format ? (
          <Check className="h-4 w-4 text-success" aria-hidden="true" />
        ) : (
          <Icon className="h-4 w-4" aria-hidden="true" />
        )}
        {t(`formats.${option.format}`)}
      </Button>
    );
  }

  // Multiple formats - show dropdown
  return (
    <div className={cn('relative', className)}>
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isExporting !== null}
        className="gap-2"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="h-4 w-4" aria-hidden="true" />
        )}
        {t('button')}
        <ChevronDown
          className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
          aria-hidden="true"
        />
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Menu */}
          <div
            className="absolute top-full right-0 mt-2 w-48 bg-background-secondary border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden"
            role="menu"
            aria-label={t('menuLabel')}
          >
            <div className="p-1">
              {availableOptions.map((option) => {
                const Icon = option.icon;
                const isLoading = isExporting === option.format;
                const isSuccess = exportSuccess === option.format;

                return (
                  <button
                    key={option.format}
                    onClick={() => handleExport(option.format)}
                    disabled={isExporting !== null}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all',
                      'hover:bg-white/5 disabled:opacity-50',
                      isSuccess && 'bg-success/10'
                    )}
                    role="menuitem"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : isSuccess ? (
                      <Check className="h-4 w-4 text-success" aria-hidden="true" />
                    ) : (
                      <Icon className="h-4 w-4 text-foreground-secondary" aria-hidden="true" />
                    )}
                    <div className="flex-1 text-left">
                      <div className="text-sm font-medium">
                        {t(`formats.${option.format}`)}
                      </div>
                      <div className="text-xs text-foreground-tertiary">
                        {t(`descriptions.${option.format}`)}
                      </div>
                    </div>
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

// Utility function for CSV generation
export function generateCSV(
  headers: string[],
  rows: (string | number)[][]
): string {
  const escapeField = (field: string | number): string => {
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headerRow = headers.map(escapeField).join(',');
  const dataRows = rows.map((row) => row.map(escapeField).join(',')).join('\n');

  return `${headerRow}\n${dataRows}`;
}

// Utility function for basic PDF generation (requires jspdf in production)
export async function generatePDF(
  title: string,
  content: { label: string; value: string }[],
  tableData?: { headers: string[]; rows: string[][] }
): Promise<Blob> {
  // In production, use jspdf or similar library
  // For now, generate a simple HTML-based PDF
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; }
        h1 { color: #333; border-bottom: 2px solid #BC002D; padding-bottom: 10px; }
        .info { margin: 20px 0; }
        .info-row { display: flex; margin: 8px 0; }
        .info-label { font-weight: bold; width: 150px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f5f5f5; }
        .footer { margin-top: 40px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="info">
        ${content.map((item) => `
          <div class="info-row">
            <span class="info-label">${item.label}:</span>
            <span>${item.value}</span>
          </div>
        `).join('')}
      </div>
      ${tableData ? `
        <table>
          <thead>
            <tr>${tableData.headers.map((h) => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${tableData.rows.map((row) => `
              <tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}
      <div class="footer">
        Generated by Quantum Shield Enterprise Admin on ${new Date().toLocaleString()}
      </div>
    </body>
    </html>
  `;

  return new Blob([html], { type: 'text/html' });
}

export default ExportButton;
