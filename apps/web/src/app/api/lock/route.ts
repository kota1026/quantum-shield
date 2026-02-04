import { NextRequest, NextResponse } from 'next/server';

/**
 * Mock Lock API
 * POST /api/lock
 *
 * Creates a new lock (mock implementation)
 */

interface LockRequest {
  amount: string;
  period_years: number;
  dilithium_pubkey?: string;
}

interface LockResponse {
  lock_id: string;
  status: 'pending';
  amount: string;
  period_years: number;
  unlock_date: string;
  tx_hash: string;
  created_at: string;
}

interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

// Mock storage for locks (in-memory, resets on server restart)
const mockLocks = new Map<string, LockResponse>();

// Generate mock lock ID
function generateLockId(): string {
  const chars = '0123456789abcdef';
  let id = '0x';
  for (let i = 0; i < 64; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// Generate mock tx hash
function generateTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

export async function POST(request: NextRequest): Promise<NextResponse<LockResponse | ErrorResponse>> {
  try {
    const body: LockRequest = await request.json();

    // Validation
    const amount = parseFloat(body.amount);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: { code: 'INVALID_AMOUNT', message: 'Amount must be a positive number' } },
        { status: 400 }
      );
    }

    if (amount < 0.01) {
      return NextResponse.json(
        { error: { code: 'INVALID_AMOUNT', message: 'Minimum lock amount is 0.01 ETH' } },
        { status: 400 }
      );
    }

    const validPeriods = [1, 2, 3, 5];
    if (!validPeriods.includes(body.period_years)) {
      return NextResponse.json(
        { error: { code: 'INVALID_PERIOD', message: 'Period must be 1, 2, 3, or 5 years' } },
        { status: 400 }
      );
    }

    // Calculate unlock date
    const unlockDate = new Date();
    unlockDate.setFullYear(unlockDate.getFullYear() + body.period_years);

    // Create mock lock
    const lockId = generateLockId();
    const lock: LockResponse = {
      lock_id: lockId,
      status: 'pending',
      amount: body.amount,
      period_years: body.period_years,
      unlock_date: unlockDate.toISOString(),
      tx_hash: generateTxHash(),
      created_at: new Date().toISOString(),
    };

    // Store in mock storage
    mockLocks.set(lockId, lock);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return NextResponse.json(lock, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

