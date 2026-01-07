'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

export function SuccessRefresh() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const pollCount = useRef(0);

  useEffect(() => {
    if (success !== 'true') return;

    const maxPolls = 10;
    const pollInterval = 1000;

    const poll = async () => {
      pollCount.current++;
      router.refresh();

      if (pollCount.current >= maxPolls) {
        router.replace('/dashboard/billing');
      }
    };

    const interval = setInterval(poll, pollInterval);
    poll();

    return () => clearInterval(interval);
  }, [success, router]);

  return null;
}
