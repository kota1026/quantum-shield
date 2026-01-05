// Quantum Shield Vault contract ABI and addresses
// Generated from contracts/src/QuantumShieldVault.sol

export const QS_VAULT_ADDRESS = (process.env.NEXT_PUBLIC_QS_VAULT_ADDRESS ||
  '0x0000000000000000000000000000000000000000') as `0x${string}`;

export const QS_VAULT_ABI = [
  {
    type: 'function',
    name: 'lock',
    inputs: [
      { name: 'dilithiumPublicKey', type: 'bytes', internalType: 'bytes' },
      { name: 'userSignature', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [{ name: 'lockId', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'requestUnlock',
    inputs: [
      { name: 'lockId', type: 'uint256', internalType: 'uint256' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
      { name: 'dilithiumSignature', type: 'bytes', internalType: 'bytes' },
    ],
    outputs: [{ name: 'unlockId', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'executeUnlock',
    inputs: [{ name: 'unlockId', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'requestEmergencyUnlock',
    inputs: [
      { name: 'lockId', type: 'uint256', internalType: 'uint256' },
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [{ name: 'unlockId', type: 'uint256', internalType: 'uint256' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'getLock',
    inputs: [{ name: 'lockId', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct IQSVault.Lock',
        components: [
          { name: 'owner', type: 'address', internalType: 'address' },
          { name: 'amount', type: 'uint256', internalType: 'uint256' },
          { name: 'dilithiumPublicKey', type: 'bytes', internalType: 'bytes' },
          { name: 'lockedAt', type: 'uint256', internalType: 'uint256' },
          { name: 'status', type: 'uint8', internalType: 'enum IQSVault.LockStatus' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getUnlockRequest',
    inputs: [{ name: 'unlockId', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct IQSVault.UnlockRequest',
        components: [
          { name: 'lockId', type: 'uint256', internalType: 'uint256' },
          { name: 'amount', type: 'uint256', internalType: 'uint256' },
          { name: 'requestedAt', type: 'uint256', internalType: 'uint256' },
          { name: 'unlockTime', type: 'uint256', internalType: 'uint256' },
          { name: 'isEmergency', type: 'bool', internalType: 'bool' },
          { name: 'status', type: 'uint8', internalType: 'enum IQSVault.UnlockStatus' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getUserLocks',
    inputs: [{ name: 'user', type: 'address', internalType: 'address' }],
    outputs: [{ name: '', type: 'uint256[]', internalType: 'uint256[]' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'Locked',
    inputs: [
      { name: 'lockId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'owner', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'UnlockRequested',
    inputs: [
      { name: 'unlockId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'lockId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'unlockTime', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'Unlocked',
    inputs: [
      { name: 'unlockId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'lockId', type: 'uint256', indexed: true, internalType: 'uint256' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
] as const;
