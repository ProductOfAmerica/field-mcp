'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function CreateKeyButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name || undefined }),
    });

    if (res.ok) {
      const data = await res.json();
      setCreatedKey(data.key);
    }
    setLoading(false);
  }

  function handleCopy() {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleClose() {
    setIsOpen(false);
    setName('');
    setCreatedKey(null);
    setCopied(false);
    if (createdKey) {
      router.refresh();
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700"
      >
        Create API Key
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            {createdKey ? (
              <>
                <h2 className="text-xl font-bold mb-4">API Key Created</h2>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-amber-800">
                    Copy this key now. You won&apos;t be able to see it again!
                  </p>
                </div>
                <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm break-all mb-4">
                  {createdKey}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700"
                  >
                    Done
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-4">Create API Key</h2>
                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label
                      htmlFor="keyName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Name (optional)
                    </label>
                    <input
                      id="keyName"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Production, Development"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                    >
                      {loading ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
