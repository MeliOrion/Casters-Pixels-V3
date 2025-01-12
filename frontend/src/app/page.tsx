'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAccount, useContractRead, useContractWrite, useWaitForTransaction, useBlockNumber } from 'wagmi';
import { formatEther } from 'viem';
import { CASTERS_PIXELS_ABI, ERC20_ABI } from '../constants/abis';
import { CONTRACT_ADDRESS, CASTER_TOKEN_ADDRESS } from '../constants/addresses';
import { useTokenBalance } from '../hooks/useTokenBalance';
import { useTransactionHandler } from '../hooks/useTransactionHandler';
import { useContractEvents } from '../hooks/useContractEvents';
import { StatusUpdate } from '../hooks/useContractEvents';
import { NetworkStatus } from '../components/NetworkStatus';
import { Stats } from '../components/Stats';
import { StatusUpdates } from '../components/StatusUpdates';
import { TransactionModal } from '../components/TransactionModal';
import { ImageUpload } from '../components/ImageUpload';
import { StabilityService } from '../services/stability';
import { AlchemyService } from '../services/alchemy';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [hasPending, setHasPending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [remixImage, setRemixImage] = useState<string | null>(null);
  const [statusUpdates, setStatusUpdates] = useState<StatusUpdate[]>([]);
  const [generatedHash, setGeneratedHash] = useState<string>('');
  const stabilityServiceRef = useRef<StabilityService | null>(null);
  const alchemyServiceRef = useRef<AlchemyService | null>(null);

  const { address } = useAccount();
  const {
    txState,
    handleError: handleTxError,
    startTransaction,
    updateTransaction,
    completeTransaction,
    closeModal
  } = useTransactionHandler();

  const handleContractError = (error: any) => {
    console.error('Error:', error);
    let message = 'An unknown error occurred';

    if (error.message?.includes('User rejected the request')) {
      message = 'Transaction was cancelled';
    } else if (error.message?.includes('insufficient allowance')) {
      message = 'Please approve CASTER tokens first';
    } else if (error.message?.includes('Already has pending generation')) {
      message = 'You already have a pending generation';
    } else if (error.message?.includes('Must wait for blocks')) {
      message = 'Please wait for more blocks before completing';
    } else if (error.message?.includes('No pending generation')) {
      message = 'No pending generation found';
    } else if (error.message?.includes('Insufficient CASTER balance')) {
      message = 'You need at least 1000 CASTER tokens to generate';
    } else if (error.message?.includes('Transfer failed')) {
      message = 'Token transfer failed. Please try again';
    } else if (error.message?.includes('could not be found')) {
      message = 'Transaction was dropped. Please try again';
    } else if (error.data?.message) {
      message = error.data.message;
    } else if (error.message) {
      message = error.message;
    }

    handleTxError(message);
  };

  useEffect(() => {
    if (!stabilityServiceRef.current) {
      stabilityServiceRef.current = new StabilityService();
    }

    if (process.env.NEXT_PUBLIC_STABILITY_API_KEY) {
      stabilityServiceRef.current = new StabilityService(
        process.env.NEXT_PUBLIC_STABILITY_API_KEY
      );
    }

    if (process.env.NEXT_PUBLIC_ALCHEMY_API_KEY && process.env.NEXT_PUBLIC_CASTER_TOKEN_ADDRESS) {
      alchemyServiceRef.current = new AlchemyService(
        process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
        process.env.NEXT_PUBLIC_CASTER_TOKEN_ADDRESS
      );
    }
    setMounted(true);
  }, []);

  // Contract reads
  const { data: balance } = useTokenBalance(
    CASTER_TOKEN_ADDRESS,
    address
  );

  const { data: allowance } = useTokenBalance(
    CASTER_TOKEN_ADDRESS,
    address,
    CONTRACT_ADDRESS
  );

  const { data: generationCost } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CASTERS_PIXELS_ABI,
    functionName: 'GENERATION_COST',
    watch: true,
  });

  const { data: hasPendingGeneration } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CASTERS_PIXELS_ABI,
    functionName: 'hasPendingGeneration',
    args: [address],
    watch: true,
  });

  const { data: userBlockNumber } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CASTERS_PIXELS_ABI,
    functionName: 'userBlockNumber',
    args: [address || '0x'],
    enabled: !!address,
  });

  const { data: blockWait } = useContractRead({
    address: CONTRACT_ADDRESS,
    abi: CASTERS_PIXELS_ABI,
    functionName: 'BLOCK_WAIT',
    enabled: true,
  });

  const { data: currentBlock } = useBlockNumber();

  const canComplete = useMemo(() => {
    if (!userBlockNumber || !blockWait || !currentBlock) return false;
    return currentBlock >= (userBlockNumber + blockWait);
  }, [userBlockNumber, blockWait, currentBlock]);

  // Contract writes
  const { writeAsync: approve } = useContractWrite({
    address: CASTER_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'approve',
  });

  const { writeAsync: requestGeneration, data: requestData } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CASTERS_PIXELS_ABI,
    functionName: 'requestGeneration',
  });

  const { writeAsync: completeGeneration, data: completeData } = useContractWrite({
    address: CONTRACT_ADDRESS,
    abi: CASTERS_PIXELS_ABI,
    functionName: 'completeGeneration',
  });

  // Transaction handlers
  const { isLoading: isRequestPending } = useWaitForTransaction({
    hash: requestData?.hash,
    onSuccess: async (tx) => {
      try {
        startTransaction('Generation Started', 'Waiting for blocks before completing...');
        setIsGenerating(false);
      } catch (error) {
        console.error('Generation success handler error:', error);
        handleContractError(error);
      }
    },
    onError: (error) => {
      console.error('Generation transaction error:', error);
      if (error.message.includes('could not be found')) {
        startTransaction('Transaction Failed', 'The transaction was dropped. Please try again.');
      } else {
        handleContractError(error);
      }
      setIsGenerating(false);
    },
  });

  const { isLoading: isCompletePending } = useWaitForTransaction({
    hash: completeData?.hash,
    onSuccess: async (tx) => {
      try {
        // Show rarity information
        const isLegendary = tx.blockHash?.endsWith('00') || false;
        
        // Generate the image
        if (stabilityServiceRef.current) {
          try {
            const imageData = await stabilityServiceRef.current.generateImage(!!remixImage, remixImage || undefined);
            setImageUrl(imageData);
            setRemixImage(null);
            
            completeTransaction(true, isLegendary ? 
              '🎉 Legendary Generation! Your prize pool winning image is ready!' : 
              'Your generated image is ready!'
            );
          } catch (error) {
            console.error('Error generating image:', error);
            handleContractError(error);
          }
        }

        setStatusUpdates(prev => [...prev, {
          type: isLegendary ? 'legendary' : 'complete',
          message: isLegendary ? '🎉 Legendary Generation! You won the prize pool!' : 'Generation completed successfully',
          timestamp: Date.now()
        }]);
        
        setIsCompleting(false);
      } catch (error) {
        console.error('Completion success handler error:', error);
        handleContractError(error);
        setIsCompleting(false);
      }
    },
    onError: (error) => {
      console.error('Completion transaction error:', error);
      if (error.message.includes('could not be found')) {
        startTransaction('Transaction Failed', 'The completion transaction was dropped. Please try again.');
      } else {
        handleContractError(error);
      }
      setIsCompleting(false);
    },
  });

  // Handle auto-completion
  useEffect(() => {
    const autoComplete = async () => {
      if (!hasPendingGeneration || !canComplete || isCompleting || isCompletePending || !address) return;

      try {
        setIsCompleting(true);
        startTransaction('Completing Generation', 'Waiting for completion...');
        const { hash } = await completeGeneration();
        updateTransaction(hash);
      } catch (error: any) {
        console.error('Auto-completion error:', error);
        if (error.message.includes('Must wait for blocks')) {
          startTransaction(
            'Generation Pending',
            `Please wait for ${blockWait?.toString() || 'more'} blocks before completing generation.`
          );
        } else if (error.message.includes('No pending generation')) {
          // Silently ignore this error as it means the generation was already completed
          setIsCompleting(false);
        } else {
          handleContractError(error);
        }
        setIsCompleting(false);
      }
    };

    autoComplete();
  }, [hasPendingGeneration, canComplete, completeGeneration, isCompletePending, address]);

  // Check token balance
  useEffect(() => {
    const checkBalance = async () => {
      if (!address || !alchemyServiceRef.current) return;

      try {
        const balance = await alchemyServiceRef.current.getTokenBalance(address);
        if (balance < BigInt(generationCost)) {
          startTransaction(
            'Insufficient Balance',
            `You need at least ${formatEther(generationCost)} CASTER tokens to generate`
          );
        }
      } catch (error) {
        console.error('Error checking balance:', error);
      }
    };

    checkBalance();
  }, [address]);

  // Setup webhooks
  useEffect(() => {
    const setupWebhooks = async () => {
      if (!alchemyServiceRef.current || !process.env.NEXT_PUBLIC_ALCHEMY_WEBHOOK_URL) return;

      try {
        await alchemyServiceRef.current.setupWebhooks(
          process.env.NEXT_PUBLIC_ALCHEMY_WEBHOOK_URL
        );
      } catch (error) {
        console.error('Error setting up webhooks:', error);
      }
    };

    setupWebhooks();
  }, []);

  // Track transfer history
  useEffect(() => {
    const trackTransfers = async () => {
      if (!address || !alchemyServiceRef.current) return;

      try {
        const transfers = await alchemyServiceRef.current.getTransferHistory(address);
        console.log('Transfer history:', transfers);
      } catch (error) {
        console.error('Error getting transfer history:', error);
      }
    };

    trackTransfers();
  }, [address]);

  // Handle generation request
  const handleGenerate = async () => {
    if (!address || !generationCost) {
      handleContractError(new Error('Please connect your wallet first'));
      return;
    }

    if (isGenerating || isApproving || isRequestPending || isCompletePending || isCompleting) {
      startTransaction('Transaction Pending', 'Please wait for the current transaction to complete.');
      return;
    }

    try {
      // Check for pending generation
      if (hasPendingGeneration) {
        if (canComplete && !isCompletePending && !isCompleting) {
          startTransaction(
            'Generation Ready',
            'Your generation is ready to complete. Processing...'
          );
          try {
            setIsCompleting(true);
            const { hash } = await completeGeneration();
            updateTransaction(hash);
          } catch (error: any) {
            if (error.message.includes('No pending generation')) {
              // Silently ignore this error as it means the generation was already completed
              setIsCompleting(false);
            } else {
              handleContractError(error);
            }
            setIsCompleting(false);
          }
        } else {
          startTransaction(
            'Generation Pending',
            `Please wait for ${blockWait?.toString() || 'more'} blocks before completing generation.`
          );
        }
        return;
      }

      // Check CASTER balance
      if (!balance || balance < generationCost) {
        startTransaction(
          'Insufficient Balance',
          `You need ${formatEther(generationCost)} CASTER tokens to generate. Your balance: ${formatEther(balance || 0n)} CASTER`
        );
        return;
      }

      // Check allowance and only approve what's needed
      if (!allowance || allowance < generationCost) {
        setIsApproving(true);
        const requiredApproval = generationCost - (allowance || 0n);
        startTransaction(
          'Approving CASTER', 
          `Approving ${formatEther(requiredApproval)} CASTER tokens...`
        );
        try {
          const { hash } = await approve({ 
            args: [CONTRACT_ADDRESS, requiredApproval] 
          });
          updateTransaction(hash);
        } catch (error: any) {
          console.error('Approval error:', error);
          handleContractError(error);
          setIsApproving(false);
          return;
        }
        setIsApproving(false);
      }

      setIsGenerating(true);
      startTransaction('Generating', 'Waiting for generation and completion...');
      try {
        const { hash } = await requestGeneration();
        updateTransaction(hash);
      } catch (error: any) {
        console.error('Generation request error:', error);
        if (error.message.includes('AlreadyHasPendingGeneration')) {
          if (canComplete) {
            startTransaction(
              'Generation Ready',
              'Your generation is ready to complete. Processing...'
            );
          } else {
            startTransaction(
              'Generation Pending',
              `Please wait for ${blockWait?.toString() || 'more'} blocks before completing generation.`
            );
          }
        } else if (error.message.includes('InsufficientBalance')) {
          handleContractError(new Error('Insufficient CASTER balance for generation.'));
        } else {
          handleContractError(error);
        }
      } finally {
        setIsGenerating(false);
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      handleContractError(error);
      setIsGenerating(false);
      setIsApproving(false);
    }
  };

  // Handle generation complete from events
  const handleGenerationComplete = async (isLegendary: boolean) => {
    if (!stabilityServiceRef.current) return;
    
    try {
      const imageData = await stabilityServiceRef.current.generateImage(!!remixImage, remixImage || undefined);
      setImageUrl(imageData);
      setRemixImage(null);
      
      completeTransaction(true, isLegendary ? 
        '🎉 Legendary Generation! Your prize pool winning image is ready!' : 
        'Your generated image is ready!'
      );
    } catch (error) {
      console.error('Error generating image:', error);
      handleContractError(error);
    }
    setIsGenerating(false);
  };

  // Contract events
  useContractEvents(CONTRACT_ADDRESS, address, (update) => {
    setStatusUpdates(prev => [...prev, update]);
    
    if (update.type === 'complete' || update.type === 'legendary') {
      handleGenerationComplete(update.type === 'legendary');
    }
  });

  if (!mounted) {
    return null;
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="fixed left-0 top-0 w-full z-50">
        <div className="flex justify-between items-center px-6 py-4 bg-gray-900 border-b border-gray-800">
          <h1 className="text-2xl font-bold">Casters Pixels</h1>
          <ConnectButton />
        </div>
      </div>

      <NetworkStatus />

      {/* Main Content */}
      <div className="container mx-auto px-4 pt-24">
        {/* Stats */}
        <Stats />

        <TransactionModal
          isOpen={txState.isOpen}
          title={txState.title}
          message={txState.message}
          status={txState.status}
          txHash={txState.txHash}
          onClose={closeModal}
        />

        {/* Status Updates */}
        <div className="mb-8">
          <StatusUpdates updates={statusUpdates} />
        </div>

        {/* Generation Interface */}
        <div className="flex flex-col items-center gap-6 mb-8">
          <div className="flex flex-col items-center">
            <button
              onClick={handleGenerate}
              disabled={!address || isGenerating || isApproving || isRequestPending || isCompletePending || isCompleting}
              className="text-xl font-semibold bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isApproving ? 'Approving...' : 
               isGenerating || isRequestPending || isCompletePending || isCompleting ? 'Processing...' : 
               remixImage ? 'Generate Remix' : 
               generationCost ? `Generate New (${formatEther(generationCost)} CASTER)` : 'Loading...'}
            </button>
            {address && balance && generationCost && balance < generationCost && (
              <p className="mt-2 text-red-500">
                Insufficient CASTER balance. You need {formatEther(generationCost)} CASTER to generate.
              </p>
            )}
          </div>
        </div>

        {/* Image Upload */}
        {!isGenerating && !isRequestPending && !isCompletePending && !isCompleting && (
          <div className="max-w-xl mx-auto mb-8">
            <ImageUpload
              onImageSelect={(imageData) => setRemixImage(imageData)}
            />
          </div>
        )}

        {/* Generated Image */}
        {imageUrl && (
          <div className="max-w-2xl mx-auto mb-8">
            <img src={imageUrl} alt="Generated" className="w-full rounded-lg shadow-xl mb-4" />
            {generatedHash && (
              <div className="text-center mb-4">
                <p className="text-lg">
                  {generatedHash.endsWith('00') ? 
                    '🎉 Legendary Generation! You won the prize pool!' : 
                    'Standard Generation'}
                </p>
                <p className="text-sm text-gray-400">
                  Generation Hash: {generatedHash}
                </p>
              </div>
            )}
            <div className="text-center">
              <a
                href={imageUrl}
                download="generation.png"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Download Image
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
