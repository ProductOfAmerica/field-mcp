'use client';

import { Button } from '@agrimcp/ui/components/button';
import { ExternalLinkIcon, LoaderIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export function ManageButton() {
  const [navigating, setNavigating] = useState(false);
  const portalUrlRef = useRef<string | null>(null);

  useEffect(() => {
    fetch('/api/billing/portal', { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        portalUrlRef.current = data.url;
      });

    const resetState = () => setNavigating(false);
    window.addEventListener('pageshow', resetState);
    return () => window.removeEventListener('pageshow', resetState);
  }, []);

  async function handleManage() {
    setNavigating(true);
    window.history.pushState(null, '', '/dashboard/billing');

    if (portalUrlRef.current) {
      window.location.href = portalUrlRef.current;
      return;
    }

    const response = await fetch('/api/billing/portal', { method: 'POST' });
    const { url } = await response.json();
    if (url) {
      window.location.href = url;
    }
  }

  return (
    <Button variant="outline" onClick={handleManage} disabled={navigating}>
      {navigating && <LoaderIcon className="mr-2 size-4 animate-spin" />}
      Manage Subscription
      <ExternalLinkIcon className="ml-2 size-4" />
    </Button>
  );
}
