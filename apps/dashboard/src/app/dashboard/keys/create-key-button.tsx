'use client';

import { Alert, AlertDescription } from '@agrimcp/ui/components/alert';
import { Button } from '@agrimcp/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@agrimcp/ui/components/dialog';
import { Input } from '@agrimcp/ui/components/input';
import { Label } from '@agrimcp/ui/components/label';
import { CheckIcon, CopyIcon, PlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function CreateKeyButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name || undefined }),
    });

    if (res.ok) {
      const data = await res.json();
      setCreatedKey(data.key);
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
    if (createdKey) {
      router.refresh();
    }
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
                <Label htmlFor="keyName">Name (optional)</Label>
                <Input
                  id="keyName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Production, Development"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
