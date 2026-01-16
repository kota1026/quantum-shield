// Quantum Shield Staking contract ABI and addresses
// For Prover staking operations

export const QS_STAKING_ADDRESS = (process.env.NEXT_PUBLIC_QS_STAKING_ADDRESS ||
  '0x0000000000000000000000000000000000000000') as `0x${string}`;

export const QS_STAKING_ABI = [
  {
    type: 'function',
    name: 'stake',
    inputs: [],
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    name: 'unstake',
    inputs: [{ name: 'amount', type: 'uint256', internalType: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'claimRewards',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getStake',
    inputs: [{ name: 'prover', type: 'address', internalType: 'address' }],
    outputs: [
      { name: 'amount', type: 'uint256', internalType: 'uint256' },
      { name: 'rewards', type: 'uint256', internalType: 'uint256' },
      { name: 'slashed', type: 'uint256', internalType: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'event',
    name: 'Staked',
    inputs: [
      { name: 'prover', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'Unstaked',
    inputs: [
      { name: 'prover', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
    ],
    anonymous: false,
  },
  {
    type: 'event',
    name: 'Slashed',
    inputs: [
      { name: 'prover', type: 'address', indexed: true, internalType: 'address' },
      { name: 'amount', type: 'uint256', indexed: false, internalType: 'uint256' },
      { name: 'reason', type: 'string', indexed: false, internalType: 'string' },
    ],
    anonymous: false,
  },
] as const;
