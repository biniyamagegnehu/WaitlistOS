"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Search, X, GripVertical, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CountryEntry, LanguageEntry } from "@/lib/locale-data";

type Entry = CountryEntry | LanguageEntry;

interface LocationOptionPickerProps {
  mode: "COUNTRY" | "LANGUAGE";
  allEntries: Entry[];
  optionMode: "ALL" | "SELECTED";
  selectedCodes: string[];
  defaultValue: string;
  onOptionModeChange: (mode: "ALL" | "SELECTED") => void;
  onSelectedCodesChange: (codes: string[]) => void;
  onDefaultValueChange: (code: string) => void;
}

export function LocationOptionPicker({
  mode,
  allEntries,
  optionMode,
  selectedCodes,
  defaultValue,
  onOptionModeChange,
  onSelectedCodesChange,
  onDefaultValueChange,
}: LocationOptionPickerProps) {
  const [search, setSearch] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);

  // Filtered list for the picker (search among all entries)
  const filteredEntries = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return allEntries;
    return allEntries.filter(
      (e) =>
        e.name.toLowerCase().includes(q) || e.code.toLowerCase().includes(q)
    );
  }, [allEntries, search]);

  const addCode = useCallback(
    (code: string) => {
      if (!selectedCodes.includes(code)) {
        onSelectedCodesChange([...selectedCodes, code]);
      }
    },
    [selectedCodes, onSelectedCodesChange]
  );

  const removeCode = useCallback(
    (code: string) => {
      const next = selectedCodes.filter((c) => c !== code);
      onSelectedCodesChange(next);
      // Clear default if removed
      if (defaultValue === code) onDefaultValueChange("");
    },
    [selectedCodes, defaultValue, onSelectedCodesChange, onDefaultValueChange]
  );

  // Drag-to-reorder (simple swap on drag-over)
  const [dragging, setDragging] = useState<string | null>(null);

  const handleDragStart = (code: string) => setDragging(code);
  const handleDrop = (targetCode: string) => {
    if (!dragging || dragging === targetCode) {
      setDragging(null);
      return;
    }
    const from = selectedCodes.indexOf(dragging);
    const to = selectedCodes.indexOf(targetCode);
    const next = [...selectedCodes];
    next.splice(from, 1);
    next.splice(to, 0, dragging);
    onSelectedCodesChange(next);
    setDragging(null);
  };

  const label = mode === "COUNTRY" ? "country" : "language";
  const labelPlural = mode === "COUNTRY" ? "countries" : "languages";

  // Entries to display in the selected list
  const selectedEntries = selectedCodes
    .map((code) => allEntries.find((e) => e.code === code))
    .filter(Boolean) as Entry[];

  // Available entries for the default value dropdown (all if ALL, selected if SELECTED)
  const defaultCandidates =
    optionMode === "ALL"
      ? allEntries
      : selectedEntries;

  return (
    <div className="space-y-4 mt-4 pt-4 border-t">
      <div>
        <p className="text-sm font-medium mb-2">Available {labelPlural}</p>
        {/* Mode toggle */}
        <div className="flex rounded-md border overflow-hidden w-fit">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              optionMode === "ALL"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-accent"
            }`}
            onClick={() => {
              onOptionModeChange("ALL");
            }}
          >
            All {labelPlural}
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium border-l transition-colors ${
              optionMode === "SELECTED"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-accent"
            }`}
            onClick={() => {
              onOptionModeChange("SELECTED");
              if (!pickerOpen) setPickerOpen(true);
            }}
          >
            Selected only
          </button>
        </div>
      </div>

      {optionMode === "SELECTED" && (
        <div className="space-y-3">
          {/* Selected items list (drag to reorder) */}
          {selectedEntries.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Drag to reorder. Click × to remove.
              </p>
              <div className="space-y-1 rounded-md border bg-muted/30 p-2">
                {selectedEntries.map((entry) => (
                  <div
                    key={entry.code}
                    draggable
                    onDragStart={() => handleDragStart(entry.code)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(entry.code)}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm bg-card border cursor-grab active:cursor-grabbing transition-opacity ${
                      dragging === entry.code ? "opacity-40" : "opacity-100"
                    }`}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-mono text-xs text-muted-foreground w-8 flex-shrink-0">
                      {entry.code}
                    </span>
                    <span className="flex-1">{entry.name}</span>
                    <button
                      type="button"
                      onClick={() => removeCode(entry.code)}
                      className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add picker toggle */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPickerOpen((v) => !v)}
            className="w-full"
          >
            <ChevronDown
              className={`mr-2 h-4 w-4 transition-transform ${
                pickerOpen ? "rotate-180" : ""
              }`}
            />
            {selectedCodes.length === 0
              ? `Choose ${labelPlural}…`
              : `Add more ${labelPlural}…`}
          </Button>

          {/* Searchable picker dropdown */}
          {pickerOpen && (
            <div className="rounded-md border bg-card shadow-lg">
              <div className="flex items-center gap-2 border-b px-3 py-2">
                <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <input
                  type="text"
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  placeholder={`Search ${labelPlural}…`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="max-h-56 overflow-y-auto">
                {filteredEntries.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    No {labelPlural} found.
                  </p>
                ) : (
                  filteredEntries.map((entry) => {
                    const isSelected = selectedCodes.includes(entry.code);
                    return (
                      <button
                        type="button"
                        key={entry.code}
                        className={`flex w-full items-center gap-3 px-3 py-2 text-sm text-left transition-colors hover:bg-accent ${
                          isSelected ? "bg-primary/5" : ""
                        }`}
                        onClick={() => {
                          if (isSelected) {
                            removeCode(entry.code);
                          } else {
                            addCode(entry.code);
                          }
                        }}
                      >
                        <span className="font-mono text-xs text-muted-foreground w-8 flex-shrink-0">
                          {entry.code}
                        </span>
                        <span className="flex-1">{entry.name}</span>
                        {isSelected && (
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {optionMode === "SELECTED" && selectedCodes.length === 0 && (
            <p className="text-xs text-destructive">
              Please select at least one {label}.
            </p>
          )}
        </div>
      )}

      {/* Default value selector */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Default value{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <select
          className="w-full border rounded-md p-2 bg-background text-sm"
          value={defaultValue}
          onChange={(e) => onDefaultValueChange(e.target.value)}
        >
          <option value="">— no default —</option>
          {defaultCandidates.map((entry) => (
            <option key={entry.code} value={entry.code}>
              {entry.code} — {entry.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
