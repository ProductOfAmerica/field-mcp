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
import { PlusIcon } from 'lucide-react';
import { useState } from 'react';

export function ConnectJohnDeereButton() {
  const [open, setOpen] = useState(false);
  const [farmerId, setFarmerId] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!farmerId.trim()) {
      setError('Farmer ID is required');
      return;
    }

    window.location.href = `/api/oauth/john-deere/authorize?farmer_id=${encodeURIComponent(farmerId.trim())}`;
  }

  function handleClose() {
    setOpen(false);
    setFarmerId('');
    setError(null);
  }

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

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="farmerId">Farmer ID</Label>
              <Input
                id="farmerId"
                value={farmerId}
                onChange={(e) => setFarmerId(e.target.value)}
                placeholder="e.g., farmer-123, john-smith"
                autoComplete="off"
                data-1p-ignore
                data-lpignore="true"
                data-form-type="other"
              />
              <p className="text-xs text-muted-foreground">
                Your internal identifier for this farmer
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">Continue</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
