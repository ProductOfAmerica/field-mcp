'use client';

import { Button } from '@agrimcp/ui/components/button';
import { useState } from 'react';

export function UpgradeButton({ tier }: { tier: 'developer' | 'startup' }) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    setLoading(true);

    const response = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier }),
    });

    const { url } = await response.json();

    if (url) {
      window.location.href = url;
    }

    setLoading(false);
  }

  return (
    <Button onClick={handleUpgrade} disabled={loading} className="w-full">
      {loading ? 'Loading...' : 'Upgrade'}
    </Button>
  );
}
