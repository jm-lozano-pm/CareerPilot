import { CV_TEMPLATES, TEMPLATE_DESCRIPTIONS, TEMPLATE_LABELS, type CvTemplate } from "@/lib/cv-data";

/**
 * Structural miniatures only: neutral lines and spacing that mirror the real
 * template rhythm. No fake personal content, graphics, icons or skill bars.
 */
function Line({ className = "" }: { className?: string }) {
  return <span className={`block rounded-[1px] bg-current ${className}`} aria-hidden="true" />;
}

function Miniature({ template }: { template: CvTemplate }) {
  if (template === "classic") {
    // Centred name/title, rule under the header, thin left-aligned section rules.
    return (
      <span className="block bg-surface p-2 text-border-strong">
        <span className="mx-auto block w-3/4 space-y-[3px] text-center">
          <Line className="mx-auto h-[5px] w-4/5 text-foreground" />
          <Line className="mx-auto h-[2px] w-1/2 opacity-70" />
        </span>
        <Line className="mt-1.5 h-[1.5px] w-full text-foreground" />
        <span className="mt-2 block space-y-[3px]">
          <Line className="h-[2.5px] w-1/3 text-foreground" />
          <Line className="h-[1px] w-full opacity-80" />
          <Line className="h-[2px] w-full opacity-50" />
          <Line className="h-[2px] w-11/12 opacity-50" />
        </span>
        <span className="mt-2.5 block space-y-[3px]">
          <Line className="h-[2.5px] w-2/5 text-foreground" />
          <Line className="h-[1px] w-full opacity-80" />
          <Line className="h-[2px] w-full opacity-50" />
          <Line className="h-[2px] w-4/5 opacity-50" />
        </span>
      </span>
    );
  }

  if (template === "modern") {
    // Full-width blue header band, then blue labels with a slim accent rule.
    return (
      <span className="block bg-surface text-border-strong">
        <span className="block bg-primary px-2 py-2">
          <Line className="h-[5px] w-3/5 text-primary-foreground" />
          <Line className="mt-[3px] h-[2px] w-2/5 text-primary-foreground opacity-80" />
        </span>
        <span className="block px-2 pb-2 pt-2">
          <span className="block border-l-2 border-primary pl-1.5">
            <span className="block space-y-[3px]">
              <Line className="h-[2.5px] w-1/3 text-primary" />
              <Line className="h-[2px] w-full opacity-50" />
              <Line className="h-[2px] w-10/12 opacity-50" />
            </span>
            <span className="mt-2.5 block space-y-[3px]">
              <Line className="h-[2.5px] w-2/5 text-primary" />
              <Line className="h-[2px] w-full opacity-50" />
              <Line className="h-[2px] w-3/4 opacity-50" />
            </span>
          </span>
        </span>
      </span>
    );
  }

  // Compact: tight header line plus dark filled section bars.
  return (
    <span className="block bg-surface p-1.5 text-border-strong">
      <span className="flex items-baseline gap-1">
        <Line className="h-[4px] w-2/5 text-foreground" />
        <Line className="h-[2px] w-1/3 opacity-60" />
      </span>
      <Line className="mt-[3px] h-[1.5px] w-3/4 opacity-50" />
      <span className="mt-1.5 block">
        <span className="block h-[4px] w-full rounded-[1px] bg-foreground" aria-hidden="true" />
        <span className="mt-[3px] block space-y-[2px]">
          <Line className="h-[2px] w-full opacity-50" />
          <Line className="h-[2px] w-11/12 opacity-50" />
        </span>
      </span>
      <span className="mt-1.5 block">
        <span className="block h-[4px] w-full rounded-[1px] bg-foreground" aria-hidden="true" />
        <span className="mt-[3px] block space-y-[2px]">
          <Line className="h-[2px] w-full opacity-50" />
          <Line className="h-[2px] w-10/12 opacity-50" />
          <Line className="h-[2px] w-3/4 opacity-50" />
        </span>
      </span>
    </span>
  );
}


type Props = {
  /** Unique radio group name so two pickers never collide on a page. */
  name: string;
  value: CvTemplate;
  onChange: (template: CvTemplate) => void;
  legend?: string;
  hint?: string;
};

export function CvTemplatePicker({ name, value, onChange, legend = "Template", hint }: Props) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-foreground">{legend}</legend>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      <div className="mt-2 grid gap-3 sm:grid-cols-3">
        {CV_TEMPLATES.map((option) => {
          const selected = value === option;
          const id = `${name}-${option}`;
          return (
            <label
              key={option}
              htmlFor={id}
              className={`cursor-pointer rounded-lg border p-2.5 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary ${
                selected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-surface-muted hover:border-border-strong"
              }`}
            >
              <span className="flex items-center gap-2">
                <input
                  id={id}
                  type="radio"
                  name={name}
                  value={option}
                  checked={selected}
                  onChange={() => onChange(option)}
                  className="size-4 accent-[var(--color-primary)]"
                />
                <span className="text-sm font-medium text-foreground">{TEMPLATE_LABELS[option]}</span>
              </span>
              <span className="mt-2 block">
                <span className="mx-auto block h-24 w-[68px] overflow-hidden rounded-md border border-border">
                  <Miniature template={option} />
                </span>
              </span>


              <span className="mt-1.5 block text-xs text-muted-foreground">
                {TEMPLATE_DESCRIPTIONS[option]}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
