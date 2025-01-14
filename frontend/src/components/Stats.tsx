'use client';

import { useContractRead } from 'wagmi';
import { formatEther } from 'viem';
import { useTokenBalance } from '../hooks/useTokenBalance';
import { useAccount } from 'wagmi';
import { CASTERS_PIXELS_ABI } from '../constants/abis';
import { CONTRACT_ADDRESS, CASTER_TOKEN_ADDRESS } from '../constants/addresses';
import { useState, useEffect } from 'react';
import { useLPWalletBalance } from '../hooks/useLPWalletBalance';

export function Stats() {
  const { address, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const { data: prizePool } = useContractRead({
    address: CONTRACT_ADDRESS as `0x${string}`,
    abi: CASTERS_PIXELS_ABI,
    functionName: 'prizePool',
    enabled: mounted,
    watch: true,
  });

  const { balance: lpWalletBalance } = useLPWalletBalance();
  const { balance: casterBalance } = useTokenBalance(CASTER_TOKEN_ADDRESS as `0x${string}`, address);

  // Format numbers to whole numbers
  const formatWholeNumber = (value: bigint | undefined) => {
    if (!value) return '0';
    const wholeNumber = Math.floor(Number(formatEther(value))).toString();
    return wholeNumber.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Don't render anything until mounted
  if (!mounted) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        padding: '20px',
        backgroundColor: '#1a1a1a',
        borderRadius: '10px',
        width: '100%',
        border: '1px solid #333',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '5px',
          padding: '15px',
          borderRadius: '8px',
          backgroundColor: '#222',
        }}>
          <span style={{ color: '#666' }}>Prize Pool</span>
          <span style={{ fontSize: '1.5rem' }}>0 CASTER</span>
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '5px',
          padding: '15px',
          borderRadius: '8px',
          backgroundColor: '#222',
        }}>
          <span style={{ color: '#666' }}>CASTER Burned</span>
          <span style={{ fontSize: '1.5rem' }}>0 CASTER</span>
        </div>
      </div>
    );
  }

  console.log('Stats component:', { address, isConnected });

  console.log('Stats values:', { 
    prizePool: formatWholeNumber(prizePool),
    lpWalletBalance: formatWholeNumber(lpWalletBalance),
    casterBalance: formatWholeNumber(casterBalance)
  });

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
      gap: '15px',
      maxWidth: '100%',
      width: '100%',
      padding: '12px',
      background: 'rgba(255, 255, 255, 0.03)',
      borderRadius: '15px',
      margin: '0 auto 20px auto'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 10px',
        background: 'rgba(26, 26, 26, 0.95)',
        borderRadius: '8px',
        minWidth: 0,
        height: '90px',
        border: '1px solid rgba(255, 255, 255, 0.8)',
      }} className="white-border">
        <div style={{ 
          fontSize: '1.8rem', 
          fontWeight: 'bold',
        }} className="white-text">
          {formatWholeNumber(casterBalance)}
        </div>
        <div style={{ 
          fontSize: '0.875rem',
          color: 'rgba(255, 255, 255, 0.9)',
          textShadow: '0 0 5px rgba(255, 255, 255, 0.5)',
          textAlign: 'center',
          marginTop: '4px'
        }}>
          YOUR CASTER BALANCE
        </div>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 10px',
        background: 'rgba(26, 26, 26, 0.95)',
        borderRadius: '8px',
        minWidth: 0,
        height: '90px',
        border: '1px solid var(--neon-blue)',
      }} className="rainbow-border">
        <div style={{ 
          fontSize: '1.8rem', 
          fontWeight: 'bold',
        }} className="rainbow-text">
          {formatWholeNumber(prizePool)}
        </div>
        <div style={{ 
          fontSize: '0.875rem',
          color: 'rgba(255, 255, 255, 0.9)',
          textShadow: '0 0 5px rgba(255, 255, 255, 0.5)',
          textAlign: 'center',
          marginTop: '4px'
        }}>
          PRIZE POOL (CASTER)
        </div>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 10px',
        background: 'rgba(26, 26, 26, 0.95)',
        borderRadius: '8px',
        minWidth: 0,
        height: '90px',
        border: '1px solid var(--neon-pink)',
      }} className="magma-border">
        <div style={{ 
          fontSize: '1.8rem', 
          fontWeight: 'bold',
        }} className="magma-text">
          {formatWholeNumber(lpWalletBalance)}
        </div>
        <div style={{ 
          fontSize: '0.875rem',
          color: 'rgba(255, 255, 255, 0.9)',
          textShadow: '0 0 5px rgba(255, 255, 255, 0.5)',
          textAlign: 'center',
          marginTop: '4px'
        }}>
          CASTER BURNED 🔥
        </div>
      </div>
    </div>
  );
}
