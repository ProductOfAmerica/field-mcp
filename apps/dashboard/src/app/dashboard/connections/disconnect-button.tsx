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
import { UnlinkIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface DisconnectButtonProps {
  connectionId: string;
  farmerId: string;
}

export function DisconnectButton({
  connectionId,
  farmerId,
}: DisconnectButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDisconnect() {
    setLoading(true);
    const res = await fetch(`/api/connections/${connectionId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setOpen(false);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
        >
          <UnlinkIcon className="mr-1 size-4" />
          Disconnect
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Disconnect Farmer</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to disconnect <strong>{farmerId}</strong>? You
            will no longer be able to access their John Deere data until they
            reconnect.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDisconnect}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Disconnecting...' : 'Disconnect'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
