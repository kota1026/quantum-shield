# Testing Rules

## Backend Tests (Rust)

```bash
cd src/api/api
cargo test                              # All tests
cargo test --test integration_tests     # Integration only
SQLX_OFFLINE=true cargo test            # Skip DB compile-time check
```

### Test Requirements
- Every new endpoint: at least 1 success + 1 error test
- Use `sqlx::test` macro for DB-dependent tests
- No `todo!()` or `unimplemented!()` in test code

## Frontend Tests

### E2E (Playwright)
```bash
cd src/frontend/web
npx playwright test                           # All E2E
npx playwright test e2e/{app}/               # App-specific
npx playwright test --headed                  # With browser
```

### Test Quality Requirements
- **Forbidden**: Tests that only check HTTP 200 (smoke tests are insufficient)
- Each flow must verify:
  1. Data displayed correctly (not just page loads)
  2. User actions produce expected results
  3. Error states handled
  4. Empty states handled

### Integration Test Pattern
```typescript
test('consumer lock creates DB record', async ({ page }) => {
  // 1. Navigate to lock page
  await page.goto('/ja/consumer/lock');

  // 2. Fill form and submit
  await page.fill('[data-testid="amount"]', '1.0');
  await page.click('[data-testid="lock-button"]');

  // 3. Verify success (not just page load)
  await expect(page.locator('[data-testid="lock-success"]')).toBeVisible();

  // 4. Verify DB record (via API)
  const response = await page.request.get('/v1/locks');
  const locks = await response.json();
  expect(locks.length).toBeGreaterThan(0);
});
```

## Stub Detection

```bash
# Backend: find any remaining stubs
grep -rn "todo!\|unimplemented!\|Ok(Json(json" src/api/api/src/routes/ | grep -v test

# Frontend: find remaining mock data
grep -rn "MOCK_\|FALLBACK_\|DEMO_" src/frontend/web/src/ --include="*.ts" --include="*.tsx" | grep -v mock.ts | grep -v .test. | grep -v .spec. | grep -v .stories.
```

## Quality Gates (per Phase)

| Check | Command | Pass Criteria |
|-------|---------|---------------|
| TypeScript | `npx tsc --noEmit` | 0 errors |
| MOCK residue | stub detection script | 0 results |
| Rust compile | `cargo build -p quantum-shield-api` | success |
| Rust tests | `cargo test` | all pass |
| E2E tests | `npx playwright test` | all pass |
| API health | `curl localhost:8080/v1/health` | {"status":"healthy"} |
| DB records | `psql -c "SELECT count(*) FROM locks"` | > 0 (after integration) |

## Moonwell Lesson

Unit tests passing != system works. Always verify:
1. Data actually persisted to DB (not just API returned 200)
2. L1 transaction actually submitted (not just mock)
3. Frontend displays real data (not FALLBACK)
