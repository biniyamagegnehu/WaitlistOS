"use client";

import { useState } from "react";
import { exportWaitlist } from "@/services/dashboard";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ExportButtonProps {
  waitlistId: string;
}

type ExportFormat = 'csv' | 'xlsx' | 'doc' | 'pdf';

export function ExportButton({ waitlistId }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  async function handleExport(format: ExportFormat) {
    setLoading(true);
    setShowDropdown(false);
    setError(null);
    try {
      await exportWaitlist(waitlistId, format);
    } catch {
      setError("Export failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="relative">
        <Button
          id="export-button"
          variant="secondary"
          size="sm"
          onClick={() => setShowDropdown(!showDropdown)}
          loading={loading}
          leftIcon={<Download className="h-3.5 w-3.5" />}
        >
          Export
        </Button>
        {showDropdown && !loading && (
          <div className="absolute right-0 mt-2 w-32 bg-background border rounded-md shadow-lg z-10">
            <button
              onClick={() => handleExport('csv')}
              className="w-full text-left px-4 py-2 text-sm hover:bg-muted"
            >
              CSV
            </button>
            <button
              onClick={() => handleExport('xlsx')}
              className="w-full text-left px-4 py-2 text-sm hover:bg-muted"
            >
              XLSX
            </button>
            <button
              onClick={() => handleExport('doc')}
              className="w-full text-left px-4 py-2 text-sm hover:bg-muted"
            >
              DOC
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="w-full text-left px-4 py-2 text-sm hover:bg-muted"
            >
              PDF
            </button>
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
