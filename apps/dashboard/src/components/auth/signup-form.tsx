'use client';

import { Alert, AlertDescription } from '@fieldmcp/ui/components/alert';
import { Button } from '@fieldmcp/ui/components/button';
import { Checkbox } from '@fieldmcp/ui/components/checkbox';
import { Input } from '@fieldmcp/ui/components/input';
import { Label } from '@fieldmcp/ui/components/label';
import { cn } from '@fieldmcp/ui/lib/utils';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { useActionState, useState } from 'react';
import { type AuthResult, signup } from '@/app/actions/auth';
import { useFormField, validators } from '@/hooks/use-form-field';

export function SignupForm() {
  const [companyName, setCompanyName] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmVisible, setIsConfirmVisible] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [state, formAction, isPending] = useActionState<
    AuthResult | null,
    FormData
  >(async (_prevState, formData) => signup(formData), null);

  const email = useFormField({
    initialValue: '',
    validate: validators.email,
  });

  const password = useFormField({
    initialValue: '',
    validate: validators.minLength(8, 'Password must be at least 8 characters'),
  });

  const confirmPassword = useFormField({
    initialValue: '',
    validate: validators.match(() => password.value, 'Passwords do not match'),
  });

  const isFormValid =
    email.isValid &&
    email.value &&
    password.isValid &&
    password.value &&
    confirmPassword.isValid &&
    confirmPassword.value &&
    agreedToTerms;

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

      <div className="space-y-1">
        <Label className="leading-5" htmlFor="companyName">
          Company Name*
        </Label>
        <Input
          type="text"
          id="companyName"
          name="companyName"
          placeholder="Your company"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
        />
      </div>

      <div className="w-full space-y-1">
        <Label className="leading-5" htmlFor="password">
          Password*
        </Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={isPasswordVisible ? 'text' : 'password'}
            placeholder="Min. 8 characters"
            className={cn('pr-9', password.error && inputErrorClass)}
            value={password.value}
            onChange={(e) => {
              password.onChange(e.target.value);
              if (confirmPassword.touched && confirmPassword.value) {
                confirmPassword.onBlur();
              }
            }}
            onBlur={password.onBlur}
            required
            minLength={8}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsPasswordVisible((prev) => !prev)}
            className="text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent"
          >
            {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
            <span className="sr-only">
              {isPasswordVisible ? 'Hide password' : 'Show password'}
            </span>
          </Button>
        </div>
        {password.error && (
          <p className="text-destructive text-sm">{password.error}</p>
        )}
      </div>

      <div className="w-full space-y-1">
        <Label className="leading-5" htmlFor="confirmPassword">
          Confirm Password*
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={isConfirmVisible ? 'text' : 'password'}
            placeholder="Confirm your password"
            className={cn('pr-9', confirmPassword.error && inputErrorClass)}
            value={confirmPassword.value}
            onChange={(e) => confirmPassword.onChange(e.target.value)}
            onBlur={confirmPassword.onBlur}
            required
            minLength={8}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsConfirmVisible((prev) => !prev)}
            className="text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent"
          >
            {isConfirmVisible ? <EyeOffIcon /> : <EyeIcon />}
            <span className="sr-only">
              {isConfirmVisible ? 'Hide password' : 'Show password'}
            </span>
          </Button>
        </div>
        {confirmPassword.error && (
          <p className="text-destructive text-sm">{confirmPassword.error}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Checkbox
          id="agreeTerms"
          className="size-5"
          checked={agreedToTerms}
          onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
        />
        <Label htmlFor="agreeTerms" className="text-sm">
          <span className="text-muted-foreground">I agree to the</span>{' '}
          <button type="button" className="hover:underline">
            privacy policy & terms
          </button>
        </Label>
      </div>

      <Button
        className="w-full"
        type="submit"
        disabled={isPending || !isFormValid}
      >
        {isPending ? 'Creating account...' : 'Sign up to FieldMCP'}
      </Button>
    </form>
  );
}
