'use client';

import { useNetwork } from 'wagmi';
import { useState, useEffect } from 'react';

export function NetworkStatus() {
  const { chain } = useNetwork();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (!chain) {
    return null;
  }

  const isCorrectNetwork = chain.id === 8453; // Base Mainnet

  return (
    <div className={`fixed bottom-4 right-4 rounded-full px-4 py-2 text-sm font-medium ${
      isCorrectNetwork ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`}>
      {isCorrectNetwork ? (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span>Connected to Base</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <span>Wrong Network - Switch to Base</span>
        </div>
      )}
    </div>
  );
}
