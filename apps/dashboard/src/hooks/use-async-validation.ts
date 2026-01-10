'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface ValidationResult {
  available: boolean;
  message?: string;
}

interface UseAsyncValidationOptions {
  debounceMs?: number;
  enabled?: boolean;
}

interface UseAsyncValidationReturn {
  isValidating: boolean;
  error: string | undefined;
  isValid: boolean | undefined;
  validate: (value: string) => void;
  reset: () => void;
}

export function useAsyncValidation(
  validateFn: (value: string) => Promise<ValidationResult>,
  options: UseAsyncValidationOptions = {},
): UseAsyncValidationReturn {
  const { debounceMs = 300, enabled = true } = options;

  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isValid, setIsValid] = useState<boolean | undefined>(undefined);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const abortControllerRef = useRef<AbortController>(undefined);

  const validate = useCallback(
    (value: string) => {
      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Abort previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      if (!enabled || !value.trim()) {
        setError(undefined);
        setIsValid(undefined);
        setIsValidating(false);
        return;
      }

      setIsValidating(true);

      timeoutRef.current = setTimeout(async () => {
        abortControllerRef.current = new AbortController();

        try {
          const result = await validateFn(value);
          setIsValid(result.available);
          setError(result.available ? undefined : result.message);
        } catch (err) {
          if (err instanceof Error && err.name !== 'AbortError') {
            setError('Failed to validate');
          }
        } finally {
          setIsValidating(false);
        }
      }, debounceMs);
    },
    [validateFn, debounceMs, enabled],
  );

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setError(undefined);
    setIsValid(undefined);
    setIsValidating(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  return { isValidating, error, isValid, validate, reset };
}
