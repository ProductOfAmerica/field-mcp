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
  AlertCircleIcon,
  CheckCircle2Icon,
  Loader2Icon,
  PlusIcon,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { useAsyncValidation } from '@/hooks/use-async-validation';

export function ConnectJohnDeereButton() {
  const [open, setOpen] = useState(false);
  const [farmerId, setFarmerId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const checkFarmerIdAvailability = useCallback(async (value: string) => {
    const res = await fetch(
      `/api/connections/check-farmer-id?farmer_id=${encodeURIComponent(value)}&provider=john_deere`,
    );
    return res.json();
  }, []);

  const farmerIdValidation = useAsyncValidation(checkFarmerIdAvailability, {
    enabled: farmerId.trim().length > 0,
  });

  function handleFarmerIdChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setFarmerId(value);
    setError(null);
    farmerIdValidation.validate(value);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!farmerId.trim()) {
      setError('Farmer ID is required');
      return;
    }

    if (farmerIdValidation.isValidating) return;

    // Allow submission even when connection exists (will refresh tokens)
    window.location.href = `/api/oauth/john-deere/authorize?farmer_id=${encodeURIComponent(farmerId.trim())}`;
  }

  function handleClose() {
    setOpen(false);
    setFarmerId('');
    setError(null);
    farmerIdValidation.reset();
  }

  const hasExistingConnection =
    !farmerIdValidation.isValidating &&
    farmerIdValidation.isValid === false &&
    !!farmerIdValidation.error;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="mr-2 size-4" />
          Connect John Deere
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Connect John Deere Account</DialogTitle>
            <DialogDescription>
              Enter a unique identifier for this farmer. This ID will be used to
              associate the connection with your application.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive" className="my-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {hasExistingConnection && (
            <Alert className="my-4 border-amber-200 bg-amber-50">
              <AlertCircleIcon className="size-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                {farmerIdValidation.error}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="farmerId">Farmer ID</Label>
              <div className="relative">
                <Input
                  type="search"
                  id="farmerId"
                  name="farmer_identifier"
                  value={farmerId}
                  onChange={handleFarmerIdChange}
                  placeholder="e.g., farmer-123, john-smith"
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  data-form-type="other"
                  data-bwignore
                  className="pr-10"
                />
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  {farmerIdValidation.isValidating && (
                    <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
                  )}
                  {!farmerIdValidation.isValidating &&
                    farmerIdValidation.isValid === true && (
                      <CheckCircle2Icon className="size-4 text-green-600" />
                    )}
                  {hasExistingConnection && (
                    <AlertCircleIcon className="size-4 text-amber-600" />
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Your internal identifier for this farmer
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={farmerIdValidation.isValidating}>
              {farmerIdValidation.isValidating
                ? 'Checking...'
                : hasExistingConnection
                  ? 'Refresh Connection'
                  : 'Continue'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
