'use client';

export type FormSelectOption = { value: string; label: string };

interface FormSelectProps {
  id: string;
  name: string;
  label: string;
  options: readonly FormSelectOption[];
  defaultValue?: string;
  required?: boolean;
  className?: string;
}

export function FormSelect({
  id,
  name,
  label,
  options,
  defaultValue,
  required = false,
  className = '',
}: FormSelectProps) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-xs font-medium text-foreground mb-2">
        {label}
      </label>
      <select
        id={id}
        name={name}
        defaultValue={defaultValue ?? options[0]?.value}
        required={required}
        className="w-full px-3 py-2 border border-border bg-input-background text-sm text-foreground focus:outline-none focus:border-ring focus:ring-2 focus:ring-ring focus:ring-offset-1 appearance-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
