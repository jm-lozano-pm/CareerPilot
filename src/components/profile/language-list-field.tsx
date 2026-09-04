import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  LANGUAGE_PROFICIENCIES,
  formatLanguage,
  type LanguageEntry,
  type LanguageProficiency,
} from "@/lib/languages";

type LanguageListFieldProps = {
  id: string;
  label?: string;
  values: LanguageEntry[];
  onChange: (values: LanguageEntry[]) => void;
  emptyHint?: string;
};

const selectClass =
  "h-9 rounded-lg border border-border bg-card px-2 text-sm text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none";

export function LanguageListField({
  id,
  label = "Languages",
  values,
  onChange,
  emptyHint = "No languages added yet.",
}: LanguageListFieldProps) {
  const [draft, setDraft] = useState("");
  const [proficiency, setProficiency] = useState<LanguageProficiency | "">("");

  function add() {
    const language = draft.trim();
    if (!language) return;
    if (values.some((entry) => entry.language.toLowerCase() === language.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...values, { language, proficiency }]);
    setDraft("");
    setProficiency("");
  }

  function update(index: number, next: Partial<LanguageEntry>) {
    onChange(values.map((entry, i) => (i === index ? { ...entry, ...next } : entry)));
  }

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-1.5 flex flex-wrap gap-2">
        <Input
          id={id}
          className="min-w-[160px] flex-1"
          value={draft}
          placeholder="Add a language"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
        />
        <select
          className={selectClass}
          aria-label="Proficiency for the language you are adding"
          value={proficiency}
          onChange={(event) => setProficiency(event.target.value as LanguageProficiency | "")}
        >
          <option value="">Proficiency (optional)</option>
          {LANGUAGE_PROFICIENCIES.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
        <Button type="button" variant="outline" onClick={add} aria-label={`Add ${label}`}>
          <Plus className="size-4" aria-hidden="true" />
          Add
        </Button>
      </div>
      {values.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{emptyHint}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {values.map((entry, index) => (
            <li
              key={`${entry.language}-${index}`}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-surface-muted px-2.5 py-1.5"
            >
              <span className="min-w-[120px] flex-1 text-sm text-foreground">{entry.language}</span>
              <select
                className={selectClass}
                aria-label={`Proficiency for ${entry.language}`}
                value={entry.proficiency}
                onChange={(event) =>
                  update(index, {
                    proficiency: event.target.value as LanguageProficiency | "",
                  })
                }
              >
                <option value="">No proficiency stated</option>
                {LANGUAGE_PROFICIENCIES.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
              <button
                type="button"
                aria-label={`Remove ${formatLanguage(entry)}`}
                onClick={() => onChange(values.filter((_, i) => i !== index))}
                className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
