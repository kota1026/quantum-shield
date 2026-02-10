# Frontend-Backend Integration Plan

> **Version**: 1.0
> **Updated**: 2026-01-31
> **Status**: Planning

---

## Executive Summary

Quantum Shieldの11のフロントエンドアプリとRustバックエンドの統合計画。現在すべてのアプリはハードコードされたモックデータを使用しており、実際のAPIには接続されていない。

## Current State Overview

### Frontend Apps

| # | App | Pages | Components | Backend Routes | Integration Status |
|:-:|-----|:-----:|:----------:|:--------------:|:------------------:|
| 1 | **Consumer** | 28 | 73 | lock, unlock, user | ⬜ Not Started |
| 2 | **Prover Portal** | 13 | 24 | prover, auth | ⬜ Not Started |
| 3 | **Observer** | 11 | 31 | observer, challenge | ⬜ Not Started |
| 4 | **Explorer** | 14 | 22 | explorer, status | ⬜ Not Started |
| 5 | **Governance** | 11 | 19 | governance, council | ⬜ Not Started |
| 6 | **Token Hub** | 18 | 37 | token_hub | ⬜ Not Started |
| 7 | **QS Hub** | 18 | 18 | governance, treasury | ⬜ Not Started |
| 8 | **Enterprise** | 18 | 104 | enterprise | ⬜ Not Started |
| 9 | **QS Admin** | 48 | 47 | admin (65 endpoints) | 🟡 In Progress |
| 10 | **Admin (Legacy)** | 70 | 85 | admin | ⚠️ Deprecated |
| 11 | **Ecosystem** | 2 | 4 | - | ⬜ Static Only |

**Total**: 251 pages, 464 components

### Backend API Structure

```
services/api/src/routes/
├── admin.rs        # 65 endpoints (QS Admin)
├── auth.rs         # Authentication
├── challenge.rs    # Challenge management
├── council.rs      # Governance council
├── enterprise.rs   # Enterprise features
├── explorer.rs     # Public explorer
├── fees.rs         # Fee calculations
├── governance.rs   # Governance proposals
├── health.rs       # Health checks
├── insurance.rs    # Insurance features
├── lock.rs         # Lock operations
├── observer.rs     # Observer endpoints
├── prover.rs       # Prover endpoints
├── status.rs       # System status
├── token_hub.rs    # Token Hub features
├── treasury.rs     # Treasury management
├── unlock.rs       # Unlock operations
└── user.rs         # User management
```

---

## Integration Architecture

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Data Fetching** | React Query (@tanstack/react-query) | Caching, auto-refetch, optimistic updates |
| **State Management** | Zustand | Auth state, global app state |
| **API Client** | Custom fetch wrapper | Type-safe API calls |
| **Authentication** | JWT + Wallet Signature | Secure authentication |
| **Mock Fallback** | Conditional loading | Development without backend |

### File Structure

```
apps/web/src/
├── lib/api/
│   ├── index.ts              # Re-exports all API modules
│   ├── client.ts             # Base API client
│   ├── types.ts              # Shared types
│   ├── admin/                # QS Admin API
│   │   ├── index.ts
│   │   ├── client.ts
│   │   ├── types.ts
│   │   └── mock.ts
│   ├── consumer/             # Consumer API
│   │   ├── index.ts
│   │   ├── lock.ts
│   │   ├── unlock.ts
│   │   ├── types.ts
│   │   └── mock.ts
│   ├── prover/               # Prover API
│   ├── observer/             # Observer API
│   ├── explorer/             # Explorer API
│   ├── governance/           # Governance API
│   ├── token-hub/            # Token Hub API
│   ├── qs-hub/               # QS Hub API
│   └── enterprise/           # Enterprise API
├── hooks/
│   ├── admin/                # QS Admin hooks
│   ├── consumer/             # Consumer hooks
│   ├── prover/               # Prover hooks
│   ├── observer/             # Observer hooks
│   ├── explorer/             # Explorer hooks
│   ├── governance/           # Governance hooks
│   ├── token-hub/            # Token Hub hooks
│   ├── qs-hub/               # QS Hub hooks
│   └── enterprise/           # Enterprise hooks
└── stores/
    ├── authStore.ts          # User authentication
    ├── adminAuthStore.ts     # Admin authentication
    └── walletStore.ts        # Wallet connection
```

---

## Integration Phases

### Phase 1: Foundation (Week 1)

**目標**: 共通インフラとQS Adminの統合

| Task | Status | Files |
|------|:------:|-------|
| Base API Client | ✅ | `lib/api/admin/client.ts` |
| TypeScript Types | ✅ | `lib/api/admin/types.ts` |
| Mock Data | ✅ | `lib/api/admin/mock.ts` |
| Auth Store | ✅ | `stores/adminAuthStore.ts` |
| Dashboard Hooks | ✅ | `hooks/admin/useDashboard.ts` |
| Dashboard Integration | ⬜ | `components/qs-admin/Dashboard/` |
| Other QS Admin Screens | ⬜ | 47 components |

### Phase 2: Consumer App (Week 2-3)

**目標**: ユーザー向けコア機能の統合

| Task | Status | Files |
|------|:------:|-------|
| Consumer API Types | ⬜ | `lib/api/consumer/types.ts` |
| Lock API | ⬜ | `lib/api/consumer/lock.ts` |
| Unlock API | ⬜ | `lib/api/consumer/unlock.ts` |
| User API | ⬜ | `lib/api/consumer/user.ts` |
| Consumer Hooks | ⬜ | `hooks/consumer/*.ts` |
| Dashboard Integration | ⬜ | 28 pages |

**Endpoints**:
- `POST /api/lock` - Create lock
- `GET /api/lock/status/:id` - Lock status
- `POST /api/unlock/request` - Request unlock
- `GET /api/unlock/status/:id` - Unlock status
- `GET /api/user/locks` - User's locks
- `GET /api/user/unlocks` - User's unlocks
- `GET /api/user/balance` - User balance

### Phase 3: Prover & Observer (Week 3-4)

**目標**: Prover/Observer管理機能の統合

| Task | Status | Files |
|------|:------:|-------|
| Prover API | ⬜ | `lib/api/prover/*.ts` |
| Observer API | ⬜ | `lib/api/observer/*.ts` |
| Prover Hooks | ⬜ | `hooks/prover/*.ts` |
| Observer Hooks | ⬜ | `hooks/observer/*.ts` |
| Prover Pages | ⬜ | 13 pages |
| Observer Pages | ⬜ | 11 pages |

### Phase 4: Governance & Token Hub (Week 4-5)

**目標**: ガバナンスとトークン機能の統合

| Task | Status | Files |
|------|:------:|-------|
| Governance API | ⬜ | `lib/api/governance/*.ts` |
| Token Hub API | ⬜ | `lib/api/token-hub/*.ts` |
| QS Hub API | ⬜ | `lib/api/qs-hub/*.ts` |
| Governance Hooks | ⬜ | `hooks/governance/*.ts` |
| Token Hub Hooks | ⬜ | `hooks/token-hub/*.ts` |
| QS Hub Hooks | ⬜ | `hooks/qs-hub/*.ts` |
| Pages | ⬜ | 47 pages total |

### Phase 5: Explorer & Enterprise (Week 5-6)

**目標**: 公開Explorer & エンタープライズ機能

| Task | Status | Files |
|------|:------:|-------|
| Explorer API | ⬜ | `lib/api/explorer/*.ts` |
| Enterprise API | ⬜ | `lib/api/enterprise/*.ts` |
| Explorer Hooks | ⬜ | `hooks/explorer/*.ts` |
| Enterprise Hooks | ⬜ | `hooks/enterprise/*.ts` |
| Explorer Pages | ⬜ | 14 pages |
| Enterprise Pages | ⬜ | 18 pages |

---

## Endpoint Mapping by App

### Consumer App

| Feature | Frontend | Backend Endpoint | Method |
|---------|----------|------------------|--------|
| Create Lock | Lock page | `/api/lock` | POST |
| Lock Status | Processing page | `/api/lock/status/:id` | GET |
| Request Unlock | Unlock page | `/api/unlock/request` | POST |
| Unlock Status | Processing page | `/api/unlock/status/:id` | GET |
| User Locks | Dashboard | `/api/user/locks` | GET |
| User Balance | Dashboard | `/api/user/balance` | GET |
| Transaction History | History page | `/api/user/transactions` | GET |

### Prover Portal

| Feature | Frontend | Backend Endpoint | Method |
|---------|----------|------------------|--------|
| Apply as Prover | Application | `/api/prover/apply` | POST |
| Application Status | Status page | `/api/prover/application/:id` | GET |
| Prover Dashboard | Dashboard | `/api/prover/me` | GET |
| Prover Metrics | Metrics page | `/api/prover/me/metrics` | GET |
| Signature Requests | Dashboard | `/api/prover/requests` | GET |
| Submit Signature | Request detail | `/api/prover/requests/:id/sign` | POST |

### Observer

| Feature | Frontend | Backend Endpoint | Method |
|---------|----------|------------------|--------|
| Register | Registration | `/api/observer/register` | POST |
| Observer Dashboard | Dashboard | `/api/observer/me` | GET |
| Pending Unlocks | Pending list | `/api/observer/pending-unlocks` | GET |
| Challenge | Challenge page | `/api/observer/challenge` | POST |
| Challenge History | History page | `/api/observer/challenges` | GET |
| Earnings | Earnings page | `/api/observer/earnings` | GET |

### Explorer

| Feature | Frontend | Backend Endpoint | Method |
|---------|----------|------------------|--------|
| Overview Stats | Landing | `/api/explorer/stats` | GET |
| Recent Locks | Locks page | `/api/explorer/locks` | GET |
| Recent Unlocks | Unlocks page | `/api/explorer/unlocks` | GET |
| Provers | Provers page | `/api/explorer/provers` | GET |
| Challenges | Challenges page | `/api/explorer/challenges` | GET |
| Analytics | Analytics page | `/api/explorer/analytics` | GET |
| Search | Search | `/api/explorer/search` | GET |

### Governance

| Feature | Frontend | Backend Endpoint | Method |
|---------|----------|------------------|--------|
| Proposals List | Proposals | `/api/governance/proposals` | GET |
| Proposal Detail | Detail page | `/api/governance/proposals/:id` | GET |
| Cast Vote | Voting page | `/api/governance/proposals/:id/vote` | POST |
| Council Members | Council page | `/api/governance/council` | GET |
| Voting Power | Dashboard | `/api/governance/voting-power` | GET |

### Token Hub / QS Hub

| Feature | Frontend | Backend Endpoint | Method |
|---------|----------|------------------|--------|
| Token Balance | Dashboard | `/api/token/balance` | GET |
| Stake QS | Stake page | `/api/token/stake` | POST |
| Unstake QS | Unstake page | `/api/token/unstake` | POST |
| Staking Rewards | Rewards page | `/api/token/rewards` | GET |
| Claim Rewards | Rewards page | `/api/token/claim` | POST |
| Delegate | Delegate page | `/api/token/delegate` | POST |

### Enterprise

| Feature | Frontend | Backend Endpoint | Method |
|---------|----------|------------------|--------|
| Account Setup | Onboarding | `/api/enterprise/setup` | POST |
| Dashboard | Dashboard | `/api/enterprise/dashboard` | GET |
| API Keys | Settings | `/api/enterprise/api-keys` | GET/POST |
| Usage Stats | Analytics | `/api/enterprise/usage` | GET |
| Contracts | Contracts page | `/api/enterprise/contracts` | GET |
| Audit Log | Audit page | `/api/enterprise/audit` | GET |

---

## Implementation Guidelines

### 1. API Client Pattern

```typescript
// lib/api/{app}/client.ts
import { BaseApiClient } from '../client';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

class AppApiClient extends BaseApiClient {
  constructor() {
    super(API_BASE);
  }

  // App-specific methods
}

export const appApi = new AppApiClient();
```

### 2. React Query Hook Pattern

```typescript
// hooks/{app}/use{Feature}.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const featureKeys = {
  all: ['app', 'feature'] as const,
  list: (filters) => [...featureKeys.all, 'list', filters] as const,
  detail: (id) => [...featureKeys.all, 'detail', id] as const,
};

export function useFeatureList(filters) {
  return useQuery({
    queryKey: featureKeys.list(filters),
    queryFn: () => api.getFeatureList(filters),
    staleTime: 30_000,
  });
}
```

### 3. Component Integration Pattern

```typescript
// Before: Hardcoded data
const DEMO_DATA = [...];
function Component() {
  return <div>{DEMO_DATA.map(...)}</div>;
}

// After: API integration
function Component() {
  const { data, isLoading, error } = useFeatureList();

  if (isLoading) return <Skeleton />;
  if (error) return <Error error={error} />;

  return <div>{data.map(...)}</div>;
}
```

### 4. Mock Fallback Pattern

```typescript
// lib/api/{app}/mock.ts
export const MOCK_DATA = {...};

export function getMockResponse(endpoint: string) {
  const responses = {
    '/api/feature': MOCK_DATA,
  };
  return responses[endpoint];
}
```

---

## Verification Checklist

Each app integration must pass:

- [ ] **Types**: All API response types defined
- [ ] **Client**: API client functions implemented
- [ ] **Hooks**: React Query hooks created
- [ ] **Mock**: Mock data for development
- [ ] **Components**: All components using hooks
- [ ] **Loading States**: Loading skeletons implemented
- [ ] **Error States**: Error handling implemented
- [ ] **E2E Tests**: Tests updated for API calls

---

## Environment Configuration

```bash
# .env.local (development)
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_ENABLE_MOCK=true

# .env.production
NEXT_PUBLIC_API_URL=https://api.quantumshield.io
NEXT_PUBLIC_ENABLE_MOCK=false
```

---

## Related Documents

- [Integration Progress Tracker](./INTEGRATION_PROGRESS.md)
- [API Specification](../specs/API_SPECIFICATION.yaml)
- [Database Design](../specs/DATABASE_DESIGN.md)
- [Data Model](../specs/DATA_MODEL.md)

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-01-31 | 1.0 | Initial document |
