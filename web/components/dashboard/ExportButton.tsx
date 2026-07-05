"use client";

import { useState } from "react";
import { exportWaitlistCsv } from "@/services/dashboard";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface ExportButtonProps {
  waitlistId: string;
}

export function ExportButton({ waitlistId }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setLoading(true);
    setError(null);
    try {
      await exportWaitlistCsv(waitlistId);
    } catch {
      setError("Export failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button
        id="export-csv-button"
        variant="secondary"
        size="sm"
        onClick={handleExport}
        loading={loading}
        leftIcon={<Download className="h-3.5 w-3.5" />}
      >
        Export CSV
      </Button>
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
