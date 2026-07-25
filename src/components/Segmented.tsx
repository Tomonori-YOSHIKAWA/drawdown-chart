"use client";

type Option<T> = { value: T; label: string };

/** 択一のフィルタ。選択肢が少なく、常に全部見えているほうが切り替えが速い */
export default function Segmented<T>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex rounded-md border border-hairline p-0.5"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={[
              "rounded px-3 py-1 text-sm transition-colors",
              active
                ? "bg-surface text-ink"
                : "text-ink-3 hover:text-ink-2",
            ].join(" ")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
