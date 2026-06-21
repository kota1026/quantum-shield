/**
 * UI-001: Prover Registration Interface
 * 
 * Reference: SEQUENCES.md #5 - Prover Registration
 * Requirements:
 * - HSM attestation upload
 * - Multisig (2-of-3) configuration
 * - Minimum stake validation ($400K Phase 1)
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useState } from 'react';

// Validation schema (SEQ#5 requirements)
const proverRegistrationSchema = z.object({
  operatorAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  name: z.string().min(3, 'Name must be at least 3 characters'),
  sphincsPublicKey: z.string().min(100, 'Invalid SPHINCS+ public key'),
  stakeAmount: z.number().min(400000, 'Minimum stake is $400,000'),
  multisigAddresses: z.array(
    z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address')
  ).length(3, 'Exactly 3 multisig addresses required'),
  hsmAttestation: z.any().optional(),
  legalAgreement: z.boolean().refine(val => val === true, 'You must accept the legal agreement'),
});

type ProverRegistrationForm = z.infer<typeof proverRegistrationSchema>;

export function ProverRegistration() {
  const navigate = useNavigate();
  const [hsmFile, setHsmFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<ProverRegistrationForm>({
    resolver: zodResolver(proverRegistrationSchema),
    defaultValues: { multisigAddresses: ['', '', ''], stakeAmount: 400000, legalAgreement: false },
  });

  const registerMutation = useMutation({
    mutationFn: (data: ProverRegistrationForm) => api.post('/api/provers/register', data),
    onSuccess: () => { setStatus('success'); setTimeout(() => navigate('/provers'), 2000); },
    onError: () => { setStatus('error'); },
  });

  const onSubmit = (data: ProverRegistrationForm) => { setStatus('pending'); registerMutation.mutate(data); };

  return (
    <div className="max-w-3xl mx-auto" data-testid="prover-registration">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Register New Prover</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-800">Registration Requirements (SEQ#5)</h3>
        <ul className="text-blue-700 text-sm mt-2 space-y-1">
          <li>- Minimum Stake: $400,000 (Phase 1)</li>
          <li>- HSM Required: Hardware Security Module attestation</li>
          <li>- Multisig: 2-of-3 approval configuration</li>
          <li>- Legal Agreement: Contract signature required</li>
        </ul>
      </div>

      {status === 'success' && (
        <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-6">Registration submitted! Status: Pending approval.</div>
      )}
      {status === 'error' && (
        <div className="bg-red-100 text-red-800 p-4 rounded-lg mb-6">Registration failed. Please try again.</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Prover Name</label>
          <input {...register('name')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" placeholder="QS Prover Alpha" />
          {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Operator Address</label>
          <input {...register('operatorAddress')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border font-mono" placeholder="0x..." />
          {errors.operatorAddress && <p className="text-red-600 text-sm mt-1">{errors.operatorAddress.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">SPHINCS+ Public Key</label>
          <textarea {...register('sphincsPublicKey')} rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border font-mono text-xs" placeholder="Base64 encoded SPHINCS+ public key (8KB)" />
          {errors.sphincsPublicKey && <p className="text-red-600 text-sm mt-1">{errors.sphincsPublicKey.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Stake Amount (USD)</label>
          <input type="number" {...register('stakeAmount', { valueAsNumber: true })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" min={400000} step={1000} />
          <p className="text-gray-500 text-sm mt-1">Minimum: $400,000</p>
          {errors.stakeAmount && <p className="text-red-600 text-sm mt-1">{errors.stakeAmount.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Multisig Addresses (2-of-3)</label>
          {[0, 1, 2].map((i) => (
            <input key={i} {...register(`multisigAddresses.${i}`)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border font-mono mb-2" placeholder={`Signer ${i + 1} address`} />
          ))}
          {errors.multisigAddresses && <p className="text-red-600 text-sm mt-1">All 3 valid addresses required</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">HSM Attestation</label>
          <input type="file" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setHsmFile(f); setValue('hsmAttestation', f); } }} className="mt-1 block w-full" accept=".json,.pem,.crt" />
          {hsmFile && <p className="text-green-600 text-sm mt-1">File: {hsmFile.name}</p>}
        </div>

        <div className="flex items-center">
          <input type="checkbox" {...register('legalAgreement')} className="rounded border-gray-300" id="legal" />
          <label htmlFor="legal" className="ml-2 text-sm text-gray-700">I agree to the Prover Operating Agreement and understand the slashing conditions</label>
        </div>
        {errors.legalAgreement && <p className="text-red-600 text-sm">{errors.legalAgreement.message}</p>}

        <button type="submit" disabled={status === 'pending'} className="w-full py-3 bg-qs-primary text-white rounded-lg hover:bg-qs-secondary disabled:opacity-50">
          {status === 'pending' ? 'Submitting...' : 'Submit Registration'}
        </button>
      </form>
    </div>
  );
}