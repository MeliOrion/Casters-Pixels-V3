'use client';

import { useState, useEffect, useRef } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Address, useAccount, useContractRead, useContractWrite, usePrepareContractWrite, useWaitForTransaction } from 'wagmi';
import { CONTRACT_ADDRESS, CASTER_TOKEN_ADDRESS } from '../constants/addresses';
import { useTokenAllowance } from '../hooks/useTokenAllowance';
import { useTokenApprove } from '../hooks/useTokenApprove';
import { Stats } from '../components/Stats';
import { ParticleBackground } from '../components/ParticleBackground';
import { CASTERS_PIXELS_ABI, ERC20_ABI } from '../constants/abis';
import { StabilityService } from '../services/stability';
import Image from 'next/image';
import { formatEther } from 'viem';
import { decodeEventLog } from 'viem';
import { generatePrompt } from '../services/stability';
import { generatePFPPrompt, negativePrompt } from '../utils/prompts';
import '../styles/neon.css';

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { address, isConnected } = useAccount();
  const [isProcessingGeneration, setIsProcessingGeneration] = useState(false);
  const [processedTxHashes, setProcessedTxHashes] = useState(new Set<string>());
  const [isTransactionProcessing, setIsTransactionProcessing] = useState(false);
  const [isCompletionProcessing, setIsCompletionProcessing] = useState(false);

  const stabilityService = useRef<StabilityService>(new StabilityService());

  const { data: hasPending = false, isLoading: isPendingLoading, isError: isPendingError } = useContractRead({
    address: CONTRACT_ADDRESS as Address,
    abi: CASTERS_PIXELS_ABI,
    functionName: 'hasPendingGeneration',
    args: [address as Address],
    enabled: isConnected && !!address,
    watch: true,
  });

  const { config: completeConfig } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS as Address,
    abi: CASTERS_PIXELS_ABI,
    functionName: 'completeGeneration',
    enabled: isConnected && !!address && hasPending,
    gas: undefined, // Let Base estimate gas
    gasPrice: undefined, // Use network's suggested gas price
  });

  const { write: completeGeneration, data: completeData } = useContractWrite(completeConfig);

  const { isLoading: isCompleteLoading } = useWaitForTransaction({
    hash: completeData?.hash,
    onSuccess: async (receipt) => {
      // Check if we've already processed this transaction
      if (processedTxHashes.has(receipt.transactionHash)) {
        console.log('Transaction already processed:', receipt.transactionHash);
        return;
      }
      
      // Add this transaction to our processed set
      setProcessedTxHashes((prevTxHashes) => new Set([...prevTxHashes, receipt.transactionHash]));
      
      // Prevent duplicate generations
      if (isProcessingGeneration) {
        return;
      }
      setIsProcessingGeneration(true);

      try {
        console.log('Transaction receipt:', receipt);

        // Find the GenerationComplete event
        const generationEvent = receipt.logs.find(log => 
          log.address.toLowerCase() === CONTRACT_ADDRESS.toLowerCase()
        );

        if (!generationEvent) {
          console.error('GenerationComplete event not found in logs');
          throw new Error('Generation event not found');
        }

        console.log('Generation event:', generationEvent);

        // Parse the event data
        const eventData = decodeEventLog({
          abi: CASTERS_PIXELS_ABI,
          data: generationEvent.data,
          topics: generationEvent.topics,
        }) as { args: { isLegendary: boolean; reward: bigint } };

        const isLegendary = eventData.args.isLegendary;
        const reward = eventData.args.reward;
        
        console.log('Parsed values:', { isLegendary, reward });

        // Wait for a few seconds to allow blocks to be mined
        await new Promise(resolve => setTimeout(resolve, 5000));

        try {
          setIsGenerating(true);
          const prompt = generatePFPPrompt(isLegendary);
          
          console.log('Generating image with prompt:', prompt);
          
          const generatedImage = await stabilityService.current.generateImage(prompt, negativePrompt);
          console.log('Image generated successfully');
          setImageUrl(generatedImage);

          // Show result message based on generation type
          const message = isLegendary
            ? ' Congratulations! You got a LEGENDARY generation and won the prize pool!'
            : 'Generation complete! Common generation.';
          
          console.log('Setting success message:', message);
          setError(message);
        } catch (error) {
          console.error('Failed to generate image:', error);
          setError('Failed to generate image, but your reward has been processed!');
        } finally {
          setIsGenerating(false);
          setIsProcessingGeneration(false);
          setIsTransactionProcessing(false);
          setIsCompletionProcessing(false);
        }
      } catch (error) {
        console.error('Failed to process transaction:', error);
        setError('Failed to process transaction. Please try again.');
        setIsProcessingGeneration(false);
        setIsTransactionProcessing(false);
        setIsCompletionProcessing(false);
      }
    },
    onError: (error) => {
      console.error('Transaction failed:', error);
      setError('Transaction failed. Please try again.');
      setIsProcessingGeneration(false);
      setIsTransactionProcessing(false);
      setIsCompletionProcessing(false);
    },
  });

  const { data: generationCost } = useContractRead({
    address: CONTRACT_ADDRESS as Address,
    abi: CASTERS_PIXELS_ABI,
    functionName: 'GENERATION_COST',
    enabled: isConnected,
  });

  const formattedCost = generationCost ? Math.floor(Number(formatEther(generationCost))).toString() : '1000';

  const { config } = usePrepareContractWrite({
    address: CONTRACT_ADDRESS as Address,
    abi: CASTERS_PIXELS_ABI,
    functionName: 'requestGeneration',
    enabled: isConnected && !!address && !hasPending && !isGenerating,
    gas: undefined, // Let Base estimate gas
    gasPrice: undefined, // Use network's suggested gas price
    onError: (error) => {
      console.error('Gas estimation error:', error);
    },
    onSuccess: (data) => {
      console.log('Gas estimation:', {
        gasLimit: data.gasLimit,
        gasPrice: data.gasPrice,
      });
    },
  });

  const { write: generate, data: transactionData } = useContractWrite({
    ...config,
    onError: (error) => {
      console.error('Write error:', error);
    },
    onSuccess: (data) => {
      console.log('Write success:', data);
    },
  });

  const { isLoading: isTransactionPending } = useWaitForTransaction({
    hash: transactionData?.hash,
  });

  const handleGenerate = async () => {
    if (!generate || !address) return;
    
    setError(null);
    setIsTransactionProcessing(true);
    try {
      generate();
    } catch (err) {
      console.error('Generation error:', err);
      setError('Failed to start generation. Please try again.');
      setIsTransactionProcessing(false);
    }
  };

  const handleComplete = async () => {
    if (!completeGeneration) return;
    try {
      setError(null);
      setIsCompletionProcessing(true);
      completeGeneration();
    } catch (err) {
      console.error('Failed to complete generation:', err);
      setError('Failed to complete generation. Please try again.');
      setIsCompletionProcessing(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 relative">
      <ParticleBackground />
      <div style={{
        width: '100%',
        maxWidth: '90%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        <div className="z-10 w-full max-w-5xl items-center justify-between text-sm lg:flex">
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
          }}>
            <h1 className="rainbow-stroke-text" style={{
              fontSize: '2.5rem',
              margin: 0,
              fontWeight: 'bold',
            }}>
              CASTERS PIXELS
            </h1>
            <ConnectButton />
          </div>

          {/* Stats Component with centered container */}
          <div className="neon-container" style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '20px',
            padding: '20px',
          }}>
            <Stats />
          </div>

          {(isConnected && (hasPending || isTransactionProcessing)) && (
            <div className="neon-warning" style={{
              padding: '15px',
              borderRadius: '10px',
              marginBottom: '20px',
              width: '100%',
              textAlign: 'center'
            }}>
              Generation in progress... Once the "Complete Generation" button appears, click it to finish the process.
            </div>
          )}

          {error && (
            <div className={`${error.includes('Congratulations') ? 'neon-success' : error.includes('complete') ? 'neon-warning' : 'neon-error'}`} style={{
              padding: '15px',
              borderRadius: '10px',
              marginBottom: '20px',
              width: '100%',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          {/* Image display section */}
          {imageUrl ? (
            <div className="neon-image-container" style={{
              width: '400px',
              height: '400px',
              marginBottom: '20px',
              margin: '20px auto'
            }}>
              <Image
                src={imageUrl}
                alt="Generated PFP"
                fill
                style={{ objectFit: 'contain' }}
              />
            </div>
          ) : (
            <div className="neon-container" style={{
              width: '400px',
              height: '400px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '10px',
              marginBottom: '20px',
              margin: '20px auto',
              textAlign: 'center'
            }}>
              {isGenerating ? 'Generating...' : 'Your generated PFP will appear here'}
            </div>
          )}

          {/* Buttons container */}
          <div style={{
            display: 'flex',
            gap: '20px',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            width: '100%'
          }}>
            <button
              onClick={handleGenerate}
              disabled={!isConnected || isGenerating || isTransactionPending || isTransactionProcessing || (isConnected && hasPending)}
              className="neon-button"
              style={{
                width: '200px',
                borderColor: 'var(--neon-green)',
                boxShadow: (!isConnected || isGenerating || isTransactionPending || isTransactionProcessing || (isConnected && hasPending)) ? 'none' : 
                  '0 0 5px var(--neon-green), inset 0 0 5px var(--neon-green)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '10px 20px'
              }}
            >
              {isGenerating 
                ? 'Generating...' 
                : isTransactionProcessing || isTransactionPending
                  ? 'Transaction Pending...'
                  : (isConnected && hasPending)
                    ? 'Generation Pending'
                    : (
                      <div>
                        Generate PFP
                        <span style={{ 
                          fontSize: '0.8em',
                          opacity: 0.8,
                          marginTop: '4px'
                        }}>
                          ({formattedCost} CASTER)
                        </span>
                      </div>
                    )} 
            </button>

            {isConnected && hasPending && (
              <button
                onClick={handleComplete}
                disabled={isCompleteLoading || isCompletionProcessing}
                className="neon-button"
                style={{
                  width: '200px',
                  borderColor: 'var(--neon-orange)',
                  boxShadow: isCompleteLoading || isCompletionProcessing ? 'none' : 
                    '0 0 5px var(--neon-orange), inset 0 0 5px var(--neon-orange)'
                }}
              >
                {isCompleteLoading || isCompletionProcessing ? 'Completing...' : 'Complete Generation'}
              </button>
            )}

            {imageUrl && (
              <button
                onClick={() => {
                  if (!imageUrl) return;
                  const link = document.createElement('a');
                  link.href = imageUrl;
                  link.download = 'casters-pfp.png';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="neon-button"
                style={{
                  width: '200px',
                  borderColor: 'var(--neon-blue)'
                }}
              >
                Download PFP
              </button>
            )}
          </div>

          <p style={{ 
            textAlign: 'center', 
            color: '#888',
            fontSize: '0.9rem',
            marginTop: '20px'
          }}>
            Generate a unique AI PFP for a chance to win CASTER tokens! (Cost: {formattedCost} CASTER)
            <br />
            <small>Note: This generates an AI image that you can download. The image is not automatically minted as an NFT.</small>
          </p>
        </div>
      </div>
    </main>
  );
}
