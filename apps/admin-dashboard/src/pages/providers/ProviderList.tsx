/**
 * Provider List Page
 * 
 * Reference: UI_UX_FUNCTIONAL_REQUIREMENTS_JP.md §2.2 Service Provider
 */
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';

export function ProviderList() {
  const { data, isLoading } = useQuery({
    queryKey: ['providers'],
    queryFn: () => api.get<{ providers: any[] }>('/api/providers'),
  });

  if (isLoading) return <div className="animate-pulse">Loading providers...</div>;

  return (
    <div className="space-y-6" data-testid="provider-list">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Service Providers</h1>
        <Link to="/providers/register" className="px-4 py-2 bg-qs-primary text-white rounded-lg hover:bg-qs-secondary">+ Register Provider</Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">TVL</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monthly TX</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {data?.providers?.map((p: any) => (
              <tr key={p.id}>
                <td className="px-6 py-4 font-medium">{p.name}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs ${p.type === 'enterprise' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>{p.type}</span></td>
                <td className="px-6 py-4"><span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800 capitalize">{p.status}</span></td>
                <td className="px-6 py-4">${(p.tvl / 1e6).toFixed(1)}M</td>
                <td className="px-6 py-4">{p.monthlyTx?.toLocaleString()}</td>
                <td className="px-6 py-4"><Link to="/providers/bridge" className="text-qs-primary hover:underline text-sm">Configure</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}