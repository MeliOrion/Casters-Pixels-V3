import { useState, useCallback } from 'react';

export type TransactionState = {
  isOpen: boolean;
  title: string;
  message: string;
  status: 'pending' | 'success' | 'error';
  txHash?: string;
};

export function useTransactionHandler() {
  const [txState, setTxState] = useState<TransactionState>({
    isOpen: false,
    title: '',
    message: '',
    status: 'pending'
  });

  const handleError = useCallback((error: any) => {
    let message = 'An unknown error occurred';

    // Handle common Web3 errors
    if (error?.code) {
      switch (error.code) {
        case 4001:
          message = 'Transaction rejected by user';
          break;
        case -32603:
          message = 'Internal JSON-RPC error. Please check your wallet connection';
          break;
        case -32002:
          message = 'Please check your wallet - a request is already pending';
          break;
        default:
          if (error?.message) {
            message = error.message;
          }
      }
    }

    // Handle specific contract errors
    if (error?.reason) {
      message = error.reason;
    }

    setTxState({
      isOpen: true,
      title: 'Error',
      message,
      status: 'error'
    });
  }, []);

  const startTransaction = useCallback((title: string, message: string) => {
    setTxState({
      isOpen: true,
      title,
      message,
      status: 'pending'
    });
  }, []);

  const updateTransaction = useCallback((txHash: string) => {
    setTxState(prev => ({
      ...prev,
      txHash
    }));
  }, []);

  const completeTransaction = useCallback((success: boolean, message?: string) => {
    setTxState(prev => ({
      ...prev,
      status: success ? 'success' : 'error',
      message: message || prev.message
    }));
  }, []);

  const closeModal = useCallback(() => {
    setTxState(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  return {
    txState,
    handleError,
    startTransaction,
    updateTransaction,
    completeTransaction,
    closeModal
  };
}
