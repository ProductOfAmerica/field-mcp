'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface DeleteKeyButtonProps {
  keyId: string;
  keyName: string | null;
}

export function DeleteKeyButton({ keyId, keyName }: DeleteKeyButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    const res = await fetch(`/api/keys/${keyId}`, {
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
        Revoke
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Revoke API Key</h2>
            <p className="text-gray-600 mb-4">
              Are you sure you want to revoke{' '}
              <strong>{keyName || 'this key'}</strong>? Any applications using
              this key will immediately lose access.
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
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Revoking...' : 'Revoke'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
