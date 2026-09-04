import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normaliseUrl, safeHref } from "@/lib/links";
import type { Certification } from "@/lib/certifications";

/**
 * Certification editor: required name plus an optional credential link that is
 * validated and normalised through the shared URL utility.
 */
export function CertificationListField({
  id,
  values,
  onChange,
  label = "Certifications",
}: {
  id: string;
  values: Certification[];
  onChange: (values: Certification[]) => void;
  label?: string;
}) {
  const [urlErrors, setUrlErrors] = useState<Record<number, string>>({});

  function update(index: number, patch: Partial<Certification>) {
    onChange(values.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  }

  function validateUrl(index: number, raw: string) {
    const value = raw.trim();
    if (!value) {
      setUrlErrors((prev) => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
      update(index, { url: "" });
      return;
    }
    const result = normaliseUrl(value);
    if ("error" in result) {
      setUrlErrors((prev) => ({ ...prev, [index]: result.error }));
      return;
    }
    setUrlErrors((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    update(index, { url: result.url.href });
  }

  return (
    <fieldset>
      <legend className="text-sm font-medium text-foreground">{label}</legend>
      {values.length === 0 && (
        <p className="mt-2 text-sm text-muted-foreground">No certifications added yet.</p>
      )}
      <div className="mt-3 flex flex-col gap-3">
        {values.map((entry, index) => (
          <div key={`${id}-${index}`} className="rounded-lg border border-border bg-surface-muted p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor={`${id}-name-${index}`}>Name</Label>
                <Input
                  id={`${id}-name-${index}`}
                  className="mt-1.5"
                  value={entry.name}
                  aria-invalid={entry.name.trim().length === 0}
                  aria-describedby={entry.name.trim().length === 0 ? `${id}-name-error-${index}` : undefined}
                  onChange={(event) => update(index, { name: event.target.value })}
                />
                {entry.name.trim().length === 0 && (
                  <p
                    id={`${id}-name-error-${index}`}
                    role="alert"
                    className="mt-1.5 text-sm text-destructive"
                  >
                    Add a certification name.
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor={`${id}-url-${index}`}>Credential link (optional)</Label>
                <Input
                  id={`${id}-url-${index}`}
                  className="mt-1.5"
                  inputMode="url"
                  placeholder="e.g. credly.com/badges/your-badge"
                  defaultValue={entry.url}
                  aria-invalid={Boolean(urlErrors[index])}
                  aria-describedby={
                    urlErrors[index] ? `${id}-url-error-${index}` : `${id}-url-hint-${index}`
                  }
                  onBlur={(event) => validateUrl(index, event.target.value)}
                />
                {urlErrors[index] ? (
                  <p
                    id={`${id}-url-error-${index}`}
                    role="alert"
                    className="mt-1.5 text-sm text-destructive"
                  >
                    {urlErrors[index]}
                  </p>
                ) : (
                  <p id={`${id}-url-hint-${index}`} className="mt-1.5 text-xs text-muted-foreground">
                    {entry.url && safeHref(entry.url)
                      ? "Saved as a secure link."
                      : "A domain is enough — https:// is added for you."}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-2 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                aria-label={`Remove certification ${index + 1}`}
                onClick={() => onChange(values.filter((_, i) => i !== index))}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Remove
              </Button>
            </div>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="outline"
        className="mt-3"
        onClick={() => onChange([...values, { name: "", url: "" }])}
      >
        <Plus className="size-4" aria-hidden="true" />
        Add certification
      </Button>
    </fieldset>
  );
}
