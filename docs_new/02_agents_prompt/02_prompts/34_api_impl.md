# 34_api_impl.md - API Implementation Prompt
## Phase 6: API実装（モックデータ禁止）

> **Version**: 1.0
> **Date**: 2026-01-13
> **Purpose**: 8システム対応のAPI実装
> **Structure**: Anthropic Claude 4.x XML Best Practices準拠

---

## 1. Overview

<purpose>
8システムのAPIエンドポイントを実装する。
モックデータの返却は禁止し、必ず実データベースまたはブロックチェーンに接続する。
</purpose>

<critical_rules>
  <rule id="CR-1" level="ABSOLUTE">
    モックデータの返却は禁止。
    データベースがない場合は、まず報告してから対応方法を検討する。
  </rule>
  <rule id="CR-2" level="ABSOLUTE">
    APIはSEQUENCES.mdで定義されたフローに準拠する。
  </rule>
  <rule id="CR-3" level="ABSOLUTE">
    認証・認可はWallet Signature + JWT方式を使用する。
  </rule>
</critical_rules>

---

## 2. Required Context

<required_context>
  <constitution priority="MUST_READ">
    <path>docs_new/00_core/CORE_PRINCIPLES.md</path>
    <purpose>不変原則の遵守</purpose>
  </constitution>

  <sequences priority="MUST_READ">
    <path>docs_new/00_core/specs/SEQUENCES.md</path>
    <purpose>APIフロー定義</purpose>
  </sequences>

  <unified_spec priority="MUST_READ">
    <path>docs_new/00_core/specs/UNIFIED_SPEC.md</path>
    <purpose>システム仕様</purpose>
  </unified_spec>

  <db_schema priority="MUST_READ">
    <path>prisma/schema.prisma</path>
    <purpose>データベーススキーマ</purpose>
    <note>存在しない場合は35_db_design.mdを先に実行</note>
  </db_schema>
</required_context>

---

## 3. Pre-Implementation Check

<pre_check>
### データベース存在確認

```bash
# スキーマファイルの存在確認
ls prisma/schema.prisma

# マイグレーション状態確認
npx prisma migrate status
```

| チェック項目 | 結果 | 対応 |
|-------------|:----:|------|
| schema.prisma存在 | ⬜ | なければ35_db_design.md実行 |
| マイグレーション完了 | ⬜ | 未完了なら`npx prisma migrate dev` |
| DB接続確認 | ⬜ | `.env`のDATABASE_URL確認 |

```
❌ データベースがない場合:
  → 作業を停止
  → 「データベースがありません。35_db_design.mdを先に実行してください」と報告
  → ユーザーの指示を待つ
```
</pre_check>

---

## 4. API Architecture

### 4.1 全体構成

<architecture>
```
apps/api/
├── src/
│   ├── routes/
│   │   ├── consumer/           # System 01
│   │   │   ├── lock.ts
│   │   │   ├── unlock.ts
│   │   │   └── history.ts
│   │   ├── token-hub/          # System 02
│   │   ├── governance/         # System 03
│   │   ├── prover/             # System 04
│   │   ├── observer/           # System 05
│   │   ├── explorer/           # System 06
│   │   ├── enterprise/         # System 07
│   │   └── admin/              # System 08
│   │
│   ├── services/
│   │   ├── LockService.ts
│   │   ├── UnlockService.ts
│   │   ├── ProverService.ts
│   │   └── ...
│   │
│   ├── repositories/
│   │   ├── LockRepository.ts
│   │   ├── UserRepository.ts
│   │   └── ...
│   │
│   ├── middleware/
│   │   ├── auth.ts             # Wallet Signature + JWT
│   │   ├── rateLimit.ts
│   │   └── errorHandler.ts
│   │
│   └── lib/
│       ├── prisma.ts           # Prisma Client
│       ├── ethereum.ts         # ethers.js/viem
│       └── aegis.ts            # L3 Aegis接続
│
└── openapi/
    └── spec.yaml               # OpenAPI 3.0仕様
```
</architecture>

### 4.2 システム別API一覧

<api_endpoints>

#### System 01: Consumer App
| Method | Endpoint | 機能 |
|--------|----------|------|
| POST | `/api/consumer/lock` | 資産ロック |
| POST | `/api/consumer/unlock/request` | アンロック申請 |
| POST | `/api/consumer/unlock/sign` | Dilithium署名提出 |
| GET | `/api/consumer/locks` | ロック一覧取得 |
| GET | `/api/consumer/locks/:id` | ロック詳細取得 |
| GET | `/api/consumer/history` | トランザクション履歴 |
| POST | `/api/consumer/emergency` | 緊急アンロック |

#### System 02: Token Hub
| Method | Endpoint | 機能 |
|--------|----------|------|
| POST | `/api/token-hub/lock` | QS→veQSロック |
| GET | `/api/token-hub/balance` | veQS残高取得 |
| POST | `/api/token-hub/delegate` | 委任設定 |
| GET | `/api/token-hub/delegates` | 委任先一覧 |
| GET | `/api/token-hub/rewards` | 報酬取得 |
| POST | `/api/token-hub/claim` | 報酬請求 |

#### System 03: Governance
| Method | Endpoint | 機能 |
|--------|----------|------|
| GET | `/api/governance/proposals` | 提案一覧 |
| GET | `/api/governance/proposals/:id` | 提案詳細 |
| POST | `/api/governance/proposals` | 提案作成 |
| POST | `/api/governance/vote` | 投票 |
| GET | `/api/governance/council` | 評議会情報 |

#### System 04: Prover Portal
| Method | Endpoint | 機能 |
|--------|----------|------|
| POST | `/api/prover/apply` | Prover申請 |
| GET | `/api/prover/status` | 申請状況 |
| POST | `/api/prover/activate` | アクティベーション |
| GET | `/api/prover/queue` | 処理キュー |
| GET | `/api/prover/metrics` | パフォーマンス指標 |
| POST | `/api/prover/respond` | チャレンジ応答 |
| POST | `/api/prover/exit` | 退出申請 |

#### System 05: Observer
| Method | Endpoint | 機能 |
|--------|----------|------|
| GET | `/api/observer/pending` | 保留中TX |
| GET | `/api/observer/suspicious` | 疑わしいTX |
| POST | `/api/observer/challenge` | チャレンジ作成 |
| GET | `/api/observer/challenges/:id` | チャレンジ状況 |
| GET | `/api/observer/earnings` | 報酬履歴 |

#### System 06: Explorer
| Method | Endpoint | 機能 |
|--------|----------|------|
| GET | `/api/explorer/overview` | プロトコル概要 |
| GET | `/api/explorer/search` | 検索 |
| GET | `/api/explorer/locks` | ロック一覧（公開） |
| GET | `/api/explorer/unlocks` | アンロック一覧（公開） |
| GET | `/api/explorer/provers` | Prover一覧（公開） |
| GET | `/api/explorer/address/:address` | アドレス詳細 |

#### System 07: Enterprise Admin
| Method | Endpoint | 機能 |
|--------|----------|------|
| GET | `/api/enterprise/dashboard` | ダッシュボード |
| GET | `/api/enterprise/transactions` | TX一覧 |
| GET | `/api/enterprise/users` | ユーザー一覧 |
| POST | `/api/enterprise/users` | ユーザー作成 |
| GET | `/api/enterprise/api-keys` | APIキー一覧 |
| POST | `/api/enterprise/api-keys` | APIキー作成 |
| GET | `/api/enterprise/reports/monthly` | 月次レポート |
| GET | `/api/enterprise/audit-log` | 監査ログ |

#### System 08: QS Admin
| Method | Endpoint | 機能 |
|--------|----------|------|
| GET | `/api/admin/dashboard` | 運営ダッシュボード |
| POST | `/api/admin/emergency/pause` | 緊急停止 |
| GET | `/api/admin/provers` | Prover管理 |
| GET | `/api/admin/nodes` | ノード状態 |
| PUT | `/api/admin/parameters` | パラメータ更新 |

</api_endpoints>

---

## 5. Implementation Process

### STEP 1: OpenAPI仕様作成

<openapi_template>
```yaml
# openapi/spec.yaml
openapi: 3.0.3
info:
  title: Quantum Shield API
  version: 1.0.0
  description: |
    Quantum-resistant asset protection protocol API.

    ⚠️ All endpoints return real data from database/blockchain.
    Mock data is strictly prohibited.

servers:
  - url: https://api.quantumshield.io/v1
    description: Production
  - url: https://api.sepolia.quantumshield.io/v1
    description: Sepolia Testnet

security:
  - WalletSignature: []
  - BearerAuth: []

paths:
  /consumer/lock:
    post:
      summary: Lock assets with quantum-resistant protection
      tags: [Consumer]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LockRequest'
      responses:
        '200':
          description: Lock initiated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LockResponse'
        '400':
          $ref: '#/components/responses/BadRequest'
        '401':
          $ref: '#/components/responses/Unauthorized'

components:
  schemas:
    LockRequest:
      type: object
      required:
        - amount
        - tokenAddress
        - lockDuration
        - dilithiumPublicKey
      properties:
        amount:
          type: string
          description: Amount in wei
          example: "1000000000000000000"
        tokenAddress:
          type: string
          description: ERC20 token address
          example: "0x..."
        lockDuration:
          type: integer
          description: Lock duration in seconds
          example: 86400
        dilithiumPublicKey:
          type: string
          description: Dilithium public key (hex)

    LockResponse:
      type: object
      properties:
        lockId:
          type: string
          format: uuid
        txHash:
          type: string
        status:
          type: string
          enum: [pending, confirmed, failed]

  securitySchemes:
    WalletSignature:
      type: http
      scheme: bearer
      description: EIP-4361 SIWE signature
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```
</openapi_template>

### STEP 2: 認証・認可実装

<auth_implementation>
```typescript
// src/middleware/auth.ts

import { NextRequest, NextResponse } from 'next/server';
import { verifyMessage } from 'viem';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

interface AuthResult {
  authenticated: boolean;
  address?: string;
  error?: string;
}

/**
 * Wallet Signature + JWT 認証
 *
 * Flow:
 * 1. フロントエンドでSIWE署名を生成
 * 2. /auth/login で署名検証 → JWT発行
 * 3. 以降のリクエストはJWTで認証
 */
export async function authenticateRequest(
  req: NextRequest
): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return { authenticated: false, error: 'Missing authorization header' };
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      address: string;
      exp: number;
    };

    // ユーザー存在確認（実DB接続）
    const user = await prisma.user.findUnique({
      where: { walletAddress: decoded.address },
    });

    if (!user) {
      return { authenticated: false, error: 'User not found' };
    }

    return { authenticated: true, address: decoded.address };
  } catch (error) {
    return { authenticated: false, error: 'Invalid token' };
  }
}

/**
 * SIWE署名検証
 */
export async function verifySIWE(
  message: string,
  signature: string,
  expectedAddress: string
): Promise<boolean> {
  try {
    const recoveredAddress = await verifyMessage({
      message,
      signature: signature as `0x${string}`,
    });

    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
  } catch {
    return false;
  }
}
```
</auth_implementation>

### STEP 3: リポジトリ層実装

<repository_pattern>
```typescript
// src/repositories/LockRepository.ts

import { prisma } from '@/lib/prisma';
import { Lock, LockStatus, Prisma } from '@prisma/client';

/**
 * ⚠️ CRITICAL: 全てのデータ操作は実DBを通じて行う
 * モックデータの返却は禁止
 */
export class LockRepository {
  /**
   * ロック作成
   */
  async create(data: Prisma.LockCreateInput): Promise<Lock> {
    return prisma.lock.create({
      data,
      include: {
        user: true,
        token: true,
      },
    });
  }

  /**
   * ロック取得（ID指定）
   */
  async findById(id: string): Promise<Lock | null> {
    return prisma.lock.findUnique({
      where: { id },
      include: {
        user: true,
        token: true,
        unlockRequest: true,
      },
    });
  }

  /**
   * ユーザーのロック一覧
   */
  async findByUser(
    userAddress: string,
    options?: {
      status?: LockStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<Lock[]> {
    return prisma.lock.findMany({
      where: {
        user: { walletAddress: userAddress },
        ...(options?.status && { status: options.status }),
      },
      include: {
        token: true,
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 20,
      skip: options?.offset ?? 0,
    });
  }

  /**
   * ロックステータス更新
   */
  async updateStatus(id: string, status: LockStatus): Promise<Lock> {
    return prisma.lock.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    });
  }
}
```
</repository_pattern>

### STEP 4: サービス層実装

<service_pattern>
```typescript
// src/services/LockService.ts

import { LockRepository } from '@/repositories/LockRepository';
import { L1VaultService } from '@/services/L1VaultService';
import { AegisService } from '@/services/AegisService';
import { Lock, LockStatus } from '@prisma/client';

interface LockInput {
  userAddress: string;
  amount: bigint;
  tokenAddress: string;
  lockDuration: number;
  dilithiumPublicKey: string;
}

interface LockResult {
  lock: Lock;
  txHash: string;
}

/**
 * ロックサービス
 *
 * SEQUENCES.md SEQ-001準拠:
 * 1. フロントエンド → API → L1 Vault
 * 2. L1 Vault → L3 Aegis（状態同期）
 * 3. L3 Aegis → SMT更新
 */
export class LockService {
  constructor(
    private lockRepo: LockRepository,
    private l1Vault: L1VaultService,
    private aegis: AegisService
  ) {}

  /**
   * 資産ロック実行
   */
  async lock(input: LockInput): Promise<LockResult> {
    // 1. DBにロックレコード作成（pending状態）
    const lock = await this.lockRepo.create({
      user: { connect: { walletAddress: input.userAddress } },
      amount: input.amount.toString(),
      tokenAddress: input.tokenAddress,
      lockDuration: input.lockDuration,
      dilithiumPublicKey: input.dilithiumPublicKey,
      status: LockStatus.PENDING,
    });

    try {
      // 2. L1 Vaultでロック実行
      const txHash = await this.l1Vault.lock({
        lockId: lock.id,
        amount: input.amount,
        tokenAddress: input.tokenAddress,
        lockDuration: input.lockDuration,
      });

      // 3. L3 Aegisに同期
      await this.aegis.syncLock(lock.id);

      // 4. ステータス更新
      const updatedLock = await this.lockRepo.updateStatus(
        lock.id,
        LockStatus.CONFIRMED
      );

      return { lock: updatedLock, txHash };
    } catch (error) {
      // エラー時はステータスをFAILEDに
      await this.lockRepo.updateStatus(lock.id, LockStatus.FAILED);
      throw error;
    }
  }
}
```
</service_pattern>

### STEP 5: APIルート実装

<api_route>
```typescript
// src/routes/consumer/lock.ts (Next.js App Router)

import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/middleware/auth';
import { LockService } from '@/services/LockService';
import { LockRepository } from '@/repositories/LockRepository';
import { L1VaultService } from '@/services/L1VaultService';
import { AegisService } from '@/services/AegisService';
import { z } from 'zod';

// バリデーションスキーマ
const LockRequestSchema = z.object({
  amount: z.string().regex(/^\d+$/),
  tokenAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  lockDuration: z.number().int().min(86400).max(31536000),
  dilithiumPublicKey: z.string(),
});

export async function POST(req: NextRequest) {
  // 1. 認証
  const auth = await authenticateRequest(req);
  if (!auth.authenticated) {
    return NextResponse.json(
      { error: auth.error },
      { status: 401 }
    );
  }

  // 2. バリデーション
  const body = await req.json();
  const parsed = LockRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.errors },
      { status: 400 }
    );
  }

  // 3. サービス実行
  const lockService = new LockService(
    new LockRepository(),
    new L1VaultService(),
    new AegisService()
  );

  try {
    const result = await lockService.lock({
      userAddress: auth.address!,
      amount: BigInt(parsed.data.amount),
      tokenAddress: parsed.data.tokenAddress,
      lockDuration: parsed.data.lockDuration,
      dilithiumPublicKey: parsed.data.dilithiumPublicKey,
    });

    return NextResponse.json({
      lockId: result.lock.id,
      txHash: result.txHash,
      status: result.lock.status,
    });
  } catch (error) {
    console.error('Lock failed:', error);
    return NextResponse.json(
      { error: 'Lock failed' },
      { status: 500 }
    );
  }
}
```
</api_route>

---

## 6. Blockchain Integration

### 6.1 L1 Vault接続

<l1_vault>
```typescript
// src/lib/ethereum.ts

import { createPublicClient, createWalletClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// Sepolia Testnet接続
export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL),
});

export const walletClient = createWalletClient({
  chain: sepolia,
  transport: http(process.env.SEPOLIA_RPC_URL),
  account: privateKeyToAccount(process.env.OPERATOR_PRIVATE_KEY as `0x${string}`),
});

// L1 Vault ABI（部分）
export const L1_VAULT_ABI = [
  {
    name: 'lock',
    type: 'function',
    inputs: [
      { name: 'lockId', type: 'bytes32' },
      { name: 'amount', type: 'uint256' },
      { name: 'tokenAddress', type: 'address' },
      { name: 'lockDuration', type: 'uint256' },
    ],
    outputs: [{ name: 'success', type: 'bool' }],
  },
] as const;
```
</l1_vault>

### 6.2 L3 Aegis接続

<l3_aegis>
```typescript
// src/lib/aegis.ts

import { createPublicClient, http } from 'viem';

// L3 Aegis (4ノードBFT)
const AEGIS_NODES = [
  process.env.AEGIS_NODE_1_URL,
  process.env.AEGIS_NODE_2_URL,
  process.env.AEGIS_NODE_3_URL,
  process.env.AEGIS_NODE_4_URL,
];

export class AegisClient {
  private clients: ReturnType<typeof createPublicClient>[];

  constructor() {
    this.clients = AEGIS_NODES.map((url) =>
      createPublicClient({
        transport: http(url),
      })
    );
  }

  /**
   * BFT合意状態取得（3/4ノード一致必要）
   */
  async getConsensusState(lockId: string): Promise<{
    isLocked: boolean;
    smtRoot: string;
  }> {
    const responses = await Promise.all(
      this.clients.map((client) =>
        client.readContract({
          address: process.env.AEGIS_CONTRACT_ADDRESS as `0x${string}`,
          abi: AEGIS_ABI,
          functionName: 'getLockState',
          args: [lockId],
        })
      )
    );

    // 3/4一致確認
    const consensus = this.checkConsensus(responses);
    if (!consensus.agreed) {
      throw new Error('BFT consensus not reached');
    }

    return consensus.state;
  }
}
```
</l3_aegis>

---

## 7. Error Handling

<error_handling>
```typescript
// src/middleware/errorHandler.ts

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export interface APIError {
  code: string;
  message: string;
  details?: unknown;
}

export function handleAPIError(error: unknown): NextResponse<APIError> {
  // Zodバリデーションエラー
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: error.errors,
      },
      { status: 400 }
    );
  }

  // Prismaエラー
  if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          code: 'DUPLICATE_ERROR',
          message: 'Resource already exists',
        },
        { status: 409 }
      );
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        {
          code: 'NOT_FOUND',
          message: 'Resource not found',
        },
        { status: 404 }
      );
    }
  }

  // ブロックチェーンエラー
  if (error instanceof Error && error.message.includes('revert')) {
    return NextResponse.json(
      {
        code: 'BLOCKCHAIN_ERROR',
        message: 'Transaction reverted',
        details: error.message,
      },
      { status: 422 }
    );
  }

  // 未知のエラー
  console.error('Unhandled error:', error);
  return NextResponse.json(
    {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
    { status: 500 }
  );
}
```
</error_handling>

---

## 8. Testing

<testing>
```typescript
// src/routes/consumer/__tests__/lock.test.ts

import { POST } from '../lock';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// ⚠️ テストでもモックは最小限に
// 実際のDB接続を使用（テスト用DB）

describe('POST /api/consumer/lock', () => {
  beforeEach(async () => {
    // テストDB初期化
    await prisma.lock.deleteMany();
    await prisma.user.deleteMany();

    // テストユーザー作成
    await prisma.user.create({
      data: {
        walletAddress: '0x1234567890123456789012345678901234567890',
      },
    });
  });

  it('creates a lock successfully', async () => {
    const req = new NextRequest('http://localhost/api/consumer/lock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${validToken}`,
      },
      body: JSON.stringify({
        amount: '1000000000000000000',
        tokenAddress: '0x...',
        lockDuration: 86400,
        dilithiumPublicKey: '0x...',
      }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.lockId).toBeDefined();
    expect(data.status).toBe('PENDING');

    // DBに保存されたか確認
    const lock = await prisma.lock.findUnique({
      where: { id: data.lockId },
    });
    expect(lock).not.toBeNull();
  });

  it('returns 401 without auth', async () => {
    const req = new NextRequest('http://localhost/api/consumer/lock', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid input', async () => {
    const req = new NextRequest('http://localhost/api/consumer/lock', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${validToken}`,
      },
      body: JSON.stringify({
        amount: 'invalid',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
```
</testing>

---

## 9. Checklist

<checklist>
  <category name="Pre-Implementation">
    <item>データベーススキーマ存在確認</item>
    <item>マイグレーション完了確認</item>
    <item>環境変数設定確認</item>
  </category>

  <category name="Implementation">
    <item>OpenAPI仕様作成</item>
    <item>認証・認可実装</item>
    <item>リポジトリ層実装</item>
    <item>サービス層実装</item>
    <item>APIルート実装</item>
    <item>エラーハンドリング実装</item>
  </category>

  <category name="Integration">
    <item>L1 Vault接続確認</item>
    <item>L3 Aegis接続確認</item>
    <item>Chainlink VRF接続確認（Prover選出）</item>
  </category>

  <category name="Testing">
    <item>ユニットテスト作成</item>
    <item>統合テスト作成</item>
    <item>E2Eテスト作成</item>
  </category>

  <category name="Forbidden">
    <item critical="true">モックデータ返却なし</item>
    <item critical="true">ハードコード秘密鍵なし</item>
  </category>
</checklist>

---

## 10. Output

```markdown
## API Implementation Report

### System: {SYSTEM_NAME}
### Date: YYYY-MM-DD

### Endpoints Implemented
| Method | Endpoint | Status |
|--------|----------|:------:|
| POST | /api/consumer/lock | ✅ |
| POST | /api/consumer/unlock | ✅ |

### Database Connections
- PostgreSQL: ✅ Connected
- L1 Vault: ✅ Connected
- L3 Aegis: ✅ Connected

### Test Coverage
- Statements: [X]%
- Branches: [X]%

### Next Steps
→ フロントエンドとの統合（30_ui_impl.md）
→ E2Eテスト（37_e2e_test.md）
```

---

**END OF PROMPT**
