# 35_db_design.md - Database Design Prompt
## Phase 6: データベース設計

> **Version**: 1.0
> **Date**: 2026-01-13
> **Purpose**: 8システム対応のPostgreSQL/Prismaスキーマ設計
> **Structure**: Anthropic Claude 4.x XML Best Practices準拠

---

## 1. Overview

<purpose>
Phase 6の8システムを支えるデータベーススキーマを設計する。
Prisma ORMを使用し、PostgreSQLをターゲットとする。
</purpose>

<workflow_position>
```
35_db_design.md (THIS)  →  34_api_impl.md  →  30_ui_impl.md
       ↓
   prisma/schema.prisma
       ↓
   npx prisma migrate dev
```
</workflow_position>

---

## 2. Required Context

<required_context>
  <constitution priority="MUST_READ">
    <path>docs_new/00_core/CORE_PRINCIPLES.md</path>
    <purpose>不変原則（特にCP-3: Cryptography, CP-4: Auditability）</purpose>
  </constitution>

  <unified_spec priority="MUST_READ">
    <path>docs_new/00_core/specs/UNIFIED_SPEC.md</path>
    <purpose>システム仕様とデータモデル</purpose>
  </unified_spec>

  <sequences priority="MUST_READ">
    <path>docs_new/00_core/specs/SEQUENCES.md</path>
    <purpose>データフロー理解</purpose>
  </sequences>
</required_context>

---

## 3. Database Architecture

### 3.1 全体構成

<architecture>
```
┌─────────────────────────────────────────────────────────────────────┐
│  DATABASE ARCHITECTURE                                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  PostgreSQL (Primary)                                               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                             │   │
│  │  Core Tables                                                │   │
│  │  ├── User                    # ユーザー（Wallet紐付け）      │   │
│  │  ├── Lock                    # ロック情報                   │   │
│  │  ├── UnlockRequest           # アンロック申請               │   │
│  │  ├── Transaction             # トランザクション履歴         │   │
│  │  └── DilithiumKey            # Dilithium公開鍵              │   │
│  │                                                             │   │
│  │  Token Economics                                            │   │
│  │  ├── TokenBalance            # QS/veQS残高                  │   │
│  │  ├── Delegation              # 委任情報                     │   │
│  │  └── Reward                  # 報酬履歴                     │   │
│  │                                                             │   │
│  │  Governance                                                 │   │
│  │  ├── Proposal                # 提案                         │   │
│  │  ├── Vote                    # 投票                         │   │
│  │  └── Council                 # 評議会                       │   │
│  │                                                             │   │
│  │  Prover Network                                             │   │
│  │  ├── Prover                  # Prover情報                   │   │
│  │  ├── ProverApplication       # 申請                         │   │
│  │  ├── Challenge               # チャレンジ                   │   │
│  │  └── Slashing                # Slashing履歴                 │   │
│  │                                                             │   │
│  │  Enterprise                                                 │   │
│  │  ├── Organization            # 組織                         │   │
│  │  ├── OrganizationMember      # メンバー                     │   │
│  │  ├── APIKey                  # APIキー                      │   │
│  │  └── AuditLog                # 監査ログ                     │   │
│  │                                                             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Redis (Cache/Session)                                              │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  ├── Session                 # ユーザーセッション           │   │
│  │  ├── RateLimit               # レートリミット               │   │
│  │  └── Cache                   # クエリキャッシュ             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```
</architecture>

---

## 4. Prisma Schema

### 4.1 Core Tables

<prisma_schema>
```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// CORE: ユーザーとウォレット
// ============================================

model User {
  id            String   @id @default(uuid())
  walletAddress String   @unique
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  locks             Lock[]
  unlockRequests    UnlockRequest[]
  transactions      Transaction[]
  dilithiumKeys     DilithiumKey[]
  tokenBalances     TokenBalance[]
  delegationsFrom   Delegation[]      @relation("DelegatorUser")
  delegationsTo     Delegation[]      @relation("DelegateUser")
  votes             Vote[]
  prover            Prover?
  organizationMember OrganizationMember[]

  @@index([walletAddress])
}

// ============================================
// CORE: ロック・アンロック
// ============================================

model Lock {
  id                 String     @id @default(uuid())
  userId             String
  tokenAddress       String
  amount             String     // BigInt as String
  lockDuration       Int        // seconds
  unlockTimestamp    DateTime
  status             LockStatus @default(PENDING)
  dilithiumPublicKey String
  l1TxHash           String?
  l3SmtRoot          String?
  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt

  // Relations
  user           User            @relation(fields: [userId], references: [id])
  unlockRequest  UnlockRequest?
  transactions   Transaction[]

  @@index([userId])
  @@index([status])
  @@index([tokenAddress])
}

model UnlockRequest {
  id                  String              @id @default(uuid())
  lockId              String              @unique
  userId              String
  requestedAt         DateTime            @default(now())
  timelockEnds        DateTime
  status              UnlockRequestStatus @default(TIMELOCK_WAITING)
  dilithiumSignature  String?
  proverSignatures    Json?               // Array of Prover signatures
  l1TxHash            String?
  emergencyBondPaid   Boolean             @default(false)
  emergencyBondAmount String?

  // Relations
  lock               Lock                 @relation(fields: [lockId], references: [id])
  user               User                 @relation(fields: [userId], references: [id])
  proverAssignments  ProverAssignment[]

  @@index([userId])
  @@index([status])
}

model DilithiumKey {
  id           String   @id @default(uuid())
  userId       String
  publicKey    String   @unique
  keyVersion   Int      @default(1)
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  revokedAt    DateTime?

  // Relations
  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([publicKey])
}

model Transaction {
  id          String          @id @default(uuid())
  userId      String
  lockId      String?
  type        TransactionType
  amount      String
  tokenAddress String
  l1TxHash    String?
  l3TxHash    String?
  status      TxStatus        @default(PENDING)
  createdAt   DateTime        @default(now())
  confirmedAt DateTime?

  // Relations
  user User  @relation(fields: [userId], references: [id])
  lock Lock? @relation(fields: [lockId], references: [id])

  @@index([userId])
  @@index([type])
  @@index([createdAt])
}

// ============================================
// TOKEN ECONOMICS: QS/veQS
// ============================================

model TokenBalance {
  id           String   @id @default(uuid())
  userId       String
  tokenType    TokenType
  balance      String   // BigInt as String
  lockedUntil  DateTime?
  updatedAt    DateTime @updatedAt

  // Relations
  user User @relation(fields: [userId], references: [id])

  @@unique([userId, tokenType])
  @@index([userId])
}

model Delegation {
  id           String   @id @default(uuid())
  delegatorId  String
  delegateId   String
  amount       String
  createdAt    DateTime @default(now())
  revokedAt    DateTime?

  // Relations
  delegator User @relation("DelegatorUser", fields: [delegatorId], references: [id])
  delegate  User @relation("DelegateUser", fields: [delegateId], references: [id])

  @@index([delegatorId])
  @@index([delegateId])
}

model Reward {
  id          String     @id @default(uuid())
  userId      String
  rewardType  RewardType
  amount      String
  epochNumber Int
  claimed     Boolean    @default(false)
  claimedAt   DateTime?
  createdAt   DateTime   @default(now())

  @@index([userId])
  @@index([epochNumber])
}

// ============================================
// GOVERNANCE: 提案・投票
// ============================================

model Proposal {
  id           String         @id @default(uuid())
  proposerId   String
  title        String
  description  String
  category     ProposalCategory
  status       ProposalStatus @default(DRAFT)
  votingStarts DateTime
  votingEnds   DateTime
  forVotes     String         @default("0")
  againstVotes String         @default("0")
  abstainVotes String         @default("0")
  quorumReached Boolean       @default(false)
  executedAt   DateTime?
  createdAt    DateTime       @default(now())
  updatedAt    DateTime       @updatedAt

  // Relations
  votes Vote[]

  @@index([status])
  @@index([votingEnds])
}

model Vote {
  id         String    @id @default(uuid())
  proposalId String
  userId     String
  voteType   VoteType
  votePower  String    // veQS amount at snapshot
  createdAt  DateTime  @default(now())

  // Relations
  proposal Proposal @relation(fields: [proposalId], references: [id])
  user     User     @relation(fields: [userId], references: [id])

  @@unique([proposalId, userId])
  @@index([proposalId])
}

model Council {
  id        String   @id @default(uuid())
  address   String   @unique
  name      String
  role      CouncilRole
  addedAt   DateTime @default(now())
  removedAt DateTime?

  @@index([role])
}

// ============================================
// PROVER NETWORK
// ============================================

model Prover {
  id              String       @id @default(uuid())
  userId          String       @unique
  operatorAddress String       @unique
  bondAmount      String
  status          ProverStatus @default(PENDING)
  activatedAt     DateTime?
  lastActiveAt    DateTime?
  uptime          Float        @default(0)
  totalProcessed  Int          @default(0)
  successRate     Float        @default(0)
  slashingCount   Int          @default(0)
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  // Relations
  user        User               @relation(fields: [userId], references: [id])
  application ProverApplication?
  assignments ProverAssignment[]
  challenges  Challenge[]        @relation("ChallengedProver")
  slashings   Slashing[]

  @@index([status])
  @@index([operatorAddress])
}

model ProverApplication {
  id                String                    @id @default(uuid())
  proverId          String                    @unique
  infrastructureInfo Json
  bondTxHash        String?
  status            ProverApplicationStatus   @default(SUBMITTED)
  reviewedAt        DateTime?
  reviewNotes       String?
  createdAt         DateTime                  @default(now())

  // Relations
  prover Prover @relation(fields: [proverId], references: [id])
}

model ProverAssignment {
  id              String   @id @default(uuid())
  unlockRequestId String
  proverId        String
  vrfProof        String   // Chainlink VRF proof
  assignedAt      DateTime @default(now())
  respondedAt     DateTime?
  signature       String?

  // Relations
  unlockRequest UnlockRequest @relation(fields: [unlockRequestId], references: [id])
  prover        Prover        @relation(fields: [proverId], references: [id])

  @@unique([unlockRequestId, proverId])
}

model Challenge {
  id              String          @id @default(uuid())
  challengerId    String          // Observer's address
  challengedProverId String
  unlockRequestId String?
  reason          String
  evidence        Json
  status          ChallengeStatus @default(PENDING)
  resolution      String?
  resolvedAt      DateTime?
  createdAt       DateTime        @default(now())

  // Relations
  challengedProver Prover @relation("ChallengedProver", fields: [challengedProverId], references: [id])

  @@index([status])
  @@index([challengedProverId])
}

model Slashing {
  id          String       @id @default(uuid())
  proverId    String
  challengeId String?
  reason      SlashingReason
  amount      String
  l1TxHash    String?
  createdAt   DateTime     @default(now())

  // Relations
  prover Prover @relation(fields: [proverId], references: [id])

  @@index([proverId])
}

// ============================================
// ENTERPRISE
// ============================================

model Organization {
  id           String   @id @default(uuid())
  name         String
  slug         String   @unique
  tier         OrgTier  @default(BASIC)
  settings     Json?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  members  OrganizationMember[]
  apiKeys  APIKey[]
  auditLog AuditLog[]

  @@index([slug])
}

model OrganizationMember {
  id             String   @id @default(uuid())
  organizationId String
  userId         String
  role           OrgMemberRole @default(MEMBER)
  invitedAt      DateTime @default(now())
  acceptedAt     DateTime?

  // Relations
  organization Organization @relation(fields: [organizationId], references: [id])
  user         User         @relation(fields: [userId], references: [id])

  @@unique([organizationId, userId])
}

model APIKey {
  id             String   @id @default(uuid())
  organizationId String
  name           String
  keyHash        String   @unique // SHA256 hash of the key
  prefix         String   // First 8 chars for identification
  permissions    Json
  rateLimit      Int      @default(1000) // requests per minute
  lastUsedAt     DateTime?
  expiresAt      DateTime?
  createdAt      DateTime @default(now())
  revokedAt      DateTime?

  // Relations
  organization Organization @relation(fields: [organizationId], references: [id])

  @@index([keyHash])
  @@index([organizationId])
}

model AuditLog {
  id             String   @id @default(uuid())
  organizationId String
  actorId        String?  // User ID or "system"
  action         String
  resourceType   String
  resourceId     String?
  details        Json?
  ipAddress      String?
  userAgent      String?
  createdAt      DateTime @default(now())

  // Relations
  organization Organization @relation(fields: [organizationId], references: [id])

  @@index([organizationId])
  @@index([createdAt])
  @@index([action])
}

// ============================================
// ENUMS
// ============================================

enum LockStatus {
  PENDING
  CONFIRMED
  UNLOCKING
  UNLOCKED
  FAILED
}

enum UnlockRequestStatus {
  TIMELOCK_WAITING
  PROVER_PENDING
  PROVER_APPROVED
  EXECUTING
  COMPLETED
  EMERGENCY_PENDING
  EMERGENCY_COMPLETED
  FAILED
}

enum TransactionType {
  LOCK
  UNLOCK
  EMERGENCY_UNLOCK
  STAKE
  UNSTAKE
  DELEGATE
  UNDELEGATE
  CLAIM_REWARD
  SLASH
}

enum TxStatus {
  PENDING
  CONFIRMED
  FAILED
}

enum TokenType {
  QS
  veQS
}

enum RewardType {
  STAKING
  PROVER
  OBSERVER
  GOVERNANCE
}

enum ProposalCategory {
  PARAMETER
  UPGRADE
  TREASURY
  EMERGENCY
}

enum ProposalStatus {
  DRAFT
  ACTIVE
  PASSED
  REJECTED
  EXECUTED
  CANCELLED
}

enum VoteType {
  FOR
  AGAINST
  ABSTAIN
}

enum CouncilRole {
  SECURITY
  TECHNICAL
  COMMUNITY
}

enum ProverStatus {
  PENDING
  ACTIVE
  INACTIVE
  EXITING
  SLASHED
}

enum ProverApplicationStatus {
  SUBMITTED
  UNDER_REVIEW
  APPROVED
  REJECTED
}

enum ChallengeStatus {
  PENDING
  INVESTIGATING
  UPHELD
  DISMISSED
}

enum SlashingReason {
  FAILED_RESPONSE
  INVALID_SIGNATURE
  COLLUSION
  MALICIOUS_BEHAVIOR
}

enum OrgTier {
  BASIC
  PROFESSIONAL
  ENTERPRISE
}

enum OrgMemberRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}
```
</prisma_schema>

---

## 5. Migration Process

### 5.1 初期マイグレーション

<migration>
```bash
# 1. 環境変数設定
echo 'DATABASE_URL="postgresql://user:password@localhost:5432/quantum_shield"' >> .env

# 2. Prisma Client生成
npx prisma generate

# 3. マイグレーション作成・実行
npx prisma migrate dev --name init

# 4. シードデータ投入（開発環境のみ）
npx prisma db seed
```
</migration>

### 5.2 シードデータ

<seed_data>
```typescript
// prisma/seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // テスト用ユーザー
  const testUser = await prisma.user.upsert({
    where: { walletAddress: '0x1234567890123456789012345678901234567890' },
    update: {},
    create: {
      walletAddress: '0x1234567890123456789012345678901234567890',
    },
  });

  // 評議会メンバー
  await prisma.council.createMany({
    data: [
      { address: '0xSecurity...', name: 'Security Council', role: 'SECURITY' },
      { address: '0xTechnical...', name: 'Technical Council', role: 'TECHNICAL' },
      { address: '0xCommunity...', name: 'Community Council', role: 'COMMUNITY' },
    ],
    skipDuplicates: true,
  });

  console.log('Seed data created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```
</seed_data>

---

## 6. Indexes & Performance

### 6.1 インデックス戦略

<indexes>
```sql
-- 追加インデックス（prisma migrateで自動生成されないもの）

-- 複合インデックス
CREATE INDEX idx_locks_user_status ON "Lock" ("userId", "status");
CREATE INDEX idx_transactions_user_type_created ON "Transaction" ("userId", "type", "createdAt" DESC);

-- パーシャルインデックス
CREATE INDEX idx_locks_active ON "Lock" ("userId") WHERE "status" IN ('PENDING', 'CONFIRMED');
CREATE INDEX idx_provers_active ON "Prover" ("operatorAddress") WHERE "status" = 'ACTIVE';

-- フルテキスト検索（提案検索用）
CREATE INDEX idx_proposals_search ON "Proposal" USING gin(to_tsvector('english', "title" || ' ' || "description"));
```
</indexes>

### 6.2 パフォーマンス考慮事項

| テーブル | 想定レコード数 | パーティション | 備考 |
|---------|:-------------:|:-------------:|------|
| Lock | 10M+ | 月別 | 高頻度アクセス |
| Transaction | 100M+ | 月別 | 履歴保持要件あり |
| AuditLog | 1B+ | 日別 | 90日保持 |
| Vote | 1M+ | なし | 提案ごと |

---

## 7. Backup & Recovery

<backup_strategy>
```yaml
# バックアップ戦略

daily_backup:
  type: full
  retention: 30 days
  storage: S3 + Glacier

hourly_backup:
  type: incremental (WAL)
  retention: 7 days
  storage: S3

point_in_time_recovery:
  enabled: true
  retention: 7 days
```
</backup_strategy>

---

## 8. Checklist

<checklist>
  <category name="Schema Design">
    <item>全8システムのテーブル定義完了</item>
    <item>リレーション定義完了</item>
    <item>インデックス設計完了</item>
    <item>Enum定義完了</item>
  </category>

  <category name="Migration">
    <item>prisma generate成功</item>
    <item>prisma migrate dev成功</item>
    <item>シードデータ投入成功</item>
  </category>

  <category name="Performance">
    <item>必要なインデックス追加</item>
    <item>パーティション計画策定</item>
  </category>

  <category name="Security">
    <item>機密データの暗号化計画</item>
    <item>バックアップ戦略策定</item>
  </category>
</checklist>

---

## 9. Output

```markdown
## Database Design Report

### Date: YYYY-MM-DD

### Tables Created
| Category | Tables | Status |
|----------|:------:|:------:|
| Core | 4 | ✅ |
| Token Economics | 3 | ✅ |
| Governance | 3 | ✅ |
| Prover Network | 5 | ✅ |
| Enterprise | 4 | ✅ |
| **Total** | **19** | ✅ |

### Migration Status
- [x] Schema created
- [x] Migration applied
- [x] Seed data inserted

### Next Steps
→ 34_api_impl.md でAPI実装開始
```

---

**END OF PROMPT**
