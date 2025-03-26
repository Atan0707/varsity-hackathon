'use client';

import React, { useState } from 'react';
import { useAppKitProvider, useAppKitAccount } from '@reown/appkit/react';
import { donateToPool } from '@/utils/contract';

interface DonateButtonProps {
  poolId: string;
  onSuccess?: () => void;
}

export default function DonateButton({ poolId, onSuccess }: DonateButtonProps) {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const { walletProvider } = useAppKitProvider("eip155");
  const { address } = useAppKitAccount();

  const handleDonate = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!address || !walletProvider) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      const success = await donateToPool(Number(poolId), amount, walletProvider);
      
      if (success) {
        setShowModal(false);
        setAmount('');
        if (onSuccess) onSuccess();
      } else {
        setError('Failed to donate. Please try again.');
      }
    } catch (err) {
      console.error('Donation error:', err);
      setError('Failed to donate: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition"
      >
        Donate Now
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Donate to {poolId}</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 mb-3">
                  Enter the amount of ETH you want to donate
                </p>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.01"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
                  step="0.001"
                  min="0.001"
                />
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={handleDonate}
                  disabled={isLoading || !address}
                  className={`px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 ${
                    isLoading || !address ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? 'Processing...' : !address ? 'Connect Wallet First' : 'Confirm Donation'}
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="mt-3 px-4 py-2 bg-gray-100 text-gray-800 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 