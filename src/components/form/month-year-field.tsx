import { useId } from "react";
import { Label } from "@/components/ui/label";

/**
 * Accessible month/year control that always renders English month names,
 * regardless of browser or operating-system locale. Native
 * `<input type="month">` renders locale text (for example the Spanish
 * "de"), so we own the rendering with two plain selects instead.
 *
 * Stored value stays backward compatible: "YYYY-MM", or "" when empty.
 */

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** Normalises any stored value to "YYYY-MM" or "". Never throws, never loses data silently. */
export function normaliseMonthValue(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const value = raw.trim();
  if (!value) return "";
  const iso = value.match(/^(\d{4})-(\d{1,2})/);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]);
    if (month >= 1 && month <= 12) return `${year}-${String(month).padStart(2, "0")}`;
    return `${year}-01`;
  }
  const yearOnly = value.match(/^(\d{4})$/);
  if (yearOnly) return `${yearOnly[1]}-01`;
  return "";
}

export function splitMonthValue(raw: string): { year: string; month: string } {
  const normalised = normaliseMonthValue(raw);
  if (!normalised) return { year: "", month: "" };
  const [year, month] = normalised.split("-");
  return { year: year ?? "", month: month ?? "" };
}

function yearOptions(selected: string): number[] {
  const current = new Date().getFullYear();
  const newest = current + 8;
  const oldest = current - 60;
  const years: number[] = [];
  for (let year = newest; year >= oldest; year -= 1) years.push(year);
  const chosen = Number(selected);
  if (selected && Number.isFinite(chosen) && !years.includes(chosen)) {
    years.push(chosen);
    years.sort((a, b) => b - a);
  }
  return years;
}

const selectClass =
  "h-9 w-full rounded-lg border border-border bg-surface px-2 text-sm text-foreground shadow-xs transition-colors focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-destructive";

type MonthYearFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string | undefined;
  hint?: string | undefined;
};

export function MonthYearField({
  id,
  label,
  value,
  onChange,
  disabled = false,
  error,
  hint,
}: MonthYearFieldProps) {
  const groupId = useId();
  const { year, month } = splitMonthValue(value);
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");

  function commit(nextMonth: string, nextYear: string) {
    if (!nextMonth && !nextYear) {
      onChange("");
      return;
    }
    // A year alone is meaningful; default the month so the stored value stays valid.
    const safeYear = nextYear || String(new Date().getFullYear());
    const safeMonth = nextMonth || "01";
    onChange(`${safeYear}-${safeMonth}`);
  }

  return (
    <fieldset aria-describedby={describedBy || undefined} className="min-w-0">
      <legend className="mb-1.5 text-sm font-medium text-foreground" id={`${groupId}-legend`}>
        {label}
      </legend>
      <div className="flex flex-wrap items-end gap-x-2 gap-y-2">
        <div className="min-w-[7rem] flex-[3_1_60%]">
          <Label htmlFor={`${id}-month`} className="sr-only">
            {`${label} month`}
          </Label>
          <select
            id={`${id}-month`}
            className={selectClass}
            value={month}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            onChange={(event) => commit(event.target.value, year)}
          >
            <option value="">Month</option>
            {MONTH_NAMES.map((name, index) => (
              <option key={name} value={String(index + 1).padStart(2, "0")}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[5.5rem] flex-[2_1_32%]">
          <Label htmlFor={`${id}-year`} className="sr-only">
            {`${label} year`}
          </Label>
          <select
            id={`${id}-year`}
            className={selectClass}
            value={year}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            onChange={(event) => commit(month, event.target.value)}
          >
            <option value="">Year</option>
            {yearOptions(year).map((option) => (
              <option key={option} value={String(option)}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>
      {hint && (
        <p id={hintId} className="mt-1.5 text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-destructive">
          {error}
        </p>
      )}
    </fieldset>
  );
}
