'use client';

import { Badge } from '@fieldmcp/ui/components/badge';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@fieldmcp/ui/components/empty';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@fieldmcp/ui/components/table';
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';
import { KeyIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
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
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    setKeys(serverKeys);
  }, [serverKeys]);

  useEffect(() => {
    let isMounted = true;

    async function fetchCurrentData() {
      if (!isMounted) return;
      const { data } = await supabase
        .from('api_keys')
        .select('*')
        .eq('developer_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (data && isMounted) setKeys(data);
    }

    function handleFocus() {
      fetchCurrentData();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        fetchCurrentData();
      }
    }

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    async function setupRealtime() {
      if (channelRef.current?.state === 'joined') {
        return;
      }
      if (!isMounted) return;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      await supabase.realtime.setAuth(session.access_token);
      if (!isMounted) return;

      channelRef.current = supabase
        .channel(`api-keys-changes-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'api_keys',
            filter: `developer_id=eq.${userId}`,
          },
          (payload: RealtimePostgresChangesPayload<ApiKey>) => {
            if (payload.eventType === 'INSERT') {
              const newKey = payload.new;
              if (newKey.is_active) {
                setKeys((current) => [newKey, ...current]);
              }
            } else if (payload.eventType === 'UPDATE') {
              const updatedKey = payload.new;
              if (!updatedKey.is_active) {
                setKeys((current) =>
                  current.filter((k) => k.id !== updatedKey.id),
                );
              } else {
                setKeys((current) =>
                  current.map((k) => (k.id === updatedKey.id ? updatedKey : k)),
                );
              }
            }
          },
        )
        .subscribe();
    }

    setupRealtime();

    return () => {
      isMounted = false;
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
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
            Create your first API key to start using the FieldMCP API.
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
