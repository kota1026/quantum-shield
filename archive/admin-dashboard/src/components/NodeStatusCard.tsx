interface Node {
  id: string;
  status: 'healthy' | 'warning' | 'error';
  blockHeight: number;
}

export function NodeStatusCard({ node }: { node: Node }) {
  const statusColors = {
    healthy: 'bg-green-100 text-green-800 border-green-300',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    error: 'bg-red-100 text-red-800 border-red-300',
  };

  const statusIcons = {
    healthy: '✅',
    warning: '⚠️',
    error: '❌',
  };

  return (
    <div className={`p-4 rounded-lg border ${statusColors[node.status]}`}>
      <div className="flex items-center justify-between">
        <span className="font-medium">{node.id}</span>
        <span>{statusIcons[node.status]}</span>
      </div>
      <p className="text-sm mt-2">Block: {node.blockHeight.toLocaleString()}</p>
      <p className="text-xs mt-1 capitalize">Status: {node.status}</p>
    </div>
  );
}