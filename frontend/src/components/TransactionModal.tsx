'use client';

interface TransactionModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  status: 'pending' | 'success' | 'error';
  txHash?: string;
  onClose: () => void;
}

export function TransactionModal({
  isOpen,
  title,
  message,
  status,
  txHash,
  onClose
}: TransactionModalProps) {
  if (!isOpen) return null;

  const statusColors = {
    pending: 'border-yellow-500',
    success: 'border-green-500',
    error: 'border-red-500'
  };

  const statusIcons = {
    pending: '⏳',
    success: '✅',
    error: '❌'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border-4 ${statusColors[status]}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            {statusIcons[status]} {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <p className="mb-4 text-gray-600 dark:text-gray-300">{message}</p>
        
        {txHash && (
          <div className="mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Transaction Hash:</p>
            <a
              href={`https://basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700 break-all"
            >
              {txHash}
            </a>
          </div>
        )}

        {status === 'pending' && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        )}
      </div>
    </div>
  );
}
