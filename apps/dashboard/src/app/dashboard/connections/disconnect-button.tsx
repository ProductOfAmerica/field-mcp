'use client';

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
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDisconnect() {
    setLoading(true);
    const res = await fetch(`/api/connections/${connectionId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setIsOpen(false);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-red-600 hover:text-red-700 text-sm font-medium"
      >
        Disconnect
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Disconnect Farmer</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to disconnect <strong>{farmerId}</strong>?
              You will no longer be able to access their John Deere data until
              they reconnect.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={loading}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Disconnecting...' : 'Disconnect'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
