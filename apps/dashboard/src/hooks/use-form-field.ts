import { useCallback, useState } from 'react';

interface UseFormFieldOptions<T> {
  initialValue: T;
  validate?: (value: T) => string | undefined;
}

interface UseFormFieldReturn<T> {
  value: T;
  error: string | undefined;
  touched: boolean;
  isValid: boolean;
  onChange: (value: T) => void;
  onBlur: () => void;
  reset: () => void;
}

export function useFormField<T>({
  initialValue,
  validate,
}: UseFormFieldOptions<T>): UseFormFieldReturn<T> {
  const [value, setValue] = useState<T>(initialValue);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const runValidation = useCallback(
    (val: T) => {
      if (validate) {
        return validate(val);
      }
      return undefined;
    },
    [validate],
  );

  const onChange = useCallback(
    (newValue: T) => {
      setValue(newValue);
      if (touched) {
        setError(runValidation(newValue));
      }
    },
    [touched, runValidation],
  );

  const onBlur = useCallback(() => {
    setTouched(true);
    setError(runValidation(value));
  }, [value, runValidation]);

  const reset = useCallback(() => {
    setValue(initialValue);
    setTouched(false);
    setError(undefined);
  }, [initialValue]);

  const isValid = !runValidation(value);

  return {
    value,
    error: touched ? error : undefined,
    touched,
    isValid,
    onChange,
    onBlur,
    reset,
  };
}

export const validators = {
  email: (value: string) => {
    if (!value) return undefined;
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    return isValid ? undefined : 'Please enter a valid email address';
  },
  required:
    (message = 'This field is required') =>
    (value: string) => {
      return value ? undefined : message;
    },
  minLength: (min: number, message?: string) => (value: string) => {
    if (!value) return undefined;
    return value.length >= min
      ? undefined
      : message || `Must be at least ${min} characters`;
  },
  match:
    (getValue: () => string, message = 'Values do not match') =>
    (value: string) => {
      if (!value) return undefined;
      return value === getValue() ? undefined : message;
    },
  compose:
    (...validators: Array<(value: string) => string | undefined>) =>
    (value: string) => {
      for (const validate of validators) {
        const error = validate(value);
        if (error) return error;
      }
      return undefined;
    },
};
