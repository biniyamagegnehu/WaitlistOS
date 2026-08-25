"use client";

import React, { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from "@/components/ui/dialog";
import { FIELD_REGISTRY, FieldCategory, FieldRegistryEntry } from "@/types/custom-fields";
import { 
  Type, AlignLeft, Mail, Phone, Link, 
  CircleDot, CheckSquare, ChevronDownSquare, ToggleRight, Star, SlidersHorizontal, 
  Hash, Calendar, Clock, Globe, Languages, ShieldCheck, LucideIcon, Check 
} from "lucide-react";
import { Button } from "@/components/ui/button";

const ICON_MAP: Record<string, LucideIcon> = {
  Type, AlignLeft, Mail, Phone, Link, 
  CircleDot, CheckSquare, ChevronDownSquare, ToggleRight, Star, SlidersHorizontal, 
  Hash, Calendar, Clock, Globe, Languages, ShieldCheck
};

interface FieldPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (fields: FieldRegistryEntry[]) => void;
}

export function FieldPickerModal({ isOpen, onClose, onSelect }: FieldPickerModalProps) {
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());

  const categories: Record<FieldCategory, FieldRegistryEntry[]> = useMemo(() => {
    const cats = {
      TEXT: [] as FieldRegistryEntry[],
      CHOICE: [] as FieldRegistryEntry[],
      NUMBER: [] as FieldRegistryEntry[],
      DATE_TIME: [] as FieldRegistryEntry[],
      LOCATION: [] as FieldRegistryEntry[],
      LEGAL: [] as FieldRegistryEntry[],
    };
    FIELD_REGISTRY.forEach(f => cats[f.category].push(f));
    return cats;
  }, []);

  const catLabels: Record<FieldCategory, string> = {
    TEXT: "Text",
    CHOICE: "Choice",
    NUMBER: "Number",
    DATE_TIME: "Date & Time",
    LOCATION: "Location & Language",
    LEGAL: "Legal"
  };

  const toggleFieldSelection = (fieldType: string) => {
    setSelectedFields(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldType)) {
        newSet.delete(fieldType);
      } else {
        newSet.add(fieldType);
      }
      return newSet;
    });
  };

  const handleAddFields = () => {
    const selectedFieldEntries = FIELD_REGISTRY.filter(f => selectedFields.has(f.type));
    onSelect(selectedFieldEntries);
    setSelectedFields(new Set());
    onClose();
  };

  const handleClose = () => {
    setSelectedFields(new Set());
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Fields</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-6 pt-4">
          {(Object.keys(categories) as FieldCategory[]).map(cat => {
            if (categories[cat].length === 0) return null;
            return (
              <div key={cat} className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider border-b pb-2">
                  {catLabels[cat]}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categories[cat].map(field => {
                    const Icon = ICON_MAP[field.iconName] || Type;
                    const isSelected = selectedFields.has(field.type);
                    return (
                      <button
                        key={field.type}
                        className={`h-auto p-4 flex items-start justify-start text-left bg-card border-2 transition-colors relative ${
                          isSelected 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                        onClick={() => toggleFieldSelection(field.type)}
                      >
                        {isSelected && (
                          <Check className="h-4 w-4 absolute top-2 right-2 text-primary" />
                        )}
                        <Icon className="h-5 w-5 mr-3 mt-0.5 text-primary" />
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-foreground">{field.name}</span>
                          <span className="text-xs text-muted-foreground font-normal whitespace-normal line-clamp-2">
                            {field.description}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </DialogBody>
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleAddFields} disabled={selectedFields.size === 0}>
            Add {selectedFields.size} {selectedFields.size === 1 ? 'Field' : 'Fields'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
