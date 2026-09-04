import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export type PasswordRule = {
  id: string;
  label: string;
  test: (value: string) => boolean;
};

export const PASSWORD_RULES: PasswordRule[] = [
  { id: "length", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { id: "upper", label: "At least one uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { id: "lower", label: "At least one lowercase letter", test: (v) => /[a-z]/.test(v) },
  { id: "number", label: "At least one number", test: (v) => /[0-9]/.test(v) },
  {
    id: "special",
    label: "At least one special character",
    test: (v) => /[^A-Za-z0-9]/.test(v),
  },
];

export function passwordRuleFailures(value: string): PasswordRule[] {
  return PASSWORD_RULES.filter((rule) => !rule.test(value));
}

export function PasswordChecklist({
  id,
  value,
  emphasise = false,
}: {
  id: string;
  value: string;
  emphasise?: boolean;
}) {
  return (
    <div
      id={id}
      className={cn(
        "mt-2 rounded-lg border bg-surface-muted px-3 py-2.5",
        emphasise ? "border-destructive/40" : "border-border",
      )}
    >
      <p className="text-xs font-medium text-muted-foreground">Password requirements</p>
      <ul className="mt-1.5 flex flex-col gap-1">
        {PASSWORD_RULES.map((rule) => {
          const met = rule.test(value);
          return (
            <li key={rule.id} className="flex items-start gap-2 text-xs leading-5">
              {met ? (
                <Check aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-success" />
              ) : (
                <Circle
                  aria-hidden="true"
                  className="mt-0.5 size-3.5 shrink-0 text-subtle-foreground"
                />
              )}
              <span className={met ? "text-success" : "text-muted-foreground"}>
                {rule.label}
                <span className="sr-only">{met ? " — met" : " — not met yet"}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
