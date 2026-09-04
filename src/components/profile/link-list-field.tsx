import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { linkLabel, normaliseUrl, safeHref } from "@/lib/links";

/**
 * Link list with shared validation/normalisation. Values stay plain strings for
 * backward compatibility with existing CV contact links; bare domains are
 * normalised to https:// on add.
 */
export function LinkListField({
  id,
  label,
  placeholder,
  values,
  onChange,
  emptyHint,
}: {
  id: string;
  label: string;
  placeholder: string;
  values: string[];
  onChange: (values: string[]) => void;
  emptyHint: string;
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  function add() {
    const result = normaliseUrl(draft);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setError(null);
    const href = result.url.href;
    if (!values.some((existing) => existing.toLowerCase() === href.toLowerCase())) {
      onChange([...values, href]);
    }
    setDraft("");
  }

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="mt-1.5 flex gap-2">
        <Input
          id={id}
          value={draft}
          placeholder={placeholder}
          inputMode="url"
          aria-invalid={Boolean(error)}
          aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
          onChange={(event) => {
            setDraft(event.target.value);
            if (error) setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={add}>
          <Plus className="size-4" aria-hidden="true" />
          Add
        </Button>
      </div>
      <p id={`${id}-hint`} className="mt-1.5 text-xs text-muted-foreground">
        A domain is enough — https:// is added for you.
      </p>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-destructive">
          {error}
        </p>
      )}
      {values.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{emptyHint}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {values.map((value) => {
            const href = safeHref(value);
            return (
              <li
                key={value}
                className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-border bg-surface-muted px-2.5 py-1.5 text-sm"
              >
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 break-all text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    {linkLabel(value)}
                  </a>
                ) : (
                  <span className="min-w-0 break-all text-muted-foreground">{value}</span>
                )}
                <button
                  type="button"
                  aria-label={`Remove ${linkLabel(value)}`}
                  onClick={() => onChange(values.filter((item) => item !== value))}
                  className="shrink-0 rounded text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
