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
import { LinkIcon } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
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

  useEffect(() => {
    setConnections(serverConnections);
  }, [serverConnections]);

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
        .channel(`connections-changes-${userId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'farmer_connections',
          },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              const newConn = payload.new as Connection;
              if (newConn.is_active && newConn.developer_id === userId) {
                setConnections((current) => [newConn, ...current]);
              }
            } else if (payload.eventType === 'UPDATE') {
              const updatedConn = payload.new as Connection;
              if (updatedConn.developer_id === userId) {
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
            }
          },
        )
        .subscribe();
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.access_token) {
        setupRealtime(session.access_token);
      }
    });

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
      subscription.unsubscribe();
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
