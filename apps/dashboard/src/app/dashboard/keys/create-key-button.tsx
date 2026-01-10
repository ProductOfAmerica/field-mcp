'use client';

import { Alert, AlertDescription } from '@fieldmcp/ui/components/alert';
import { Button } from '@fieldmcp/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@fieldmcp/ui/components/dialog';
import { Input } from '@fieldmcp/ui/components/input';
import { Label } from '@fieldmcp/ui/components/label';
import {
  CheckCircle2Icon,
  CheckIcon,
  CopyIcon,
  Loader2Icon,
  PlusIcon,
  XCircleIcon,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { useAsyncValidation } from '@/hooks/use-async-validation';

export function CreateKeyButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const checkNameAvailability = useCallback(async (value: string) => {
    const res = await fetch(
      `/api/keys/check-name?name=${encodeURIComponent(value)}`,
    );
    return res.json();
  }, []);

  const nameValidation = useAsyncValidation(checkNameAvailability, {
    enabled: name.length > 0,
  });

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setName(value);
    setServerError(null);
    nameValidation.validate(value);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (nameValidation.isValidating || nameValidation.error) return;

    setLoading(true);
    setServerError(null);

    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name || undefined }),
    });

    if (res.ok) {
      const data = await res.json();
      setCreatedKey(data.key);
    } else if (res.status === 409) {
      const data = await res.json();
      setServerError(data.error);
    } else {
      setServerError('Failed to create API key');
    }
    setLoading(false);
  }

  function handleCopy() {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
      setCopied(true);
    }
  }

  function handleClose() {
    setOpen(false);
    setName('');
    setCreatedKey(null);
    setCopied(false);
    setServerError(null);
    nameValidation.reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="mr-2 size-4" />
          Create API Key
        </Button>
      </DialogTrigger>
      <DialogContent>
        {createdKey ? (
          <>
            <DialogHeader>
              <DialogTitle>API Key Created</DialogTitle>
              <DialogDescription>
                Copy this key now. You won&apos;t be able to see it again!
              </DialogDescription>
            </DialogHeader>
            <Alert className="bg-amber-50 border-amber-200">
              <AlertDescription className="text-amber-800">
                Store this key securely. It provides full access to your
                account.
              </AlertDescription>
            </Alert>
            <div className="flex items-center gap-2 rounded-lg border bg-muted p-3">
              <code className="flex-1 break-all text-sm">{createdKey}</code>
              <Button variant="ghost" size="icon" onClick={handleCopy}>
                {copied ? (
                  <CheckIcon className="size-4 text-green-600" />
                ) : (
                  <CopyIcon className="size-4" />
                )}
              </Button>
            </div>
            <DialogFooter>
              <Button
                onClick={handleClose}
                disabled={!copied}
                className="w-full"
              >
                Done
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Create a new API key to authenticate your requests.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="keyName">Name</Label>
                <div className="relative">
                  <Input
                    id="keyName"
                    value={name}
                    onChange={handleNameChange}
                    placeholder="e.g., Production, Development"
                    aria-invalid={!!nameValidation.error || !!serverError}
                    className="pr-10"
                    required
                  />
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                    {nameValidation.isValidating && (
                      <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
                    )}
                    {!nameValidation.isValidating &&
                      nameValidation.isValid === true && (
                        <CheckCircle2Icon className="size-4 text-green-600" />
                      )}
                    {!nameValidation.isValidating && nameValidation.error && (
                      <XCircleIcon className="size-4 text-destructive" />
                    )}
                  </div>
                </div>
                {(nameValidation.error || serverError) && (
                  <p className="text-sm text-destructive">
                    {nameValidation.error || serverError}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  loading ||
                  !name.trim() ||
                  nameValidation.isValidating ||
                  !!nameValidation.error
                }
              >
                {loading ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
