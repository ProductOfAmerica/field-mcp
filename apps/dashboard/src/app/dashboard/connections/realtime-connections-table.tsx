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
import { LinkIcon } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ConnectJohnDeereButton } from './connect-john-deere-button';
import { DisconnectButton } from './disconnect-button';

interface Connection {
  id: string;
  developer_id: string;
  farmer_identifier: string;
  provider: string;
  is_active: boolean;
  token_expires_at: string | null;
  created_at: string;
}

interface RealtimeConnectionsTableProps {
  serverConnections: Connection[];
  userId: string;
}

export function RealtimeConnectionsTable({
  serverConnections,
  userId,
}: RealtimeConnectionsTableProps) {
  const [connections, setConnections] = useState(serverConnections);
  const supabase = useMemo(() => createClient(), []);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    setConnections(serverConnections);
  }, [serverConnections]);

  useEffect(() => {
    let isMounted = true;

    async function fetchCurrentData() {
      if (!isMounted) return;
      const { data } = await supabase
        .from('farmer_connections')
        .select('*')
        .eq('developer_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (data && isMounted) setConnections(data);
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
        .channel(`connections-changes-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'farmer_connections',
            filter: `developer_id=eq.${userId}`,
          },
          (payload: RealtimePostgresChangesPayload<Connection>) => {
            if (payload.eventType === 'INSERT') {
              const newConn = payload.new;
              if (newConn.is_active) {
                setConnections((current) => [newConn, ...current]);
              }
            } else if (payload.eventType === 'UPDATE') {
              const updatedConn = payload.new;
              if (!updatedConn.is_active) {
                setConnections((current) =>
                  current.filter((c) => c.id !== updatedConn.id),
                );
              } else {
                setConnections((current) =>
                  current.map((c) =>
                    c.id === updatedConn.id ? updatedConn : c,
                  ),
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

  if (connections.length === 0) {
    return (
      <Empty className="border-0 p-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LinkIcon />
          </EmptyMedia>
          <EmptyTitle>No farmer connections yet</EmptyTitle>
          <EmptyDescription>
            Connect a farmer's account to start accessing their data.
          </EmptyDescription>
        </EmptyHeader>
        <ConnectJohnDeereButton />
      </Empty>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Farmer ID</TableHead>
          <TableHead>Provider</TableHead>
          <TableHead>Connected</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {connections.map((conn) => {
          const isExpired =
            conn.token_expires_at &&
            new Date(conn.token_expires_at) < new Date();
          return (
            <TableRow key={conn.id}>
              <TableCell className="font-mono">
                {conn.farmer_identifier}
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800"
                >
                  {conn.provider === 'john_deere'
                    ? 'John Deere'
                    : conn.provider}
                </Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {new Date(conn.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {isExpired ? (
                  <Badge
                    variant="outline"
                    className="text-amber-600 border-amber-300"
                  >
                    Token expired
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="text-green-600 border-green-300"
                  >
                    Active
                  </Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <DisconnectButton
                  connectionId={conn.id}
                  farmerId={conn.farmer_identifier}
                />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
