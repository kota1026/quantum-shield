/**
 * UI-005: Provider Registration Flow
 * 
 * Reference: UI_UX_FUNCTIONAL_REQUIREMENTS_JP.md §2.2
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useState } from 'react';

const schema = z.object({
  name: z.string().min(2),
  type: z.enum(['enterprise', 'decentralized']),
  contactEmail: z.string().email(),
  companyId: z.string().optional(),
});

export function ProviderRegistration() {
  const navigate = useNavigate();
  const [editionType, setEditionType] = useState<'enterprise' | 'decentralized'>('enterprise');

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema), defaultValues: { type: 'enterprise' } });

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/api/providers/register', data),
    onSuccess: () => navigate('/providers'),
  });

  return (
    <div className="max-w-3xl mx-auto" data-testid="provider-registration">
      <h1 className="text-2xl font-bold mb-6">Register Service Provider</h1>

      {/* Edition Selection */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button type="button" onClick={() => setEditionType('enterprise')} className={`p-6 rounded-lg border-2 text-left ${editionType === 'enterprise' ? 'border-purple-500 bg-purple-50' : 'border-gray-200'}`}>
          <h3 className="font-bold text-purple-800">🏛️ Enterprise Edition</h3>
          <ul className="text-sm text-gray-600 mt-2 space-y-1">
            <li>✓ SLA Guarantee</li><li>✓ Dedicated Support</li><li>✓ Compliance Reports</li><li>✓ Custom Configuration</li>
          </ul>
        </button>
        <button type="button" onClick={() => setEditionType('decentralized')} className={`p-6 rounded-lg border-2 text-left ${editionType === 'decentralized' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
          <h3 className="font-bold text-blue-800">🌐 Decentralized Edition</h3>
          <ul className="text-sm text-gray-600 mt-2 space-y-1">
            <li>✓ Token Voting</li><li>✓ Permissionless Provers</li><li>✓ Community Support</li><li>✓ Open Governance</li>
          </ul>
        </button>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate({ ...d, type: editionType }))} className="bg-white rounded-lg shadow p-6 space-y-4">
        <input type="hidden" {...register('type')} value={editionType} />
        <div>
          <label className="block text-sm font-medium">Organization Name</label>
          <input {...register('name')} className="mt-1 w-full border rounded-lg p-2" />
          {errors.name && <p className="text-red-600 text-sm">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium">Contact Email</label>
          <input type="email" {...register('contactEmail')} className="mt-1 w-full border rounded-lg p-2" />
          {errors.contactEmail && <p className="text-red-600 text-sm">{errors.contactEmail.message}</p>}
        </div>
        {editionType === 'enterprise' && (
          <div>
            <label className="block text-sm font-medium">Company Registration ID</label>
            <input {...register('companyId')} className="mt-1 w-full border rounded-lg p-2" />
          </div>
        )}
        <button type="submit" disabled={mutation.isPending} className="w-full py-3 bg-qs-primary text-white rounded-lg hover:bg-qs-secondary disabled:opacity-50">
          {mutation.isPending ? 'Submitting...' : 'Register'}
        </button>
      </form>
    </div>
  );
}