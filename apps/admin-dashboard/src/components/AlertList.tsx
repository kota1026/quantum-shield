import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function AlertList() {
  // Mock alerts for now
  const alerts = [
    { id: 1, type: 'info', message: 'System operating normally', time: '2 minutes ago' },
    { id: 2, type: 'success', message: 'Prover QS-Alpha completed 100 signatures', time: '15 minutes ago' },
  ];

  const typeStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  };

  if (alerts.length === 0) {
    return <p className="text-gray-500">No recent alerts</p>;
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert: any) => (
        <div
          key={alert.id}
          className={`p-3 rounded-lg border ${typeStyles[alert.type as keyof typeof typeStyles]}`}
        >
          <div className="flex justify-between">
            <span>{alert.message}</span>
            <span className="text-sm opacity-75">{alert.time}</span>
          </div>
        </div>
      ))}
    </div>
  );
}