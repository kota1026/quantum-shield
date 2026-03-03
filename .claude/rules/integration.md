# Integration Rules

## Type Flow Direction (SOURCE OF TRUTH hierarchy)

```
L0: Database Schema (migrations/*.sql)
  -> L1: Backend Rust Types (types.rs + serde rename_all)
  -> L2: Frontend TypeScript Types (lib/api/*/types.ts)
  -> L3: React Components (useQuery results only)
  -> L4: Blockchain Contracts (ABI -> TypeChain -> Frontend)
```

**Rule**: Upper layers define types. Lower layers MUST NOT define their own.
**Forbidden**: Frontend creating types that don't match backend serde output.

## FALLBACK/MOCK Removal Strategy

### What to remove
- `FALLBACK_*` constants in component files (111+ files affected)
- `MOCK_*` constants outside of `mock.ts` and test files
- `DEMO_*` constants in any non-test file

### What to replace with
Every data-fetching component needs 3 states:
```tsx
const { data, isLoading, error } = useXxxQuery();

if (isLoading) return <Skeleton />;
if (error) return <ErrorState error={error} />;
if (!data || data.length === 0) return <EmptyState />;
return <ActualContent data={data} />;
```

### Verification
```bash
# Must return 0 results after cleanup
grep -rn "FALLBACK_" src/ --include="*.ts" --include="*.tsx" | wc -l
grep -rn "MOCK_" src/ --include="*.ts" --include="*.tsx" | grep -v mock.ts | grep -v .test. | grep -v .spec. | wc -l
```

## API Contract Rules

### snake_case / camelCase
- Backend: ALL enums use `#[serde(rename_all = "snake_case")]`
- API responses: snake_case JSON
- Frontend API client: transforms snake_case -> camelCase
- Frontend types: camelCase

### API Client Pattern
```typescript
// lib/api/{app}/client.ts
import axios from 'axios';
import { transformKeys } from '@/lib/utils/caseTransform';

const api = axios.create({ baseURL: '/v1' });
api.interceptors.response.use(res => ({
  ...res,
  data: transformKeys(res.data, 'camelCase')
}));
```

## Integration Testing Pattern

### Full Flow Test (FE -> BE -> DB -> L1)
1. Start Docker services (postgres, redis, l3-node)
2. Run backend API server
3. Execute API call from frontend
4. Verify DB record created
5. Verify L1 transaction (Sepolia or Anvil fork)

### E2E with Playwright + Anvil
```typescript
// Use Wagmi mock connector for test wallet
const connectors = isTestEnv
  ? [mockConnector({ accounts: [TEST_ACCOUNT] })]
  : [injected(), walletConnect({ projectId })];
```

## 9 Core Sequences (from SEQUENCES.md)

| # | Sequence | Layers |
|---|----------|--------|
| 1 | Consumer Lock | FE->BE->DB->L1 |
| 2 | Normal Unlock | FE->BE->DB->L1 (24h timelock) |
| 3 | Emergency Unlock | FE->BE->DB->L1 (7d + bond) |
| 4 | Prover Registration | FE->BE->DB->L1 (stake) |
| 5 | Observer Challenge | FE->BE->DB->L1->VRF |
| 6 | Slashing | BE->DB->L1 (quadratic) |
| 7 | Governance Proposal | FE->BE->DB->L3 |
| 8 | Emergency Pause | Admin->BE->L1 |
| 9 | Token Hub (veQS) | FE->BE->DB->L3 |
