"use client";

import React, { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody } from "@/components/ui/dialog";
import { FIELD_REGISTRY, FieldCategory, FieldRegistryEntry } from "@/types/custom-fields";
import { 
  Type, AlignLeft, Mail, Phone, Link, 
  CircleDot, CheckSquare, ChevronDownSquare, ToggleRight, Star, SlidersHorizontal, 
  Hash, Calendar, Clock, Globe, Languages, ShieldCheck, LucideIcon 
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
  onSelect: (field: FieldRegistryEntry) => void;
}

export function FieldPickerModal({ isOpen, onClose, onSelect }: FieldPickerModalProps) {
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

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add a Field</DialogTitle>
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
                    return (
                      <Button
                        key={field.type}
                        variant="outline"
                        className="h-auto p-4 flex items-start justify-start text-left bg-card hover:bg-accent/50 hover:border-primary/50 transition-colors"
                        onClick={() => {
                          onSelect(field);
                          onClose();
                        }}
                      >
                        <Icon className="h-5 w-5 mr-3 mt-0.5 text-primary" />
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold text-foreground">{field.name}</span>
                          <span className="text-xs text-muted-foreground font-normal whitespace-normal line-clamp-2">
                            {field.description}
                          </span>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
