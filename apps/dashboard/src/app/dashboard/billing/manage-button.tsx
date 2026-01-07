'use client';

import { Button } from '@agrimcp/ui/components/button';
import { ExternalLinkIcon } from 'lucide-react';
import { useState } from 'react';

export function ManageButton() {
  const [loading, setLoading] = useState(false);

  async function handleManage() {
    setLoading(true);

    const response = await fetch('/api/billing/portal', {
      method: 'POST',
    });

    const { url } = await response.json();

    if (url) {
      window.location.href = url;
    }

    setLoading(false);
  }

  return (
    <Button variant="outline" onClick={handleManage} disabled={loading}>
      {loading ? (
        'Loading...'
      ) : (
        <>
          Manage Subscription
          <ExternalLinkIcon className="ml-2 size-4" />
        </>
      )}
    </Button>
  );
}
