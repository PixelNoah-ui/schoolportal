"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SectionTagInputProps {
  value: string[];
  onChange: (sections: string[]) => void;
  maxSections?: number;
  placeholder?: string;
}

export function SectionTagInput({
  value,
  onChange,
  maxSections,
  placeholder = "Type a section (e.g. A) and press Enter",
}: SectionTagInputProps) {
  const [input, setInput] = useState("");
  const atLimit = maxSections ? value.length >= maxSections : false;

  const addSection = () => {
    const trimmed = input.trim().toUpperCase();
    if (!trimmed) return;
    if (value.includes(trimmed)) {
      setInput("");
      return;
    }
    if (maxSections && value.length >= maxSections) return;
    onChange([...value, trimmed]);
    setInput("");
  };

  const removeSection = (section: string) => {
    onChange(value.filter((s) => s !== section));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSection();
    } else if (e.key === "Backspace" && !input && value.length) {
      removeSection(value[value.length - 1]);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 border px-2 py-1.5 focus-within:ring-1 focus-within:ring-ring">
        {value.map((section) => (
          <Badge
            key={section}
            variant="secondary"
            className="gap-1 rounded-none px-2 py-1 text-xs font-medium"
          >
            Section {section}
            <button
              type="button"
              onClick={() => removeSection(section)}
              className="ml-0.5 rounded-full hover:bg-muted-foreground/20"
              aria-label={`Remove section ${section}`}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        {!atLimit && (
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={addSection}
            placeholder={value.length ? "" : placeholder}
            className="min-w-24 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {maxSections === 1
          ? "One section for this class."
          : "Press Enter after each section — one class is created per section."}
      </p>
    </div>
  );
}
