"use client";

import { useState, useRef, useEffect } from "react";
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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showDropdown]);

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="relative">
        <Button
          ref={buttonRef}
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
          <div
            ref={dropdownRef}
            className="absolute right-0 mt-2 w-32 bg-background border border-border rounded-md shadow-lg z-50 overflow-hidden"
          >
            <button
              onClick={() => handleExport('csv')}
              className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              CSV
            </button>
            <button
              onClick={() => handleExport('xlsx')}
              className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              XLSX
            </button>
            <button
              onClick={() => handleExport('doc')}
              className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
            >
              DOC
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors"
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
