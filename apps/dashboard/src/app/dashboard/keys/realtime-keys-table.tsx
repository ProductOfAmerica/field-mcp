'use client';

import { Badge } from '@agrimcp/ui/components/badge';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@agrimcp/ui/components/empty';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@agrimcp/ui/components/table';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { KeyIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DeleteKeyButton } from './delete-key-button';

interface ApiKey {
  id: string;
  developer_id: string;
  key_prefix: string;
  name: string | null;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}

interface RealtimeKeysTableProps {
  serverKeys: ApiKey[];
  userId: string;
}

export function RealtimeKeysTable({
  serverKeys,
  userId,
}: RealtimeKeysTableProps) {
  const [keys, setKeys] = useState(serverKeys);
  const supabase = useMemo(() => createClient(), []);


  useEffect(() => {
    setKeys(serverKeys);
  }, [serverKeys]);

  useEffect(() => {
    let channel: RealtimeChannel | null = null;
    let isMounted = true;

    async function setupRealtime(accessToken: string) {
      if (!isMounted) return;
      
      if (channel) {
        supabase.removeChannel(channel);
      }

      await supabase.realtime.setAuth(accessToken);

      channel = supabase
        .channel(`api-keys-changes-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'api_keys',
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newKey = payload.new as ApiKey;
              if (newKey.is_active && newKey.developer_id === userId) {
                setKeys((current) => [newKey, ...current]);
              }
            } else if (payload.eventType === 'UPDATE') {
              const updatedKey = payload.new as ApiKey;
              if (updatedKey.developer_id === userId) {
                if (!updatedKey.is_active) {
                  setKeys((current) =>
                    current.filter((k) => k.id !== updatedKey.id),
                  );
                } else {
                  setKeys((current) =>
                    current.map((k) =>
                      k.id === updatedKey.id ? updatedKey : k,
                    ),
                  );
                }
              }
            }
          },
        )
        .subscribe();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.access_token) {
          setupRealtime(session.access_token);
        }
      },
    );

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
      subscription.unsubscribe();
    };
  }, [supabase, userId]);

  if (keys.length === 0) {
    return (
      <Empty className="border-0 p-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <KeyIcon />
          </EmptyMedia>
          <EmptyTitle>No API keys yet</EmptyTitle>
          <EmptyDescription>
            Create your first API key to start using the AgriMCP API.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Key</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Last Used</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {keys.map((key) => (
          <TableRow key={key.id}>
            <TableCell className="font-medium">
              {key.name || 'Unnamed key'}
            </TableCell>
            <TableCell>
              <code className="rounded bg-muted px-2 py-1 text-sm">
                {key.key_prefix}...
              </code>
            </TableCell>
            <TableCell className="text-muted-foreground">
              {new Date(key.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-muted-foreground">
              {key.last_used_at ? (
                new Date(key.last_used_at).toLocaleDateString()
              ) : (
                <Badge variant="outline">Never</Badge>
              )}
            </TableCell>
            <TableCell className="text-right">
              <DeleteKeyButton keyId={key.id} keyName={key.name} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
