import { NextRequest, NextResponse } from 'next/server';

/**
 * Mock Lock Status API
 * GET /api/lock/status/:lockId
 *
 * Returns the status of a lock (mock implementation)
 */

interface LockStatusResponse {
  lock_id: string;
  status: 'pending' | 'confirming' | 'confirmed' | 'failed';
  amount: string;
  period_years: number;
  unlock_date: string;
  tx_hash: string;
  confirmations: number;
  created_at: string;
  updated_at: string;
}

interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

// Mock confirmations tracker (simulates block confirmations)
const confirmationTracker = new Map<string, { confirmations: number; createdAt: number }>();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lockId: string }> }
): Promise<NextResponse<LockStatusResponse | ErrorResponse>> {
  try {
    const { lockId } = await params;

    // Validate lock ID format
    if (!lockId.startsWith('0x') || lockId.length < 10) {
      return NextResponse.json(
        { error: { code: 'INVALID_LOCK_ID', message: 'Invalid lock ID format' } },
        { status: 400 }
      );
    }

    // Initialize or get confirmation tracker
    if (!confirmationTracker.has(lockId)) {
      confirmationTracker.set(lockId, {
        confirmations: 0,
        createdAt: Date.now(),
      });
    }

    const tracker = confirmationTracker.get(lockId)!;

    // Simulate confirmations increasing over time (1 confirmation per 2 seconds)
    const elapsedSeconds = (Date.now() - tracker.createdAt) / 1000;
    tracker.confirmations = Math.min(Math.floor(elapsedSeconds / 2), 12);
    confirmationTracker.set(lockId, tracker);

    // Determine status based on confirmations
    let status: 'pending' | 'confirming' | 'confirmed' | 'failed' = 'pending';
    if (tracker.confirmations >= 6) {
      status = 'confirmed';
    } else if (tracker.confirmations >= 1) {
      status = 'confirming';
    }

    // Calculate unlock date (mock: 2 years from now as default)
    const unlockDate = new Date();
    unlockDate.setFullYear(unlockDate.getFullYear() + 2);

    // Mock response
    const response: LockStatusResponse = {
      lock_id: lockId,
      status,
      amount: '5.00', // Mock amount
      period_years: 2,
      unlock_date: unlockDate.toISOString(),
      tx_hash: lockId, // Use lock ID as tx hash for simplicity
      confirmations: tracker.confirmations,
      created_at: new Date(tracker.createdAt).toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
