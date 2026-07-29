export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

export interface ValidationCollector extends ValidationResult {
  error(message: string): void;
  warn(message: string): void;
}

export function createValidationCollector(): ValidationCollector {
  const errors: string[] = [];
  const warnings: string[] = [];
  return {
    errors,
    warnings,
    error: (message) => errors.push(message),
    warn: (message) => warnings.push(message),
  };
}
