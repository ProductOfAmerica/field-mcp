'use client';

import { Alert, AlertDescription } from '@fieldmcp/ui/components/alert';
import { Button } from '@fieldmcp/ui/components/button';
import { Input } from '@fieldmcp/ui/components/input';
import { Label } from '@fieldmcp/ui/components/label';
import { cn } from '@fieldmcp/ui/lib/utils';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { useActionState, useState } from 'react';
import { type AuthResult, login } from '@/app/actions/auth';
import { useFormField, validators } from '@/hooks/use-form-field';

export function LoginForm() {
  const [isVisible, setIsVisible] = useState(false);
  const [state, formAction, isPending] = useActionState<
    AuthResult | null,
    FormData
  >(async (_prevState, formData) => login(formData), null);

  const email = useFormField({
    initialValue: '',
    validate: validators.email,
  });

  const password = useFormField({
    initialValue: '',
    validate: validators.required('Password is required'),
  });

  const isFormValid =
    email.isValid && email.value && password.isValid && password.value;

  const inputErrorClass =
    'border-destructive focus-visible:ring-destructive/50';

  return (
    <form className="space-y-4" action={formAction}>
      {state?.error && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-1">
        <Label className="leading-5" htmlFor="email">
          Email address*
        </Label>
        <Input
          type="email"
          id="email"
          name="email"
          placeholder="Enter your email address"
          value={email.value}
          onChange={(e) => email.onChange(e.target.value)}
          onBlur={email.onBlur}
          className={cn(email.error && inputErrorClass)}
          required
        />
        {email.error && (
          <p className="text-destructive text-sm">{email.error}</p>
        )}
      </div>

      <div className="w-full space-y-1">
        <Label className="leading-5" htmlFor="password">
          Password*
        </Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={isVisible ? 'text' : 'password'}
            placeholder="Enter your password"
            className={cn('pr-9', password.error && inputErrorClass)}
            value={password.value}
            onChange={(e) => password.onChange(e.target.value)}
            onBlur={password.onBlur}
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsVisible((prev) => !prev)}
            className="text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent"
          >
            {isVisible ? <EyeOffIcon /> : <EyeIcon />}
            <span className="sr-only">
              {isVisible ? 'Hide password' : 'Show password'}
            </span>
          </Button>
        </div>
        {password.error && (
          <p className="text-destructive text-sm">{password.error}</p>
        )}
      </div>

      <div className="flex justify-end">
        <button type="button" className="text-sm hover:underline">
          Forgot Password?
        </button>
      </div>

      <Button
        className="w-full"
        type="submit"
        disabled={isPending || !isFormValid}
      >
        {isPending ? 'Signing in...' : 'Sign in to FieldMCP'}
      </Button>
    </form>
  );
}
