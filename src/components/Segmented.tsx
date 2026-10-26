import React from 'react';

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: React.ReactNode;
  disabled?: boolean;
}

interface SegmentedProps<T extends string | number> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}

export function Segmented<T extends string | number>({ options, value, onChange, ariaLabel }: SegmentedProps<T>): React.ReactElement {
  return (
    <div className="segmented" role="radiogroup" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          className={`segmented-item ${option.value === value ? 'is-active' : ''}`}
          disabled={option.disabled}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
