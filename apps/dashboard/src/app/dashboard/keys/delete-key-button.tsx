'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@agrimcp/ui/components/alert-dialog';
import { Button } from '@agrimcp/ui/components/button';
import { LoaderIcon, TrashIcon } from 'lucide-react';
import { useState } from 'react';

interface DeleteKeyButtonProps {
  keyId: string;
  keyName: string | null;
}

export function DeleteKeyButton({ keyId, keyName }: DeleteKeyButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    const res = await fetch(`/api/keys/${keyId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setOpen(false);
    } else {
      setLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          disabled={loading}
        >
          {loading ? (
            <LoaderIcon className="mr-1 size-4 animate-spin" />
          ) : (
            <TrashIcon className="mr-1 size-4" />
          )}
          {loading ? 'Revoking...' : 'Revoke'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to revoke{' '}
            <strong>{keyName || 'this key'}</strong>? Any applications using
            this key will immediately lose access. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Revoking...' : 'Revoke Key'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
