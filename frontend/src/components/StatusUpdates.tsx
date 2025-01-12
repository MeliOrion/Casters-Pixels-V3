import { useEffect, useState } from 'react';
import { StatusUpdate } from '../hooks/useContractEvents';

interface StatusUpdatesProps {
  updates: StatusUpdate[];
}

export function StatusUpdates({ updates }: StatusUpdatesProps) {
  const [visibleUpdates, setVisibleUpdates] = useState<StatusUpdate[]>([]);

  // Keep only the last 5 updates
  useEffect(() => {
    setVisibleUpdates(updates.slice(-5));
  }, [updates]);

  const getStatusColor = (type: StatusUpdate['type']) => {
    switch (type) {
      case 'legendary':
        return 'bg-yellow-500';
      case 'complete':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'request':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-2">
      {visibleUpdates.map((update, index) => (
        <div
          key={update.timestamp}
          className={`p-3 rounded-lg text-white ${getStatusColor(update.type)} 
            transition-all duration-300 ease-in-out`}
          style={{
            opacity: 1 - (visibleUpdates.length - 1 - index) * 0.2,
            transform: `scale(${1 - (visibleUpdates.length - 1 - index) * 0.02})`
          }}
        >
          <p className="font-medium">{update.message}</p>
          <p className="text-xs opacity-75">
            {new Date(update.timestamp).toLocaleTimeString()}
          </p>
        </div>
      ))}
    </div>
  );
}
