import { type Address } from 'viem';

/**
 * Zero address constant - used for validation
 */
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

/**
 * Validate that an address is not the zero address
 */
function isValidAddress(address: string | undefined): address is Address {
  return !!address && 
         address.length === 42 && 
         address.startsWith('0x') && 
         address !== ZERO_ADDRESS;
}

/**
 * Get environment variable with validation
 * Throws in production if required address is missing or zero
 */
function getRequiredAddress(
  envVar: string | undefined,
  name: string,
  defaultForDev?: Address
): Address {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isValidAddress(envVar)) {
    return envVar;
  }
  
  // In development, allow defaults for local testing
  if (!isProduction && defaultForDev) {
    console.warn(
      `⚠️ [${name}] Using development default address. ` +
      `Set environment variable for production.`
    );
    return defaultForDev;
  }
  
  // In production, missing required addresses are fatal
  if (isProduction) {
    throw new Error(
      `🚨 CRITICAL: ${name} is not configured or is zero address. ` +
      `This is required for production deployment.`
    );
  }
  
  // In development without default, warn but return zero
  console.error(
    `❌ [${name}] Not configured. Contract interactions will fail.`
  );
  return ZERO_ADDRESS;
}

/**
 * Contract addresses for Quantum Shield
 * 
 * IMPORTANT: These must be set correctly for production deployment.
 * Zero addresses will cause all contract interactions to fail.
 * 
 * Required environment variables:
 * - NEXT_PUBLIC_QS_VAULT_ADDRESS: L1 Vault contract
 * - NEXT_PUBLIC_QS_VERIFIER_ADDRESS: STARK verifier contract
 * - NEXT_PUBLIC_QS_TOKEN_ADDRESS: QS token contract
 * - NEXT_PUBLIC_QS_GOVERNANCE_ADDRESS: Governance contract
 * - NEXT_PUBLIC_QS_TIMELOCK_ADDRESS: Timelock controller
 */
export const contracts = {
  /**
   * L1 Quantum Shield Vault
   * Holds locked assets and manages unlock requests
   */
  vault: getRequiredAddress(
    process.env.NEXT_PUBLIC_QS_VAULT_ADDRESS,
    'QS_VAULT_ADDRESS'
  ),

  /**
   * STARK Proof Verifier
   * Verifies ZK-STARK proofs for unlock authorization
   */
  verifier: getRequiredAddress(
    process.env.NEXT_PUBLIC_QS_VERIFIER_ADDRESS,
    'QS_VERIFIER_ADDRESS'
  ),

  /**
   * QS Governance Token
   * Used for voting and staking
   */
  token: getRequiredAddress(
    process.env.NEXT_PUBLIC_QS_TOKEN_ADDRESS,
    'QS_TOKEN_ADDRESS'
  ),

  /**
   * Governance Contract
   * Manages proposals and voting
   */
  governance: getRequiredAddress(
    process.env.NEXT_PUBLIC_QS_GOVERNANCE_ADDRESS,
    'QS_GOVERNANCE_ADDRESS'
  ),

  /**
   * Timelock Controller
   * Enforces time delays on governance actions
   */
  timelock: getRequiredAddress(
    process.env.NEXT_PUBLIC_QS_TIMELOCK_ADDRESS,
    'QS_TIMELOCK_ADDRESS'
  ),
} as const;

/**
 * Validate all contract addresses on module load
 * Returns validation status for each contract
 */
export function validateContractAddresses(): {
  isValid: boolean;
  missing: string[];
  zeroAddress: string[];
} {
  const missing: string[] = [];
  const zeroAddress: string[] = [];

  const entries = Object.entries(contracts) as [keyof typeof contracts, Address][];
  
  for (const [name, address] of entries) {
    if (!address || address === ZERO_ADDRESS) {
      if (!process.env[`NEXT_PUBLIC_QS_${name.toUpperCase()}_ADDRESS`]) {
        missing.push(name);
      } else {
        zeroAddress.push(name);
      }
    }
  }

  return {
    isValid: missing.length === 0 && zeroAddress.length === 0,
    missing,
    zeroAddress,
  };
}

/**
 * Type-safe contract addresses
 */
export type ContractName = keyof typeof contracts;
