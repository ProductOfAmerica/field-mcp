'use client';

import { useState } from 'react';

export function ConnectJohnDeereButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [farmerId, setFarmerId] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!farmerId.trim()) {
      setError('Farmer ID is required');
      return;
    }

    window.location.href = `/api/oauth/john-deere/authorize?farmer_id=${encodeURIComponent(farmerId.trim())}`;
  }

  function handleClose() {
    setIsOpen(false);
    setFarmerId('');
    setError(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700"
      >
        Connect John Deere
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">
              Connect John Deere Account
            </h2>
            <p className="text-gray-600 mb-4">
              Enter a unique identifier for this farmer. This ID will be used to
              associate the connection with your application.
            </p>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              <div className="mb-4">
                <label
                  htmlFor="farmerId"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Farmer ID
                </label>
                <input
                  id="farmerId"
                  type="text"
                  value={farmerId}
                  onChange={(e) => setFarmerId(e.target.value)}
                  placeholder="e.g., farmer-123, john-smith"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your internal identifier for this farmer
                </p>
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
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
